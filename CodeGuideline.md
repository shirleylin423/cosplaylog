# Code Guideline

## Project Structure Overview

```
project-root/
  ├── i18n.config.json       # i18n manifest for supported locales and language metadata
  ├── public/
  │   ├── locales/           # public/locales/{code}.json translation files
  │   ├── manifest.webmanifest # PWA manifest（加到手機主畫面）
  │   └── icon-*.png         # PWA／主畫面圖示
  ├── cloudflare/photo-upload-worker/ # 選用：照片改存 Cloudflare R2 的 Worker（含部署說明）
  ├── migration-kit/         # 搬家套件：資料庫結構 schema.sql 與步驟說明
  └── src/
      ├── components/        # All reusable UI components
      │   ├── ui/            # Prebuilt and custom UI components, grouped by function
      │   ├── auth/          # 登入狀態守門元件（RequireAuth）
      │   ├── theme-background.tsx  # 三主題背景（純 SVG）
      │   ├── theme-picker.tsx      # 主題挑選
      │   ├── install-app-button.tsx # 安裝成 App（含手動加入教學）
      │   ├── corner-flourish.tsx   # 卡片邊角花紋
      │   └── app-loading.tsx       # 品牌載入畫面
      ├── context/           # 跨頁面狀態（AuthProvider）
      ├── hooks/             # Custom React hooks
      │   ├── use-auth.ts    # 讀取登入狀態與登入／註冊／登出
      │   ├── use-profile.ts # 讀取自己的暱稱
      │   ├── use-pwa-install.ts      # 安裝成 App 的狀態
      │   ├── use-service-worker.ts   # 註冊 Service Worker（可安裝性）
      │   ├── use-records.ts # 紀錄 CRUD（React Query）
      │   └── use-theme.ts   # 主題狀態（寫入 <html data-theme>）
      ├── i18n/              # i18n runtime: config.ts (entry) + util.ts (helpers)
      ├── integrations/      # Enter Cloud 連線產生的用戶端（請勿手動編輯）
      ├── lib/               # Utility functions and libraries
      │   ├── backend.ts         # 後端連線唯一入口（可用 index.html 的設定改接自己的後端）
      │   ├── records.ts         # 紀錄資料存取（資料庫查詢）
      │   ├── record-types.ts    # 紀錄模型
      │   ├── profiles.ts        # 使用者暱稱查詢
      │   ├── export-records.ts  # 匯出備份檔
      │   ├── photo-storage.ts   # 照片上傳
      │   ├── date-utils.ts      # 中文日期工具
      │   ├── shoot-types.ts     # 拍攝類型與配色
      │   ├── themes.ts          # 主題中繼資料
      │   └── auth-errors.ts     # 帳號錯誤訊息對應
      ├── pages/             # Application pages (each page in its own subdirectory)
      │   ├── login/         # 登入／註冊
      │   └── records/       # 我的紀錄（月曆／照片牆／統計／年度回憶）
      ├── App.tsx            # Main app component, sets up route providers
      ├── router.tsx         # Router config, sets up routing
      ├── main.tsx           # Entry point for the React app
      └── index.css          # 三主題設計 token 與共用樣式
  ├── package.json           # Project metadata and scripts
  ├── tailwind.config.ts     # Tailwind CSS configuration
  └── ...                    # Other config and lock files
```

> Backend-handoff temporary files (`scripts/`, `i18n.scan.json`, `reports/i18n/`, `docs/i18n-*.md`) are kept in the repo only until backend integration of i18n statistics/scan/auto-translate is complete. They are owned by the backend long-term and will be removed once integration lands. Treat them as read-only handoff copies — do not extend them.

## Directory Responsibilities

- **public/**: Static files served directly. Place images, icons, and robots.txt here.
- **public/locales/**: Translation files, one per language (`{code}.json`). Flat dotted keys (e.g. `home.hero.title`); the `fallbackLng` file is the structural source of truth.
- **i18n.config.json**: The lightweight i18n manifest for fallback language, language labels, browser detection aliases, and document direction. Single source of truth for the language list.
- **src/components/**: All UI components.  
  - **ui/**: Contains atomic and composite UI components.  
  - *Group related components into subdirectories if they share a domain or feature (e.g., `form/`, `charts/`).*
- **src/hooks/**: Custom React hooks. Each file should export a single hook focused on one responsibility.
- **src/i18n/**: Two files only.
  - `config.ts` is the runtime entry: imports the manifest via `util.ts`, initializes i18next (HTTP backend, language detector, react binding), syncs `<html lang/dir>`, and re-exports the helpers. Importing this file for its side effect boots i18next.
  - `util.ts` holds pure helpers parsed from the manifest: `fallbackLng`, `supportedLngs`, `languageOptions`, `normalizeLanguage`, `getLanguageDirection`, plus types.
  - Components use the official `useTranslation()` from `react-i18next` directly; there is no project-specific `useT` wrapper.
- **src/lib/**: Utility functions and libraries that are not React components or hooks.
- **src/pages/**: All route-level pages.  
  - *Each page should have its own subdirectory if it contains more than a single file or has related logic/components.*
  - `login/`: 登入與註冊（Email + 密碼），登入成功後轉往 `/`。
  - `records/`: 我的紀錄頁；頁面專屬元件放 `records/components/`（含年度回憶 `year-in-review.tsx` 與照片輪播 `year-in-review-carousel.tsx`），篩選邏輯放 `records/use-record-filters.ts`。
- **src/context/**: 跨頁面共用的狀態。目前只有帳號狀態（`auth-provider.tsx`），由 `hooks/use-auth.ts` 讀取。
- **src/lib/backend.ts**: 後端連線的唯一入口。其他檔案一律從這裡取得 `supabase`，不要直接 import 產生檔。要改接自己的後端時，只改 `index.html` 裡的 `window.__BACKEND__`（見 `migration-kit/README.md`）。照片儲存可用 `photoUploadUrl` 另外指向 Cloudflare R2 的 Worker。
- **src/lib/records.ts**: 紀錄的資料存取層。查詢只會取得登入者自己的資料，隔離由資料庫的 RLS 政策負責，前端不做權限判斷。
- **migration-kit/**: 要把 App 搬到自己後端時用的資料庫結構（`schema.sql`）與步驟說明。
- **src/App.tsx**: Sets up global providers.
- **src/router.tsx**: Sets up routing.
- **src/main.tsx**: Application entry point.

**Important:**
Whenever a new module (such as a component, hook, or utility) or a new page is added or removed, this document **must be updated immediately** to reflect the changes. Keeping this documentation up to date ensures that all collaborators have a clear understanding of the current project structure and its intended organization.

## How to Add New Code

### 1. Adding a New Page

- **Create a subdirectory under `src/pages/` for each new page.**
  - Example: For a "Dashboard" page, create `src/pages/dashboard/`.
- **Place the main page component as `index.tsx` inside the subdirectory.**
- **Add any page-specific components or logic in the same subdirectory.**
- **Register the new route in `src/router.tsx and generate a semantic name.**
  - Example:
    ```tsx
    import Dashboard from "./pages/dashboard";
    // ...
    {
      path: "/dashboard",
      name: 'dashboard',
      element: <Dashboard />
    }
    ```

### 2. Adding a New Component

- **If you are adding a group of related components, create a subdirectory (e.g., `form/`, `charts/`).**
- **If the component is only used by a specific page, place it in that page's subdirectory under `src/pages/`.**
- **Each component should be focused on a single responsibility.**
- **Small files (< 100 lines) are encouraged for a single component.**

### 3. Adding a New Hook

- **Create a new file in `src/hooks/` named after the hook (e.g., `use-feature.ts`).**
- **Each file should export only one hook.**
- **Hooks should be as small and focused as possible.**

### 4. Adding Utilities

- **Add utility functions to `src/lib/`.**
- **Group related utilities in the same file or subdirectory if needed.**

### 5. Adding or Updating Languages

- **Language metadata must go through `i18n.config.json`.**
- **Do not hardcode supported languages, labels, browser detection aliases, or RTL direction lists in `src/i18n/*.ts`.**
- **Locale content lives in `public/locales/{code}.json`** as flat dotted-key JSON; the `fallbackLng` file owns the canonical key set.
- **Runtime code reads the manifest only through `src/i18n/util.ts`.** Adding or removing a language means editing `i18n.config.json` plus the matching `public/locales/{code}.json`; nothing in `src/i18n/` needs to change.
- **Translations are read with the official `useTranslation()` from `react-i18next`.** No custom hook, no cast at call sites.

## Coding Best Practices

- **One module, one responsibility:**  
  Each file (component, hook, utility) should do one thing only.
- **High cohesion, low coupling:**  
  Keep related logic together and avoid unnecessary dependencies between modules.
- **Naming conventions:**  
  - Use `PascalCase` for components and page directories.
  - Use `camelCase` for hooks and utility functions.
  - Name page subdirectories and files after their route or feature.
- **Component structure:**  
  - Keep components small and focused.
  - Extract subcomponents if a component grows too large.
- **Page structure:**  
  - Place all logic, hooks, and components specific to a page in its subdirectory.
  - Only share code via `components/`, `hooks/`, or `lib/` if it is truly reusable.
- **Documentation:**  
  - Add comments for complex logic.
  - Document the purpose of each module at the top of the file if not obvious.

## Example: Adding a New "Profile" Page

1. **Create a directory:**  
   `src/pages/profile/`
2. **Add the main page component:**  
   `src/pages/profile/index.tsx`
3. **Add page-specific components:**  
   `src/pages/profile/ProfileHeader.tsx`, `src/pages/profile/ProfileDetails.tsx`
4. **Register the route in `App.tsx`:**
   ```tsx
   import Profile from "./pages/profile";
   // ...
   <Route path="/profile" element={<Profile />} />
   ```
5. **If you need a reusable button, add it to `src/components/ui/button.tsx`.**
