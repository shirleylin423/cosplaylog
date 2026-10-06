import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import StatsSummary from './StatsSummary';
import FilterBar from './FilterBar';
import CalendarView from './CalendarView';
import PhotoWallView from './PhotoWallView';
import RecordForm from './RecordForm';
import RecordDetail from './RecordDetail';
import { CalendarDays, LayoutGrid } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isoInRange } from '../utils/dateUtils';

function applyFilter(records, f) {
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

export default function HomePage() {
  const { records } = useApp();
  const [view, setView] = useState('calendar');
  const [filter, setFilter] = useState({ mode: 'year', year: 2026, month: 5, day: null, start: null, end: null });
  const [display, setDisplay] = useState({ year: 2026, month: 5 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => applyFilter(records, filter), [records, filter]);

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

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (rec) => { setDetail(null); setEditing(rec); setFormOpen(true); };
  const openDetailById = (rec) => setDetail(rec);

  // 月曆点擊紀錄時：用最新資料重新取得（確保編輯後資料正確）
  const detailLive = useMemo(() => {
    if (!detail) return null;
    return records.find((r) => r.id === detail.id) || null;
  }, [detail, records]);

  const Toggle = ({ v, icon: Icon, label }) => {
    const active = view === v;
    return (
      <button type="button" onClick={() => setView(v)}
        className="px-4 py-2 text-sm rounded-lg flex items-center gap-1.5 transition-colors font-medium"
        style={active ? { background: 'var(--accent)', color: 'var(--on-accent)' } : { color: 'var(--text)' }}>
        <Icon size={16} /> {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen">
      <Header onAddRecord={openAdd} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-serif-tc text-xl font-bold" style={{ color: 'var(--text)' }}>{filter.year} 年度紀錄</h2>
            <p className="font-deco text-[10px] tracking-[0.25em] text-muted mt-0.5">ANNUAL LOG · {filter.year}</p>
          </div>
          <div className="flex rounded-lg p-0.5" style={{ background: 'var(--accent-soft)' }}>
            <Toggle v="calendar" icon={CalendarDays} label="月曆" />
            <Toggle v="wall" icon={LayoutGrid} label="照片牆" />
          </div>
        </div>

        <StatsSummary records={filtered} />
        <FilterBar records={records} filter={filter} setFilter={setFilter} count={filtered.length} />

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
          <PhotoWallView records={filtered} onRecordClick={openDetailById} onAddRecord={openAdd} />
        )}

        <footer className="text-center py-6">
          <p className="font-deco text-[10px] tracking-[0.3em] text-muted">攔拌紀錄 · COSPLAY ARCHIVE</p>
        </footer>
      </main>

      <RecordForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <RecordDetail record={detailLive} onClose={() => setDetail(null)} onEdit={openEdit} />
    </div>
  );
}
