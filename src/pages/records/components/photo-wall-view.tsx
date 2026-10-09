import { useMemo } from "react";
import { Aperture, ImageOff, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatShort } from "@/lib/date-utils";
import type { CosplayRecord } from "@/lib/record-types";

function MonthBubbles({
  months,
  activeMonth,
  onPickMonth,
}: {
  months: number[];
  activeMonth: number | null;
  onPickMonth: (month: number) => void;
}) {
  const { t } = useTranslation();

  if (months.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {months.map((month) => {
        const active = activeMonth === month;
        return (
          <button key={month} type="button" onClick={() => onPickMonth(month)} className="flex-shrink-0">
            <span
              className="font-serif-tc flex items-center justify-center rounded-full font-bold transition-transform hover:scale-105"
              style={{
                width: 60,
                height: 60,
                background: active ? "var(--accent)" : "var(--surface-solid)",
                color: active ? "var(--on-accent)" : "var(--accent)",
                border: `2px solid ${active ? "var(--accent)" : "var(--surface-border)"}`,
                boxShadow: active ? "0 0 16px -4px var(--accent)" : "none",
              }}
            >
              {t("wall.monthBubble", { month: month + 1 })}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** IG 典藏風格的照片方格牆 */
export default function PhotoWallView({
  records,
  activeMonth,
  onPickMonth,
  onRecordClick,
  onAddRecord,
  typeColorMap,
}: {
  records: CosplayRecord[];
  activeMonth: number | null;
  onPickMonth: (month: number) => void;
  onRecordClick: (record: CosplayRecord) => void;
  onAddRecord: () => void;
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();

  const sorted = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );

  // 典藏月份：只列出目前篩選結果中真的有的月份
  const months = useMemo(() => {
    const set = new Set(records.map((record) => Number(record.date.slice(5, 7)) - 1));
    return Array.from(set)
      .filter((month) => !Number.isNaN(month))
      .sort((a, b) => a - b);
  }, [records]);

  return (
    <div className="space-y-3">
      {months.length > 0 && (
        <div className="surface rounded-2xl px-4 pt-3">
          <div className="font-serif-tc mb-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>
            {t("wall.collection")}
          </div>
          <MonthBubbles months={months} activeMonth={activeMonth} onPickMonth={onPickMonth} />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="surface rounded-2xl p-12 text-center">
          <ImageOff size={40} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="font-serif-tc mb-1 text-lg">{t("wall.emptyTitle")}</p>
          <p className="text-muted-foreground mb-5 text-sm">{t("wall.emptyDesc")}</p>
          <button
            type="button"
            onClick={onAddRecord}
            className="btn-primary font-serif-tc inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium"
          >
            <Plus size={16} /> {t("records.add")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {sorted.map((record) => {
            const color = typeColorMap[record.type] || "var(--accent)";

            return (
              <button
                key={record.id}
                type="button"
                onClick={() => onRecordClick(record)}
                className="surface anim-fade-up group overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-1"
              >
                <div className="relative aspect-square overflow-hidden">
                  {record.photo ? (
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${record.photo})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "var(--accent-soft)" }}
                    >
                      <ImageOff size={24} style={{ color }} />
                    </div>
                  )}

                  <span
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm"
                    style={{ background: `color-mix(in srgb, ${color} 82%, transparent)`, color: "#fff" }}
                  >
                    {record.type}
                  </span>
                </div>

                <div className="p-2.5">
                  <div className="font-serif-tc truncate text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {record.character}
                  </div>

                  {record.series && (
                    <div className="text-muted-foreground mt-0.5 truncate text-xs">{record.series}</div>
                  )}

                  <div className="text-muted-foreground mt-1 flex items-center gap-1 truncate text-xs">
                    <Aperture size={12} style={{ color }} />
                    <span className="truncate">{record.photographer || t("wall.noPhotographer")}</span>
                  </div>

                  <div className="text-muted-foreground mt-0.5 text-xs">{formatShort(record.date)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
