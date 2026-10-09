import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { THEMES, THEME_ORDER, type ThemeKey } from "@/lib/themes";

/**
 * 主題縮圖：外層標上 data-theme，讓縮圖內的 CSS token 直接解析成那款主題的顏色，
 * 不需要在程式裡另外複製一份色票。
 */
function ThemeThumb({
  themeKey,
  active,
  label,
  onClick,
}: {
  themeKey: ThemeKey;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-theme={themeKey}
      onClick={onClick}
      className="relative overflow-hidden rounded-lg border text-left transition-transform hover:scale-[1.03]"
      style={{
        borderColor: active ? "var(--accent)" : "var(--surface-border)",
        borderWidth: active ? 2 : 1,
      }}
    >
      <div
        className="relative h-16 w-full"
        style={{ background: "linear-gradient(145deg, var(--bg-a), var(--bg-b), var(--bg-c))" }}
      >
        <span
          className="absolute left-2 top-2 h-3 w-3 rounded-full"
          style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }}
        />
        <span className="absolute right-2 top-3 h-2 w-2 rounded-full" style={{ background: "var(--accent-2)" }} />
        <span
          className="absolute bottom-2 left-3 h-1.5 w-8 rounded-full"
          style={{ background: "var(--accent)", opacity: 0.6 }}
        />
        {active && (
          <span
            className="absolute bottom-1.5 right-1.5 rounded-full p-0.5"
            style={{ background: "var(--accent)", color: "var(--on-accent)" }}
          >
            <Check size={12} />
          </span>
        )}
      </div>
      <div className="px-2 py-1.5" style={{ background: "var(--surface-solid)" }}>
        <div className="font-serif-tc text-xs font-semibold" style={{ color: "var(--text)" }}>
          {label}
        </div>
      </div>
    </button>
  );
}

export default function ThemePicker({
  themeKey,
  onChange,
}: {
  themeKey: ThemeKey;
  onChange: (themeKey: ThemeKey) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="btn-ghost flex items-center gap-1.5 rounded-full px-3 py-2 text-sm">
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <span className="hidden sm:inline">{t("theme.button")}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 border-0 p-3"
        style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
      >
        <div className="font-serif-tc mb-2 text-sm font-semibold" style={{ color: "var(--accent)" }}>
          {t("theme.title")}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {THEME_ORDER.map((key) => (
            <ThemeThumb
              key={key}
              themeKey={key}
              active={themeKey === key}
              label={THEMES[key].name}
              onClick={() => onChange(key)}
            />
          ))}
        </div>

        <p className="text-muted-foreground mt-2 text-xs">{THEMES[themeKey].desc}</p>
      </PopoverContent>
    </Popover>
  );
}
