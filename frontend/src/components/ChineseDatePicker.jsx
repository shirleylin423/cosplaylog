import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { WEEKDAYS_SHORT, getCalendarGrid, toISO, formatPickerLabel } from '../utils/dateUtils';

// 中文日期選擇器：顯示「2026 年 6 月 5 日」，星期從「日」開始
export default function ChineseDatePicker({ value, onChange, placeholder = '選擇日期', align = 'start' }) {
  const initial = value ? new Date(value) : new Date(2026, 5, 1);
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(initial.getFullYear());
  const [viewM, setViewM] = useState(initial.getMonth());

  const cells = getCalendarGrid(viewY, viewM);

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY((y) => y - 1); } else setViewM((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY((y) => y + 1); } else setViewM((m) => m + 1);
  };

  const pick = (d) => {
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="btn-ghost flex items-center gap-2 rounded-lg px-3 py-2 text-sm w-full"
          style={{ color: 'var(--text)' }}
        >
          <CalendarDays size={16} style={{ color: 'var(--accent)' }} />
          <span className={value ? '' : 'text-muted'}>
            {value ? formatPickerLabel(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-72 p-3 border-0"
        style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-[var(--accent-soft)]">
            <ChevronLeft size={18} />
          </button>
          <div className="font-serif-tc font-semibold" style={{ color: 'var(--accent)' }}>
            {viewY} 年 {viewM + 1} 月
          </div>
          <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-[var(--accent-soft)]">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS_SHORT.map((w, i) => (
            <div key={i} className="text-center text-xs py-1 text-muted">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = toISO(d);
            const selected = value === iso;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(d)}
                className="h-8 rounded-md text-sm transition-colors"
                style={
                  selected
                    ? { background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 600 }
                    : { color: 'var(--text)' }
                }
                onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--accent-soft)'; }}
                onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
