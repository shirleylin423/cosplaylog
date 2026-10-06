import React, { useMemo } from 'react';
import ChineseDatePicker from './ChineseDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Filter, X, Search } from 'lucide-react';
import CornerFlourish from './CornerFlourish';

const MODES = [
  { key: 'year', label: '年份' },
  { key: 'month', label: '月份' },
  { key: 'day', label: '單日' },
  { key: 'range', label: '區間' },
];
const MONTHS = ['1 月','2 月','3 月','4 月','5 月','6 月','7 月','8 月','9 月','10 月','11 月','12 月'];

export default function FilterBar({ records, filter, setFilter, count, search, setSearch }) {
  const years = useMemo(() => {
    const s = new Set(records.map((r) => Number(r.date.slice(0, 4))));
    s.add(2026);
    return Array.from(s).sort((a, b) => b - a);
  }, [records]);

  const isDefault = filter.mode === 'year' && filter.year === 2026 && !search.trim();
  const selStyle = {
    background: 'var(--surface-solid)',
    border: '1px solid var(--surface-border)',
    color: 'var(--text)',
  };

  const clear = () => {
    setFilter({ mode: 'year', year: 2026, month: 5, day: null, start: null, end: null });
    setSearch('');
  };

  return (
    <section className="surface relative rounded-2xl p-4 overflow-hidden">
      <CornerFlourish position="tl" size={40} />
      <CornerFlourish position="br" size={40} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-serif-tc text-sm font-semibold">篩選</span>
        </div>

        {/* 模式切換 */}
        <div className="flex rounded-full p-0.5" style={{ background: 'var(--accent-soft)' }}>
          {MODES.map((m) => {
            const active = filter.mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setFilter({ ...filter, mode: m.key })}
                className="px-3 py-1.5 text-sm rounded-full transition-colors font-medium"
                style={active ? { background: 'var(--accent)', color: 'var(--on-accent)' } : { color: 'var(--text)' }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* 模式專屬控制 */}
        {(filter.mode === 'year' || filter.mode === 'month') && (
          <Select value={String(filter.year)} onValueChange={(v) => setFilter({ ...filter, year: Number(v) })}>
            <SelectTrigger className="w-28 rounded-full" style={selStyle}><SelectValue /></SelectTrigger>
            <SelectContent style={selStyle}>
              {years.map((y) => <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {filter.mode === 'month' && (
          <Select value={String(filter.month)} onValueChange={(v) => setFilter({ ...filter, month: Number(v) })}>
            <SelectTrigger className="w-24 rounded-full" style={selStyle}><SelectValue /></SelectTrigger>
            <SelectContent style={selStyle}>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {filter.mode === 'day' && (
          <div className="w-52"><ChineseDatePicker value={filter.day} onChange={(iso) => setFilter({ ...filter, day: iso })} placeholder="選擇一天" /></div>
        )}
        {filter.mode === 'range' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48"><ChineseDatePicker value={filter.start} onChange={(iso) => setFilter({ ...filter, start: iso })} placeholder="開始日期" /></div>
            <span className="text-muted">至</span>
            <div className="w-48"><ChineseDatePicker value={filter.end} onChange={(iso) => setFilter({ ...filter, end: iso })} placeholder="結束日期" /></div>
          </div>
        )}

        {/* 關鍵字搜尋 */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--accent)' }} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋角色／攝影師／標籤／備註…"
            className="pl-9 pr-8 rounded-full h-9"
            style={{ background: 'var(--surface-solid)', borderColor: 'var(--surface-border)', color: 'var(--text)' }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-[var(--accent-soft)]">
              <X size={14} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted whitespace-nowrap">共 <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{count}</span> 筆</span>
          {!isDefault && (
            <button type="button" onClick={clear} className="btn-ghost rounded-full px-3 py-1.5 text-sm flex items-center gap-1 whitespace-nowrap">
              <X size={14} /> 清除篩選
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
