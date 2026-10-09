/** 拍攝類型：預設清單、自訂類型（存瀏覽器）、以及依主題分配的類型配色 */

import type { CosplayRecord } from "./record-types";

export const DEFAULT_SHOOT_TYPES = ["外拍", "棚拍", "活動", "同人場", "自拍"];

/** 計入「拍攝次數」的類型（不含自拍） */
export const SHOOT_COUNT_TYPES = new Set(["外拍", "棚拍", "活動", "同人場"]);

const LS_CUSTOM_TYPES = "stir-diary:types";

export function loadCustomTypes(): string[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_TYPES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveCustomTypes(types: string[]): void {
  try {
    localStorage.setItem(LS_CUSTOM_TYPES, JSON.stringify(types));
  } catch {
    /* 瀏覽器禁用儲存時忽略 */
  }
}

/** 預設類型 + 自訂類型 + 紀錄裡已經用過的類型 */
export function collectShootTypes(records: CosplayRecord[], customTypes: string[]): string[] {
  const result = [...DEFAULT_SHOOT_TYPES];

  for (const type of [...customTypes, ...records.map((r) => r.type)]) {
    const value = (type || "").trim();
    if (value && !result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}

/** 依序把主題配色分配給拍攝類型 */
export function buildTypeColorMap(shootTypes: string[], typeColors: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  shootTypes.forEach((type, index) => {
    map[type] = typeColors[index % typeColors.length];
  });

  return map;
}

export const DEFAULT_TYPE_COLOR = "var(--accent)";
