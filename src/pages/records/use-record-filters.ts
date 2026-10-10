import { useMemo } from "react";
import type { CosplayRecord, RecordFilter } from "@/lib/record-types";
import { isoInRange } from "@/lib/date-utils";

export function createDefaultFilter(): RecordFilter {
  const now = new Date();

  return {
    mode: "year",
    year: now.getFullYear(),
    month: now.getMonth(),
    day: null,
    start: null,
    end: null,
  };
}

export function applyDateFilter(records: CosplayRecord[], filter: RecordFilter): CosplayRecord[] {
  switch (filter.mode) {
    case "year":
      return records.filter((r) => r.date && r.date.slice(0, 4) === String(filter.year));

    case "month": {
      const mm = String(filter.month + 1).padStart(2, "0");
      return records.filter((r) => r.date && r.date.slice(0, 7) === `${filter.year}-${mm}`);
    }

    case "day":
      return filter.day ? records.filter((r) => r.date === filter.day) : records;

    case "range":
      if (!filter.start && !filter.end) return records;
      return records.filter((r) => r.date && isoInRange(r.date, filter.start, filter.end));

    default:
      return records;
  }
}

export function matchesSearch(record: CosplayRecord, term: string): boolean {
  const query = (term || "").trim().toLowerCase();
  if (!query) return true;

  const haystack = [
    record.character,
    record.characterVersion,
    record.series,
    record.event,
    record.venue,
    record.photographer,
    record.note,
    record.type,
    ...(record.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return query.split(/\s+/).every((word) => haystack.includes(word));
}

/** 依日期篩選 + 關鍵字搜尋，得到目前要顯示的紀錄 */
export function useFilteredRecords(records: CosplayRecord[], filter: RecordFilter, search: string) {
  return useMemo(
    () => applyDateFilter(records, filter).filter((r) => matchesSearch(r, search)),
    [records, filter, search],
  );
}
