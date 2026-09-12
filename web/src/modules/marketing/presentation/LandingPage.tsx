import { ArrowRight, Braces, KeyRound, LockKeyhole, PlugZap, Sparkles, Waypoints } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = { language: "vi" | "en" };

export function LandingPage({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);

  return (
    <main className="landing" lang={language}>
      <header className="site-header container">
        <Link className="brand brand--large" to="/"><span className="brand-mark"><PlugZap size={18} /></span>MCP Gateway</Link>
        <nav className="landing-nav">
          <a href="#how-it-works">{t("Cách hoạt động", "How it works")}</a>
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
              "Cho Custom GPT tự discovery và gọi MCP qua một execution boundary có kiểm soát — không đưa provider credential vào GPT.",
              "Let Custom GPT discover and call MCP through one controlled execution boundary — without putting provider credentials inside GPT.",
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
          <div className="gateway-visual__top"><span className="window-dots"><i /><i /><i /></span><code>gateway.route()</code><span className="live-dot">LIVE</span></div>
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

      <section className="section container" id="how-it-works">
        <div className="section-heading section-heading--marketing">
          <div><span className="eyebrow">THE CONTROL LAYER</span><h2>{t("Từ prompt đến MCP call, có kiểm soát.", "From prompt to MCP call, under control.")}</h2></div>
          <p className="muted">{t("GPT tự nhận diện capability, Gateway giữ entitlement và credential.", "GPT recognizes the capability; Gateway owns entitlement and credentials.")}</p>
        </div>
        <div className="grid three">
          <article className="card marketing-card"><span className="feature-icon"><Waypoints /></span><b>01</b><h3>{t("Tự discovery tool", "Discover tools at runtime")}</h3><p>{t("Không hardcode catalog. GPT đọc danh sách tool và schema hiện tại từ Gateway.", "No hardcoded catalog. GPT reads the current tool list and schema from Gateway.")}</p></article>
          <article className="card marketing-card"><span className="feature-icon"><KeyRound /></span><b>02</b><h3>{t("Kiểm soát bằng Open ID", "Authorize with Open ID")}</h3><p>{t("Trial hoặc Open ID quyết định quyền execute mà không trộn với provider credential.", "Trial or Open ID controls execution without mixing entitlement with provider credentials.")}</p></article>
          <article className="card marketing-card"><span className="feature-icon"><Braces /></span><b>03</b><h3>{t("Action schema ổn định", "Stable Action boundary")}</h3><p>{t("Custom GPT chỉ cần một Gateway Action chung để gọi nhiều MCP service.", "Custom GPT needs one generic Gateway Action surface for multiple MCP services.")}</p></article>
        </div>
      </section>

      <section className="section container security-section" id="security">
        <div><span className="eyebrow">SECURITY BY BOUNDARY</span><h2>{t("Secret ở server.\nCapability ở GPT.", "Secrets on server.\nCapability in GPT.")}</h2></div>
        <div className="security-terminal">
          <div><Sparkles size={16} /><span>Custom GPT</span><code>no provider secret</code></div>
          <div><PlugZap size={16} /><span>MCP Gateway</span><code>encrypted credential</code></div>
          <div><LockKeyhole size={16} /><span>Provider</span><code>authorized execution</code></div>
        </div>
      </section>

      <footer className="footer container"><a className="brand" href="/">MCP Gateway</a><span>{t("Controlled MCP access for Custom GPT.", "Controlled MCP access for Custom GPT.")}</span></footer>
    </main>
  );
}
