import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WEEKDAYS_SHORT, formatPickerLabel, getCalendarGrid, parseISO, toISO } from "@/lib/date-utils";

/** 中文日期選擇器：顯示「2026 年 6 月 5 日」，每週從「一」開始 */
export default function ChineseDatePicker({
  value,
  onChange,
  placeholder,
  align = "start",
}: {
  value?: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  align?: "start" | "center" | "end";
}) {
  const { t } = useTranslation();
  const initial = parseISO(value) ?? new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = getCalendarGrid(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((year) => year - 1);
    } else {
      setViewMonth((month) => month - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((year) => year + 1);
    } else {
      setViewMonth((month) => month + 1);
    }
  }

  function pick(date: Date) {
    onChange(toISO(date));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="btn-ghost flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
          style={{ color: "var(--text)" }}
        >
          <CalendarDays size={16} style={{ color: "var(--accent)" }} />
          <span className={value ? "" : "text-muted-foreground"}>
            {value ? formatPickerLabel(value) : (placeholder ?? t("picker.placeholder"))}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-72 border-0 p-3"
        style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-[var(--accent-soft)]">
            <ChevronLeft size={18} />
          </button>
          <div className="font-serif-tc font-semibold" style={{ color: "var(--accent)" }}>
            {viewYear} 年 {viewMonth + 1} 月
          </div>
          <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-[var(--accent-soft)]">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS_SHORT.map((weekday, index) => (
            <div key={index} className="text-muted-foreground py-1 text-center text-xs">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) return <div key={index} />;

            const iso = toISO(date);
            const selected = value === iso;

            return (
              <button
                key={index}
                type="button"
                onClick={() => pick(date)}
                className="h-8 rounded-md text-sm transition-colors hover:bg-[var(--accent-soft)]"
                style={
                  selected
                    ? { background: "var(--accent)", color: "var(--on-accent)", fontWeight: 600 }
                    : { color: "var(--text)" }
                }
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
