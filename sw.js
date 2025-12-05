const CACHE_NAME = 'site-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',  // Укажите здесь ваши реальные файлы стилей
  '/script.js',  // Укажите ваши скрипты
  '/192.png',
  '/512.png'
];

// Установка: кешируем файлы
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Работа: отдаем из кеша, если нет интернета
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});