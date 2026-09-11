import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateGatewayTokenDto } from '@server/root/modules/open-id/dto/create-gateway-token.dto';
import { CreateOpenIdDto } from '@server/root/modules/open-id/dto/create-open-id.dto';
import { OpenIdService } from '@server/root/modules/open-id/open-id.service';
import { TrialService } from '@server/root/modules/open-id/trial.service';

@Controller('open-ids')
export class OpenIdController {
  constructor(
    private readonly openIds: OpenIdService,
    private readonly trials: TrialService,
  ) {}

  @Get()
  list(@Req() request: Request) {
    return this.openIds.listOwn(request);
  }

  @Post()
  create(@Req() request: Request, @Body() dto: CreateOpenIdDto) {
    return this.openIds.createPaid(request, dto);
  }

  @Get('trial')
  trialStatus(@Req() request: Request) {
    return this.trials.status(request);
  }

  @Post('trial')
  claimTrial(@Req() request: Request) {
    return this.trials.claim(request);
  }

  @Get(':openIdId/tokens')
  listTokens(@Req() request: Request, @Param('openIdId') openIdId: string) {
    return this.openIds.listTokens(request, openIdId);
  }

  @Post(':openIdId/tokens')
  createToken(
    @Req() request: Request,
    @Param('openIdId') openIdId: string,
    @Body() dto: CreateGatewayTokenDto,
  ) {
    return this.openIds.createToken(request, openIdId, dto);
  }

  @Delete(':openIdId/tokens/:tokenId')
  revokeToken(
    @Req() request: Request,
    @Param('openIdId') openIdId: string,
    @Param('tokenId') tokenId: string,
  ) {
    return this.openIds.revokeToken(request, openIdId, tokenId);
  }
}
