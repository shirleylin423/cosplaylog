/** 金色慕夏風花紋邊角（統計卡、月曆外框、表單與詳情視窗四角） */

type Position = "tl" | "tr" | "bl" | "br";

const ROTATION: Record<Position, number> = { tl: 0, tr: 90, br: 180, bl: 270 };

const OFFSET: Record<Position, React.CSSProperties> = {
  tl: { top: -1, left: -1 },
  tr: { top: -1, right: -1 },
  bl: { bottom: -1, left: -1 },
  br: { bottom: -1, right: -1 },
};

export default function CornerFlourish({
  position = "tl",
  size = 56,
  className = "",
}: {
  position?: Position;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute ${className}`}
      style={{
        ...OFFSET[position],
        transform: `rotate(${ROTATION[position]}deg)`,
        color: "var(--gold)",
        opacity: 0.85,
      }}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M6 42 C6 20 20 6 42 6" />
        <path d="M6 30 C6 16 16 6 30 6" opacity="0.6" />
        <path d="M12 12 q14 2 20 10 q8 12 2 24" opacity="0.9" />
        {/* 花苞 */}
        <path d="M12 12 q-4 -8 4 -10 q8 2 4 10 q-4 2 -8 0" fill="currentColor" stroke="none" opacity="0.9" />
        <circle cx="34" cy="34" r="3" fill="currentColor" stroke="none" />
        <path d="M40 10 q6 0 8 6" opacity="0.7" />
        <path d="M10 40 q0 6 6 8" opacity="0.7" />
      </g>
    </svg>
  );
}
