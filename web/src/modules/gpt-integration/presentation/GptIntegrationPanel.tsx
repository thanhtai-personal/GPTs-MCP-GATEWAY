import {
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  FileText,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { useState } from "react";
import { ProviderSkillSelector } from "@/modules/gpt-integration/provider-skills/ProviderSkillSelector";
import { PROVIDER_SKILL_OPTIONS } from "@/modules/gpt-integration/provider-skills/provider-skill.types";
import { useProviderSkillSelection } from "@/modules/gpt-integration/provider-skills/useProviderSkillSelection";
import { useTrialStatus } from "@/modules/open-id/queries/open-id.queries";
import { downloadGatewayFile } from "@/shared/api/gateway-api";
import { useUiLanguage } from "@/shared/i18n/ui-language";

const BASE_KIT_FILES = [
  { name: "instructions.md", icon: FileText, kind: "INSTRUCTIONS" },
  { name: "GPTS-MCP-GATEWAY-Knowledge.md", icon: FileText, kind: "KNOWLEDGE" },
  { name: "openapi.yaml", icon: FileCode2, kind: "ACTION SCHEMA" },
  { name: "setup-guide.md", icon: FileText, kind: "SETUP GUIDE" },
];

export function GptIntegrationPanel({
  accessToken,
  isMember = false,
}: {
  accessToken: string;
  isMember?: boolean;
}) {
  const { language, setLanguage, t } = useUiLanguage();
  const trial = useTrialStatus(accessToken);
  const skills = useProviderSkillSelection(accessToken);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const entitlementReady = isMember || trial.data?.status === "active";
  const skillQuery = skills.enabled.join(",");
  const kitFiles = [
    ...BASE_KIT_FILES.slice(0, 2),
    ...PROVIDER_SKILL_OPTIONS
      .filter((skill) => skills.enabled.includes(skill.id))
      .map((skill) => ({
        name: skill.filename,
        icon: FileText,
        kind: `${skill.label.toUpperCase()} SKILL`,
      })),
    ...BASE_KIT_FILES.slice(2),
  ];

  async function downloadFile(path: string, filename: string) {
    setError(null);
    try {
      const blob = await downloadGatewayFile(path, accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed");
    }
  }

  function downloadKit() {
    return downloadFile(
      `/gpt-integration/package?language=${language}&skills=${encodeURIComponent(skillQuery)}`,
      `mcp-gateway-gpt-kit-${language}.zip`,
    );
  }

  function downloadKitFile(filename: string) {
    return downloadFile(
      `/gpt-integration/file/${encodeURIComponent(filename)}?language=${language}&skills=${encodeURIComponent(skillQuery)}`,
      filename,
    );
  }

  const routingConvention = "Intent → Capability → MCP Service → MCP Tool → Arguments → Gateway Call";

  return (
    <div className="gpt-integration-layout cinematic-gpt-workbench">
      <div className="workbench-diagnostics">
        <div><span>KIT</span><strong>READY</strong><small>Instructions · Knowledge · Schema</small></div>
        <div><span>DISCOVERY</span><strong>DYNAMIC</strong><small>Runtime tool catalog</small></div>
        <div><span>ENTITLEMENT</span><strong>{entitlementReady ? "ACTIVE" : "SETUP ONLY"}</strong><small>Open ID execution boundary</small></div>
        <div><span>SKILLS</span><strong>{skills.enabled.length}</strong><small>Optional provider Knowledge</small></div>
      </div>

      <section className="card integration-hero-card integration-hero-card--cinematic">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">GPT INTEGRATION KIT</span>
            <h2>{t("Một Action. Dynamic MCP discovery.", "One Action. Dynamic MCP discovery.")}</h2>
          </div>
          <span className="status good"><ShieldCheck size={14} /> GATEWAY READY</span>
        </div>
        <p className="lead small">
          {t(
            "Kit cấu hình dạy Custom GPT tự nhận diện khi cần MCP, discovery service/tool/schema ở runtime và chỉ execute qua Gateway.",
            "The setup kit teaches Custom GPT to recognize when MCP is needed, discover services/tools/schemas at runtime, and execute only through Gateway.",
          )}
        </p>
        <div className="integration-hero-actions">
          <button onClick={() => void downloadKit()} type="button">
            <Download size={17} />{t("Tải GPT Integration Kit", "Download GPT Integration Kit")}
          </button>
          <span className={`status ${entitlementReady ? "good" : ""}`}>
            <KeyRound size={14} />
            {isMember
              ? "OPEN ID ACTIVE"
              : trial.data?.status === "active"
                ? "TRIAL ACTIVE"
                : "SETUP AVAILABLE"}
          </span>
          <div className="integration-language" aria-label={t("Ngôn ngữ kit", "Kit language")}>
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
              type="button"
            >
              EN
            </button>
            <button
              className={language === "vi" ? "active" : ""}
              onClick={() => setLanguage("vi")}
              type="button"
            >
              VI
            </button>
          </div>
        </div>
        {error ? <p className="notice error">{error}</p> : null}
      </section>

      <ProviderSkillSelector
        connectedIds={skills.connectedIds}
        enabled={skills.enabled}
        onToggle={skills.toggle}
      />

      <div className="integration-workbench">
        <div className="integration-workbench__main">
              <section className="card integration-files-card">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">BUNDLE CONTENTS</span>
                    <h2>{t("Tải cả kit hoặc từng file", "Download the kit or individual files")}</h2>
                  </div>
                  <span className="section-index">{kitFiles.length.toString().padStart(2, "0")} FILES</span>
                </div>
                <div className="integration-file-grid">
                  {kitFiles.map(({ name, icon: Icon, kind }) => (
                    <div className="integration-file" key={name}>
                      <span className="integration-file__icon"><Icon size={18} /></span>
                      <div>
                        <small>{kind}</small>
                        <code>{name}</code>
                      </div>
                      <button
                        aria-label={t(`Tải ${name}`, `Download ${name}`)}
                        className="file-download-button"
                        onClick={() => void downloadKitFile(name)}
                        title={t("Tải file", "Download file")}
                        type="button"
                      >
                        <Download size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="muted integration-footnote">
                  {t(
                    "Package không chứa Open ID, Gateway token hoặc provider credential của user.",
                    "The package never contains the user's Open ID, Gateway token, or provider credentials.",
                  )}
                </p>
              </section>

              <section className="integration-grid">
                <article className="card integration-step-card">
                  <span className="integration-step-card__number">01</span>
                  <span className="feature-icon"><Sparkles /></span>
                  <h3>{t("Instructions tối giản", "Minimal instructions")}</h3>
                  <p>
                    {t(
                      "Instructions chỉ giữ trigger + pointer tới Knowledge. Provider workflow nằm trong các skill Knowledge file đã bật.",
                      "Instructions keep only the trigger and Knowledge pointer. Provider workflows live in enabled skill Knowledge files.",
                    )}
                  </p>
                </article>

                <article className="card integration-step-card">
                  <span className="integration-step-card__number">02</span>
                  <span className="feature-icon"><Waypoints /></span>
                  <h3>{t("Knowledge giữ protocol", "Knowledge owns the protocol")}</h3>
                  <p>
                    {t(
                      "Gateway concepts, discovery flow, Open ID errors và safety rules nằm trong GPTS-MCP-GATEWAY-Knowledge.md thay vì làm Instructions phình to.",
                      "Gateway concepts, discovery flow, Open ID errors, and safety rules live in GPTS-MCP-GATEWAY-Knowledge.md instead of bloating Instructions.",
                    )}
                  </p>
                </article>
              </section>

              <section className="card routing-card">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">ROUTING CONVENTION</span>
                    <h2>{t("Protocol ổn định, catalog động", "Stable protocol, dynamic catalog")}</h2>
                  </div>
                  <button
                    className="secondary compact-button"
                    onClick={() => {
                      void navigator.clipboard.writeText(routingConvention);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1200);
                    }}
                    type="button"
                  >
                    {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                    {copied ? t("Đã sao chép", "Copied") : t("Sao chép", "Copy")}
                  </button>
                </div>
                <div className="routing-code">
                  <code>{routingConvention}</code>
                </div>
                <div className="routing-call-chain">
                  <span>listMcpServices</span>
                  <i>→</i>
                  <span>listMcpTools(service)</span>
                  <i>→</i>
                  <span>getMcpToolSchema</span>
                  <i>→</i>
                  <span>callMcpTool</span>
                </div>
              </section>

              <section className="card setup-guide-card">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">SETUP GUIDE</span>
                    <h2>{t("Cấu hình Custom GPT", "Configure your Custom GPT")}</h2>
                  </div>
                  <span className="status">4 STEPS</span>
                </div>
                <ol className="setup-steps">
                  <li>
                    <span>01</span>
                    <div><strong>{t("Thêm Instructions", "Add Instructions")}</strong><p>{t("Dùng nội dung instructions.md.", "Use the contents of instructions.md.")}</p></div>
                  </li>
                  <li>
                    <span>02</span>
                    <div><strong>{t("Upload Knowledge", "Upload Knowledge")}</strong><p>{t("Upload GPTS-MCP-GATEWAY-Knowledge.md.", "Upload GPTS-MCP-GATEWAY-Knowledge.md.")}</p></div>
                  </li>
                  <li>
                    <span>03</span>
                    <div><strong>{t("Import Action Schema", "Import Action Schema")}</strong><p>{t("Import openapi.yaml và cấu hình Bearer authentication.", "Import openapi.yaml and configure Bearer authentication.")}</p></div>
                  </li>
                  <li>
                    <span>04</span>
                    <div><strong>{t("Gắn Gateway Token", "Attach Gateway Token")}</strong><p>{t("Trial hoặc Member token đều resolve qua Open ID entitlement.", "Trial and Member tokens both resolve through Open ID entitlement.")}</p></div>
                  </li>
                </ol>
              </section>

        </div>

        <aside className="integration-inspector" aria-label="Gateway Inspector">
          <div className="integration-inspector__header">
            <div>
              <span className="eyebrow">GATEWAY INSPECTOR</span>
              <strong>Execution sandbox</strong>
            </div>
            <span className={`status ${entitlementReady ? "good" : ""}`}>
              {entitlementReady ? "AUTHORIZED" : "SETUP ONLY"}
            </span>
          </div>

          <div className="integration-inspector__body">
            <div className="integration-inspector__row">
              <span>intent</span>
              <code>external MCP action</code>
            </div>
            <div className="integration-inspector__row">
              <span>service</span>
              <code>stitch</code>
            </div>
            <div className="integration-inspector__row">
              <span>discovery</span>
              <code>listMcpTools</code>
            </div>
            <div className="integration-inspector__row">
              <span>schema</span>
              <code>getMcpToolSchema</code>
            </div>
            <div className="integration-inspector__row">
              <span>entitlement</span>
              <code className={entitlementReady ? "good" : ""}>
                {entitlementReady ? "ACTIVE" : "REQUIRED"}
              </code>
            </div>
            <div className="integration-inspector__row">
              <span>language</span>
              <code>{language.toUpperCase()}</code>
            </div>
          </div>

          <div className="integration-inspector__trace">
            <small>RUNTIME ROUTE</small>
            <code>Intent → Capability</code>
            <code>→ MCP Service → Tool</code>
            <code>→ Schema → Gateway Call</code>
          </div>
        </aside>
      </div>

      <section className="card entitlement-note-card">
        <KeyRound size={20} />
        <div>
          <strong>{t("Setup trước, entitlement khi execute", "Configure first, enforce entitlement on execution")}</strong>
          <p>
            {t(
              "User đã đăng nhập có thể tải kit và hoàn thành setup trước khi mua Open ID. MCP call chỉ được execute khi có active trial hoặc paid Open ID.",
              "Logged-in users can download the kit and finish setup before buying Open ID. MCP calls execute only with an active trial or paid Open ID.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
