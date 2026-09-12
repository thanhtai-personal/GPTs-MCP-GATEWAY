import { ArrowRight, FileArchive, GitBranch, Github, Sparkles, WandSparkles } from "lucide-react";
import "@/modules/marketing/presentation/workflow-transformation.css";

type Props = { language: "vi" | "en" };

const beforeSteps = [
  "Upload source ZIP again",
  "Export / upload Stitch references",
  "Rebuild context manually",
];

const afterSteps = [
  "Discover Stitch + GitHub at runtime",
  "Inspect the latest UI and current source",
  "Implement and push from one workflow",
];

export function WorkflowTransformationSection({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);

  return (
    <section className="landing-section container workflow-transformation" id="workflow-transformation">
      <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
        <span className="eyebrow">FROM MANUAL HANDOFFS TO ONE-PROMPT DELIVERY</span>
        <h2>
          {t(
            "Trước đây phải gửi ZIP và design lại. Giờ GPT tự nối tool, đọc source và giao code.",
            "Before, you re-uploaded ZIPs and design context. Now GPT can connect tools, read source, and deliver code.",
          )}
        </h2>
        <p>
          {t(
            "GPTs-MCP Gateway biến một chuỗi handoff thủ công thành một execution path có kiểm soát: GPT tự discovery provider, lấy UI mới nhất từ Stitch, đọc repository hiện tại và đẩy thay đổi trở lại GitHub.",
            "GPTs-MCP Gateway turns a manual handoff chain into one controlled execution path: GPT discovers providers, inspects the latest Stitch UI, reads the current repository, and sends changes back to GitHub.",
          )}
        </p>
      </div>

      <div className="workflow-transformation__compare" data-reveal-group>
        <article className="workflow-story-card workflow-story-card--before">
          <header className="workflow-story-card__header">
            <div>
              <span className="eyebrow">BEFORE GPTs-MCP GATEWAY</span>
              <h3>{t("Context đứt đoạn, handoff thủ công", "Broken context, manual handoffs")}</h3>
            </div>
            <span className="workflow-story-card__state workflow-story-card__state--bad">MANUAL</span>
          </header>

          <div className="workflow-story-card__visual workflow-story-card__visual--chat" aria-hidden="true">
            <div className="workflow-fake-window__bar">
              <span>TTT Coder</span>
              <small>context handoff</small>
            </div>
            <div className="workflow-chat-bubble">
              <FileArchive size={15} />
              <span>source-project.zip</span>
            </div>
            <div className="workflow-chat-prompt">
              {t(
                "Đây là source mới nhất. Hãy đọc lại rồi tiếp tục phần UI từ Stitch...",
                "Here is the latest source. Re-read it, then continue the Stitch UI work...",
              )}
            </div>
            <div className="workflow-chat-status">
              <i /> {t("Rebuilding context from uploads", "Rebuilding context from uploads")}
            </div>
          </div>

          <ul className="workflow-story-card__steps">
            {beforeSteps.map((step) => <li key={step}><span />{step}</li>)}
          </ul>

          <div className="workflow-story-card__result">
            <strong>{t("Mỗi lần context đứt là một lần bàn giao lại.", "Every context break becomes another handoff.")}</strong>
            <small>{t("ZIP → screenshots → explain → retry", "ZIP → screenshots → explain → retry")}</small>
          </div>
        </article>

        <article className="workflow-story-card workflow-story-card--after">
          <header className="workflow-story-card__header">
            <div>
              <span className="eyebrow">WITH GPTs-MCP GATEWAY</span>
              <h3>{t("Một prompt, tool runtime, source thật", "One prompt, runtime tools, current source")}</h3>
            </div>
            <span className="workflow-story-card__state workflow-story-card__state--good">CONNECTED</span>
          </header>

          <div className="workflow-story-card__visual workflow-story-card__visual--editor" aria-hidden="true">
            <div className="workflow-editor__sidebar">
              <strong>repo/</strong>
              <span>.codex/</span>
              <span>src/</span>
              <span>package.json</span>
              <span>README.md</span>
            </div>
            <div className="workflow-editor__main">
              <div className="workflow-editor__tabs"><span>config.toml</span><span className="active">task.md</span></div>
              <code>[mcp_servers.stitch]</code>
              <code>gateway = "connected"</code>
              <code>permission = "read_write"</code>
              <div className="workflow-editor__trace">
                <span><WandSparkles size={13} /> Stitch UI inspected</span>
                <span><Github size={13} /> Repository read</span>
                <span><GitBranch size={13} /> Changes pushed</span>
              </div>
            </div>
          </div>

          <ul className="workflow-story-card__steps">
            {afterSteps.map((step) => <li key={step}><span />{step}</li>)}
          </ul>

          <div className="workflow-story-card__result workflow-story-card__result--good">
            <strong>{t("GPT làm việc trên runtime truth, không phải snapshot cũ.", "GPT works from runtime truth, not a stale snapshot.")}</strong>
            <small>prompt → discover → inspect → implement → push</small>
          </div>
        </article>
      </div>

      <div className="workflow-transformation__bridge" data-reveal="fade-up">
        <div className="workflow-transformation__bridge-flow">
          <span><Sparkles size={14} /> Custom GPT</span>
          <ArrowRight size={14} />
          <span>GPTs-MCP Gateway</span>
          <ArrowRight size={14} />
          <span>Stitch + GitHub</span>
          <ArrowRight size={14} />
          <strong>{t("Code đã cập nhật", "Updated code")}</strong>
        </div>
        <p>
          {t(
            "Gateway không biến GPT thành một script hard-code. Nó cho GPT discover đúng capability ở runtime rồi thực thi qua một boundary duy nhất.",
            "The Gateway does not turn GPT into a hard-coded script. It lets GPT discover the right runtime capability and execute through one controlled boundary.",
          )}
        </p>
      </div>
    </section>
  );
}
