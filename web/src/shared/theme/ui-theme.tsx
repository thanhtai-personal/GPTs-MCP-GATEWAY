import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiTheme = "dark" | "light";

const STORAGE_KEY = "mcp-gateway.ui.theme";

type UiThemeContextValue = {
  theme: UiTheme;
  toggleTheme: () => void;
};

const UiThemeContext = createContext<UiThemeContextValue | null>(null);

export function UiThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<UiTheme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }

    if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <UiThemeContext.Provider value={value}>
      {children}
    </UiThemeContext.Provider>
  );
}

export function useUiTheme() {
  const value = useContext(UiThemeContext);
  if (!value) {
    throw new Error("useUiTheme must be used inside UiThemeProvider");
  }
  return value;
}
