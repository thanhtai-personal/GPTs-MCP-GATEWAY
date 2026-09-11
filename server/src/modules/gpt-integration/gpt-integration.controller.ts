import {
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '@server/root/modules/auth/auth.service';
import {
  GptIntegrationService,
  type IntegrationLanguage,
} from '@server/root/modules/gpt-integration/gpt-integration.service';

@Controller('gpt-integration')
export class GptIntegrationController {
  constructor(
    private readonly auth: AuthService,
    private readonly integration: GptIntegrationService,
  ) {}

  @Get('schema')
  async schema(@Req() request: Request, @Res() response: Response) {
    await this.auth.requireUser(request);
    response.type('application/yaml').send(this.integration.schema());
  }

  @Get('package')
  async download(
    @Req() request: Request,
    @Query('language') languageRaw: string | undefined,
    @Res() response: Response,
  ) {
    await this.auth.requireUser(request);
    const language: IntegrationLanguage = languageRaw === 'vi' ? 'vi' : 'en';
    const bundle = this.integration.buildBundle(language);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="mcp-gateway-gpt-kit-${language}.zip"`,
    );
    response.type('application/zip').send(Buffer.from(bundle.zip));
  }
}
