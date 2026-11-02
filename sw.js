/* Finy — service worker : garde l'app disponible hors ligne. */
var CACHE = 'finy-v28';
var LOGOS = 'finy-logos';
var SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'vendor/pdfjs/pdf.min.js',
  'vendor/pdfjs/pdf.worker.min.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== LOGOS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Réseau d'abord pour les fichiers de l'app (les mises à jour arrivent tout de suite),
// cache en secours quand il n'y a pas de connexion.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  // Logos des abonnements : demandés une seule fois à DuckDuckGo, puis gardés sur l'appareil.
  if (new URL(e.request.url).hostname === 'icons.duckduckgo.com') {
    e.respondWith(caches.open(LOGOS).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          if (res.ok || res.type === 'opaque') c.put(e.request, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  var network = fetch(e.request).then(function (res) {
    if (res.ok && (new URL(e.request.url).origin === location.origin || e.request.url.indexOf('fonts.g') >= 0)) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  });
  e.waitUntil(network.catch(function () {}));

  // Si le réseau traîne plus de 2 s, on sert la copie en cache pour ne pas bloquer l'ouverture ;
  // la réponse du réseau, quand elle arrive, met quand même le cache à jour.
  e.respondWith(new Promise(function (resolve) {
    var answered = false;
    function answer(res) { if (!answered) { answered = true; resolve(res); } }
    var timer = setTimeout(function () {
      caches.match(e.request).then(function (hit) { if (hit) answer(hit); });
    }, 2000);
    network.then(function (res) {
      clearTimeout(timer);
      answer(res);
    }, function () {
      clearTimeout(timer);
      answer(caches.match(e.request).then(function (hit) { return hit || caches.match('index.html'); }));
    });
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (list) {
    for (var i = 0; i < list.length; i++) if ('focus' in list[i]) return list[i].focus();
    return self.clients.openWindow('./#/calendrier');
  }));
});
