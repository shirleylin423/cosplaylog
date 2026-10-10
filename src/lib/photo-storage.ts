/**
 * 照片上傳：檔案會先壓縮，再存進 Enter Cloud／你自己的儲存空間，回傳可直接顯示的網址。
 *
 * 為什麼要壓縮：手機原圖一張動輒 3～5 MB，免費的 1 GB 儲存空間只放得下約 300 張。
 * 壓縮到長邊 1600px 後，一張約 200～400 KB，同樣空間可以放 3,000 張以上，
 * 上傳也快很多，而在手機螢幕上幾乎看不出畫質差異。
 *
 * 想更省空間可以調下面的參數（例如長邊 1280、品質 0.75）。
 * 路徑為 `{使用者 ID}/{亂數}.{副檔名}`，資料庫政策只允許本人上傳／覆蓋／刪除自己的照片。
 */

import { photoUploadUrl, supabase } from "@/lib/backend";

const BUCKET = "cosplay-photos";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 壓縮設定：想更省空間就把 maxEdge / quality 調低 */
export const PHOTO_COMPRESSION = {
  /** 長邊上限（像素）。1600 在手機上顯示已足夠清晰 */
  maxEdge: 1600,
  /** 畫質（0～1）。0.8 大約是「看不出差異」與「檔案夠小」的平衡點 */
  quality: 0.8,
  /** 小於這個大小的檔案就不重新編碼，免得白白損失畫質 */
  skipBelowBytes: 300 * 1024,
};

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

function extensionFromMime(mime: string, fallbackName: string): string {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";

  const ext = fallbackName.split(".").pop()?.toLowerCase() ?? "";
  return ext || "jpg";
}

let webpSupport: boolean | null = null;

function supportsWebp(): boolean {
  if (webpSupport === null) {
    try {
      webpSupport = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
    } catch {
      webpSupport = false;
    }
  }
  return webpSupport;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("圖片讀取失敗"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

/** 壓縮照片；不適合壓縮的情況（GIF 動畫、很小的檔案、壓完反而更大）就回傳原檔 */
async function preparePhoto(file: File): Promise<{ blob: Blob; extension: string }> {
  const original = { blob: file, extension: extensionFromMime(file.type, file.name) };

  // GIF 可能是動畫，重新編碼會變成靜態圖
  if (file.type === "image/gif") return original;

  const targetMime = supportsWebp() ? "image/webp" : "image/jpeg";

  // 不支援 WebP 時，PNG 轉 JPEG 會讓透明區域變黑，所以保留原檔
  if (file.type === "image/png" && targetMime === "image/jpeg") return original;

  if (file.size <= PHOTO_COMPRESSION.skipBelowBytes) return original;

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, PHOTO_COMPRESSION.maxEdge / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return original;

    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, targetMime, PHOTO_COMPRESSION.quality);

    if (!blob || blob.size >= file.size) return original;

    return { blob, extension: extensionFromMime(targetMime, file.name) };
  } catch {
    return original;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** 上傳到外部端點（Cloudflare Worker 存進 R2）：金鑰留在 Worker，前端只帶登入憑證 */
async function uploadToWorker(endpoint: string, blob: Blob): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("登入狀態已失效，請重新登入");
  }

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": blob.type || "image/webp",
      },
      body: blob,
    });
  } catch {
    throw new Error("連不到照片 Worker（可能是網路問題，或這個網址不在 Worker 允許的來源清單）");
  }

  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || `上傳被拒絕（${response.status}）`);
  }

  return payload.url;
}

/** 上傳到後端自己的儲存空間（未設定外部端點時的預設行為） */
async function uploadToStorage(blob: Blob, extension: string, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error("取得照片網址失敗");
  }

  return data.publicUrl;
}

export type PhotoUploadResult = {
  url: string;
  /** true 代表 R2/Worker 上傳失敗，照片改存在後端自己的儲存空間 */
  usedFallback: boolean;
  /** 失敗原因（給使用者看的說明） */
  reason?: string;
};

/**
 * 上傳照片。
 *
 * 有設定 photoUploadUrl 時優先上傳到自己的儲存空間（Cloudflare R2）；
 * 若失敗會自動改用後端內建的儲存空間，不讓使用者的照片存不進去，
 * 並回報原因讓畫面顯示提醒。
 */
export async function uploadCosplayPhoto(file: File, userId: string): Promise<PhotoUploadResult> {
  const { blob, extension } = await preparePhoto(file);

  if (photoUploadUrl) {
    try {
      const url = await uploadToWorker(photoUploadUrl, blob);
      return { url, usedFallback: false };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      console.warn("照片 Worker 上傳失敗，改用後端儲存空間：", error);

      const url = await uploadToStorage(blob, extension, userId);

      return { url, usedFallback: true, reason };
    }
  }

  const url = await uploadToStorage(blob, extension, userId);

  return { url, usedFallback: false };
}

/** 從後端儲存空間的公開網址取出物件路徑；不是本儲存空間的網址回傳 null */
function storagePathFromUrl(photoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = photoUrl.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(photoUrl.slice(index + marker.length));
}

async function deleteViaWorker(endpoint: string, photoUrl: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) return;

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: photoUrl }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "刪除照片失敗");
  }
}

/**
 * 刪除某張照片的檔案（刪除紀錄、或編輯時換掉照片後呼叫）。
 *
 * 安全規則：
 * - 只刪「我們自己上傳的」檔案；使用者自己貼上的外部網址一律不動
 * - 只刪自己資料夾底下的檔案（R2 由 Worker 判斷、後端儲存空間由資料庫政策擋）
 */
export async function deleteStoredPhoto(photoUrl: string, userId: string): Promise<void> {
  if (!photoUrl) return;

  // 1) 存在後端儲存空間（Supabase）的照片：直接用後端 API 刪
  const path = storagePathFromUrl(photoUrl);

  if (path) {
    if (!path.startsWith(`${userId}/`)) return;

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;
    return;
  }

  // 2) 存在自己的照片空間（R2）：交給 Worker 判斷與刪除
  if (photoUploadUrl) {
    await deleteViaWorker(photoUploadUrl, photoUrl);
  }

  // 3) 其他（使用者自己貼上的外部網址）：不動
}

/** 清理後端儲存空間裡沒有被任何紀錄使用的照片 */
async function cleanupBackendPhotos(userId: string, keepPaths: Set<string>): Promise<number> {
  const { data, error } = await supabase.storage.from(BUCKET).list(userId, { limit: 1000 });

  if (error || !data) return 0;

  const unused = data
    .map((item) => `${userId}/${item.name}`)
    .filter((path) => !keepPaths.has(path));

  if (unused.length === 0) return 0;

  const { error: removeError } = await supabase.storage.from(BUCKET).remove(unused);

  return removeError ? 0 : unused.length;
}

/**
 * 清理未使用的照片：把「目前所有紀錄都沒用到」的檔案刪掉，回收容量。
 * 會同時清理自己的照片空間（R2）與後端儲存空間。
 */
export async function cleanupUnusedPhotos(keepUrls: string[], userId: string): Promise<number> {
  const keepPaths = new Set(
    keepUrls.map((url) => storagePathFromUrl(url)).filter((path): path is string => Boolean(path)),
  );

  const backendDeleted = await cleanupBackendPhotos(userId, keepPaths);

  if (!photoUploadUrl) return backendDeleted;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error("登入狀態已失效，請重新登入");

  let response: Response;

  try {
    response = await fetch(`${photoUploadUrl.replace(/\/$/, "")}/cleanup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keep: keepUrls }),
    });
  } catch {
    throw new Error("連不到照片 Worker");
  }

  const payload = (await response.json().catch(() => null)) as { deleted?: number; error?: string } | null;

  if (!response.ok) {
    throw new Error(payload?.error || "清理失敗");
  }

  return (Number(payload?.deleted) || 0) + backendDeleted;
}
