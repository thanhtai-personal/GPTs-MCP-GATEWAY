import { gatewayRequest } from "@/shared/api/gateway-api";

export type FacebookPage = { id: string; name: string; category?: string; tasks: string[] };
export type FacebookPostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "needs_review";
export type FacebookPagePost = {
  id: string; pageId: string; mediaType: "text" | "image" | "video"; message: string;
  status: FacebookPostStatus; scheduledAt: string | null; approvedAt: string | null;
  externalPostId: string | null; lastErrorCode: string | null; publishedAt: string | null;
  createdAt: string; updatedAt: string;
};

export function listFacebookPages(token: string) {
  return gatewayRequest<{ data: FacebookPage[] }>("/mcp-connections/facebook/pages", token);
}
export function listFacebookPosts(token: string, status?: string) {
  return gatewayRequest<{ posts: FacebookPagePost[] }>(`/mcp-connections/facebook/posts${status ? `?status=${encodeURIComponent(status)}` : ""}`, token);
}
export function createFacebookDraft(token: string, input: { pageId: string; message: string; mediaType: "text" | "image" | "video"; mediaUrl?: string }) {
  return gatewayRequest<FacebookPagePost>("/mcp-connections/facebook/drafts", token, { method: "POST", body: JSON.stringify(input) });
}
export function approveFacebookDraft(token: string, draftId: string, scheduledAt?: string) {
  return gatewayRequest<FacebookPagePost>("/mcp-connections/facebook/approve", token, { method: "POST", body: JSON.stringify({ draftId, ...(scheduledAt ? { scheduledAt } : {}) }) });
}
