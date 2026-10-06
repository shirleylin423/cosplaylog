import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CornerFlourish from './CornerFlourish';
import { WEEKDAYS_SHORT, getCalendarGrid, toISO, formatMonthTitle, formatFull } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

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
    <div className="surface relative rounded-xl p-4 sm:p-6 overflow-hidden">
      <CornerFlourish position="tl" size={52} />
      <CornerFlourish position="tr" size={52} />
      <CornerFlourish position="bl" size={52} />
      <CornerFlourish position="br" size={52} />

      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={prev} className="btn-ghost rounded-lg p-2"><ChevronLeft size={18} /></button>
        <div className="text-center">
          <div className="font-serif-tc text-xl sm:text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {formatMonthTitle(displayYear, displayMonth)}
          </div>
          <div className="font-deco text-[10px] tracking-[0.25em] text-muted mt-0.5">ANNUAL LOG · {displayYear}</div>
        </div>
        <button type="button" onClick={next} className="btn-ghost rounded-lg p-2"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS_SHORT.map((w, i) => (
          <div key={i} className="text-center text-xs sm:text-sm font-serif-tc py-1"
            style={{ color: i === 0 ? 'var(--accent-2)' : 'var(--text-muted)' }}>{w}</div>
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
          return (
            <button
              key={i}
              type="button"
              onClick={() => has && setSelectedDate(selected ? null : iso)}
              className="relative aspect-square rounded-lg p-1 sm:p-1.5 flex flex-col items-center justify-start transition-all overflow-hidden"
              style={{
                cursor: has ? 'pointer' : 'default',
                background: selected ? 'var(--accent)' : highlighted ? 'var(--accent-soft)' : 'transparent',
                border: `1px solid ${selected ? 'var(--accent)' : highlighted ? 'var(--accent)' : 'var(--surface-border)'}`,
              }}
            >
              <span className="text-xs sm:text-sm" style={{ color: selected ? 'var(--on-accent)' : 'var(--text)', fontWeight: has ? 600 : 400 }}>
                {d.getDate()}
              </span>
              {has && (
                <div className="mt-0.5 flex flex-wrap gap-0.5 justify-center">
                  {recs.slice(0, 3).map((r, k) => (
                    <span key={k} className="h-1.5 w-1.5 rounded-full"
                      style={{ background: selected ? 'var(--on-accent)' : (typeColorMap[r.type] || 'var(--accent)') }} />
                  ))}
                </div>
              )}
              {has && recs.length > 1 && (
                <span className="absolute top-0.5 right-0.5 text-[9px] rounded-full px-1"
                  style={{ background: selected ? 'var(--on-accent)' : 'var(--accent-2)', color: selected ? 'var(--accent)' : '#fff' }}>
                  {recs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && dayRecords.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="font-serif-tc text-sm mb-3" style={{ color: 'var(--accent)' }}>{formatFull(selectedDate)}</div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {dayRecords.map((r) => (
              <button key={r.id} type="button" onClick={() => onRecordClick(r)}
                className="flex-shrink-0 w-36 rounded-lg overflow-hidden text-left transition-transform hover:scale-[1.03]"
                style={{ border: '1px solid var(--surface-border)', background: 'var(--surface-solid)' }}>
                <div className="h-40 w-full bg-black/20" style={{ backgroundImage: `url(${r.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
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
