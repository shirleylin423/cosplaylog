// 日期工具 — 全繁體中文，週從「日」開始

export const WEEKDAYS_FULL = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
export const WEEKDAYS_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

// 將 Date 轉成 YYYY-MM-DD（本地時區）
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 解析 YYYY-MM-DD 成本地 Date
export function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 2026年06月05日 (週五)
export function formatFull(iso) {
  const date = parseISO(iso);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = WEEKDAYS_FULL[date.getDay()];
  return `${y}年${m}月${d}日 (${w})`;
}

// 06月05日 (週五)
export function formatShort(iso) {
  const date = parseISO(iso);
  if (!date) return '';
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const w = WEEKDAYS_FULL[date.getDay()];
  return `${m}月${d}日 (${w})`;
}

// 2026 年 6 月 5 日（日期選擇器顯示）
export function formatPickerLabel(iso) {
  const date = parseISO(iso);
  if (!date) return '';
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

// 2026 年 6 月（月曆標題）
export function formatMonthTitle(year, month0) {
  return `${year} 年 ${month0 + 1} 月`;
}

// 回傳某月的所有日期格子（含前後補白）
export function getCalendarGrid(year, month0) {
  const first = new Date(year, month0, 1);
  const startDay = first.getDay(); // 0 = 日
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month0, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sameDay(a, b) {
  return a && b && toISO(a) === toISO(b);
}

// 判斷 iso 是否在 [start, end] 區間內（含頭尾）
export function isoInRange(iso, startIso, endIso) {
  if (!iso) return false;
  if (startIso && iso < startIso) return false;
  if (endIso && iso > endIso) return false;
  return true;
}
