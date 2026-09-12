import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/shared/branding/BrandLogo";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  eyebrow,
  sections,
  summary,
  title,
  updatedAt,
}: {
  eyebrow: string;
  sections: LegalSection[];
  summary: string;
  title: string;
  updatedAt: string;
}) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <div className="container legal-header__row">
          <Link className="brand brand--large" to="/">
            <BrandLogo />
          </Link>
          <div className="legal-header__actions">
            <ThemeToggle compact />
            <Link className="button secondary button--quiet" to="/">
              <ArrowLeft size={14} />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      <div className="container legal-layout">
        <aside className="legal-meta-card">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{summary}</p>
          <div className="legal-meta-card__status">
            <ShieldCheck size={16} />
            <div>
              <small>Last updated</small>
              <strong>{updatedAt}</strong>
            </div>
          </div>
          <nav aria-label="Legal navigation" className="legal-nav">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </nav>
        </aside>

        <article className="legal-document">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </div>

      <footer className="legal-footer">
        <div className="container legal-footer__row">
          <BrandLogo variant="lockup" />
          <span>MCP Gateway · Secure MCP control plane for Custom GPTs</span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
