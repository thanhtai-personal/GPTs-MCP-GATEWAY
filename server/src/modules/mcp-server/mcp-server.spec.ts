import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  isOAuthClientToken,
  mcpOAuthClientId,
} from '@server/root/modules/auth/oauth-token-claims';
import { AuthService } from '@server/root/modules/auth/auth.service';
import { McpServerController } from '@server/root/modules/mcp-server/mcp-server.controller';
import { McpServerService } from '@server/root/modules/mcp-server/mcp-server.service';

const ISSUER = 'https://project.supabase.co/auth/v1';

function jwt(claims: Record<string, unknown>): string {
  const part = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'ES256' })}.${part(claims)}.signature`;
}

const oauthToken = jwt({
  iss: ISSUER,
  aud: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 600,
  client_id: 'chatgpt-client',
});
const user = { id: 'user-1', membershipTier: 'guest' } as never;
const principal = { credentialId: null, openIdId: 'o1', openId: 'OID', user, kind: 'trial' };

function service(overrides: { principalForUser?: jest.Mock } = {}) {
  const gateway = {
    profile: jest.fn().mockResolvedValue({ services: [{ id: 'google-drive', connected: true }] }),
    listTools: jest.fn().mockResolvedValue({ service: 'google-drive', tools: [] }),
    getToolSchema: jest.fn(),
    callTool: jest.fn().mockResolvedValue({
      service: 'google-drive',
      tool: 'search_files',
      result: { isError: true, content: [] },
    }),
  };
  const credentials = {
    principalForUser: overrides.principalForUser ?? jest.fn().mockResolvedValue(principal),
  };
  return {
    gateway,
    credentials,
    mcp: new McpServerService(gateway as never, credentials as never),
  };
}

const session = { user, clientId: 'chatgpt-client' };

describe('MCP OAuth token claims', () => {
  it('accepts only client tokens with the expected issuer, audience and lifetime', () => {
    const expected = { issuer: ISSUER, audience: 'authenticated' };
    expect(mcpOAuthClientId(oauthToken, expected)).toBe('chatgpt-client');
    expect(mcpOAuthClientId(jwt({ iss: ISSUER, aud: 'authenticated' }), expected)).toBeNull();
    expect(
      mcpOAuthClientId(jwt({ iss: 'https://other', aud: 'authenticated', client_id: 'c' }), expected),
    ).toBeNull();
    expect(
      mcpOAuthClientId(
        jwt({ iss: ISSUER, aud: 'authenticated', client_id: 'c', exp: 1 }),
        expected,
      ),
    ).toBeNull();
    expect(mcpOAuthClientId('not-a-jwt', expected)).toBeNull();
  });

  it('identifies OAuth client tokens so REST APIs can reject them', () => {
    expect(isOAuthClientToken(oauthToken)).toBe(true);
    expect(isOAuthClientToken(jwt({ iss: ISSUER, aud: 'authenticated' }))).toBe(false);
  });
});

describe('AuthService REST boundary', () => {
  it('rejects MCP OAuth client tokens on dashboard APIs before calling Supabase', async () => {
    const supabase = { createAnonClient: jest.fn() };
    const auth = new AuthService(supabase as never);
    await expect(
      auth.requireUser({ headers: { authorization: `Bearer ${oauthToken}` } } as never),
    ).rejects.toMatchObject({ response: { code: 'OAUTH_CLIENT_TOKEN_NOT_ALLOWED' } });
    expect(supabase.createAnonClient).not.toHaveBeenCalled();
  });
});

describe('McpServerService', () => {
  it('negotiates the protocol version and advertises tools', async () => {
    const { mcp } = service();
    const init = await mcp.handleMessage(session, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18' },
    });
    expect(init).toMatchObject({
      id: 1,
      result: { protocolVersion: '2025-06-18', capabilities: { tools: {} } },
    });

    const fallback = await mcp.handleMessage(session, {
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: { protocolVersion: '1999-01-01' },
    });
    expect(fallback).toMatchObject({ result: { protocolVersion: '2025-11-25' } });

    const list = await mcp.handleMessage(session, { jsonrpc: '2.0', id: 3, method: 'tools/list' });
    const names = ((list as unknown as { result: { tools: Array<{ name: string }> } }).result.tools).map(
      (tool) => tool.name,
    );
    expect(names).toEqual(['gateway_profile', 'list_tools', 'get_tool_schema', 'call_tool']);
  });

  it('ignores notifications and rejects unknown methods', async () => {
    const { mcp } = service();
    await expect(
      mcp.handleMessage(session, { jsonrpc: '2.0', method: 'notifications/initialized' }),
    ).resolves.toBeNull();
    await expect(
      mcp.handleMessage(session, { jsonrpc: '2.0', id: 4, method: 'resources/list' }),
    ).resolves.toMatchObject({ error: { code: -32601 } });
  });

  it('routes call_tool through the Gateway with the OAuth user entitlement', async () => {
    const { mcp, gateway, credentials } = service();
    const reply = await mcp.handleMessage(session, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'call_tool',
        arguments: { service: 'google-drive', tool: 'search_files', arguments: { query: 'Q4' } },
      },
    });
    expect(credentials.principalForUser).toHaveBeenCalledWith(user);
    expect(gateway.callTool).toHaveBeenCalledWith(principal, 'google-drive', 'search_files', {
      query: 'Q4',
    });
    expect(reply).toMatchObject({ result: { isError: true } });
  });

  it('returns entitlement problems as tool errors the model can explain', async () => {
    const { mcp, gateway } = service({
      principalForUser: jest.fn().mockRejectedValue(
        new ForbiddenException({ code: 'OPEN_ID_REQUIRED', message: 'Start the trial' }),
      ),
    });
    const reply = await mcp.handleMessage(session, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'gateway_profile', arguments: {} },
    });
    expect(reply).toMatchObject({
      result: {
        isError: true,
        structuredContent: { error: { code: 'OPEN_ID_REQUIRED' } },
      },
    });
    expect(gateway.profile).not.toHaveBeenCalled();
  });
});

describe('McpServerController', () => {
  function controller(requireMcpOAuthUser = jest.fn().mockResolvedValue(user)) {
    const config = {
      supabaseOAuthIssuerUrl: ISSUER,
      mcpOAuthAudience: 'authenticated',
      mcpProtectedResourceMetadataUrl: 'https://api.example.com/.well-known/oauth-protected-resource',
    };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    const { mcp } = service();
    return {
      response,
      instance: new McpServerController(config as never, { requireMcpOAuthUser } as never, mcp),
    };
  }

  it('challenges requests without an OAuth client token', async () => {
    const { instance, response } = controller();
    await instance.handle({ headers: {}, body: {} } as never, response as never);
    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      expect.stringContaining('resource_metadata="https://api.example.com/.well-known/oauth-protected-resource"'),
    );
  });

  it('challenges tokens Supabase no longer accepts', async () => {
    const { instance, response } = controller(
      jest.fn().mockRejectedValue(new UnauthorizedException()),
    );
    await instance.handle(
      { headers: { authorization: `Bearer ${oauthToken}` }, body: {} } as never,
      response as never,
    );
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it('answers JSON-RPC requests and accepts notifications with 202', async () => {
    const { instance, response } = controller();
    const headers = { authorization: `Bearer ${oauthToken}` };
    await instance.handle(
      { headers, body: { jsonrpc: '2.0', id: 1, method: 'ping' } } as never,
      response as never,
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ jsonrpc: '2.0', id: 1, result: {} });

    await instance.handle(
      { headers, body: { jsonrpc: '2.0', method: 'notifications/initialized' } } as never,
      response as never,
    );
    expect(response.status).toHaveBeenCalledWith(202);
  });
});
