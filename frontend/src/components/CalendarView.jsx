import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CornerFlourish from './CornerFlourish';
import { WEEKDAYS_SHORT, WEEKEND_COLS, getCalendarGrid, toISO, formatMonthTitle, formatFull } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

// 會顯示照片的手機行事曆小工具風格月曆
export default function CalendarView({ records, displayYear, displayMonth, onMonthChange, highlightSet, onRecordClick }) {
  const { typeColorMap } = useApp();
  const [selectedDate, setSelectedDate] = useState(null);
  const cells = getCalendarGrid(displayYear, displayMonth);

  const byDate = useMemo(() => {
    const m = {};
    records.forEach((r) => { (m[r.date] = m[r.date] || []).push(r); });
    return m;
  }, [records]);

  const prev = () => {
    setSelectedDate(null);
    if (displayMonth === 0) onMonthChange(displayYear - 1, 11); else onMonthChange(displayYear, displayMonth - 1);
  };
  const next = () => {
    setSelectedDate(null);
    if (displayMonth === 11) onMonthChange(displayYear + 1, 0); else onMonthChange(displayYear, displayMonth + 1);
  };

  const dayRecords = selectedDate ? (byDate[selectedDate] || []) : [];

  return (
    <div className="surface relative rounded-3xl p-3 sm:p-6 overflow-hidden">
      <CornerFlourish position="tl" size={52} />
      <CornerFlourish position="tr" size={52} />
      <CornerFlourish position="bl" size={52} />
      <CornerFlourish position="br" size={52} />

      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prev} className="btn-ghost rounded-full p-2"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <div className="font-serif-tc text-lg sm:text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {formatMonthTitle(displayYear, displayMonth)}
          </div>
          <div className="font-deco text-[10px] tracking-[0.25em] text-muted mt-0.5">ANNUAL LOG · {displayYear}</div>
        </div>
        <button type="button" onClick={next} className="btn-ghost rounded-full p-2"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5">
        {WEEKDAYS_SHORT.map((w, i) => (
          <div key={i} className="text-center text-[11px] sm:text-sm font-serif-tc py-0.5"
            style={{ color: WEEKEND_COLS.includes(i) ? 'var(--accent-2)' : 'var(--text-muted)' }}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const recs = byDate[iso] || [];
          const has = recs.length > 0;
          const highlighted = highlightSet && highlightSet.has(iso);
          const selected = selectedDate === iso;
          const weekend = WEEKEND_COLS.includes(i % 7);
          const typeColor = has ? (typeColorMap[recs[0].type] || 'var(--accent)') : null;

          if (has) {
            return (
              <button key={i} type="button" onClick={() => setSelectedDate(selected ? null : iso)}
                className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden transition-transform hover:scale-[1.04]"
                style={{ border: `2px solid ${selected ? 'var(--accent)' : typeColor}`, cursor: 'pointer' }}>
                <div className="absolute inset-0"
                  style={{ backgroundImage: `url(${recs[0].photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' }} />
                <span className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-bold" style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                  {d.getDate()}
                </span>
                {recs.length > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 text-[9px] sm:text-[10px] rounded-full px-1 font-semibold"
                    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                    +{recs.length - 1}
                  </span>
                )}
                {selected && <div className="absolute inset-0" style={{ background: 'var(--accent-soft)' }} />}
              </button>
            );
          }
          return (
            <div key={i}
              className="relative aspect-square rounded-xl sm:rounded-2xl flex items-start justify-start p-1 sm:p-1.5"
              style={{ border: `1px solid ${highlighted ? 'var(--accent)' : 'var(--surface-border)'}`, background: highlighted ? 'var(--accent-soft)' : 'transparent' }}>
              <span className="text-[11px] sm:text-sm" style={{ color: weekend ? 'var(--accent-2)' : 'var(--text-muted)' }}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {selectedDate && dayRecords.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="font-serif-tc text-sm mb-3" style={{ color: 'var(--accent)' }}>{formatFull(selectedDate)}</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {dayRecords.map((r) => (
              <button key={r.id} type="button" onClick={() => onRecordClick(r)}
                className="flex-shrink-0 w-32 sm:w-36 rounded-2xl overflow-hidden text-left transition-transform hover:scale-[1.03]"
                style={{ border: '1px solid var(--surface-border)', background: 'var(--surface-solid)' }}>
                <div className="h-36 sm:h-40 w-full bg-black/20" style={{ backgroundImage: `url(${r.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div className="p-2">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{r.character}</div>
                  <div className="text-xs text-muted truncate">{r.photographer}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
