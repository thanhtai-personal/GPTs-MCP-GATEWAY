import type {
  OneTimeToken,
  OpenId,
  TrialStatus,
} from "@/modules/open-id/domain/open-id.types";
import { gatewayRequest } from "@/shared/api/gateway-api";

export function getTrialStatus(accessToken: string) {
  return gatewayRequest<TrialStatus>("/open-ids/trial", accessToken);
}

export function claimTrial(accessToken: string) {
  return gatewayRequest<OneTimeToken>("/open-ids/trial", accessToken, {
    method: "POST",
  });
}

export function listOpenIds(accessToken: string) {
  return gatewayRequest<OpenId[]>("/open-ids", accessToken);
}

export function createOpenId(accessToken: string) {
  return gatewayRequest<OpenId>("/open-ids", accessToken, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function createGatewayToken(accessToken: string, openIdId: string) {
  return gatewayRequest<OneTimeToken & { id: string }>(
    `/open-ids/${openIdId}/tokens`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}
