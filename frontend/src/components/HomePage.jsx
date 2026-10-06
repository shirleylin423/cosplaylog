import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import StatsSummary from './StatsSummary';
import FilterBar from './FilterBar';
import CalendarView from './CalendarView';
import PhotoWallView from './PhotoWallView';
import RecordForm from './RecordForm';
import RecordDetail from './RecordDetail';
import AddToHomeHint from './AddToHomeHint';
import { CalendarDays, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isoInRange } from '../utils/dateUtils';

const DEFAULT_FILTER = { mode: 'year', year: 2026, month: 5, day: null, start: null, end: null };

function applyDateFilter(records, f) {
  switch (f.mode) {
    case 'year':
      return records.filter((r) => r.date.slice(0, 4) === String(f.year));
    case 'month': {
      const mm = String(f.month + 1).padStart(2, '0');
      return records.filter((r) => r.date.slice(0, 7) === `${f.year}-${mm}`);
    }
    case 'day':
      return f.day ? records.filter((r) => r.date === f.day) : records;
    case 'range':
      if (!f.start && !f.end) return records;
      return records.filter((r) => isoInRange(r.date, f.start, f.end));
    default:
      return records;
  }
}

function matchesSearch(r, term) {
  const t = (term || '').trim().toLowerCase();
  if (!t) return true;
  const hay = [r.character, r.photographer, r.note, r.type, ...(r.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
  return t.split(/\s+/).every((w) => hay.includes(w));
}

export default function HomePage() {
  const { records } = useApp();
  const [view, setView] = useState('calendar');
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [search, setSearch] = useState('');
  const [display, setDisplay] = useState({ year: 2026, month: 5 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const onR = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const filtered = useMemo(
    () => applyDateFilter(records, filter).filter((r) => matchesSearch(r, search)),
    [records, filter, search]
  );

  // 月曆模式下：隨篩選跳至對應月份
  useEffect(() => {
    if (filter.mode === 'month') setDisplay({ year: filter.year, month: filter.month });
    else if (filter.mode === 'year') setDisplay({ year: filter.year, month: 0 });
    else if (filter.mode === 'day' && filter.day) {
      const [y, m] = filter.day.split('-').map(Number);
      setDisplay({ year: y, month: m - 1 });
    } else if (filter.mode === 'range' && filter.start) {
      const [y, m] = filter.start.split('-').map(Number);
      setDisplay({ year: y, month: m - 1 });
    }
  }, [filter]);

  const highlightSet = useMemo(() => {
    if (filter.mode === 'day' && filter.day) return new Set([filter.day]);
    if (filter.mode === 'range' && (filter.start || filter.end)) {
      return new Set(filtered.map((r) => r.date));
    }
    return null;
  }, [filter, filtered]);

  // 當年份有紀錄的月份（供典藏泡泡）
  const yearMonths = useMemo(() => {
    const s = new Set();
    records.forEach((r) => { if (r.date.slice(0, 4) === String(filter.year)) s.add(Number(r.date.slice(5, 7)) - 1); });
    return Array.from(s).sort((a, b) => a - b);
  }, [records, filter.year]);
  const activeMonth = filter.mode === 'month' ? filter.month : null;

  // —— 篩選自動切換檢視：任何篩選→照片牆；清除→月曆 ——
  const handleFilter = (next) => { setFilter(next); setView('wall'); };
  const handleSearch = (term) => { setSearch(term); if ((term || '').trim()) setView('wall'); };
  const handleClear = () => { setFilter(DEFAULT_FILTER); setSearch(''); setView('calendar'); };
  const applySearch = (term) => { setSearch(term); setView('wall'); };
  const onTagClick = (tag) => { setDetail(null); setSearch(tag); setView('wall'); };
  const onPickMonth = (m) => handleFilter({ ...DEFAULT_FILTER, mode: 'month', year: filter.year, month: m });

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (rec) => { setDetail(null); setEditing(rec); setFormOpen(true); };
  const openDetailById = (rec) => setDetail(rec);

  const detailLive = useMemo(() => {
    if (!detail) return null;
    return records.find((r) => r.id === detail.id) || null;
  }, [detail, records]);

  const Toggle = ({ v, icon: Icon, label }) => {
    const active = view === v;
    return (
      <button type="button" onClick={() => setView(v)}
        className="px-4 py-2 text-sm rounded-full flex items-center gap-1.5 transition-colors font-medium"
        style={active ? { background: 'var(--accent)', color: 'var(--on-accent)' } : { color: 'var(--text)' }}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      <Header onAddRecord={openAdd} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
        {isMobile && view === 'calendar' ? (
          <>
            <CalendarView
              records={filtered}
              displayYear={display.year}
              displayMonth={display.month}
              onMonthChange={(y, m) => setDisplay({ year: y, month: m })}
              highlightSet={highlightSet}
              onRecordClick={openDetailById}
            />
            <div className="flex justify-center">
              <div className="flex rounded-full p-0.5" style={{ background: 'var(--accent-soft)' }}>
                <Toggle v="calendar" icon={CalendarDays} label="月曆" />
                <Toggle v="wall" icon={LayoutGrid} label="照片牆" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-serif-tc text-xl font-bold" style={{ color: 'var(--text)' }}>{filter.year} 年度紀錄</h2>
                <p className="font-deco text-[10px] tracking-[0.25em] text-muted mt-0.5">ANNUAL LOG · {filter.year}</p>
              </div>
              <div className="flex rounded-full p-0.5" style={{ background: 'var(--accent-soft)' }}>
                <Toggle v="calendar" icon={CalendarDays} label="月曆" />
                <Toggle v="wall" icon={LayoutGrid} label="照片牆" />
              </div>
            </div>

            <StatsSummary records={filtered} onApplySearch={applySearch} />
            <FilterBar records={records} filter={filter} setFilter={handleFilter} count={filtered.length}
              search={search} setSearch={handleSearch} onClear={handleClear} />

            {view === 'calendar' ? (
              <CalendarView
                records={filtered}
                displayYear={display.year}
                displayMonth={display.month}
                onMonthChange={(y, m) => setDisplay({ year: y, month: m })}
                highlightSet={highlightSet}
                onRecordClick={openDetailById}
              />
            ) : (
              <PhotoWallView records={filtered} months={yearMonths} activeMonth={activeMonth}
                onPickMonth={onPickMonth} onRecordClick={openDetailById} onAddRecord={openAdd} />
            )}
          </>
        )}

        <footer className="text-center py-6">
          <p className="font-deco text-[10px] tracking-[0.3em] text-muted">攪拌紀錄 · COSPLAY LOG</p>
        </footer>
      </main>

      <RecordForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <RecordDetail record={detailLive} onClose={() => setDetail(null)} onEdit={openEdit} onTagClick={onTagClick} />
      <AddToHomeHint />
    </div>
  );
}
