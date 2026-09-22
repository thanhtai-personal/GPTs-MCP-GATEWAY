import { ChevronDown, CircleDot, Cpu, ExternalLink, MonitorCog, RefreshCw, ShieldOff, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { AnimatedCollapse } from "@/shared/components/AnimatedCollapse";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import { useLocalAgents, useRevokeLocalAgent } from "@/modules/local-agent/queries/local-agent.queries";
import type { LocalAgent } from "@/modules/local-agent/domain/local-agent.types";
import "./LocalAgentsPanel.css";

const REPOSITORY_URL = "https://github.com/thanhtai-personal/GPTs-MCP-GATEWAY";

export function LocalAgentsPanel({ accessToken }: { accessToken: string }) {
  const { t } = useUiLanguage();
  const agents = useLocalAgents(accessToken);
  const revoke = useRevokeLocalAgent(accessToken);
  const [setupOpen, setSetupOpen] = useState(false);

  const activeAgents = (agents.data ?? []).filter((agent) => agent.status !== "revoked");

  return (
    <section className="card local-agent-panel">
      <header className="local-agent-panel__header">
        <div className="local-agent-panel__title">
          <span className="provider-logo"><MonitorCog size={20} /></span>
          <div>
            <span className="eyebrow">LOCAL MCP BRIDGE</span>
            <h2>{t("Local PC", "Local PC")}</h2>
            <p className="muted">{t("Kết nối GPT với MCP server chạy trên máy của bạn qua outbound HTTPS. Không mở public port trên PC.", "Connect GPT to MCP servers running on your computer over outbound HTTPS. No public inbound port is opened on the PC.")}</p>
          </div>
        </div>
        <button aria-expanded={setupOpen} className="secondary local-agent-panel__setup-toggle" onClick={() => setSetupOpen((value) => !value)} type="button">
          <TerminalSquare size={16} />
          {t("Hướng dẫn setup", "Setup guide")}
          <ChevronDown className={setupOpen ? "is-expanded" : ""} size={16} />
        </button>
      </header>

      <AnimatedCollapse className="local-agent-setup-collapse" open={setupOpen}>
        <LocalAgentSetupGuide />
      </AnimatedCollapse>

      {agents.isLoading ? (
        <div className="local-agent-state"><RefreshCw className="local-agent-spin" size={18} /><span>{t("Đang tải Local Agent…", "Loading Local Agents…")}</span></div>
      ) : agents.error ? (
        <p className="notice error">{agents.error.message}</p>
      ) : activeAgents.length ? (
        <div className="local-agent-list">
          {activeAgents.map((agent) => (
            <LocalAgentRow
              agent={agent}
              key={agent.id}
              onRevoke={() => {
                const confirmed = window.confirm(
                  t(
                    `Thu hồi Local Agent “${agent.name}”? Agent đang chạy sẽ mất quyền truy cập Gateway.`,
                    `Revoke Local Agent “${agent.name}”? A running agent will lose Gateway access.`,
                  ),
                );
                if (confirmed) revoke.mutate(agent.id);
              }}
              revoking={revoke.isPending}
            />
          ))}
          {revoke.error ? <p className="notice error">{revoke.error.message}</p> : null}
        </div>
      ) : (
        <div className="local-agent-empty">
          <Cpu size={24} />
          <div>
            <strong>{t("Chưa có Local Agent", "No Local Agent yet")}</strong>
            <p className="muted">{t("Mở hướng dẫn setup, cấu hình MCP stdio server trên máy rồi chạy Local Agent.", "Open the setup guide, configure local MCP stdio servers, then start the Local Agent.")}</p>
          </div>
        </div>
      )}
    </section>
  );
}

function LocalAgentRow({ agent, onRevoke, revoking }: { agent: LocalAgent; onRevoke: () => void; revoking: boolean }) {
  const { t } = useUiLanguage();
  const online = agent.status === "online";
  return (
    <article className="local-agent-row">
      <div className="local-agent-row__main">
        <div className="local-agent-row__name">
          <span className={`local-agent-status local-agent-status--${agent.status}`} aria-hidden="true" />
          <strong>{agent.name}</strong>
          <span className="local-agent-status-label">{online ? t("Online", "Online") : t("Offline", "Offline")}</span>
        </div>
        <div className="local-agent-row__meta">
          <span><CircleDot size={13} /> {agent.toolCount} {t("tools", "tools")}</span>
          <span>{t("Seen", "Seen")} <time dateTime={agent.lastSeenAt}>{formatTimestamp(agent.lastSeenAt)}</time></span>
        </div>
        {agent.toolNames.length ? (
          <div className="local-agent-tools" aria-label={t("Local MCP tools", "Local MCP tools")}>
            {agent.toolNames.slice(0, 8).map((tool) => <code key={tool}>{tool}</code>)}
            {agent.toolNames.length > 8 ? <span>+{agent.toolNames.length - 8}</span> : null}
          </div>
        ) : null}
      </div>
      <button className="danger local-agent-row__revoke" disabled={revoking} onClick={onRevoke} type="button">
        <ShieldOff size={15} /> {t("Thu hồi", "Revoke")}
      </button>
    </article>
  );
}

function LocalAgentSetupGuide() {
  const { t } = useUiLanguage();
  return (
    <div className="local-agent-setup">
      <div className="local-agent-setup__steps">
        <SetupStep number="1" title={t("Chuẩn bị", "Prerequisites")}>
          <p>{t("Cài Node.js 24 và lấy Gateway token của Open ID hiện tại.", "Install Node.js 24 and get the Gateway token for your current Open ID.")}</p>
        </SetupStep>
        <SetupStep number="2" title={t("Tạo config local", "Create local config")}>
          <pre><code>{`cd local-agent\ncp config.example.json config.json`}</code></pre>
          <p>{t("Windows PowerShell dùng Copy-Item thay cho cp.", "On Windows PowerShell use Copy-Item instead of cp.")}</p>
        </SetupStep>
        <SetupStep number="3" title={t("Thêm MCP server", "Add an MCP server")}>
          <pre><code>{`{
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
}`}</code></pre>
          <p>{t("Chỉ cấp thư mục/phạm vi thật sự cần. Tool sẽ được namespace thành filesystem__<tool>.", "Grant only the folder/scope you actually need. Tools are namespaced as filesystem__<tool>.")}</p>
        </SetupStep>
        <SetupStep number="4" title={t("Set token và chạy agent", "Set token and run the agent")}>
          <pre><code>{`# macOS / Linux
export MCP_GATEWAY_TOKEN='YOUR_GATEWAY_TOKEN'
node ./index.mjs ./config.json

# Windows PowerShell
$env:MCP_GATEWAY_TOKEN='YOUR_GATEWAY_TOKEN'
node ./index.mjs ./config.json`}</code></pre>
        </SetupStep>
        <SetupStep number="5" title={t("Kiểm tra kết nối", "Verify connection")}>
          <p>{t("Khi agent chạy, status phía trên sẽ chuyển Online và hiển thị danh sách tool local. GPT sẽ thấy runtime service local-pc.", "While the agent is running, the status above becomes Online and local tools appear. GPT sees the runtime service local-pc.")}</p>
        </SetupStep>
      </div>
      <a className="local-agent-doc-link" href={`${REPOSITORY_URL}/blob/main/docs/local-mcp-setup.md`} rel="noreferrer" target="_blank">
        {t("Mở hướng dẫn đầy đủ", "Open full setup guide")} <ExternalLink size={14} />
      </a>
    </div>
  );
}

function SetupStep({ children, number, title }: { children: React.ReactNode; number: string; title: string }) {
  return (
    <section className="local-agent-step">
      <span className="local-agent-step__number">{number}</span>
      <div><strong>{title}</strong>{children}</div>
    </section>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
