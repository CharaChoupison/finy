/* Finy — web app. Toutes les données restent dans le navigateur (localStorage). */
(function () {
  'use strict';

  // ---------- Constantes ----------

  var STORE_KEY = 'finy:v1';
  var SUB_CATEGORIES = ['Streaming', 'Logiciels', 'Téléphonie', 'Sport', 'Jeux', 'Transport', 'Maison', 'Autre'];
  var CAT_PALETTE = ['var(--chart-3)', 'var(--chart-4)', 'var(--ink)', 'var(--muted)'];
  var SUB_PALETTE = ['var(--accent)', 'var(--chart-3)', 'var(--chart-4)', 'var(--ink)'];

  var ICON = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    wallet: 'M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7zM3 7l2.5-3h11L18 7M16 14h1',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM16.5 13v7M13 16.5h7',
    bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 0 0 0-14zM20 20l-3.5-3.5',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    user: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
    refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
    close: 'M6 6l12 12M18 6L6 18',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    sliders: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4'
  };

  function icon(name, cls) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + ICON[name] + '"/></svg>';
  }

  var LOGO = '<svg viewBox="18 26 64 49" aria-hidden="true"><rect x="18" y="26" width="64" height="13" rx="6.5" fill="var(--accent)"/><rect x="18" y="44" width="46" height="13" rx="6.5" fill="var(--ink)"/><rect x="18" y="62" width="28" height="13" rx="6.5" fill="var(--chart-2)"/></svg>';

  // ---------- Données ----------

  function defaults() {
    return {
      v: 1,
      profile: { name: '', photo: null },
      salary: 0,
      savings: 0,
      categories: [],
      subs: [],
      goals: [],
      incomes: [],
      expenses: [],
      history: {},
      meta: { since: null, lastExport: null, backupSnooze: null },
      settings: {
        theme: 'system',
        homeCount: 3,
        annualMode: 'actual',
        alertDays: 5,
        reminders: { enabled: false, daysBefore: 3, sameDay: true }
      },
      notified: {}
    };
  }

  function merge(base, data) {
    var out = defaults();
    if (!data || typeof data !== 'object') return out;
    var num = function (v, d) { return typeof v === 'number' && isFinite(v) ? v : d; };
    out.profile.name = typeof (data.profile || {}).name === 'string' ? data.profile.name.slice(0, 40) : '';
    out.profile.photo = isImageData((data.profile || {}).photo) ? data.profile.photo : null;
    out.salary = Math.max(0, num(data.salary, 0));
    out.savings = Math.max(0, num(data.savings, 0));
    out.categories = Array.isArray(data.categories) ? data.categories.filter(function (c) {
      return c && typeof c.name === 'string' && typeof c.amount === 'number';
    }).map(function (c) {
      return { id: String(c.id || uid()), name: c.name.slice(0, 40), amount: Math.max(0, c.amount) };
    }) : [];
    out.subs = Array.isArray(data.subs) ? data.subs.filter(function (s) {
      return s && typeof s.name === 'string' && typeof s.amount === 'number';
    }).map(function (s) {
      return {
        id: String(s.id || uid()),
        name: s.name.slice(0, 60),
        amount: Math.max(0, s.amount),
        day: Math.min(31, Math.max(1, Math.round(num(s.day, 1)))),
        frequency: s.frequency === 'year' ? 'year' : 'month',
        month: Math.min(11, Math.max(0, Math.round(num(s.month, new Date().getMonth())))),
        category: typeof s.category === 'string' && s.category ? s.category.slice(0, 30) : 'Autre',
        site: typeof s.site === 'string' ? (normalizeSite(s.site) || '') : '',
        image: isImageData(s.image) ? s.image : null,
        trialEnd: isIsoDate(s.trialEnd) ? s.trialEnd : '',
        paused: s.paused === true
      };
    }) : [];
    out.goals = Array.isArray(data.goals) ? data.goals.filter(function (g) {
      return g && typeof g.name === 'string' && typeof g.target === 'number';
    }).map(function (g) {
      return {
        id: String(g.id || uid()),
        name: g.name.slice(0, 40),
        target: Math.max(0, g.target),
        saved: Math.max(0, num(g.saved, 0)),
        months: Math.min(600, Math.max(1, Math.round(num(g.months, 12)))),
        start: isMonthKey(g.start) ? g.start : monthKey(new Date()),
        deposits: Array.isArray(g.deposits) ? g.deposits.filter(function (d) {
          return d && isMonthKey(d.m) && typeof d.amount === 'number' && d.amount > 0;
        }).map(function (d) { return { m: d.m, amount: d.amount }; }) : []
      };
    }) : [];
    out.incomes = Array.isArray(data.incomes) ? data.incomes.filter(function (i) {
      return i && typeof i.name === 'string' && typeof i.amount === 'number' && isMonthKey(i.month);
    }).map(function (i) {
      return { id: String(i.id || uid()), name: i.name.slice(0, 40), amount: Math.max(0, i.amount), month: i.month };
    }) : [];
    out.expenses = Array.isArray(data.expenses) ? data.expenses.filter(function (x) {
      return x && typeof x.cat === 'string' && typeof x.amount === 'number' && x.amount > 0 && isIsoDate(x.date);
    }).map(function (x) {
      return { id: String(x.id || uid()), cat: x.cat, amount: x.amount, date: x.date, note: typeof x.note === 'string' ? x.note.slice(0, 60) : '' };
    }) : [];
    if (data.history && typeof data.history === 'object') {
      Object.keys(data.history).forEach(function (k) {
        var h = data.history[k];
        if (!isMonthKey(k) || !h || typeof h !== 'object') return;
        out.history[k] = { income: num(h.income, 0), saved: num(h.saved, 0), subs: num(h.subs, 0), cats: num(h.cats, 0), free: num(h.free, 0) };
      });
    }
    var meta = data.meta || {};
    ['since', 'lastExport', 'backupSnooze'].forEach(function (k) { out.meta[k] = isIsoDate(meta[k]) ? meta[k] : null; });
    var st = data.settings || {};
    out.settings.theme = ['system', 'light', 'dark'].indexOf(st.theme) >= 0 ? st.theme : 'system';
    out.settings.homeCount = st.homeCount === 5 ? 5 : 3;
    out.settings.annualMode = st.annualMode === 'smooth' ? 'smooth' : 'actual';
    out.settings.alertDays = Math.min(30, Math.max(1, Math.round(num(st.alertDays, 5))));
    var r = st.reminders || {};
    out.settings.reminders.enabled = r.enabled === true;
    out.settings.reminders.daysBefore = Math.min(30, Math.max(1, Math.round(num(r.daysBefore, 3))));
    out.settings.reminders.sameDay = r.sameDay !== false;
    out.notified = data.notified && typeof data.notified === 'object' ? data.notified : {};
    return out;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? merge(defaults(), JSON.parse(raw)) : defaults();
    } catch (e) {
      return defaults();
    }
  }

  function save() {
    if (!state.meta.since) state.meta.since = iso(today());
    snapshot();
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      toast("Impossible d'enregistrer sur cet appareil");
    }
  }

  function isIsoDate(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }

  function isMonthKey(v) { return typeof v === 'string' && /^\d{4}-\d{2}$/.test(v); }

  // Garde une photo du mois en cours (les mois passés restent figés), et oublie ce qui a plus de trois ans.
  function snapshot() {
    var t = today();
    if (state.salary > 0) {
      var tt = totals();
      var r = function (n) { return Math.round(n * 100) / 100; };
      state.history[monthKey(t)] = { income: r(tt.income), saved: r(state.savings + tt.goals), subs: r(tt.subs), cats: r(tt.cats), free: r(tt.free) };
    }
    var oldest = monthKey(new Date(t.getFullYear() - 3, t.getMonth(), 1));
    Object.keys(state.history).forEach(function (k) { if (k < oldest) delete state.history[k]; });
    var oldDay = iso(new Date(t.getFullYear() - 1, t.getMonth() - 1, 1));
    state.expenses = state.expenses.filter(function (x) { return x.date >= oldDay; });
    state.incomes = state.incomes.filter(function (i) { return i.month >= oldDay.slice(0, 7); });
  }

  // Seules les images recadrées par Finy (JPEG ou PNG en base64) sont acceptées.
  function isImageData(v) {
    return typeof v === 'string' && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 200000;
  }

  // « https://www.Netflix.com/fr » → « netflix.com ». Renvoie null si ce n'est pas un nom de site.
  function normalizeSite(input) {
    var s = String(input || '').trim().toLowerCase()
      .replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[/?#:]/)[0];
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) && s.length <= 100 ? s : null;
  }

  // Icône du site via DuckDuckGo : seul le nom du site est envoyé.
  function logoUrl(site) {
    return 'https://icons.duckduckgo.com/ip3/' + encodeURIComponent(site) + '.ico';
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var state = load();
  var ui = { abosFilter: 'Tous', abosQuery: '', calOffset: 0, calSel: null, focusAfter: null, counts: {} };

  // ---------- Format ----------

  var money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  var shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  var longDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  var monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

  function euro(n) { return money.format(n); }

  function heroParts(n) {
    var s = euro(n);
    var i = s.lastIndexOf(',');
    return i < 0 ? { int: s, dec: '' } : { int: s.slice(0, i), dec: s.slice(i) };
  }

  function plain(n) { return n.toFixed(2).replace('.', ','); }

  function parseAmount(str) {
    if (typeof str !== 'string') return null;
    var clean = str.replace(/[\s  €]/g, '').replace(',', '.');
    if (clean === '' || !/^\d*\.?\d*$/.test(clean)) return null;
    var n = parseFloat(clean);
    return isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function initial(name) { return esc((name.trim().charAt(0) || '?').toUpperCase()); }

  // ---------- Dates ----------

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function daysIn(y, m) { return new Date(y, m + 1, 0).getDate(); }

  function onDay(y, m, day) { return new Date(y, m, Math.min(day, daysIn(y, m))); }

  function diffDays(a, b) { return Math.round((a - b) / 86400000); }

  function parseIso(s) { return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }

  // Essai gratuit en cours : rien n'est prélevé avant la fin de l'essai.
  function inTrial(s) { return !!s.trialEnd && parseIso(s.trialEnd) > today(); }

  // Prochain prélèvement d'un abonnement à partir d'une date (mensuel ou annuel), après l'essai gratuit.
  function nextDate(s, from) {
    if (s.trialEnd && parseIso(s.trialEnd) > from) from = parseIso(s.trialEnd);
    var y = from.getFullYear();
    if (s.frequency === 'year') {
      var a = onDay(y, s.month, s.day);
      return a < from ? onDay(y + 1, s.month, s.day) : a;
    }
    var d = onDay(y, from.getMonth(), s.day);
    return d < from ? onDay(y, from.getMonth() + 1, s.day) : d;
  }

  // Date du prélèvement pendant ce mois, ou null (pas ce mois-ci, en pause ou encore en essai).
  function chargeIn(s, y, m) {
    if (s.paused || (s.frequency === 'year' && s.month !== m)) return null;
    var d = onDay(y, m, s.day);
    return s.trialEnd && d < parseIso(s.trialEnd) ? null : d;
  }

  // Coût compté pour le mois en cours, selon le réglage :
  // « actual » = ce qui est vraiment prélevé ce mois-ci, « smooth » = annuels lissés sur 12 mois.
  function costThisMonth(s) {
    var t = today();
    if (s.paused) return 0;
    if (s.frequency === 'year' && state.settings.annualMode === 'smooth') {
      return s.trialEnd && parseIso(s.trialEnd) > onDay(t.getFullYear(), t.getMonth(), 31) ? 0 : s.amount / 12;
    }
    return chargeIn(s, t.getFullYear(), t.getMonth()) ? s.amount : 0;
  }

  function yearTotal() {
    return state.subs.reduce(function (a, s) { return a + (s.paused ? 0 : s.frequency === 'year' ? s.amount : s.amount * 12); }, 0);
  }

  // Prochain abonnement annuel qui ne tombe pas ce mois-ci (pour prévenir à l'avance).
  function nextYearly() {
    var t = today();
    return upcoming().filter(function (u) { return u.sub.frequency === 'year' && u.date.getMonth() !== t.getMonth(); })[0] || null;
  }

  function priceLabel(s) {
    return euro(s.amount) + (s.frequency === 'year' ? '<small class="per">/an</small>' : '');
  }

  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function relative(diff) {
    if (diff < 0) return 'Déjà prélevé';
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    return 'Dans ' + diff + ' j';
  }

  function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

  // ---------- Calculs ----------

  // Objectif d'épargne : la durée part du mois où il a été créé (ou modifié pour la dernière fois).
  // Le montant du mois est calculé sur ce qui était de côté au début du mois : un versement ne le fait pas baisser.
  function goalPlan(g) {
    var t = today();
    var y = parseInt(g.start.slice(0, 4), 10);
    var m = parseInt(g.start.slice(5, 7), 10) - 1;
    var elapsed = (t.getFullYear() - y) * 12 + (t.getMonth() - m);
    var left = Math.max(1, g.months - Math.max(0, elapsed));
    var k = monthKey(t);
    var paid = g.deposits.reduce(function (a, d) { return a + (d.m === k ? d.amount : 0); }, 0);
    var before = Math.max(0, g.saved - paid);
    var missing = Math.max(0, g.target - before);
    var monthly = missing > 0 ? Math.ceil(missing / left * 100) / 100 : 0;
    return {
      left: left,
      missing: Math.max(0, g.target - g.saved),
      done: g.saved >= g.target,
      monthly: monthly,
      paid: paid,
      toGo: Math.max(0, Math.min(monthly - paid, g.target - g.saved)),
      progress: g.target > 0 ? Math.min(1, g.saved / g.target) : 1,
      end: new Date(y, m + g.months, 1)
    };
  }

  function goalsMonthly() {
    return state.goals.reduce(function (a, g) { return a + goalPlan(g).monthly; }, 0);
  }

  function durationLabel(months) {
    if (months % 12 === 0) return months / 12 + (months === 12 ? ' an' : ' ans');
    return months + ' mois';
  }

  // Revenus en plus du salaire (prime, remboursement…), pour le mois en cours seulement.
  function extrasThisMonth() {
    var k = monthKey(today());
    return state.incomes.filter(function (i) { return i.month === k; });
  }

  // Ce qui a été dépensé ce mois-ci dans une catégorie.
  function spentIn(catId) {
    var k = monthKey(today());
    return state.expenses.reduce(function (a, x) { return a + (x.cat === catId && x.date.slice(0, 7) === k ? x.amount : 0); }, 0);
  }

  // Une catégorie réserve son budget ; si on le dépasse, le dépassement est retiré aussi.
  function catCost(c) { return Math.max(c.amount, spentIn(c.id)); }

  // `o` permet de simuler un autre salaire, une autre épargne ou d'autres abonnements (mode « Et si… »).
  function totals(o) {
    o = o || {};
    var salary = o.salary != null ? o.salary : state.salary;
    var savings = o.savings != null ? o.savings : state.savings;
    var extras = extrasThisMonth().reduce(function (a, i) { return a + i.amount; }, 0);
    var subs = (o.subs || state.subs).reduce(function (a, s) { return a + costThisMonth(s); }, 0);
    var cats = state.categories.reduce(function (a, c) { return a + catCost(c); }, 0);
    var goals = goalsMonthly();
    var income = salary + extras;
    var rest = income - savings - goals - subs;
    var free = rest - cats;
    // Ce qui est vraiment libre (catégories déjà réservées), réparti sur les jours du mois en cours.
    var t = today();
    return { income: income, extras: extras, subs: subs, cats: cats, goals: goals, rest: rest, free: free, weekly: Math.max(0, free) * 7 / daysIn(t.getFullYear(), t.getMonth()) };
  }

  function yearlyCount() {
    return state.subs.filter(function (s) { return s.frequency === 'year' && !s.paused; }).length;
  }

  // Les abonnements en pause n'ont pas de date : ils passent en fin de liste, seulement si on les demande.
  function upcoming(withPaused) {
    var t = today();
    return state.subs.filter(function (s) { return withPaused || !s.paused; }).map(function (s) {
      if (s.paused) return { sub: s, date: null, diff: Infinity };
      var d = nextDate(s, t);
      return { sub: s, date: d, diff: diffDays(d, t) };
    }).sort(function (a, b) { return a.diff - b.diff || a.sub.name.localeCompare(b.sub.name); });
  }

  // ---------- Morceaux d'interface ----------

  function metaLine(diff, extra) {
    var soon = diff >= 0 && diff <= state.settings.alertDays;
    return '<span class="row-meta">' +
      (soon ? '<span class="soon-dot" aria-hidden="true"></span><span class="soon">' + relative(diff) + '</span><span aria-hidden="true">·</span>' : '') +
      '<span>' + extra + '</span></span>';
  }

  function subRow(u, showCategory) {
    var s = u.sub;
    var when = s.paused ? 'En pause' : inTrial(s) ? 'Essai jusqu\'au ' + shortDate.format(parseIso(s.trialEnd)) : shortDate.format(u.date);
    var extra = (showCategory ? esc(s.category) + ' · ' : '') + when +
      (!s.paused && s.frequency === 'year' && state.settings.annualMode === 'smooth' ? ' · ≈ ' + euro(s.amount / 12) + '/mois' : '');
    return '<button type="button" class="row tall' + (s.paused ? ' paused' : '') + '" data-action="edit-sub" data-id="' + esc(s.id) + '">' +
      subTile(s) +
      '<span class="row-main"><span class="row-title">' + esc(s.name) + '</span>' + metaLine(u.diff, extra) + '</span>' +
      '<span class="row-amount">' + priceLabel(s) + '</span></button>';
  }

  // Priorité : image choisie, puis logo du site, puis initiale.
  function subTile(s, extraClass) {
    var cls = 'tile' + (extraClass ? ' ' + extraClass : '');
    var letter = initial(s.name || '?');
    if (s.image) return '<span class="' + cls + ' tile-photo" aria-hidden="true"><img src="' + esc(s.image) + '" alt=""></span>';
    if (s.site) return '<span class="' + cls + ' tile-logo" aria-hidden="true" data-initial="' + letter + '"><img src="' + esc(logoUrl(s.site)) + '" alt="" referrerpolicy="no-referrer" loading="lazy"></span>';
    return '<span class="' + cls + '" aria-hidden="true">' + letter + '</span>';
  }

  function splitBar(parts, label) {
    var total = parts.reduce(function (a, p) { return a + Math.max(0, p.value); }, 0);
    if (total <= 0) return '';
    return '<div class="split" role="img" aria-label="' + esc(label) + '">' + parts.filter(function (p) { return p.value > 0; }).map(function (p) {
      return '<span style="--c:' + p.color + ';width:' + (p.value / total * 100).toFixed(2) + '%"></span>';
    }).join('') + '</div>';
  }

  function avatarInner() {
    if (state.profile.photo) return '<img src="' + esc(state.profile.photo) + '" alt="">';
    if (state.profile.name.trim()) return initial(state.profile.name);
    return icon('user');
  }

  // `key` identifie le montant pour l'animer depuis sa valeur précédente.
  function hero(n, key) {
    var p = heroParts(n);
    return '<p class="amount-hero' + (n < 0 ? ' negative' : '') + '"' + (key ? ' data-count="' + key + '" data-value="' + n + '"' : '') + '><span class="int">' + p.int + '</span><span class="dec">' + p.dec + '</span></p>';
  }

  // ---------- Animations ----------

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Fait défiler les montants marqués data-count de leur ancienne valeur à la nouvelle.
  function runCounters(root) {
    (root || document).querySelectorAll('[data-count]').forEach(function (el) {
      var key = el.dataset.count;
      var to = parseFloat(el.dataset.value);
      var from = key in ui.counts ? ui.counts[key] : 0;
      ui.counts[key] = to;
      if (reduceMotion || !isFinite(to) || Math.abs(from - to) < 0.005) return;
      var paint = el.dataset.kind === 'big'
        ? function (v) { el.textContent = euro(v); }
        : function (v) { var q = heroParts(v); el.innerHTML = '<span class="int">' + q.int + '</span><span class="dec">' + q.dec + '</span>'; };
      var start = performance.now();
      var dur = 650;
      var done = false;
      var token = (el._countToken || 0) + 1;
      el._countToken = token;
      paint(from);
      (function step(now) {
        if (done || el._countToken !== token) return;
        var k = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        paint(k < 1 ? from + (to - from) * eased : to);
        if (k < 1) requestAnimationFrame(step); else done = true;
      })(start);
      // Sécurité : si l'animation est mise en pause (app en arrière-plan), le bon montant s'affiche quand même.
      setTimeout(function () {
        if (!done && el._countToken === token) { done = true; paint(to); }
      }, dur + 80);
    });
  }

  // Rejoue une animation CSS d'arrivée sur un élément.
  function playEnter(el, cls) {
    if (!el || reduceMotion) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    clearTimeout(el._enterTimer);
    el._enterTimer = setTimeout(function () { el.classList.remove(cls); }, 900);
  }

  // Laisse l'interrupteur glisser avant de redessiner l'écran.
  function flipSwitch(el, then) {
    if (el) el.setAttribute('aria-checked', String(el.getAttribute('aria-checked') !== 'true'));
    setTimeout(then, reduceMotion ? 0 : 200);
  }

  // ---------- Écran : Accueil ----------

  function viewHome() {
    var t = totals();
    var html = '<header class="topbar a-top"><span class="logo">' + LOGO + 'finy</span>' +
      '<a href="#/reglages" class="icon-btn" aria-label="Ouvrir les réglages">' + avatarInner() + '</a></header>';

    if (state.salary <= 0) {
      html += '<section class="hero a-hero"><p class="label">Bienvenue' + (state.profile.name ? ' ' + esc(state.profile.name) : '') + '</p>' +
        '<h1 class="title">Commence par ton salaire</h1>' +
        '<p class="muted">Finy calcule ensuite ce qu\'il te reste chaque mois, après ton épargne et tes abonnements.</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="edit-salary" style="margin-top:16px">Indiquer mon salaire</button></section>';
    } else {
      // Le montant mis en avant est ce qui est vraiment libre : catégories comprises.
      html += '<section class="hero a-hero" aria-label="Ce qu\'il te reste"><p class="label">Il te reste ce mois-ci</p>' + hero(t.free, 'free') +
        '<p class="caption">Après ton épargne, tes objectifs, tes abonnements' + (state.categories.length ? ' et tes catégories' : '') + '</p>' +
        '<p class="pill-info"><span class="strong">' + euro(t.weekly) + '</span><span class="muted">pour te faire plaisir cette semaine</span></p>' +
        backupNotice() + '</section>';
    }

    html += '<section class="actions a-actions" aria-label="Actions rapides">' +
      action('add-exp', 'receipt', 'Dépense') + action('add-sub', 'plus', 'Abonnement') +
      action('add-income', 'trend', 'Revenu') + action('whatif', 'sliders', 'Et si…') + '</section>';

    if (state.salary > 0) {
      var parts = [
        { name: 'Épargne', value: state.savings, color: 'var(--accent)', href: '#/epargne' },
        { name: 'Objectifs', value: t.goals, color: 'var(--chart-4)', href: '#/epargne', goals: true },
        { name: 'Abonnements', value: t.subs, color: 'var(--chart-2)', href: '#/abonnements' }
      ];
      if (t.goals <= 0) parts.splice(1, 1);
      state.categories.forEach(function (c, i) {
        parts.push({ name: c.name, value: catCost(c), color: CAT_PALETTE[i % CAT_PALETTE.length], cat: c });
      });
      var bar = parts.concat([{ name: 'Libre', value: Math.max(0, t.free), color: 'var(--border)' }]);
      var aria = bar.filter(function (p) { return p.value > 0; }).map(function (p) { return p.name + ' ' + euro(p.value); }).join(', ');

      html += '<section class="section a-main"><div class="section-head"><h2 class="heading">Répartition</h2>' +
        '<button type="button" class="link-btn label" data-action="edit-salary">' + (t.extras > 0 ? 'Revenus ' + euro(t.income) : 'Salaire ' + euro(state.salary)) + '</button></div>' +
        splitBar(bar, aria) + '<div class="group">' +
        parts.map(function (p) {
          if (p.cat) return catRow(p.cat, p.color);
          var inner = '<span class="dot" style="--c:' + p.color + '" aria-hidden="true"></span><span class="row-main"><span class="row-title">' + esc(p.name) + '</span></span><span class="row-amount">' + euro(p.value) + '</span>';
          if (p.goals) return '<a class="row" href="' + p.href + '">' + inner + '</a>' + goalRows();
          return '<a class="row" href="' + p.href + '">' + inner + '</a>';
        }).join('') +
        '<div class="row"><span class="dot" style="--c:var(--border)" aria-hidden="true"></span><span class="row-main"><span class="row-title strong">Libre</span></span>' +
        '<span class="row-amount"' + (t.free < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(t.free) + '</span></div>' +
        '<button type="button" class="row row-link" data-action="add-cat">' + icon('plus') + 'Ajouter une catégorie</button></div>' +
        (t.rest < 0 ? '<p class="alert">Tes dépenses fixes dépassent tes revenus. Baisse ton épargne, allonge un objectif ou mets un abonnement en pause.</p>'
          : t.free < 0 ? '<p class="alert">Tes catégories dépassent ce qu\'il te reste ce mois-ci.</p>' : '') +
        '</section>';
    }

    var next = upcoming().slice(0, state.settings.homeCount);
    html += '<section class="section a-side"><div class="section-head"><h2 class="heading">À venir</h2><a href="#/calendrier" class="label" style="color:var(--accent)">Calendrier</a></div><div class="group">' +
      (next.length ? next.map(function (u) { return subRow(u, false); }).join('')
        : '<div class="empty"><span>Aucun abonnement pour l\'instant.</span><button type="button" class="link-btn" data-action="add-sub">Ajouter mon premier abonnement</button></div>') +
      '</div></section>';
    return html + historySection();
  }

  // Catégorie : budget du mois, avec ce qui a déjà été dépensé.
  function catRow(c, color) {
    var spent = spentIn(c.id);
    var over = spent > c.amount;
    var meta = spent > 0
      ? (over ? '<span class="soon">Dépassé de ' + euro(spent - c.amount) + '</span>' : '<span>Reste ' + euro(c.amount - spent) + '</span>')
      : '<span>Rien de dépensé ce mois-ci</span>';
    var pct = c.amount > 0 ? Math.min(1, spent / c.amount) : (spent > 0 ? 1 : 0);
    return '<button type="button" class="row tall goal" data-action="edit-cat" data-id="' + esc(c.id) + '">' +
      '<span class="dot" style="--c:' + color + '" aria-hidden="true"></span>' +
      '<span class="row-main"><span class="row-title">' + esc(c.name) + '</span><span class="row-meta">' + meta + '</span>' +
      (spent > 0 ? '<span class="goal-bar' + (over ? ' over' : '') + '" aria-hidden="true"><span style="width:' + (pct * 100).toFixed(1) + '%"></span></span>' : '') +
      '</span><span class="row-amount">' + (spent > 0 ? euro(spent) + '<small class="per"> / ' + euro(c.amount) + '</small>' : euro(c.amount)) + '</span></button>';
  }

  // Rappel d'exporter une sauvegarde : 30 jours après la dernière (ou après la première utilisation).
  function backupNotice() {
    var m = state.meta;
    if (!state.subs.length && !state.goals.length && !state.categories.length) return '';
    var t = today();
    var ref = m.lastExport || m.since;
    if (!ref || diffDays(t, parseIso(ref)) < 30) return '';
    if (m.backupSnooze && diffDays(t, parseIso(m.backupSnooze)) < 7) return '';
    var days = diffDays(t, parseIso(ref));
    return '<div class="notice" role="status"><span>' + (m.lastExport ? 'Ta dernière sauvegarde date de ' + days + ' jours.' : 'Tu n\'as encore jamais exporté de sauvegarde.') +
      ' Si Safari est vidé, tes données disparaissent.</span><span class="notice-actions">' +
      '<button type="button" class="link-btn" data-action="export">Exporter maintenant</button>' +
      '<button type="button" class="link-btn" style="color:var(--muted)" data-action="backup-later">Plus tard</button></span></div>';
  }

  // Les 6 derniers mois : ce qui est resté libre, et ce qui a été mis de côté.
  function historySection() {
    var t = today();
    var months = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date(t.getFullYear(), t.getMonth() - i, 1);
      var h = state.history[monthKey(d)];
      if (h) months.push({ d: d, h: h, now: i === 0 });
    }
    if (months.length < 2) return '';
    var max = months.reduce(function (a, x) { return Math.max(a, Math.abs(x.h.free)); }, 0) || 1;
    var short = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    var prev = months[months.length - 2].h.free, cur = months[months.length - 1].h.free;
    var delta = cur - prev;
    return '<section class="section a-hist"><div class="section-head"><h2 class="heading">Mois par mois</h2><span class="label">Libre</span></div>' +
      '<div class="group hist"><div class="bars" role="img" aria-label="' + esc(months.map(function (x) { return cap(monthName.format(x.d)) + ' ' + euro(x.h.free); }).join(', ')) + '">' +
      months.map(function (x) {
        var hgt = Math.max(2, Math.abs(x.h.free) / max * 100);
        var tip = cap(monthName.format(x.d)) + ' : ' + euro(x.h.free) + ' libre, ' + euro(x.h.saved) + ' mis de côté';
        return '<div class="bar' + (x.now ? ' now' : '') + (x.h.free < 0 ? ' neg' : '') + '" title="' + esc(tip) + '">' +
          '<span class="bar-val">' + (x.now ? euro(x.h.free) : '') + '</span><span class="bar-col"><i style="height:' + hgt.toFixed(1) + '%"></i></span>' +
          '<span class="bar-m">' + esc(short.format(x.d).replace('.', '')) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="caption hist-note">' + (Math.abs(delta) < 1 ? 'Comme le mois dernier.' : (delta > 0 ? '+ ' : '− ') + euro(Math.abs(delta)) + ' par rapport au mois dernier.') +
      ' Mis de côté ce mois-ci : ' + euro(months[months.length - 1].h.saved) + '.</p></div></section>';
  }

  // Détail des objectifs en cours, sous la ligne « Objectifs ».
  function goalRows() {
    return state.goals.map(function (g) {
      var p = goalPlan(g);
      if (p.missing <= 0) return '';
      return '<a class="row row-sub" href="#/epargne"><span class="row-main"><span class="row-title">' + esc(g.name) + '</span></span>' +
        '<span class="row-amount">' + euro(p.monthly) + '</span></a>';
    }).join('');
  }

  function action(name, ic, label) {
    return '<button type="button" class="action" data-action="' + name + '"><span>' + icon(ic) + '</span><span>' + label + '</span></button>';
  }

  // ---------- Écran : Abonnements ----------

  function viewAbos() {
    var t = totals();
    var html = '<header class="topbar a-top"><h1 class="title">Abonnements</h1>' +
      '<button type="button" class="btn btn-primary" data-action="add-sub">' + icon('plus') + 'Ajouter</button></header>';

    var smooth = state.settings.annualMode === 'smooth';
    var yc = yearlyCount();
    var smoothPart = state.subs.filter(function (s) { return s.frequency === 'year' && !s.paused; }).reduce(function (a, s) { return a + s.amount / 12; }, 0);
    var pausedCount = state.subs.filter(function (s) { return s.paused; }).length;
    var monthWord = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(today());
    html += '<section class="hero a-hero" aria-label="Total">' +
      (yc ? '<p class="label">' + (smooth ? 'Par mois, annuels lissés' : 'Prélevé en ' + monthWord) + '</p>' : '') +
      '<p class="amount-big"><span data-count="subs" data-kind="big" data-value="' + t.subs + '">' + euro(t.subs) + '</span><small>/mois</small></p>' +
      '<p class="label" style="font-weight:400">' + euro(yearTotal()) + ' sur un an · ' + state.subs.length + ' abonnement' + (state.subs.length > 1 ? 's' : '') +
      (yc && smooth ? ', dont ' + euro(smoothPart) + ' pour ' + yc + ' annuel' + (yc > 1 ? 's' : '') : '') +
      (pausedCount ? ' · ' + pausedCount + ' en pause' : '') + '</p>';
    if (yc) {
      var nx = nextYearly();
      html += segmented('annualMode', [['actual', 'Ce mois-ci'], ['smooth', 'Lissé']], state.settings.annualMode, 'Compter les abonnements annuels', true) +
        (!smooth && nx ? '<p class="pill-info"><span class="soon-dot" aria-hidden="true" style="background:var(--accent)"></span><span>' + esc(nx.sub.name) + ' : <span class="strong">' + euro(nx.sub.amount) + '</span> à prévoir en ' + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(nx.date) + '</span></p>' : '');
    }
    html += '</section>';

    if (!state.subs.length) {
      return html + '<div class="group a-main"><div class="empty"><span>Aucun abonnement pour l\'instant.</span><span class="caption">Ajoute tes paiements récurrents pour voir où part ton argent.</span></div>' +
        importButton('row row-link') + '</div>';
    }

    var present = SUB_CATEGORIES.filter(function (c) { return state.subs.some(function (s) { return s.category === c; }); });
    state.subs.forEach(function (s) { if (present.indexOf(s.category) < 0) present.push(s.category); });
    if (ui.abosFilter !== 'Tous' && present.indexOf(ui.abosFilter) < 0) ui.abosFilter = 'Tous';

    html += '<div class="section a-actions" style="gap:12px"><label class="search">' + icon('search') +
      '<span class="sr-only">Rechercher un abonnement</span><input type="search" id="abos-q" placeholder="Rechercher" autocomplete="off" value="' + esc(ui.abosQuery) + '" data-input="abos-q"></label>' +
      '<div class="chips" role="group" aria-label="Filtrer par catégorie">' +
      ['Tous'].concat(present).map(function (c) {
        return '<button type="button" class="chip" data-action="abos-filter" data-value="' + esc(c) + '" aria-pressed="' + (c === ui.abosFilter) + '">' + esc(c) + '</button>';
      }).join('') + '</div></div>';

    var byCat = {};
    state.subs.forEach(function (s) { byCat[s.category] = (byCat[s.category] || 0) + costThisMonth(s); });
    Object.keys(byCat).forEach(function (k) { if (byCat[k] <= 0) delete byCat[k]; });
    var cats = Object.keys(byCat).map(function (k) { return { name: k, value: byCat[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var shown = cats.slice(0, 4).map(function (c, i) { return { name: c.name, value: c.value, color: SUB_PALETTE[i] }; });
    if (cats.length > 4) {
      shown.push({ name: 'Autres', value: cats.slice(4).reduce(function (a, c) { return a + c.value; }, 0), color: 'var(--chart-2)' });
    }
    html += '<section class="section a-side"><h2 class="heading">Par catégorie</h2>' +
      splitBar(shown, shown.map(function (c) { return c.name + ' ' + euro(c.value); }).join(', ')) +
      '<div class="legend">' + shown.map(function (c) {
        return '<div><span class="dot sm" style="--c:' + c.color + '" aria-hidden="true"></span><span class="name">' + esc(c.name) + '</span><span class="strong">' + euro(c.value) + '</span></div>';
      }).join('') + '</div></section>';

    html += '<section class="section a-main"><div class="section-head"><h2 class="heading" id="abos-title"></h2><span class="label" style="font-weight:400">Par date</span></div>' +
      '<div class="group" id="abos-list"></div><div class="group">' + importButton('row row-link') + '</div></section>';
    return html;
  }

  // Relevé bancaire (CSV ou PDF) ou facture (PDF).
  function importButton(cls) {
    var style = cls === 'link-btn' ? 'display:inline-flex;align-items:center;gap:6px;cursor:pointer' : 'cursor:pointer';
    return '<label class="' + cls + '" style="' + style + '">' + icon('upload') + 'Importer un relevé ou une facture' +
      '<input type="file" accept=".csv,text/csv,application/pdf,.pdf" class="sr-only" data-input="statement"></label>';
  }

  function fillAbosList() {
    var list = document.getElementById('abos-list');
    if (!list) return;
    var q = ui.abosQuery.trim().toLowerCase();
    var items = upcoming(true).filter(function (u) {
      return (ui.abosFilter === 'Tous' || u.sub.category === ui.abosFilter) && (!q || u.sub.name.toLowerCase().indexOf(q) >= 0);
    });
    document.getElementById('abos-title').textContent = ui.abosFilter === 'Tous' ? 'Tous les abonnements' : ui.abosFilter;
    list.innerHTML = items.length ? items.map(function (u) { return subRow(u, true); }).join('')
      : '<div class="empty"><span>Aucun résultat.</span></div>';
  }

  // ---------- Écran : Calendrier ----------

  function viewCal() {
    var t = today();
    var first = new Date(t.getFullYear(), t.getMonth() + ui.calOffset, 1);
    var y = first.getFullYear(), m = first.getMonth();
    var n = daysIn(y, m);
    var lead = (first.getDay() + 6) % 7;
    if (ui.calSel === null && ui.calOffset === 0) ui.calSel = t.getDate();

    var byDay = {};
    var inMonth = state.subs.filter(function (s) { return chargeIn(s, y, m); });
    inMonth.forEach(function (s) {
      var d = Math.min(s.day, n);
      (byDay[d] = byDay[d] || []).push(s);
    });
    // Fins d'essai gratuit : à repérer dans le calendrier pour penser à résilier.
    var trials = {};
    state.subs.forEach(function (s) {
      if (s.paused || !s.trialEnd) return;
      var e = parseIso(s.trialEnd);
      if (e.getFullYear() === y && e.getMonth() === m && e >= t) (trials[e.getDate()] = trials[e.getDate()] || []).push(s);
    });
    var monthTotal = inMonth.reduce(function (a, s) { return a + s.amount; }, 0);
    var left = inMonth.filter(function (s) { return onDay(y, m, s.day) >= t; }).reduce(function (a, s) { return a + s.amount; }, 0);
    var summary = inMonth.length
      ? inMonth.length + ' prélèvement' + (inMonth.length > 1 ? 's' : '') + ' · ' + euro(monthTotal) + (left < monthTotal && left > 0 ? ' · reste ' + euro(left) : left === 0 && onDay(y, m, 1) <= t ? ' · tout est prélevé' : '')
      : 'Aucun prélèvement';

    var html = '<header class="topbar a-top"><h1 class="title">Calendrier</h1><button type="button" class="btn" data-action="cal-today">Aujourd\'hui</button></header>';
    html += '<section class="section a-main" aria-label="Mois affiché"><div class="month-nav">' +
      '<button type="button" class="icon-btn" aria-label="Mois précédent" data-action="cal-prev">' + icon('left') + '</button>' +
      '<div><h2 class="heading">' + cap(monthName.format(first)) + '</h2><span class="caption">' + summary + '</span></div>' +
      '<button type="button" class="icon-btn" aria-label="Mois suivant" data-action="cal-next">' + icon('right') + '</button></div>';

    html += '<div class="cal">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(function (w) { return '<span class="wd" aria-hidden="true">' + w + '</span>'; }).join('');
    var cellCount = Math.ceil((lead + n) / 7) * 7;
    for (var i = 0; i < cellCount; i++) {
      var day = i - lead + 1;
      if (day < 1 || day > n) {
        html += '<span class="day out" aria-hidden="true"></span>';
        continue;
      }
      var date = new Date(y, m, day);
      var diff = diffDays(date, t);
      var has = !!byDay[day];
      var trial = !!trials[day];
      var cls = ['day'];
      if (has || trial) cls.push('has');
      if (trial) cls.push('trial-day');
      if (diff < 0) cls.push('past');
      if (has && diff >= 0 && diff <= state.settings.alertDays) cls.push('soon-day');
      if (diff === 0) cls.push('today');
      html += '<button type="button" class="' + cls.join(' ') + '" data-action="cal-day" data-day="' + day + '" aria-pressed="' + (day === ui.calSel) + '" aria-label="' + day + ' ' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date)) + (has ? ', prélèvement prévu' : '') + (trial ? ', fin d\'essai gratuit' : '') + '"><span>' + day + '</span><i aria-hidden="true"></i></button>';
    }
    html += '</div><div class="cal-legend"><span><i style="--c:var(--accent)"></i>À venir</span><span><i style="--c:var(--warning)"></i>Bientôt</span><span><i style="--c:var(--chart-2)"></i>Déjà prélevé</span>' +
      (Object.keys(trials).length ? '<span><i class="ring"></i>Fin d\'essai</span>' : '') + '</div></section>';

    var sel = ui.calSel && ui.calSel <= n ? ui.calSel : null;
    html += '<section class="section a-side"><h2 class="heading">' + (sel ? cap(longDay.format(new Date(y, m, sel))) : 'Choisis un jour') + '</h2><div class="group">';
    var items = sel ? (byDay[sel] || []) : [];
    var ends = sel ? (trials[sel] || []) : [];
    html += ends.map(function (s) {
      return '<button type="button" class="row tall" data-action="edit-sub" data-id="' + esc(s.id) + '">' + subTile(s) +
        '<span class="row-main"><span class="row-title">' + esc(s.name) + '</span><span class="row-meta"><span class="soon">Fin de l\'essai gratuit</span></span></span>' +
        '<span class="row-amount">' + priceLabel(s) + '</span></button>';
    }).join('');
    if (items.length) {
      var d = diffDays(new Date(y, m, sel), t);
      html += items.map(function (s) {
        var soon = d >= 0 && d <= state.settings.alertDays;
        return '<button type="button" class="row tall" data-action="edit-sub" data-id="' + esc(s.id) + '">' + subTile(s) +
          '<span class="row-main"><span class="row-title">' + esc(s.name) + '</span><span class="row-meta"><span class="' + (soon ? 'soon' : '') + '">' + relative(d) + '</span></span></span>' +
          '<span class="row-amount">' + priceLabel(s) + '</span></button>';
      }).join('');
    } else if (!ends.length) {
      var nx = upcoming()[0];
      html += '<div class="empty"><span>Aucun prélèvement ce jour-là.</span>' +
        (nx ? '<span class="caption">Prochain : ' + esc(nx.sub.name) + ', le ' + shortDate.format(nx.date) + ' · ' + euro(nx.sub.amount) + '</span>' : '') + '</div>';
    }
    return html + '</div></section>';
  }

  // ---------- Écran : Épargne ----------

  function viewSavings() {
    var html = '<header class="topbar a-top"><h1 class="title">Épargne</h1></header>' +
      '<section class="hero a-hero" aria-label="Montant épargné"><p class="label">Tu mets de côté chaque mois</p><div id="sv-hero"></div><p class="label" style="font-weight:400" id="sv-sub"></p></section>';

    html += '<section class="section a-main" style="gap:12px" aria-label="Modifier le montant"><div class="stepper-box">' +
      '<button type="button" class="icon-btn" aria-label="Retirer 10 €" data-action="sv-step" data-value="-10">' + icon('minus') + '</button>' +
      '<label><span class="sr-only">Montant épargné par mois, en euros</span><input type="text" inputmode="decimal" id="sv-input" data-input="sv-input" value="' + plain(state.savings) + '" autocomplete="off"><span class="muted">€</span></label>' +
      '<button type="button" class="icon-btn" aria-label="Ajouter 10 €" data-action="sv-step" data-value="10">' + icon('plus') + '</button></div>';
    if (state.salary > 0) {
      html += '<div class="presets" role="group" aria-label="Choisir un pourcentage du salaire" id="sv-presets"></div>' +
        '<p class="caption">Les pourcentages sont calculés sur ton salaire de ' + euro(state.salary) + '. Le changement s\'enregistre tout seul.</p>';
    } else {
      html += '<p class="caption">Indique ton salaire pour voir ce qu\'il te reste. <button type="button" class="link-btn" data-action="edit-salary">Indiquer mon salaire</button></p>';
    }
    html += '</section><section class="section a-goals" aria-label="Objectifs d\'épargne"><div class="section-head"><h2 class="heading">Objectifs</h2>' +
      '<button type="button" class="link-btn" data-action="add-goal">' + icon('plus') + 'Nouvel objectif</button></div><div id="sv-goals"></div></section>';
    html += '<section class="section a-side"><h2 class="heading">Ce qu\'il te reste</h2><div class="group" id="sv-calc"></div><p class="alert" id="sv-alert" hidden>Avec ce montant, tes dépenses dépassent tes revenus du mois. Baisse un peu ton épargne ou allonge un objectif.</p></section>';
    return html;
  }

  function fillSavings(skipInput) {
    var heroEl = document.getElementById('sv-hero');
    if (!heroEl) return;
    var t = totals();
    heroEl.innerHTML = hero(state.savings, 'savings');
    runCounters(heroEl);
    var pct = state.salary > 0 ? Math.round(state.savings / state.salary * 100) + ' % de ton salaire · ' : '';
    document.getElementById('sv-sub').textContent = pct + euro(state.savings * 12) + ' sur un an';
    if (!skipInput) document.getElementById('sv-input').value = plain(state.savings);
    var presets = document.getElementById('sv-presets');
    if (presets) {
      presets.innerHTML = [10, 20, 30, 40].map(function (p) {
        var v = Math.round(state.salary * p) / 100;
        return '<button type="button" class="chip" data-action="sv-preset" data-value="' + v + '" aria-pressed="' + (Math.abs(v - state.savings) < 0.005) + '">' + p + ' %</button>';
      }).join('');
    }
    document.getElementById('sv-calc').innerHTML =
      calcRow('Salaire', euro(state.salary), 'var(--ink)') +
      extrasThisMonth().map(function (i) {
        return '<button type="button" class="row" data-action="edit-income" data-id="' + esc(i.id) + '"><span class="dot" style="--c:var(--ink)" aria-hidden="true"></span>' +
          '<span class="row-main"><span class="muted">' + esc(i.name) + ' (ce mois-ci)</span></span><span class="row-amount">+ ' + euro(i.amount) + '</span></button>';
      }).join('') +
      '<button type="button" class="row row-link row-sub-link" data-action="add-income">' + icon('plus') + 'Ajouter un revenu ce mois-ci</button>' +
      calcRow('Épargne', '− ' + euro(state.savings), 'var(--accent)') +
      (t.goals > 0 ? calcRow('Objectifs', '− ' + euro(t.goals), 'var(--chart-4)') : '') +
      calcRow(yearlyCount() ? (state.settings.annualMode === 'smooth' ? 'Abonnements (annuels lissés)' : 'Abonnements (ce mois-ci)') : 'Abonnements', '− ' + euro(t.subs), 'var(--chart-2)') +
      (t.cats > 0 ? calcRow('Catégories', '− ' + euro(t.cats), 'var(--chart-3)') : '') +
      '<div class="row" style="min-height:60px"><span class="row-main"><span class="strong">Il te reste</span></span><span class="row-amount" style="font-size:20px;line-height:26px;font-weight:700' + (t.free < 0 ? ';color:var(--danger)' : '') + '">' + euro(t.free) + '</span></div>' +
      '<div class="row"><span class="row-main"><span class="muted">Pour te faire plaisir cette semaine</span></span><span class="row-amount">' + euro(t.weekly) + '</span></div>';
    document.getElementById('sv-alert').hidden = !(state.salary > 0 && t.free < 0);
    fillGoals();
  }

  function fillGoals() {
    var el = document.getElementById('sv-goals');
    if (!el) return;
    if (!state.goals.length) {
      el.innerHTML = '<div class="group"><div class="empty"><span>Un voyage, une voiture, un coussin de sécurité… Donne un montant et une durée : Finy calcule combien mettre de côté chaque mois.</span>' +
        '<button type="button" class="link-btn" data-action="add-goal">Créer mon premier objectif</button></div></div>';
      return;
    }
    var need = goalsMonthly();
    var html = '<div class="group">' + state.goals.map(function (g) {
      var p = goalPlan(g);
      var meta = !p.done ? 'Encore ' + durationLabel(p.left) + ' · ' + monthName.format(p.end) : 'Objectif atteint';
      // Où en est le versement du mois : à jour, ou ce qu'il manque encore.
      var status = p.done || p.monthly <= 0 ? ''
        : p.toGo <= 0 ? '<span class="ok">✓ À jour ce mois-ci</span>'
        : p.paid > 0 ? '<span>Versé ce mois-ci : ' + euro(p.paid) + ' sur ' + euro(p.monthly) + '</span>'
        : '<span>Rien versé ce mois-ci</span>';
      return '<button type="button" class="row tall goal" data-action="edit-goal" data-id="' + esc(g.id) + '">' +
        '<span class="row-main"><span class="row-title">' + esc(g.name) + '</span><span class="row-meta"><span>' + meta + '</span></span>' +
        '<span class="goal-bar" aria-hidden="true"><span style="width:' + (p.progress * 100).toFixed(1) + '%"></span></span>' +
        '<span class="row-meta"><span>' + euro(g.saved) + ' sur ' + euro(g.target) + '</span></span>' +
        (status ? '<span class="row-meta">' + status + '</span>' : '') + '</span>' +
        '<span class="row-amount">' + (!p.done ? euro(p.monthly) + '<small class="per">/mois</small>' : '✓') + '</span></button>' +
        (!p.done ? '<button type="button" class="row row-link row-sub-link" data-action="goal-deposit" data-id="' + esc(g.id) + '">' + icon('plus') +
          'Ajouter un versement' + (p.toGo > 0 ? '<span class="muted" style="font-weight:400"> · encore ' + euro(p.toGo) + ' ce mois-ci</span>' : '') + '</button>' : '');
    }).join('') + '</div>';
    if (need > 0) {
      html += '<p class="caption">' + (state.goals.length > 1 ? 'Tes objectifs demandent ' : 'Cet objectif demande ') + '<span class="strong" style="color:var(--ink)">' + euro(need) + ' par mois</span>' +
        ', en plus de ton épargne. Ce montant est retiré de ce qu\'il te reste.</p>';
    }
    el.innerHTML = html;
  }

  function editGoal(id) {
    var g = state.goals.filter(function (x) { return x.id === id; })[0];
    var isNew = !g;
    var left = g ? goalPlan(g).left : 12;
    var inYears = left % 12 === 0;
    var body = '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="40" autocomplete="off" placeholder="Voyage au Japon, voiture…" value="' + esc(g ? g.name : '') + '"></label>' +
      '<div class="field-row">' + amountField('target', 'Montant à atteindre (€)', g ? g.target : 0) + amountField('saved', 'Déjà de côté (€)', g ? g.saved : 0) + '</div>' +
      '<div class="field-row"><label class="field"><span>' + (isNew ? 'Durée' : 'Temps restant') + '</span><input class="input" name="duration" type="text" inputmode="numeric" autocomplete="off" placeholder="12" value="' + (inYears ? left / 12 : left) + '"></label>' +
      '<div class="field"><span>&nbsp;</span><div class="segmented" role="radiogroup" aria-label="Unité de durée">' +
      '<label class="seg-opt"><input type="radio" name="unit" value="month"' + (inYears ? '' : ' checked') + '><span>Mois</span></label>' +
      '<label class="seg-opt"><input type="radio" name="unit" value="year"' + (inYears ? ' checked' : '') + '><span>Ans</span></label></div></div></div>' +
      '<p class="pill-info" id="goal-preview" aria-live="polite"></p>';
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-goal" data-id="' + esc(id) + '">Supprimer cet objectif</button>';
    openSheet(isNew ? 'Nouvel objectif' : 'Modifier l\'objectif', body, isNew ? 'Créer l\'objectif' : 'Enregistrer', function (data) {
      var r = readGoalForm(data);
      if (typeof r === 'string') return r;
      var item = { id: isNew ? uid() : id, name: r.name, target: r.target, saved: r.saved, months: r.months, start: monthKey(today()), deposits: isNew ? [] : g.deposits };
      if (isNew) state.goals.push(item);
      else state.goals = state.goals.map(function (x) { return x.id === id ? item : x; });
      toast(isNew ? 'Objectif créé' : 'Objectif modifié');
    }, del);
    sheetForm.dataset.kind = 'goal';
    previewGoal();
  }

  // Un versement fait avancer l'objectif sans toucher à son montant mensuel.
  function depositGoal(id) {
    var g = state.goals.filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    var p = goalPlan(g);
    var body = '<p class="caption">' + esc(g.name) + ' : ' + euro(g.saved) + ' sur ' + euro(g.target) +
      (p.toGo > 0 ? '. Il reste ' + euro(p.toGo) + ' à verser ce mois-ci.' : '. Tu es à jour ce mois-ci.') + '</p>' +
      amountField('amount', 'Montant versé (€)', p.toGo);
    openSheet('Ajouter un versement', body, 'Ajouter', function (data) {
      var n = parseAmount(data.amount);
      if (n === null || n <= 0) return 'Indique un montant, par exemple 50.';
      g.saved = Math.round((g.saved + n) * 100) / 100;
      g.deposits.push({ m: monthKey(today()), amount: n });
      if (g.deposits.length > 120) g.deposits = g.deposits.slice(-120);
      toast(g.saved >= g.target ? 'Objectif atteint, bravo !' : 'Versement ajouté');
    });
  }

  // Dépense rapide dans une catégorie (courses, essence…).
  function editExpense(catId) {
    if (!state.categories.length) {
      toast('Crée d\'abord une catégorie, par exemple Alimentation');
      return editCat(null);
    }
    var last = catId || (state.expenses.length ? state.expenses[state.expenses.length - 1].cat : null);
    var body = amountField('amount', 'Montant (€)', 0) +
      '<label class="field"><span>Catégorie</span><select class="input" name="cat">' + state.categories.map(function (c) {
        var left = c.amount - spentIn(c.id);
        return '<option value="' + esc(c.id) + '"' + (c.id === last ? ' selected' : '') + '>' + esc(c.name) + ' · reste ' + euro(left) + '</option>';
      }).join('') + '</select></label>' +
      '<div class="field-row"><label class="field"><span>Note (facultatif)</span><input class="input" name="note" type="text" maxlength="60" autocomplete="off" placeholder="Courses, plein…"></label>' +
      '<label class="field"><span>Date</span><input class="input" name="date" type="date" value="' + iso(today()) + '" max="' + iso(today()) + '"></label></div>';
    openSheet('Nouvelle dépense', body, 'Ajouter', function (data) {
      var n = parseAmount(data.amount);
      if (n === null || n <= 0) return 'Indique un montant, par exemple 32,50.';
      var date = isIsoDate(data.date) ? data.date : iso(today());
      if (date > iso(today())) return 'Choisis une date passée ou aujourd\'hui.';
      state.expenses.push({ id: uid(), cat: data.cat, amount: n, date: date, note: (data.note || '').trim().slice(0, 60) });
      var c = state.categories.filter(function (x) { return x.id === data.cat; })[0];
      var left = c ? c.amount - spentIn(c.id) : 0;
      toast(c && date.slice(0, 7) === monthKey(today()) ? (left >= 0 ? 'Reste ' + euro(left) + ' en ' + c.name : c.name + ' : budget dépassé') : 'Dépense ajoutée');
    });
  }

  // Revenu ponctuel, compté seulement pour le mois en cours.
  function editIncome(id) {
    var inc = state.incomes.filter(function (x) { return x.id === id; })[0];
    var isNew = !inc;
    var body = '<p class="caption">Une prime, un remboursement, un petit boulot… Il s\'ajoute à ton salaire pour ' + monthName.format(today()) + ' seulement.</p>' +
      '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="40" autocomplete="off" placeholder="Prime, remboursement…" value="' + esc(inc ? inc.name : '') + '"></label>' +
      amountField('amount', 'Montant (€)', inc ? inc.amount : 0);
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-income" data-id="' + esc(id) + '">Supprimer ce revenu</button>';
    openSheet(isNew ? 'Revenu en plus' : 'Modifier le revenu', body, isNew ? 'Ajouter' : 'Enregistrer', function (data) {
      var name = (data.name || '').trim();
      var n = parseAmount(data.amount);
      if (!name) return 'Donne un nom à ce revenu.';
      if (n === null || n <= 0) return 'Indique un montant, par exemple 200.';
      var item = { id: isNew ? uid() : id, name: name, amount: n, month: isNew ? monthKey(today()) : inc.month };
      if (isNew) state.incomes.push(item);
      else state.incomes = state.incomes.map(function (x) { return x.id === id ? item : x; });
      toast(isNew ? 'Revenu ajouté' : 'Revenu modifié');
    }, del);
  }

  function readGoalForm(data) {
    var name = (data.name || '').trim();
    var target = parseAmount(data.target);
    var saved = (data.saved || '').trim() ? parseAmount(data.saved) : 0;
    var n = parseInt(String(data.duration || '').trim(), 10);
    if (!name) return 'Donne un nom à cet objectif.';
    if (target === null || target <= 0) return 'Indique le montant à atteindre, par exemple 2 000.';
    if (saved === null) return 'Indique ce que tu as déjà de côté, ou laisse le champ vide.';
    if (!/^\d+$/.test(String(data.duration || '').trim()) || n < 1) return 'Indique une durée, par exemple 12 mois ou 2 ans.';
    var months = data.unit === 'year' ? n * 12 : n;
    if (months > 600) return 'Choisis une durée de 50 ans au plus.';
    return { name: name, target: target, saved: saved, months: months };
  }

  // Aperçu en direct du montant mensuel dans la fenêtre de l'objectif.
  function previewGoal() {
    var out = document.getElementById('goal-preview');
    if (!out) return;
    var data = {};
    new FormData(sheetForm).forEach(function (v, k) { data[k] = v; });
    data.name = data.name || '-';
    var r = readGoalForm(data);
    if (typeof r === 'string') {
      out.innerHTML = '<span class="muted">Indique un montant et une durée pour voir combien mettre de côté chaque mois.</span>';
      return;
    }
    var missing = Math.max(0, r.target - r.saved);
    out.innerHTML = missing > 0
      ? '<span class="strong">' + euro(Math.ceil(missing / r.months * 100) / 100) + ' par mois</span><span class="muted">pendant ' + durationLabel(r.months) + '</span>'
      : '<span class="strong">Objectif déjà atteint</span>';
  }

  function calcRow(label, value, color) {
    return '<div class="row"><span class="dot" style="--c:' + color + '" aria-hidden="true"></span><span class="row-main"><span class="muted">' + label + '</span></span><span class="row-amount">' + value + '</span></div>';
  }

  // ---------- Écran : Réglages ----------

  function viewSettings() {
    var s = state.settings;
    var notif = 'Notification' in window;
    var html = '<header style="display:flex;flex-direction:column;gap:8px"><a href="#/" class="back">' + icon('left') + 'Accueil</a><h1 class="title">Réglages</h1></header>';

    html += '<section class="section" aria-label="Profil"><div class="profile"><span class="avatar-lg" aria-hidden="true">' + avatarInner() + '</span>' +
      '<div style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="heading">' + (state.profile.name ? esc(state.profile.name) : 'Ton profil') + '</span>' +
      '<label class="link-btn" style="display:inline-flex;align-items:center;cursor:pointer">Changer la photo<input type="file" accept="image/*" class="sr-only" data-input="photo"></label>' +
      (state.profile.photo ? '<button type="button" class="link-btn" data-action="remove-photo" style="color:var(--muted)">Retirer la photo</button>' : '') +
      '</div></div><label class="field"><span>Nom affiché</span><input class="input" type="text" maxlength="40" autocomplete="given-name" value="' + esc(state.profile.name) + '" data-input="name"></label></section>';

    html += '<section class="section" style="gap:12px"><h2 class="heading">Apparence</h2>' +
      segmented('theme', [['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']], s.theme, 'Thème', false) + '</section>';

    html += '<section class="section" style="gap:12px"><h2 class="heading">Accueil</h2><div class="group">' +
      '<div class="row" style="min-height:64px"><span class="row-main"><span>Abonnements annuels</span><span class="caption">' + (state.settings.annualMode === 'smooth' ? 'Comptés 1/12 chaque mois' : 'Comptés le mois où ils sont prélevés') + '</span></span>' +
      segmented('annualMode', [['actual', 'Ce mois-ci'], ['smooth', 'Lissé']], state.settings.annualMode, 'Compter les abonnements annuels', true) + '</div>' +
      '<div class="row" style="min-height:64px"><span class="row-main"><span>Prélèvements affichés</span><span class="caption">Dans « À venir »</span></span>' +
      segmented('homeCount', [[3, '3'], [5, '5']], s.homeCount, 'Nombre de prélèvements affichés', true) + '</div>' +
      '<div class="row" style="min-height:64px"><span class="row-main"><span style="display:flex;align-items:center;gap:8px"><span class="soon-dot" aria-hidden="true"></span>Pastille orange</span><span class="caption">Jours avant le prélèvement</span></span>' +
      stepper('alertDays', s.alertDays, '') + '</div></div></section>';

    html += '<section class="section" style="gap:12px" id="rappels"><h2 class="heading">Rappels</h2><div class="group">' +
      '<div class="row" style="min-height:64px"><span class="row-main"><span>Activer les rappels</span><span class="caption">Une notification avant chaque prélèvement</span></span>' +
      '<button type="button" class="switch" role="switch" aria-checked="' + s.reminders.enabled + '" aria-label="Activer les rappels" data-action="toggle-reminders"' + (notif ? '' : ' disabled') + '></button></div>';
    if (s.reminders.enabled) {
      html += '<div class="row"><span class="row-main"><span>Me prévenir</span></span>' + stepper('daysBefore', s.reminders.daysBefore, ' avant') + '</div>' +
        '<div class="row"><span class="row-main"><span>Aussi le jour même</span></span><button type="button" class="switch" role="switch" aria-checked="' + s.reminders.sameDay + '" aria-label="Rappel le jour du paiement" data-action="toggle-sameday"></button></div>' +
        '<button type="button" class="row row-link" data-action="test-notif">Envoyer une notification de test</button>';
    }
    html += '</div><p class="caption">' + (notif
      ? 'Les rappels sont vérifiés quand tu ouvres Finy. Sur iPhone, ils fonctionnent une fois Finy ajoutée à l\'écran d\'accueil.'
      : 'Les notifications ne sont pas disponibles ici. Sur iPhone, ajoute d\'abord Finy à l\'écran d\'accueil (Partager › Sur l\'écran d\'accueil), puis ouvre-la depuis son icône.') + '</p></section>';

    html += '<section class="section" style="gap:12px"><h2 class="heading">Données</h2><div class="group">' +
      '<button type="button" class="row" data-action="export">' + icon('download') + '<span class="row-main">Exporter une sauvegarde</span>' + icon('right', 'chev') + '</button>' +
      '<label class="row" style="cursor:pointer">' + icon('upload') + '<span class="row-main">Importer une sauvegarde</span>' + icon('right', 'chev') + '<input type="file" accept="application/json,.json" class="sr-only" data-input="import"></label>' +
      '<button type="button" class="row" data-action="reload">' + icon('refresh') + '<span class="row-main">Recharger Finy</span>' + icon('right', 'chev') + '</button>' +
      '</div><p class="caption">Ton budget, ton profil et ton thème restent sur cet appareil. Exporte une sauvegarde pour les retrouver ailleurs.</p></section>';
    return html;
  }

  function segmented(key, opts, current, label, inline) {
    return '<div class="segmented' + (inline ? ' inline' : '') + '" role="radiogroup" aria-label="' + label + '">' + opts.map(function (o) {
      return '<button type="button" role="radio" aria-checked="' + (o[0] === current) + '" data-action="set" data-key="' + key + '" data-value="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  function stepper(key, value, suffix) {
    var label = value + (value > 1 ? ' jours' : ' jour') + suffix;
    return '<div class="stepper"><button type="button" class="icon-btn sm" aria-label="Un jour de moins" data-action="step" data-key="' + key + '" data-value="-1">−</button>' +
      '<output aria-live="polite">' + label + '</output>' +
      '<button type="button" class="icon-btn sm" aria-label="Un jour de plus" data-action="step" data-key="' + key + '" data-value="1">+</button></div>';
  }

  // ---------- Routeur ----------

  var ROUTES = {
    '': { tab: 'accueil', view: viewHome },
    calendrier: { tab: 'calendrier', view: viewCal },
    abonnements: { tab: 'abonnements', view: viewAbos, after: fillAbosList },
    epargne: { tab: 'epargne', view: viewSavings, after: fillSavings },
    reglages: { tab: 'reglages', view: viewSettings }
  };

  function currentRoute() {
    var key = location.hash.replace(/^#\/?/, '');
    return ROUTES[key] ? key : '';
  }

  var lastRoute = null;

  function render() {
    var key = currentRoute();
    var r = ROUTES[key];
    var view = document.getElementById('view');
    var scroll = key === lastRoute ? window.scrollY : 0;
    view.dataset.route = key || 'accueil';
    view.innerHTML = r.view();
    if (key !== lastRoute) playEnter(view, 'enter');
    if (r.after) r.after();
    runCounters(view);
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.dataset.tab === r.tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = { '': 'Finy', calendrier: 'Calendrier · Finy', abonnements: 'Abonnements · Finy', epargne: 'Épargne · Finy', reglages: 'Réglages · Finy' }[key];
    if (ui.focusAfter) {
      var target = document.getElementById(ui.focusAfter);
      ui.focusAfter = null;
      if (target) { target.scrollIntoView({ block: 'start' }); lastRoute = key; return; }
    }
    window.scrollTo(0, scroll);
    if (key !== lastRoute) view.focus({ preventScroll: true });
    lastRoute = key;
  }

  function applyTheme() {
    var t = state.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  // ---------- Feuilles ----------

  var sheet = document.getElementById('sheet');
  var sheetForm = document.getElementById('sheet-form');
  var sheetSubmit = null;
  var sheetDraft = { name: '', site: '', image: null };

  // Logo introuvable (site inconnu, hors ligne) : on revient à l'initiale.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (img.tagName !== 'IMG' || !img.parentNode || !img.parentNode.classList.contains('tile-logo')) return;
    var tile = img.parentNode;
    tile.classList.remove('tile-logo');
    tile.textContent = tile.dataset.initial || '?';
  }, true);

  function openSheet(title, body, submitLabel, onSubmit, extra) {
    sheetSubmit = onSubmit;
    delete sheetForm.dataset.kind;
    sheetForm.innerHTML = '<span class="sheet-handle" aria-hidden="true"></span>' +
      '<div class="sheet-head"><h2 class="heading" id="sheet-title">' + title + '</h2>' +
      '<button type="button" class="icon-btn" aria-label="Fermer" data-action="sheet-close">' + icon('close') + '</button></div>' +
      body + '<p class="alert" id="sheet-error" hidden></p>' +
      '<div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">' + submitLabel + '</button>' + (extra || '') + '</div>';
    // Une fenêtre peut en remplacer une autre déjà ouverte (dépense supprimée, import…).
    if (sheet.open) { /* déjà ouverte */ } else if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
    var first = sheetForm.querySelector('input, select');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function closeSheet() {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
    sheetSubmit = null;
  }

  function sheetError(msg) {
    var el = document.getElementById('sheet-error');
    el.textContent = msg;
    el.hidden = false;
  }

  sheetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!sheetSubmit) return closeSheet();
    var data = {};
    new FormData(sheetForm).forEach(function (v, k) { data[k] = v; });
    var res = sheetSubmit(data);
    if (typeof res === 'string') return sheetError(res);
    closeSheet();
    save();
    render();
  });

  sheet.addEventListener('click', function (e) {
    if (e.target === sheet) closeSheet();
  });

  function amountField(name, label, value) {
    return '<label class="field"><span>' + label + '</span><input class="input" name="' + name + '" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (value ? plain(value) : '') + '"></label>';
  }

  function editSalary() {
    openSheet('Ton salaire', amountField('amount', 'Salaire net par mois (€)', state.salary), 'Enregistrer', function (d) {
      var n = parseAmount(d.amount);
      if (n === null) return 'Indique un montant, par exemple 1 070,00.';
      state.salary = n;
    });
  }

  // `preset` pré-remplit un nouvel abonnement (lu dans une facture).
  function editSub(id, preset) {
    var s = state.subs.filter(function (x) { return x.id === id; })[0];
    var isNew = !s;
    s = s || Object.assign({ name: '', amount: 0, day: today().getDate(), month: today().getMonth(), frequency: 'month', category: 'Streaming', site: '', image: null }, preset);
    var yearly = s.frequency === 'year';
    var months = '';
    for (var mo = 0; mo < 12; mo++) {
      months += '<option value="' + mo + '"' + (mo === s.month ? ' selected' : '') + '>' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2026, mo, 1))) + '</option>';
    }
    sheetDraft = { name: s.name, site: s.site || '', image: s.image || null };
    var cats = SUB_CATEGORIES.slice();
    if (cats.indexOf(s.category) < 0) cats.push(s.category);
    var days = '';
    for (var d = 1; d <= 31; d++) days += '<option value="' + d + '"' + (d === s.day ? ' selected' : '') + '>' + d + '</option>';
    var body = (isNew && !preset ? importButton('link-btn') : '') + '<div class="image-pick"><span id="draft-tile">' + subTile(sheetDraft, 'tile-lg') + '</span>' +
      '<div class="image-pick-actions"><label class="link-btn" style="display:inline-flex;align-items:center;cursor:pointer">Choisir une image<input type="file" accept="image/*" class="sr-only" data-input="sub-image"></label>' +
      '<button type="button" class="link-btn" data-action="sub-image-remove" style="color:var(--muted)"' + (s.image ? '' : ' hidden') + '>Retirer l\'image</button></div></div>' +
      '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="60" autocomplete="off" placeholder="Netflix, Orange…" value="' + esc(s.name) + '" data-input="sub-name"></label>' +
      '<div class="field"><span>Fréquence</span><div class="segmented" role="radiogroup" aria-label="Fréquence">' +
      '<label class="seg-opt"><input type="radio" name="frequency" value="month" data-input="sub-freq"' + (yearly ? '' : ' checked') + '><span>Mensuel</span></label>' +
      '<label class="seg-opt"><input type="radio" name="frequency" value="year" data-input="sub-freq"' + (yearly ? ' checked' : '') + '><span>Annuel</span></label></div></div>' +
      '<label class="field"><span id="amount-label">' + (yearly ? 'Montant par an (€)' : 'Montant par mois (€)') + '</span><input class="input" name="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (s.amount ? plain(s.amount) : '') + '"></label>' +
      '<div class="field-row"><label class="field"><span>Jour du prélèvement</span><select class="input" name="day">' + days + '</select></label>' +
      '<label class="field" id="month-field"' + (yearly ? '' : ' hidden') + '><span>Mois</span><select class="input" name="month">' + months + '</select></label></div>' +
      '<label class="field"><span>Catégorie</span><select class="input" name="category">' + cats.map(function (c) {
        return '<option' + (c === s.category ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('') + '</select></label>' +
      '<label class="field"><span>Site du service (facultatif)</span><input class="input" name="site" type="text" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" placeholder="netflix.com" value="' + esc(s.site || '') + '" data-input="sub-site">' +
      '<span class="caption">Pour afficher son logo automatiquement. Seul le nom du site est envoyé à DuckDuckGo pour récupérer l\'icône.</span></label>' +
      '<label class="field"><span>Essai gratuit jusqu\'au (facultatif)</span><input class="input" name="trialEnd" type="date" value="' + esc(s.trialEnd || '') + '">' +
      '<span class="caption">Rien n\'est compté avant cette date, et les rappels te préviennent pour résilier à temps.</span></label>' +
      '<div class="field"><span>État</span><div class="segmented" role="radiogroup" aria-label="État de l\'abonnement">' +
      '<label class="seg-opt"><input type="radio" name="paused" value="no"' + (s.paused ? '' : ' checked') + '><span>Actif</span></label>' +
      '<label class="seg-opt"><input type="radio" name="paused" value="yes"' + (s.paused ? ' checked' : '') + '><span>En pause</span></label></div>' +
      '<span class="caption">En pause, il reste dans ta liste mais n\'est plus compté ni rappelé.</span></div>';
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-sub" data-id="' + esc(id) + '">Supprimer cet abonnement</button>';
    openSheet(isNew ? 'Nouvel abonnement' : 'Modifier l\'abonnement', body, isNew ? 'Ajouter' : 'Enregistrer', function (data) {
      var name = (data.name || '').trim();
      var amount = parseAmount(data.amount);
      if (!name) return 'Donne un nom à cet abonnement.';
      if (amount === null || amount <= 0) return 'Indique un montant, par exemple 9,99.';
      var site = '';
      if ((data.site || '').trim()) {
        site = normalizeSite(data.site);
        if (!site) return 'Indique un site comme netflix.com, ou laisse le champ vide.';
      }
      var freq = data.frequency === 'year' ? 'year' : 'month';
      var item = {
        id: isNew ? uid() : id, name: name, amount: amount,
        day: parseInt(data.day, 10) || 1,
        frequency: freq,
        month: freq === 'year' ? Math.min(11, Math.max(0, parseInt(data.month, 10) || 0)) : (s.month || 0),
        category: data.category || 'Autre', site: site, image: sheetDraft.image,
        trialEnd: isIsoDate(data.trialEnd) ? data.trialEnd : '',
        paused: data.paused === 'yes'
      };
      if (isNew) state.subs.push(item);
      else state.subs = state.subs.map(function (x) { return x.id === id ? item : x; });
      toast(item.paused && !(s.paused) && !isNew ? 'Abonnement mis en pause' : isNew ? 'Abonnement ajouté' : 'Abonnement modifié');
    }, del);
  }

  function editCat(id) {
    var c = state.categories.filter(function (x) { return x.id === id; })[0];
    var isNew = !c;
    c = c || { name: '', amount: 0 };
    var body = '<p class="caption">Une catégorie réserve une part de ton salaire pour une dépense régulière : alimentation, soins, essence…</p>' +
      '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="40" autocomplete="off" placeholder="Alimentation" value="' + esc(c.name) + '"></label>' +
      amountField('amount', 'Budget par mois (€)', c.amount);
    if (!isNew) {
      // Les dépenses du mois dans cette catégorie, les plus récentes d'abord.
      var k = monthKey(today());
      var list = state.expenses.filter(function (x) { return x.cat === id && x.date.slice(0, 7) === k; })
        .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      body += '<div class="field"><span>Dépensé en ' + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(today()) + ' : ' + euro(spentIn(id)) + '</span><div class="group">' +
        list.map(function (x) {
          return '<div class="row"><span class="row-main"><span class="row-title">' + (x.note ? esc(x.note) : 'Dépense') + '</span><span class="row-meta"><span>' + shortDate.format(parseIso(x.date)) + '</span></span></span>' +
            '<span class="row-amount">' + euro(x.amount) + '</span><button type="button" class="icon-btn sm" aria-label="Supprimer cette dépense" data-action="delete-exp" data-id="' + esc(x.id) + '" data-cat="' + esc(id) + '">' + icon('close') + '</button></div>';
        }).join('') +
        '<button type="button" class="row row-link" data-action="add-exp-in" data-id="' + esc(id) + '">' + icon('plus') + 'Ajouter une dépense</button></div></div>';
    }
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-cat" data-id="' + esc(id) + '">Supprimer cette catégorie</button>';
    openSheet(isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie', body, isNew ? 'Ajouter' : 'Enregistrer', function (data) {
      var name = (data.name || '').trim();
      var amount = parseAmount(data.amount);
      if (!name) return 'Donne un nom à cette catégorie.';
      if (amount === null) return 'Indique un montant, par exemple 150,00.';
      var item = { id: isNew ? uid() : id, name: name, amount: amount };
      if (isNew) state.categories.push(item);
      else state.categories = state.categories.map(function (x) { return x.id === id ? item : x; });
    }, del);
  }

  // ---------- Simulation « Et si… » ----------
  // Rien n'est enregistré tant qu'on ne touche pas « Appliquer ».

  function whatIf() {
    var active = state.subs.filter(function (s) { return !s.paused; });
    var body = '<p class="pill-info" id="wi-out" aria-live="polite"></p><div id="wi-goals"></div>' +
      '<div class="field-row">' + amountField('salary', 'Salaire (€)', state.salary) + amountField('savings', 'Épargne par mois (€)', state.savings) + '</div>' +
      (active.length ? '<div class="field"><span>Abonnements gardés</span><div class="group">' + active.map(function (s) {
        return '<label class="row pick">' + subTile(s) + '<span class="row-main"><span class="row-title">' + esc(s.name) + '</span></span>' +
          '<span class="row-amount">' + priceLabel(s) + '</span><input type="checkbox" name="keep-' + esc(s.id) + '" checked aria-label="Garder ' + esc(s.name) + '"></label>';
      }).join('') + '</div></div>' : '') +
      '<p class="caption">Change un montant ou décoche un abonnement pour voir l\'effet. Rien n\'est enregistré tant que tu n\'appliques pas.</p>';
    var apply = '<button type="button" class="btn btn-block" data-action="whatif-apply">Appliquer ces changements</button>';
    openSheet('Et si…', body, 'Fermer', null, apply);
    sheetForm.dataset.kind = 'whatif';
    previewWhatIf();
  }

  function readWhatIf() {
    var data = {};
    new FormData(sheetForm).forEach(function (v, k) { data[k] = v; });
    var salary = parseAmount(data.salary || '0');
    var savings = parseAmount(data.savings || '0');
    var kept = state.subs.filter(function (s) { return !s.paused && data['keep-' + s.id]; });
    var dropped = state.subs.filter(function (s) { return !s.paused && !data['keep-' + s.id]; });
    return { salary: salary === null ? state.salary : salary, savings: savings === null ? state.savings : savings, kept: kept, dropped: dropped };
  }

  function previewWhatIf() {
    var out = document.getElementById('wi-out');
    if (!out) return;
    var w = readWhatIf();
    var now = totals();
    var sim = totals({ salary: w.salary, savings: w.savings, subs: w.kept });
    var diff = sim.free - now.free;
    var perYear = w.dropped.reduce(function (a, s) { return a + (s.frequency === 'year' ? s.amount : s.amount * 12); }, 0);
    out.innerHTML = '<span class="muted">Il te resterait</span><span class="strong"' + (sim.free < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(sim.free) + '</span>' +
      (Math.abs(diff) >= 0.01 ? '<span class="' + (diff > 0 ? 'ok' : 'soon') + '">' + (diff > 0 ? '+ ' : '− ') + euro(Math.abs(diff)) + ' par mois</span>' : '<span class="muted">comme aujourd\'hui</span>');
    // Si l'argent gagné va aux objectifs : combien de mois en moins.
    var lines = [];
    if (perYear > 0) lines.push(euro(perYear) + ' économisés sur un an en arrêtant ' + w.dropped.map(function (s) { return esc(s.name); }).join(', ') + '.');
    if (diff > 0) {
      state.goals.forEach(function (g) {
        var p = goalPlan(g);
        if (p.done || p.monthly <= 0 || lines.length > 3) return;
        var faster = Math.max(1, Math.ceil(p.missing / (p.monthly + diff)));
        if (faster < p.left) lines.push('En le mettant sur « ' + esc(g.name) + ' » : atteint en ' + durationLabel(faster) + ' au lieu de ' + durationLabel(p.left) + '.');
      });
    }
    document.getElementById('wi-goals').innerHTML = lines.length ? '<p class="caption">' + lines.join('<br>') + '</p>' : '';
  }

  function applyWhatIf() {
    var w = readWhatIf();
    var msg = 'Appliquer ces changements ?' + (w.dropped.length ? '\nLes abonnements décochés seront mis en pause (pas supprimés).' : '');
    if (!window.confirm(msg)) return;
    state.salary = w.salary;
    state.savings = w.savings;
    w.dropped.forEach(function (s) { s.paused = true; });
    closeSheet(); save(); render();
    toast('Changements appliqués');
  }

  // ---------- Notifications ----------

  function notify(title, body, tag) {
    var opts = { body: body, tag: tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      return navigator.serviceWorker.ready.then(function (reg) { return reg.showNotification(title, opts); });
    }
    try { new Notification(title, opts); } catch (e) { /* certains navigateurs refusent hors service worker */ }
    return Promise.resolve();
  }

  function checkReminders() {
    var r = state.settings.reminders;
    if (!r.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    var t = today();
    var keep = {};
    var changed = false;
    upcoming().forEach(function (u) {
      var when = u.diff === r.daysBefore ? 'before' : (r.sameDay && u.diff === 0 ? 'day' : null);
      if (!when) return;
      var key = u.sub.id + ':' + iso(u.date) + ':' + when;
      keep[key] = true;
      if (state.notified[key]) return;
      state.notified[key] = iso(t);
      changed = true;
      notify(u.sub.name + ' · ' + euro(u.sub.amount),
        when === 'day' ? "Prélèvement prévu aujourd'hui." : 'Prélèvement ' + (u.diff === 1 ? 'demain' : 'dans ' + u.diff + ' jours') + ', le ' + shortDate.format(u.date) + '.',
        key);
    });
    // Fin d'un essai gratuit : le moment de résilier si on ne veut pas le garder.
    state.subs.forEach(function (s) {
      if (s.paused || !s.trialEnd) return;
      var diff = diffDays(parseIso(s.trialEnd), t);
      var when = diff === r.daysBefore ? 'trial-before' : (r.sameDay && diff === 0 ? 'trial-day' : null);
      if (!when) return;
      var key = s.id + ':' + s.trialEnd + ':' + when;
      keep[key] = true;
      if (state.notified[key]) return;
      state.notified[key] = iso(t);
      changed = true;
      notify('Fin de l\'essai ' + s.name,
        (diff === 0 ? 'Ton essai gratuit se termine aujourd\'hui' : 'Ton essai gratuit se termine ' + (diff === 1 ? 'demain' : 'dans ' + diff + ' jours')) +
        '. Ensuite : ' + euro(s.amount) + (s.frequency === 'year' ? ' par an' : ' par mois') + '. Pense à résilier si tu ne le gardes pas.',
        key);
    });
    Object.keys(state.notified).forEach(function (k) {
      if (!keep[k] && diffDays(t, new Date(state.notified[k])) > 40) { delete state.notified[k]; changed = true; }
    });
    if (changed) save();
  }

  function toggleReminders() {
    var r = state.settings.reminders;
    var sw = document.querySelector('[data-action="toggle-reminders"]');
    if (r.enabled) {
      r.enabled = false;
      save();
      flipSwitch(sw, render);
      return;
    }
    if (!('Notification' in window)) return toast('Notifications indisponibles ici');
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') {
        toast('Autorise les notifications dans les réglages du téléphone');
        return;
      }
      r.enabled = true;
      save();
      flipSwitch(sw, function () { render(); checkReminders(); });
    });
  }

  // ---------- Sauvegarde ----------

  function exportData() {
    var data = JSON.parse(JSON.stringify(state));
    delete data.notified;
    data.meta.lastExport = iso(today());
    var name = 'finy-sauvegarde-' + iso(today()) + '.json';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var file;
    try { file = new File([blob], name, { type: 'application/json' }); } catch (e) { file = null; }
    var done = function () {
      state.meta.lastExport = iso(today());
      save(); render();
      toast('Sauvegarde exportée');
    };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Sauvegarde Finy' }).then(done, function () {});
      return;
    }
    done();
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { return toast("Ce fichier n'est pas une sauvegarde Finy"); }
      if (!data || typeof data !== 'object' || (!('salary' in data) && !('subs' in data))) return toast("Ce fichier n'est pas une sauvegarde Finy");
      if (!window.confirm('Remplacer tes données actuelles par cette sauvegarde ?')) return;
      state = merge(defaults(), data);
      save(); applyTheme(); render();
      toast('Sauvegarde importée');
    };
    reader.readAsText(file);
  }

  // Recadre au carré et redessine l'image : le fichier d'origine (et ses métadonnées) n'est jamais gardé.
  function squareImage(file, size, done) {
    if (!file || !/^image\//.test(file.type)) return toast('Choisis une image');
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      var side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      done(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = function () { URL.revokeObjectURL(url); toast("Impossible de lire cette image"); };
    img.src = url;
  }

  function setPhoto(file) {
    squareImage(file, 256, function (data) {
      state.profile.photo = data;
      save(); render();
    });
  }

  function refreshDraftTile() {
    var holder = document.getElementById('draft-tile');
    if (holder) holder.innerHTML = subTile(sheetDraft, 'tile-lg');
    var rm = sheetForm.querySelector('[data-action="sub-image-remove"]');
    if (rm) rm.hidden = !sheetDraft.image;
  }

  // ---------- Import : relevé bancaire (CSV) et facture (PDF) ----------
  // Le fichier est lu sur l'appareil : rien n'est envoyé.

  // Services connus : nom affiché, site (pour le logo) et catégorie. Les plus précis d'abord.
  var KNOWN = [
    [/netflix/, 'Netflix', 'netflix.com', 'Streaming'],
    [/spotify/, 'Spotify', 'spotify.com', 'Streaming'],
    [/deezer/, 'Deezer', 'deezer.com', 'Streaming'],
    [/disney/, 'Disney+', 'disneyplus.com', 'Streaming'],
    [/canal ?\+|canalplus|canal plus/, 'Canal+', 'canalplus.com', 'Streaming'],
    [/crunchyroll/, 'Crunchyroll', 'crunchyroll.com', 'Streaming'],
    [/youtube/, 'YouTube Premium', 'youtube.com', 'Streaming'],
    [/prime ?video|amazon ?prime|amzn ?prime/, 'Amazon Prime', 'amazon.fr', 'Streaming'],
    [/apple ?music/, 'Apple Music', 'apple.com', 'Streaming'],
    [/icloud/, 'iCloud+', 'icloud.com', 'Logiciels'],
    [/apple\.com\/bill|apple ?com ?bill|itunes/, 'Apple', 'apple.com', 'Logiciels'],
    [/google ?one/, 'Google One', 'one.google.com', 'Logiciels'],
    [/openai|chatgpt/, 'ChatGPT', 'openai.com', 'Logiciels'],
    [/anthropic|claude\.ai/, 'Claude', 'claude.ai', 'Logiciels'],
    [/discord/, 'Discord', 'discord.com', 'Jeux'],
    [/xbox|game ?pass/, 'Xbox Game Pass', 'xbox.com', 'Jeux'],
    [/playstation|sony interactive/, 'PlayStation Plus', 'playstation.com', 'Jeux'],
    [/nintendo/, 'Nintendo Switch Online', 'nintendo.com', 'Jeux'],
    [/microsoft|office ?365/, 'Microsoft 365', 'microsoft.com', 'Logiciels'],
    [/adobe/, 'Adobe', 'adobe.com', 'Logiciels'],
    [/notion/, 'Notion', 'notion.so', 'Logiciels'],
    [/dropbox/, 'Dropbox', 'dropbox.com', 'Logiciels'],
    [/free ?mobile|free ?telecom|freebox/, 'Free', 'free.fr', 'Téléphonie'],
    [/sosh/, 'Sosh', 'sosh.fr', 'Téléphonie'],
    [/orange/, 'Orange', 'orange.fr', 'Téléphonie'],
    [/\bsfr\b/, 'SFR', 'sfr.fr', 'Téléphonie'],
    [/bouygues|b ?and ?you/, 'Bouygues Telecom', 'bouyguestelecom.fr', 'Téléphonie'],
    [/basic ?fit/, 'Basic-Fit', 'basic-fit.com', 'Sport'],
    [/fitness ?park/, 'Fitness Park', 'fitnesspark.fr', 'Sport'],
    [/navigo|ratp/, 'Navigo', 'iledefrance-mobilites.fr', 'Transport']
  ];

  // Virements, recharges, remboursements : jamais des abonnements.
  var NOT_A_SUB = /^(a |to |from |de |a partir de|recharge|top.?up|virement|vir |payment from|transfer|retrait|withdrawal|remboursement|refund|salaire)/;

  // Minuscules sans accents, pour comparer des libellés.
  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function knownService(text) {
    var t = fold(text);
    for (var i = 0; i < KNOWN.length; i++) {
      if (KNOWN[i][0].test(t)) return { name: KNOWN[i][1], site: KNOWN[i][2], category: KNOWN[i][3] };
    }
    return null;
  }

  // « PRLV SEPA CRUNCHYROLL 12/10 REF 8823 » → « crunchyroll »
  function cleanLabel(label) {
    return fold(label)
      .replace(/\d{1,2}[\/.\-]\d{1,2}([\/.\-]\d{2,4})?/g, ' ')
      .replace(/\b(prlv|prelevement|prelev|sepa|facture|paiement|carte|cb|achat|du|le|par|ech|echeance|ref|mandat|ics|rum)\b/g, ' ')
      .replace(/x\d{2,}|\*+\S*|#\S+|\b\d{3,}\b/g, ' ')
      .replace(/[^a-z0-9.&+' -]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function monthIndex(word) {
    var w = fold(word).replace(/\.$/, '');
    if (/^(juil|jul)/.test(w)) return 6;
    if (/^(juin|jun)/.test(w)) return 5;
    var map = { jan: 0, fev: 1, feb: 1, mar: 2, avr: 3, apr: 3, mai: 4, may: 4, aou: 7, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    return w.length >= 3 && map[w.slice(0, 3)] !== undefined ? map[w.slice(0, 3)] : -1;
  }

  // Dates d'export bancaire : 2026-10-12, 12/10/2026, 12.10.26, « 12 oct. 2026 ».
  function parseDate(str) {
    var t = fold(str).trim(), m;
    var make = function (y, mo, d) {
      return mo >= 0 && mo <= 11 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100 ? new Date(y, mo, d) : null;
    };
    if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return make(+m[1], +m[2] - 1, +m[3]);
    if ((m = t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/))) return make(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
    if ((m = t.match(/^(\d{1,2})(?:er)? ([a-z]+)\.? (\d{4})\b/))) return make(+m[3], monthIndex(m[2]), +m[1]);
    return null;
  }

  // « -6,99€ », « 1 234,56 », « 1,234.56 », « (6.99) » → nombre signé.
  function parseMoney(str) {
    var t = String(str || '').replace(/[\s  €$£]|eur/gi, '');
    if (!t) return null;
    var neg = /^-|-$|^\(.*\)$/.test(t);
    t = t.replace(/[()+-]/g, '');
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/,/g, '');
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    var n = Math.round(parseFloat(t) * 100) / 100;
    return neg ? -n : n;
  }

  // Les banques françaises exportent souvent en Windows-1252 plutôt qu'en UTF-8.
  function decodeText(buf) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1252').decode(buf); }
  }

  function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    var probe = text.split(/\r?\n/).slice(0, 40).join('\n').replace(/"[^"]*"/g, '');
    var sep = [';', ',', '\t'].sort(function (a, b) { return probe.split(b).length - probe.split(a).length; })[0];
    var rows = [], row = [], cell = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (quoted) {
        if (ch !== '"') cell += ch;
        else if (text[i + 1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else if (ch === '"') quoted = true;
      else if (ch === sep) { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell.trim()); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
    return rows;
  }

  // Reconnaît une ligne d'en-tête (Revolut, BNP, Caisse d'Épargne, PayPal…) et repère ses colonnes.
  function headerCols(row, next) {
    var f = row.map(fold), c = {}, labels = [];
    f.forEach(function (h, i) {
      if (c.date == null && /^date/.test(h)) c.date = i;
      else if (/libelle|description|^nom$|^name$|beneficiaire|^detail|marchand|merchant|tiers|intitule/.test(h)) labels.push(i);
      else if (c.amount == null && /montant|amount|argent entrant|^brut$|^gross$|somme/.test(h)) c.amount = i;
      else if (c.debit == null && /debit/.test(h)) c.debit = i;
      else if (c.credit == null && /credit/.test(h)) c.credit = i;
    });
    if (c.date == null || !labels.length || (c.amount == null && c.debit == null)) return null;
    // Plusieurs colonnes de libellé (« Libellé court », « Libellé opération ») : on garde la plus détaillée.
    var avg = function (i) { return next.reduce(function (a, r) { return a + (r[i] || '').length; }, 0); };
    c.label = labels.sort(function (a, b) { return avg(b) - avg(a); })[0];
    return c;
  }

  function readRow(r, c) {
    var date = parseDate(r[c.date] || '');
    if (!date) return null;
    var amount;
    if (c.amount != null) amount = parseMoney(r[c.amount]);
    else {
      var d = parseMoney(r[c.debit]), cr = c.credit != null ? parseMoney(r[c.credit]) : null;
      amount = d === null && cr === null ? null : Math.abs(cr || 0) - Math.abs(d || 0);
    }
    return amount === null ? null : { date: date, label: r[c.label] || '', amount: amount };
  }

  // Paiements au même nom, au même montant (±10 %), qui reviennent chaque mois ou chaque année.
  function findRecurring(tx) {
    var groups = {};
    tx.forEach(function (t) {
      if (!(t.amount < 0) || NOT_A_SUB.test(fold(t.label).trim())) return;
      var known = knownService(t.label);
      var clean = cleanLabel(t.label);
      var key = known ? known.name : clean.split(' ').slice(0, 3).join(' ');
      if (!key) return;
      (groups[key] = groups[key] || { known: known, clean: clean, items: [] }).items.push({ date: t.date, amount: -t.amount });
    });
    var out = [];
    Object.keys(groups).forEach(function (key) {
      var g = groups[key];
      var items = g.items.sort(function (a, b) { return a.date - b.date; }).filter(function (it, i, arr) {
        return i === 0 || diffDays(it.date, arr[i - 1].date) > 0;
      });
      if (items.length < 2) return;
      var amounts = items.map(function (it) { return it.amount; }).sort(function (a, b) { return a - b; });
      var mid = amounts[Math.floor(amounts.length / 2)];
      if (amounts[amounts.length - 1] - amounts[0] > Math.max(1, mid * 0.1)) return;
      var gaps = items.slice(1).map(function (it, i) { return diffDays(it.date, items[i].date); });
      var freq = null;
      if (gaps.every(function (d) { return d >= 350 && d <= 380; })) freq = 'year';
      else if (gaps.some(function (d) { return d <= 35; }) && gaps.every(function (d) {
        var k = Math.round(d / 30.44);
        return k >= 1 && k <= 3 && Math.abs(d - k * 30.44) <= 5;
      })) freq = 'month';
      if (!freq) return;
      var last = items[items.length - 1];
      out.push({
        name: g.known ? g.known.name : g.clean.split(' ').slice(0, 4).map(cap).join(' '),
        site: g.known ? g.known.site : '',
        category: g.known ? g.known.category : 'Autre',
        amount: last.amount, day: last.date.getDate(), month: last.date.getMonth(),
        frequency: freq, count: items.length, image: null
      });
    });
    return out.sort(function (a, b) { return b.amount - a.amount; });
  }

  // L'abonnement déjà enregistré qui correspond à un paiement trouvé, s'il y en a un.
  function existingSub(c) {
    var n = fold(c.name);
    return state.subs.filter(function (s) {
      var m = fold(s.name);
      return m.length >= 3 && n.length >= 3 && (m.indexOf(n) >= 0 || n.indexOf(m) >= 0);
    })[0] || null;
  }

  function importStatement(text) {
    var rows = parseCsv(text);
    var tx = [], cols = null;
    rows.forEach(function (r, i) {
      var h = headerCols(r, rows.slice(i + 1, i + 16));
      if (h) { cols = h; return; }
      var t = cols && readRow(r, cols);
      if (t) tx.push(t);
    });
    if (!tx.length) return askColumns(rows);
    showFound(findRecurring(tx));
  }

  // Relevé dans un format inconnu : on demande quelle colonne contient quoi.
  function askColumns(rows) {
    var start = -1;
    rows.some(function (r, i) { if (r.some(function (c) { return parseDate(c); })) { start = i; return true; } return false; });
    if (start < 0) return toast("Ce fichier ne ressemble pas à un relevé bancaire");
    var sample = rows[start];
    var head = start > 0 ? rows[start - 1] : [];
    var guess = { date: -1, label: -1, amount: -1 };
    sample.forEach(function (c, i) {
      if (guess.date < 0 && parseDate(c)) guess.date = i;
      else if (guess.amount < 0 && parseMoney(c) !== null) guess.amount = i;
      else if (parseMoney(c) === null && (guess.label < 0 || c.length > sample[guess.label].length)) guess.label = i;
    });
    var select = function (name, label) {
      return '<label class="field"><span>' + label + '</span><select class="input" name="' + name + '">' + sample.map(function (c, i) {
        var title = head[i] && !parseDate(head[i]) ? head[i] : 'Colonne ' + (i + 1);
        return '<option value="' + i + '"' + (i === guess[name] ? ' selected' : '') + '>' + esc(title + (c ? ' · ' + c.slice(0, 24) : '')) + '</option>';
      }).join('') + '</select></label>';
    };
    var body = '<p class="caption">Finy ne reconnaît pas ce relevé. Indique quelle colonne contient quoi.</p>' +
      select('date', 'Date') + select('label', 'Libellé') + select('amount', 'Montant');
    openSheet('Colonnes du relevé', body, 'Continuer', function (d) {
      var cols = { date: +d.date, label: +d.label, amount: +d.amount };
      var tx = rows.slice(start).map(function (r) { return readRow(r, cols); }).filter(Boolean);
      // La feuille se ferme juste après : on ouvre la suivante une fois fermée.
      setTimeout(function () { showFound(findRecurring(tx)); }, 0);
    });
  }

  function showFound(found) {
    if (!found.length) {
      openSheet('Aucun abonnement trouvé', '<p class="muted">Finy n\'a pas trouvé de paiement qui revient chaque mois ou chaque année au même montant.</p>' +
        '<p class="caption">Il faut au moins deux prélèvements par abonnement. Essaie avec un relevé qui couvre plusieurs mois.</p>', 'Fermer', null);
      return;
    }
    // Un abonnement déjà enregistré dont le dernier prélèvement n'a plus le même prix : on propose de le mettre à jour.
    found.forEach(function (c) {
      c.have = existingSub(c);
      c.change = c.have && c.have.frequency === c.frequency && Math.abs(c.have.amount - c.amount) >= 0.01;
    });
    found.sort(function (a, b) { return (b.change ? 1 : 0) - (a.change ? 1 : 0); });
    var changes = found.filter(function (c) { return c.change; }).length;
    var body = '<p class="caption">Ces paiements reviennent au même montant. Décoche ceux qui ne sont pas des abonnements.' +
      (changes ? ' Les changements de prix sont en haut : coche-les pour mettre Finy à jour.' : '') + '</p><div class="group">' +
      found.map(function (c, i) {
        if (c.change) {
          var up = c.amount > c.have.amount;
          return '<label class="row tall pick">' + subTile(c.have) +
            '<span class="row-main"><span class="row-title">' + esc(c.have.name) + '</span><span class="row-meta"><span class="' + (up ? 'soon' : 'ok') + '">' +
            (up ? 'Hausse' : 'Baisse') + ', avant ' + euro(c.have.amount) + '</span></span></span>' +
            '<span class="row-amount">' + priceLabel(c) + '</span><input type="checkbox" name="upd-' + i + '" checked aria-label="Mettre à jour le prix de ' + esc(c.have.name) + '"></label>';
        }
        var meta = (c.have ? 'Déjà dans Finy · ' : '') + (c.frequency === 'year' ? 'Annuel' : 'Mensuel') + ' · le ' + c.day + ' · vu ' + c.count + ' fois';
        return '<label class="row tall pick">' + subTile(c) +
          '<span class="row-main"><span class="row-title">' + esc(c.name) + '</span><span class="row-meta"><span>' + meta + '</span></span></span>' +
          '<span class="row-amount">' + priceLabel(c) + '</span><input type="checkbox" name="pick-' + i + '"' + (c.have ? '' : ' checked') + ' aria-label="Ajouter ' + esc(c.name) + '"></label>';
      }).join('') + '</div>';
    var n = found.length;
    openSheet(n + ' abonnement' + (n > 1 ? 's trouvés' : ' trouvé'), body, 'Valider la sélection', function (data) {
      var picked = found.filter(function (c, i) { return data['pick-' + i]; });
      var updated = found.filter(function (c, i) { return data['upd-' + i]; });
      if (!picked.length && !updated.length) return 'Coche au moins un abonnement.';
      picked.forEach(function (c) {
        state.subs.push({ id: uid(), name: c.name, amount: c.amount, day: c.day, frequency: c.frequency, month: c.month, category: c.category, site: c.site, image: null, trialEnd: '', paused: false });
      });
      updated.forEach(function (c) { c.have.amount = c.amount; });
      var msg = [];
      if (picked.length) msg.push(picked.length + ' abonnement' + (picked.length > 1 ? 's ajoutés' : ' ajouté'));
      if (updated.length) msg.push(updated.length + ' prix mis à jour');
      toast(msg.join(', '));
    });
  }

  // pdf.js (environ 1,4 Mo) n'est chargé qu'au premier PDF, puis gardé hors ligne par le service worker.
  var pdfReady = null;
  function loadPdfJs() {
    if (!pdfReady) {
      pdfReady = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'vendor/pdfjs/pdf.min.js';
        s.onload = function () {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        };
        s.onerror = function () { pdfReady = null; reject(); };
        document.head.appendChild(s);
      });
    }
    return pdfReady;
  }

  function pdfText(buf) {
    return loadPdfJs().then(function (lib) {
      return lib.getDocument({ data: buf, isEvalSupported: false }).promise;
    }).then(function (doc) {
      var pages = [];
      for (var i = 1; i <= Math.min(doc.numPages, 10); i++) {
        pages.push(doc.getPage(i).then(function (p) { return p.getTextContent(); }).then(function (tc) {
          return tc.items.map(function (it) { return it.str + (it.hasEOL ? '\n' : ' '); }).join('');
        }));
      }
      return Promise.all(pages).then(function (p) { return p.join('\n'); });
    });
  }

  var MONEY_RE = /-?\d{1,3}(?:[ .  ]\d{3})*[,.]\d{2}(?!\d)/g;
  var DATE_RE = /\b\d{1,2}(?:er)?(?:[\/.\-]\d{1,2}[\/.\-]\d{2,4}| [a-z]{3,9}\.? \d{4})\b/g;

  // Un relevé en PDF : une ligne par opération, qui commence par une date et contient un montant.
  function statementLines(text) {
    return text.split('\n').map(function (line) {
      var l = fold(line).replace(/[ \t  ]+/g, ' ').trim();
      var date = parseDate(l);
      if (!date) return null;
      // Les dates retirées d'abord : « 12.10.26 » ressemble sinon à un montant.
      var rest = l.replace(DATE_RE, ' ');
      var money = rest.match(MONEY_RE);
      if (!money) return null;
      var label = rest.slice(0, rest.indexOf(money[0])).replace(/\s+/g, ' ').trim();
      // Le sens (débit ou crédit) se perd souvent dans un PDF : sans signe, on le compte comme une dépense.
      var n = parseMoney(money[0]);
      return label && n !== null ? { date: date, label: label, amount: n > 0 ? -n : n } : null;
    }).filter(Boolean);
  }

  // Une facture : on cherche le service, le montant total, la fréquence et la date.
  function readInvoice(text) {
    var f = fold(text).replace(/[ \t  ]+/g, ' ');
    var out = {};
    var known = knownService(f);
    if (known) { out.name = known.name; out.site = known.site; out.category = known.category; }
    else {
      var counts = {};
      (f.match(/\b[a-z0-9-]+\.(com|fr|net|io|tv|app|ai|co|eu|org)\b/g) || []).forEach(function (d) {
        if (!/^(gmail|outlook|hotmail|yahoo|icloud|paypal|stripe|example)\./.test(d)) counts[d] = (counts[d] || 0) + 1;
      });
      var site = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      if (site) { out.site = site; out.name = cap(site.split('.')[0]); }
    }
    // Montant : le plus grand près de « total », « à payer », « montant »… sinon le plus grand avec un €.
    var best = null, bestKey = null, m;
    var re = /(€|eur\b)?\s?(\d{1,3}(?:[ .]\d{3})*[,.]\d{2})(?!\d)\s?(€|eur\b)?/g;
    while ((m = re.exec(f))) {
      if (!m[1] && !m[3]) continue;
      var n = parseMoney(m[2]);
      if (!n) continue;
      var before = f.slice(Math.max(0, m.index - 50), m.index);
      if (/total|a payer|montant|ttc|preleve|amount due|charged/.test(before) && !/tva|vat|\bht\b|hors taxe/.test(before.slice(-15))) {
        if (bestKey === null || n > bestKey) bestKey = n;
      }
      if (best === null || n > best) best = n;
    }
    if (bestKey !== null || best !== null) out.amount = bestKey !== null ? bestKey : best;
    out.frequency = /annuel|par an\b|\/ ?an\b|12 mois|yearly|annual|per year|\/ ?year/.test(f) ? 'year' : 'month';
    var dates = (f.match(DATE_RE) || []).map(parseDate).filter(Boolean);
    if (dates.length) { out.day = dates[0].getDate(); out.month = dates[0].getMonth(); }
    return out;
  }

  function importPdf(buf) {
    toast('Lecture du PDF…');
    pdfText(buf).then(function (text) {
      if (text.replace(/\s/g, '').length < 20) return toast('Ce PDF est une image scannée : Finy ne peut pas le lire');
      var lines = statementLines(text);
      var found = lines.length >= 8 ? null : readInvoice(text);
      if (found && !found.name && !found.amount) return toast("Finy n'a rien trouvé dans ce PDF");
      if (!found) return showFound(findRecurring(lines));
      editSub(null, found);
      toast('Vérifie les infos avant d\'ajouter');
    }, function () { toast('Impossible de lire ce PDF'); });
  }

  function importFile(file) {
    var isPdf = /pdf$/i.test(file.type) || /\.pdf$/i.test(file.name);
    // Le fichier a pu être choisi depuis la feuille « Nouvel abonnement » : on la ferme avant d'en ouvrir une autre.
    closeSheet();
    var reader = new FileReader();
    reader.onload = function () {
      if (isPdf) importPdf(reader.result);
      else importStatement(decodeText(reader.result));
    };
    reader.onerror = function () { toast('Impossible de lire ce fichier'); };
    reader.readAsArrayBuffer(file);
  }

  // ---------- Message ----------

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  // ---------- Événements ----------

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.dataset.action;
    var id = el.dataset.id;
    var v = el.dataset.value;
    switch (a) {
      case 'add-sub': return editSub(null);
      case 'edit-sub': return editSub(id);
      case 'add-cat': return editCat(null);
      case 'edit-cat': return editCat(id);
      case 'edit-salary': return editSalary();
      case 'add-goal': return editGoal(null);
      case 'edit-goal': return editGoal(id);
      case 'delete-goal':
        if (!window.confirm('Supprimer cet objectif ?')) return;
        state.goals = state.goals.filter(function (g) { return g.id !== id; });
        closeSheet(); save(); render(); toast('Objectif supprimé');
        return;
      case 'sheet-close': return closeSheet();
      case 'delete-sub':
        if (!window.confirm('Supprimer cet abonnement ?')) return;
        state.subs = state.subs.filter(function (s) { return s.id !== id; });
        closeSheet(); save(); render(); toast('Abonnement supprimé');
        return;
      case 'delete-cat':
        if (!window.confirm('Supprimer cette catégorie et ses dépenses ?')) return;
        state.categories = state.categories.filter(function (c) { return c.id !== id; });
        state.expenses = state.expenses.filter(function (x) { return x.cat !== id; });
        closeSheet(); save(); render();
        return;
      case 'add-exp': return editExpense();
      case 'add-exp-in': return editExpense(id);
      case 'delete-exp':
        state.expenses = state.expenses.filter(function (x) { return x.id !== id; });
        save(); render(); toast('Dépense supprimée');
        return editCat(el.dataset.cat);
      case 'add-income': return editIncome(null);
      case 'edit-income': return editIncome(id);
      case 'delete-income':
        if (!window.confirm('Supprimer ce revenu ?')) return;
        state.incomes = state.incomes.filter(function (i) { return i.id !== id; });
        closeSheet(); save(); render(); toast('Revenu supprimé');
        return;
      case 'goal-deposit': return depositGoal(id);
      case 'whatif': return whatIf();
      case 'whatif-apply': return applyWhatIf();
      case 'backup-later':
        state.meta.backupSnooze = iso(today());
        save(); return render();
      case 'go-reminders':
        ui.focusAfter = 'rappels';
        if (currentRoute() === 'reglages') render(); else location.hash = '#/reglages';
        return;
      case 'abos-filter':
        ui.abosFilter = v;
        document.querySelectorAll('.chip[data-action="abos-filter"]').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.value === v)); });
        playEnter(document.getElementById('abos-list'), 'list-enter');
        return fillAbosList();
      case 'cal-prev': ui.calOffset--; ui.calSel = null; return render();
      case 'cal-next': ui.calOffset++; ui.calSel = null; return render();
      case 'cal-today': ui.calOffset = 0; ui.calSel = today().getDate(); return render();
      case 'cal-day': ui.calSel = parseInt(el.dataset.day, 10); return render();
      case 'sv-step':
        state.savings = Math.max(0, Math.round((state.savings + parseFloat(v)) * 100) / 100);
        save(); return fillSavings();
      case 'sv-preset':
        state.savings = parseFloat(v);
        save(); return fillSavings();
      case 'set':
        if (el.dataset.key === 'theme') { state.settings.theme = v; applyTheme(); }
        if (el.dataset.key === 'homeCount') state.settings.homeCount = parseInt(v, 10);
        if (el.dataset.key === 'annualMode') state.settings.annualMode = v === 'smooth' ? 'smooth' : 'actual';
        save(); return render();
      case 'step':
        var key = el.dataset.key;
        var target = key === 'alertDays' ? state.settings : state.settings.reminders;
        target[key] = Math.min(30, Math.max(1, target[key] + parseInt(v, 10)));
        save(); return render();
      case 'toggle-reminders': return toggleReminders();
      case 'toggle-sameday':
        state.settings.reminders.sameDay = !state.settings.reminders.sameDay;
        save(); return flipSwitch(el, render);
      case 'test-notif':
        if (!('Notification' in window) || Notification.permission !== 'granted') return toast('Autorise d\'abord les notifications');
        notify('Finy', 'Les rappels fonctionnent. Finy te préviendra avant tes prélèvements.', 'finy-test');
        return;
      case 'sub-image-remove':
        sheetDraft.image = null;
        return refreshDraftTile();
      case 'remove-photo':
        state.profile.photo = null;
        save(); return render();
      case 'export': return exportData();
      case 'reload': return location.reload();
    }
  });

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (sheetForm.dataset.kind === 'goal' && sheetForm.contains(el)) return previewGoal();
    if (sheetForm.dataset.kind === 'whatif' && sheetForm.contains(el)) return previewWhatIf();
    switch (el.dataset.input) {
      case 'abos-q':
        ui.abosQuery = el.value;
        return fillAbosList();
      case 'sv-input':
        var n = parseAmount(el.value);
        state.savings = n === null ? 0 : n;
        save();
        return fillSavings(true);
      case 'sub-name':
        sheetDraft.name = el.value;
        return refreshDraftTile();
      case 'sub-site':
        sheetDraft.site = normalizeSite(el.value) || '';
        return refreshDraftTile();
      case 'name':
        state.profile.name = el.value.slice(0, 40);
        save();
        var h = document.querySelector('.profile .heading');
        if (h) h.textContent = state.profile.name || 'Ton profil';
        return;
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (sheetForm.dataset.kind === 'whatif' && sheetForm.contains(el)) previewWhatIf();
    if (el.dataset.input === 'sv-input') fillSavings();
    if (el.dataset.input === 'sub-freq') {
      var year = el.value === 'year';
      document.getElementById('amount-label').textContent = year ? 'Montant par an (€)' : 'Montant par mois (€)';
      document.getElementById('month-field').hidden = !year;
    }
    if (el.dataset.input === 'photo' && el.files && el.files[0]) setPhoto(el.files[0]);
    if (el.dataset.input === 'sub-image' && el.files && el.files[0]) {
      squareImage(el.files[0], 160, function (data) { sheetDraft.image = data; refreshDraftTile(); });
      el.value = '';
    }
    if (el.dataset.input === 'import' && el.files && el.files[0]) { importData(el.files[0]); el.value = ''; }
    if (el.dataset.input === 'statement' && el.files && el.files[0]) { importFile(el.files[0]); el.value = ''; }
  });

  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { render(); checkReminders(); }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', render);
  }

  // ---------- Démarrage ----------

  applyTheme();
  // Enregistre la photo du mois dans l'historique dès l'ouverture.
  if (state.salary > 0) save();
  render();
  checkReminders();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
