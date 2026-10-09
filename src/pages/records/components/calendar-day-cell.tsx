import { useEffect, useState, type CSSProperties } from "react";
import { ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CosplayRecord } from "@/lib/record-types";

/** 滑鼠移過去時，每隔多久換一張照片 */
const SLIDE_INTERVAL = 1200;

function photoStyle(record: CosplayRecord): CSSProperties {
  if (!record.photo) return { background: "var(--accent-soft)" };
  return {
    backgroundImage: `url(${record.photo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function photoCaption(record: CosplayRecord): string {
  return record.event || record.series || record.character || record.type;
}

/**
 * 月曆的單一日期格子。
 *
 * - 沒有紀錄：乾淨的日期數字，週末用不同顏色
 * - 1 筆紀錄：照片填滿整格
 * - 2 筆以上：左右並排兩張縮圖（看得出這天有兩場活動），超過兩筆顯示 +N
 * - 滑鼠移上去：自動輪播當天所有照片，並顯示活動名稱與張數
 * - 點一下：跳到照片牆並篩選這一天
 */
export default function CalendarDayCell({
  date,
  iso,
  records,
  weekend,
  isToday,
  highlighted,
  typeColorMap,
  onPickDay,
}: {
  date: Date;
  iso: string;
  records: CosplayRecord[];
  weekend: boolean;
  isToday: boolean;
  highlighted: boolean;
  typeColorMap: Record<string, string>;
  onPickDay: (iso: string) => void;
}) {
  const { t } = useTranslation();
  const [hovering, setHovering] = useState(false);
  const [index, setIndex] = useState(0);

  const total = records.length;
  const dayNumber = date.getDate();

  useEffect(() => {
    if (!hovering || total <= 1) {
      setIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [hovering, total]);

  // 沒有紀錄的日期
  if (total === 0) {
    return (
      <div
        className="relative flex aspect-square items-start justify-start rounded-xl p-1 sm:rounded-2xl sm:p-1.5"
        style={{
          border: `1px solid ${highlighted ? "var(--accent)" : "var(--surface-border)"}`,
          background: highlighted ? "var(--accent-soft)" : "transparent",
          boxShadow: isToday ? "0 0 0 2px var(--accent)" : undefined,
        }}
      >
        <span
          className={`text-[11px] sm:text-sm ${isToday ? "font-bold" : ""}`}
          style={{
            color: isToday ? "var(--accent)" : weekend ? "var(--accent-2)" : "var(--text-muted)",
          }}
        >
          {dayNumber}
        </span>
      </div>
    );
  }

  const current = records[Math.min(index, total - 1)];
  const typeColor = typeColorMap[current.type] || "var(--accent)";
  const showSlideshow = total === 1 || hovering;

  return (
    <button
      type="button"
      onClick={() => onPickDay(iso)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      title={t("calendar.dayHint", { count: total })}
      className="relative aspect-square overflow-hidden rounded-xl transition-transform hover:scale-[1.03] sm:rounded-2xl"
      style={{
        border: `2px solid ${isToday ? "var(--accent)" : typeColor}`,
        boxShadow: isToday ? "0 0 0 3px var(--accent-soft)" : undefined,
      }}
    >
      {showSlideshow ? (
        <div className="absolute inset-0" style={photoStyle(current)}>
          {!current.photo && (
            <span className="flex h-full w-full items-center justify-center">
              <ImageOff size={14} style={{ color: typeColor }} />
            </span>
          )}
        </div>
      ) : (
        // 兩筆以上：左右並排兩張縮圖，一眼看出這天有兩場活動
        <div className="absolute inset-0 flex">
          {records.slice(0, 2).map((record, position) => (
            <div
              key={record.id}
              className="relative flex-1"
              style={{
                ...photoStyle(record),
                borderRight: position === 0 && records.length > 1 ? "1px solid var(--surface-border)" : undefined,
              }}
            >
              {!record.photo && (
                <span className="flex h-full w-full items-center justify-center">
                  <ImageOff size={12} style={{ color: typeColorMap[record.type] || "var(--accent)" }} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 讓日期數字在任何照片上都清楚 */}
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}
      />

      <span
        className={`absolute left-1 top-0.5 text-[10px] font-bold sm:text-xs ${isToday ? "rounded-full px-1" : ""}`}
        style={{
          color: isToday ? "var(--on-accent)" : "#fff",
          textShadow: isToday ? undefined : "0 1px 2px rgba(0,0,0,0.8)",
          background: isToday ? "var(--accent)" : undefined,
        }}
      >
        {dayNumber}
      </span>

      {/* 超過兩筆時標示還有幾張 */}
      {!hovering && total > 2 && (
        <span
          className="absolute bottom-0.5 right-0.5 rounded-full px-1 text-[9px] font-semibold sm:text-[10px]"
          style={{ background: "var(--accent)", color: "var(--on-accent)" }}
        >
          {t("calendar.multiCount", { count: total - 2 })}
        </span>
      )}

      {/* 輪播時顯示目前是哪一場活動、第幾張 */}
      {hovering && total > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 px-1.5 py-0.5 text-[9px] sm:text-[10px]"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
        >
          <span className="truncate">{photoCaption(current)}</span>
          <span className="font-semibold">
            {Math.min(index, total - 1) + 1}/{total}
          </span>
        </div>
      )}
    </button>
  );
}
