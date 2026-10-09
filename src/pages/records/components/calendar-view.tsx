import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import CornerFlourish from "@/components/corner-flourish";
import {
  WEEKDAYS_SHORT,
  WEEKEND_COLS,
  formatFull,
  formatMonthTitle,
  getCalendarGrid,
  toISO,
} from "@/lib/date-utils";
import type { CosplayRecord } from "@/lib/record-types";

/** 會顯示照片的手機行事曆小工具風格月曆 */
export default function CalendarView({
  records,
  displayYear,
  displayMonth,
  onMonthChange,
  highlightSet,
  onRecordClick,
  typeColorMap,
}: {
  records: CosplayRecord[];
  displayYear: number;
  displayMonth: number;
  onMonthChange: (year: number, month: number) => void;
  highlightSet: Set<string> | null;
  onRecordClick: (record: CosplayRecord) => void;
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const cells = getCalendarGrid(displayYear, displayMonth);

  const byDate = useMemo(() => {
    const map: Record<string, CosplayRecord[]> = {};
    records.forEach((record) => {
      (map[record.date] = map[record.date] || []).push(record);
    });
    return map;
  }, [records]);

  function prevMonth() {
    setSelectedDate(null);
    if (displayMonth === 0) onMonthChange(displayYear - 1, 11);
    else onMonthChange(displayYear, displayMonth - 1);
  }

  function nextMonth() {
    setSelectedDate(null);
    if (displayMonth === 11) onMonthChange(displayYear + 1, 0);
    else onMonthChange(displayYear, displayMonth + 1);
  }

  const dayRecords = selectedDate ? byDate[selectedDate] || [] : [];

  return (
    <div className="surface relative overflow-hidden rounded-3xl p-3 sm:p-6">
      <CornerFlourish position="tl" size={52} />
      <CornerFlourish position="tr" size={52} />
      <CornerFlourish position="bl" size={52} />
      <CornerFlourish position="br" size={52} />

      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="btn-ghost rounded-full p-2" aria-label={t("filter.mode.month")}>
          <ChevronLeft size={18} />
        </button>

        <div className="text-center">
          <div className="font-serif-tc text-lg font-bold sm:text-2xl" style={{ color: "var(--accent)" }}>
            {formatMonthTitle(displayYear, displayMonth)}
          </div>
          <div className="font-deco text-muted-foreground mt-0.5 text-[10px] tracking-[0.25em]">
            {t("calendar.deco", { year: displayYear })}
          </div>
        </div>

        <button type="button" onClick={nextMonth} className="btn-ghost rounded-full p-2" aria-label={t("filter.mode.month")}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS_SHORT.map((weekday, index) => (
          <div
            key={index}
            className="font-serif-tc py-0.5 text-center text-[11px] sm:text-sm"
            style={{ color: WEEKEND_COLS.includes(index) ? "var(--accent-2)" : "var(--text-muted)" }}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((date, index) => {
          if (!date) return <div key={index} />;

          const iso = toISO(date);
          const dayRecordsForCell = byDate[iso] || [];
          const hasRecords = dayRecordsForCell.length > 0;
          const highlighted = Boolean(highlightSet?.has(iso));
          const selected = selectedDate === iso;
          const weekend = WEEKEND_COLS.includes(index % 7);
          const first = dayRecordsForCell[0];
          const typeColor = first ? typeColorMap[first.type] || "var(--accent)" : null;

          if (hasRecords && first) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDate(selected ? null : iso)}
                className="relative aspect-square overflow-hidden rounded-xl transition-transform hover:scale-[1.04] sm:rounded-2xl"
                style={{ border: `2px solid ${selected ? "var(--accent)" : typeColor}` }}
              >
                {first.photo ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${first.photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <ImageOff size={14} style={{ color: typeColor ?? "var(--accent)" }} />
                  </div>
                )}

                <div
                  className="absolute inset-x-0 top-0 h-1/2"
                  style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}
                />

                <span
                  className="absolute left-1 top-0.5 text-[10px] font-bold sm:text-xs"
                  style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {date.getDate()}
                </span>

                {dayRecordsForCell.length > 1 && (
                  <span
                    className="absolute bottom-0.5 right-0.5 rounded-full px-1 text-[9px] font-semibold sm:text-[10px]"
                    style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                  >
                    {t("calendar.multiCount", { count: dayRecordsForCell.length - 1 })}
                  </span>
                )}

                {selected && <div className="absolute inset-0" style={{ background: "var(--accent-soft)" }} />}
              </button>
            );
          }

          return (
            <div
              key={index}
              className="relative flex aspect-square items-start justify-start rounded-xl p-1 sm:rounded-2xl sm:p-1.5"
              style={{
                border: `1px solid ${highlighted ? "var(--accent)" : "var(--surface-border)"}`,
                background: highlighted ? "var(--accent-soft)" : "transparent",
              }}
            >
              <span
                className="text-[11px] sm:text-sm"
                style={{ color: weekend ? "var(--accent-2)" : "var(--text-muted)" }}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {selectedDate && dayRecords.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
          <div className="font-serif-tc mb-3 text-sm" style={{ color: "var(--accent)" }}>
            {formatFull(selectedDate)}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {dayRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => onRecordClick(record)}
                className="w-32 flex-shrink-0 overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.03] sm:w-36"
                style={{ border: "1px solid var(--surface-border)", background: "var(--surface-solid)" }}
              >
                <div
                  className="h-36 w-full sm:h-40"
                  style={{
                    background: record.photo ? undefined : "var(--accent-soft)",
                    backgroundImage: record.photo ? `url(${record.photo})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="p-2">
                  <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                    {record.character}
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {record.photographer || t("wall.noPhotographer")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
