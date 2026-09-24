/* ============================================================
   🔄 Service Worker — سكاي موبايل
   يخزّن الملفات للعمل بدون إنترنت
   ============================================================ */

const CACHE_NAME = 'sky-mobile-v15';
const RUNTIME_CACHE = 'sky-mobile-runtime-v15';

// الملفات الأساسية
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './telecom.html',
  './telecom.js',
  './sales-log.js',
  './date-currency.js',
  './features.js'
];

// ═══ التثبيت ═══
self.addEventListener('install', event => {
  console.log('🔄 تثبيت Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 تخزين الملفات الأساسية');
        return Promise.allSettled(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(err => console.warn('⚠️ فشل تخزين:', url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ═══ التفعيل ═══
self.addEventListener('activate', event => {
  console.log('✅ تفعيل Service Worker');
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => {
            console.log('🗑️ حذف كاش قديم:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ═══ اعتراض الطلبات ═══
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // ⚠️ تجاهل الطلبات غير GET
  if (request.method !== 'GET') return;

  // ⚠️ لا تخزن Supabase (يجب أن يكون اتصالاً مباشراً)
  if (url.hostname.includes('supabase.co')) return;

  // ⚠️ تجاهل chrome-extension
  if (url.protocol === 'chrome-extension:') return;

  // ═══ استراتيجية للملفات المحلية ═══
  if (url.origin === location.origin) {
    event.respondWith(
      // Network First: جرب الشبكة أولاً، ثم الكاش
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // فشل الاتصال — ارجع للكاش
          return caches.match(request).then(cached => {
            if (cached) return cached;
            // للصفحات، ارجع index.html
            if (request.mode === 'navigate') return caches.match('./index.html');
            return new Response('غير متاح بدون إنترنت', { status: 503 });
          });
        })
    );
    return;
  }

  // ═══ استراتيجية للملفات الخارجية (CDN) ═══
  // Cache First: الكاش أولاً
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => new Response('', { status: 503 }));
    })
  );
});

// ═══ رسائل من الصفحة ═══
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
  }
});

console.log('📱 Service Worker جاهز');