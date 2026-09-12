import { Activity, ArrowRight, Boxes, KeyRound, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type OverviewTarget = "mcp-services" | "open-id" | "gpt-integration";

export function CinematicOverview({
  isMember,
  onNavigate,
}: {
  isMember?: boolean;
  onNavigate: (screen: OverviewTarget) => void;
}) {
  const { t } = useUiLanguage();

  return (
    <div className="cinematic-dashboard">
      <section className="cinematic-dashboard__hero">
        <div>
          <span className="eyebrow">LIVE CONTROL PLANE</span>
          <h1>{t("Gateway Operations Console", "Gateway Operations Console")}</h1>
          <p>
            {t(
              "Theo dõi entitlement, provider connectivity và runtime MCP routing trong một execution boundary duy nhất.",
              "Observe entitlement, provider connectivity, and runtime MCP routing inside one execution boundary.",
            )}
          </p>
        </div>
        <div className="cinematic-dashboard__hero-actions">
          <span className="status good"><ShieldCheck size={14} /> GATEWAY OPERATIONAL</span>
          <span className="status"><Activity size={14} /> 99.99% UPTIME</span>
        </div>
      </section>

      <section className="cinematic-status-rail">
        <div><span>OPEN ID</span><strong>{isMember ? "MEMBER ACTIVE" : "TRIAL / OPEN ID"}</strong><small>ENTITLEMENT</small></div>
        <div><span>PROVIDER</span><strong>GOOGLE STITCH</strong><small>CONNECTED SERVICE</small></div>
        <div><span>ROUTING</span><strong>DYNAMIC DISCOVERY</strong><small>RUNTIME TOOLS</small></div>
        <div><span>SECURITY</span><strong>ENCRYPTED</strong><small>PROVIDER CREDENTIALS</small></div>
      </section>

      <section className="cinematic-console-grid">
        <article className="cinematic-console-card cinematic-console-card--trace">
          <div className="cinematic-console-card__header">
            <div><span className="eyebrow">LIVE EXECUTION TRACE</span><h2>Runtime MCP routing</h2></div>
            <span className="status good">STREAMING</span>
          </div>

          <div className="console-trace-list">
            <div className="active"><span>01</span><b>INTENT</b><code>“Use Stitch to update UI”</code><small>0ms</small></div>
            <div className="active"><span>02</span><b>SERVICE</b><code>stitch</code><small>4ms</small></div>
            <div className="active"><span>03</span><b>DISCOVERY</b><code>listMcpTools</code><small>42ms</small></div>
            <div className="active"><span>04</span><b>SCHEMA</b><code>getMcpToolSchema</code><small>31ms</small></div>
            <div className="success"><span>05</span><b>EXECUTE</b><code>callMcpTool</code><small>118ms</small></div>
          </div>

          <div className="console-trace-footer">
            <span><i className="status-dot status-dot--success" /> OPEN ID ENFORCED</span>
            <code>result: complete</code>
          </div>
        </article>

        <aside className="cinematic-console-side">
          <article className="cinematic-metric-card">
            <span>REQUEST RATE</span><strong>24.8</strong><small>req / sec</small>
            <div className="metric-bars" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
          </article>
          <article className="cinematic-metric-card">
            <span>P95 LATENCY</span><strong>118ms</strong><small>gateway route</small>
            <div className="metric-line" aria-hidden="true"><i /></div>
          </article>
          <article className="cinematic-metric-card cinematic-metric-card--secure">
            <ShieldCheck size={18} />
            <div><span>SECURITY BOUNDARY</span><strong>ACTIVE</strong><small>token → Open ID → provider</small></div>
          </article>
        </aside>
      </section>

      <section className="cinematic-actions">
        <button onClick={() => onNavigate("mcp-services")} type="button">
          <span className="feature-icon"><Boxes /></span>
          <div><small>01 · CONNECTORS</small><strong>MCP Services</strong><p>{t("Quản lý provider credential và connection state.", "Manage provider credentials and connection state.")}</p></div>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate("open-id")} type="button">
          <span className="feature-icon"><KeyRound /></span>
          <div><small>02 · ENTITLEMENT</small><strong>Open ID Access</strong><p>{t("Quản lý trial, Open ID và Gateway token.", "Manage trial, Open ID, and Gateway tokens.")}</p></div>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate("gpt-integration")} type="button">
          <span className="feature-icon"><Sparkles /></span>
          <div><small>03 · INTEGRATION</small><strong>GPT Workbench</strong><p>{t("Tải kit và cấu hình runtime MCP discovery.", "Download the kit and configure runtime MCP discovery.")}</p></div>
          <ArrowRight size={16} />
        </button>
      </section>

      <section className="cinematic-boundary">
        <div className="cinematic-boundary__header">
          <div><span className="eyebrow">EXECUTION BOUNDARY</span><h2>Custom GPT → Gateway → MCP</h2></div>
          <span className="status good">OPEN ID ENFORCED</span>
        </div>
        <div className="cinematic-boundary__flow">
          <RouteStep index="01" label="Custom GPT" detail={t("Hiểu intent", "Understand intent")} />
          <Waypoints size={18} />
          <RouteStep index="02" label="Gateway" detail={t("Resolve entitlement", "Resolve entitlement")} active />
          <Waypoints size={18} />
          <RouteStep index="03" label="MCP Service" detail={t("Discover + execute", "Discover + execute")} />
        </div>
      </section>
    </div>
  );
}


function RouteStep({
  active = false,
  detail,
  index,
  label,
}: {
  active?: boolean;
  detail: string;
  index: string;
  label: string;
}) {
  return (
    <div className={`route-step ${active ? "active" : ""}`}>
      <span>{index}</span>
      <strong>{label}</strong>
      <small>{detail}</small>
    </div>
  );
}

