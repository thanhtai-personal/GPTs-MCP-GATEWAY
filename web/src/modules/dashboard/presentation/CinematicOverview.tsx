import { Activity, ArrowRight, Boxes, KeyRound, ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import "./CinematicOverview.css";

type OverviewTarget = "mcp-services" | "open-id" | "gpt-integration";

export function CinematicOverview({ isMember, onNavigate }: { isMember?: boolean; onNavigate: (screen: OverviewTarget) => void }) {
  const { t } = useUiLanguage();
  return (
    <div className="cinematic-dashboard">
      <section className="cinematic-dashboard__hero">
        <div>
          <span className="eyebrow">{t("CONTROL PLANE TRỰC TIẾP", "LIVE CONTROL PLANE", "实时 CONTROL PLANE", "라이브 CONTROL PLANE", "ライブ CONTROL PLANE")}</span>
          <h1>{t("Bảng điều hành Gateway", "Gateway Operations Console", "Gateway 运营控制台", "Gateway 운영 콘솔", "Gateway 運用コンソール")}</h1>
          <p>{t("Theo dõi entitlement, provider connectivity và runtime MCP routing trong một execution boundary duy nhất.", "Observe entitlement, provider connectivity, and runtime MCP routing inside one execution boundary.", "在一个执行边界内观察 entitlement、Provider 连接和运行时 MCP 路由。", "하나의 실행 경계에서 entitlement, Provider 연결 및 런타임 MCP 라우팅을 확인합니다.", "1つの実行境界内で entitlement、Provider 接続、実行時 MCP ルーティングを監視します。")}</p>
        </div>
        <div className="cinematic-dashboard__hero-actions"><span className="status good"><ShieldCheck size={14} /> {t("GATEWAY HOẠT ĐỘNG", "GATEWAY OPERATIONAL", "GATEWAY 运行正常", "GATEWAY 정상 작동", "GATEWAY 稼働中")}</span><span className="status"><Activity size={14} /> 99.99% {t("UPTIME", "UPTIME", "可用率", "가동률", "稼働率")}</span></div>
      </section>

      <section className="cinematic-status-rail">
        <div><span>OPEN ID</span><strong>{isMember ? t("MEMBER ĐANG HOẠT ĐỘNG", "MEMBER ACTIVE", "会员有效", "멤버 활성", "メンバー有効") : "TRIAL / OPEN ID"}</strong><small>ENTITLEMENT</small></div>
        <div><span>PROVIDER</span><strong>GOOGLE STITCH</strong><small>{t("SERVICE ĐÃ KẾT NỐI", "CONNECTED SERVICE", "服务已连接", "서비스 연결됨", "サービス接続済み")}</small></div>
        <div><span>{t("ĐỊNH TUYẾN", "ROUTING", "路由", "라우팅", "ルーティング")}</span><strong>{t("DISCOVERY ĐỘNG", "DYNAMIC DISCOVERY", "动态发现", "동적 검색", "動的発見")}</strong><small>{t("TOOL RUNTIME", "RUNTIME TOOLS", "运行时工具", "런타임 도구", "実行時ツール")}</small></div>
        <div><span>{t("BẢO MẬT", "SECURITY", "安全", "보안", "セキュリティ")}</span><strong>{t("ĐÃ MÃ HÓA", "ENCRYPTED", "已加密", "암호화됨", "暗号化済み")}</strong><small>PROVIDER CREDENTIALS</small></div>
      </section>

      <section className="cinematic-console-grid">
        <article className="cinematic-console-card cinematic-console-card--trace">
          <div className="cinematic-console-card__header"><div><span className="eyebrow">{t("TRACE THỰC THI TRỰC TIẾP", "LIVE EXECUTION TRACE", "实时执行 TRACE", "라이브 실행 TRACE", "ライブ実行 TRACE")}</span><h2>{t("Định tuyến MCP runtime", "Runtime MCP routing", "运行时 MCP 路由", "런타임 MCP 라우팅", "実行時 MCP ルーティング")}</h2></div><span className="status good">{t("ĐANG STREAM", "STREAMING", "流式处理中", "스트리밍 중", "ストリーミング中")}</span></div>
          <div className="console-trace-list"><div className="active"><span>01</span><b>{t("Ý ĐỊNH", "INTENT", "意图", "의도", "意図")}</b><code>“Use Stitch to update UI”</code><small>0ms</small></div><div className="active"><span>02</span><b>SERVICE</b><code>stitch</code><small>4ms</small></div><div className="active"><span>03</span><b>DISCOVERY</b><code>listMcpTools</code><small>42ms</small></div><div className="active"><span>04</span><b>SCHEMA</b><code>getMcpToolSchema</code><small>31ms</small></div><div className="success"><span>05</span><b>{t("THỰC THI", "EXECUTE", "执行", "실행", "実行")}</b><code>callMcpTool</code><small>118ms</small></div></div>
          <div className="console-trace-footer"><span><i className="status-dot status-dot--success" /> {t("OPEN ID ĐƯỢC BẮT BUỘC", "OPEN ID ENFORCED", "OPEN ID 已强制", "OPEN ID 적용됨", "OPEN ID 適用中")}</span><code>result: complete</code></div>
        </article>

        <aside className="cinematic-console-side">
          <article className="cinematic-metric-card"><span>{t("TỐC ĐỘ REQUEST", "REQUEST RATE", "请求速率", "요청 속도", "リクエスト率")}</span><strong>24.8</strong><small>req / sec</small><div className="metric-bars" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div></article>
          <article className="cinematic-metric-card"><span>P95 {t("ĐỘ TRỄ", "LATENCY", "延迟", "지연 시간", "レイテンシ")}</span><strong>118ms</strong><small>gateway route</small><div className="metric-line" aria-hidden="true"><i /></div></article>
          <article className="cinematic-metric-card cinematic-metric-card--secure"><ShieldCheck size={18} /><div className="cinematic-security-boundary-copy"><span>{t("RANH GIỚI BẢO MẬT", "SECURITY BOUNDARY", "安全边界", "보안 경계", "セキュリティ境界")}</span><strong>{t("ĐANG BẢO VỆ", "PROTECTED", "受保护", "보호됨", "保護中")}</strong><small>{t("Gateway token → xác thực Open ID → gọi provider", "Gateway token → verify Open ID → call provider", "Gateway token → 验证 Open ID → 调用 Provider", "Gateway token → Open ID 검증 → Provider 호출", "Gateway token → Open ID 検証 → Provider 呼び出し")}</small></div></article>
        </aside>
      </section>

      <section className="cinematic-actions">
        <button onClick={() => onNavigate("mcp-services")} type="button"><span className="feature-icon"><Boxes /></span><div><small>01 · {t("KẾT NỐI", "CONNECTORS", "连接器", "커넥터", "コネクター")}</small><strong>MCP Services</strong><p>{t("Quản lý provider credential và connection state.", "Manage provider credentials and connection state.", "管理 Provider 凭据和连接状态。", "Provider 자격 증명과 연결 상태를 관리합니다.", "Provider 認証情報と接続状態を管理します。")}</p></div><ArrowRight size={16} /></button>
        <button onClick={() => onNavigate("open-id")} type="button"><span className="feature-icon"><KeyRound /></span><div><small>02 · ENTITLEMENT</small><strong>Open ID Access</strong><p>{t("Quản lý trial, Open ID và Gateway token.", "Manage trial, Open ID, and Gateway tokens.", "管理 Trial、Open ID 和 Gateway token。", "Trial, Open ID 및 Gateway token을 관리합니다.", "Trial、Open ID、Gateway token を管理します。")}</p></div><ArrowRight size={16} /></button>
        <button onClick={() => onNavigate("gpt-integration")} type="button"><span className="feature-icon"><Sparkles /></span><div><small>03 · INTEGRATION</small><strong>GPT Workbench</strong><p>{t("Tải kit và cấu hình runtime MCP discovery.", "Download the kit and configure runtime MCP discovery.", "下载套件并配置运行时 MCP discovery。", "키트를 다운로드하고 런타임 MCP discovery를 구성합니다.", "キットをダウンロードし、実行時 MCP discovery を設定します。")}</p></div><ArrowRight size={16} /></button>
      </section>

      <section className="cinematic-boundary"><div className="cinematic-boundary__header"><div><span className="eyebrow">{t("RANH GIỚI THỰC THI", "EXECUTION BOUNDARY", "执行边界", "실행 경계", "実行境界")}</span><h2>Custom GPT → Gateway → MCP</h2></div><span className="status good">{t("OPEN ID ĐƯỢC BẮT BUỘC", "OPEN ID ENFORCED", "OPEN ID 已强制", "OPEN ID 적용됨", "OPEN ID 適用中")}</span></div><div className="cinematic-boundary__flow"><RouteStep index="01" label="Custom GPT" detail={t("Hiểu intent", "Understand intent", "理解意图", "의도 이해", "意図を理解")} /><Waypoints size={18} /><RouteStep index="02" label="Gateway" detail={t("Resolve entitlement", "Resolve entitlement", "解析 entitlement", "entitlement 확인", "entitlement を解決")} active /><Waypoints size={18} /><RouteStep index="03" label="MCP Service" detail={t("Discover + execute", "Discover + execute", "发现 + 执行", "검색 + 실행", "発見 + 実行")} /></div></section>
    </div>
  );
}

function RouteStep({ active = false, detail, index, label }: { active?: boolean; detail: string; index: string; label: string }) { return <div className={`route-step ${active ? "active" : ""}`}><span>{index}</span><strong>{label}</strong><small>{detail}</small></div>; }
