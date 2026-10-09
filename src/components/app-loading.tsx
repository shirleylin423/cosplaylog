import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

/** 品牌載入畫面：還原登入狀態、或載入紀錄時顯示 */
export default function AppLoading({ label }: { label?: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="font-serif-tc text-2xl font-bold text-foreground">
          {t("common.appName")}
        </div>

        <div className="font-deco mt-2 text-[10px] tracking-[0.3em] text-muted-foreground">
          {t("common.appNameLatin")}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span>{label ?? t("common.loading")}</span>
        </div>
      </div>
    </div>
  );
}
