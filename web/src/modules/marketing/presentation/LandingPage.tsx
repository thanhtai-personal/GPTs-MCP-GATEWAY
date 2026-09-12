import {
  ArrowRight,
  Braces,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = { language: "vi" | "en" };

export function LandingPage({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);

  return (
    <main className="landing" lang={language}>
      <header className="site-header container">
        <Link className="brand brand--large" to="/">
          <span className="brand-mark"><PlugZap size={18} /></span>
          MCP Gateway
        </Link>
        <nav className="landing-nav">
          <a href="#how-it-works">{t("Cách hoạt động", "How it works")}</a>
          <a href="#open-id">Open ID</a>
          <a href="#security">{t("Bảo mật", "Security")}</a>
          <a className="language-link" href={vi ? "/" : "/vi"}>{vi ? "EN" : "VI"}</a>
          <Link className="button secondary" to="/app">{t("Mở Console", "Open Console")}</Link>
        </nav>
      </header>

      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-pill"><span /> MCP FOR CUSTOM GPT</div>
          <h1>{t("Một gateway.\nMọi MCP tool.", "One gateway.\nEvery MCP tool.")}</h1>
          <p className="lead">
            {t(
              "Kết nối Custom GPT với MCP services qua một execution boundary bảo mật. GPT tự discovery tools; Gateway giữ Open ID và provider credentials.",
              "Connect Custom GPT to MCP services through one secure execution boundary. GPT discovers tools at runtime; Gateway owns Open ID and provider credentials.",
            )}
          </p>
          <div className="row hero-actions">
            <Link className="button" to="/app">{t("Bắt đầu miễn phí", "Start for free")}<ArrowRight size={17} /></Link>
            <a className="button secondary" href="#how-it-works">{t("Xem kiến trúc", "View architecture")}</a>
          </div>
          <div className="hero-meta">
            <span><LockKeyhole size={15} /> Server-side secrets</span>
            <span><Waypoints size={15} /> Runtime discovery</span>
            <span><KeyRound size={15} /> Open ID access</span>
          </div>
        </div>

        <div className="gateway-visual" aria-label="Gateway routing flow">
          <div className="gateway-visual__top">
            <span className="window-dots"><i /><i /><i /></span>
            <code>gateway.route()</code>
            <span className="live-dot">LIVE</span>
          </div>
          <div className="gateway-flow">
            <div className="flow-node"><span>01</span><div><small>USER</small><strong>Design a dashboard with Stitch</strong></div></div>
            <div className="flow-line"><i /></div>
            <div className="flow-node active"><span>02</span><div><small>CUSTOM GPT</small><strong>Intent → capability → service</strong></div></div>
            <div className="flow-line"><i /></div>
            <div className="flow-node"><span>03</span><div><small>MCP GATEWAY</small><strong>Discover schema → execute</strong></div></div>
            <div className="flow-line"><i /></div>
            <div className="flow-node success"><span>04</span><div><small>PROVIDER</small><strong>Google Stitch MCP</strong></div></div>
          </div>
          <div className="gateway-visual__footer"><code>200 COMPLETE</code><span>provider secret never leaves gateway</span></div>
        </div>
      </section>

      <section className="landing-signal-strip">
        <div className="container landing-signals">
          <div><strong>01</strong><span>{t("Một Gateway Action", "One Gateway Action")}</span></div>
          <div><strong>02</strong><span>{t("Discovery runtime", "Runtime discovery")}</span></div>
          <div><strong>03</strong><span>{t("Open ID enforced", "Open ID enforced")}</span></div>
          <div><strong>04</strong><span>{t("Credential phía server", "Server-side credentials")}</span></div>
        </div>
      </section>

      <section className="section container" id="how-it-works">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">THE CONTROL LAYER</span>
            <h2>{t("Từ prompt đến MCP call, có kiểm soát.", "From prompt to MCP call, under control.")}</h2>
          </div>
          <p className="muted">
            {t(
              "GPT tự nhận diện capability. Gateway thực hiện discovery, resolve entitlement và inject credential của đúng user.",
              "GPT recognizes the capability. Gateway handles discovery, entitlement resolution, and the correct user's provider credential.",
            )}
          </p>
        </div>
        <div className="grid three">
          <article className="card marketing-card">
            <span className="feature-icon"><Waypoints /></span><b>01</b>
            <h3>{t("Tự discovery tool", "Discover tools at runtime")}</h3>
            <p>{t("Không hardcode catalog. GPT đọc service, tool và schema hiện tại từ Gateway.", "No hardcoded catalog. GPT reads the current service, tool, and schema from Gateway.")}</p>
          </article>
          <article className="card marketing-card">
            <span className="feature-icon"><KeyRound /></span><b>02</b>
            <h3>{t("Kiểm soát bằng Open ID", "Authorize with Open ID")}</h3>
            <p>{t("Trial hoặc paid Open ID quyết định MCP execution mà không trộn với provider credential.", "Trial or paid Open ID controls MCP execution without mixing entitlement with provider credentials.")}</p>
          </article>
          <article className="card marketing-card">
            <span className="feature-icon"><Braces /></span><b>03</b>
            <h3>{t("Action boundary ổn định", "Stable Action boundary")}</h3>
            <p>{t("Custom GPT chỉ cần Gateway Action chung; provider tool catalog có thể thay đổi độc lập.", "Custom GPT needs one generic Gateway Action while provider tool catalogs can evolve independently.")}</p>
          </article>
        </div>
      </section>

      <section className="section container open-id-marketing" id="open-id">
        <div className="open-id-marketing__copy">
          <span className="eyebrow">CORE PRODUCT · OPEN ID</span>
          <h2>{t("Bạn mua quyền Gateway.\nKhông mua API token.", "Buy Gateway access.\nNot an API token.")}</h2>
          <p className="lead small">
            {t(
              "Open ID là commercial entitlement. Gateway token chỉ là credential kỹ thuật để Custom GPT chứng minh quyền đó khi gọi Action.",
              "Open ID is the commercial entitlement. A Gateway token is only the technical credential Custom GPT uses to prove that entitlement when calling the Action.",
            )}
          </p>
          <a className="button" href="/app#open-id">{t("Khám phá Open ID", "Explore Open ID")}<ArrowRight size={16} /></a>
        </div>
        <div className="entitlement-visual">
          <div className="entitlement-visual__head"><KeyRound size={18} /><span>OPEN ID</span><strong>ACTIVE</strong></div>
          <div className="entitlement-chain">
            <div><small>GATEWAY TOKEN</small><code>gw_••••••••</code></div>
            <span>↓</span>
            <div className="active"><small>OPEN ID</small><code>oid_xxxxxxxxx</code></div>
            <span>↓</span>
            <div><small>OWNER ACCOUNT</small><code>member</code></div>
            <span>↓</span>
            <div><small>MCP CONNECTION</small><code>stitch · encrypted</code></div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">ONBOARDING</span>
            <h2>{t("Setup trước.\nTrial khi bạn sẵn sàng.", "Set up first.\nStart trial when ready.")}</h2>
          </div>
          <p className="muted">
            {t(
              "Đăng ký, kết nối Stitch, tải GPT kit và cấu hình Custom GPT không làm trial bắt đầu.",
              "Registration, Stitch setup, GPT kit download, and Custom GPT configuration do not start the trial.",
            )}
          </p>
        </div>
        <div className="marketing-timeline">
          <MarketingStep index="01" title={t("Đăng nhập", "Sign in")} detail={t("Tạo Guest account.", "Create a Guest account.")} />
          <MarketingStep index="02" title={t("Kết nối Stitch", "Connect Stitch")} detail={t("Credential được mã hóa tại Gateway.", "Credential is encrypted at Gateway.")} />
          <MarketingStep index="03" title={t("Tải GPT Kit", "Download GPT Kit")} detail={t("Instructions, Knowledge, Action Schema, setup guide.", "Instructions, Knowledge, Action Schema, setup guide.")} />
          <MarketingStep index="04" title={t("Create Trial Token", "Create Trial Token")} detail={t("Đúng lúc này 7 ngày mới bắt đầu.", "This is exactly when the 7 days begin.")} active />
          <MarketingStep index="05" title={t("Nâng cấp Open ID", "Upgrade to Open ID")} detail={t("Giữ nguyên GPT integration sau trial.", "Keep the same GPT integration after trial.")} />
        </div>
      </section>

      <section className="section container provider-marketing">
        <div className="section-heading section-heading--marketing">
          <div>
            <span className="eyebrow">MCP SERVICES</span>
            <h2>{t("Provider catalog có kiểm soát.", "A controlled provider catalog.")}</h2>
          </div>
          <p className="muted">{t("Phase đầu chứng minh toàn bộ flow bằng Google Stitch.", "Phase 1 proves the full flow with Google Stitch.")}</p>
        </div>
        <div className="provider-showcase">
          <article className="card provider-showcase__active">
            <div className="provider-showcase__logo">S</div>
            <div><span className="eyebrow">AVAILABLE NOW</span><h3>Google Stitch</h3><p>{t("UI generation qua MCP Gateway.", "UI generation through MCP Gateway.")}</p></div>
            <span className="status good"><CheckCircle2 size={14} /> SUPPORTED</span>
          </article>
          <article className="card provider-showcase__muted"><div className="provider-showcase__logo">G</div><div><span className="eyebrow">COMING SOON</span><h3>GitHub</h3></div></article>
          <article className="card provider-showcase__muted"><div className="provider-showcase__logo">F</div><div><span className="eyebrow">COMING SOON</span><h3>Figma</h3></div></article>
        </div>
      </section>

      <section className="section container security-section" id="security">
        <div>
          <span className="eyebrow">SECURITY BY BOUNDARY</span>
          <h2>{t("Secret ở server.\nCapability ở GPT.", "Secrets on server.\nCapability in GPT.")}</h2>
          <p className="lead small">
            {t(
              "GPT không cần biết Stitch API key hay OAuth token. Gateway chọn đúng credential của owner sau khi entitlement hợp lệ.",
              "GPT never needs the Stitch API key or OAuth token. Gateway selects the owner's credential only after entitlement succeeds.",
            )}
          </p>
        </div>
        <div className="security-terminal">
          <div><Sparkles size={16} /><span>Custom GPT</span><code>no provider secret</code></div>
          <div><PlugZap size={16} /><span>MCP Gateway</span><code>encrypted credential</code></div>
          <div><KeyRound size={16} /><span>Open ID</span><code>entitlement required</code></div>
          <div><LockKeyhole size={16} /><span>Provider</span><code>authorized execution</code></div>
        </div>
      </section>

      <section className="section container final-cta">
        <ShieldCheck size={26} />
        <span className="eyebrow">READY TO ROUTE</span>
        <h2>{t("Đưa MCP capability vào Custom GPT.", "Bring MCP capability to Custom GPT.")}</h2>
        <p className="lead small">{t("Bắt đầu bằng Stitch. Cấu hình trước, trial khi bạn sẵn sàng.", "Start with Stitch. Configure first, start the trial when you're ready.")}</p>
        <Link className="button" to="/app">{t("Mở Gateway Console", "Open Gateway Console")}<ArrowRight size={17} /></Link>
      </section>

      <footer className="footer container">
        <a className="brand" href="/">MCP Gateway</a>
        <span>{t("Controlled MCP access for Custom GPT.", "Controlled MCP access for Custom GPT.")}</span>
      </footer>
    </main>
  );
}

function MarketingStep({
  active = false,
  detail,
  index,
  title,
}: {
  active?: boolean;
  detail: string;
  index: string;
  title: string;
}) {
  return (
    <article className={`marketing-step ${active ? "active" : ""}`}>
      <span>{index}</span>
      <div><strong>{title}</strong><p>{detail}</p></div>
    </article>
  );
}
