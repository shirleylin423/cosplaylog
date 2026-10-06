import React from 'react';
import CornerFlourish from './CornerFlourish';
import { Camera, Images, TrendingUp, Aperture, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseISO } from '../utils/dateUtils';

// 計入「拍攝次數」的類型：外拍、棚拍、場次（活動、同人場）；不含自拍
const SHOOT_COUNT_TYPES = new Set(['外拍', '棚拍', '活動', '同人場']);

function StatCard({ icon: Icon, deco, label, value, sub, onClick, valueClassName = 'text-2xl sm:text-3xl' }) {
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
      <div className={`font-serif-tc font-bold mt-0.5 glow-accent ${valueClassName}`} style={{ color: 'var(--accent)' }}>
        {value}
      </div>
      {sub && <div className="text-xs text-muted mt-1 truncate">{sub}</div>}
    </div>
  );
}

const round1 = (x) => {
  const v = Math.round(x * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

export default function StatsSummary({ records, onApplySearch }) {
  const { typeColorMap } = useApp();

  // 出角次數：總計所有紀錄（每筆＝一次出角）
  const appearances = records.length;
  // 拍攝次數：僅列入外拍、棚拍、場次
  const shootCount = records.filter((r) => SHOOT_COUNT_TYPES.has(r.type)).length;

  // 平均出角次數（依實際頻率自動計算）
  let avgUnit = '';
  let avgNum = '—';
  if (appearances > 0) {
    const dates = records.map((r) => parseISO(r.date)).sort((a, b) => a - b);
    const spanDays = Math.round((dates[dates.length - 1] - dates[0]) / 86400000) + 1;
    const monthsCovered = new Set(records.map((r) => r.date.slice(0, 7))).size;
    if (monthsCovered <= 1) {
      const weeks = Math.max(1, spanDays / 7);
      avgUnit = '平均每週';
      avgNum = round1(appearances / weeks);
    } else {
      avgUnit = '平均每月';
      avgNum = round1(appearances / monthsCovered);
    }
  }
  const avgNode = appearances > 0
    ? <span>{avgUnit} <span style={{ fontSize: '1.3em' }}>{avgNum}</span> 次</span>
    : '—';

  const countBy = (key) => {
    const m = {};
    records.forEach((r) => { const v = r[key]; if (v) m[v] = (m[v] || 0) + 1; });
    return m;
  };
  const topOf = (m) => {
    const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries[0] : null;
  };
  const topPhotographer = topOf(countBy('photographer'));
  const typeCounts = countBy('type');

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Camera} deco="TOTAL SHOOTS" label="拍攝次數" value={shootCount} sub="僅計外拍／棚拍／場次" />
        <StatCard icon={Images} deco="APPEARANCES" label="出角次數" value={appearances} sub={`總計所有出角 · ${appearances} 次`} />
        <StatCard icon={TrendingUp} deco="AVG FREQUENCY" label="平均出角次數"
          value={avgNode} valueClassName="text-lg sm:text-xl"
          sub={appearances > 0 ? `共 ${appearances} 次出角` : '尚無紀錄'} />
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
