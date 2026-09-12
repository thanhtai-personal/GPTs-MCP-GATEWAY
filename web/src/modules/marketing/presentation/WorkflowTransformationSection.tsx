import { ArrowRight, FileArchive, GitBranch, Github, Sparkles, WandSparkles } from "lucide-react";
import { createUiTranslator, type UiLanguage } from "@/shared/i18n/ui-language";
import "@/modules/marketing/presentation/workflow-transformation.css";

type Props = { language: UiLanguage };

export function WorkflowTransformationSection({ language }: Props) {
  const t = createUiTranslator(language);
  const beforeSteps = [
    t("Upload lại source ZIP", "Upload source ZIP again", "重新上传 source ZIP", "source ZIP 다시 업로드", "source ZIP を再アップロード"),
    t("Export / upload lại tham chiếu Stitch", "Export / upload Stitch references", "导出 / 上传 Stitch 参考", "Stitch 참조 내보내기 / 업로드", "Stitch の参照をエクスポート / アップロード"),
    t("Tự dựng lại context", "Rebuild context manually", "手动重建 context", "context 수동 재구성", "context を手動で再構築"),
  ];
  const afterSteps = [
    t("Discover Stitch + GitHub ở runtime", "Discover Stitch + GitHub at runtime", "在运行时发现 Stitch + GitHub", "런타임에 Stitch + GitHub 검색", "実行時に Stitch + GitHub を発見"),
    t("Đọc UI mới nhất và source hiện tại", "Inspect the latest UI and current source", "检查最新 UI 和当前 source", "최신 UI와 현재 source 확인", "最新 UI と現在の source を確認"),
    t("Implement và push trong một workflow", "Implement and push from one workflow", "在一个 workflow 中实现并 push", "하나의 workflow에서 구현하고 push", "1つの workflow で実装して push"),
  ];

  return (
    <section className="landing-section container workflow-transformation" id="workflow-transformation">
      <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
        <span className="eyebrow">{t("TỪ HANDOFF THỦ CÔNG ĐẾN MỘT PROMPT", "FROM MANUAL HANDOFFS TO ONE-PROMPT DELIVERY", "从手动交接到单提示交付", "수동 핸드오프에서 원프롬프트 전달로", "手動ハンドオフからワンプロンプト納品へ")}</span>
        <h2>{t("Trước đây phải gửi ZIP và design lại. Giờ GPT tự nối tool, đọc source và giao code.", "Before, you re-uploaded ZIPs and design context. Now GPT can connect tools, read source, and deliver code.", "以前需要反复上传 ZIP 和设计上下文。现在 GPT 可以连接工具、读取 source 并交付代码。", "예전에는 ZIP과 디자인 context를 다시 올려야 했습니다. 이제 GPT가 도구를 연결하고 source를 읽고 코드를 전달합니다.", "以前は ZIP とデザイン context を再アップロードしていました。今は GPT がツールを接続し、source を読み、コードを届けます。")}</h2>
        <p>{t("GPTs-MCP Gateway biến một chuỗi handoff thủ công thành một execution path có kiểm soát: GPT tự discovery provider, lấy UI mới nhất từ Stitch, đọc repository hiện tại và đẩy thay đổi trở lại GitHub.", "GPTs-MCP Gateway turns a manual handoff chain into one controlled execution path: GPT discovers providers, inspects the latest Stitch UI, reads the current repository, and sends changes back to GitHub.", "GPTs-MCP Gateway 将手动交接链变成受控执行路径：GPT 发现 Provider、检查最新 Stitch UI、读取当前仓库并把更改推回 GitHub。", "GPTs-MCP Gateway는 수동 핸드오프 체인을 하나의 제어된 실행 경로로 바꿉니다. GPT가 Provider를 찾고 최신 Stitch UI를 확인하며 현재 저장소를 읽고 변경 사항을 GitHub에 보냅니다.", "GPTs-MCP Gateway は手動ハンドオフの連鎖を1本の制御された実行経路に変えます。GPT が Provider を発見し、最新の Stitch UI を確認し、現在のリポジトリを読み、変更を GitHub に戻します。")}</p>
      </div>

      <div className="workflow-transformation__compare" data-reveal-group>
        <article className="workflow-story-card workflow-story-card--before">
          <header className="workflow-story-card__header"><div><span className="eyebrow">{t("TRƯỚC GPTs-MCP GATEWAY", "BEFORE GPTs-MCP GATEWAY", "使用 GPTs-MCP GATEWAY 之前", "GPTs-MCP GATEWAY 이전", "GPTs-MCP GATEWAY 導入前")}</span><h3>{t("Context đứt đoạn, handoff thủ công", "Broken context, manual handoffs", "Context 中断、手动交接", "context 단절, 수동 핸드오프", "context 分断、手動ハンドオフ")}</h3></div><span className="workflow-story-card__state workflow-story-card__state--bad">{t("THỦ CÔNG", "MANUAL", "手动", "수동", "手動")}</span></header>
          <div className="workflow-story-card__visual workflow-story-card__visual--chat" aria-hidden="true"><div className="workflow-fake-window__bar"><span>TTT Coder</span><small>{t("bàn giao context", "context handoff", "context 交接", "context 핸드오프", "context ハンドオフ")}</small></div><div className="workflow-chat-bubble"><FileArchive size={15} /><span>source-project.zip</span></div><div className="workflow-chat-prompt">{t("Đây là source mới nhất. Hãy đọc lại rồi tiếp tục phần UI từ Stitch...", "Here is the latest source. Re-read it, then continue the Stitch UI work...", "这是最新 source。请重新读取，然后继续 Stitch UI 工作…", "최신 source입니다. 다시 읽고 Stitch UI 작업을 계속하세요...", "これが最新の source です。読み直して Stitch UI 作業を続けてください…")}</div><div className="workflow-chat-status"><i /> {t("Đang dựng lại context từ file upload", "Rebuilding context from uploads", "正在从上传内容重建 context", "업로드에서 context 재구성 중", "アップロードから context を再構築中")}</div></div>
          <ul className="workflow-story-card__steps">{beforeSteps.map((step) => <li key={step}><span />{step}</li>)}</ul>
          <div className="workflow-story-card__result"><strong>{t("Mỗi lần context đứt là một lần bàn giao lại.", "Every context break becomes another handoff.", "每次 context 中断都意味着再次交接。", "context가 끊길 때마다 다시 핸드오프해야 합니다.", "context が切れるたびに再ハンドオフが必要です。")}</strong><small>ZIP → screenshots → explain → retry</small></div>
        </article>

        <article className="workflow-story-card workflow-story-card--after">
          <header className="workflow-story-card__header"><div><span className="eyebrow">{t("VỚI GPTs-MCP GATEWAY", "WITH GPTs-MCP GATEWAY", "使用 GPTs-MCP GATEWAY", "GPTs-MCP GATEWAY 사용", "GPTs-MCP GATEWAY 導入後")}</span><h3>{t("Một prompt, tool runtime, source thật", "One prompt, runtime tools, current source", "一个提示、运行时工具、当前 source", "하나의 프롬프트, 런타임 도구, 현재 source", "1つのプロンプト、実行時ツール、現在の source")}</h3></div><span className="workflow-story-card__state workflow-story-card__state--good">{t("ĐÃ KẾT NỐI", "CONNECTED", "已连接", "연결됨", "接続済み")}</span></header>
          <div className="workflow-story-card__visual workflow-story-card__visual--editor" aria-hidden="true"><div className="workflow-editor__sidebar"><strong>repo/</strong><span>.codex/</span><span>src/</span><span>package.json</span><span>README.md</span></div><div className="workflow-editor__main"><div className="workflow-editor__tabs"><span>config.toml</span><span className="active">task.md</span></div><code>[mcp_servers.stitch]</code><code>gateway = "connected"</code><code>permission = "read_write"</code><div className="workflow-editor__trace"><span><WandSparkles size={13} /> {t("Đã kiểm tra Stitch UI", "Stitch UI inspected", "已检查 Stitch UI", "Stitch UI 확인됨", "Stitch UI 確認済み")}</span><span><Github size={13} /> {t("Đã đọc repository", "Repository read", "已读取仓库", "저장소 읽음", "リポジトリ読込済み")}</span><span><GitBranch size={13} /> {t("Đã push thay đổi", "Changes pushed", "已推送更改", "변경 사항 push 완료", "変更を push 済み")}</span></div></div></div>
          <ul className="workflow-story-card__steps">{afterSteps.map((step) => <li key={step}><span />{step}</li>)}</ul>
          <div className="workflow-story-card__result workflow-story-card__result--good"><strong>{t("GPT làm việc trên runtime truth, không phải snapshot cũ.", "GPT works from runtime truth, not a stale snapshot.", "GPT 基于运行时事实工作，而不是过期快照。", "GPT는 오래된 스냅샷이 아니라 런타임 사실을 기준으로 작업합니다.", "GPT は古いスナップショットではなく実行時の事実を基準に作業します。")}</strong><small>prompt → discover → inspect → implement → push</small></div>
        </article>
      </div>

      <div className="workflow-transformation__bridge" data-reveal="fade-up"><div className="workflow-transformation__bridge-flow"><span><Sparkles size={14} /> Custom GPT</span><ArrowRight size={14} /><span>GPTs-MCP Gateway</span><ArrowRight size={14} /><span>Stitch + GitHub</span><ArrowRight size={14} /><strong>{t("Code đã cập nhật", "Updated code", "已更新代码", "업데이트된 코드", "更新済みコード")}</strong></div><p>{t("Gateway không biến GPT thành một script hard-code. Nó cho GPT discover đúng capability ở runtime rồi thực thi qua một boundary duy nhất.", "The Gateway does not turn GPT into a hard-coded script. It lets GPT discover the right runtime capability and execute through one controlled boundary.", "Gateway 不会把 GPT 变成硬编码脚本。它让 GPT 在运行时发现正确能力，并通过一个受控边界执行。", "Gateway는 GPT를 하드코딩된 스크립트로 만들지 않습니다. GPT가 런타임에 올바른 기능을 찾고 하나의 제어된 경계를 통해 실행하게 합니다.", "Gateway は GPT をハードコードされたスクリプトにはしません。GPT が実行時に適切な capability を発見し、1つの制御された boundary を通じて実行します。")}</p></div>
    </section>
  );
}
