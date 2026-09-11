import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SaveMcpConnectionDto } from '@server/root/modules/mcp-connections/dto/save-mcp-connection.dto';
import { McpConnectionsService } from '@server/root/modules/mcp-connections/mcp-connections.service';

@Controller('mcp-connections')
export class McpConnectionsController {
  constructor(private readonly connections: McpConnectionsService) {}

  @Get('providers')
  providers(@Req() request: Request) {
    return this.connections.listSupportedProviders(request);
  }

  @Get()
  list(@Req() request: Request) {
    return this.connections.listOwn(request);
  }

  @Post('test')
  test(@Req() request: Request, @Body() dto: SaveMcpConnectionDto) {
    return this.connections.testOwn(request, dto);
  }

  @Put()
  save(@Req() request: Request, @Body() dto: SaveMcpConnectionDto) {
    return this.connections.saveOwn(request, dto);
  }

  @Delete(':provider')
  remove(@Req() request: Request, @Param('provider') provider: string) {
    return this.connections.removeOwn(request, provider);
  }
}
