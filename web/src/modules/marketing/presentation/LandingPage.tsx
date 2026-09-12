import {
  ArrowRight,
  Boxes,
  Code2,
  KeyRound,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  IdentityOrbit,
  JourneyStep,
  KitFile,
  LiveRouterConsole,
  MarketingStep,
} from "@/modules/marketing/presentation/LandingVisuals";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { BrandLogo } from "@/shared/branding/BrandLogo";
import { useLandingScrollReveal } from "@/modules/marketing/presentation/hooks/useLandingScrollReveal";

type Props = { language: "vi" | "en" };

export function LandingPage({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);
  const revealRootRef = useLandingScrollReveal();

  return (
    <main className="landing landing--supercharged-v2" lang={language} ref={revealRootRef}>
      <div className="landing-v2-bg" aria-hidden="true">
        <i className="landing-v2-bg__grid" />
        <i className="landing-v2-bg__orb landing-v2-bg__orb--indigo" />
        <i className="landing-v2-bg__orb landing-v2-bg__orb--cyan" />
        <i className="landing-v2-bg__beam" />
      </div>

      <header className="site-header site-header--v2 container">
        <Link className="brand brand--large" to="/">
          <BrandLogo />
          <small className="brand-live"><i /> GATEWAY ACTIVE</small>
        </Link>

        <nav className="landing-nav" aria-label={t("Điều hướng chính", "Primary navigation")}>
          <a href="#control-plane">{t("Cách hoạt động", "How It Works")}</a>
          <a href="#open-id">Open ID</a>
          <a href="#mcp-services">MCP Services</a>
          <a href="#gpt-integration">GPT Integration</a>
        </nav>

        <div className="site-header__actions">
          <ThemeToggle compact />
          <a className="language-link" href={vi ? "/" : "/vi"}>{vi ? "EN" : "VI"}</a>
          <Link className="button secondary button--quiet" to="/app">{t("Đăng nhập", "Sign In")}</Link>
          <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start Free")}<ArrowRight size={14} /></Link>
        </div>
      </header>

      <section className="landing-hero-v2 container">
        <div className="landing-hero-v2__badge" data-reveal="fade-down">
          <span className="status-dot status-dot--cyan" />
          CUSTOM GPT × MCP CONTROL PLANE
          <small>OPEN ID ENFORCED</small>
        </div>

        <h1 data-reveal="zoom-in">
          {t(
            "Kết nối Custom GPT của bạn với MCP services qua một Gateway bảo mật.",
            "Connect your Custom GPT to MCP services through one secure Gateway.",
          )}
        </h1>

        <p data-reveal="fade-up">
          {t(
            "Discovery và gọi MCP tools động qua Zero-trust Gateway với provider credentials được mã hóa, Open ID entitlement bắt buộc và context của GPT luôn sạch.",
            "Dynamically discover and invoke MCP tools through a zero-trust Gateway with encrypted provider credentials, mandatory Open ID entitlement, and clean GPT context.",
          )}
        </p>

        <div className="landing-hero-v2__actions" data-reveal="fade-up">
          <Link className="button" to="/app">{t("Bắt đầu thử 7 ngày", "Start Free 7-Day Trial")}<ArrowRight size={15} /></Link>
          <a className="button secondary" href="#control-plane">{t("Khám phá Live Protocol", "Inspect Live Protocol")}</a>
        </div>

        <div className="landing-hero-v2__status" data-reveal-group>
          <span><i className="status-dot status-dot--success" /> Google Stitch Available</span>
          <span><i className="status-dot status-dot--cyan" /> 7-Day Trial Included</span>
          <span><i className="status-dot status-dot--success" /> Open ID Protected</span>
        </div>
      </section>

      <section className="landing-stage container">
        <IdentityOrbit t={t} />
        <LiveRouterConsole t={t} />
      </section>

      <section className="landing-section landing-section--problem container" id="control-plane">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">ARCHITECTURAL VALUE</span>
          <h2>{t("Custom GPT cần một MCP control plane bảo mật.", "Custom GPTs need a secure MCP control plane.")}</h2>
          <p>{t("Xóa credential khỏi GPT context, kiểm soát entitlement và discovery tool động ở Gateway.", "Keep credentials out of GPT context, enforce entitlement, and discover tools dynamically at Gateway.")}</p>
        </div>

        <div className="control-plane-compare" data-reveal-group>
          <article className="control-plane-card control-plane-card--bad">
            <div className="control-plane-card__top">
              <span>WITHOUT GATEWAY</span>
              <strong>LEGACY RISK</strong>
            </div>
            <h3>{t("Tích hợp mong manh, credential rò rỉ.", "Fragile, leaky & brittle integration")}</h3>
            <ul>
              <li>Provider keys end up in GPT instructions/context.</li>
              <li>Tool catalogs become stale and hardcoded.</li>
              <li>No central entitlement boundary before execution.</li>
              <li>Provider auth semantics leak into GPT logic.</li>
            </ul>
            <small>RESULT: credential sprawl · stale tools · weak control</small>
          </article>

          <article className="control-plane-card control-plane-card--good">
            <div className="control-plane-card__top">
              <span>WITH MCP GATEWAY</span>
              <strong>ZERO-TRUST ROUTE</strong>
            </div>
            <h3>{t("Zero-trust entitlement & dynamic discovery.", "Zero-Trust Entitlement & Dynamic Discovery")}</h3>
            <ul>
              <li>Gateway stores provider credentials outside GPT context.</li>
              <li>Open ID authorizes every real MCP execution.</li>
              <li>Tools are discovered at runtime from approved providers.</li>
              <li>One stable Action protocol drives every MCP service.</li>
            </ul>
            <small>RESULT: controlled execution · runtime truth · clean GPT context</small>
          </article>
        </div>
      </section>

      <section className="landing-section container">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">THIS IS HOW IT FLOWS</span>
          <h2>{t("Architecture Execution Pipeline", "Architecture Execution Pipeline")}</h2>
          <p>{t("Một đường thực thi duy nhất từ provider credential đến MCP execution.", "One controlled execution path from provider credential to MCP execution.")}</p>
        </div>

        <div className="architecture-pipeline" data-reveal-group>
          <MarketingStep index="01" icon={<Boxes />} title={t("Kết nối MCP Provider", "Connect MCP Provider")} detail={t("Lưu credential trong Gateway, không đưa vào GPT.", "Store provider credentials inside Gateway, never GPT.")} />
          <MarketingStep index="02" icon={<Code2 />} title={t("Cấu hình Custom GPT", "Configure Your GPT")} detail={t("Instructions tối giản + Knowledge + Action Schema.", "Minimal Instructions + Knowledge + Action Schema.")} />
          <MarketingStep index="03" icon={<KeyRound />} title={t("Kích hoạt quyền", "Activate Access")} detail={t("Trial Open ID hoặc paid Open ID authorize execution.", "Trial Open ID or paid Open ID authorizes execution.")} />
          <MarketingStep index="04" icon={<Waypoints />} title={t("Dùng MCP động", "Use MCP Dynamically")} detail={t("Discovery tool runtime rồi execute qua Gateway.", "Discover runtime tools and execute through Gateway.")} />
        </div>

        <div className="pipeline-protocol" data-reveal="fade-up">
          <span>Gateway Runtime Sequence</span>
          <code>listMcpServices</code><i>→</i><code>listMcpTools</code><i>→</i><code>getMcpToolSchema</code><i>→</i><code>callMcpTool</code>
        </div>
      </section>

      <section className="landing-section open-id-v2 container" id="open-id">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">ACCESS &amp; ENTITLEMENTS</span>
          <h2>{t("Open ID là quyền truy cập Gateway.", "Open ID is your Gateway access.")}</h2>
          <p>{t("Mọi MCP execution phải resolve được một active Open ID entitlement.", "Every MCP execution must resolve an active Open ID entitlement.")}</p>
        </div>

        <div className="open-id-v2__grid" data-reveal-group>
          <article className="open-id-v2__card">
            <div className="open-id-v2__status"><i className="status-dot status-dot--success" /> MASTER OPEN ID ENTITLEMENT <span>STATUS: MEMBER ACTIVE</span></div>
            <small>ENTITLEMENT ID</small>
            <div className="open-id-v2__identifier"><code>oid_••••••••••••9a1</code><button className="secondary compact-button" type="button">Copy</button></div>
            <div className="open-id-v2__facts">
              <span><small>Gateway Access</small><strong>ENABLED</strong></span>
              <span><small>MCP Services</small><strong>ALL APPROVED</strong></span>
              <span><small>Credential Security</small><strong>GATEWAY HELD</strong></span>
              <span><small>Execution Policy</small><strong>ENFORCED</strong></span>
            </div>
            <div className="open-id-v2__actions">
              <Link className="button" to="/app#open-id">{t("Lấy Open ID", "Get Permanent Open ID")}</Link>
              <Link className="button secondary" to="/app#open-id">{t("Bắt đầu trial", "Start 7-Day Trial")}</Link>
            </div>
          </article>

          <div className="open-id-v2__notes">
            <article><KeyRound size={18} /><div><strong>OPEN ID ≠ TOKEN</strong><p>{t("Open ID là sản phẩm/entitlement. Gateway Token chỉ là credential kỹ thuật.", "Open ID is the product entitlement. Gateway Token is only a technical credential.")}</p></div></article>
            <article><ShieldCheck size={18} /><div><strong>GATEWAY TOKEN VALIDATION</strong><p>{t("Token resolve về owner, Open ID và entitlement trước khi Gateway gọi provider.", "Token resolves to owner, Open ID, and entitlement before Gateway calls a provider.")}</p></div></article>
            <article className="good"><ShieldCheck size={18} /><div><strong>NO PROVIDER KEYS IN GPT CONTEXT</strong><p>{t("Credential provider luôn ở boundary phía Gateway.", "Provider credentials remain inside the Gateway boundary.")}</p></div></article>
          </div>
        </div>
      </section>

      <section className="landing-section container" id="mcp-services">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">FIRST PROVIDER INTEGRATION</span>
          <h2>{t("Bắt đầu với Google Stitch.", "Start with Google Stitch.")}</h2>
          <p>{t("Hỗ trợ provider được phê duyệt, credential thuộc chính user.", "Approved providers only, with user-owned credentials.")}</p>
        </div>

        <article className="stitch-provider-v2" data-reveal="zoom-in">
          <div className="stitch-provider-v2__header">
            <div className="provider-showcase__logo">S</div>
            <div><span className="eyebrow">GOOGLE STITCH MCP PROVIDER</span><h3>Connected through Gateway</h3></div>
            <span className="status good">AVAILABLE</span>
          </div>

          <div className="stitch-provider-v2__body">
            <div className="stitch-provider-v2__capabilities">
              <span><small>CAPABILITY</small><strong>Project Discovery</strong></span>
              <span><small>CAPABILITY</small><strong>Screen Discovery</strong></span>
              <span><small>CAPABILITY</small><strong>Screen Inspection</strong></span>
              <span><small>CAPABILITY</small><strong>UI Generation</strong></span>
            </div>
            <div className="stitch-provider-v2__trace">
              <code>service = "stitch"</code>
              <code>tool = "list_screens"</code>
              <code>transport = "MCP"</code>
              <strong>200 OK</strong>
            </div>
          </div>
          <Link className="button secondary" to="/app#mcp-services">{t("Kết nối Stitch", "Connect Google Stitch")}</Link>
        </article>

        <div className="coming-provider-row">
          <article><span>G</span><div><strong>GitHub MCP Provider</strong><small>COMING SOON</small></div></article>
          <article><span>F</span><div><strong>Figma MCP Provider</strong><small>COMING SOON</small></div></article>
        </div>
      </section>

      <section className="landing-section container" id="gpt-integration">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">ZERO-COST SETUP</span>
          <h2>{t("Cấu hình GPT trước khi mua.", "Configure your GPT before you buy.")}</h2>
          <p>{t("Integration kit miễn phí. Execution chỉ bắt đầu khi trial hoặc Open ID active.", "The integration kit is free. Execution starts only when trial or Open ID is active.")}</p>
        </div>

        <div className="gpt-kit-v2">
          <div className="gpt-kit-v2__files">
            <KitFile name="instructions.md" />
            <KitFile name="GPTS-MCP-GATEWAY-Knowledge.md" />
            <KitFile name="openapi.yaml" />
            <KitFile name="setup-guide.md" />
          </div>
          <div className="gpt-kit-v2__footer">
            <span><ShieldCheck size={14} /> NO OPEN ID OR PROVIDER CREDENTIALS INCLUDED</span>
            <Link className="button" to="/app#gpt-integration">{t("Tải GPT Integration Kit", "Download GPT Integration Kit")}</Link>
          </div>
        </div>
      </section>

      <section className="landing-section container">
        <div className="landing-section__heading landing-section__heading--centered" data-reveal="fade-up">
          <span className="eyebrow">CLEAR PATH TO PRODUCTION</span>
          <h2>{t("Onboarding Funnel & Trial Clarity", "Onboarding Funnel & Trial Clarity")}</h2>
          <p>{t("Trial chỉ bắt đầu khi user chủ động tạo Trial Token.", "The trial starts only when the user explicitly creates a Trial Token.")}</p>
        </div>

        <div className="journey-row journey-row--v2">
          <JourneyStep label="Register" />
          <JourneyStep label="Connect Stitch" />
          <JourneyStep label="Configure GPT" />
          <JourneyStep label="Create Trial" active />
          <JourneyStep label="7-Day Trial" />
          <JourneyStep label="Get Open ID" />
        </div>

        <div className="journey-note journey-note--v2">
          <span>i</span>
          <strong>Trial does not start on Register / Stitch / GPT Kit.</strong>
          <small>Trial starts exactly when you click Create Trial Token.</small>
        </div>
      </section>

      <section className="landing-section container">
        <article className="final-cta final-cta--supercharged-v2">
          <span className="eyebrow">PRODUCTION-GRADE CONTROL PLANE</span>
          <h2>{t("Cho Custom GPT khả năng MCP thực sự.", "Give your Custom GPT real MCP capabilities.")}</h2>
          <p>{t("Kết nối Stitch, cấu hình GPT, thử Gateway 7 ngày rồi kích hoạt Open ID khi sẵn sàng.", "Connect Stitch, configure your GPT, try Gateway for 7 days, then activate Open ID when ready.")}</p>
          <div className="row">
            <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start Free")}</Link>
            <Link className="button secondary" to="/app#open-id">{t("Lấy Open ID", "Get Open ID")}</Link>
          </div>
          <div className="final-cta__status">
            <span><i className="status-dot status-dot--success" /> Gateway Operational</span>
            <span><i className="status-dot status-dot--cyan" /> Stitch Available</span>
            <span><i className="status-dot status-dot--success" /> Open ID Enforcement Active</span>
          </div>
        </article>
      </section>

      <footer className="site-footer site-footer--v2" data-reveal="fade-up">
        <div className="container site-footer__row">
          <div className="footer-brand">
            <BrandLogo variant="lockup" />
            <small>MCP GATEWAY CONTROL PLANE</small>
          </div>
          <div className="footer-links"><strong>Product</strong><a href="#open-id">Open ID</a><a href="#mcp-services">MCP Services</a><a href="#gpt-integration">GPT Integration</a></div>
          <div className="footer-links"><strong>Account</strong><Link to="/app">Sign In</Link><Link to="/app">Create Account</Link></div>
          <div className="footer-system"><code>OPEN ID ENFORCEMENT: ACTIVE</code><span>STITCH MCP: AVAILABLE</span></div>
        </div>
      </footer>
    </main>
  );
}
