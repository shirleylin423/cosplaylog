// 攪拌紀錄 · 照片 Worker（自動偵測 R2 綁定名稱，避免大小寫或空白造成的問題）
//
// 端點：
//   POST /          上傳照片
//   POST /delete    刪除照片（body 是 { "url": "照片公開網址" }）
//
// 需要的環境變數：SUPABASE_URL、SUPABASE_ANON_KEY、PUBLIC_BASE_URL
// 需要的綁定：任何名稱的 R2 bucket（程式會自動找到）
//
// 安全性：每個請求都會用使用者的登入憑證向後端確認身分，且只能操作自己資料夾底下的檔案。
// 因此 CORS 允許所有來源（安全性來自登入驗證，不是來源限制）。

const MAX_BYTES = 10 * 1024 * 1024;

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** 找出 R2 綁定：不管綁定叫 PHOTOS、photos 還是別的名字都能用 */
function findBucket(env) {
  if (env.PHOTOS) return env.PHOTOS;

  const key = Object.keys(env).find((name) => {
    const value = env[name];
    return value && typeof value.put === "function" && typeof value.get === "function";
  });

  return key ? env[key] : null;
}

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

function extensionFor(contentType) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "webp";
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const bucket = findBucket(env);

    if (!bucket) {
      return json({ error: "Worker 上找不到 R2 綁定，請檢查 Settings → Bindings 設定" }, 500, headers);
    }

    if (!env.PUBLIC_BASE_URL) {
      return json({ error: "缺少 PUBLIC_BASE_URL 環境變數" }, 500, headers);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, headers);
    }

    const userId = await getUserId(request, env);

    if (!userId) {
      return json({ error: "登入憑證無效" }, 401, headers);
    }

    const base = env.PUBLIC_BASE_URL.replace(/\/$/, "");
    const path = new URL(request.url).pathname.replace(/\/+$/, "");

    if (path === "/delete") {
      let payload = null;

      try {
        payload = await request.json();
      } catch {
        payload = null;
      }

      const target = typeof payload?.url === "string" ? payload.url.trim() : "";

      if (!target || !target.startsWith(`${base}/`)) {
        return json({ error: "這個網址不屬於本儲存空間" }, 400, headers);
      }

      const key = decodeURIComponent(target.slice(base.length + 1));

      if (!key.startsWith(`${userId}/`)) {
        return json({ error: "只能刪除自己的照片" }, 403, headers);
      }

      try {
        await bucket.delete(key);
      } catch (error) {
        return json({ error: "刪除失敗", detail: String(error) }, 500, headers);
      }

      return json({ ok: true, key }, 200, headers);
    }

    const contentType = request.headers.get("Content-Type") || "image/webp";

    if (!contentType.startsWith("image/")) {
      return json({ error: "只接受圖片" }, 415, headers);
    }

    const body = await request.arrayBuffer();

    if (body.byteLength === 0) {
      return json({ error: "檔案是空的" }, 400, headers);
    }

    if (body.byteLength > MAX_BYTES) {
      return json({ error: "檔案太大" }, 413, headers);
    }

    const key = `${userId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

    try {
      await bucket.put(key, body, { httpMetadata: { contentType } });
    } catch (error) {
      return json({ error: "儲存失敗", detail: String(error) }, 500, headers);
    }

    return json({ url: `${base}/${key}`, key }, 200, headers);
  },
};
