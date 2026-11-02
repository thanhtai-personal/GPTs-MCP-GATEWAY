import { gatewayRequest } from "@/shared/api/gateway-api";

export type AuthorizationConsentDetails = {
  authorization_id: string;
  redirect_uri: string;
  client: { id: string; name: string; uri?: string; logo_uri?: string };
  scope: string;
  user: { id: string; email: string };
};

export type AuthorizationDetailsResponse =
  | AuthorizationConsentDetails
  | { redirect_url: string };

const base = (authorizationId: string) =>
  `/account/oauth/authorizations/${encodeURIComponent(authorizationId)}`;

export function getAuthorizationDetails(accessToken: string, authorizationId: string) {
  return gatewayRequest<AuthorizationDetailsResponse>(base(authorizationId), accessToken);
}

export function decideAuthorization(
  accessToken: string,
  authorizationId: string,
  decision: "approve" | "deny",
) {
  return gatewayRequest<{ redirect_url?: string }>(
    `${base(authorizationId)}/${decision}`,
    accessToken,
    { method: "POST" },
  );
}
