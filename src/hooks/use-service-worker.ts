import { useEffect } from "react";

/**
 * 註冊 Service Worker，讓瀏覽器把網站視為可安裝的 App（見 public/sw.js）。
 *
 * 只在最上層視窗註冊：預覽環境是 iframe，不需要也不該在那裡註冊。
 * 註冊路徑跟著建置的 base 走，部署在子路徑（例如 GitHub Pages）也能正常運作。
 * 註冊失敗（例如環境不支援）不會影響網站運作，所以直接忽略錯誤。
 */
export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    try {
      // 在 iframe（預覽環境）裡不註冊
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* 忽略：不支援的環境照常運作 */
    });
  }, []);
}
