import { FileDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { backupFileName, buildBackup, downloadJson } from "@/lib/export-records";
import type { CosplayRecord } from "@/lib/record-types";

/** 匯出資料：把目前所有紀錄下載成一個 JSON 備份檔 */
export default function ExportRecordsButton({
  records,
  account,
}: {
  records: CosplayRecord[];
  account: { id: string; email: string; displayName: string };
}) {
  const { t } = useTranslation();

  function handleExport() {
    if (records.length === 0) {
      toast.info(t("export.empty"));
      return;
    }

    downloadJson(backupFileName(), buildBackup(records, account));
    toast.success(t("export.done", { count: records.length }));
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="font-serif-tc flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
      style={{ background: "var(--accent-soft)", color: "var(--text)" }}
    >
      <FileDown size={15} />
      {t("export.button")}
    </button>
  );
}
