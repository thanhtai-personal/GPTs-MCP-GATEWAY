import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { GatewayAccessGuard } from '@server/root/modules/mcp-gateway/gateway-access.guard';
import type { GatewayRequest } from '@server/root/modules/mcp-gateway/gateway-request.types';
import { LocalAgentManagementService } from '@server/root/modules/local-agent/local-agent-management.service';
import { LocalAgentService } from '@server/root/modules/local-agent/local-agent.service';

@Controller('local-agent')
export class LocalAgentController {
  constructor(
    private readonly localAgents: LocalAgentService,
    private readonly management: LocalAgentManagementService,
  ) {}

  @Get()
  list(@Req() request: Request) {
    return this.management.listOwn(request);
  }

  @Delete(':agentId')
  revoke(@Req() request: Request, @Param('agentId') agentId: string) {
    return this.management.revokeOwn(request, agentId);
  }

  @Post('register')
  @UseGuards(GatewayAccessGuard)
  register(@Req() request: GatewayRequest, @Body() body: unknown) {
    return this.localAgents.register(request.gatewayPrincipal!, body);
  }

  @Post('poll')
  poll(@Req() request: Request) {
    return this.localAgents.poll(request);
  }

  @Post('jobs/:jobId/complete')
  complete(
    @Req() request: Request,
    @Param('jobId') jobId: string,
    @Body() body: unknown,
  ) {
    return this.localAgents.complete(request, jobId, body);
  }
}
