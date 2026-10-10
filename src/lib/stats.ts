/**
 * 統計用的共用計算。
 *
 * 平均次數的規則（統計卡與年度回憶共用同一套）：
 *
 *   平均 = 篩選範圍內的總數 ÷ 該範圍的期間長度
 *
 * | 篩選範圍 | 單位 | 分母 |
 * |---|---|---|
 * | 年       | 每月 | 該年的月數（今年 → 只算到現在的月數）|
 * | 月       | 每週 | 該月的週數（當月 → 只算到現在的週數）|
 * | 單日     | 每週 | 1 週 |
 * | 區間     | 每週 | 該區間的週數（未填結束日 → 算到現在）|
 * | 年度回憶 | 每月 | 該年的月數（今年 → 只算到現在）|
 *
 * 重點：
 * - 分母跟著「目前檢視的範圍」走，不是跟著紀錄筆數（只有 1 筆不代表期間只有 1 週）。
 * - 沒有被篩選到的月份不會列入計算。
 */

import { parseISO } from "./date-utils";
import type { CosplayRecord, RecordFilter } from "./record-types";

export function round1(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** 這個年份到目前為止經過的月數（過去的年份就是 12 個月） */
export function monthsInYear(year: number): number {
  const now = new Date();
  return year === now.getFullYear() ? Math.max(1, now.getMonth() + 1) : 12;
}

/** 這個月份到目前為止經過的週數（過去的月份以整月計算） */
export function weeksInMonth(year: number, month0: number): number {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month0 === now.getMonth();
  const days = isCurrentMonth ? now.getDate() : new Date(year, month0 + 1, 0).getDate();

  return Math.max(1, days / 7);
}

/** 兩個日期之間經過的週數（沒有結束日就算到現在） */
export function weeksBetween(startIso?: string | null, endIso?: string | null): number {
  const from = parseISO(startIso) ?? parseISO(endIso);
  if (!from) return 1;

  const to = parseISO(endIso) ?? new Date();
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);

  return Math.max(1, days / 7);
}

export type AverageUnit = "month" | "week";

export type AveragePeriod = {
  /** 平均的單位：年檢視用「每月」，月／日／區間用「每週」 */
  unit: AverageUnit;
  /** 期間長度（月數或週數） */
  length: number;
};

/** 依目前篩選的範圍，決定平均的單位與期間長度 */
export function averagePeriodForFilter(filter: RecordFilter): AveragePeriod {
  switch (filter.mode) {
    case "year":
      return { unit: "month", length: monthsInYear(filter.year) };

    case "month":
      return { unit: "week", length: weeksInMonth(filter.year, filter.month) };

    case "range":
      return { unit: "week", length: weeksBetween(filter.start, filter.end) };

    case "day":
    default:
      // 單日沒有平均可言，以 1 週計（等於顯示當日次數）
      return { unit: "week", length: 1 };
  }
}

export type AverageResult = {
  /** i18n key：平均每週／平均每月 */
  unitKey: "stats.avgWeekly" | "stats.avgMonthly";
  value: string;
};

/** 平均次數：總數 ÷ 期間長度；沒有紀錄時回傳 null */
export function computeAverage(records: CosplayRecord[], period: AveragePeriod): AverageResult | null {
  if (records.length === 0) return null;

  return {
    unitKey: period.unit === "month" ? "stats.avgMonthly" : "stats.avgWeekly",
    value: round1(records.length / Math.max(1, period.length)),
  };
}

/** 把「小A、小B；小C」這類多值字串拆成單一名字 */
export function splitValues(raw: string): string[] {
  return (raw || "")
    .split(/[、,;；/／]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * 依「單一人物」累計出現次數。
 * 多人共用一筆紀錄時，每個人都各算一次
 * （例：三場合作分別是 AB、AHE、AIRH → A 算 3 次，是最常合作的人）。
 */
export function countByPerson(records: CosplayRecord[], key: "character" | "photographer"): Map<string, number> {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    splitValues(record[key]).forEach((name) => {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
  });

  return counts;
}

/** 出現次數最多的人（次數相同時依名稱排序，結果穩定） */
export function topPerson(records: CosplayRecord[], key: "character" | "photographer"): [string, number] | null {
  const entries = Array.from(countByPerson(records, key).entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  return entries.length ? entries[0] : null;
}
