import { ChevronDown, Grid2X2, List } from "lucide-react";
import { useUiLanguage } from "@/shared/i18n/ui-language";

export type ProviderViewMode = "grid" | "list";

export function ProviderViewToolbar({
  allExpanded,
  onToggleAll,
  onViewModeChange,
  viewMode,
}: {
  allExpanded: boolean;
  onToggleAll: () => void;
  onViewModeChange: (mode: ProviderViewMode) => void;
  viewMode: ProviderViewMode;
}) {
  const { t } = useUiLanguage();

  return (
    <div
      className="provider-view-toolbar"
      aria-label={t("Tùy chọn hiển thị provider", "Provider view options")}
    >
      <div className="provider-view-toolbar__copy">
        <span className="eyebrow">SERVICE FRAME</span>
        <strong>{t("MCP provider catalog", "MCP provider catalog")}</strong>
        <small>
          {t(
            "Service mặc định thu gọn. Mở từng service khi cần cấu hình credential.",
            "Services are collapsed by default. Expand a service when you need to configure credentials.",
          )}
        </small>
      </div>

      <div className="provider-view-toolbar__actions">
        <div
          className="provider-view-switch"
          role="group"
          aria-label={t("Kiểu hiển thị", "Layout")}
        >
          <button
            aria-pressed={viewMode === "grid"}
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => onViewModeChange("grid")}
            title={t("Dạng lưới", "Grid view")}
            type="button"
          >
            <Grid2X2 size={15} />
            <span>{t("Lưới", "Grid")}</span>
          </button>
          <button
            aria-pressed={viewMode === "list"}
            className={viewMode === "list" ? "active" : ""}
            onClick={() => onViewModeChange("list")}
            title={t("Dạng danh sách", "List view")}
            type="button"
          >
            <List size={16} />
            <span>{t("Danh sách", "List")}</span>
          </button>
        </div>

        <button
          className="secondary provider-expand-all"
          onClick={onToggleAll}
          type="button"
        >
          <ChevronDown
            className={allExpanded ? "is-expanded" : ""}
            size={15}
          />
          {allExpanded
            ? t("Thu gọn tất cả", "Collapse all")
            : t("Mở rộng tất cả", "Expand all")}
        </button>
      </div>
    </div>
  );
}
