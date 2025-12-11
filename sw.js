const CACHE_NAME = 'site-v4'; // Поменяли версию, чтобы обновить кэш у пользователей
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/192.png',
  '/512.png',
  '/bpV.png', // Добавили вертикальный фон
  '/bpH.png'  // Добавили горизонтальный фон
];

// 1. УСТАНОВКА: кешируем статику (оболочку сайта)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Заставляет новый Service Worker активироваться сразу
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. АКТИВАЦИЯ: удаляем старый кэш (от v1), чтобы не занимал место
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// 3. РАБОТА: умная стратегия запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // А) ИГНОРИРУЕМ API (База данных всегда должна быть свежей)
  // Если запрос идет к jsonblob или прокси — не кэшируем его
  if (url.href.includes('jsonblob.com') || url.href.includes('corsproxy.io')) {
    return; // Браузер сам сходит в сеть
  }

  // Б) КАРТИНКИ АНИМЕ (Imgur и прочие) — сохраняем их "на лету"
  if (event.request.destination === 'image' || url.href.includes('imgur')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Если картинка уже есть в кэше — отдаем её (быстро и без интернета)
          if (cachedResponse) return cachedResponse;

          // Если нет — качаем из сети, кладем копию в кэш и отдаем пользователю
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // В) ОСТАЛЬНОЕ (HTML, CSS, JS) — как и раньше: сначала кэш, потом сеть
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});