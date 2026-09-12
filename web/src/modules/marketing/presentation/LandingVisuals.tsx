import type { ReactNode } from "react";
import { Braces } from "lucide-react";

export function IdentityOrbit({ t }: { t: (vi: string, en: string) => string }) {
  return (
    <section className="identity-orbit" aria-label={t("Gateway identity layer", "Gateway identity layer")}>
      <div className="identity-orbit__header">
        <span className="eyebrow">01 · VALIDATED IDENTITY LAYER &amp; SCOPES</span>
        <div>
          <span className="status">OID: USER ACTIVE</span>
          <span className="status good">CLAIMS: 4/4</span>
        </div>
      </div>

      <div className="identity-orbit__stage">
        <div className="identity-orbit__ellipse identity-orbit__ellipse--one" />
        <div className="identity-orbit__ellipse identity-orbit__ellipse--two" />
        <div className="identity-orbit__ellipse identity-orbit__ellipse--three" />
        <div className="identity-orbit__pulse" />

        <div className="identity-orbit__core">
          <span>OID</span>
          <strong>OPEN ID</strong>
          <small>ENTITLEMENT ACTIVE</small>
        </div>

        <OrbitNode className="identity-orbit__node--gpt" label="CUSTOM GPT" value="AUTHORIZED" tone="cyan" />
        <OrbitNode className="identity-orbit__node--gateway" label="GATEWAY" value="VERIFIED" tone="success" />
        <OrbitNode className="identity-orbit__node--provider" label="MCP PROVIDER" value="STITCH" tone="cyan" />
        <OrbitNode className="identity-orbit__node--token" label="GATEWAY TOKEN" value="SCOPED" tone="success" />
      </div>

      <div className="identity-orbit__footer">
        <span><i className="status-dot status-dot--success" /> END-TO-END CLAIMS PROTECTED</span>
        <span>CRYPTO: <b>CHACHA20-POLY1305</b></span>
        <span>JWT CLAIMS: <b>4 VALID</b></span>
      </div>
    </section>
  );
}

function OrbitNode({
  className,
  label,
  tone,
  value,
}: {
  className: string;
  label: string;
  tone: "cyan" | "success";
  value: string;
}) {
  return (
    <div className={`identity-orbit__node ${className} identity-orbit__node--${tone}`}>
      <span />
      <strong>{label}</strong>
      <small>{value}</small>
    </div>
  );
}

export function LiveRouterConsole({
  t,
}: {
  t: (vi: string, en: string) => string;
}) {
  const requests = [
    ["GET", "listMcpServices", "14.2ms", "200"],
    ["POST", "listMcpTools · stitch", "42.8ms", "200"],
    ["POST", "getMcpToolSchema · generate_screen", "31.4ms", "200"],
    ["POST", "callMcpTool · stitch", "118.7ms", "200"],
    ["GET", "Open ID entitlement resolve", "8.1ms", "200"],
  ];

  return (
    <section className="live-router-console" aria-label="Live MCP router console">
      <div className="live-router-console__bar">
        <span className="window-dots"><i /><i /><i /></span>
        <strong>LIVE MCP ROUTER CONSOLE // NETWORK INSPECTOR</strong>
        <span className="status good">TRAFFIC LIVE</span>
      </div>

      <div className="live-router-console__tabs">
        <span className="active">REQUEST FLOW</span>
        <span>CLAIMS</span>
        <span>PROVIDER</span>
        <span>LATENCY</span>
        <small>RATE 24.8 req/s</small>
      </div>

      <div className="live-router-console__body">
        <div className="live-router-console__requests">
          <div className="console-section-title">
            <span>CRYPTOSIGNED TRACE / LIVE</span>
            <span>TRACE: MCP_GATEWAY_01</span>
          </div>
          {requests.map(([method, route, latency, status], index) => (
            <div className={`router-request ${index === 3 ? "active" : ""}`} key={route}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{method}</b>
              <code>{route}</code>
              <small>{latency}</small>
              <strong>{status}</strong>
            </div>
          ))}
          <div className="router-result">
            <span>RESULT</span>
            <strong>{t("Tool invocation hoàn tất", "Tool invocation complete")}</strong>
            <small>Provider response normalized → Gateway response envelope</small>
          </div>
        </div>

        <aside className="live-router-console__inspector">
          <div className="router-inspector-card">
            <span className="eyebrow">OPEN ID CLAIM</span>
            <dl>
              <div><dt>Subject</dt><dd>usr_•••8f91</dd></div>
              <div><dt>Scope</dt><dd>mcp.execute</dd></div>
              <div><dt>Provider</dt><dd>stitch</dd></div>
              <div><dt>Entitlement</dt><dd>ACTIVE</dd></div>
            </dl>
          </div>
          <div className="router-inspector-card">
            <span className="eyebrow">LIVE SYSTEM STREAM</span>
            <div className="router-bars" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <small>p95 118ms · auth 8ms · discovery 42ms</small>
          </div>
          <div className="router-inspector-card router-inspector-card--secure">
            <span>SECURE EXECUTION BOUNDARY</span>
            <strong>OPEN ID ENFORCED</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}


export function GatewayInspector({ t }: { t: (vi: string, en: string) => string }) {
  return (
    <div className="gateway-inspector gateway-inspector--cinematic" aria-label="Gateway execution inspector">
      <div className="gateway-inspector__ambient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="gateway-inspector__bar">
        <span className="window-dots"><i /><i /><i /></span>
        <strong>Gateway Inspector</strong>
        <span className="status good"><i className="status-dot status-dot--success" /> LIVE</span>
      </div>
      <div className="gateway-inspector__intent">
        <span className="eyebrow">USER INTENT</span>
        <strong>{t('"Dùng Stitch để redesign dashboard."', '"Use Stitch to redesign this dashboard."')}</strong>
      </div>
      <div className="gateway-inspector__trace">
        <InspectorNode step="01" label="CUSTOM GPT" value="intent → capability" />
        <InspectorNode step="02" label="MCP GATEWAY" value="Open ID · VERIFIED" active />
        <InspectorNode step="03" label="TOOL DISCOVERY" value="stitch · listMcpTools" />
        <InspectorNode step="04" label="SELECTED TOOL" value="generate_screen" />
        <InspectorNode step="05" label="GOOGLE STITCH" value="CONNECTED" success />
        <InspectorNode step="06" label="RESULT" value="SUCCESS · COMPLETE" success />
      </div>
      <div className="gateway-inspector__pulse" aria-hidden="true"><i /></div>
      <div className="gateway-inspector__metrics">
        <span><small>Latency</small><strong>84ms</strong></span>
        <span><small>Open ID</small><strong>ACTIVE</strong></span>
        <span><small>Provider</small><strong>stitch</strong></span>
        <span><small>Transport</small><strong>MCP</strong></span>
      </div>
    </div>
  );
}

function InspectorNode({
  active = false,
  label,
  step,
  success = false,
  value,
}: {
  active?: boolean;
  label: string;
  step: string;
  success?: boolean;
  value: string;
}) {
  return (
    <div className={`inspector-node ${active ? "active" : ""} ${success ? "success" : ""}`}>
      <span>{step}</span><div><small>{label}</small><strong>{value}</strong></div>
    </div>
  );
}

export function MarketingStep({
  detail,
  icon,
  index,
  title,
}: {
  detail: string;
  icon: ReactNode;
  index: string;
  title: string;
}) {
  return (
    <article className="workflow-step">
      <span className="workflow-step__index">{index}</span>
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}

export function SystemStatus({ label, tone, value }: { label: string; tone: "success" | "cyan"; value: string }) {
  return <div className="system-status"><span>{label}</span><strong><i className={`status-dot status-dot--${tone}`} /> {value}</strong></div>;
}

export function ConsoleRow({ active = false, label, success = false, value }: { active?: boolean; label: string; success?: boolean; value: string }) {
  return <div className={`console-row ${active ? "active" : ""} ${success ? "success" : ""}`}><span>{label}</span><code>{value}</code></div>;
}

export function KitFile({ name }: { name: string }) {
  return <div className="kit-file"><Braces size={16} /><code>{name}</code><span>READY</span></div>;
}

export function JourneyStep({ active = false, label }: { active?: boolean; label: string }) {
  return <div className={`journey-step ${active ? "active" : ""}`}><i /><strong>{label}</strong></div>;
}
