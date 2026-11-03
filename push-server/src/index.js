/* Finy — serveur de rappels (Cloudflare Worker).
   Il ne connaît que l'adresse push de chaque appareil et les heures où le réveiller : jamais le nom,
   le montant ni la date d'un prélèvement. Le push envoyé est vide ; c'est le service worker de Finy
   qui écrit le texte des rappels à partir des données gardées sur le téléphone. */

// Services de push des navigateurs (Safari, Chrome, Firefox, Edge) : seules adresses acceptées,
// pour que le serveur ne puisse pas servir à appeler n'importe quel site.
const PUSH_HOSTS = ['push.apple.com', 'fcm.googleapis.com', 'push.services.mozilla.com', 'notify.windows.com'];
const DAY = 86400;
const MAX_BODY = 4096;
const MAX_TIMES = 70;            // un réveil par jour au plus, sur deux mois
const MAX_AHEAD = 75 * DAY;
const MIN_SYNC_GAP = 2;          // secondes entre deux synchronisations d'un même appareil
const STALE = 12 * 3600;         // un réveil en retard de plus de 12 h n'est plus envoyé
const FORGET_AFTER = 60 * DAY;   // appareil sans nouvelles depuis 60 jours : oublié
const BATCH = 40;                // envois par passage (limite de 50 sous-requêtes en gratuit)

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) return new Response('Forbidden', { status: 403 });
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    }
    const path = new URL(req.url).pathname;
    try {
      if (req.method === 'GET' && path === '/key') return json({ key: env.VAPID_PUBLIC_KEY }, 200, cors);
      if (req.method === 'POST' && path === '/sync') return json(await sync(env, await readBody(req)), 200, cors);
      if (req.method === 'POST' && path === '/forget') return json(await forget(env, await readBody(req)), 200, cors);
      return json({ error: 'not found' }, 404, cors);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
      console.log('erreur', e && e.message);
      return json({ error: 'server' }, 500, cors);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDue(env));
  }
};

// ---------- Appareils ----------

// Enregistre (ou met à jour) un appareil et remplace la liste de ses réveils.
async function sync(env, body) {
  const { id, token } = credentials(body);
  const endpoint = checkEndpoint(body.endpoint);
  const now = nowSec();
  const times = checkTimes(body.times, now);
  const hash = await sha256(token);

  const row = await env.DB.prepare('SELECT token_hash, updated_at FROM devices WHERE id = ?').bind(id).first();
  if (row) {
    if (!sameHex(row.token_hash, hash)) throw new HttpError(403, 'token');
    if (now - row.updated_at < MIN_SYNC_GAP) throw new HttpError(429, 'too fast');
  } else {
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM devices').first('n');
    if (count >= Number(env.MAX_DEVICES || 20)) throw new HttpError(503, 'full');
  }

  await env.DB.batch([
    // Même adresse push sous un autre identifiant (Finy réinstallée) : l'ancien est oublié.
    env.DB.prepare('DELETE FROM pushes WHERE device_id IN (SELECT id FROM devices WHERE endpoint = ?1 AND id != ?2)').bind(endpoint, id),
    env.DB.prepare('DELETE FROM devices WHERE endpoint = ?1 AND id != ?2').bind(endpoint, id),
    env.DB.prepare('INSERT INTO devices (id, token_hash, endpoint, updated_at) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET endpoint = ?3, updated_at = ?4').bind(id, hash, endpoint, now),
    env.DB.prepare('DELETE FROM pushes WHERE device_id = ?').bind(id),
    ...times.map((t) => env.DB.prepare('INSERT INTO pushes (device_id, at) VALUES (?, ?)').bind(id, t))
  ]);
  return { ok: true, times: times.length };
}

async function forget(env, body) {
  const { id, token } = credentials(body);
  const row = await env.DB.prepare('SELECT token_hash FROM devices WHERE id = ?').bind(id).first();
  if (!row) return { ok: true };
  if (!sameHex(row.token_hash, await sha256(token))) throw new HttpError(403, 'token');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM pushes WHERE device_id = ?').bind(id),
    env.DB.prepare('DELETE FROM devices WHERE id = ?').bind(id)
  ]);
  return { ok: true };
}

// ---------- Envoi (toutes les heures) ----------

async function sendDue(env) {
  const now = nowSec();
  const { results } = await env.DB.prepare(
    'SELECT d.id, d.endpoint FROM devices d WHERE EXISTS (SELECT 1 FROM pushes p WHERE p.device_id = d.id AND p.at <= ?1 AND p.at > ?2) LIMIT ' + BATCH
  ).bind(now, now - STALE).all();

  const sent = [];
  const gone = [];
  if (results.length) {
    const key = await signingKey(env);
    const jwts = new Map();
    await Promise.all(results.map(async (d) => {
      const aud = new URL(d.endpoint).origin;
      if (!jwts.has(aud)) jwts.set(aud, vapidJwt(key, aud, env.VAPID_SUBJECT, now));
      try {
        const res = await fetch(d.endpoint, {
          method: 'POST',
          headers: { TTL: String(STALE), Urgency: 'high', 'Content-Length': '0', Authorization: 'vapid t=' + (await jwts.get(aud)) + ', k=' + env.VAPID_PUBLIC_KEY },
          body: ''
        });
        if (res.status === 404 || res.status === 410) gone.push(d.id);
        else if (res.ok) sent.push(d.id);
        else console.log('push refusé', res.status, aud);
        // Autre erreur : le réveil reste en attente et sera retenté au prochain passage.
      } catch (e) {
        console.log('push échoué', aud, e && e.message);
      }
    }));
  }

  await env.DB.batch([
    ...sent.map((id) => env.DB.prepare('DELETE FROM pushes WHERE device_id = ? AND at <= ?').bind(id, now)),
    // Abonnement push supprimé par le navigateur, ou appareil muet depuis 60 jours : on l'oublie.
    ...gone.map((id) => env.DB.prepare('DELETE FROM pushes WHERE device_id = ?').bind(id)),
    ...gone.map((id) => env.DB.prepare('DELETE FROM devices WHERE id = ?').bind(id)),
    env.DB.prepare('DELETE FROM pushes WHERE device_id IN (SELECT id FROM devices WHERE updated_at < ?)').bind(now - FORGET_AFTER),
    env.DB.prepare('DELETE FROM devices WHERE updated_at < ?').bind(now - FORGET_AFTER),
    env.DB.prepare('DELETE FROM pushes WHERE at <= ?').bind(now - STALE)
  ]);
  console.log('passage', { envoyés: sent.length, oubliés: gone.length, enAttente: results.length - sent.length - gone.length });
}

// ---------- VAPID (signature des envois, RFC 8292) ----------

function signingKey(env) {
  const pub = fromB64url(env.VAPID_PUBLIC_KEY);
  return crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256', d: env.VAPID_PRIVATE_KEY,
    x: toB64url(pub.slice(1, 33)), y: toB64url(pub.slice(33, 65))
  }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

async function vapidJwt(key, aud, sub, now) {
  const part = (o) => toB64url(new TextEncoder().encode(JSON.stringify(o)));
  const unsigned = part({ typ: 'JWT', alg: 'ES256' }) + '.' + part({ aud: aud, exp: now + 12 * 3600, sub: sub });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(unsigned));
  return unsigned + '.' + toB64url(new Uint8Array(sig));
}

// ---------- Vérifications ----------

async function readBody(req) {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'too large');
  let body;
  try { body = JSON.parse(text); } catch (e) { throw new HttpError(400, 'json'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'json');
  return body;
}

// Identifiant (16 octets) et jeton secret (32 octets) tirés au hasard sur le téléphone.
// Le serveur ne garde qu'une empreinte du jeton.
function credentials(body) {
  if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(body.id)) throw new HttpError(400, 'id');
  if (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token)) throw new HttpError(400, 'token');
  return { id: body.id, token: body.token };
}

function checkEndpoint(value) {
  if (typeof value !== 'string' || value.length > 1024) throw new HttpError(400, 'endpoint');
  let url;
  try { url = new URL(value); } catch (e) { throw new HttpError(400, 'endpoint'); }
  const host = url.hostname;
  const known = PUSH_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (url.protocol !== 'https:' || url.port || url.username || url.password || !known) throw new HttpError(400, 'endpoint');
  return url.href;
}

function checkTimes(value, now) {
  if (!Array.isArray(value) || value.length > MAX_TIMES) throw new HttpError(400, 'times');
  const out = new Set();
  value.forEach((t) => {
    if (!Number.isInteger(t) || t < now - DAY || t > now + MAX_AHEAD) throw new HttpError(400, 'times');
    out.add(t);
  });
  return [...out];
}

// ---------- Outils ----------

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status: status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

function nowSec() { return Math.floor(Date.now() / 1000); }

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Comparaison en temps constant : ne laisse pas deviner l'empreinte caractère par caractère.
function sameHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toB64url(bytes) {
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text) {
  const s = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
