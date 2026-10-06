import React from 'react';
import { Aperture, Plus, ImageOff } from 'lucide-react';
import { formatShort } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';

export default function PhotoWallView({ records, onRecordClick, onAddRecord }) {
  const { typeColorMap } = useApp();

  if (records.length === 0) {
    return (
      <div className="surface rounded-xl p-12 text-center">
        <ImageOff size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="font-serif-tc text-lg mb-1">沒有符合條件的紀錄</p>
        <p className="text-sm text-muted mb-5">試著調整篩選條件，或新增一筆拍攝紀錄。</p>
        <button type="button" onClick={onAddRecord} className="btn-primary rounded-lg px-5 py-2.5 text-sm font-medium inline-flex items-center gap-1.5">
          <Plus size={16} /> 新增紀錄
        </button>
      </div>
    );
  }

  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {sorted.map((r) => {
        const color = typeColorMap[r.type] || 'var(--accent)';
        return (
          <button key={r.id} type="button" onClick={() => onRecordClick(r)}
            className="group surface rounded-xl overflow-hidden text-left transition-transform hover:-translate-y-1 anim-fade-up">
            <div className="relative aspect-[3/4] overflow-hidden">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${r.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <span className="absolute top-2 left-2 text-[11px] rounded-full px-2 py-0.5 font-medium backdrop-blur-sm"
                style={{ background: `color-mix(in srgb, ${color} 80%, transparent)`, color: '#fff' }}>
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
  );
}
