import {
  CheckCircle2,
  ExternalLink,
  Github,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  Video,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useAdminLandingVideo,
  useUpdateAdminLandingVideo,
} from "@/modules/site-settings/queries/site-settings.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

type ProviderCandidate = {
  id: string;
  name: string;
  value: string;
  note: string;
};

const providerCandidates: ProviderCandidate[] = [
  {
    id: "github",
    name: "GitHub",
    value: "CODE / CI",
    note: "Repos, pull requests, issues, Actions and security context.",
  },
  {
    id: "figma",
    name: "Figma",
    value: "DESIGN",
    note: "Design context, variables, components and canvas workflows.",
  },
  {
    id: "linear",
    name: "Linear",
    value: "PRODUCT",
    note: "Issues, projects, comments and product execution.",
  },
  {
    id: "notion",
    name: "Notion",
    value: "KNOWLEDGE",
    note: "Pages, docs and structured workspace knowledge.",
  },
  {
    id: "atlassian",
    name: "Atlassian",
    value: "JIRA / CONFLUENCE",
    note: "Work items, project context and documentation.",
  },
  {
    id: "slack",
    name: "Slack",
    value: "COLLABORATION",
    note: "Search, messages, files, channels and workspace context.",
  },
];

export function AdminSiteSettingsPanel({
  accessToken,
}: {
  accessToken: string;
}) {
  const { t } = useUiLanguage();
  const config = useAdminLandingVideo(accessToken);
  const update = useUpdateAdminLandingVideo(accessToken);
  const [youtubeInput, setYoutubeInput] = useState("");

  useEffect(() => {
    if (config.data?.youtubeVideoId) {
      setYoutubeInput(
        `https://www.youtube.com/watch?v=${config.data.youtubeVideoId}`,
      );
    }
  }, [config.data?.youtubeVideoId]);

  const previewId = config.data?.youtubeVideoId ?? null;
  const isDirty = useMemo(() => {
    const stored = previewId
      ? `https://www.youtube.com/watch?v=${previewId}`
      : "";
    return youtubeInput.trim() !== stored;
  }, [previewId, youtubeInput]);

  return (
    <section className="admin-control-plane">
      <header className="admin-control-plane__hero">
        <div className="admin-control-plane__heading">
          <span className="eyebrow">ADMIN CONTROL PLANE</span>
          <h1>{t("Cấu hình hệ thống", "System settings")}</h1>
          <p>
            {t(
              "Quản lý nội dung Landing Page và theo dõi roadmap MCP từ một control plane riêng cho admin.",
              "Manage Landing Page content and track the MCP integration roadmap from an admin-only control plane.",
            )}
          </p>
        </div>

        <div className="admin-control-plane__status">
          <span className="status good">
            <ShieldCheck size={13} />
            ADMIN VERIFIED
          </span>
          <span className="status">
            <LockKeyhole size={13} />
            SERVER VALIDATED
          </span>
        </div>
      </header>

      <div className="admin-settings-metrics">
        <article>
          <span>CONTENT TARGET</span>
          <strong>Landing Page</strong>
          <small>Public surface</small>
        </article>
        <article>
          <span>VIDEO PROVIDER</span>
          <strong>YouTube</strong>
          <small>Privacy-enhanced embed</small>
        </article>
        <article>
          <span>PERSISTENCE</span>
          <strong>Site Settings</strong>
          <small>Validated video ID only</small>
        </article>
        <article>
          <span>ACCESS</span>
          <strong>Admin only</strong>
          <small>Role protected</small>
        </article>
      </div>

      <div className="admin-settings-workbench">
        <div className="admin-settings-workbench__main">
          <section className="admin-settings-card admin-settings-card--primary">
            <div className="admin-settings-card__top">
              <div className="admin-settings-card__identity">
                <span className="admin-settings-card__icon">
                  <Video size={19} />
                </span>
                <div>
                  <span className="eyebrow">LANDING MEDIA</span>
                  <h2>{t("Video walkthrough", "Walkthrough video")}</h2>
                  <p>
                    {t(
                      "Video public xuất hiện trong khối Walkthrough & Live Demo trên Landing Page.",
                      "The public video rendered inside the Landing Page Walkthrough & Live Demo section.",
                    )}
                  </p>
                </div>
              </div>

              <span className={`status ${previewId ? "good" : ""}`}>
                {previewId ? "PUBLISHED" : "NOT CONFIGURED"}
              </span>
            </div>

            <div className="admin-settings-input-block">
              <label htmlFor="landing-video-input">
                <span>YouTube source</span>
                <small>URL · VIDEO ID · IFRAME EMBED CODE</small>
              </label>
              <textarea
                id="landing-video-input"
                onChange={(event) => setYoutubeInput(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                rows={6}
                value={youtubeInput}
              />
              <div className="admin-settings-input-meta">
                <span>
                  <ShieldCheck size={13} />
                  {t(
                    "Raw HTML không được render",
                    "Raw HTML is never rendered",
                  )}
                </span>
                <span>
                  {t(
                    "Server chỉ lưu YouTube video ID hợp lệ",
                    "Server stores only a validated YouTube video ID",
                  )}
                </span>
              </div>
            </div>

            {update.error ? (
              <p className="notice error">{update.error.message}</p>
            ) : null}

            <div className="admin-settings-card__actions">
              <button
                className="secondary"
                disabled={update.isPending || !youtubeInput}
                onClick={() => setYoutubeInput("")}
                type="button"
              >
                {t("Xóa input", "Clear input")}
              </button>
              <button
                disabled={update.isPending || !isDirty}
                onClick={() => update.mutate(youtubeInput)}
                type="button"
              >
                <Save size={15} />
                {update.isPending
                  ? t("Đang lưu…", "Saving…")
                  : t("Lưu & publish", "Save & publish")}
              </button>
            </div>
          </section>

          <section className="admin-settings-security">
            <div>
              <span className="admin-settings-security__icon">
                <LockKeyhole size={18} />
              </span>
              <div>
                <span className="eyebrow">SECURITY BOUNDARY</span>
                <strong>
                  {t(
                    "Embed code được sanitize tại server",
                    "Embed input is normalized server-side",
                  )}
                </strong>
                <p>
                  {t(
                    "Admin có thể paste URL, video ID hoặc iframe; backend chỉ trích xuất ID hợp lệ và Landing chỉ render youtube-nocookie.com.",
                    "Admins may paste a URL, video ID, or iframe; the backend extracts only a valid ID and the Landing Page renders youtube-nocookie.com.",
                  )}
                </p>
              </div>
            </div>

            <div className="admin-settings-security__chain">
              <span>ADMIN INPUT</span>
              <i />
              <span>VALIDATE</span>
              <i />
              <span>VIDEO ID</span>
              <i />
              <span>PUBLIC EMBED</span>
            </div>
          </section>
        </div>

        <aside className="admin-preview-panel">
          <header className="admin-preview-panel__header">
            <div>
              <span className="eyebrow">PUBLIC PREVIEW</span>
              <strong>Walkthrough player</strong>
            </div>
            <span className={`status ${previewId ? "good" : ""}`}>
              {previewId ? "LIVE" : "EMPTY"}
            </span>
          </header>

          <div className="admin-preview-panel__chrome">
            <span />
            <span />
            <span />
            <code>LANDING_WALKTHROUGH</code>
          </div>

          <div className="admin-preview-panel__viewport">
            {previewId ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                src={`https://www.youtube-nocookie.com/embed/${previewId}?rel=0`}
                title="Landing walkthrough preview"
              />
            ) : (
              <div className="admin-preview-panel__empty">
                <Video size={28} />
                <strong>{t("Chưa có video", "No video configured")}</strong>
                <span>
                  {t(
                    "Paste YouTube source và publish để xem preview.",
                    "Paste a YouTube source and publish to populate this preview.",
                  )}
                </span>
              </div>
            )}
          </div>

          <footer className="admin-preview-panel__footer">
            <span>
              <CheckCircle2 size={13} />
              youtube-nocookie.com
            </span>
            <span>16:9</span>
          </footer>
        </aside>
      </div>

      <section className="admin-mcp-roadmap">
        <header className="admin-mcp-roadmap__header">
          <div>
            <span className="eyebrow">MCP ECOSYSTEM ROADMAP</span>
            <h2>{t("Provider nên tích hợp tiếp", "Recommended next MCP providers")}</h2>
            <p>
              {t(
                "Các provider dưới đây là candidate có MCP chính thức hoặc được vendor hỗ trợ. Chúng chưa được enable trong Gateway registry.",
                "These candidates have official or vendor-supported MCP offerings. They are not enabled in the Gateway registry yet.",
              )}
            </p>
          </div>
          <span className="status">
            <Workflow size={13} />
            RESEARCHED
          </span>
        </header>

        <div className="admin-mcp-roadmap__grid">
          {providerCandidates.map((provider, index) => (
            <article className="admin-mcp-candidate" key={provider.id}>
              <div className="admin-mcp-candidate__top">
                <span className="admin-mcp-candidate__icon">
                  {provider.id === "github" ? (
                    <Github size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}
                </span>
                <code>0{index + 1}</code>
              </div>
              <strong>{provider.name}</strong>
              <span>{provider.value}</span>
              <p>{provider.note}</p>
              <small>CANDIDATE · NOT CONNECTED</small>
            </article>
          ))}
        </div>

        <div className="admin-mcp-roadmap__note">
          <ShieldCheck size={15} />
          <span>
            {t(
              "Không tự thêm arbitrary MCP URL. Mỗi provider phải có adapter, auth boundary và allowlist riêng trước khi xuất hiện trong catalog thật.",
              "Do not enable arbitrary MCP URLs. Each provider needs its own adapter, authentication boundary, and allowlist before entering the real catalog.",
            )}
          </span>
          <ExternalLink size={14} />
        </div>
      </section>
    </section>
  );
}
