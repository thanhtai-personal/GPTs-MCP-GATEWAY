import type { Request } from 'express';
import type { GatewayPrincipal } from '@server/root/modules/open-id/gateway-credential.service';

export type GatewayRequest = Request & {
  gatewayPrincipal?: GatewayPrincipal;
};
