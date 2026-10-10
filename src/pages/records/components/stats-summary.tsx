import type { ReactNode } from "react";
import { Aperture, Camera, Images, Search, Star, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import CornerFlourish from "@/components/corner-flourish";
import { SHOOT_COUNT_TYPES } from "@/lib/shoot-types";
import { computeAverage, topPerson, type AveragePeriod } from "@/lib/stats";
import { topCharacterDecoKey, topCharacterLabelKey, topCounterpartDecoKey, topCounterpartLabelKey, type UserRole } from "@/lib/roles";
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

export default function StatsSummary({
  records,
  role,
  averagePeriod,
  typeColorMap,
  onApplySearch,
}: {
  records: CosplayRecord[];
  role: UserRole;
  /** 目前檢視的範圍決定平均的單位與期間長度：年 → 每月，月／日／區間 → 每週 */
  averagePeriod: AveragePeriod;
  typeColorMap: Record<string, string>;
  onApplySearch: (term: string) => void;
}) {
  const { t } = useTranslation();
  const isPhotographer = role === "photographer";

  const total = records.length;
  // coser 的「拍攝次數」只計外拍／棚拍／活動／同人場；攝影身分則計所有登錄的紀錄
  const shootCount = isPhotographer
    ? total
    : records.filter((record) => SHOOT_COUNT_TYPES.has(record.type)).length;

  // 平均次數（依實際紀錄的頻率自動換算單位）
  const average = computeAverage(records, averagePeriod);

  const countTypes = () => {
    const map: Record<string, number> = {};
    records.forEach((record) => {
      if (record.type) map[record.type] = (map[record.type] || 0) + 1;
    });
    return map;
  };

  // 以「單人」計算：多人共用一筆紀錄時每個人都各算一次
  const topCounterpart = topPerson(records, "photographer");
  const topCharacter = topPerson(records, "character");
  const typeCounts = countTypes();

  const avgNode = average ? (
    <span>
      {t(average.unitKey)} <span style={{ fontSize: "1.3em" }}>{average.value}</span> {t("stats.avgTimes")}
    </span>
  ) : (
    t("stats.none")
  );

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isPhotographer ? (
          <>
            {/* 攝影身分：只看拍攝相關的統計 */}
            <StatCard
              icon={Camera}
              deco={t("stats.totalShootsDeco")}
              label={t("stats.totalShoots")}
              value={shootCount}
            />

            <StatCard
              icon={TrendingUp}
              deco={t("stats.avgShootsDeco")}
              label={t("stats.avgShoots")}
              compact
              value={avgNode}
              sub={total > 0 ? t("stats.avgShootsSub", { count: total }) : t("stats.empty")}
            />

            <StatCard
              icon={Aperture}
              deco={t(topCounterpartDecoKey(role))}
              label={t(topCounterpartLabelKey(role))}
              value={topCounterpart ? topCounterpart[0] : t("stats.none")}
              sub={
                topCounterpart
                  ? t("stats.topPhotographerSub", { count: topCounterpart[1] })
                  : t("stats.empty")
              }
              onClick={topCounterpart ? () => onApplySearch(topCounterpart[0]) : undefined}
            />

            <StatCard
              icon={Star}
              deco={t(topCharacterDecoKey())}
              label={t(topCharacterLabelKey(role))}
              value={topCharacter ? topCharacter[0] : t("stats.none")}
              sub={topCharacter ? t("stats.topPhotographerSub", { count: topCharacter[1] }) : t("stats.empty")}
              onClick={topCharacter ? () => onApplySearch(topCharacter[0]) : undefined}
            />
          </>
        ) : (
          <>
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
              value={total}
              sub={t("stats.appearancesSub", { count: total })}
            />

            <StatCard
              icon={TrendingUp}
              deco={t("stats.avgDeco")}
              label={t("stats.avg")}
              compact
              value={avgNode}
              sub={total > 0 ? t("stats.avgSub", { count: total }) : t("stats.empty")}
            />

            <StatCard
              icon={Aperture}
              deco={t(topCounterpartDecoKey(role))}
              label={t(topCounterpartLabelKey(role))}
              value={topCounterpart ? topCounterpart[0] : t("stats.none")}
              sub={
                topCounterpart
                  ? t("stats.topPhotographerSub", { count: topCounterpart[1] })
                  : t("stats.empty")
              }
              onClick={topCounterpart ? () => onApplySearch(topCounterpart[0]) : undefined}
            />
          </>
        )}
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
