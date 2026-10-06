import React, { useMemo } from 'react';
import { Plus, ImageOff, Aperture } from 'lucide-react';
import { formatShort } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

function MonthBubbles({ months, activeMonth, onPickMonth }) {
  if (!months || months.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {months.map((m) => {
        const active = activeMonth === m;
        return (
          <button key={m} type="button" onClick={() => onPickMonth(m)} className="flex-shrink-0">
            <span className="rounded-full flex items-center justify-center font-serif-tc font-bold transition-transform hover:scale-105"
              style={{
                width: 60, height: 60,
                background: active ? 'var(--accent)' : 'var(--surface-solid)',
                color: active ? 'var(--on-accent)' : 'var(--accent)',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--surface-border)'}`,
                boxShadow: active ? '0 0 16px -4px var(--accent)' : 'none',
              }}>
              {m + 1}月
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function PhotoWallView({ records, activeMonth, onPickMonth, onRecordClick, onAddRecord }) {
  const { typeColorMap } = useApp();
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // 典藏月份：僅出現當前篩選到有符合的月份
  const months = useMemo(() => {
    const s = new Set(records.map((r) => Number(r.date.slice(5, 7)) - 1));
    return Array.from(s).sort((a, b) => a - b);
  }, [records]);

  return (
    <div className="space-y-3">
      {months.length > 0 && (
        <div className="surface rounded-2xl px-4 pt-3">
          <div className="font-serif-tc text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>典藏</div>
          <MonthBubbles months={months} activeMonth={activeMonth} onPickMonth={onPickMonth} />
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="surface rounded-2xl p-12 text-center">
          <ImageOff size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="font-serif-tc text-lg mb-1">沒有符合條件的紀錄</p>
          <p className="text-sm text-muted mb-5">試著調整篩選條件，或新增一筆拍攝紀錄。</p>
          <button type="button" onClick={onAddRecord} className="btn-primary rounded-full px-5 py-2.5 text-sm font-medium inline-flex items-center gap-1.5">
            <Plus size={16} /> 新增紀錄
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sorted.map((r) => {
            const color = typeColorMap[r.type] || 'var(--accent)';
            return (
              <button key={r.id} type="button" onClick={() => onRecordClick(r)}
                className="group surface rounded-2xl overflow-hidden text-left transition-transform hover:-translate-y-1 anim-fade-up">
                <div className="relative aspect-square overflow-hidden">
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${r.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <span className="absolute top-2 left-2 text-[11px] rounded-full px-2 py-0.5 font-medium backdrop-blur-sm"
                    style={{ background: `color-mix(in srgb, ${color} 82%, transparent)`, color: '#fff' }}>
                    {r.type}
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="font-serif-tc text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{r.character}</div>
                  <div className="flex items-center gap-1 text-xs text-muted mt-1 truncate">
                    <Aperture size={12} style={{ color }} /> <span className="truncate">{r.photographer || '—'}</span>
                  </div>
                  <div className="text-xs text-muted mt-0.5">{formatShort(r.date)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
