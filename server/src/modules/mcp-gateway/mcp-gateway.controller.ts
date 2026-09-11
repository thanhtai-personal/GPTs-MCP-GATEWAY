import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CallMcpToolDto } from '@server/root/modules/mcp-gateway/dto/call-mcp-tool.dto';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import type { GatewayRequest } from '@server/root/modules/mcp-gateway/gateway-request.types';
import { McpGatewayService } from '@server/root/modules/mcp-gateway/mcp-gateway.service';

@Controller('gpt')
@UseGuards(GatewayAccessGuard)
export class McpGatewayController {
  constructor(private readonly gateway: McpGatewayService) {}

  @Get('profile')
  profile(@Req() request: GatewayRequest) {
    return this.gateway.profile(this.principal(request));
  }

  @Get('mcp/services')
  listServices(@Req() request: GatewayRequest) {
    return this.gateway.listServices(this.principal(request));
  }

  @Get('mcp/:service/tools')
  listTools(
    @Req() request: GatewayRequest,
    @Param('service') service: string,
  ) {
    return this.gateway.listTools(this.principal(request), service);
  }

  @Post('mcp/:service/tools/:toolName/call')
  callTool(
    @Req() request: GatewayRequest,
    @Param('service') service: string,
    @Param('toolName') toolName: string,
    @Body() dto: CallMcpToolDto,
  ) {
    return this.gateway.callTool(
      this.principal(request),
      service,
      toolName,
      dto.arguments,
    );
  }

  private principal(request: GatewayRequest) {
    if (!request.gatewayPrincipal) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Gateway principal is missing',
      });
    }
    return request.gatewayPrincipal;
  }
}
