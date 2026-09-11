import { useUiLanguage } from "@/shared/i18n/ui-language";

export function LanguageSwitcher() {
  const { language, setLanguage } = useUiLanguage();
  return (
    <div className="language-switcher" aria-label="Language">
      <button
        className={language === "vi" ? "active" : ""}
        onClick={() => setLanguage("vi")}
        type="button"
      >
        VI
      </button>
      <button
        className={language === "en" ? "active" : ""}
        onClick={() => setLanguage("en")}
        type="button"
      >
        EN
      </button>
    </div>
  );
}
