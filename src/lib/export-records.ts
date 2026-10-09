/**
 * 備份／匯出：把紀錄整理成一個 JSON 檔下載下來。
 *
 * 這個檔案包含完整的紀錄內容與照片網址，用途是：
 * 1. 自己留存一份（不管之後在哪裡使用）
 * 2. 搬到自己的後端時，可以拿它來重建資料
 */

import type { CosplayRecord } from "./record-types";

export const BACKUP_VERSION = 1;

export type BackupPayload = {
  app: string;
  version: number;
  exportedAt: string;
  account: {
    id: string;
    email: string;
    displayName: string;
  };
  recordCount: number;
  records: CosplayRecord[];
  photoUrls: string[];
  note: string;
};

export function buildBackup(
  records: CosplayRecord[],
  account: { id: string; email: string; displayName: string },
): BackupPayload {
  return {
    app: "攪拌紀錄 · COSPLAY LOG",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    account,
    recordCount: records.length,
    records: [...records].sort((a, b) => a.date.localeCompare(b.date)),
    photoUrls: records.map((record) => record.photo).filter(Boolean),
    note: "這是「攪拌紀錄」的備份檔，包含所有紀錄與照片網址。照片檔本身請另外保存（網址可能需要登入才看得到）。",
  };
}

export function backupFileName(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `cosplaylog-backup-${stamp}.json`;
}

export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
