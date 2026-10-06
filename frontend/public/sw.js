// 攪拌紀錄 — 最小 Service Worker（供「加到主畫面」安裝與離線殼層）
const CACHE = 'stir-diary-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 網路優先，失敗時回退快取（適合開發與線上）
  e.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
