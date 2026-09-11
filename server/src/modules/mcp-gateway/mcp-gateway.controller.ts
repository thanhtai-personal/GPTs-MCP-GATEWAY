import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CallMcpToolDto } from '@server/root/modules/mcp-gateway/dto/call-mcp-tool.dto';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import { resolveMcpToolArguments } from '@server/root/modules/mcp-gateway/mcp-tool-arguments';
import type { GatewayRequest } from '@server/root/modules/mcp-gateway/gateway-request.types';
import { McpGatewayService } from '@server/root/modules/mcp-gateway/mcp-gateway.service';
import { GptResponseInterceptor } from '@server/root/modules/mcp-gateway/response/gpt-response.interceptor';
import { SkipGptResponseEnvelope } from '@server/root/modules/mcp-gateway/response/gpt-response.metadata';
import { GptResponseService } from '@server/root/modules/mcp-gateway/response/gpt-response.service';

@Controller('gpt')
@UseGuards(GatewayAccessGuard)
@UseInterceptors(GptResponseInterceptor)
export class McpGatewayController {
  constructor(
    private readonly gateway: McpGatewayService,
    private readonly responses: GptResponseService,
  ) {}

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

  @Get('mcp/:service/tools/:toolName')
  getToolSchema(
    @Req() request: GatewayRequest,
    @Param('service') service: string,
    @Param('toolName') toolName: string,
  ) {
    return this.gateway.getToolSchema(
      this.principal(request),
      service,
      toolName,
    );
  }


  @Get('responses/:transferId/chunks/:chunkIndex')
  @SkipGptResponseEnvelope()
  getResponseChunk(
    @Req() request: GatewayRequest,
    @Param('transferId') transferId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
  ) {
    return this.responses.getChunk(
      this.principal(request),
      transferId,
      chunkIndex,
    );
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
      resolveMcpToolArguments(dto),
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
