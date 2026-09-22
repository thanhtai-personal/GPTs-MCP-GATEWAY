#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

class StdioMcpClient {
  constructor(id, config) {
    this.id = id;
    this.config = config;
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = '';
  }

  async start() {
    this.child = spawn(this.config.command, this.config.args ?? [], {
      env: { ...process.env, ...(this.config.env ?? {}) },
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
    });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => this.onData(chunk));
    this.child.on('exit', (code) => {
      const error = new Error(`Local MCP server ${this.id} exited with code ${code}`);
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });

    await this.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'gpts-mcp-gateway-local-agent', version: '0.1.0' },
    });
    this.notify('notifications/initialized', {});
  }

  async listTools() {
    const result = await this.request('tools/list', {});
    return Array.isArray(result?.tools) ? result.tools : [];
  }

  callTool(name, args) {
    return this.request('tools/call', { name, arguments: args ?? {} });
  }

  request(method, params) {
    const id = this.nextId++;
    this.write({ jsonrpc: '2.0', id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, 30_000);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
    });
  }

  notify(method, params) {
    this.write({ jsonrpc: '2.0', method, params });
  }

  write(message) {
    if (!this.child?.stdin.writable) throw new Error(`Local MCP server ${this.id} is not writable`);
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  onData(chunk) {
    this.buffer += chunk;
    for (;;) {
      const newline = this.buffer.indexOf('\n');
      if (newline < 0) return;
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (typeof message.id !== 'number') continue;
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? 'MCP request failed'));
      else pending.resolve(message.result);
    }
  }
}

async function api(url, token, path, body) {
  const response = await fetch(`${url.replace(/\/+$/u, '')}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? payload?.error?.message ?? `Gateway request failed (${response.status})`);
  }
  return payload;
}

async function main() {
  const configPath = process.argv[2] ?? './config.json';
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const gatewayToken = process.env.MCP_GATEWAY_TOKEN;
  if (!gatewayToken) throw new Error('Set MCP_GATEWAY_TOKEN in the local environment');
  if (!config.gatewayUrl || !config.name || !config.servers || typeof config.servers !== 'object') {
    throw new Error('config.json must contain gatewayUrl, name and servers');
  }

  const clients = new Map();
  const tools = [];
  for (const [serverId, serverConfig] of Object.entries(config.servers)) {
    if (!/^[a-z0-9-]+$/u.test(serverId)) throw new Error(`Invalid server id: ${serverId}`);
    const client = new StdioMcpClient(serverId, serverConfig);
    await client.start();
    clients.set(serverId, client);
    for (const tool of await client.listTools()) {
      if (!tool?.name || !tool?.inputSchema) continue;
      tools.push({
        name: `${serverId}__${tool.name}`,
        ...(tool.title ? { title: `${serverId}: ${tool.title}` } : {}),
        ...(tool.description ? { description: `[${serverId}] ${tool.description}` } : {}),
        inputSchema: tool.inputSchema,
      });
    }
  }

  const registration = await api(config.gatewayUrl, gatewayToken, '/local-agent/register', {
    name: config.name,
    tools,
  });
  const agentToken = registration.agentToken;
  if (!agentToken) throw new Error('Gateway did not return a local agent token');
  process.stderr.write(`Local agent connected as ${config.name} with ${tools.length} tools.\n`);

  for (;;) {
    try {
      const { job } = await api(config.gatewayUrl, agentToken, '/local-agent/poll', {});
      if (!job) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        continue;
      }
      const splitAt = job.toolName.indexOf('__');
      const serverId = splitAt > 0 ? job.toolName.slice(0, splitAt) : '';
      const toolName = splitAt > 0 ? job.toolName.slice(splitAt + 2) : '';
      const client = clients.get(serverId);
      let result;
      if (!client || !toolName) {
        result = { isError: true, content: [{ type: 'text', text: `Unknown local tool: ${job.toolName}` }] };
      } else {
        try {
          result = await client.callTool(toolName, job.arguments ?? {});
        } catch (error) {
          result = {
            isError: true,
            content: [{ type: 'text', text: error instanceof Error ? error.message : 'Local MCP tool failed' }],
          };
        }
      }
      await api(config.gatewayUrl, agentToken, `/local-agent/jobs/${encodeURIComponent(job.id)}/complete`, { result });
    } catch (error) {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
