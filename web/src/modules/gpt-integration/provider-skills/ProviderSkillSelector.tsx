import { BookOpenCheck, FileText, Github, PanelsTopLeft, Sparkles, Table2 } from "lucide-react";
import {
  PROVIDER_SKILL_OPTIONS,
  type ProviderSkillId,
} from "@/modules/gpt-integration/provider-skills/provider-skill.types";
import { useUiLanguage } from "@/shared/i18n/ui-language";

function SkillIcon({ id }: { id: ProviderSkillId }) {
  if (id === "github") return <Github size={18} />;
  if (id === "stitch") return <Sparkles size={18} />;
  if (id === "figma") return <PanelsTopLeft size={18} />;
  if (id === "google-docs") return <FileText size={18} />;
  if (id === "google-sheets") return <Table2 size={18} />;
  return <BookOpenCheck size={18} />;
}

export function ProviderSkillSelector({
  connectedIds,
  enabled,
  onToggle,
}: {
  connectedIds: Set<string>;
  enabled: ProviderSkillId[];
  onToggle: (id: ProviderSkillId) => void;
}) {
  const { t } = useUiLanguage();

  return (
    <section className="card provider-skill-selector">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PROVIDER KNOWLEDGE SKILLS</span>
          <h2>{t("Chỉ đóng gói skill bạn bật", "Package only the skills you enable")}</h2>
        </div>
        <span className="section-index">{enabled.length} ENABLED</span>
      </div>

      <p className="muted">
        {t(
          "Instructions giữ tối giản. Mỗi provider skill là một Knowledge file riêng và chỉ xuất hiện trong GPT Integration Kit khi được bật.",
          "Instructions stay minimal. Each provider skill is a separate Knowledge file and appears in the GPT Integration Kit only when enabled.",
        )}
      </p>

      <div className="provider-skill-grid">
        {PROVIDER_SKILL_OPTIONS.map((skill) => {
          const active = enabled.includes(skill.id);
          const connected = connectedIds.has(skill.id);

          return (
            <button
              aria-pressed={active}
              className={`provider-skill-card ${active ? "active" : ""}`}
              key={skill.id}
              onClick={() => onToggle(skill.id)}
              type="button"
            >
              <span className="provider-skill-card__icon">
                <SkillIcon id={skill.id} />
              </span>
              <span className="provider-skill-card__body">
                <strong>{skill.label}</strong>
                <small>{t(skill.description.vi, skill.description.en)}</small>
              </span>
              <span className={`status ${connected ? "good" : ""}`}>
                {connected ? "CONNECTED" : "NOT CONNECTED"}
              </span>
              <span className={`provider-skill-card__switch ${active ? "active" : ""}`}>
                <i />
              </span>
            </button>
          );
        })}
      </div>

      <p className="integration-footnote">
        {t(
          "Skill có thể bật trước khi provider được connect. Runtime vẫn enforce connection, Open ID và provider permissions.",
          "A skill can be enabled before its provider is connected. Runtime still enforces connection, Open ID, and provider permissions.",
        )}
      </p>
    </section>
  );
}
