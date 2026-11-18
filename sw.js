// 作品集 App：離線瀏覽
// 網頁：先連網取最新版，連不上時用上次存下的版本。
// 照片與圖示：看過一次就存起來，之後直接從手機讀取。
// 音樂與影片：不經過這裡，直接連網播放（避免影響拖曳播放進度）。
const VERSION = 'v4';
const PAGES = 'pages-' + VERSION;
const MEDIA = 'media-' + VERSION;
const SHELL = [
  './',
  'river/',
  'wufengang/',
  'camino/',
  'salamanca/',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'og-image-v2.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.(mp3|mp4|webm|ogg|m4a)$/i.test(url.pathname) || req.headers.has('range')) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./')))
    );
    return;
  }

  if (/\.(jpe?g|png|webp|gif|svg)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(MEDIA).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});
