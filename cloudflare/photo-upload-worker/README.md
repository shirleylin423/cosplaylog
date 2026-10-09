# 照片上傳 Worker（Cloudflare Workers + R2）

這個 Worker 負責保管 R2 的金鑰、確認登入身分、把照片存進 R2，並在刪除紀錄時刪掉對應的照片。

**端點**

| 端點 | 用途 |
|---|---|
| `POST /` | 上傳照片（body 是圖片本身） |
| `POST /delete` | 刪除照片（body 是 `{ "url": "照片公開網址" }`） |

兩者都需要帶上使用者的登入憑證；刪除時 Worker 會確認那個檔案在**你自己的資料夾**底下才刪。

> 程式更新後，記得回 Worker → **Edit code** → 貼上最新內容 → **Deploy**，新功能才會生效。

**為什麼不直接從瀏覽器上傳到 R2？** 因為那需要把 R2 的密鑰放進前端，
任何人都能拿到並寫入你的儲存空間。所以一定要有一個小後端來保管金鑰，
這個 Worker 就是它（Cloudflare 免費方案：每天 10 萬次請求）。

---

## 部署步驟

### 1. 建立 R2 儲存桶

1. 到 Cloudflare 後台 → 左側 **R2** → **Create bucket**
2. 名稱：`cosplay-photos`（或你喜歡的名字）→ 建立
3. 進入該 bucket → **Settings** → **Public access** → 開啟 **R2.dev subdomain**（開發用即可）
4. 複製那個 `https://pub-xxxxxxxx.r2.dev` 網址 ← 這是 `PUBLIC_BASE_URL`

> 之後若要用自己的網域（例如 `photos.你的網域`）也可以，R2 的對外流量都是免費的。

### 2. 建立 Worker

1. Cloudflare 後台 → 左側 **Workers & Pages** → **Create** → **Worker** → 命名（例如 `cosplay-photo-upload`）→ **Deploy**
2. 進入該 Worker → **Edit code** → 把 `index.js` 的內容全部貼上取代 → **Deploy**

### 3. 設定環境變數

Worker → **Settings** → **Variables and Secrets**，新增這四個（型別選 Text）：

| 名稱 | 值 |
|---|---|
| `SUPABASE_URL` | `https://你的專案.supabase.co` |
| `SUPABASE_ANON_KEY` | 你的 anon / publishable 金鑰 |
| `PUBLIC_BASE_URL` | 第 1 步複製的 `https://pub-xxxx.r2.dev` |
| `ALLOWED_ORIGIN` | 允許的網站來源。多個用**逗號分隔**（例如正式網站 + Enter 預覽視窗）；填 `*` 表示全部允許 |

存好後記得 **Deploy** 一次讓設定生效。

### 4. 綁定 R2 儲存桶

Worker → **Settings** → **Bindings** → **Add** → 選 **R2 bucket**：

| 欄位 | 值 |
|---|---|
| Variable name | **`PHOTOS`**（必須完全一樣） |
| R2 bucket | 選第 1 步建立的 `cosplay-photos` |

### 5. 測試

Worker 的網址會像 `https://cosplay-photo-upload.你的帳號.workers.dev`。
在瀏覽器直接打開它應該回應 `{"error":"Method not allowed"}`（代表 Worker 活著）。

### 6. 告訴網站要用這個 Worker

編輯你 repo 的 `index.html`，在後端設定裡多一行：

```html
<script>
  window.__BACKEND__ = {
    url: "https://你的專案.supabase.co",
    anonKey: "你的 anon / publishable 金鑰",
    photoUploadUrl: "https://cosplay-photo-upload.你的帳號.workers.dev",
  };
</script>
```

Commit 之後，新上傳的照片就會存進 R2（舊照片不受影響，仍顯示原本的網址）。

---

## 費用（500 人 × 每天 1 張 × 10 年 = 約 182 萬張）

| 項目 | 用量 | 費用 |
|---|---|---|
| 儲存 | 約 550 GB | 前 10 GB 免費，之後 $0.015/GB/月 → 第 10 年約 $8/月 |
| 對外流量（看照片） | 不限 | **免費** |
| 寫入次數 | 約 1.5 萬/月 | 免費額度 100 萬/月 |
| 讀取次數 | 約 30 萬/月 | 免費額度 1000 萬/月 |

實際上是「慢慢長大、慢慢變貴」，前 1～2 年幾乎不花錢。
