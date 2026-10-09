// Cloudflare Worker：接收已壓縮的照片存進 R2，並在刪除紀錄時刪掉對應的照片。
//
// 為什麼需要它：R2 的金鑰不能放在前端（會被看光）。這個 Worker 會
//   1. 用使用者的登入憑證向你的後端確認身分
//   2. 只允許操作該使用者自己資料夾底下的檔案
//   3. 回傳可直接顯示的公開網址
//
// 端點：
//   POST /          上傳照片（body 是圖片本身）
//   POST /delete    刪除照片（body 是 { url: "照片公開網址" }）
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

function publicBase(env) {
  return (env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
}

/**
 * 允許的來源。ALLOWED_ORIGIN 可以用逗號分隔多個來源
 * （例如正式網站 + Enter 預覽視窗），會自動回傳符合的那一個。
 */
function corsHeaders(request, env) {
  const allowed = (env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const origin = request.headers.get("Origin") || "";

  let allowOrigin = allowed[0] || "*";

  if (allowed.includes("*")) {
    allowOrigin = "*";
  } else if (allowed.includes(origin)) {
    allowOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** 確認登入者，回傳 userId；失敗時回傳 null */
async function getUserId(request, env) {
  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) return null;

  try {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: env.SUPABASE_ANON_KEY },
    });

    if (!response.ok) return null;

    const user = await response.json();
    return user?.id || null;
  } catch {
    return null;
  }
}

async function handleUpload(request, env, userId, cors) {
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

  // 路徑固定在該使用者自己的資料夾底下
  const key = `${userId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

  try {
    await env.PHOTOS.put(key, body, { httpMetadata: { contentType } });
  } catch {
    return json({ error: "儲存失敗" }, 500, cors);
  }

  return json({ url: `${publicBase(env)}/${key}`, key }, 200, cors);
}

async function handleDelete(request, env, userId, cors) {
  let payload = null;

  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const target = typeof payload?.url === "string" ? payload.url.trim() : "";
  const base = publicBase(env);

  if (!target || !base) {
    return json({ error: "缺少照片網址" }, 400, cors);
  }

  // 只處理「這個儲存空間」的檔案，外部貼上的網址一律不動
  if (!target.startsWith(`${base}/`)) {
    return json({ error: "這個網址不屬於本儲存空間" }, 400, cors);
  }

  const key = decodeURIComponent(target.slice(base.length + 1));

  // 只能刪除自己資料夾底下的檔案
  if (!key.startsWith(`${userId}/`)) {
    return json({ error: "只能刪除自己的照片" }, 403, cors);
  }

  try {
    await env.PHOTOS.delete(key);
  } catch {
    return json({ error: "刪除失敗" }, 500, cors);
  }

  return json({ ok: true, key }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    const userId = await getUserId(request, env);

    if (!userId) {
      return json({ error: "登入憑證無效" }, 401, cors);
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, "");

    if (path === "/delete") {
      return handleDelete(request, env, userId, cors);
    }

    return handleUpload(request, env, userId, cors);
  },
};
