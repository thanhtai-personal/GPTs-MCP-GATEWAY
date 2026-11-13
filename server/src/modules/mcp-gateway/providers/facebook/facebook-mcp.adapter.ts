import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { FacebookGraphApiClient } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-graph-api.client';
import { FACEBOOK_MCP_TOOLS } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-mcp.tools';
import type { JsonObject, McpProviderAdapter, McpProviderCredential, McpProviderExecutionContext, McpToolArguments, McpToolCallResult, McpToolDefinition } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';
import { FacebookPagePostRepository, type FacebookPagePostRow } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-post.repository';
import { FacebookPagePublishingService } from '@server/root/modules/mcp-gateway/providers/facebook/facebook-page-publishing.service';

@Injectable()
export class FacebookMcpAdapter implements McpProviderAdapter {
  readonly id = 'facebook' as const;
  readonly displayName = 'Facebook';
  readonly credential: McpProviderAdapter['credential'];
  constructor(private readonly api: FacebookGraphApiClient, private readonly posts: FacebookPagePostRepository, private readonly publishing: FacebookPagePublishingService, config: AppConfigService) {
    this.credential = { kind: 'oauth', label: 'Meta OAuth',
      connectLabel: { en: 'Connect Facebook', vi: 'Kết nối Facebook' },
      configured: Boolean(config.metaAppId && config.metaAppSecret && config.metaFacebookLoginConfigId),
      note: { en: 'Official Meta Login for Business and Graph API. Profile sharing remains user-confirmed; Page publishing follows the approval-based workflow.',
        vi: 'Dùng Meta Login for Business và Graph API chính thức. Chia sẻ profile cần người dùng xác nhận; đăng Page theo quy trình duyệt.' } };
  }
  async testConnection(credential: McpProviderCredential): Promise<void> {
    await this.api.get(this.accessToken(credential), '/me', { fields: 'id,name' });
  }
  async listTools(credential: McpProviderCredential): Promise<McpToolDefinition[]> {
    this.accessToken(credential); return FACEBOOK_MCP_TOOLS;
  }
  async callTool(credential: McpProviderCredential, toolName: string, args: McpToolArguments, context?: McpProviderExecutionContext): Promise<McpToolCallResult> {
    const token = this.accessToken(credential);
    let result: JsonObject;
    if (toolName === 'facebook_get_identity') {
      result = await this.api.get(token, '/me', { fields: 'id,name' });
    } else if (toolName === 'facebook_list_pages') {
      const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(100, Math.trunc(args.limit))) : 25;
      const response = await this.api.get(token, '/me/accounts', { fields: 'id,name,category,tasks', limit: String(limit) });
      const rows = Array.isArray(response.data) ? response.data : [];
      result = { data: rows.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
        .map((item) => ({ id: typeof item.id === 'string' ? item.id : '', name: typeof item.name === 'string' ? item.name : '',
          ...(typeof item.category === 'string' ? { category: item.category } : {}),
          tasks: Array.isArray(item.tasks) ? item.tasks.filter((task): task is string => typeof task === 'string') : [] }))
        .filter((page) => page.id.length > 0 && page.name.length > 0), paging: null };
    } else if (toolName === 'facebook_create_page_post_draft') {
      const userId = this.requireUserId(context);
      const pageId = this.requireString(args.pageId, 'pageId');
      const message = this.requireString(args.message, 'message').trim();
      const mediaType = args.mediaType;
      if (message.length > 5000) throw new BadRequestException({ code: 'FACEBOOK_MESSAGE_TOO_LONG', message: 'Facebook Page message must be 5,000 characters or fewer' });
      if (mediaType !== 'text' && mediaType !== 'image' && mediaType !== 'video') throw new BadRequestException({ code: 'FACEBOOK_MEDIA_TYPE_INVALID', message: 'mediaType must be text, image, or video' });
      const mediaUrl = typeof args.mediaUrl === 'string' ? args.mediaUrl : undefined;
      if ((mediaType === 'text' && mediaUrl) || (mediaType !== 'text' && !mediaUrl)) throw new BadRequestException({ code: 'FACEBOOK_MEDIA_URL_INVALID', message: 'Text posts do not use mediaUrl; image and video posts require it' });
      this.publishing.validateMediaUrl(mediaType, mediaUrl);
      await this.publishing.validatePageAccess(token, pageId);
      result = this.toPublicPost(await this.posts.createDraft({ userId, pageId, message, mediaType, ...(mediaUrl ? { mediaUrl } : {}) }));
    } else if (toolName === 'facebook_approve_page_post_draft') {
      const userId = this.requireUserId(context);
      const draftId = this.requireString(args.draftId, 'draftId');
      result = this.toPublicPost(await this.posts.approveDraft(userId, draftId, this.resolveScheduledAt(args.scheduledAt)));
    } else if (toolName === 'facebook_list_page_posts') {
      const userId = this.requireUserId(context);
      const rawStatus = typeof args.status === 'string' ? args.status : undefined;
      const allowedStatuses = ['draft', 'scheduled', 'publishing', 'published', 'failed', 'needs_review'] as const;
      if (rawStatus && !allowedStatuses.includes(rawStatus as typeof allowedStatuses[number])) throw new BadRequestException({ code: 'FACEBOOK_POST_STATUS_INVALID', message: 'Unsupported Facebook Page post status' });
      const status = rawStatus as typeof allowedStatuses[number] | undefined;
      const limit = typeof args.limit === 'number' ? Math.max(1, Math.min(100, Math.trunc(args.limit))) : 20;
      const rows = await this.posts.listPosts(userId, { status, limit });
      result = { posts: rows.map((row) => this.toPublicPost(row)) };
    } else {
      throw new NotFoundException({ code: 'MCP_TOOL_NOT_FOUND', message: 'Facebook tool not found: ' + toolName });
    }
    return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: { result } };
  }
  private toPublicPost(row: FacebookPagePostRow): JsonObject {
    return {
      id: row.id,
      pageId: row.page_id,
      mediaType: row.media_type,
      message: row.message,
      status: row.status,
      scheduledAt: row.scheduled_at,
      approvedAt: row.approved_at,
      externalPostId: row.external_post_id,
      lastErrorCode: row.last_error_code,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private requireUserId(context?: McpProviderExecutionContext): string {
    if (!context?.userId) throw new UnauthorizedException({ code: 'MCP_USER_CONTEXT_REQUIRED', message: 'Facebook publishing requires an authenticated Gateway user' });
    return context.userId;
  }
  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException({ code: 'FACEBOOK_ARGUMENT_INVALID', message: field + ' is required' });
    return value;
  }
  private resolveScheduledAt(value: unknown): string {
    const now = Date.now();
    if (value === undefined) return new Date(now).toISOString();
    const hasTimezone = typeof value === 'string' && /(?:Z|[+-]\\d{2}:\\d{2})$/u.test(value);
    const timestamp = hasTimezone && typeof value === 'string' ? Date.parse(value) : Number.NaN;
    if (!Number.isFinite(timestamp) || timestamp < now + 120_000 || timestamp > now + 75 * 24 * 60 * 60 * 1000) throw new BadRequestException({ code: 'FACEBOOK_SCHEDULE_TIME_INVALID', message: 'scheduledAt must be between 2 minutes and 75 days in the future' });
    return new Date(timestamp).toISOString();
  }
  private accessToken(credential: McpProviderCredential): string {
    if (credential.kind !== 'oauth') throw new UnauthorizedException({ code: 'MCP_INVALID_CREDENTIAL', message: 'Facebook requires an OAuth credential' });
    return credential.accessToken;
  }
}
