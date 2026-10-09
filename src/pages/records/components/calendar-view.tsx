import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import CornerFlourish from "@/components/corner-flourish";
import { WEEKDAYS_SHORT, WEEKEND_COLS, formatMonthTitle, getCalendarGrid, toISO } from "@/lib/date-utils";
import type { CosplayRecord } from "@/lib/record-types";
import CalendarDayCell from "./calendar-day-cell";

/**
 * 會顯示照片的手機行事曆小工具風格月曆。
 *
 * - 有紀錄的日期直接以照片呈現；同一天多筆會並排兩張縮圖
 * - 滑鼠移到格子上會自動輪播當天的照片
 * - 點格子會跳到照片牆並篩選那一天
 * - 今天會用金色外框標示，並可直接跳回今天
 */
export default function CalendarView({
  records,
  displayYear,
  displayMonth,
  onMonthChange,
  highlightSet,
  onPickDay,
  onTodayClick,
  typeColorMap,
}: {
  records: CosplayRecord[];
  displayYear: number;
  displayMonth: number;
  onMonthChange: (year: number, month: number) => void;
  highlightSet: Set<string> | null;
  onPickDay: (iso: string) => void;
  onTodayClick: () => void;
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const cells = getCalendarGrid(displayYear, displayMonth);
  const todayIso = toISO(new Date());

  const byDate = useMemo(() => {
    const map: Record<string, CosplayRecord[]> = {};
    records.forEach((record) => {
      (map[record.date] = map[record.date] || []).push(record);
    });
    return map;
  }, [records]);

  function prevMonth() {
    if (displayMonth === 0) onMonthChange(displayYear - 1, 11);
    else onMonthChange(displayYear, displayMonth - 1);
  }

  function nextMonth() {
    if (displayMonth === 11) onMonthChange(displayYear + 1, 0);
    else onMonthChange(displayYear, displayMonth + 1);
  }

  return (
    <div className="surface relative overflow-hidden rounded-3xl p-3 sm:p-6">
      <CornerFlourish position="tl" size={52} />
      <CornerFlourish position="tr" size={52} />
      <CornerFlourish position="bl" size={52} />
      <CornerFlourish position="br" size={52} />

      <div className="flex items-center justify-between">
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

      <div className="mb-3 mt-2 flex justify-center">
        <button
          type="button"
          onClick={onTodayClick}
          className="btn-ghost font-serif-tc rounded-full px-3 py-1 text-xs"
        >
          {t("calendar.today")}
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

          return (
            <CalendarDayCell
              key={index}
              date={date}
              iso={iso}
              records={byDate[iso] || []}
              weekend={WEEKEND_COLS.includes(index % 7)}
              isToday={iso === todayIso}
              highlighted={Boolean(highlightSet?.has(iso))}
              typeColorMap={typeColorMap}
              onPickDay={onPickDay}
            />
          );
        })}
      </div>
    </div>
  );
}
