import { CheckCircle2, Copy, Download, FileCode2, FileText, KeyRound, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { useState } from "react";
import { GptSetupWalkthrough } from "@/modules/gpt-integration/presentation/GptSetupWalkthrough";
import { useTrialStatus } from "@/modules/open-id/queries/open-id.queries";
import { downloadGatewayFile } from "@/shared/api/gateway-api";
import { useUiLanguage } from "@/shared/i18n/ui-language";

const KIT_FILES = [
  { name: "instructions.md", icon: FileText, kind: "INSTRUCTIONS" },
  { name: "GPTS-MCP-GATEWAY-Knowledge.md", icon: FileText, kind: "KNOWLEDGE" },
  { name: "openapi.yaml", icon: FileCode2, kind: "ACTION SCHEMA" },
  { name: "setup-guide.md", icon: FileText, kind: "SETUP GUIDE" },
];

export function GptIntegrationPanel({ accessToken, isMember = false }: { accessToken: string; isMember?: boolean }) {
  const { language, t } = useUiLanguage();
  const trial = useTrialStatus(accessToken);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const entitlementReady = isMember || trial.data?.status === "active";
  const kitLanguage = language === "vi" ? "vi" : "en";

  async function downloadFile(path: string, filename: string) {
    setError(null);
    try {
      const blob = await downloadGatewayFile(path, accessToken);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : t("Tải xuống thất bại", "Download failed", "下载失败", "다운로드 실패", "ダウンロードに失敗しました")); }
  }

  function downloadKit() { return downloadFile(`/gpt-integration/package?language=${kitLanguage}`, `mcp-gateway-gpt-kit-${kitLanguage}.zip`); }
  function downloadKitFile(filename: string) { return downloadFile(`/gpt-integration/file/${encodeURIComponent(filename)}?language=${kitLanguage}`, filename); }
  const routingConvention = "Intent → Gateway Skill → MCP Service → MCP Tool → Arguments → Gateway Call";

  return (
    <div className="gpt-integration-layout cinematic-gpt-workbench">
      <div className="workbench-diagnostics">
        <div><span>KIT</span><strong>{t("SẴN SÀNG", "READY", "就绪", "준비됨", "準備完了")}</strong><small>Instructions · Knowledge · Schema</small></div>
        <div><span>DISCOVERY</span><strong>{t("ĐỘNG", "DYNAMIC", "动态", "동적", "動的")}</strong><small>{t("Catalog tool runtime", "Runtime tool catalog", "运行时工具目录", "런타임 도구 카탈로그", "実行時ツールカタログ")}</small></div>
        <div><span>ENTITLEMENT</span><strong>{entitlementReady ? t("ĐANG HOẠT ĐỘNG", "ACTIVE", "有效", "활성", "有効") : t("CHỈ SETUP", "SETUP ONLY", "仅设置", "설정 전용", "設定のみ")}</strong><small>{t("Ranh giới thực thi Open ID", "Open ID execution boundary", "Open ID 执行边界", "Open ID 실행 경계", "Open ID 実行境界")}</small></div>
        <div><span>SKILLS</span><strong>{t("THEO NHU CẦU", "ON DEMAND", "按需", "온디맨드", "オンデマンド")}</strong><small>{t("Tải từ Gateway", "Loaded from Gateway", "从 Gateway 加载", "Gateway에서 로드", "Gateway から読み込み")}</small></div>
      </div>

      <section className="card integration-hero-card integration-hero-card--cinematic">
        <div className="panel-heading"><div><span className="eyebrow">GPT INTEGRATION KIT</span><h2>{t("Một Action. Dynamic MCP discovery.", "One Action. Dynamic MCP discovery.", "一个 Action，动态 MCP discovery。", "하나의 Action, 동적 MCP discovery.", "1つの Action、動的 MCP discovery。")}</h2></div><span className="status good"><ShieldCheck size={14} /> {t("GATEWAY SẴN SÀNG", "GATEWAY READY", "GATEWAY 就绪", "GATEWAY 준비됨", "GATEWAY 準備完了")}</span></div>
        <p className="lead small">{t("Kit cấu hình dạy Custom GPT tự nhận diện khi cần MCP, lấy provider skill từ Gateway khi cần và discovery service/tool/schema ở runtime.", "The setup kit teaches Custom GPT to recognize when MCP is needed, fetch provider skills from Gateway on demand, and discover services/tools/schemas at runtime.", "配置套件让 Custom GPT 识别何时需要 MCP，按需从 Gateway 获取 Provider skill，并在运行时发现 service/tool/schema。", "설정 키트는 Custom GPT가 MCP가 필요한 시점을 인식하고 필요할 때 Gateway에서 Provider skill을 가져오며 런타임에 service/tool/schema를 검색하도록 합니다.", "設定キットは Custom GPT に MCP が必要なタイミングを認識させ、必要時に Gateway から Provider skill を取得し、実行時に service/tool/schema を発見させます。")}</p>
        <div className="integration-hero-actions"><button onClick={() => void downloadKit()} type="button"><Download size={17} />{t("Tải GPT Integration Kit", "Download GPT Integration Kit")}</button><span className={`status ${entitlementReady ? "good" : ""}`}><KeyRound size={14} />{isMember ? t("OPEN ID ĐANG HOẠT ĐỘNG", "OPEN ID ACTIVE", "OPEN ID 有效", "OPEN ID 활성", "OPEN ID 有効") : trial.data?.status === "active" ? t("TRIAL ĐANG HOẠT ĐỘNG", "TRIAL ACTIVE", "TRIAL 有效", "TRIAL 활성", "TRIAL 有効") : t("CÓ THỂ SETUP", "SETUP AVAILABLE", "可进行设置", "설정 가능", "設定可能")}</span></div>
        {error ? <p className="notice error">{error}</p> : null}
      </section>

      <GptSetupWalkthrough />

      <div className="integration-workbench"><div className="integration-workbench__main">
        <section className="card integration-files-card"><div className="panel-heading"><div><span className="eyebrow">{t("NỘI DUNG BUNDLE", "BUNDLE CONTENTS", "BUNDLE 内容", "BUNDLE 내용", "BUNDLE 内容")}</span><h2>{t("Tải cả kit hoặc từng file", "Download the kit or individual files")}</h2></div><span className="section-index">{KIT_FILES.length.toString().padStart(2, "0")} {t("FILE", "FILES", "文件", "파일", "ファイル")}</span></div><div className="integration-file-grid">{KIT_FILES.map(({ name, icon: Icon, kind }) => <div className="integration-file" key={name}><span className="integration-file__icon"><Icon size={18} /></span><div><small>{kind}</small><code>{name}</code></div><button aria-label={t(`Tải ${name}`, `Download ${name}`, `下载 ${name}`, `${name} 다운로드`, `${name} をダウンロード`)} className="file-download-button" onClick={() => void downloadKitFile(name)} title={t("Tải file", "Download file", "下载文件", "파일 다운로드", "ファイルをダウンロード")} type="button"><Download size={15} /></button></div>)}</div><p className="muted integration-footnote">{t("Package chỉ chứa một Knowledge file chung. Provider skills được build trong Gateway và lấy qua Action khi cần.", "The package contains one shared Knowledge file. Provider skills are built into Gateway and fetched through the Action on demand.", "Package 只包含一个共享 Knowledge 文件。Provider skills 内置于 Gateway，并通过 Action 按需获取。", "Package에는 하나의 공용 Knowledge 파일만 포함됩니다. Provider skills는 Gateway에 내장되어 있으며 필요할 때 Action을 통해 가져옵니다.", "Package には共有 Knowledge ファイルが1つだけ含まれます。Provider skills は Gateway に組み込まれ、必要時に Action 経由で取得されます。")}</p></section>

        <section className="integration-grid"><article className="card integration-step-card"><span className="integration-step-card__number">01</span><span className="feature-icon"><Sparkles /></span><h3>{t("Instructions tối giản", "Minimal instructions")}</h3><p>{t("Instructions chỉ giữ trigger và quy tắc lấy skill. Provider workflow được tải từ Gateway khi task thực sự cần.", "Instructions keep only the trigger and skill-fetch rule. Provider workflows are loaded from Gateway only when the task needs them.", "Instructions 只保留触发器和 skill 获取规则；仅在任务需要时从 Gateway 加载 Provider workflow。", "Instructions는 트리거와 skill 가져오기 규칙만 유지하며 작업에 필요할 때만 Gateway에서 Provider workflow를 로드합니다.", "Instructions はトリガーと skill 取得ルールだけを保持し、タスクで必要な時だけ Gateway から Provider workflow を読み込みます。")}</p></article><article className="card integration-step-card"><span className="integration-step-card__number">02</span><span className="feature-icon"><Waypoints /></span><h3>{t("Knowledge giữ protocol", "Knowledge owns the protocol")}</h3><p>{t("Gateway concepts, discovery flow, Open ID errors và safety rules nằm trong một Knowledge file chung; skill chuyên biệt ở server.", "Gateway concepts, discovery flow, Open ID errors, and safety rules stay in one shared Knowledge file; specialized skills live on the server.", "Gateway 概念、discovery flow、Open ID 错误和安全规则保存在一个共享 Knowledge 文件中；专用 skill 位于服务器。", "Gateway 개념, discovery flow, Open ID 오류 및 안전 규칙은 하나의 공용 Knowledge 파일에 있고 전문 skill은 서버에 있습니다.", "Gateway の概念、discovery flow、Open ID エラー、安全ルールは1つの共有 Knowledge ファイルにあり、専門 skill はサーバー側にあります。")}</p></article></section>

        <section className="card routing-card"><div className="panel-heading"><div><span className="eyebrow">{t("QUY ƯỚC ĐỊNH TUYẾN", "ROUTING CONVENTION", "路由约定", "라우팅 규칙", "ルーティング規約")}</span><h2>{t("Protocol ổn định, catalog động", "Stable protocol, dynamic catalog")}</h2></div><button className="secondary compact-button" onClick={() => { void navigator.clipboard.writeText(routingConvention); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} type="button">{copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}{copied ? t("Đã sao chép", "Copied") : t("Sao chép", "Copy")}</button></div><div className="routing-code"><code>{routingConvention}</code></div><div className="routing-call-chain"><span>getGatewaySkill</span><i>→</i><span>listMcpServices</span><i>→</i><span>listMcpTools(service)</span><i>→</i><span>getMcpToolSchema</span><i>→</i><span>callMcpTool</span></div></section>

        <section className="card setup-guide-card"><div className="panel-heading"><div><span className="eyebrow">{t("HƯỚNG DẪN SETUP", "SETUP GUIDE", "设置指南", "설정 가이드", "セットアップガイド")}</span><h2>{t("Cấu hình Custom GPT", "Configure your Custom GPT")}</h2></div><span className="status">4 {t("BƯỚC", "STEPS", "步", "단계", "ステップ")}</span></div><ol className="setup-steps"><li><span>01</span><div><strong>{t("Thêm Instructions", "Add Instructions", "添加 Instructions", "Instructions 추가", "Instructions を追加")}</strong><p>{t("Dùng nội dung instructions.md.", "Use the contents of instructions.md.", "使用 instructions.md 的内容。", "instructions.md 내용을 사용하세요.", "instructions.md の内容を使用します。")}</p></div></li><li><span>02</span><div><strong>{t("Upload Knowledge", "Upload Knowledge", "上传 Knowledge", "Knowledge 업로드", "Knowledge をアップロード")}</strong><p>{t("Chỉ upload GPTS-MCP-GATEWAY-Knowledge.md.", "Upload only GPTS-MCP-GATEWAY-Knowledge.md.", "仅上传 GPTS-MCP-GATEWAY-Knowledge.md。", "GPTS-MCP-GATEWAY-Knowledge.md만 업로드하세요.", "GPTS-MCP-GATEWAY-Knowledge.md のみアップロードします。")}</p></div></li><li><span>03</span><div><strong>{t("Import Action Schema", "Import Action Schema", "导入 Action Schema", "Action Schema 가져오기", "Action Schema をインポート")}</strong><p>{t("Import openapi.yaml và cấu hình Bearer authentication.", "Import openapi.yaml and configure Bearer authentication.", "导入 openapi.yaml 并配置 Bearer authentication。", "openapi.yaml을 가져오고 Bearer authentication을 구성하세요.", "openapi.yaml をインポートし Bearer authentication を設定します。")}</p></div></li><li><span>04</span><div><strong>{t("Gắn Gateway Token", "Attach Gateway Token", "绑定 Gateway Token", "Gateway Token 연결", "Gateway Token を設定")}</strong><p>{t("Trial hoặc Member token đều resolve qua Open ID entitlement.", "Trial and Member tokens both resolve through Open ID entitlement.", "Trial 和 Member token 都通过 Open ID entitlement 解析。", "Trial 및 Member token 모두 Open ID entitlement를 통해 확인됩니다.", "Trial と Member token はどちらも Open ID entitlement を通じて解決されます。")}</p></div></li></ol></section>
      </div>

      <aside className="integration-inspector" aria-label="Gateway Inspector"><div className="integration-inspector__header" style={{ flexWrap: "wrap", gap: "0.75rem" }}><div style={{ display: "grid", gap: "0.2rem", minWidth: 0 }}><span className="eyebrow">GATEWAY INSPECTOR</span><strong style={{ display: "block", lineHeight: 1.2 }}>{t("Sandbox thực thi", "Execution sandbox", "执行沙箱", "실행 샌드박스", "実行サンドボックス")}</strong></div><span className={`status ${entitlementReady ? "good" : ""}`}>{entitlementReady ? t("ĐÃ CẤP QUYỀN", "AUTHORIZED", "已授权", "승인됨", "認可済み") : t("CHỈ SETUP", "SETUP ONLY", "仅设置", "설정 전용", "設定のみ")}</span></div><div className="integration-inspector__body"><div className="integration-inspector__row"><span>intent</span><code>external MCP action</code></div><div className="integration-inspector__row"><span>skill</span><code>gateway on-demand</code></div><div className="integration-inspector__row"><span>service</span><code>stitch</code></div><div className="integration-inspector__row"><span>discovery</span><code>listMcpTools</code></div><div className="integration-inspector__row"><span>schema</span><code>getMcpToolSchema</code></div><div className="integration-inspector__row"><span>entitlement</span><code className={entitlementReady ? "good" : ""}>{entitlementReady ? "ACTIVE" : "REQUIRED"}</code></div><div className="integration-inspector__row"><span>language</span><code>{language.toUpperCase()}</code></div></div><div className="integration-inspector__trace"><small>RUNTIME ROUTE</small><code>Intent → Gateway Skill</code><code>→ MCP Service → Tool</code><code>→ Schema → Gateway Call</code></div></aside>
      </div>

      <section className="card entitlement-note-card"><KeyRound size={20} /><div><strong>{t("Setup trước, entitlement khi execute", "Configure first, enforce entitlement on execution")}</strong><p>{t("User đã đăng nhập có thể tải kit và hoàn thành setup trước khi mua Open ID. Gateway skill và MCP call chỉ dùng qua Gateway runtime.", "Logged-in users can download the kit and finish setup before buying Open ID. Gateway skills and MCP calls are used only through the Gateway runtime.", "已登录用户可在购买 Open ID 前下载套件并完成设置。Gateway skill 和 MCP call 仅通过 Gateway runtime 使用。", "로그인한 사용자는 Open ID 구매 전에 키트를 다운로드하고 설정을 완료할 수 있습니다. Gateway skill과 MCP call은 Gateway runtime을 통해서만 사용됩니다.", "ログイン済みユーザーは Open ID 購入前にキットをダウンロードして設定を完了できます。Gateway skill と MCP call は Gateway runtime 経由でのみ使用されます。")}</p></div></section>
    </div>
  );
}
