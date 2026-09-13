import { ArrowRight, FileArchive, GitBranch, Github, Sparkles, WandSparkles } from "lucide-react";
import { createUiTranslator, type UiLanguage } from "@/shared/i18n/ui-language";
import "@/modules/marketing/presentation/workflow-transformation.css";

type Props = { language: UiLanguage };

export function WorkflowTransformationSection({ language }: Props) {
  const t = createUiTranslator(language);
  const beforeSteps = [
    t("Tự chọn từng MCP tool", "Manually choose every MCP tool", "手动选择每个 MCP 工具", "각 MCP 도구를 직접 선택", "各 MCP ツールを手動で選択"),
    t("Tự nối output giữa nhiều provider", "Manually bridge output across providers", "手动衔接多个 Provider 的输出", "여러 Provider의 출력을 수동으로 연결", "複数 Provider の出力を手動でつなぐ"),
    t("Tự kiểm tra xem task đã thực sự xong chưa", "Manually decide whether the job is actually done", "手动判断任务是否真正完成", "작업이 실제로 끝났는지 직접 판단", "仕事が本当に完了したか手動で判断"),
  ];
  const afterSteps = [
    t("Load Gateway Skill phù hợp với goal", "Load the Gateway Skill relevant to the goal", "加载与目标相关的 Gateway Skill", "목표에 맞는 Gateway Skill 로드", "目標に合う Gateway Skill を読み込む"),
    t("Discover service, tool và schema ở runtime", "Discover services, tools, and schemas at runtime", "运行时发现服务、工具和 schema", "런타임에 서비스, 도구, schema 검색", "実行時に service・tool・schema を発見"),
    t("Thực thi, validate và giao outcome có thể review", "Execute, validate, and deliver a reviewable outcome", "执行、验证并交付可审查的结果", "실행, 검증 후 리뷰 가능한 결과 전달", "実行・検証し、レビュー可能な成果を届ける"),
  ];

  return (
    <section className="landing-section container workflow-transformation" id="workflow-transformation">
      <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
        <span className="eyebrow">{t("TỪ TOOL ACCESS ĐẾN EXPERT EXECUTION", "FROM TOOL ACCESS TO EXPERT EXECUTION", "从工具访问到专家级执行", "도구 접근에서 전문가 실행으로", "ツールアクセスから専門的な実行へ")}</span>
        <h2>{t("MCP cho GPT capability. Gateway Skills dạy GPT cách dùng chúng để hoàn thành cả công việc.", "MCP gives your GPT capabilities. Gateway Skills teach it how to use them to finish the whole job.", "MCP 为 GPT 提供能力。Gateway Skills 教会 GPT 如何组合这些能力完成整个工作。", "MCP는 GPT에 기능을 제공합니다. Gateway Skills는 그 기능을 조합해 전체 작업을 끝내는 방법을 안내합니다.", "MCP は GPT に能力を与えます。Gateway Skills は、その能力を組み合わせて仕事を完了する方法を教えます。")}</h2>
        <p>{t("Thay vì biến người dùng thành người điều phối MCP, Gateway giữ workflow ở cấp goal: chọn guidance phù hợp, lấy runtime truth, phối hợp provider cần thiết và chỉ báo hoàn tất khi outcome thực sự đạt được hoặc còn blocker rõ ràng.", "Instead of making you orchestrate MCP calls yourself, the Gateway keeps work at the goal level: select the right guidance, use runtime truth, compose the providers that matter, and report completion only when the requested outcome is actually reached or a real blocker remains.", "Gateway 不要求用户亲自编排 MCP 调用，而是以目标为中心：选择正确 guidance、获取 runtime truth、组合所需 Provider，并只在真正达到结果或出现明确 blocker 时报告完成。", "Gateway는 사용자가 MCP 호출을 직접 조율하게 하지 않습니다. 목표 수준에서 올바른 guidance를 선택하고 runtime truth를 사용해 필요한 Provider를 조합하며, 실제 결과를 달성했거나 명확한 blocker가 남았을 때만 완료 상태를 보고합니다.", "Gateway はユーザーに MCP 呼び出しの手動オーケストレーションを求めません。目標単位で適切な guidance を選び、runtime truth を使って必要な Provider を組み合わせ、成果が実際に達成された時か明確な blocker が残る時だけ完了を報告します。")}</p>
      </div>

      <div className="workflow-transformation__compare" data-reveal-group>
        <article className="workflow-story-card workflow-story-card--before">
          <header className="workflow-story-card__header"><div><span className="eyebrow">{t("CHỈ CÓ TOOL ACCESS", "TOOL ACCESS ALONE", "只有工具访问", "도구 접근만 있는 경우", "ツールアクセスだけの場合")}</span><h3>{t("Có nhiều tool, nhưng bạn vẫn phải tự điều phối workflow", "Plenty of tools, but you still orchestrate the workflow", "工具很多，但仍需自行编排 workflow", "도구는 많지만 workflow는 직접 조율해야 합니다", "ツールは多くても workflow は自分で組み立てる必要があります")}</h3></div><span className="workflow-story-card__state workflow-story-card__state--bad">{t("THỦ CÔNG", "MANUAL", "手动", "수동", "手動")}</span></header>
          <div className="workflow-story-card__visual workflow-story-card__visual--chat" aria-hidden="true"><div className="workflow-fake-window__bar"><span>Custom GPT</span><small>{t("tool-by-tool handoff", "tool-by-tool handoff", "逐工具交接", "도구별 핸드오프", "ツール単位のハンドオフ")}</small></div><div className="workflow-chat-bubble"><FileArchive size={15} /><span>design → repo → deploy</span></div><div className="workflow-chat-prompt">{t("Dùng tool nào trước? Output này chuyển sang provider nào? Đã validate chưa?", "Which tool first? Which provider gets this output? Has the result actually been validated?", "先用哪个工具？这个输出交给哪个 Provider？结果真的验证了吗？", "어떤 도구부터? 이 출력은 어느 Provider로? 결과는 실제로 검증됐나?", "どのツールから？この出力はどの Provider へ？結果は本当に検証済み？")}</div><div className="workflow-chat-status"><i /> {t("Người dùng đang điều phối workflow", "User is orchestrating the workflow", "用户正在编排 workflow", "사용자가 workflow를 조율 중", "ユーザーが workflow を組み立て中")}</div></div>
          <ul className="workflow-story-card__steps">{beforeSteps.map((step) => <li key={step}><span />{step}</li>)}</ul>
          <div className="workflow-story-card__result"><strong>{t("Nhiều MCP hơn không tự động tạo ra execution tốt hơn.", "More MCPs do not automatically produce better execution.", "更多 MCP 并不会自动带来更好的执行。", "MCP가 많다고 실행 품질이 자동으로 좋아지지는 않습니다.", "MCP が増えても実行品質が自動的に上がるわけではありません。")}</strong><small>tools ≠ workflow ≠ outcome</small></div>
        </article>

        <article className="workflow-story-card workflow-story-card--after">
          <header className="workflow-story-card__header"><div><span className="eyebrow">{t("VỚI GATEWAY SKILLS", "WITH GATEWAY SKILLS", "使用 GATEWAY SKILLS", "GATEWAY SKILLS 사용", "GATEWAY SKILLS を利用")}</span><h3>{t("Một goal, guidance đúng, runtime truth, outcome rõ ràng", "One goal, the right guidance, runtime truth, a clear outcome", "一个目标、正确 guidance、runtime truth、清晰结果", "하나의 목표, 올바른 guidance, runtime truth, 명확한 결과", "1つの目標、適切な guidance、runtime truth、明確な成果")}</h3></div><span className="workflow-story-card__state workflow-story-card__state--good">{t("ORCHESTRATED", "ORCHESTRATED", "已编排", "오케스트레이션됨", "オーケストレーション")}</span></header>
          <div className="workflow-story-card__visual workflow-story-card__visual--editor" aria-hidden="true"><div className="workflow-editor__sidebar"><strong>goal/</strong><span>skills/</span><span>services/</span><span>runtime/</span><span>validation/</span></div><div className="workflow-editor__main"><div className="workflow-editor__tabs"><span>goal.md</span><span className="active">execution.trace</span></div><code>skill = "github + stitch"</code><code>runtime = "discovered"</code><code>completion = "outcome-based"</code><div className="workflow-editor__trace"><span><WandSparkles size={13} /> {t("Skill guidance đã tải", "Skill guidance loaded", "Skill guidance 已加载", "Skill guidance 로드됨", "Skill guidance 読込済み")}</span><span><Github size={13} /> {t("Runtime tools đã discovery", "Runtime tools discovered", "Runtime tools 已发现", "Runtime tools 검색됨", "Runtime tools 発見済み")}</span><span><GitBranch size={13} /> {t("Thay đổi đi qua branch + PR", "Changes flow through branch + PR", "更改通过 branch + PR", "변경 사항은 branch + PR로 전달", "変更は branch + PR を経由")}</span></div></div></div>
          <ul className="workflow-story-card__steps">{afterSteps.map((step) => <li key={step}><span />{step}</li>)}</ul>
          <div className="workflow-story-card__result workflow-story-card__result--good"><strong>{t("Tối ưu cho depth of execution, không phải số lượng MCP trên logo wall.", "Optimize for depth of execution, not the size of an MCP logo wall.", "优化执行深度，而不是 MCP logo wall 的数量。", "MCP 로고 수가 아니라 실행의 깊이를 최적화합니다.", "MCP のロゴ数ではなく、実行の深さを最適化します。")}</strong><small>goal → skill → discover → execute → validate → outcome</small></div>
        </article>
      </div>

      <div className="workflow-transformation__bridge" data-reveal="fade-up"><div className="workflow-transformation__bridge-flow"><span><Sparkles size={14} /> {t("Mục tiêu người dùng", "User goal", "用户目标", "사용자 목표", "ユーザー目標")}</span><ArrowRight size={14} /><span>Gateway Skills</span><ArrowRight size={14} /><span>Runtime MCP</span><ArrowRight size={14} /><strong>{t("Outcome đã kiểm chứng", "Verified outcome", "已验证结果", "검증된 결과", "検証済み成果")}</strong></div><p>{t("Gateway Skills không thay thế MCP runtime discovery. Skill chỉ hướng dẫn cách dùng capability tốt; service, tool, schema và permission thực tế vẫn được lấy ở runtime qua Gateway.", "Gateway Skills do not replace MCP runtime discovery. Skills teach the GPT how to use capabilities well; the actual services, tools, schemas, and permissions still come from runtime Gateway discovery.", "Gateway Skills 不替代 MCP runtime discovery。Skill 负责指导如何正确使用能力；实际 service、tool、schema 和 permission 仍由 Gateway 在运行时发现。", "Gateway Skills는 MCP runtime discovery를 대체하지 않습니다. Skill은 capability를 잘 사용하는 방법을 안내하고 실제 service, tool, schema, permission은 Gateway가 런타임에 발견합니다.", "Gateway Skills は MCP runtime discovery を置き換えません。Skill は capability の適切な使い方を示し、実際の service・tool・schema・permission は Gateway が実行時に取得します。")}</p></div>
    </section>
  );
}
