import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiLanguage = "vi" | "en";

const STORAGE_KEY = "mcp-gateway.ui.language";

type UiLanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (vi: string, en: string) => string;
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<UiLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "vi" || stored === "en") setLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const t = useCallback(
    (vi: string, en: string) => (language === "vi" ? vi : en),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, t],
  );

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  );
}

export function useUiLanguage() {
  const value = useContext(UiLanguageContext);
  if (!value) {
    throw new Error("useUiLanguage must be used inside UiLanguageProvider");
  }
  return value;
}
