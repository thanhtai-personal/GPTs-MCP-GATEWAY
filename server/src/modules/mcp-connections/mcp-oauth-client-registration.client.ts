import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { isJsonObject } from '@server/root/modules/mcp-gateway/mcp-json';

export type DynamicClientRegistration = {
  clientId: string;
  clientSecret?: string;
};

@Injectable()
export class McpOAuthClientRegistrationClient {
  constructor(private readonly config: AppConfigService) {}

  async register(
    registrationEndpoint: string,
    input: {
      clientName: string;
      redirectUri: string;
      clientUri?: string;
    },
  ): Promise<DynamicClientRegistration> {
    let response: Response;
    try {
      response = await fetch(registrationEndpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_name: input.clientName,
          ...(input.clientUri ? { client_uri: input.clientUri } : {}),
          redirect_uris: [input.redirectUri],
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
        }),
        signal: AbortSignal.timeout(this.config.upstreamTimeoutMs),
      });
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'MCP_OAUTH_CLIENT_REGISTRATION_UNAVAILABLE',
        message: 'MCP OAuth dynamic client registration is unavailable',
        details: {
          cause: error instanceof Error ? error.name : 'network_error',
        },
      });
    }

    const payload = await this.readJsonResponse(response);
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_CLIENT_REGISTRATION_FAILED',
        message: 'MCP OAuth dynamic client registration failed',
        details: { status: response.status },
      });
    }

    if (typeof payload.client_id !== 'string' || !payload.client_id) {
      throw new BadGatewayException({
        code: 'MCP_OAUTH_CLIENT_REGISTRATION_INVALID',
        message: 'MCP OAuth client registration returned no client ID',
      });
    }

    return {
      clientId: payload.client_id,
      ...(typeof payload.client_secret === 'string' && payload.client_secret
        ? { clientSecret: payload.client_secret }
        : {}),
    };
  }

  private async readJsonResponse(response: Response) {
    try {
      const value = (await response.json()) as unknown;
      return isJsonObject(value) ? value : {};
    } catch {
      return {};
    }
  }
}
