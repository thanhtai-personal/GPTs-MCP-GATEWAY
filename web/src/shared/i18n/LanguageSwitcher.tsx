import { Languages } from "lucide-react";
import { UI_LANGUAGE_OPTIONS, type UiLanguage, useUiLanguage } from "@/shared/i18n/ui-language";

export function LanguageSwitcher() {
  const { language, setLanguage } = useUiLanguage();
  return (
    <label className="language-switcher language-switcher--select">
      <Languages aria-hidden="true" size={14} />
      <span className="sr-only">Language</span>
      <select aria-label="Language" onChange={(event) => setLanguage(event.target.value as UiLanguage)} value={language}>
        {UI_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
