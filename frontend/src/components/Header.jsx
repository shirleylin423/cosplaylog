import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Sparkles, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

function ThemeThumb({ tkey, theme, active, onClick }) {
  const v = theme.vars;
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-lg overflow-hidden border transition-transform hover:scale-[1.03] text-left"
      style={{ borderColor: active ? v['--accent'] : 'var(--surface-border)', borderWidth: active ? 2 : 1 }}
    >
      <div
        className="h-16 w-full relative"
        style={{ background: `linear-gradient(145deg, ${v['--bg-a']}, ${v['--bg-b']}, ${v['--bg-c']})` }}
      >
        <span className="absolute left-2 top-2 h-3 w-3 rounded-full" style={{ background: v['--accent'], boxShadow: `0 0 8px ${v['--accent']}` }} />
        <span className="absolute right-2 top-3 h-2 w-2 rounded-full" style={{ background: v['--accent-2'] }} />
        <span className="absolute left-3 bottom-2 h-1.5 w-8 rounded-full" style={{ background: v['--accent'], opacity: 0.6 }} />
        {active && (
          <span className="absolute right-1.5 bottom-1.5 rounded-full p-0.5" style={{ background: v['--accent'], color: v['--on-accent'] }}>
            <Check size={12} />
          </span>
        )}
      </div>
      <div className="px-2 py-1.5" style={{ background: 'var(--surface-solid)' }}>
        <div className="text-xs font-semibold font-serif-tc" style={{ color: 'var(--text)' }}>{theme.name}</div>
      </div>
    </button>
  );
}

export default function Header({ onAddRecord }) {
  const { themeKey, setThemeKey, THEMES, THEME_ORDER } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30">
      <div
        className="backdrop-blur-md"
        style={{ background: 'color-mix(in srgb, var(--surface-solid) 78%, transparent)', borderBottom: '1px solid var(--surface-border)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col leading-none">
            <h1 className="font-serif-tc text-2xl sm:text-3xl font-black tracking-wide">
              <span style={{ color: 'var(--text)' }}>攔拌</span>
              <span className="glow-accent" style={{ color: 'var(--accent)' }}>紀錄</span>
            </h1>
            <span className="font-deco text-[10px] sm:text-xs tracking-[0.3em] mt-1 text-muted">COSPLAY ARCHIVE · 角色扮演紀錄</span>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="btn-ghost rounded-lg px-3 py-2 text-sm flex items-center gap-1.5">
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  <span className="hidden sm:inline">主題</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 p-3 border-0"
                style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
              >
                <div className="text-sm font-semibold mb-2 font-serif-tc" style={{ color: 'var(--accent)' }}>選擇魔幻主題</div>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_ORDER.map((k) => (
                    <ThemeThumb
                      key={k}
                      tkey={k}
                      theme={THEMES[k]}
                      active={themeKey === k}
                      onClick={() => { setThemeKey(k); }}
                    />
                  ))}
                </div>
                <p className="text-xs mt-2 text-muted">{THEMES[themeKey].desc}</p>
              </PopoverContent>
            </Popover>

            <button type="button" onClick={onAddRecord} className="btn-primary rounded-lg px-3 sm:px-4 py-2 text-sm font-medium flex items-center gap-1.5">
              <Plus size={16} />
              <span className="hidden sm:inline">新增紀錄</span>
              <span className="sm:hidden">新增</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
