// 更新したら CACHE の番号を上げる
const CACHE = "pixel-lab-v5";
const FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  // 自分の古いキャッシュだけ消す（AI本体のキャッシュは残す）
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("pixel-lab-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === location.origin;
  const cdn = /(^|\.)(gstatic\.com|googleapis\.com)$/.test(url.hostname);
  if (!same && !cdn) return; // AI本体（huggingface）はライブラリ側が保存する
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./", c)); return r; })
      .catch(() => caches.match("./").then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return r;
  })));
});
