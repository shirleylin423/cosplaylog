import { useState } from "react";
import { Download, Share, Smartphone, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePwaInstall, type InstallPlatform } from "@/hooks/use-pwa-install";

const PLATFORM_ICONS: Record<InstallPlatform, typeof Share> = {
  ios: Share,
  android: Smartphone,
  desktop: Monitor,
};

/**
 * 安裝成 App：可安裝的裝置直接叫出安裝視窗，其他裝置顯示手動加入教學。
 */
export default function InstallAppButton() {
  const { t } = useTranslation();
  const { canPrompt, isInstalled, platform, promptInstall } = usePwaInstall();
  const [dialogOpen, setDialogOpen] = useState(false);

  // 已經用獨立視窗開啟（就是已安裝的 App）就不用再顯示
  if (isInstalled) return null;

  async function handleClick() {
    if (!canPrompt) {
      setDialogOpen(true);
      return;
    }

    const outcome = await promptInstall();

    if (outcome === "accepted") {
      toast.success(t("install.toastInstalled"));
      return;
    }

    if (outcome === "dismissed") {
      toast.info(t("install.toastDismissed"));
      return;
    }

    setDialogOpen(true);
  }

  const platforms: InstallPlatform[] = ["ios", "android", "desktop"];
  // 把自己裝置的教學排在最前面
  const ordered = [platform, ...platforms.filter((item) => item !== platform)];

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="btn-ghost font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-2 text-sm"
      >
        <Download size={16} style={{ color: "var(--accent)" }} />
        <span className="hidden sm:inline">{t("install.button")}</span>
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90vh] max-w-md overflow-y-auto border-0"
          style={{
            background: "var(--surface-solid)",
            border: "1px solid var(--surface-border)",
            color: "var(--text)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-serif-tc text-xl" style={{ color: "var(--accent)" }}>
              {t("install.title")}
            </DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{t("install.desc")}</p>

          <div className="mt-4 space-y-3">
            {ordered.map((item) => {
              const Icon = PLATFORM_ICONS[item];
              const isYours = item === platform;

              return (
                <div
                  key={item}
                  className="rounded-2xl p-3.5"
                  style={{
                    background: isYours ? "var(--accent-soft)" : "transparent",
                    border: `1px solid ${isYours ? "var(--accent)" : "var(--surface-border)"}`,
                  }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={15} style={{ color: "var(--accent)" }} />
                    <span className="font-serif-tc text-foreground text-sm font-semibold">
                      {t(`install.${item}Title`)}
                    </span>
                    {isYours && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                      >
                        {t("install.yourDevice")}
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed">{t(`install.${item}Steps`)}</p>
                </div>
              );
            })}
          </div>

          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{t("install.note")}</p>

          <button
            type="button"
            onClick={() => setDialogOpen(false)}
            className="btn-primary font-serif-tc mt-4 w-full rounded-full py-2.5 text-sm font-medium"
          >
            {t("install.gotIt")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
