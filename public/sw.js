// Минимальный service worker: нужен для установки приложения, ничего не кэширует (игра всегда берёт свежую версию и данные с сервера).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
