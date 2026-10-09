# 搬家指南：把「攪拌紀錄」搬到你自己的後端

搬家的目標：**前端放在你的 GitHub、後端換成你自己申請的服務**，之後完全不依賴 Enter 的點數與方案。

---

## 先知道兩件事

1. **這個 App 需要後端**（帳號、資料庫、照片儲存），不是純靜態網站。所以「放到 GitHub」只解決前端；後端也要換成你自己的，才算真正獨立。
2. **前置條件**：Enter 的「下載程式碼」與「GitHub 同步」是 **Basic 以上方案**的功能。沒有它就拿不到程式碼，也就無法搬家。

## 搬完之後的架構

| 部分 | 放在哪 |
|---|---|
| 前端（網頁） | 你的 GitHub repo，用 GitHub Pages 免費發布 |
| 後端（帳號／資料庫） | 你自己申請的資料庫服務（建議 Supabase 免費方案） |
| 照片 | 你自己的後端儲存空間 |

之所以建議 Supabase，是因為本專案就是用它寫的 —— 換過去**一行程式都不用改**，只要填連線設定。

---

## 步驟

### 1. 申請自己的後端

1. 到 supabase.com 註冊 → **New project**（免費方案即可）
2. 建立完成後到 **Project Settings → API**，記下 **Project URL** 與 **anon public key**

### 2. 建立資料庫結構

在 Supabase → **SQL Editor** → 貼上本資料夾的 `schema.sql` 全部內容 → **Run**。

會建立：`profiles`（暱稱）、`cosplay_records`（紀錄）、兩張表的 RLS 安全政策、照片儲存空間 `cosplay-photos`。

### 3. 關閉信箱驗證

**Authentication → Sign In / Providers → Email** → 關閉 **Confirm email**。
這樣註冊後不用收信就能直接登入（和現在的體驗一致）。

### 4. 把程式碼放到 GitHub

- 已升級 Basic 的話：Enter 專案 → **設定 → Integrations → GitHub** 連接後，程式碼會自動同步到你的 repo；或
- **設定 → Project → Download code** 下載 ZIP，解壓後上傳到你的 GitHub repo

### 5. 指定你自己的後端

編輯 `index.html`，找到被註解掉的區塊，改成：

```html
<script>
  window.__BACKEND__ = {
    url: "https://你的專案.supabase.co",
    anonKey: "你的 anon public key",
  };
</script>
```

不需要改任何程式碼、也不用重新建置，程式會自動改連你的後端。

### 6. 發布網站

你的 repo → **Settings → Pages → Source 選「GitHub Actions」**。
之後每次 push 都會自動建置與部署，網址是 `https://你的帳號.github.io/你的repo名/`。

`.github/workflows/deploy-pages.yml` 已經附在專案裡，不需要自己寫。

### 7. 把舊紀錄帶過去（如果有）

App 右上角有 **「匯出資料」** 按鈕，會下載一個 JSON 備份檔（包含所有紀錄與照片網址）。
把那個檔案貼進對話交給 AI，就能幫你轉成新後端的匯入語法。

---

## 要注意的地方

- **免費的 Supabase 專案閒置一段時間會被暫停**（需要偶爾開一下或升級方案）。這就是「獨立」的代價：主機從此由你負責。
- **舊照片**目前存在 Enter Cloud 的空間裡。搬到新後端後舊網址會失效，建議搬家前先把照片檔保存下來，再重新上傳到新後端。
- 搬家後，之後的修改都要在你的 repo 進行。如果還想用 Enter 繼續開發，記得每次同步後重新確認 `index.html` 的後端設定有沒有被蓋掉。
- 想用自己的網域（而不是 `github.io`）可以在 GitHub Pages 設定，免費。

---

## 附錄：把 Converge／Enter 的痕跡完全移除（可選）

程式在設定 `window.__BACKEND__` 之後，執行時已經不會連到 Enter。若你想連建置流程也完全乾淨，可以在**你自己的 repo** 做這幾件事：

1. **移除 Enter 的 Vite 外掛**：`vite.config.ts` 裡把 `enterProdPlugin` / `enterDevPlugin` 拿掉（改成 `plugins: []`），並從 `package.json` 刪掉 `vite-plugin-enter-dev`。
2. **移除 Enter 分析套件**：本專案已把 `src/analytics.ts` 改成空操作，所以 `@enter-pro/analytics-sdk` 已經用不到，可以從 `package.json` 刪除；`src/env.d.ts` 內的 `VITE_ENTER_ANALYTICS_*` 型別宣告也可一併刪掉。
3. **刪除平台殘留資料夾**：`.enter/`、`supabase/`（只是遷移紀錄）、`.env.example` 若不需要可刪。
4. 刪完後執行 `pnpm install` 與 `pnpm run build:prod` 確認還能建置。

> 提醒：這幾步只做在你自己的 repo。在 Enter 專案裡移除這些會影響線上預覽。

