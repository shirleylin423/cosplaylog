import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Aperture, Camera, ChevronLeft, ChevronRight, Images, Sparkles, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import CornerFlourish from "@/components/corner-flourish";
import { SHOOT_COUNT_TYPES } from "@/lib/shoot-types";
import type { CosplayRecord } from "@/lib/record-types";
import YearInReviewCarousel from "./year-in-review-carousel";

function StatBox({ icon: Icon, label, value, sub }: { icon: typeof Camera; label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="surface relative overflow-hidden rounded-2xl p-4">
      <CornerFlourish position="tl" size={38} />
      <div className="mb-1.5 flex items-center gap-2">
        <Icon size={15} style={{ color: "var(--accent)" }} />
        <span className="font-serif-tc text-foreground text-sm">{label}</span>
      </div>
      <div className="font-serif-tc glow-accent text-2xl font-bold" style={{ color: "var(--accent)" }}>
        {value}
      </div>
      {sub && <div className="text-muted-foreground mt-0.5 truncate text-xs">{sub}</div>}
    </div>
  );
}

/**
 * 年度回憶：全螢幕的年度統計與精選照片回顧。
 *
 * 每年 12/31 會自動彈出一次，平常也能從頁首的「年度回憶」按鈕打開。
 */
export default function YearInReview({
  records,
  startYear,
  typeColorMap,
  onClose,
}: {
  records: CosplayRecord[];
  startYear: number;
  typeColorMap: Record<string, string>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const set = new Set(
      records.map((record) => Number(record.date.slice(0, 4))).filter((year) => Number.isFinite(year) && year > 0),
    );
    set.add(currentYear);
    set.add(startYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [records, currentYear, startYear]);

  const [year, setYear] = useState(startYear);
  const yearIndex = years.indexOf(year);

  const yearRecords = useMemo(
    () => records.filter((record) => record.date.slice(0, 4) === String(year)).sort((a, b) => a.date.localeCompare(b.date)),
    [records, year],
  );

  const stats = useMemo(() => {
    const appearances = yearRecords.length;
    const shoots = yearRecords.filter((record) => SHOOT_COUNT_TYPES.has(record.type)).length;

    const topEntry = (key: "photographer" | "character" | "type") => {
      const counts: Record<string, number> = {};
      yearRecords.forEach((record) => {
        const value = record[key];
        if (value) counts[value] = (counts[value] || 0) + 1;
      });
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return entries.length ? entries[0] : null;
    };

    return {
      appearances,
      shoots,
      topPhotographer: topEntry("photographer"),
      topCharacter: topEntry("character"),
      typeCounts: Object.entries(
        yearRecords.reduce<Record<string, number>>((acc, record) => {
          if (record.type) acc[record.type] = (acc[record.type] || 0) + 1;
          return acc;
        }, {}),
      ).sort((a, b) => b[1] - a[1]),
      months: new Set(yearRecords.map((record) => record.date.slice(5, 7))).size,
    };
  }, [yearRecords]);

  // 精選：每個月挑第一筆，最多 12 張，依時間排序
  const featured = useMemo(() => {
    const byMonth = new Map<string, CosplayRecord>();
    yearRecords.forEach((record) => {
      const month = record.date.slice(5, 7);
      if (!byMonth.has(month)) byMonth.set(month, record);
    });
    return Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, record]) => record);
  }, [yearRecords]);

  // Esc 關閉
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function changeYear(delta: number) {
    const next = years[yearIndex + delta];
    if (next !== undefined) setYear(next);
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "linear-gradient(165deg, var(--bg-a), var(--bg-b) 55%, var(--bg-c))" }}
    >
      <div className="relative mx-auto max-w-3xl px-5 py-6 sm:px-6 sm:py-10">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("review.close")}
          className="btn-ghost absolute right-5 top-6 rounded-full p-2 sm:right-6 sm:top-10"
        >
          <X size={18} />
        </button>

        {/* 標題 */}
        <header className="anim-fade-up text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span className="font-deco text-muted-foreground text-[11px] tracking-[0.3em]">{t("review.deco")}</span>
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
          </div>

          <h2 className="font-serif-tc glow-accent text-4xl font-black sm:text-5xl" style={{ color: "var(--accent)" }}>
            {year}
          </h2>

          <p className="font-serif-tc text-foreground mt-2 text-lg">{t("review.title")}</p>

          <p className="text-muted-foreground mt-1 text-sm">
            {t("review.subtitle", { year, count: stats.appearances })}
          </p>

          {/* 換年份 */}
          {years.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => changeYear(-1)}
                disabled={yearIndex >= years.length - 1}
                aria-label={t("review.yearPrev")}
                className="btn-ghost rounded-full p-1.5 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="font-deco text-muted-foreground text-xs tracking-[0.25em]">{year}</span>

              <button
                type="button"
                onClick={() => changeYear(1)}
                disabled={yearIndex <= 0}
                aria-label={t("review.yearNext")}
                className="btn-ghost rounded-full p-1.5 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </header>

        {yearRecords.length === 0 ? (
          <div className="surface anim-fade-up mt-8 rounded-3xl p-10 text-center">
            <Star size={36} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="font-serif-tc text-foreground mb-1 text-lg">{t("review.empty")}</p>
            <p className="text-muted-foreground text-sm">{t("review.emptyDesc")}</p>
          </div>
        ) : (
          <>
            {/* 年度統計 */}
            <section className="anim-fade-up mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              <StatBox icon={Images} label={t("review.statAppearances")} value={stats.appearances} />
              <StatBox icon={Camera} label={t("review.statShoots")} value={stats.shoots} />
              <StatBox
                icon={Aperture}
                label={t("review.statTopPhotographer")}
                value={stats.topPhotographer ? stats.topPhotographer[0] : t("review.statNone")}
                sub={
                  stats.topPhotographer
                    ? `${stats.topPhotographer[1]} ${t("review.statTimes")}`
                    : undefined
                }
              />
              <StatBox
                icon={Star}
                label={t("review.statTopCharacter")}
                value={stats.topCharacter ? stats.topCharacter[0] : t("review.statNone")}
                sub={stats.topCharacter ? `${stats.topCharacter[1]} ${t("review.statTimes")}` : undefined}
              />
            </section>

            {/* 拍攝類型分佈 */}
            {stats.typeCounts.length > 0 && (
              <section className="anim-fade-up mt-5">
                <div className="font-serif-tc text-muted-foreground mb-2 text-sm">{t("review.statTypeDistribution")}</div>
                <div className="flex flex-wrap gap-2">
                  {stats.typeCounts.map(([type, count]) => {
                    const color = typeColorMap[type] || "var(--accent)";
                    return (
                      <span
                        key={type}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          background: `color-mix(in srgb, ${color} 18%, transparent)`,
                          color,
                          border: `1px solid ${color}`,
                        }}
                      >
                        {type} · {count}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 精選回顧 */}
            <section className="anim-fade-up mt-6">
              <div className="font-serif-tc mb-3 text-center text-sm" style={{ color: "var(--accent)" }}>
                {t("review.photosTitle")}
              </div>

              <YearInReviewCarousel key={year} photos={featured} typeColorMap={typeColorMap} />

              <p className="text-muted-foreground mt-3 text-center text-xs">
                {t("review.footnote", { count: stats.appearances, months: stats.months })}
              </p>
            </section>
          </>
        )}

        <div className="mt-8 flex justify-center pb-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary font-serif-tc rounded-full px-6 py-3 text-sm font-bold"
          >
            {t("review.backToRecords")}
          </button>
        </div>
      </div>
    </div>
  );
}
