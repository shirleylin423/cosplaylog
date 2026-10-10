import { Award, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import InstallAppButton from "@/components/install-app-button";
import ThemePicker from "@/components/theme-picker";
import type { ThemeKey } from "@/lib/themes";

/** 我的紀錄頁的頁首：標題、主題挑選、年度回憶、新增紀錄 */
export default function RecordsHeader({
  themeKey,
  onThemeChange,
  onAddRecord,
  onOpenReview,
  onHome,
}: {
  themeKey: ThemeKey;
  onThemeChange: (themeKey: ThemeKey) => void;
  onAddRecord: () => void;
  onOpenReview: () => void;
  /** 點標題：回到月曆並清除篩選 */
  onHome: () => void;
}) {
  const { t } = useTranslation();
  const appName = t("common.appName");

  return (
    <header className="sticky top-0 z-30">
      <div
        className="pt-safe backdrop-blur-md"
        style={{
          background: "color-mix(in srgb, var(--surface-solid) 78%, transparent)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onHome}
            title={t("records.backToCalendar")}
            className="flex flex-col items-start leading-none transition-opacity hover:opacity-80"
          >
            <h1 className="font-serif-tc text-2xl font-black tracking-wide sm:text-3xl">
              <span style={{ color: "var(--text)" }}>{appName.slice(0, 2)}</span>
              <span className="glow-accent" style={{ color: "var(--accent)" }}>
                {appName.slice(2)}
              </span>
            </h1>
            <span className="font-deco text-muted-foreground mt-1 text-[10px] tracking-[0.3em] sm:text-xs">
              {t("common.appNameLatin")}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <ThemePicker themeKey={themeKey} onChange={onThemeChange} />

            <button
              type="button"
              onClick={onOpenReview}
              className="btn-ghost font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-2 text-sm"
            >
              <Award size={16} style={{ color: "var(--accent)" }} />
              <span className="hidden sm:inline">{t("review.open")}</span>
            </button>

            <InstallAppButton />

            <button
              type="button"
              onClick={onAddRecord}
              className="btn-primary font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium sm:px-4"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t("records.add")}</span>
              <span className="sm:hidden">{t("records.add.short")}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
