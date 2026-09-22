# Local MCP setup

The Local Agent lets GPTs MCP Gateway use MCP servers that run on your own PC without opening an inbound port. The PC makes outbound HTTPS requests to Gateway; only MCP stdio servers that you explicitly configure are exposed.

## 1. Requirements

- Node.js 24.
- A working GPTs MCP Gateway deployment with database migration `005_local_agents.sql` applied.
- A Gateway token linked to your Open ID.
- One or more local MCP stdio servers.

## 2. Configure the Local Agent

From the repository root:

```bash
cd local-agent
cp config.example.json config.json
```

On Windows PowerShell:

```powershell
cd local-agent
Copy-Item config.example.json config.json
```

Edit `config.json`. Example using the official filesystem MCP server:

```json
{
  "gatewayUrl": "https://YOUR-GATEWAY/api/v1",
  "name": "My PC",
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/YOU/Documents/AI-Workspace"
      ]
    }
  }
}
```

Use the narrowest allowed folder you need. Do not expose an entire disk when one workspace directory is enough.

Each configured server id becomes a tool namespace. For example, the local MCP tool `read_file` from the `filesystem` server is exposed to Gateway as `filesystem__read_file`.

## 3. Set the Gateway token locally

Do not put the token in `config.json`.

macOS/Linux:

```bash
export MCP_GATEWAY_TOKEN='YOUR_GATEWAY_TOKEN'
```

Windows PowerShell:

```powershell
$env:MCP_GATEWAY_TOKEN='YOUR_GATEWAY_TOKEN'
```

The Gateway token is used only to bootstrap/register the Local Agent. Gateway then issues a scoped Local Agent token. Provider/local MCP credentials remain on the PC.

## 4. Start the agent

```bash
node ./index.mjs ./config.json
```

A successful start prints the machine name and number of exposed tools. Keep this process running while you want GPT to access the local MCP servers.

## 5. Verify in the web app

Open **MCP Services → Local PC**. The agent should show:

- status `Online`;
- last-seen timestamp;
- number of discovered tools;
- namespaced tool names.

If it becomes `Offline`, restart the local process and confirm that the configured Gateway URL is reachable from the PC.

## 6. Verify from a GPT

The GPT should use the normal runtime-discovery flow:

1. `listMcpServices` → find `local-pc` with `connected=true`;
2. `listMcpTools(service="local-pc")`;
3. `getMcpToolSchema(service="local-pc", toolName=...)`;
4. `callMcpTool(...)`.

Do not hard-code local tool schemas in GPT Instructions or Knowledge.

## 7. Revoke a PC

Use **Revoke** in the Local PC management UI. Revocation immediately invalidates that agent token and expires queued calls. To reconnect later, start the Local Agent again with a valid Gateway token; registering the same machine name rotates its scoped token.

## Troubleshooting

### `LOCAL_AGENT_STORAGE_UNAVAILABLE`
Apply `database/migrations/005_local_agents.sql` to the deployment database.

### `LOCAL_AGENT_UNAUTHORIZED`
The scoped agent token is invalid/revoked. Stop the agent and start it again with a valid `MCP_GATEWAY_TOKEN`.

### `local-pc` is disconnected
The Gateway has not received a heartbeat in the online window. Ensure the local process is still running and can reach the Gateway HTTPS endpoint.

### A local MCP server exits immediately
Run that MCP server command manually first. Check the command, arguments, Node version, filesystem permissions, and any environment variables required by that MCP server.

## Security

- Do not expose shell/filesystem MCP servers with broader permissions than necessary.
- Do not put provider credentials or Gateway tokens in GPT Builder.
- Do not commit `local-agent/config.json` if it contains local paths or MCP-specific environment configuration.
- Review the tools exposed by each MCP server before connecting the agent.
