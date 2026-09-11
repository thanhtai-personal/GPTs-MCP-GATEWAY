import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GatewayCredentialService } from '@server/root/modules/open-id/gateway-credential.service';
import type { GatewayRequest } from '@server/root/modules/mcp-gateway/gateway-request.types';

@Injectable()
export class GatewayAccessGuard implements CanActivate {
  constructor(private readonly credentials: GatewayCredentialService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GatewayRequest>();
    const token = this.readBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing Gateway bearer token',
      });
    }
    request.gatewayPrincipal = await this.credentials.authenticate(token);
    return true;
  }

  private readBearerToken(request: GatewayRequest): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
    return token.trim() || null;
  }
}
