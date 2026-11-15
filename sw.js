// Service Worker: hält die App offline verfügbar.
// Kurse speichert die App selbst im Gerätespeicher (localStorage).
const CACHE = "waehrungsrechner-v3";
const OCR_CACHE = "wr-ocr-v1"; // Texterkennung (groß, wird von der Seite selbst befüllt)
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./assets/toyota-ellipse-grey.png", "./assets/toyota-ellipse-white.png", "./assets/gr-yaris.webp",
  "./fonts/ToyotaType-Light.woff2", "./fonts/ToyotaType-Book.woff2", "./fonts/ToyotaType-Regular.woff2", "./fonts/ToyotaType-Semibold.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== OCR_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // Kurs- und Standort-APIs direkt durchlassen
  // Texterkennungs-Dateien: zuerst aus dem Speicher (groß, ändern sich nicht)
  if (url.pathname.includes("/ocr/")) {
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(OCR_CACHE).then(c => c.put(e.request, copy)); }
      return res;
    })));
    return;
  }
  // App-Dateien: Netzwerk zuerst (für Updates), offline aus dem Speicher
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
