import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { UI_COPY } from "@/shared/i18n/ui-copy";

export type UiLanguage = "vi" | "en" | "zh" | "ko" | "ja";
export type UiTranslator = (vi: string, en: string, zh?: string, ko?: string, ja?: string) => string;

export const UI_LANGUAGE_OPTIONS: ReadonlyArray<{ value: UiLanguage; label: string; shortLabel: string }> = [
  { value: "vi", label: "Tiếng Việt", shortLabel: "VI" },
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "zh", label: "简体中文", shortLabel: "中文" },
  { value: "ko", label: "한국어", shortLabel: "한국어" },
  { value: "ja", label: "日本語", shortLabel: "日本語" },
];

const STORAGE_KEY = "mcp-gateway.ui.language";
const SUPPORTED = new Set<UiLanguage>(UI_LANGUAGE_OPTIONS.map((item) => item.value));

type UiLanguageContextValue = { language: UiLanguage; setLanguage: (language: UiLanguage) => void; t: UiTranslator };
const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export function createUiTranslator(language: UiLanguage): UiTranslator {
  return (vi, en, zh, ko, ja) => {
    if (language === "vi") return vi;
    if (language === "en") return en;
    const explicit = language === "zh" ? zh : language === "ko" ? ko : ja;
    return explicit ?? UI_COPY[en]?.[language] ?? en;
  };
}

function resolveSystemLanguage(): UiLanguage {
  if (typeof navigator === "undefined") return "en";
  for (const raw of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const base = raw.toLowerCase().split("-")[0] as UiLanguage;
    if (SUPPORTED.has(base)) return base;
  }
  return "en";
}

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<UiLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as UiLanguage | null;
    setLanguage(stored && SUPPORTED.has(stored) ? stored : resolveSystemLanguage());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const t = useCallback(createUiTranslator(language), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  return <UiLanguageContext.Provider value={value}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const value = useContext(UiLanguageContext);
  if (!value) throw new Error("useUiLanguage must be used inside UiLanguageProvider");
  return value;
}
