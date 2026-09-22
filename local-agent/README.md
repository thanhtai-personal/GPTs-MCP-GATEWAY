# GPTs MCP Gateway Local Agent

The local agent lets Gateway expose MCP tools that run on your own PC without opening an inbound port. The agent creates outbound HTTPS requests to Gateway and proxies only the local MCP stdio servers you explicitly configure.

## Setup

1. Copy `config.example.json` to `config.json` and configure one or more local MCP stdio servers.
2. Put the Gateway token in your local environment, not in the config file:

   ```bash
   export MCP_GATEWAY_TOKEN='your-gateway-token'
   ```

   PowerShell:

   ```powershell
   $env:MCP_GATEWAY_TOKEN='your-gateway-token'
   ```

3. Start the agent with Node 24:

   ```bash
   node ./index.mjs ./config.json
   ```

When the agent is alive, runtime service discovery exposes `local-pc`. Local tool names are namespaced as `<server-id>__<tool-name>`.

## Security model

- No inbound listener is opened on the PC.
- Gateway stores only a SHA-256 hash of the scoped local-agent token.
- The bootstrap Gateway token is used only to register the agent and is never sent to a local MCP server.
- Provider/local MCP credentials stay in the local process environment/configuration and are not uploaded to GPT.
- Only MCP servers explicitly listed in `config.json` are started and exposed.

Treat every configured MCP server as trusted local software and restrict its filesystem/process permissions to the minimum required.
