import { useMemo } from "react";
import { Filter, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import CornerFlourish from "@/components/corner-flourish";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CosplayRecord, RecordFilter } from "@/lib/record-types";
import ChineseDatePicker from "./chinese-date-picker";

const MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1} 月`);

export default function FilterBar({
  records,
  filter,
  setFilter,
  count,
  search,
  setSearch,
  onClear,
}: {
  records: CosplayRecord[];
  filter: RecordFilter;
  setFilter: (filter: RecordFilter) => void;
  count: number;
  search: string;
  setSearch: (search: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const modes: { key: RecordFilter["mode"]; label: string }[] = [
    { key: "year", label: t("filter.mode.year") },
    { key: "month", label: t("filter.mode.month") },
    { key: "day", label: t("filter.mode.day") },
    { key: "range", label: t("filter.mode.range") },
  ];

  const years = useMemo(() => {
    const set = new Set(records.map((record) => Number(record.date.slice(0, 4))).filter(Boolean));
    set.add(currentYear);
    set.add(filter.year);
    return Array.from(set).sort((a, b) => b - a);
  }, [records, currentYear, filter.year]);

  const isDefault = filter.mode === "year" && filter.year === currentYear && !search.trim();

  const selectStyle = {
    background: "var(--surface-solid)",
    border: "1px solid var(--surface-border)",
    color: "var(--text)",
  };

  return (
    <section className="surface relative overflow-hidden rounded-2xl p-4">
      <CornerFlourish position="tl" size={40} />
      <CornerFlourish position="br" size={40} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: "var(--accent)" }} />
          <span className="font-serif-tc text-sm font-semibold">{t("filter.title")}</span>
        </div>

        {/* 篩選模式 */}
        <div className="flex rounded-full p-0.5" style={{ background: "var(--accent-soft)" }}>
          {modes.map((mode) => {
            const active = filter.mode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setFilter({ ...filter, mode: mode.key })}
                className="font-serif-tc rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                style={active ? { background: "var(--accent)", color: "var(--on-accent)" } : { color: "var(--text)" }}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* 各模式的專屬控制項 */}
        {(filter.mode === "year" || filter.mode === "month") && (
          <Select value={String(filter.year)} onValueChange={(value) => setFilter({ ...filter, year: Number(value) })}>
            <SelectTrigger className="w-28 rounded-full" style={selectStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={selectStyle}>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {t("filter.yearOption", { year })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filter.mode === "month" && (
          <Select value={String(filter.month)} onValueChange={(value) => setFilter({ ...filter, month: Number(value) })}>
            <SelectTrigger className="w-24 rounded-full" style={selectStyle}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={selectStyle}>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={String(index)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filter.mode === "day" && (
          <div className="w-52">
            <ChineseDatePicker
              value={filter.day}
              onChange={(iso) => setFilter({ ...filter, day: iso })}
              placeholder={t("filter.pickDay")}
            />
          </div>
        )}

        {filter.mode === "range" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <ChineseDatePicker
                value={filter.start}
                onChange={(iso) => setFilter({ ...filter, start: iso })}
                placeholder={t("filter.rangeStart")}
              />
            </div>
            <span className="text-muted-foreground">{t("filter.rangeTo")}</span>
            <div className="w-48">
              <ChineseDatePicker
                value={filter.end}
                onChange={(iso) => setFilter({ ...filter, end: iso })}
                placeholder={t("filter.rangeEnd")}
              />
            </div>
          </div>
        )}

        {/* 關鍵字搜尋 */}
        <div className="relative min-w-[180px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent)" }} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("filter.searchPlaceholder")}
            className="h-9 rounded-full pl-9 pr-8"
            style={{
              background: "var(--surface-solid)",
              borderColor: "var(--surface-border)",
              color: "var(--text)",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("common.close")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-[var(--accent-soft)]"
            >
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground whitespace-nowrap text-sm">
            {t("filter.count")} <span style={{ color: "var(--accent)", fontWeight: 600 }}>{count}</span>{" "}
            {t("filter.countUnit")}
          </span>

          {!isDefault && (
            <button
              type="button"
              onClick={onClear}
              className="btn-ghost font-serif-tc flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm"
            >
              <X size={14} /> {t("filter.clear")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
