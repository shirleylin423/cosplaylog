/**
 * 照片上傳：檔案會存進 Enter Cloud 的儲存空間，回傳可直接顯示的公開網址。
 * 路徑為 `{使用者 ID}/{亂數}.{副檔名}`，資料庫政策只允許本人上傳／覆蓋／刪除自己的照片。
 */

import { supabase } from "@/lib/backend";

const BUCKET = "cosplay-photos";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extensionOf(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpeg") return "jpg";
  if (ALLOWED_MIME_TYPES.includes(file.type)) {
    return file.type.replace("image/", "").replace("jpeg", "jpg");
  }
  return ext || "jpg";
}

/** 回傳 i18n 錯誤 key；檔案沒問題時回傳 null */
export function validatePhotoFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return "form.error.uploadSize";
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return "form.error.uploadType";
  }
  return null;
}

export async function uploadCosplayPhoto(file: File, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${extensionOf(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("取得照片網址失敗");
  }

  return data.publicUrl;
}
