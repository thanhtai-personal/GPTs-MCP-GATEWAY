import { Moon, Sun } from "lucide-react";
import { useUiTheme } from "@/shared/theme/ui-theme";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useUiTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`theme-toggle${compact ? " theme-toggle--compact" : ""}`}
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb">
          {isDark ? <Moon size={13} /> : <Sun size={13} />}
        </span>
      </span>
      {!compact ? <span>{isDark ? "Dark" : "Light"}</span> : null}
    </button>
  );
}
