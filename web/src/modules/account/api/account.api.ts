import type { AccountProfile } from "@/modules/auth/domain/auth.types";
import { gatewayRequest } from "@/shared/api/gateway-api";

export function getAccount(accessToken: string) {
  return gatewayRequest<AccountProfile>("/account/me", accessToken);
}
