const STATIC_CACHE = "psalm1199-static-v2";
const CHAPTER_CACHE = "psalm1199-chapters-v2";
const MAX_CHAPTERS = 60; // ~5MB at ~80KB/page

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== CHAPTER_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Cache-first for Next.js static assets (content-hashed, safe indefinitely)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirst(e.request, STATIC_CACHE));
    return;
  }

  // Network-first for chapter pages — cache on success, serve cache when offline
  if (url.pathname.startsWith("/bible/") && e.request.mode === "navigate") {
    e.respondWith(networkFirstChapter(e.request));
    return;
  }

  // Network-first for all other navigations
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then((cached) => cached ?? offlineResponse())
      )
    );
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstChapter(request) {
  const cache = await caches.open(CHAPTER_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Evict oldest entry if at capacity
      const keys = await cache.keys();
      if (keys.length >= MAX_CHAPTERS) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineResponse();
  }
}

function offlineResponse() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Offline — Psalm 119:9</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0e0e10; color: #f0ede6;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p  { font-size: 14px; color: #8a8580; line-height: 1.6; margin: 0 0 24px; }
    a  { color: #c9a84c; text-decoration: none; font-size: 13px; }
  </style>
</head>
<body>
  <div>
    <h1>You're offline</h1>
    <p>This chapter hasn't been cached yet.<br>Visit chapters while online to read them offline.</p>
    <a href="javascript:history.back()">← Go back</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
