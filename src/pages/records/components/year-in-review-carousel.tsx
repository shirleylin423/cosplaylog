import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatFull } from "@/lib/date-utils";
import type { CosplayRecord } from "@/lib/record-types";

const SLIDE_INTERVAL = 4500;

/** 年度回憶的精選照片輪播（自動播放，可手動翻頁） */
export default function YearInReviewCarousel({
  photos,
  typeColorMap,
}: {
  photos: CosplayRecord[];
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const total = photos.length;

  useEffect(() => {
    if (total <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, SLIDE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [total]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (total <= 1) return;
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % total);
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + total) % total);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [total]);

  if (total === 0) return null;

  const photo = photos[Math.min(index, total - 1)];
  const color = typeColorMap[photo.type] || "var(--accent)";

  function step(delta: number) {
    setIndex((current) => (current + delta + total) % total);
  }

  return (
    <div className="surface relative overflow-hidden rounded-3xl">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
        {photo.photo ? (
          <div
            key={photo.id}
            className="anim-fade-up absolute inset-0"
            style={{
              backgroundImage: `url(${photo.photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
            <ImageOff size={40} style={{ color }} />
          </div>
        )}

        {/* 底部漸層，讓文字在任何照片上都清楚 */}
        <div
          className="absolute inset-x-0 bottom-0 h-3/5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82), transparent)" }}
        />

        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: color, color: "#fff" }}
        >
          {photo.type}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="font-serif-tc text-2xl font-bold text-white sm:text-3xl">{photo.character}</div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/90">
            {photo.series && <span>{photo.series}</span>}
            {photo.event && <span>{photo.event}</span>}
            {photo.photographer && <span>{photo.photographer}</span>}
          </div>

          <div className="mt-1 text-xs text-white/80">{formatFull(photo.date)}</div>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t("review.prevPhoto")}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/20"
              style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t("review.nextPhoto")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/20"
              style={{ background: "rgba(0,0,0,0.35)", color: "#fff" }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {photos.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`${dotIndex + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: dotIndex === index ? 20 : 6,
                  background: dotIndex === index ? "var(--accent)" : "var(--surface-border)",
                }}
              />
            ))}
          </div>

          <span className="font-deco text-muted-foreground text-xs">
            {t("review.photosCounter", { current: Math.min(index, total - 1) + 1, total })}
          </span>
        </div>
      )}
    </div>
  );
}
