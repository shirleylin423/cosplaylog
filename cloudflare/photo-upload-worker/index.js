// Cloudflare Worker：接收已壓縮的照片，存進 R2，回傳公開網址。
//
// 為什麼需要它：R2 的金鑰不能放在前端（會被看光）。這個 Worker 會
//   1. 用使用者的登入憑證向你的後端確認身分
//   2. 只把照片存進該使用者自己的資料夾
//   3. 回傳可直接顯示的公開網址
//
// 需要的環境變數（在 Cloudflare 後台設定）：
//   SUPABASE_URL        你的後端網址，例如 https://xxxx.supabase.co
//   SUPABASE_ANON_KEY   你的後端 anon / publishable 金鑰
//   PUBLIC_BASE_URL     照片的公開網址前綴（R2 的 r2.dev 網址或你的自訂網域）
//   ALLOWED_ORIGIN      允許的網站來源，例如 https://帳號.github.io
// 需要的 R2 綁定：
//   PHOTOS              R2 bucket 綁定名稱（變數名稱必須是 PHOTOS）

const MAX_BYTES = 10 * 1024 * 1024;

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function extensionFor(contentType) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "webp";
}

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    // 1. 確認登入者
    const authorization = request.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return json({ error: "未登入" }, 401, cors);
    }

    let userId = "";

    try {
      const userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: authorization, apikey: env.SUPABASE_ANON_KEY },
      });

      if (!userResponse.ok) {
        return json({ error: "登入憑證無效" }, 401, cors);
      }

      const user = await userResponse.json();
      userId = user?.id || "";
    } catch {
      return json({ error: "無法確認登入狀態" }, 502, cors);
    }

    if (!userId) {
      return json({ error: "無法取得使用者" }, 401, cors);
    }

    // 2. 檢查內容
    const contentType = request.headers.get("Content-Type") || "image/webp";

    if (!contentType.startsWith("image/")) {
      return json({ error: "只接受圖片" }, 415, cors);
    }

    const body = await request.arrayBuffer();

    if (body.byteLength === 0) {
      return json({ error: "檔案是空的" }, 400, cors);
    }

    if (body.byteLength > MAX_BYTES) {
      return json({ error: "檔案太大" }, 413, cors);
    }

    // 3. 存進 R2（路徑固定在該使用者自己的資料夾底下）
    const key = `${userId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

    try {
      await env.PHOTOS.put(key, body, { httpMetadata: { contentType } });
    } catch {
      return json({ error: "儲存失敗" }, 500, cors);
    }

    // 4. 回傳公開網址
    const base = (env.PUBLIC_BASE_URL || "").replace(/\/$/, "");

    return json({ url: `${base}/${key}`, key }, 200, cors);
  },
};
