import { Link } from "@tanstack/react-router";

type Props = { language: "vi" | "en" };

export function LandingPage({ language }: Props) {
  const vi = language === "vi";
  const t = (viText: string, enText: string) => (vi ? viText : enText);

  return (
    <main lang={language}>
      <header className="site-header container">
        <Link className="brand" to="/">MCP Gateway</Link>
        <nav className="row">
          <a href={vi ? "/" : "/vi"}>{vi ? "EN" : "VI"}</a>
          <Link className="button secondary" to="/app">
            {t("Mở ứng dụng", "Open app")}
          </Link>
        </nav>
      </header>

      <section className="hero container">
        <div>
          <span className="eyebrow">CUSTOM GPT × MCP</span>
          <h1>
            {t(
              "Cho GPT của bạn dùng MCP như một coding agent.",
              "Give your Custom GPT agent-like MCP access.",
            )}
          </h1>
          <p className="lead">
            {t(
              "Một Gateway bảo mật để GPT tự discovery tool, chọn đúng MCP và gọi bằng credential của chính bạn — không đưa provider API key vào GPT.",
              "One secure Gateway where GPT discovers tools, selects the right MCP service, and executes with your credentials — without exposing provider API keys to GPT.",
            )}
          </p>
          <div className="row hero-actions">
            <Link className="button" to="/app">
              {t("Dùng thử 7 ngày", "Start 7-day trial")}
            </Link>
            <a className="button secondary" href="#how-it-works">
              {t("Cách hoạt động", "How it works")}
            </a>
          </div>
        </div>
        <div className="terminal-card" aria-label="Gateway flow">
          <code>
            User intent{"\n"}
            {"  ↓"}{"\n"}
            Custom GPT{"\n"}
            {"  ↓  listMcpTools('stitch')"}{"\n"}
            MCP Gateway{"\n"}
            {"  ↓  Open ID authorized"}{"\n"}
            Google Stitch MCP
          </code>
        </div>
      </section>

      <section className="section container" id="how-it-works">
        <span className="eyebrow">{t("CỐT LÕI", "CORE CONCEPT")}</span>
        <h2>
          {t(
            "Open ID là quyền truy cập. GPT Kit là cách kết nối.",
            "Open ID is the entitlement. GPT Kit is the integration.",
          )}
        </h2>
        <div className="grid three">
          <article className="card">
            <h3>1. {t("Kết nối MCP", "Connect MCP")}</h3>
            <p>{t("Lưu Stitch API key trong Gateway. Secret được giữ phía server.", "Store your Stitch API key in Gateway. The secret stays server-side.")}</p>
          </article>
          <article className="card">
            <h3>2. {t("Thêm GPT Kit", "Install GPT Kit")}</h3>
            <p>{t("Import Action Schema, Instructions và Knowledge vào Custom GPT.", "Import the Action Schema, Instructions, and Knowledge into your Custom GPT.")}</p>
          </article>
          <article className="card">
            <h3>3. {t("Kích hoạt Open ID", "Activate Open ID")}</h3>
            <p>{t("Guest có một trial 7 ngày. Member dùng Open ID chính thức.", "Guests get one 7-day trial. Members use a paid Open ID.")}</p>
          </article>
        </div>
      </section>

      <section className="section container split">
        <div>
          <span className="eyebrow">STITCH FIRST</span>
          <h2>{t("Thử nghiệm đầu tiên với Google Stitch.", "First-class Google Stitch pilot.")}</h2>
        </div>
        <p className="lead small">
          {t(
            "Gateway dùng MCP tool discovery tại runtime, nên GPT không cần nhớ cứng danh sách tool của Stitch.",
            "Gateway uses runtime MCP tool discovery, so GPT does not need a hardcoded Stitch tool catalog.",
          )}
        </p>
      </section>

      <footer className="footer container">
        <strong>MCP Gateway</strong>
        <span>{t("Kết nối Custom GPT với MCP qua một gateway có kiểm soát.", "Connect Custom GPT to MCP through one controlled gateway.")}</span>
      </footer>
    </main>
  );
}
