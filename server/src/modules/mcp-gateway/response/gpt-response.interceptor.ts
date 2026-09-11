import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import type { GatewayRequest } from '@server/root/modules/mcp-gateway/gateway-request.types';
import { SKIP_GPT_RESPONSE_ENVELOPE } from '@server/root/modules/mcp-gateway/response/gpt-response.metadata';
import { GptResponseService } from '@server/root/modules/mcp-gateway/response/gpt-response.service';

@Injectable()
export class GptResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly responses: GptResponseService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_GPT_RESPONSE_ENVELOPE,
      [context.getHandler(), context.getClass()],
    );
    if (skip) return next.handle();

    const request = context.switchToHttp().getRequest<GatewayRequest>();
    const principal = request.gatewayPrincipal;
    if (!principal) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Gateway principal is missing',
      });
    }

    return next.handle().pipe(
      mergeMap((value) => this.responses.wrap(principal, value)),
    );
  }
}
