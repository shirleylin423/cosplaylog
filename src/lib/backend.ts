/**
 * 後端連線的唯一入口。
 *
 * 預設使用 Enter Cloud。若要把 App 接到你自己的後端，只要在 index.html 的
 * `<script>` 裡設定 window.__BACKEND__，不需要改任何程式碼、也不用重新建置：
 *
 *   window.__BACKEND__ = {
 *     url: "https://你的專案.supabase.co",
 *     anonKey: "你的 anon key",
 *   };
 *
 * 其他檔案一律從這裡取得 supabase，不要直接 import 產生檔。
 */

import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  supabase as enterCloudClient,
} from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BackendOverride = {
  url?: string;
  anonKey?: string;
  /** 照片上傳端點（Cloudflare Worker 等）。沒設定就上傳到後端自己的儲存空間 */
  photoUploadUrl?: string;
};

const override = (window as Window & { __BACKEND__?: BackendOverride }).__BACKEND__;
const overrideUrl = override?.url?.trim();
const overrideKey = override?.anonKey?.trim();

export const backendUrl = overrideUrl || SUPABASE_URL;
export const isUsingOwnBackend = Boolean(overrideUrl);

const rawPhotoUploadUrl = override?.photoUploadUrl?.trim() || "";

/**
 * 照片上傳端點（例如 Cloudflare 的照片 Worker）。
 * 格式不對（不是 http/https 開頭）時視為未設定，改用後端內建的儲存空間，
 * 避免因為設定打錯字而讓照片上傳整個失敗。
 */
export const photoUploadUrl = /^https?:\/\//i.test(rawPhotoUploadUrl) ? rawPhotoUploadUrl : "";

export const supabase = overrideUrl
  ? createClient<Database>(overrideUrl, overrideKey || SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : enterCloudClient;
