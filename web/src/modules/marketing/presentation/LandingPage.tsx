import {
  ArrowRight,
  Boxes,
  CircleDot,
  Code2,
  KeyRound,
  LockKeyhole,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ConsoleRow, GatewayInspector, JourneyStep, KitFile, MarketingStep, SystemStatus } from "@/modules/marketing/presentation/LandingVisuals";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";

type Props = { language: "vi" | "en" };

export function LandingPage({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);

  return (
    <main className="landing landing--redesigned" lang={language}>
      <header className="site-header container">
        <Link className="brand brand--large" to="/">
          <span className="brand-mark"><PlugZap size={18} /></span>
          <span>MCP Gateway</span>
          <small className="brand-live"><i /> LIVE</small>
        </Link>

        <nav className="landing-nav" aria-label={t("Điều hướng chính", "Primary navigation")}>
          <a href="#how-it-works">{t("Cách hoạt động", "How It Works")}</a>
          <a href="#mcp-services">MCP Services</a>
          <a href="#open-id">Open ID</a>
          <a href="#gpt-integration">GPT Integration</a>
        </nav>

        <div className="site-header__actions">
          <ThemeToggle compact />
          <a className="language-link" href={vi ? "/" : "/vi"}>{vi ? "EN" : "VI"}</a>
          <Link className="button secondary button--quiet" to="/app">{t("Đăng nhập", "Sign In")}</Link>
          <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start Free")}<ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className="hero hero--redesigned container">
        <div className="hero-copy">
          <div className="hero-pill"><span /> CUSTOM GPT × MCP CONTROL PLANE</div>
          <h1>
            {t(
              "Kết nối Custom GPT\nvới MCP services qua\nmột Gateway bảo mật.",
              "Connect your Custom GPT\nto MCP services through\none secure Gateway.",
            )}
          </h1>
          <p className="lead">
            {t(
              "Discovery và gọi MCP tools động như Google Stitch trong khi Gateway kiểm soát authorization, Open ID entitlement và provider credentials của bạn.",
              "Dynamically discover and invoke MCP tools such as Google Stitch while Gateway securely manages authorization, Open ID entitlement, and your provider credentials.",
            )}
          </p>
          <div className="row hero-actions">
            <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start Free")}<ArrowRight size={17} /></Link>
            <a className="button secondary" href="#how-it-works">{t("Xem cách hoạt động", "See How It Works")}</a>
          </div>
          <div className="hero-meta hero-meta--status">
            <span><i className="status-dot status-dot--success" /> Google Stitch {t("khả dụng", "Available")}</span>
            <span><i className="status-dot status-dot--cyan" /> 7-Day Trial</span>
            <span><i className="status-dot status-dot--success" /> Open ID Protected</span>
          </div>
        </div>

        <GatewayInspector t={t} />
      </section>

      <section className="landing-status-strip">
        <div className="container landing-status-grid">
          <SystemStatus label="Gateway" value="OPERATIONAL" tone="success" />
          <SystemStatus label="Open ID" value="ENFORCED" tone="success" />
          <SystemStatus label="Google Stitch" value="AVAILABLE" tone="cyan" />
          <SystemStatus label="Credentials" value="ENCRYPTED" tone="cyan" />
          <SystemStatus label="Dynamic Discovery" value="ENABLED" tone="success" />
        </div>
      </section>

      <section className="section container" id="how-it-works">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">WHY MCP GATEWAY</span>
            <h2>{t("Custom GPT cần một MCP control plane bảo mật.", "Custom GPTs need a secure MCP control plane.")}</h2>
          </div>
          <p className="muted">
            {t(
              "Một protocol ổn định ở phía GPT, discovery và authorization tập trung ở Gateway.",
              "One stable protocol in GPT, with discovery and authorization centralized in Gateway.",
            )}
          </p>
        </div>

        <div className="comparison-grid">
          <article className="card comparison-card comparison-card--muted">
            <span className="eyebrow">WITHOUT GATEWAY</span>
            <h3>{t("Tích hợp bị gắn cứng", "Brittle integrations")}</h3>
            <div className="mini-route">
              <span>Custom GPT</span><i>→</i><span>{t("Hardcoded tools", "Hardcoded tools")}</span><i>→</i><span>{t("Provider auth riêng", "Provider-specific auth")}</span>
            </div>
          </article>
          <article className="card comparison-card comparison-card--active">
            <span className="eyebrow">WITH MCP GATEWAY</span>
            <h3>{t("Một execution boundary", "One execution boundary")}</h3>
            <div className="mini-route">
              <span>Custom GPT</span><i>→</i><span>Gateway</span><i>→</i><span>Open ID</span><i>→</i><span>MCP Discovery</span>
            </div>
          </article>
        </div>

        <div className="workflow-grid">
          <MarketingStep index="01" icon={<Boxes />} title={t("Kết nối MCP Provider", "Connect an MCP Provider")} detail={t("Thêm credential Google Stitch của bạn. Credential luôn ở Gateway.", "Add your own Google Stitch credential. Provider credentials stay inside Gateway.")} />
          <MarketingStep index="02" icon={<Code2 />} title={t("Cấu hình GPT", "Configure Your GPT")} detail={t("Cài Instructions, Knowledge và Action Schema miễn phí.", "Install the free Gateway Instructions, Knowledge, and Action Schema.")} />
          <MarketingStep index="03" icon={<KeyRound />} title={t("Kích hoạt access", "Activate Gateway Access")} detail={t("Bắt đầu trial 7 ngày một lần hoặc kích hoạt Open ID.", "Start your one-time 7-day trial or activate a permanent Open ID.")} />
          <MarketingStep index="04" icon={<Waypoints />} title={t("Dùng MCP động", "Use MCP Dynamically")} detail={t("GPT discovery tools runtime và gọi chúng qua Gateway.", "Your GPT discovers MCP tools at runtime and calls them through Gateway.")} />
        </div>

        <div className="protocol-strip">
          <code>listMcpServices</code><span>→</span><code>listMcpTools</code><span>→</span><code>getMcpToolSchema</code><span>→</span><code>callMcpTool</code>
        </div>
      </section>

      <section className="section container open-id-marketing" id="open-id">
        <div className="open-id-marketing__copy">
          <span className="eyebrow">CORE PRODUCT · OPEN ID</span>
          <h2>{t("Open ID là quyền truy cập Gateway.", "Open ID is your Gateway access.")}</h2>
          <p className="lead small">
            {t(
              "Mọi MCP execution đều phải được authorize bởi một Open ID entitlement đang hoạt động. Gateway Token chỉ là credential kỹ thuật.",
              "Every MCP execution is authorized through an active Open ID entitlement. A Gateway Token is only a technical authentication credential.",
            )}
          </p>
          <div className="product-distinction">
            <div><small>OPEN ID</small><strong>{t("Sản phẩm / entitlement", "Product / entitlement")}</strong></div>
            <div><small>GATEWAY TOKEN</small><strong>{t("Credential kỹ thuật", "Technical credential")}</strong></div>
          </div>
          <div className="row">
            <a className="button" href="/app#open-id">{t("Lấy Open ID", "Get Open ID")}<ArrowRight size={16} /></a>
            <a className="button secondary" href="/app#open-id">{t("Thử miễn phí 7 ngày", "Try Free for 7 Days")}</a>
          </div>
        </div>

        <div className="open-id-product-card">
          <div className="open-id-product-card__top">
            <span className="brand-mark"><KeyRound size={17} /></span>
            <div><small>OPEN ID</small><strong>oid_9F••••••••42</strong></div>
            <span className="status good"><CircleDot size={12} /> ACTIVE</span>
          </div>
          <dl>
            <div><dt>Gateway Access</dt><dd>ENABLED</dd></div>
            <div><dt>MCP Services</dt><dd>SUPPORTED PROVIDERS</dd></div>
            <div><dt>Entitlement</dt><dd>MEMBER</dd></div>
            <div><dt>Security Boundary</dt><dd>ENFORCED</dd></div>
          </dl>
          <div className="open-id-product-card__foot"><ShieldCheck size={16} /> Open ID verification required for every MCP execution</div>
        </div>
      </section>

      <section className="section container provider-marketing" id="mcp-services">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">FIRST MCP PROVIDER</span>
            <h2>{t("Bắt đầu với Google Stitch.", "Start with Google Stitch.")}</h2>
          </div>
          <p className="muted">
            {t("Gateway chỉ hỗ trợ các MCP service đã được phê duyệt.", "Gateway supports approved MCP services rather than arbitrary MCP URLs.")}
          </p>
        </div>

        <div className="provider-showcase provider-showcase--featured">
          <article className="card provider-showcase__active provider-showcase__active--large">
            <div className="provider-showcase__logo">S</div>
            <div className="provider-showcase__body">
              <span className="eyebrow">MCP PROVIDER</span>
              <h3>Google Stitch</h3>
              <div className="provider-meta">
                <span><small>Status</small><strong>AVAILABLE</strong></span>
                <span><small>Credential</small><strong>USER OWNED</strong></span>
                <span><small>Gateway support</small><strong>ACTIVE</strong></span>
              </div>
              <div className="capability-list">
                <span>Project Discovery</span><span>Screen Discovery</span><span>Screen Inspection</span><span>UI Generation</span>
              </div>
              <div className="provider-operation"><code>service: stitch</code><code>tool: list_screens</code><strong>200 OK</strong></div>
            </div>
            <a className="button secondary" href="/app#mcp-services">{t("Kết nối Stitch", "Connect Google Stitch")}</a>
          </article>

          <div className="provider-coming-grid">
            <article className="card provider-showcase__muted"><div className="provider-showcase__logo">G</div><div><span className="eyebrow">COMING SOON</span><h3>GitHub</h3></div></article>
            <article className="card provider-showcase__muted"><div className="provider-showcase__logo">F</div><div><span className="eyebrow">COMING SOON</span><h3>Figma</h3></div></article>
          </div>
        </div>
      </section>

      <section className="section container discovery-section">
        <div>
          <span className="eyebrow">DYNAMIC MCP DISCOVERY</span>
          <h2>{t("GPT discovery tools ở runtime.", "Your GPT discovers tools at runtime.")}</h2>
          <p className="lead small">
            {t(
              "Không cần hardcode toàn bộ Stitch tool catalog trong GPT. Gateway cung cấp capability MCP hiện tại ở runtime.",
              "No hardcoded Stitch tool catalog is required inside your GPT. Gateway exposes the current MCP capabilities at runtime.",
            )}
          </p>
          <span className="status good"><CircleDot size={12} /> DYNAMIC DISCOVERY ENABLED</span>
        </div>
        <div className="discovery-console">
          <ConsoleRow label="USER" value={'"Update the UI using Stitch."'} />
          <ConsoleRow label="INTENT" value="UI modification" />
          <ConsoleRow label="CAPABILITY" value="UI generation" />
          <ConsoleRow label="SERVICE" value="stitch" />
          <ConsoleRow label="DISCOVERY" value={'listMcpTools("stitch")'} />
          <ConsoleRow label="SCHEMA" value="getMcpToolSchema(...)" />
          <ConsoleRow label="EXECUTION" value="callMcpTool(...)" active />
          <ConsoleRow label="RESULT" value="MCP RESPONSE · COMPLETE" success />
        </div>
      </section>

      <section className="section container security-section" id="security">
        <div>
          <span className="eyebrow">SECURITY BOUNDARY</span>
          <h2>{t("Provider credentials không bao giờ thành GPT context.", "Your provider credentials never become GPT context.")}</h2>
          <p className="lead small">
            {t(
              "Gateway resolve Token → Open ID → Owner → Entitlement → MCP Connection trước khi dùng credential được mã hóa của account.",
              "Gateway resolves Token → Open ID → Owner → Entitlement → MCP Connection before using the account's encrypted provider credential.",
            )}
          </p>
          <div className="security-badges">
            <span>OPEN ID VERIFIED</span><span>ENTITLEMENT ACTIVE</span><span>CREDENTIAL ENCRYPTED</span><span>PROVIDER AUTHORIZED</span>
          </div>
        </div>
        <div className="security-terminal">
          <div><Sparkles size={16} /><span>Custom GPT</span><code>Gateway Token only</code></div>
          <div><PlugZap size={16} /><span>MCP Gateway</span><code>resolve entitlement</code></div>
          <div><KeyRound size={16} /><span>Open ID</span><code>verified</code></div>
          <div><LockKeyhole size={16} /><span>Encrypted credential</span><code>server-side</code></div>
          <div><ShieldCheck size={16} /><span>Google Stitch</span><code>authorized request</code></div>
        </div>
      </section>

      <section className="section container gpt-kit-marketing" id="gpt-integration">
        <div>
          <span className="eyebrow">GPT INTEGRATION KIT · FREE</span>
          <h2>{t("Cấu hình GPT trước khi mua.", "Configure your GPT before you buy.")}</h2>
          <p className="lead small">
            {t(
              "Integration kit miễn phí. Gateway execution chỉ bắt đầu khi có active trial hoặc Open ID.",
              "The integration kit is free. Gateway execution begins only after an active trial or Open ID is available.",
            )}
          </p>
          <div className="row">
            <a className="button" href="/app#gpt-integration">{t("Xem GPT Integration", "View GPT Integration")}<ArrowRight size={16} /></a>
          </div>
        </div>
        <div className="kit-file-list">
          <KitFile name="instructions.md" />
          <KitFile name="GPTS-MCP-GATEWAY-Knowledge.md" />
          <KitFile name="openapi.yaml" />
          <KitFile name="setup-guide.md" />
          <small><LockKeyhole size={13} /> NO PROVIDER CREDENTIALS INCLUDED</small>
        </div>
      </section>

      <section className="section container onboarding-section">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">ACTUAL PRODUCT JOURNEY</span>
            <h2>{t("Setup trước. Trial chỉ bắt đầu khi bạn chọn.", "Set up first. Trial starts only when you choose.")}</h2>
          </div>
        </div>
        <div className="journey-row">
          <JourneyStep label={t("Đăng ký", "Register")} />
          <JourneyStep label={t("Kết nối Stitch", "Connect Stitch")} />
          <JourneyStep label={t("Tải GPT Kit", "Download GPT Kit")} />
          <JourneyStep label={t("Cấu hình GPT", "Configure GPT")} />
          <JourneyStep label="Create Trial Token" active />
          <JourneyStep label="7-Day Trial" />
          <JourneyStep label="Get Open ID" />
        </div>
        <p className="journey-note">
          {t(
            "Trial không bắt đầu khi đăng ký, kết nối Stitch hoặc tải GPT Kit. Nó bắt đầu chính xác khi user tạo Trial Token.",
            "Trial does not start on registration, Stitch connection, or GPT Kit download. It starts exactly when the user creates the Trial Token.",
          )}
        </p>
      </section>

      <section className="section container final-cta final-cta--technical">
        <div>
          <span className="eyebrow">GATEWAY READY</span>
          <h2>{t("Đưa MCP capability thật vào Custom GPT.", "Give your Custom GPT real MCP capabilities.")}</h2>
          <p className="lead small">
            {t(
              "Cấu hình GPT, kết nối Google Stitch và trải nghiệm MCP qua Gateway với trial 7 ngày.",
              "Configure your GPT, connect Google Stitch, and experience MCP through Gateway with a 7-day trial.",
            )}
          </p>
          <div className="row">
            <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start Free")}<ArrowRight size={17} /></Link>
            <a className="button secondary" href="/app#open-id">{t("Lấy Open ID", "Get Open ID")}</a>
          </div>
        </div>
        <div className="final-cta__status">
          <SystemStatus label="Gateway" value="OPERATIONAL" tone="success" />
          <SystemStatus label="Stitch" value="AVAILABLE" tone="cyan" />
          <SystemStatus label="Open ID" value="ENFORCEMENT ACTIVE" tone="success" />
        </div>
      </section>

      <footer className="footer footer--expanded container">
        <div>
          <a className="brand" href="/"><span className="brand-mark"><PlugZap size={16} /></span>MCP Gateway</a>
          <p className="muted">{t("Secure MCP control plane cho Custom GPT.", "Secure MCP control plane for Custom GPT.")}</p>
        </div>
        <div className="footer-links">
          <div><strong>Product</strong><a href="#open-id">Open ID</a><a href="#mcp-services">MCP Services</a><a href="#gpt-integration">GPT Integration</a></div>
          <div><strong>Account</strong><Link to="/app">{t("Đăng nhập", "Sign In")}</Link><Link to="/app">{t("Tạo tài khoản", "Create Account")}</Link></div>
          <div><strong>Language</strong><a href="/">English</a><a href="/vi">Tiếng Việt</a></div>
        </div>
        <div className="footer-system"><code>MCP GATEWAY CONTROL PLANE</code><span><i className="status-dot status-dot--success" /> OPEN ID ENFORCEMENT: ACTIVE</span><span><i className="status-dot status-dot--cyan" /> STITCH MCP: AVAILABLE</span></div>
      </footer>
    </main>
  );
}
