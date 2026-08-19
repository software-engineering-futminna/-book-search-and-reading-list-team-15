const CACHE_NAME = 'booknest-v2';

const SHELL_ASSETS = [
  '/',
  '/static/styles.css',
  '/static/app.js',
  '/static/manifest.json',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  '/static/icons/app-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(SHELL_ASSETS);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Assets that rarely change (icons/images): cache-first is fine and fast.
function isStaticAsset(url) {
  return /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  var url = new URL(req.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isStaticAsset(url)) {
    // Cache-first: images/icons don't change, so serve from cache and
    // fill the cache on first fetch.
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  // Network-first: HTML/CSS/JS should always be fresh when online, so a
  // fixed deploy actually reaches the user instead of hiding behind a
  // stale cache. Offline (or on network failure) falls back to cache.
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('/');
      });
    })
  );
});
