import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { THEMES, THEME_ORDER } from '../themes';
import { SAMPLE_RECORDS, DEFAULT_SHOOT_TYPES } from '../mock';

const AppContext = createContext(null);

const LS_RECORDS = 'stir-diary:records';
const LS_THEME = 'stir-diary:theme';
const LS_TYPES = 'stir-diary:types';

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [records, setRecords] = useState(() => loadLS(LS_RECORDS, SAMPLE_RECORDS));
  const [themeKey, setThemeKey] = useState(() => {
    const t = loadLS(LS_THEME, 'tarot');
    return THEME_ORDER.includes(t) ? t : 'tarot';
  });
  const [shootTypes, setShootTypes] = useState(() => loadLS(LS_TYPES, DEFAULT_SHOOT_TYPES));

  useEffect(() => {
    localStorage.setItem(LS_RECORDS, JSON.stringify(records));
  }, [records]);
  useEffect(() => {
    localStorage.setItem(LS_THEME, JSON.stringify(themeKey));
  }, [themeKey]);
  useEffect(() => {
    localStorage.setItem(LS_TYPES, JSON.stringify(shootTypes));
  }, [shootTypes]);

  // 套用主題 CSS 變數到 <html>
  useEffect(() => {
    const theme = THEMES[themeKey];
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('data-theme', themeKey);
    root.setAttribute('data-dark', theme.dark ? 'true' : 'false');
  }, [themeKey]);

  const addRecord = (rec) => {
    const id = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setRecords((prev) => [...prev, { ...rec, id }]);
    return id;
  };
  const updateRecord = (id, patch) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const deleteRecord = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };
  const addShootType = (t) => {
    const v = (t || '').trim();
    if (!v) return;
    setShootTypes((prev) => (prev.includes(v) ? prev : [...prev, v]));
  };

  const theme = THEMES[themeKey];

  // 各拍攝類型對應顏色（隨主題）
  const typeColorMap = useMemo(() => {
    const map = {};
    shootTypes.forEach((t, i) => {
      map[t] = theme.typeColors[i % theme.typeColors.length];
    });
    return map;
  }, [shootTypes, theme]);

  const value = {
    records, addRecord, updateRecord, deleteRecord,
    shootTypes, addShootType,
    themeKey, setThemeKey, theme, THEMES, THEME_ORDER,
    typeColorMap,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
