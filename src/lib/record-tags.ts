/** 標籤選項：收集使用者過去用過的標籤，讓新增紀錄時可以直接挑選 */

import type { CosplayRecord } from "./record-types";

/**
 * 收集所有用過的標籤。
 * 排序：使用次數多的在前，次數相同時依筆畫／字母排序。
 */
export function collectTags(records: CosplayRecord[], limit = 30): string[] {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    (record.tags ?? []).forEach((rawTag) => {
      const tag = rawTag.trim();
      if (!tag) return;

      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * 最近用過的標籤（依「最後一次使用它的紀錄日期」由新到舊排序）。
 * 表單只顯示前幾個，其餘靠輸入時自動比對。
 */
export function collectRecentTags(records: CosplayRecord[], limit = 3): string[] {
  const lastUsed = new Map<string, string>();

  records.forEach((record) => {
    (record.tags ?? []).forEach((rawTag) => {
      const tag = rawTag.trim();
      if (!tag) return;

      const current = lastUsed.get(tag);

      if (!current || record.date > current) {
        lastUsed.set(tag, record.date);
      }
    });
  });

  return Array.from(lastUsed.entries())
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, limit)
    .map(([tag]) => tag);
}
