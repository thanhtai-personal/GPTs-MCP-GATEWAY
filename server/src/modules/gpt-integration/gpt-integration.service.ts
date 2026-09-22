import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import {
  buildGptInstructions,
  buildGptKnowledge,
  buildGptPluginIntegrationGuide,
  buildGptPluginManifest,
  buildGptSetupGuide,
} from '@server/root/modules/gpt-integration/gpt-integration-content';
import { buildGptOpenApiSchema } from '@server/root/modules/gpt-integration/gpt-integration-openapi';
import { buildStoredZip } from '@server/root/modules/gpt-integration/zip.util';

export type IntegrationLanguage = 'vi' | 'en';

@Injectable()
export class GptIntegrationService {
  constructor(private readonly config: AppConfigService) {}

  buildBundle(language: IntegrationLanguage) {
    const files = [
      { name: 'instructions.md', content: buildGptInstructions(language) },
      {
        name: 'GPTS-MCP-GATEWAY-Knowledge.md',
        content: buildGptKnowledge(language),
      },
      { name: 'openapi.yaml', content: this.openApiSchema() },
      {
        name: 'plugin-manifest.json',
        content: buildGptPluginManifest(language),
      },
      {
        name: 'plugin-integration.md',
        content: buildGptPluginIntegrationGuide(language),
      },
      { name: 'setup-guide.md', content: buildGptSetupGuide(language) },
    ];
    return { language, files, zip: buildStoredZip(files) };
  }

  schema(): string {
    return this.openApiSchema();
  }

  getBundleFile(language: IntegrationLanguage, filename: string) {
    const file = this.buildBundle(language).files.find(
      (candidate) => candidate.name === filename,
    );
    if (!file) {
      throw new NotFoundException('Integration kit file not found');
    }

    return {
      ...file,
      contentType: file.name.endsWith('.yaml')
        ? 'application/yaml'
        : file.name.endsWith('.json')
          ? 'application/json'
          : 'text/markdown',
    };
  }

  private openApiSchema(): string {
    const server = `${this.config.publicBaseUrl.replace(/\/+$/u, '')}/api/v1`;
    return buildGptOpenApiSchema(server);
  }
}
