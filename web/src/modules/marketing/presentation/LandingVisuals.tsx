import type { ReactNode } from "react";
import { Braces } from "lucide-react";

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
