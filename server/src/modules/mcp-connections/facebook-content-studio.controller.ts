import { Body, Controller, Get, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';
import { McpProviderRegistry } from '@server/root/modules/mcp-gateway/providers/mcp-provider.registry';
import type { McpProviderAdapter, McpToolArguments } from '@server/root/modules/mcp-gateway/providers/mcp-provider.types';

@Controller('mcp-connections/facebook')
export class FacebookContentStudioController {
  private readonly facebook: McpProviderAdapter;
  constructor(
    private readonly auth: AuthService,
    private readonly connections: McpConnectionsService,
    providers: McpProviderRegistry,
  ) {
    this.facebook = providers.get('facebook');
  }

  @Get('pages')
  async pages(@Req() request: Request) {
    return this.call(request, 'facebook_list_pages', {});
  }

  @Get('posts')
  async posts(@Req() request: Request, @Query('status') status?: string) {
    return this.call(request, 'facebook_list_page_posts', {
      ...(status ? { status } : {}),
      limit: 50,
    });
  }

  @Post('drafts')
  async createDraft(@Req() request: Request, @Body() body: Record<string, unknown>) {
    const args: McpToolArguments = {
      pageId: body.pageId,
      message: body.message,
      mediaType: body.mediaType,
      ...(typeof body.mediaUrl === 'string' && body.mediaUrl ? { mediaUrl: body.mediaUrl } : {}),
    };
    return this.call(request, 'facebook_create_page_post_draft', args);
  }

  @Post('approve')
  async approve(@Req() request: Request, @Body() body: Record<string, unknown>) {
    if (typeof body.draftId !== 'string' || !body.draftId) {
      return { error: { code: 'FACEBOOK_DRAFT_ID_REQUIRED', message: 'draftId is required' } };
    }
    return this.call(request, 'facebook_approve_page_post_draft', {
      draftId: body.draftId,
      ...(typeof body.scheduledAt === 'string' && body.scheduledAt ? { scheduledAt: body.scheduledAt } : {}),
    });
  }

  private async call(request: Request, tool: string, args: McpToolArguments) {
    const user = await this.auth.requireUser(request);
    const credential = await this.connections.getProviderCredential(user.id, 'facebook');
    const result = await this.facebook.callTool(credential, tool, args, { userId: user.id });
    if (result.isError) {
      throw new UnauthorizedException({ code: 'FACEBOOK_TOOL_FAILED', message: 'Facebook operation failed' });
    }
    return result.structuredContent ?? { content: result.content };
  }
}
