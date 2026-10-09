/*
 * 極簡 Service Worker。
 *
 * 它不做任何快取、也不攔截任何請求（fetch 事件留空），唯一目的是讓 Chrome／Edge
 * 把這個網站視為「可安裝的 App」，並且讓已安裝的 App 開啟時更快進入畫面。
 * 因為完全沒有快取，不會有內容過期的問題。
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// 空的 fetch 處理器：不攔截、不快取
self.addEventListener("fetch", () => {});
