/* Service Worker — سكاي موبايل v16 */
const CACHE_NAME = 'sky-mobile-v16';
const RUNTIME_CACHE = 'sky-mobile-runtime-v16';

const PRECACHE_URLS = [
  './', './index.html', './manifest.json', './icon.svg',
  './telecom.html', './telecom.js', './sales-log.js',
  './date-currency.js', './features.js', './purchases-plus.js',
  './receipts-log.js', './advanced-edit.js', './fix-phones.js',
  './balance-msg.js', './numbers-to-words.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n !== CACHE_NAME && n !== RUNTIME_CACHE)
        .map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

// استراتيجية: Network First دائماً — لتجنب الكاش القديم
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.protocol === 'chrome-extension:') return;

  // ملفات محلية → Network Only (بدون كاش)
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./index.html');
          return new Response('غير متاح', { status: 503 });
        });
      })
    );
    return;
  }

  // CDN → Cache First
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});