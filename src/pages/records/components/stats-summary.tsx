import type { ReactNode } from "react";
import { Aperture, Camera, Images, Search, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import CornerFlourish from "@/components/corner-flourish";
import { parseISO } from "@/lib/date-utils";
import { SHOOT_COUNT_TYPES } from "@/lib/shoot-types";
import { topCounterpartLabelKey, type UserRole } from "@/lib/roles";
import type { CosplayRecord } from "@/lib/record-types";

function StatCard({
  icon: Icon,
  deco,
  label,
  value,
  sub,
  onClick,
  compact = false,
}: {
  icon: typeof Camera;
  deco: string;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  onClick?: () => void;
  compact?: boolean;
}) {
  const clickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (event) => (event.key === "Enter" || event.key === " ") && onClick?.() : undefined}
      className={`surface anim-fade-up relative overflow-hidden rounded-2xl p-4 transition-transform ${
        clickable ? "cursor-pointer hover:-translate-y-1" : ""
      }`}
    >
      <CornerFlourish position="tl" size={44} />
      <CornerFlourish position="br" size={44} />

      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} style={{ color: "var(--accent)" }} />
        <span className="font-deco text-muted-foreground text-[10px] tracking-[0.2em]">{deco}</span>
        {clickable && <Search size={12} className="ml-auto" style={{ color: "var(--accent)", opacity: 0.7 }} />}
      </div>

      <div className="font-serif-tc text-muted-foreground text-sm">{label}</div>
      <div
        className={`font-serif-tc glow-accent mt-0.5 font-bold ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}
        style={{ color: "var(--accent)" }}
      >
        {value}
      </div>
      {sub && <div className="text-muted-foreground mt-1 truncate text-xs">{sub}</div>}
    </div>
  );
}

function round1(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export default function StatsSummary({
  records,
  role,
  typeColorMap,
  onApplySearch,
}: {
  records: CosplayRecord[];
  role: UserRole;
  typeColorMap: Record<string, string>;
  onApplySearch: (term: string) => void;
}) {
  const { t } = useTranslation();

  // 出角次數：每筆紀錄算一次
  const appearances = records.length;
  // 拍攝次數：只計外拍／棚拍／活動／同人場
  const shootCount = records.filter((record) => SHOOT_COUNT_TYPES.has(record.type)).length;

  // 平均出角次數（依實際紀錄的頻率自動換算單位）
  let avgUnit = "";
  let avgNumber = "—";

  if (appearances > 0) {
    const dates = records
      .map((record) => parseISO(record.date))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime());

    const monthsCovered = new Set(records.map((record) => record.date.slice(0, 7))).size;

    if (monthsCovered <= 1 && dates.length > 0) {
      const spanDays = Math.round((dates[dates.length - 1].getTime() - dates[0].getTime()) / 86400000) + 1;
      const weeks = Math.max(1, spanDays / 7);
      avgUnit = t("stats.avgWeekly");
      avgNumber = round1(appearances / weeks);
    } else {
      avgUnit = t("stats.avgMonthly");
      avgNumber = round1(appearances / Math.max(1, monthsCovered));
    }
  }

  const countBy = (key: "photographer" | "type") => {
    const map: Record<string, number> = {};
    records.forEach((record) => {
      const value = record[key];
      if (value) map[value] = (map[value] || 0) + 1;
    });
    return map;
  };

  const topEntry = (map: Record<string, number>) => {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0] : null;
  };

  const topPhotographer = topEntry(countBy("photographer"));
  const typeCounts = countBy("type");

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Camera}
          deco={t("stats.totalShootsDeco")}
          label={t("stats.totalShoots")}
          value={shootCount}
          sub={t("stats.totalShootsSub")}
        />

        <StatCard
          icon={Images}
          deco={t("stats.appearancesDeco")}
          label={t("stats.appearances")}
          value={appearances}
          sub={t("stats.appearancesSub", { count: appearances })}
        />

        <StatCard
          icon={TrendingUp}
          deco={t("stats.avgDeco")}
          label={t("stats.avg")}
          compact
          value={
            appearances > 0 ? (
              <span>
                {avgUnit} <span style={{ fontSize: "1.3em" }}>{avgNumber}</span> {t("stats.avgTimes")}
              </span>
            ) : (
              t("stats.none")
            )
          }
          sub={appearances > 0 ? t("stats.avgSub", { count: appearances }) : t("stats.empty")}
        />

        <StatCard
          icon={Aperture}
          deco={t("stats.topPhotographerDeco")}
          label={t(topCounterpartLabelKey(role))}
          value={topPhotographer ? topPhotographer[0] : t("stats.none")}
          sub={
            topPhotographer
              ? t("stats.topPhotographerSub", { count: topPhotographer[1] })
              : t("stats.empty")
          }
          onClick={topPhotographer ? () => onApplySearch(topPhotographer[0]) : undefined}
        />
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const color = typeColorMap[type] || "var(--accent)";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onApplySearch(type)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-transform hover:-translate-y-0.5"
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, transparent)`,
                    color,
                    border: `1px solid ${color}`,
                  }}
                >
                  {type} · {count}
                </button>
              );
            })}
        </div>
      )}
    </section>
  );
}
