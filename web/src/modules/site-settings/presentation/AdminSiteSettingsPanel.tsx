import { Save, Video } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useAdminLandingVideo,
  useUpdateAdminLandingVideo,
} from "@/modules/site-settings/queries/site-settings.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

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

  return (
    <div className="console-screen admin-site-settings">
      <header className="console-screen__header">
        <span className="eyebrow">ADMIN SETTINGS</span>
        <h1>{t("Cấu hình Landing Page", "Landing Page Settings")}</h1>
        <p>
          {t(
            "Quản lý video walkthrough công khai. Chỉ YouTube URL, video ID hoặc iframe embed code được chấp nhận.",
            "Manage the public walkthrough video. Only a YouTube URL, video ID, or iframe embed code is accepted.",
          )}
        </p>
      </header>

      <div className="console-screen__body admin-settings-grid">
        <section className="card admin-settings-card">
          <div className="admin-settings-card__heading">
            <Video size={18} />
            <div>
              <strong>Landing walkthrough</strong>
              <span>YOUTUBE / PUBLIC</span>
            </div>
          </div>

          <label className="credential-field">
            <span>YouTube URL / ID / embed code</span>
            <textarea
              onChange={(event) => setYoutubeInput(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              rows={5}
              value={youtubeInput}
            />
          </label>

          <small className="admin-settings-help">
            {t(
              "Để trống rồi lưu để ẩn video. Server chỉ lưu YouTube video ID hợp lệ, không render raw HTML.",
              "Save an empty value to hide the video. The server stores only a validated YouTube video ID and never renders raw HTML.",
            )}
          </small>

          {update.error ? (
            <p className="notice error">{update.error.message}</p>
          ) : null}

          <button
            disabled={update.isPending}
            onClick={() => update.mutate(youtubeInput)}
            type="button"
          >
            <Save size={15} />
            {update.isPending
              ? t("Đang lưu…", "Saving…")
              : t("Lưu video", "Save video")}
          </button>
        </section>

        <aside className="card admin-video-preview">
          <span className="eyebrow">PUBLIC PREVIEW</span>
          {previewId ? (
            <div className="walkthrough-video__viewport">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                src={`https://www.youtube-nocookie.com/embed/${previewId}?rel=0`}
                title="Landing walkthrough preview"
              />
            </div>
          ) : (
            <div className="admin-video-preview__empty">
              {t("Chưa cấu hình video.", "No video configured.")}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
