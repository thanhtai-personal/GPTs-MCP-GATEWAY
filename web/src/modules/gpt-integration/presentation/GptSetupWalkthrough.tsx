import { PlayCircle } from "lucide-react";
import { usePublicLandingVideo } from "@/modules/site-settings/queries/site-settings.queries";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export function GptSetupWalkthrough() {
  const { t } = useUiLanguage();
  const walkthrough = usePublicLandingVideo();
  const videoId = walkthrough.data?.youtubeVideoId;

  return (
    <section className="card gpt-setup-video">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">SETUP WALKTHROUGH</span>
          <h2>
            {t(
              "Video hướng dẫn cấu hình Custom GPT",
              "Custom GPT setup walkthrough",
            )}
          </h2>
        </div>
        <span className={`status ${videoId ? "good" : ""}`}>
          <PlayCircle size={14} />
          {videoId ? "READY" : "AWAITING VIDEO"}
        </span>
      </div>

      <p className="muted">
        {t(
          "Xem trực tiếp quy trình upload Knowledge, import Action schema, gắn Gateway token và kiểm tra runtime discovery.",
          "Follow the setup flow for Knowledge upload, Action schema import, Gateway token configuration, and runtime discovery.",
        )}
      </p>

      <div className="gpt-setup-video__frame">
        {videoId ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
            title={t(
              "Video hướng dẫn cấu hình Custom GPT",
              "Custom GPT setup walkthrough video",
            )}
          />
        ) : (
          <div className="gpt-setup-video__empty">
            <PlayCircle size={30} />
            <strong>
              {t(
                "Chưa cấu hình video hướng dẫn",
                "Setup walkthrough is not configured yet",
              )}
            </strong>
            <span>
              {t(
                "Admin có thể cấu hình YouTube video trong Settings.",
                "An admin can configure the YouTube video in Settings.",
              )}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
