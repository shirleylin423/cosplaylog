import React from 'react';
import CornerFlourish from './CornerFlourish';
import { Camera, Users, Star, Aperture, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';

function StatCard({ icon: Icon, deco, label, value, sub, onClick }) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      className={`surface relative rounded-2xl p-4 overflow-hidden anim-fade-up transition-transform ${clickable ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <CornerFlourish position="tl" size={44} />
      <CornerFlourish position="br" size={44} />
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: 'var(--accent)' }} />
        <span className="font-deco text-[10px] tracking-[0.2em] text-muted">{deco}</span>
        {clickable && <Search size={12} className="ml-auto" style={{ color: 'var(--accent)', opacity: 0.7 }} />}
      </div>
      <div className="font-serif-tc text-sm text-muted">{label}</div>
      <div className="font-serif-tc text-2xl sm:text-3xl font-bold mt-0.5 glow-accent" style={{ color: 'var(--accent)' }}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted mt-1 truncate">{sub}</div>}
    </div>
  );
}

export default function StatsSummary({ records, onApplySearch }) {
  const { typeColorMap } = useApp();
  const total = records.length;
  const characters = new Set(records.map((r) => r.character).filter(Boolean));

  const countBy = (key) => {
    const m = {};
    records.forEach((r) => { const v = r[key]; if (v) m[v] = (m[v] || 0) + 1; });
    return m;
  };
  const topOf = (m) => {
    const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0] : null;
  };
  const topChar = topOf(countBy('character'));
  const topPhotographer = topOf(countBy('photographer'));
  const typeCounts = countBy('type');

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Camera} deco="TOTAL SHOOTS" label="拍攝次數" value={total} />
        <StatCard icon={Users} deco="CHARACTERS" label="角色數" value={characters.size} />
        <StatCard icon={Star} deco="TOP CHARACTER" label="最常出角"
          value={topChar ? topChar[0] : '—'} sub={topChar ? `${topChar[1]} 次 · 點擊查看` : '尚無紀錄'}
          onClick={topChar ? () => onApplySearch(topChar[0]) : undefined} />
        <StatCard icon={Aperture} deco="TOP PHOTOGRAPHER" label="最常合作攝影"
          value={topPhotographer ? topPhotographer[0] : '—'} sub={topPhotographer ? `${topPhotographer[1]} 次 · 點擊查看` : '尚無紀錄'}
          onClick={topPhotographer ? () => onApplySearch(topPhotographer[0]) : undefined} />
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => {
            const color = typeColorMap[t] || 'var(--accent)';
            return (
              <button key={t} type="button" onClick={() => onApplySearch(t)}
                className="text-xs rounded-full px-3 py-1 font-medium transition-transform hover:-translate-y-0.5"
                style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color, border: `1px solid ${color}` }}>
                {t} · {n}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
