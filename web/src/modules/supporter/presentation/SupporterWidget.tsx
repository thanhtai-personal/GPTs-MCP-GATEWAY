import { Grip, LifeBuoy, MessageCircleQuestion, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SUPPORTER_QUESTIONS } from "@/modules/supporter/domain/supporter-content";
import { useUiLanguage } from "@/shared/i18n/ui-language";
import "./Supporter.css";

type Point = { x: number; y: number };
const STORAGE_KEY = "gpts-mcp-supporter-position";
const ICON_SIZE = 52;
const EDGE = 12;

export function SupporterWidget() {
  const { language, t } = useUiLanguage();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const fallback = { x: Math.max(EDGE, window.innerWidth - ICON_SIZE - 28), y: Math.max(EDGE, window.innerHeight - ICON_SIZE - 28) };
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Point;
        setPosition(clamp(parsed));
      } else setPosition(fallback);
    } catch { setPosition(fallback); }

    const onResize = () => setPosition((current) => clamp(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const clamp = (point: Point): Point => ({
    x: Math.min(Math.max(EDGE, point.x), Math.max(EDGE, window.innerWidth - ICON_SIZE - EDGE)),
    y: Math.min(Math.max(EDGE, point.y), Math.max(EDGE, window.innerHeight - ICON_SIZE - EDGE)),
  });

  return (
    <>
      <button
        aria-label={t("Mở Supporter. Có thể kéo để di chuyển.", "Open Supporter. Drag to move.")}
        className="supporter-fab"
        onClick={() => { if (!drag.current?.moved) setOpen((value) => !value); }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointerId: event.pointerId, offsetX: event.clientX - position.x, offsetY: event.clientY - position.y, moved: false };
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.pointerId !== event.pointerId) return;
          const next = clamp({ x: event.clientX - drag.current.offsetX, y: event.clientY - drag.current.offsetY });
          if (Math.abs(next.x - position.x) > 2 || Math.abs(next.y - position.y) > 2) drag.current.moved = true;
          setPosition(next);
        }}
        onPointerUp={(event) => {
          if (!drag.current || drag.current.pointerId !== event.pointerId) return;
          const moved = drag.current.moved;
          drag.current = null;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(position)); } catch { /* storage optional */ }
          if (moved) event.preventDefault();
        }}
        style={{ left: position.x, top: position.y }}
        type="button"
      >
        <LifeBuoy size={21} />
        <span className="supporter-fab__drag"><Grip size={12} /></span>
      </button>

      {open ? (
        <aside className="supporter-panel" style={{ left: Math.min(Math.max(12, position.x - 310), Math.max(12, window.innerWidth - 380)), top: Math.min(Math.max(12, position.y - 420), Math.max(12, window.innerHeight - 500)) }}>
          <header><div><span className="eyebrow">SUPPORTER</span><h2>{t("Trợ giúp nhanh", "Quick help")}</h2></div><button className="icon-button" onClick={() => setOpen(false)} type="button" aria-label={t("Đóng Supporter", "Close Supporter")}><X size={17} /></button></header>
          <p className="muted">{t("Chọn câu hỏi thường gặp về kết nối provider và credential.", "Choose a common question about provider connections and credentials.")}</p>
          <div className="supporter-faq">
            {SUPPORTER_QUESTIONS.map((item) => <details key={item.id}><summary><MessageCircleQuestion size={15} />{language === "vi" ? item.question.vi : item.question.en}</summary><p>{language === "vi" ? item.answer.vi : item.answer.en}</p></details>)}
          </div>
        </aside>
      ) : null}
    </>
  );
}
