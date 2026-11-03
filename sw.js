/* Finy — service worker : garde l'app disponible hors ligne. */
var CACHE = 'finy-v31';
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

  // Le reste d'internet (serveur de rappels…) passe sans cache : seuls l'app et ses polices sont gardées.
  var url = new URL(e.request.url);
  if (url.origin !== location.origin && url.hostname.indexOf('fonts.g') !== 0) return;

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

// Rappels en arrière-plan : le serveur envoie un réveil vide à l'heure prévue, et le texte vient
// de ce que Finy a rangé dans IndexedDB (clé « plan »). Les rappels affichés sont notés dans
// « shown » pour que Finy ne les renvoie pas à l'ouverture.
function kv(mode, fn) {
  return new Promise(function (resolve, reject) {
    var open = indexedDB.open('finy', 1);
    open.onupgradeneeded = function () { open.result.createObjectStore('kv'); };
    open.onerror = function () { reject(open.error); };
    open.onsuccess = function () {
      var db = open.result;
      var tx = db.transaction('kv', mode);
      var req = fn(tx.objectStore('kv'));
      tx.oncomplete = function () { db.close(); resolve(req && req.result); };
      tx.onerror = tx.onabort = function () { db.close(); reject(tx.error); };
    };
  });
}

function isoDay(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

self.addEventListener('push', function (e) {
  var day = isoDay(new Date());
  var opts = function (n) { return { body: n.body, tag: n.key, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }; };
  e.waitUntil(Promise.all([
    kv('readonly', function (st) { return st.get('plan'); }),
    kv('readonly', function (st) { return st.get('shown'); })
  ]).then(function (got) {
    var plan = got[0] || {};
    var shown = got[1] || {};
    var list = (plan.days && plan.days[day]) || [];
    var done = plan.notified || {};
    var fresh = list.filter(function (n) { return !done[n.key] && !shown[n.key]; });
    fresh.forEach(function (n) { shown[n.key] = day; });
    var limit = isoDay(new Date(Date.now() - 40 * 86400000));
    Object.keys(shown).forEach(function (k) { if (shown[k] < limit) delete shown[k]; });
    // Un réveil doit toujours afficher quelque chose (sinon Safari coupe l'abonnement) : sans rappel
    // nouveau, on remontre ceux du jour (même `tag`, ils se remplacent), ou un message neutre.
    var show = fresh.length ? fresh : list;
    if (!show.length) show = [{ key: 'finy-push', title: 'Finy', body: 'Ouvre Finy pour voir tes prochains prélèvements.' }];
    return kv('readwrite', function (st) { return st.put(shown, 'shown'); }).catch(function () {}).then(function () {
      return Promise.all(show.map(function (n) { return self.registration.showNotification(n.title, opts(n)); }));
    });
  }).catch(function () {
    return self.registration.showNotification('Finy', opts({ key: 'finy-push', body: 'Un prélèvement arrive bientôt. Ouvre Finy pour le voir.' }));
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(function (list) {
    for (var i = 0; i < list.length; i++) if ('focus' in list[i]) return list[i].focus();
    return self.clients.openWindow('./#/calendrier');
  }));
});
