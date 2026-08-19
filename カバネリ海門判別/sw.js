const CACHE = "kabaneri-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest"];
const TIMEOUT = 3000;

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 通信優先。3秒で応答がなければキャッシュを返す。
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    Promise.race([
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT))
    ]).catch(() =>
      caches.match(e.request).then(hit => hit || caches.match("./index.html"))
    )
  );
});
