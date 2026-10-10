import { useState } from "react";
import { Check, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROLE_ORDER, roleLabelKey, type UserRole } from "@/lib/roles";

/**
 * 暱稱按鈕：點一下可以切換身分、設定自己會使用哪些身分。
 * 只啟用一個身分時不會出現切換選項；至少要保留一個身分。
 */
export default function RoleSwitch({
  displayName,
  enabledRoles,
  activeRole,
  onChangeRole,
  onToggleRole,
}: {
  displayName: string;
  enabledRoles: UserRole[];
  activeRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onToggleRole: (role: UserRole, enabled: boolean) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const canSwitch = enabledRoles.length > 1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-2 py-1 text-sm transition-opacity hover:opacity-80"
          style={{ color: "var(--text)" }}
        >
          <UserRound size={15} />
          <span className="max-w-[140px] truncate">{displayName}</span>
          <span
            className="font-serif-tc rounded-full px-2 py-0.5 text-[10px]"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {t(roleLabelKey(activeRole))}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-64 border-0 p-3"
        style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
      >
        <div className="font-serif-tc mb-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>
          {t("role.title")}
        </div>

        {/* 目前身分：啟用兩個身分時才需要切換 */}
        {canSwitch && (
          <div className="mb-3">
            <div className="text-muted-foreground mb-1.5 text-xs">{t("role.active")}</div>
            <div className="flex rounded-full p-0.5" style={{ background: "var(--accent-soft)" }}>
              {enabledRoles.map((role) => {
                const active = role === activeRole;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onChangeRole(role)}
                    className="font-serif-tc flex-1 rounded-full py-1.5 text-xs font-medium transition-colors"
                    style={active ? { background: "var(--accent)", color: "var(--on-accent)" } : { color: "var(--text)" }}
                  >
                    {t(roleLabelKey(role))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 我會使用的身分 */}
        <div className="text-muted-foreground mb-1.5 text-xs">{t("role.enabled")}</div>
        <div className="space-y-1">
          {ROLE_ORDER.map((role) => {
            const enabled = enabledRoles.includes(role);

            return (
              <button
                key={role}
                type="button"
                onClick={() => onToggleRole(role, !enabled)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--accent-soft)]"
              >
                <span
                  className="flex h-4 w-4 items-center justify-center rounded"
                  style={{
                    border: "1px solid var(--surface-border)",
                    background: enabled ? "var(--accent)" : "transparent",
                  }}
                >
                  {enabled && <Check size={11} style={{ color: "var(--on-accent)" }} />}
                </span>
                {t(roleLabelKey(role))}
              </button>
            );
          })}
        </div>

        <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">{t("role.hint")}</p>
      </PopoverContent>
    </Popover>
  );
}
