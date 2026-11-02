/* Finy — web app. Toutes les données restent dans le navigateur (localStorage). */
(function () {
  'use strict';

  // ---------- Constantes ----------

  var STORE_KEY = 'finy:v1';
  var SUB_CATEGORIES = ['Streaming', 'Logiciels', 'Téléphonie', 'Sport', 'Jeux', 'Transport', 'Maison', 'Autre'];
  var BILL_CATEGORIES = ['Logement', 'Énergie', 'Assurance', 'Crédit', 'Impôts', 'Santé', 'Autre'];
  var CAT_PALETTE = ['var(--chart-3)', 'var(--chart-4)', 'var(--ink)', 'var(--muted)'];
  var SUB_PALETTE = ['var(--accent)', 'var(--chart-3)', 'var(--chart-4)', 'var(--ink)'];

  // Configuration guidée du premier lancement : étapes, besoins et choix proposés.
  // Une étape liée à un besoin (OB_STEP_NEED) n'apparaît que si ce besoin a été choisi.
  var OB_STEPS = ['welcome', 'name', 'needs', 'salary', 'bills', 'subs', 'envs', 'savings', 'goal', 'remind', 'prefs', 'recap', 'done'];
  var OB_STEP_NEED = { subs: 'subs', envs: 'budget', savings: 'save', goal: 'save', remind: 'remind' };
  var OB_OPTIONAL = { name: 1, bills: 1, subs: 1, envs: 1, savings: 1, goal: 1, remind: 1, prefs: 1 };
  var OB_NEEDS = [
    ['subs', 'card', 'Suivre mes abonnements', 'Netflix, forfait, salle de sport… et leurs dates'],
    ['budget', 'receipt', 'Tenir un budget', 'Courses, essence, sorties : une enveloppe par poste'],
    ['save', 'piggy', 'Mettre de l\'argent de côté', 'Une épargne chaque mois, un objectif à atteindre'],
    ['remind', 'bell', 'Ne plus rater un prélèvement', 'Un rappel quelques jours avant']
  ];
  // [clé, nom, catégorie, jour habituel]
  var OB_BILLS = [
    ['loyer', 'Loyer', 'Logement', 5],
    ['energie', 'Électricité et gaz', 'Énergie', 10],
    ['assurance', 'Assurance habitation', 'Assurance', 8],
    ['mutuelle', 'Mutuelle', 'Santé', 3],
    ['credit', 'Crédit', 'Crédit', 5],
    ['impots', 'Impôts', 'Impôts', 15]
  ];
  // [clé, nom, site, catégorie, prix indicatif par mois]
  var OB_SUBS = [
    ['netflix', 'Netflix', 'netflix.com', 'Streaming', 14.99],
    ['spotify', 'Spotify', 'spotify.com', 'Streaming', 11.12],
    ['disney', 'Disney+', 'disneyplus.com', 'Streaming', 9.99],
    ['prime', 'Amazon Prime', 'amazon.fr', 'Streaming', 6.99],
    ['deezer', 'Deezer', 'deezer.com', 'Streaming', 11.99],
    ['youtube', 'YouTube Premium', 'youtube.com', 'Streaming', 12.99],
    ['canal', 'Canal+', 'canalplus.com', 'Streaming', 24.99],
    ['icloud', 'iCloud+', 'icloud.com', 'Logiciels', 0.99],
    ['chatgpt', 'ChatGPT', 'openai.com', 'Logiciels', 22.99],
    ['mobile', 'Forfait mobile', '', 'Téléphonie', 15],
    ['box', 'Box internet', '', 'Téléphonie', 30],
    ['sport', 'Salle de sport', '', 'Sport', 29.99]
  ];
  // [clé, nom, budget proposé par mois]
  var OB_ENVS = [
    ['courses', 'Alimentation', 300],
    ['essence', 'Essence', 100],
    ['sorties', 'Sorties', 80],
    ['shopping', 'Shopping', 60],
    ['sante', 'Santé', 30],
    ['animaux', 'Animaux', 40],
    ['cadeaux', 'Cadeaux', 30]
  ];
  // [clé, nom, montant proposé (null : trois mois de salaire), durée en mois]
  var OB_GOALS = [
    ['coussin', 'Coussin de sécurité', null, 24],
    ['voyage', 'Voyage', 1500, 12],
    ['voiture', 'Voiture', 5000, 36],
    ['permis', 'Permis', 1500, 12],
    ['autre', '', 1000, 12]
  ];
  var OB_LIST = { bills: OB_BILLS, subs: OB_SUBS, envs: OB_ENVS };

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
    card: 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M7 15h4',
    calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
    piggy: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 7v10M15 9.5c-.5-1-1.6-1.5-3-1.5c-1.7 0-3 .8-3 2s1.3 1.7 3 2s3 .8 3 2s-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5',
    down: 'M6 9l6 6 6-6',
    backspace: 'M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM12 9l6 6M18 9l-6 6',
    sliders: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    target: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2a1 1 0 0 0 0-2z'
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
      meta: { since: null, lastExport: null, backupSnooze: null, onboarded: null, firstSteps: null },
      onboarding: null,
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
        paused: s.paused === true,
        kind: s.kind === 'bill' ? 'bill' : 'sub'
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
        open: g.open === true,
        monthly: Math.max(0, num(g.monthly, 0)),
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
        out.history[k] = { income: num(h.income, 0), saved: num(h.saved, 0), subs: num(h.subs, 0), bills: num(h.bills, 0), cats: num(h.cats, 0), spent: num(h.spent, -1), free: num(h.free, 0) };
      });
    }
    var meta = data.meta || {};
    ['since', 'lastExport', 'backupSnooze', 'onboarded', 'firstSteps'].forEach(function (k) { out.meta[k] = isIsoDate(meta[k]) ? meta[k] : null; });
    out.onboarding = sanitizeOb(data.onboarding);
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
      return true;
    } catch (e) {
      toast("Impossible d'enregistrer sur cet appareil");
      return false;
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
      state.history[monthKey(t)] = { income: r(tt.income), saved: r(state.savings + tt.goals), subs: r(tt.subs), bills: r(tt.bills), cats: r(tt.cats), spent: r(tt.spent), free: r(tt.free) };
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
  var ui = { abosKind: 'sub', abosFilter: 'Tous', abosQuery: '', bilanMetric: 'free', bilanMonth: null, bilanAll: false, calOffset: 0, calSel: null, focusAfter: null, counts: {}, homeOpen: null };

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

  function isBill(s) { return s.kind === 'bill'; }

  // Abonnements ou charges fixes (loyer, énergie, assurance…) : même fonctionnement, comptés à part.
  function ofKind(kind, list) { return (list || state.subs).filter(function (s) { return (kind === 'bill') === isBill(s); }); }

  function yearTotal(kind) {
    return ofKind(kind).reduce(function (a, s) { return a + (s.paused ? 0 : s.frequency === 'year' ? s.amount : s.amount * 12); }, 0);
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
  // Sans échéance (`open`), c'est l'inverse : le montant par mois est choisi (ou nul) et la date de fin en découle.
  function goalPlan(g) {
    var t = today();
    var k = monthKey(t);
    var paid = g.deposits.reduce(function (a, d) { return a + (d.m === k ? d.amount : 0); }, 0);
    var before = Math.max(0, g.saved - paid);
    var missing = Math.max(0, g.target - before);
    var left, monthly, end;
    if (g.open) {
      left = g.monthly > 0 && missing > 0 ? Math.ceil(missing / g.monthly) : 0;
      monthly = Math.min(g.monthly, missing);
      end = left ? new Date(t.getFullYear(), t.getMonth() + left, 1) : null;
    } else {
      var y = parseInt(g.start.slice(0, 4), 10);
      var m = parseInt(g.start.slice(5, 7), 10) - 1;
      var elapsed = (t.getFullYear() - y) * 12 + (t.getMonth() - m);
      left = Math.max(1, g.months - Math.max(0, elapsed));
      monthly = missing > 0 ? Math.ceil(missing / left * 100) / 100 : 0;
      end = new Date(y, m + g.months, 1);
    }
    return {
      left: left,
      missing: Math.max(0, g.target - g.saved),
      done: g.saved >= g.target,
      monthly: monthly,
      paid: paid,
      toGo: Math.max(0, Math.min(monthly - paid, g.target - g.saved)),
      progress: g.target > 0 ? Math.min(1, g.saved / g.target) : 1,
      end: end
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
    var cost = function (a, s) { return a + costThisMonth(s); };
    var subs = ofKind('sub', o.subs).reduce(cost, 0);
    var bills = ofKind('bill', o.subs).reduce(cost, 0);
    var cats = state.categories.reduce(function (a, c) { return a + catCost(c); }, 0);
    var catSpent = state.categories.reduce(function (a, c) { return a + spentIn(c.id); }, 0);
    var goals = goalsMonthly();
    var income = salary + extras;
    var rest = income - savings - goals - subs - bills;
    var free = rest - cats;
    // Ce qui est vraiment libre (catégories déjà réservées), réparti sur les jours du mois en cours.
    var t = today();
    return { income: income, extras: extras, subs: subs, bills: bills, spent: subs + bills + catSpent, cats: cats, goals: goals, rest: rest, free: free, weekly: Math.max(0, free) * 7 / daysIn(t.getFullYear(), t.getMonth()) };
  }

  // Prévision de fin de mois : les catégories où l'on a dépensé suivent le rythme actuel,
  // les autres comptent leur budget entier. Rien avant le 5 du mois (trop tôt pour un rythme).
  function forecast() {
    var t = today();
    var day = t.getDate(), n = daysIn(t.getFullYear(), t.getMonth());
    if (state.salary <= 0 || !state.categories.length || day < 5) return null;
    var any = false;
    var proj = state.categories.reduce(function (a, c) {
      var spent = spentIn(c.id);
      if (spent > 0) any = true;
      return a + (spent > 0 ? Math.max(spent, spent / day * n) : c.amount);
    }, 0);
    if (!any) return null;
    var budget = state.categories.reduce(function (a, c) { return a + c.amount; }, 0);
    // Catégorie qui part le plus vite au-dessus de son budget, pour l'expliquer.
    var worst = null;
    state.categories.forEach(function (c) {
      var spent = spentIn(c.id);
      var p = spent / day * n;
      if (spent > 0 && p > c.amount && (!worst || p - c.amount > worst.over)) worst = { name: c.name, over: p - c.amount, proj: p };
    });
    return { end: totals().rest - proj, proj: proj, budget: budget, lastDay: n, worst: worst };
  }

  function forecastLine(f) {
    return 'À ce rythme, il te restera environ <span class="strong"' + (f.end < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(Math.round(f.end)) + '</span> le ' + f.lastDay + '.' +
      (f.worst ? ' ' + esc(f.worst.name) + ' file vers ' + euro(Math.round(f.worst.proj)) + '.' : '');
  }

  function yearlyCount(kind) {
    return (kind ? ofKind(kind) : state.subs).filter(function (s) { return s.frequency === 'year' && !s.paused; }).length;
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

  // Accueil. Téléphone : montant sur le fond, actions rondes, répartition en 5 groupes qui se déplient,
  // enveloppes, à venir, mois par mois. Ordinateur (≥ 960 px, voir styles.css) : en-tête avec les ajouts,
  // anneau de répartition, chiffres clés et enveloppes en cartes à gauche ; à venir et mois par mois à droite.
  function viewHome() {
    var t = totals();
    var html = '<header class="topbar a-top"><span class="logo">' + LOGO + 'finy</span>' +
      '<a href="#/reglages" class="icon-btn" aria-label="Ouvrir les réglages">' + avatarInner() + '</a></header>';

    html += '<header class="home-head"><div><p class="label">' + cap(longDay.format(today())) + '</p>' +
      '<h1 class="title">Bonjour' + (state.profile.name ? ' ' + esc(state.profile.name) : '') + '</h1></div>' +
      '<div class="home-head-actions">' +
      '<button type="button" class="btn" data-action="add-sub">' + icon('card') + 'Abonnement</button>' +
      '<button type="button" class="btn" data-action="add-income">' + icon('trend') + 'Revenu</button>' +
      '<button type="button" class="btn" data-action="whatif">' + icon('sliders') + 'Et si…</button>' +
      '<button type="button" class="btn btn-primary" data-action="add-exp">' + icon('plus') + 'Dépense</button></div></header>';

    if (state.salary <= 0) {
      html += '<section class="hero a-hero home-welcome"><p class="label">Bienvenue' + (state.profile.name ? ' ' + esc(state.profile.name) : '') + '</p>' +
        '<h1 class="title">Commence par ton salaire</h1>' +
        '<p class="muted">Finy calcule ensuite ce qu\'il te reste chaque mois, après ton épargne et tes abonnements.</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="edit-salary" style="margin-top:16px">Indiquer mon salaire</button></section>';
    } else {
      // Le montant mis en avant est ce qui est vraiment libre : catégories comprises.
      var f = forecast();
      html += '<section class="hero a-hero home-hero" aria-label="Ce qu\'il te reste"><p class="label">Il te reste ce mois-ci</p>' + hero(t.free, 'free') +
        '<div class="pills"><p class="pill-info"><span class="strong">' + euro(t.weekly) + '</span><span class="muted">cette semaine</span></p>' +
        (f ? '<p class="pill-info" title="' + esc(forecastLine(f).replace(/<[^>]+>/g, '')) + '">' + icon('trend', 'pill-ic') + '<span class="strong"' + (f.end < 0 ? ' style="color:var(--danger)"' : '') + '>≈ ' + euro(Math.round(f.end)) + '</span><span class="muted">le ' + f.lastDay + '</span></p>' : '') +
        '</div>' + (f && f.worst ? '<p class="caption">' + esc(f.worst.name) + ' file vers ' + euro(Math.round(f.worst.proj)) + '.</p>' : '') + '</section>';
    }
    html += backupNotice() ? '<div class="home-notice">' + backupNotice() + '</div>' : '';

    html += '<section class="actions a-actions" aria-label="Actions rapides">' +
      action('add-exp', 'receipt', 'Dépense') + action('add-sub', 'plus', 'Abonnement') +
      action('add-income', 'trend', 'Revenu') + action('whatif', 'sliders', 'Et si…') + '</section>';

    var colA = firstSteps(), colB = '';
    if (state.salary > 0) colA += homeSplit(t) + homeStats(t);
    colA += homeEnvelopes();

    var next = upcoming().slice(0, state.settings.homeCount);
    colB += '<section class="section a-side"><div class="section-head"><h2 class="heading">À venir</h2><a href="#/calendrier" class="label" style="color:var(--accent)">Calendrier</a></div><div class="group">' +
      (next.length ? next.map(function (u) { return subRow(u, false); }).join('')
        : '<div class="empty"><span>Aucun abonnement pour l\'instant.</span><button type="button" class="link-btn" data-action="add-sub">Ajouter mon premier abonnement</button></div>') +
      '</div></section>' + historySection();

    return html + '<div class="home-col home-col-a">' + colA + '</div><div class="home-col home-col-b">' + colB + '</div>';
  }

  // Les 5 groupes de la répartition, avec leur détail.
  function homeGroups(t) {
    var goalItems = state.goals.map(function (g) {
      var p = goalPlan(g);
      return p.monthly > 0 ? { name: g.name, value: p.monthly, href: '#/epargne' } : null;
    }).filter(Boolean);
    var subItems = function (kind) {
      return ofKind(kind).filter(function (s) { return costThisMonth(s) > 0; }).map(function (s) {
        return { name: s.name, value: costThisMonth(s), act: 'edit-sub', id: s.id };
      }).sort(function (a, b) { return b.value - a.value; });
    };
    var groups = [
      { id: 'epargne', name: t.goals > 0 ? 'Épargne et objectifs' : 'Épargne', color: 'var(--accent)', value: state.savings + t.goals,
        items: (state.savings > 0 ? [{ name: 'Épargne mensuelle', value: state.savings, href: '#/epargne' }] : []).concat(goalItems),
        more: '<a class="row row-sub-link row-link" href="#/epargne">Voir l\'épargne' + icon('right') + '</a>' },
      { id: 'fixes', name: 'Charges fixes', color: 'var(--chart-5)', value: t.bills, items: subItems('bill'),
        more: '<button type="button" class="row row-sub-link row-link" data-action="' + (ofKind('bill').length ? 'go-abos" data-value="bill">Toutes les charges fixes' : 'add-bill">Ajouter une charge fixe') + icon('right') + '</button>' },
      { id: 'abos', name: 'Abonnements', color: 'var(--chart-2)', value: t.subs, items: subItems('sub'),
        more: '<button type="button" class="row row-sub-link row-link" data-action="go-abos" data-value="sub">Tous les abonnements' + icon('right') + '</button>' },
      { id: 'depenses', name: 'Dépenses courantes', color: 'var(--chart-3)', value: t.cats,
        items: state.categories.map(function (c) { return { name: c.name, value: catCost(c), act: 'edit-cat', id: c.id }; }),
        more: '<button type="button" class="row row-sub-link row-link" data-action="add-cat">Ajouter une enveloppe' + icon('plus') + '</button>' },
      { id: 'libre', name: 'Libre', color: 'var(--ink)', value: t.free, items: [] }
    ];
    return groups.filter(function (g) { return g.id === 'libre' || g.value > 0 || g.items.length; });
  }

  // Répartition : barre fine + groupes dépliables (téléphone) ; anneau + même liste dans une carte (ordinateur).
  function homeSplit(t) {
    var groups = homeGroups(t);
    if (ui.homeOpen && !groups.some(function (g) { return g.id === ui.homeOpen && g.items.length; })) ui.homeOpen = null;
    var open = ui.homeOpen;
    var total = groups.reduce(function (a, g) { return a + Math.max(0, g.value); }, 0) || 1;
    var aria = groups.filter(function (g) { return g.value > 0; }).map(function (g) { return g.name + ' ' + euro(g.value); }).join(', ');

    // Anneau : un conic-gradient avec un fin espace entre les parts ; les parts non choisies s'estompent.
    var stops = [];
    var acc = 0;
    groups.forEach(function (g) {
      if (g.value <= 0) return;
      var a = acc / total * 100;
      acc += g.value;
      var b = acc / total * 100;
      var col = !open || open === g.id ? g.color : 'color-mix(in srgb, ' + g.color + ' 22%, transparent)';
      stops.push('transparent ' + a.toFixed(2) + '% ' + (a + 0.35).toFixed(2) + '%', col + ' ' + (a + 0.35).toFixed(2) + '% ' + (b - 0.35).toFixed(2) + '%', 'transparent ' + (b - 0.35).toFixed(2) + '% ' + b.toFixed(2) + '%');
    });
    var sel = groups.filter(function (g) { return g.id === open; })[0];
    var ring = '<div class="ring"><div class="ring-chart" role="img" aria-label="' + esc(aria) + '" style="background:conic-gradient(' + stops.join(', ') + ')"></div>' +
      '<div class="ring-center"><span class="label">' + (sel ? esc(sel.name) : 'Il te reste') + '</span>' +
      hero(sel ? sel.value : t.free, sel ? null : 'ring') +
      (sel && t.income > 0 ? '<span class="caption">' + Math.round(Math.max(0, sel.value) / t.income * 100) + ' % de tes revenus</span>' : '') + '</div></div>';

    var rows = groups.map(function (g) {
      var isOpen = open === g.id;
      var pct = t.income > 0 ? Math.round(Math.max(0, g.value) / t.income * 100) : 0;
      var n = g.items.length;
      var main = '<span class="dot" style="--c:' + g.color + '" aria-hidden="true"></span>' +
        '<span class="row-main"><span class="row-title' + (g.id === 'libre' ? ' strong' : '') + '">' + esc(g.name) + '</span>' +
        '<span class="row-meta"><span>' + (n ? n + (n > 1 ? ' postes' : ' poste') + ' · ' + pct + ' %' : pct + ' % de tes revenus') + '</span></span></span>' +
        '<span class="row-amount"' + (g.value < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(g.value) + '</span>';
      if (!n) return '<div class="hgroup"><div class="row">' + main + '<span class="chev-space" aria-hidden="true"></span></div></div>';
      return '<div class="hgroup' + (isOpen ? ' open' : '') + '"><button type="button" class="row" data-action="home-group" data-value="' + g.id + '" aria-expanded="' + isOpen + '">' +
        main + icon('down', 'chev') + '</button>' +
        (isOpen ? '<div class="hgroup-items">' + g.items.map(function (it) {
          var inner = '<span class="row-main"><span class="row-title">' + esc(it.name) + '</span></span><span class="row-amount">' + euro(it.value) + '</span>';
          return it.href ? '<a class="row row-sub" href="' + it.href + '">' + inner + '</a>'
            : '<button type="button" class="row row-sub" data-action="' + it.act + '" data-id="' + esc(it.id) + '">' + inner + '</button>';
        }).join('') + (g.more || '') + '</div>' : '') + '</div>';
    }).join('');

    var bar = splitBar(groups.map(function (g) { return { name: g.name, value: Math.max(0, g.value), color: g.color }; }), aria);

    return '<section class="section home-split"><div class="section-head"><h2 class="heading">Répartition</h2>' +
      '<button type="button" class="link-btn label" data-action="edit-salary">' + (t.extras > 0 ? 'Revenus ' + euro(t.income) : 'Salaire ' + euro(state.salary)) + '</button></div>' +
      bar + ring + '<div class="group home-groups">' + rows + '</div>' +
      (t.rest < 0 ? '<p class="alert">Tes dépenses fixes dépassent tes revenus. Baisse ton épargne, allonge un objectif ou mets un abonnement en pause.</p>'
        : t.free < 0 ? '<p class="alert">Tes enveloppes dépassent ce qu\'il te reste ce mois-ci.</p>' : '') +
      '</section>';
  }

  // Chiffres clés (ordinateur) : semaine, fin de mois, part mise de côté.
  function homeStats(t) {
    var f = forecast();
    var rate = t.income > 0 ? Math.round((state.savings + t.goals) / t.income * 100) : 0;
    var tile = function (ic, color, value, label) {
      return '<div class="stat home-stat"><span class="home-stat-ic" style="color:' + color + '">' + icon(ic) + '</span>' +
        '<span class="stat-val">' + value + '</span><span class="caption">' + label + '</span></div>';
    };
    return '<section class="home-stats" aria-label="Chiffres clés">' +
      tile('calendar', 'var(--accent)', euro(t.weekly), 'pour te faire plaisir cette semaine') +
      (f ? tile('trend', 'var(--chart-3)', '≈ ' + euro(Math.round(f.end)), 'prévus le ' + f.lastDay + ' au soir')
        : tile('trend', 'var(--chart-3)', euro(t.income), 'de revenus ce mois-ci')) +
      tile('piggy', 'var(--chart-4)', rate + ' %', 'de tes revenus mis de côté') + '</section>';
  }

  // Enveloppes de dépenses : lignes avec barre (téléphone), cartes avec anneau (ordinateur).
  function homeEnvelopes() {
    var cats = state.categories;
    var planned = cats.reduce(function (a, c) { return a + c.amount; }, 0);
    var rows = cats.map(function (c, i) {
      var spent = spentIn(c.id);
      var over = spent > c.amount;
      var pct = c.amount > 0 ? Math.min(1, spent / c.amount) : (spent > 0 ? 1 : 0);
      var meta = over ? '<span class="soon">Dépassé de ' + euro(spent - c.amount) + '</span>'
        : spent > 0 ? '<span>Reste ' + euro(c.amount - spent) + '</span>' : '<span>Rien de dépensé ce mois-ci</span>';
      return '<button type="button" class="row tall goal env" data-action="edit-cat" data-id="' + esc(c.id) + '">' +
        '<span class="env-ring" style="--p:' + (pct * 100).toFixed(1) + ';--c:' + (over ? 'var(--warning)' : 'var(--accent)') + '" aria-hidden="true"></span>' +
        '<span class="row-main"><span class="row-title">' + esc(c.name) + '</span>' +
        '<span class="goal-bar' + (over ? ' over' : '') + '" aria-hidden="true"><span style="width:' + (pct * 100).toFixed(1) + '%"></span></span>' +
        '<span class="row-meta">' + meta + '</span></span>' +
        '<span class="row-amount">' + euro(spent) + '<small class="per"> / ' + euro(c.amount) + '</small></span></button>';
    }).join('');
    return '<section class="section home-env"><div class="section-head"><h2 class="heading">Mes enveloppes</h2>' +
      (cats.length ? '<span class="label">' + euro(planned) + ' prévus</span>' : '') + '</div>' +
      (cats.length ? '<div class="group env-list">' + rows + '</div>' +
        '<div class="env-actions"><button type="button" class="link-btn" data-action="add-exp">' + icon('plus') + 'Ajouter une dépense</button>' +
        '<button type="button" class="link-btn" style="color:var(--muted)" data-action="add-cat">Nouvelle enveloppe</button></div>'
        : '<div class="group"><div class="empty"><span>Aucune enveloppe pour l\'instant.</span><span class="caption">Réserve une part de ton salaire pour l\'alimentation, l\'essence, les sorties…</span>' +
          '<button type="button" class="link-btn" data-action="add-cat">Créer une enveloppe</button></div></div>') +
      '</section>';
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

  var METRICS = { free: 'Libre', saved: 'Épargné', subs: 'Abonnements', bills: 'Charges fixes' };

  // Les mois enregistrés parmi les `count` derniers, du plus ancien au plus récent.
  function historyMonths(count) {
    var t = today();
    var months = [];
    for (var i = count - 1; i >= 0; i--) {
      var d = new Date(t.getFullYear(), t.getMonth() - i, 1);
      var h = state.history[monthKey(d)];
      if (h) months.push({ d: d, h: h, k: monthKey(d), now: i === 0 });
    }
    return months;
  }

  // Barres mois par mois pour une mesure (libre, épargné…), avec l'écart au mois d'avant.
  // Chaque barre se touche : le mois choisi (`sel`, le mois en cours sinon) est mis en avant et détaillé dans le Bilan.
  function historyChart(count, metric, sel) {
    var months = historyMonths(count);
    if (months.length < 2) return '';
    var name = METRICS[metric];
    if (!months.some(function (x) { return x.k === sel; })) sel = months[months.length - 1].k;
    var max = months.reduce(function (a, x) { return Math.max(a, Math.abs(x.h[metric] || 0)); }, 0) || 1;
    // Au-delà de 8 mois, les barres sont étroites : initiale du mois, et le montant passe sous le graphique.
    var dense = months.length > 8;
    var short = new Intl.DateTimeFormat('fr-FR', { month: dense ? 'narrow' : 'short' });
    var selD = parseIso(sel + '-01');
    var prevH = state.history[monthKey(new Date(selD.getFullYear(), selD.getMonth() - 1, 1))];
    var cur = state.history[sel][metric] || 0;
    var delta = prevH ? cur - (prevH[metric] || 0) : null;
    var isNow = sel === monthKey(today());
    return '<div class="bars" role="group" aria-label="' + esc(name + ' mois par mois') + '">' +
      months.map(function (x) {
        var v = x.h[metric] || 0;
        var hgt = Math.max(2, Math.abs(v) / max * 100);
        return '<button type="button" class="bar' + (x.k === sel ? ' now' : '') + (v < 0 ? ' neg' : '') + '" data-action="hist-month" data-value="' + x.k + '" aria-pressed="' + (x.k === sel) + '" aria-label="' + esc(cap(monthName.format(x.d)) + ' · ' + name + ' : ' + euro(v)) + '">' +
          (dense ? '' : '<span class="bar-val">' + (x.k === sel ? euro(v) : '') + '</span>') + '<span class="bar-col"><i style="height:' + hgt.toFixed(1) + '%"></i></span>' +
          '<span class="bar-m">' + esc(short.format(x.d).replace('.', '')) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="caption hist-note">' + (dense ? '<span class="strong" style="color:var(--ink)">' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(selD)) + ' : ' + euro(cur) + '.</span> ' : '') +
      (delta === null ? '' : Math.abs(delta) < 1 ? (isNow ? 'Comme le mois dernier.' : 'Comme le mois d\'avant.') : (delta > 0 ? '+ ' : '− ') + euro(Math.abs(delta)) + (isNow ? ' par rapport au mois dernier.' : ' par rapport au mois d\'avant.')) + '</p>';
  }

  // Détail d'un mois enregistré (Bilan) : la photo du mois, les revenus en plus et les dépenses par enveloppe.
  function monthDetail(k) {
    var h = state.history[k];
    if (!h) return '';
    var d = parseIso(k + '-01');
    var extras = state.incomes.filter(function (i) { return i.month === k; });
    var byCat = {};
    state.expenses.forEach(function (x) { if (x.date.slice(0, 7) === k) byCat[x.cat] = (byCat[x.cat] || 0) + x.amount; });
    var catRows = state.categories.map(function (c, i) {
      return byCat[c.id] ? calcRow(esc(c.name) + ' (dépensé)', euro(byCat[c.id]), CAT_PALETTE[i % CAT_PALETTE.length]) : '';
    }).join('');
    return '<div class="section-head"><h3 class="heading">' + cap(monthName.format(d)) + '</h3>' +
      (k === monthKey(today()) ? '<span class="label">En cours</span>' : '') + '</div>' +
      '<div class="group">' +
      calcRow('Revenus', euro(h.income), 'var(--ink)') +
      extras.map(function (i) { return calcRow('dont ' + esc(i.name), '+ ' + euro(i.amount), 'var(--ink)'); }).join('') +
      calcRow('Mis de côté', '− ' + euro(h.saved), 'var(--accent)') +
      (h.bills > 0 ? calcRow('Charges fixes', '− ' + euro(h.bills), 'var(--chart-5)') : '') +
      calcRow('Abonnements', '− ' + euro(h.subs), 'var(--chart-2)') +
      (h.cats > 0 ? calcRow('Enveloppes', '− ' + euro(h.cats), 'var(--chart-3)') : '') + catRows +
      '<div class="row"><span class="dot" style="--c:var(--ink)" aria-hidden="true"></span><span class="row-main"><span class="strong">Libre</span></span>' +
      '<span class="row-amount"' + (h.free < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(h.free) + '</span></div></div>';
  }

  // Les 6 derniers mois sur l'accueil : ce qui est resté libre.
  function historySection() {
    var chart = historyChart(6, 'free');
    if (!chart) return '';
    return '<section class="section a-hist"><div class="section-head"><h2 class="heading">Mois par mois</h2><a href="#/bilan" class="label" style="color:var(--accent)">Bilan</a></div>' +
      '<div class="group hist">' + chart + '</div></section>';
  }

  // Détail des objectifs en cours, sous la ligne « Objectifs ».
  function goalRows() {
    return state.goals.map(function (g) {
      var p = goalPlan(g);
      if (p.missing <= 0 || p.monthly <= 0) return '';
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
    var bill = ui.abosKind === 'bill';
    var mine = ofKind(ui.abosKind);
    var amount = bill ? t.bills : t.subs;
    var html = '<header class="topbar a-top"><h1 class="title">' + (bill ? 'Charges fixes' : 'Abonnements') + '</h1>' +
      '<button type="button" class="btn btn-primary" data-action="' + (bill ? 'add-bill' : 'add-sub') + '">' + icon('plus') + 'Ajouter</button></header>';

    var smooth = state.settings.annualMode === 'smooth';
    var yc = yearlyCount(ui.abosKind);
    var smoothPart = mine.filter(function (s) { return s.frequency === 'year' && !s.paused; }).reduce(function (a, s) { return a + s.amount / 12; }, 0);
    var pausedCount = mine.filter(function (s) { return s.paused; }).length;
    var monthWord = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(today());
    var noun = bill ? ' charge' : ' abonnement';
    html += '<section class="hero a-hero" aria-label="Total">' +
      '<div class="segmented kind-switch" role="radiogroup" aria-label="Afficher">' +
      '<button type="button" role="radio" aria-checked="' + !bill + '" data-action="abos-kind" data-value="sub">Abonnements</button>' +
      '<button type="button" role="radio" aria-checked="' + bill + '" data-action="abos-kind" data-value="bill">Charges fixes</button></div>' +
      (yc ? '<p class="label">' + (smooth ? 'Par mois, annuels lissés' : 'Prélevé en ' + monthWord) + '</p>' : '') +
      '<p class="amount-big"><span data-count="abos-' + ui.abosKind + '" data-kind="big" data-value="' + amount + '">' + euro(amount) + '</span><small>/mois</small></p>' +
      '<p class="label" style="font-weight:400">' + euro(yearTotal(ui.abosKind)) + ' sur un an · ' + mine.length + noun + (mine.length > 1 ? 's' : '') +
      (yc && smooth ? ', dont ' + euro(smoothPart) + ' pour ' + yc + ' annuel' + (yc > 1 ? 's' : '') : '') +
      (pausedCount ? ' · ' + pausedCount + ' en pause' : '') + '</p>';
    if (yc) {
      var nx = nextYearly();
      html += segmented('annualMode', [['actual', 'Ce mois-ci'], ['smooth', 'Lissé']], state.settings.annualMode, 'Compter les paiements annuels', true) +
        (!smooth && nx ? '<p class="pill-info"><span class="soon-dot" aria-hidden="true" style="background:var(--accent)"></span><span>' + esc(nx.sub.name) + ' : <span class="strong">' + euro(nx.sub.amount) + '</span> à prévoir en ' + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(nx.date) + '</span></p>' : '');
    }
    html += '</section>';

    if (!mine.length) {
      return html + '<div class="group a-main"><div class="empty">' + (bill
        ? '<span>Aucune charge fixe pour l\'instant.</span><span class="caption">Loyer, électricité, assurance, crédit… Ajoute ce qui part chaque mois sans être un abonnement.</span></div>' +
          '<button type="button" class="row row-link" data-action="add-bill">' + icon('plus') + 'Ajouter une charge fixe</button>'
        : '<span>Aucun abonnement pour l\'instant.</span><span class="caption">Ajoute tes paiements récurrents pour voir où part ton argent.</span></div>' + importButton('row row-link')) + '</div>';
    }

    var present = (bill ? BILL_CATEGORIES : SUB_CATEGORIES).filter(function (c) { return mine.some(function (s) { return s.category === c; }); });
    mine.forEach(function (s) { if (present.indexOf(s.category) < 0) present.push(s.category); });
    if (ui.abosFilter !== 'Tous' && present.indexOf(ui.abosFilter) < 0) ui.abosFilter = 'Tous';

    html += '<div class="section a-actions" style="gap:12px"><label class="search">' + icon('search') +
      '<span class="sr-only">Rechercher</span><input type="search" id="abos-q" placeholder="Rechercher" autocomplete="off" value="' + esc(ui.abosQuery) + '" data-input="abos-q"></label>' +
      '<div class="chips" role="group" aria-label="Filtrer par catégorie">' +
      ['Tous'].concat(present).map(function (c) {
        return '<button type="button" class="chip" data-action="abos-filter" data-value="' + esc(c) + '" aria-pressed="' + (c === ui.abosFilter) + '">' + esc(c) + '</button>';
      }).join('') + '</div></div>';

    var byCat = {};
    mine.forEach(function (s) { byCat[s.category] = (byCat[s.category] || 0) + costThisMonth(s); });
    Object.keys(byCat).forEach(function (k) { if (byCat[k] <= 0) delete byCat[k]; });
    var cats = Object.keys(byCat).map(function (k) { return { name: k, value: byCat[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var shown = cats.slice(0, 4).map(function (c, i) { return { name: c.name, value: c.value, color: SUB_PALETTE[i] }; });
    if (cats.length > 4) {
      shown.push({ name: 'Autres', value: cats.slice(4).reduce(function (a, c) { return a + c.value; }, 0), color: 'var(--chart-2)' });
    }
    if (shown.length) {
      html += '<section class="section a-side"><h2 class="heading">Par catégorie</h2>' +
        splitBar(shown, shown.map(function (c) { return c.name + ' ' + euro(c.value); }).join(', ')) +
        '<div class="legend">' + shown.map(function (c) {
          return '<div><span class="dot sm" style="--c:' + c.color + '" aria-hidden="true"></span><span class="name">' + esc(c.name) + '</span><span class="strong">' + euro(c.value) + '</span></div>';
        }).join('') + '</div></section>';
    }

    html += '<section class="section a-main"><div class="section-head"><h2 class="heading" id="abos-title"></h2><span class="label" style="font-weight:400">Par date</span></div>' +
      '<div class="group" id="abos-list"></div><div class="group">' + (bill
        ? '<button type="button" class="row row-link" data-action="add-bill">' + icon('plus') + 'Ajouter une charge fixe</button>'
        : importButton('row row-link')) + '</div></section>';
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
      return (ui.abosKind === 'bill') === isBill(u.sub) && (ui.abosFilter === 'Tous' || u.sub.category === ui.abosFilter) && (!q || u.sub.name.toLowerCase().indexOf(q) >= 0);
    });
    document.getElementById('abos-title').textContent = ui.abosFilter !== 'Tous' ? ui.abosFilter : ui.abosKind === 'bill' ? 'Toutes les charges' : 'Tous les abonnements';
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
    var svInput = document.getElementById('sv-input');
    if (!skipInput) svInput.value = plain(state.savings);
    // Le champ prend la largeur de son texte : le montant et le « € » restent centrés ensemble.
    svInput.style.width = (Math.max(2, svInput.value.length) + 0.4) + 'ch';
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
      (t.bills > 0 ? calcRow('Charges fixes', '− ' + euro(t.bills), 'var(--chart-5)') : '') +
      calcRow(yearlyCount('sub') ? (state.settings.annualMode === 'smooth' ? 'Abonnements (annuels lissés)' : 'Abonnements (ce mois-ci)') : 'Abonnements', '− ' + euro(t.subs), 'var(--chart-2)') +
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
    // Montant sans « ,00 » quand il est rond : 770 €, 3 000 €, mais 158,34 €.
    var short = function (n) { return euro(n).replace(/,00(?=\s*€)/, ''); };
    var endFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });
    var html = '<div class="goal-list">' + state.goals.map(function (g) {
      var p = goalPlan(g);
      // Où en est le versement du mois : à jour, ou ce qu'il reste à verser.
      var status = p.done ? ''
        : p.monthly <= 0 ? (g.open ? '<span class="muted">Verse quand tu veux</span>' : '')
        : p.toGo <= 0 ? '<span class="ok">✓ À jour ce mois-ci</span>'
        : '<span class="muted">Encore <span class="strong" style="color:var(--ink)">' + short(p.toGo) + '</span> <span style="white-space:nowrap">ce mois-ci</span></span>';
      return '<div class="goal-card' + (p.done ? ' done' : '') + '">' +
        '<button type="button" class="goal-main" data-action="edit-goal" data-id="' + esc(g.id) + '">' +
        '<span class="goal-top"><span class="goal-name">' + esc(g.name) + '</span>' +
        '<span class="goal-monthly">' + (p.done ? '<span class="ok">✓ Atteint</span>' : p.monthly > 0 ? short(p.monthly) + '<small>/mois</small>' : '<small>Libre</small>') + '</span></span>' +
        '<span class="goal-bar" role="img" aria-label="' + Math.round(p.progress * 100) + ' % de l\'objectif"><span style="width:' + (p.progress * 100).toFixed(1) + '%"></span></span>' +
        '<span class="goal-foot"><span><span class="strong">' + short(g.saved) + '</span> sur ' + short(g.target) + '</span>' +
        '<span>' + (p.done ? '' : !p.end ? 'Sans échéance' : (g.open ? 'vers ' : '') + endFmt.format(p.end)) + '</span></span></button>' +
        (status ? '<div class="goal-status">' + status +
          '<button type="button" class="btn btn-sm" data-action="goal-deposit" data-id="' + esc(g.id) + '">' + icon('plus') + 'Verser</button></div>' : '') +
        '</div>';
    }).join('') + '</div>';
    if (need > 0) {
      html += '<p class="caption">Au total, <span class="strong" style="color:var(--ink)">' + euro(need) + ' par mois</span>, déjà retirés de ce qu\'il te reste.</p>';
    }
    el.innerHTML = html;
  }

  function editGoal(id) {
    var g = state.goals.filter(function (x) { return x.id === id; })[0];
    var isNew = !g;
    var open = g ? g.open : false;
    var left = g && !open ? goalPlan(g).left : 12;
    var inYears = left % 12 === 0;
    var body = '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="40" autocomplete="off" placeholder="Voyage au Japon, voiture…" value="' + esc(g ? g.name : '') + '"></label>' +
      '<div class="field-row">' + amountField('target', 'Montant à atteindre (€)', g ? g.target : 0) + amountField('saved', 'Déjà de côté (€)', g ? g.saved : 0) + '</div>' +
      '<div class="field"><span>Échéance</span><div class="segmented" role="radiogroup" aria-label="Échéance">' +
      '<label class="seg-opt"><input type="radio" name="term" value="fixed"' + (open ? '' : ' checked') + '><span>Avec une durée</span></label>' +
      '<label class="seg-opt"><input type="radio" name="term" value="open"' + (open ? ' checked' : '') + '><span>Indéterminée</span></label></div></div>' +
      '<div class="field-row" id="goal-fixed"' + (open ? ' hidden' : '') + '><label class="field"><span>' + (isNew ? 'Durée' : 'Temps restant') + '</span><input class="input" name="duration" type="text" inputmode="numeric" autocomplete="off" placeholder="12" value="' + (inYears ? left / 12 : left) + '"></label>' +
      '<div class="field"><span>&nbsp;</span><div class="segmented" role="radiogroup" aria-label="Unité de durée">' +
      '<label class="seg-opt"><input type="radio" name="unit" value="month"' + (inYears ? '' : ' checked') + '><span>Mois</span></label>' +
      '<label class="seg-opt"><input type="radio" name="unit" value="year"' + (inYears ? ' checked' : '') + '><span>Ans</span></label></div></div></div>' +
      '<div id="goal-open"' + (open ? '' : ' hidden') + '>' + amountField('monthly', 'Par mois (€, facultatif)', g ? g.monthly : 0) + '</div>' +
      '<p class="pill-info" id="goal-preview" aria-live="polite"></p>';
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-goal" data-id="' + esc(id) + '">Supprimer cet objectif</button>';
    openSheet(isNew ? 'Nouvel objectif' : 'Modifier l\'objectif', body, isNew ? 'Créer l\'objectif' : 'Enregistrer', function (data) {
      var r = readGoalForm(data);
      if (typeof r === 'string') return r;
      var item = { id: isNew ? uid() : id, name: r.name, target: r.target, saved: r.saved, months: r.months, start: monthKey(today()), open: r.open, monthly: r.monthly, deposits: isNew ? [] : g.deposits };
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
  // Saisie rapide d'une dépense : écran plein sur téléphone, fenêtre centrée sur ordinateur.
  // Le montant se tape au pavé numérique intégré (ou au clavier) : pas de champ à toucher, pas de clavier système.
  var qe = null;

  function editExpense(catId) {
    if (!state.categories.length) {
      toast('Crée d\'abord une enveloppe, par exemple Alimentation');
      return editCat(null);
    }
    var last = catId || (state.expenses.length ? state.expenses[state.expenses.length - 1].cat : null);
    if (!state.categories.some(function (c) { return c.id === last; })) last = state.categories[0].id;
    qe = { kind: 'exp', s: '', cat: last, date: iso(today()), note: '', opener: document.activeElement };

    var el = document.getElementById('quick');
    el.innerHTML = '<div class="qe-panel">' +
      '<header class="qe-head">' +
      '<button type="button" class="icon-btn" data-action="qe-close" aria-label="Fermer">' + icon('close') + '</button>' +
      '<h2 class="qe-title" id="quick-title">Nouvelle dépense</h2>' +
      '<label class="qe-date"><span id="qe-date-label">Aujourd\'hui</span>' + icon('down') +
      '<input type="date" data-input="qe-date" value="' + qe.date + '" max="' + qe.date + '" aria-label="Date de la dépense"></label></header>' +
      '<div class="qe-amount-wrap"><p class="qe-amount" id="qe-amount" aria-live="polite"></p><p class="qe-hint" id="qe-hint"></p></div>' +
      '<div class="qe-cats chips" role="radiogroup" aria-label="Enveloppe">' + state.categories.map(function (c, i) {
        return '<button type="button" class="chip qe-cat" role="radio" data-action="qe-cat" data-id="' + esc(c.id) + '">' +
          '<span class="dot sm" style="--c:' + CAT_PALETTE[i % CAT_PALETTE.length] + '" aria-hidden="true"></span>' + esc(c.name) + '</button>';
      }).join('') + '</div>' +
      '<label class="qe-note"><span class="sr-only">Note</span><input type="text" maxlength="60" autocomplete="off" placeholder="Ajouter une note (courses, plein…)" data-input="qe-note"></label>' +
      '<button type="button" class="btn btn-primary btn-block qe-submit" data-action="qe-submit" disabled>Ajouter</button>' +
      '<div class="qe-pad">' + qeKeys() + '</div></div>';
    qeOpen(el);
  }

  // Revenu en plus, même saisie que la dépense : montant au pavé, puis un nom proposé ou tapé. Compté pour le mois en cours.
  var INCOME_NAMES = ['Prime', 'Remboursement', 'Petit boulot', 'Vente', 'Cadeau'];

  function addIncome() {
    qe = { kind: 'inc', s: '', note: '', opener: document.activeElement };
    var el = document.getElementById('quick');
    el.innerHTML = '<div class="qe-panel">' +
      '<header class="qe-head">' +
      '<button type="button" class="icon-btn" data-action="qe-close" aria-label="Fermer">' + icon('close') + '</button>' +
      '<h2 class="qe-title" id="quick-title">Nouveau revenu</h2>' +
      '<span class="qe-date qe-month">' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(today())) + '</span></header>' +
      '<div class="qe-amount-wrap"><p class="qe-amount" id="qe-amount" aria-live="polite"></p><p class="qe-hint" id="qe-hint"></p></div>' +
      '<div class="qe-cats chips" role="radiogroup" aria-label="Type de revenu">' + INCOME_NAMES.map(function (n) {
        return '<button type="button" class="chip qe-cat" role="radio" data-action="qe-name" data-value="' + n + '">' + n + '</button>';
      }).join('') + '</div>' +
      '<label class="qe-note"><span class="sr-only">Nom du revenu</span><input type="text" maxlength="40" autocomplete="off" placeholder="Nom du revenu (facultatif)" data-input="qe-note"></label>' +
      '<button type="button" class="btn btn-primary btn-block qe-submit" data-action="qe-submit" disabled>Ajouter</button>' +
      '<div class="qe-pad">' + qeKeys() + '</div></div>';
    qeOpen(el);
  }

  function qeKeys() {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', ','].map(function (k) {
      return '<button type="button" class="qe-key" data-action="qe-key" data-value="' + k + '">' + k + '</button>';
    }).join('') + '<button type="button" class="qe-key" data-action="qe-key" data-value="0">0</button>' +
      '<button type="button" class="qe-key" data-action="qe-back" aria-label="Effacer">' + icon('backspace') + '</button>';
  }

  function qeOpen(el) {
    el.hidden = false;
    document.body.classList.add('qe-open');
    qeUpdate();
    var first = el.querySelector('.qe-cat[aria-checked="true"]') || el.querySelector('.qe-cat');
    if (first) first.scrollIntoView({ block: 'nearest', inline: 'center' });
    el.querySelector('[data-action="qe-close"]').focus({ preventScroll: true });
  }

  function qeValue() {
    var n = parseFloat(qe.s.replace(',', '.'));
    return isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }

  // Met à jour le montant, la phrase sous le montant, l'enveloppe choisie et le bouton, sans tout redessiner.
  function qeUpdate() {
    if (!qe) return;
    var el = document.getElementById('quick');
    var parts = (qe.s || '0').split(',');
    var int = parts[0].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    var shown = int + (parts.length > 1 ? ',' + parts[1] : '');
    var amount = document.getElementById('qe-amount');
    amount.innerHTML = '<span class="qe-num' + (qe.s ? '' : ' empty') + '">' + shown + '</span><span class="qe-caret" aria-hidden="true"></span><span class="qe-cur">€</span>';
    amount.classList.toggle('long', shown.length > 7);

    var v = qeValue();
    var hint = document.getElementById('qe-hint');
    el.querySelector('.qe-submit').disabled = !(v > 0);
    if (qe.kind === 'inc') {
      var free = totals().free;
      hint.className = 'qe-hint';
      hint.textContent = v <= 0 ? 'S\'ajoute à ton salaire pour ' + monthName.format(today()) + ' seulement'
        : 'Il te restera ' + euro(free + v) + ' ce mois-ci';
      el.querySelectorAll('.qe-cat').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.value === qe.note.trim())); });
      return;
    }
    var c = state.categories.filter(function (x) { return x.id === qe.cat; })[0];
    if (c && qe.date.slice(0, 7) === monthKey(today())) {
      var after = c.amount - spentIn(c.id) - v;
      hint.className = 'qe-hint' + (after < 0 ? ' over' : '');
      hint.textContent = v <= 0 ? 'Reste ' + euro(c.amount - spentIn(c.id)) + ' en ' + c.name
        : after >= 0 ? 'Il restera ' + euro(after) + ' en ' + c.name : c.name + ' dépassé de ' + euro(-after);
    } else {
      hint.className = 'qe-hint';
      hint.textContent = c ? 'Dans ' + c.name : '';
    }

    el.querySelectorAll('.qe-cat').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.id === qe.cat)); });
    var t = today();
    var d = parseIso(qe.date);
    var diff = diffDays(t, d);
    document.getElementById('qe-date-label').textContent = diff === 0 ? 'Aujourd\'hui' : diff === 1 ? 'Hier' : shortDate.format(d);
  }

  function qeKey(k) {
    if (!qe) return;
    var s = qe.s;
    if (k === ',') {
      if (s.indexOf(',') >= 0) return;
      s = (s || '0') + ',';
    } else {
      var p = s.split(',');
      if (p.length > 1 && p[1].length >= 2) return;
      if (p.length === 1 && p[0].replace(/^0+/, '').length >= 6) return;
      s = s === '0' ? k : s + k;
    }
    qe.s = s;
    if (navigator.vibrate) navigator.vibrate(8);
    qeUpdate();
  }

  function qeBack() {
    if (!qe) return;
    qe.s = qe.s.slice(0, -1);
    qeUpdate();
  }

  function qeClose() {
    var el = document.getElementById('quick');
    el.hidden = true;
    el.innerHTML = '';
    document.body.classList.remove('qe-open');
    var back = qe && qe.opener;
    qe = null;
    if (back && back.focus) back.focus({ preventScroll: true });
  }

  function qeSubmit() {
    if (!qe) return;
    var v = qeValue();
    if (!(v > 0)) return;
    if (qe.kind === 'inc') {
      state.incomes.push({ id: uid(), name: qe.note.trim().slice(0, 40) || 'Revenu', amount: v, month: monthKey(today()) });
      qeClose();
      save();
      render();
      return toast('+ ' + euro(v) + ' · il te reste ' + euro(totals().free));
    }
    var date = isIsoDate(qe.date) && qe.date <= iso(today()) ? qe.date : iso(today());
    state.expenses.push({ id: uid(), cat: qe.cat, amount: v, date: date, note: qe.note.trim().slice(0, 60) });
    var c = state.categories.filter(function (x) { return x.id === qe.cat; })[0];
    var left = c ? c.amount - spentIn(c.id) : 0;
    qeClose();
    save();
    render();
    toast(c && date.slice(0, 7) === monthKey(today()) ? (left >= 0 ? euro(v) + ' ajouté · reste ' + euro(left) + ' en ' + c.name : c.name + ' : budget dépassé') : 'Dépense ajoutée');
  }

  // Clavier physique (ordinateur) quand la saisie rapide est ouverte.
  document.addEventListener('keydown', function (e) {
    if (!qe) return;
    var inNote = e.target && e.target.dataset && e.target.dataset.input === 'qe-note';
    if (e.key === 'Escape') { e.preventDefault(); return qeClose(); }
    if (e.key === 'Enter') { e.preventDefault(); return qeSubmit(); }
    if (inNote || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); return qeKey(e.key); }
    if (e.key === ',' || e.key === '.') { e.preventDefault(); return qeKey(','); }
    if (e.key === 'Backspace') { e.preventDefault(); return qeBack(); }
  });
  // Ordinateur : un clic sur le fond assombri ferme la saisie.
  document.getElementById('quick').addEventListener('click', function (e) { if (e.target.id === 'quick') qeClose(); });

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
    if (data.term === 'open') {
      var monthly = (data.monthly || '').trim() ? parseAmount(data.monthly) : 0;
      if (monthly === null) return 'Indique combien mettre de côté par mois, ou laisse le champ vide.';
      return { name: name, target: target, saved: saved, months: 12, open: true, monthly: monthly };
    }
    if (!/^\d+$/.test(String(data.duration || '').trim()) || n < 1) return 'Indique une durée, par exemple 12 mois ou 2 ans.';
    var months = data.unit === 'year' ? n * 12 : n;
    if (months > 600) return 'Choisis une durée de 50 ans au plus.';
    return { name: name, target: target, saved: saved, months: months, open: false, monthly: 0 };
  }

  // Aperçu en direct du montant mensuel dans la fenêtre de l'objectif.
  function previewGoal() {
    var out = document.getElementById('goal-preview');
    if (!out) return;
    var data = {};
    new FormData(sheetForm).forEach(function (v, k) { data[k] = v; });
    data.name = data.name || '-';
    var open = data.term === 'open';
    document.getElementById('goal-fixed').hidden = open;
    document.getElementById('goal-open').hidden = !open;
    var r = readGoalForm(data);
    if (typeof r === 'string') {
      out.innerHTML = '<span class="muted">' + (open ? 'Indique le montant à atteindre.' : 'Indique un montant et une durée pour voir combien mettre de côté chaque mois.') + '</span>';
      return;
    }
    var missing = Math.max(0, r.target - r.saved);
    out.innerHTML = missing <= 0 ? '<span class="strong">Objectif déjà atteint</span>'
      : !open ? '<span class="strong">' + euro(Math.ceil(missing / r.months * 100) / 100) + ' par mois</span><span class="muted">pendant ' + durationLabel(r.months) + '</span>'
      : r.monthly > 0 ? '<span class="strong">Atteint dans ' + durationLabel(Math.ceil(missing / r.monthly)) + '</span><span class="muted">à ' + euro(r.monthly) + ' par mois</span>'
      : '<span class="strong">Sans échéance</span><span class="muted">rien de réservé, tu verses quand tu veux</span>';
  }

  function calcRow(label, value, color) {
    return '<div class="row"><span class="dot" style="--c:' + color + '" aria-hidden="true"></span><span class="row-main"><span class="muted">' + label + '</span></span><span class="row-amount">' + value + '</span></div>';
  }

  // ---------- Écran : Bilan ----------

  function viewBilan() {
    var t = totals();
    var html = '<header class="topbar a-top"><h1 class="title">Bilan</h1><span class="label">' + cap(monthName.format(today())) + '</span></header>';
    if (state.salary <= 0) {
      return html + '<section class="section a-hero"><div class="group"><div class="empty"><span>Indique ton salaire pour voir ton bilan.</span>' +
        '<button type="button" class="link-btn" data-action="edit-salary">Indiquer mon salaire</button></div></div></section>';
    }

    // Taux d'épargne : épargne mensuelle + objectifs, sur les revenus du mois.
    var saved = state.savings + t.goals;
    var rate = t.income > 0 ? Math.round(saved / t.income * 100) : 0;
    html += '<section class="hero a-hero" aria-label="Taux d\'épargne"><p class="label">Tu mets de côté</p>' +
      '<p class="amount-hero"><span class="int">' + rate + '</span><span class="dec">&nbsp;%</span></p>' +
      '<p class="caption">de tes revenus : ' + euro(saved) + ' sur ' + euro(t.income) + ', épargne et objectifs compris.</p>';

    // Le mois en chiffres, comparé au mois d'avant quand il est enregistré.
    var prevKey = monthKey(new Date(today().getFullYear(), today().getMonth() - 1, 1));
    var prev = state.history[prevKey];
    var stat = function (label, value, key, goodUp) {
      // « spent » vaut -1 pour les mois enregistrés avant son ajout.
      var d = prev && prev[key] != null && !(key === 'spent' && prev[key] < 0) ? value - prev[key] : null;
      var cls = d === null || Math.abs(d) < 1 ? 'muted' : (d > 0) === goodUp ? 'ok' : 'soon';
      return '<div class="stat"><span class="label">' + label + '</span><span class="stat-val">' + euro(value) + '</span>' +
        '<span class="caption ' + cls + '">' + (d === null ? '&nbsp;' : Math.abs(d) < 1 ? '= Pareil' : (d > 0 ? '▲ ' : '▼ ') + euro(Math.abs(d)) + '<span class="sr-only">' + (d > 0 ? ' de plus' : ' de moins') + '</span>') + '</span></div>';
    };
    html += '<div class="stats">' + stat('Revenus', t.income, 'income', true) + stat('Dépensé', t.spent, 'spent', false) +
      stat('Mis de côté', saved, 'saved', true) + stat('Libre', t.free, 'free', true) + '</div>' +
      (prev ? '<p class="caption">Écarts comparés à ' + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(today().getFullYear(), today().getMonth() - 1, 1)) + '.</p>' : '');
    var f = forecast();
    if (f) html += '<p class="forecast-box">' + forecastLine(f) + '</p>';
    html += '</section>';

    // Le graphique sur 12 mois, avec la mesure au choix.
    var chart = historyChart(12, ui.bilanMetric, ui.bilanMonth);
    html += '<section class="section a-main"><div class="section-head"><h2 class="heading">Sur 12 mois</h2></div>' +
      '<div class="chips" role="group" aria-label="Mesure affichée">' + Object.keys(METRICS).map(function (k) {
        return '<button type="button" class="chip" data-action="bilan-metric" data-value="' + k + '" aria-pressed="' + (k === ui.bilanMetric) + '">' + METRICS[k] + '</button>';
      }).join('') + '</div>' +
      '<div class="group hist">' + (chart || '<div class="empty"><span>Finy garde une photo de chaque mois quand tu l\'ouvres.</span><span class="caption">Le graphique apparaîtra dès le mois prochain.</span></div>') + '</div>' +
      (chart ? '<p class="caption">Touche un mois pour voir son détail.</p><div class="month-detail" id="month-detail">' + monthDetail(state.history[ui.bilanMonth] ? ui.bilanMonth : monthKey(today())) + '</div>' : '') + '</section>';

    // Où part l'argent : chaque abonnement, charge et catégorie du mois, du plus cher au moins cher.
    var items = state.subs.filter(function (s) { return costThisMonth(s) > 0; }).map(function (s) {
      return { name: s.name, value: costThisMonth(s), kind: isBill(s) ? 'Charge fixe' : 'Abonnement', color: isBill(s) ? 'var(--chart-5)' : 'var(--chart-2)' };
    }).concat(state.categories.map(function (c, i) {
      return { name: c.name, value: catCost(c), kind: spentIn(c.id) > c.amount ? 'Catégorie · dépassée' : 'Catégorie', color: CAT_PALETTE[i % CAT_PALETTE.length] };
    })).filter(function (x) { return x.value > 0; }).sort(function (a, b) { return b.value - a.value; });
    var total = items.reduce(function (a, x) { return a + x.value; }, 0);
    var shown = ui.bilanAll ? items : items.slice(0, 8);
    html += '<section class="section a-side"><div class="section-head"><h2 class="heading">Où part ton argent</h2><span class="label">' + euro(total) + '</span></div><div class="group">' +
      (items.length ? shown.map(function (x) {
        var share = total > 0 ? x.value / total : 0;
        return '<div class="row tall goal"><span class="dot" style="--c:' + x.color + '" aria-hidden="true"></span><span class="row-main"><span class="row-title">' + esc(x.name) + '</span>' +
          '<span class="row-meta"><span>' + x.kind + ' · ' + Math.round(share * 100) + ' %</span></span>' +
          '<span class="goal-bar" aria-hidden="true"><span style="width:' + (share * 100).toFixed(1) + '%;background:' + x.color + '"></span></span></span>' +
          '<span class="row-amount">' + euro(x.value) + '</span></div>';
      }).join('') + (items.length > 8 ? '<button type="button" class="row row-link" data-action="bilan-all">' + (ui.bilanAll ? 'Voir moins' : 'Voir les ' + items.length) + '</button>' : '')
        : '<div class="empty"><span>Rien à afficher pour l\'instant.</span></div>') +
      '</div><p class="caption">Abonnements et charges prélevés ce mois-ci, et budget de chaque catégorie (ou ce qui a été dépensé s\'il est dépassé).</p></section>';
    return html;
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
      '<button type="button" class="row" data-action="ob-again">' + icon('sliders') + '<span class="row-main">Refaire la configuration guidée</span>' + icon('right', 'chev') + '</button>' +
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
    bilan: { tab: 'bilan', view: viewBilan },
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
    placeTabPill();
    var fab = document.querySelector('.fab');
    if (fab) { fab.hidden = key === 'reglages'; fab.classList.remove('compact'); }
    lastScrollY = window.scrollY;
    document.title = { '': 'Finy', calendrier: 'Calendrier · Finy', abonnements: 'Abonnements · Finy', epargne: 'Épargne · Finy', bilan: 'Bilan · Finy', reglages: 'Réglages · Finy' }[key];
    if (ui.focusAfter) {
      var target = document.getElementById(ui.focusAfter);
      ui.focusAfter = null;
      if (target) { target.scrollIntoView({ block: 'start' }); lastRoute = key; return; }
    }
    window.scrollTo(0, scroll);
    if (key !== lastRoute) view.focus({ preventScroll: true });
    lastRoute = key;
  }

  // Barre d'onglets du téléphone : la pastille glisse jusqu'à l'onglet actif.
  // Pas d'animation au tout premier placement, ni quand l'onglet actif n'est pas dans la barre (Réglages).
  function placeTabPill() {
    var pill = document.querySelector('.tab-pill');
    if (!pill) return;
    var a = document.querySelector('.tabbar a[aria-current="page"]');
    if (!a || !a.offsetWidth || getComputedStyle(pill).display === 'none') {
      pill.style.opacity = '0';
      return;
    }
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    pill.style.opacity = '1';
    if (!pill.classList.contains('ready')) {
      void pill.offsetWidth;
      setTimeout(function () { pill.classList.add('ready'); }, 60);
    }
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

  // Options de catégorie selon le type (abonnement ou charge fixe).
  function catOptions(kind, current) {
    var cats = (kind === 'bill' ? BILL_CATEGORIES : SUB_CATEGORIES).slice();
    if (current && cats.indexOf(current) < 0) cats.push(current);
    return cats.map(function (c) { return '<option' + (c === current ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
  }

  // `preset` pré-remplit un nouvel abonnement (lu dans une facture) ou choisit le type (`kind: 'bill'`).
  function editSub(id, preset) {
    var s = state.subs.filter(function (x) { return x.id === id; })[0];
    var isNew = !s;
    s = s || Object.assign({ name: '', amount: 0, day: today().getDate(), month: today().getMonth(), frequency: 'month', category: 'Streaming', site: '', image: null, kind: 'sub' }, preset);
    if (isNew && s.kind === 'bill' && !(preset && preset.category)) s.category = 'Logement';
    var bill = s.kind === 'bill';
    var word = bill ? 'cette charge' : 'cet abonnement';
    var yearly = s.frequency === 'year';
    var months = '';
    for (var mo = 0; mo < 12; mo++) {
      months += '<option value="' + mo + '"' + (mo === s.month ? ' selected' : '') + '>' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2026, mo, 1))) + '</option>';
    }
    sheetDraft = { name: s.name, site: s.site || '', image: s.image || null };
    var days = '';
    for (var d = 1; d <= 31; d++) days += '<option value="' + d + '"' + (d === s.day ? ' selected' : '') + '>' + d + '</option>';
    var body = (isNew && !preset ? importButton('link-btn') : '') +
      '<div class="field"><span>Type</span><div class="segmented" role="radiogroup" aria-label="Type">' +
      '<label class="seg-opt"><input type="radio" name="kind" value="sub" data-input="sub-kind"' + (bill ? '' : ' checked') + '><span>Abonnement</span></label>' +
      '<label class="seg-opt"><input type="radio" name="kind" value="bill" data-input="sub-kind"' + (bill ? ' checked' : '') + '><span>Charge fixe</span></label></div></div>' +
      '<div class="image-pick"><span id="draft-tile">' + subTile(sheetDraft, 'tile-lg') + '</span>' +
      '<div class="image-pick-actions"><label class="link-btn" style="display:inline-flex;align-items:center;cursor:pointer">Choisir une image<input type="file" accept="image/*" class="sr-only" data-input="sub-image"></label>' +
      '<button type="button" class="link-btn" data-action="sub-image-remove" style="color:var(--muted)"' + (s.image ? '' : ' hidden') + '>Retirer l\'image</button></div></div>' +
      '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="60" autocomplete="off" placeholder="' + (bill ? 'Loyer, EDF, assurance…' : 'Netflix, Orange…') + '" value="' + esc(s.name) + '" data-input="sub-name"></label>' +
      '<div class="field"><span>Fréquence</span><div class="segmented" role="radiogroup" aria-label="Fréquence">' +
      '<label class="seg-opt"><input type="radio" name="frequency" value="month" data-input="sub-freq"' + (yearly ? '' : ' checked') + '><span>Mensuel</span></label>' +
      '<label class="seg-opt"><input type="radio" name="frequency" value="year" data-input="sub-freq"' + (yearly ? ' checked' : '') + '><span>Annuel</span></label></div></div>' +
      '<label class="field"><span id="amount-label">' + (yearly ? 'Montant par an (€)' : 'Montant par mois (€)') + '</span><input class="input" name="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (s.amount ? plain(s.amount) : '') + '"></label>' +
      '<div class="field-row"><label class="field"><span>Jour du prélèvement</span><select class="input" name="day">' + days + '</select></label>' +
      '<label class="field" id="month-field"' + (yearly ? '' : ' hidden') + '><span>Mois</span><select class="input" name="month">' + months + '</select></label></div>' +
      '<label class="field"><span>Catégorie</span><select class="input" name="category" id="sub-category">' + catOptions(s.kind, s.category) + '</select></label>' +
      '<label class="field"><span>Site du service (facultatif)</span><input class="input" name="site" type="text" inputmode="url" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" placeholder="netflix.com" value="' + esc(s.site || '') + '" data-input="sub-site">' +
      '<span class="caption">Pour afficher son logo automatiquement. Seul le nom du site est envoyé à DuckDuckGo pour récupérer l\'icône.</span></label>' +
      '<label class="field" id="trial-field"' + (bill ? ' hidden' : '') + '><span>Essai gratuit jusqu\'au (facultatif)</span><input class="input" name="trialEnd" type="date" value="' + esc(s.trialEnd || '') + '">' +
      '<span class="caption">Rien n\'est compté avant cette date, et les rappels te préviennent pour résilier à temps.</span></label>' +
      '<div class="field"><span>État</span><div class="segmented" role="radiogroup" aria-label="État de l\'abonnement">' +
      '<label class="seg-opt"><input type="radio" name="paused" value="no"' + (s.paused ? '' : ' checked') + '><span>Actif</span></label>' +
      '<label class="seg-opt"><input type="radio" name="paused" value="yes"' + (s.paused ? ' checked' : '') + '><span>En pause</span></label></div>' +
      '<span class="caption">En pause, il reste dans ta liste mais n\'est plus compté ni rappelé.</span></div>';
    var del = isNew ? '' : '<button type="button" class="btn btn-danger btn-block" data-action="delete-sub" data-id="' + esc(id) + '">Supprimer ' + word + '</button>';
    openSheet(isNew ? (bill ? 'Nouvelle charge fixe' : 'Nouvel abonnement') : (bill ? 'Modifier la charge' : 'Modifier l\'abonnement'), body, isNew ? 'Ajouter' : 'Enregistrer', function (data) {
      var name = (data.name || '').trim();
      var amount = parseAmount(data.amount);
      var kind = data.kind === 'bill' ? 'bill' : 'sub';
      if (!name) return 'Donne un nom à ' + (kind === 'bill' ? 'cette charge.' : 'cet abonnement.');
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
        trialEnd: kind === 'sub' && isIsoDate(data.trialEnd) ? data.trialEnd : '',
        paused: data.paused === 'yes',
        kind: kind
      };
      if (isNew) state.subs.push(item);
      else state.subs = state.subs.map(function (x) { return x.id === id ? item : x; });
      ui.abosKind = kind;
      var label = kind === 'bill' ? 'Charge' : 'Abonnement';
      toast(item.paused && !(s.paused) && !isNew ? label + ' mis' + (kind === 'bill' ? 'e' : '') + ' en pause' : label + (isNew ? ' ajouté' : ' modifié') + (kind === 'bill' ? 'e' : ''));
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
      (active.length ? '<div class="field"><span>' + (ofKind('bill', active).length ? 'Abonnements et charges gardés' : 'Abonnements gardés') + '</span><div class="group">' + active.map(function (s) {
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
      // Une sauvegarde importée (y compris depuis le premier écran) vaut configuration : pas de parcours guidé.
      state.meta.onboarded = state.meta.onboarded || iso(today());
      state.onboarding = null;
      obClose();
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
      case 'add-bill': return editSub(null, { kind: 'bill' });
      case 'bilan-metric':
        ui.bilanMetric = METRICS[v] ? v : 'free';
        return render();
      case 'hist-month':
        ui.bilanMonth = isMonthKey(v) ? v : null;
        if (currentRoute() !== 'bilan') { location.hash = '#/bilan'; return; }
        return render();
      case 'bilan-all':
        ui.bilanAll = !ui.bilanAll;
        return render();
      case 'home-group':
        ui.homeOpen = ui.homeOpen === v ? null : v;
        return render();
      case 'go-abos':
        ui.abosKind = v === 'bill' ? 'bill' : 'sub';
        ui.abosFilter = 'Tous';
        location.hash = '#/abonnements';
        return;
      case 'abos-kind':
        ui.abosKind = v === 'bill' ? 'bill' : 'sub';
        ui.abosFilter = 'Tous';
        return render();
      case 'edit-sub': return editSub(id);
      case 'add-cat': return editCat(null);
      case 'edit-cat': return editCat(id);
      case 'edit-salary': return editSalary();
      case 'add-goal': return editGoal(null);
      case 'first-steps-hide':
        state.meta.firstSteps = null;
        save();
        return render();
      case 'ob-again': return obOpen(true);
      case 'edit-goal': return editGoal(id);
      case 'delete-goal':
        if (!window.confirm('Supprimer cet objectif ?')) return;
        state.goals = state.goals.filter(function (g) { return g.id !== id; });
        closeSheet(); save(); render(); toast('Objectif supprimé');
        return;
      case 'sheet-close': return closeSheet();
      case 'delete-sub':
        if (!window.confirm('Supprimer ' + (isBill(state.subs.filter(function (s) { return s.id === id; })[0] || {}) ? 'cette charge ?' : 'cet abonnement ?'))) return;
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
      case 'qe-key': return qeKey(v);
      case 'qe-back': return qeBack();
      case 'qe-cat': if (qe) { qe.cat = id; qeUpdate(); } return;
      case 'qe-name':
        if (!qe) return;
        qe.note = qe.note.trim() === v ? '' : v;
        document.querySelector('[data-input="qe-note"]').value = qe.note;
        return qeUpdate();
      case 'qe-close': return qeClose();
      case 'qe-submit': return qeSubmit();
      case 'add-exp-in': return editExpense(id);
      case 'delete-exp':
        state.expenses = state.expenses.filter(function (x) { return x.id !== id; });
        save(); render(); toast('Dépense supprimée');
        return editCat(el.dataset.cat);
      case 'add-income': return addIncome();
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
    if (el.dataset.input === 'qe-note' && qe) { qe.note = el.value; if (qe.kind === 'inc') qeUpdate(); return; }
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
    if (el.dataset.input === 'qe-date' && qe) { qe.date = isIsoDate(el.value) && el.value <= iso(today()) ? el.value : iso(today()); return qeUpdate(); }
    if (sheetForm.dataset.kind === 'whatif' && sheetForm.contains(el)) previewWhatIf();
    if (el.dataset.input === 'sv-input') fillSavings();
    if (el.dataset.input === 'sub-kind') {
      var b = el.value === 'bill';
      var sel = document.getElementById('sub-category');
      sel.innerHTML = catOptions(el.value, b ? 'Logement' : 'Streaming');
      document.getElementById('trial-field').hidden = b;
    }
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
  window.addEventListener('resize', placeTabPill);

  // Bouton « Dépense » du téléphone : il se réduit en rond quand on descend, et reprend son texte quand on remonte.
  var lastScrollY = 0;
  window.addEventListener('scroll', function () {
    var fab = document.querySelector('.fab');
    if (!fab) return;
    var y = window.scrollY;
    if (Math.abs(y - lastScrollY) < 8) return;
    fab.classList.toggle('compact', y > lastScrollY && y > 80);
    lastScrollY = y;
  }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { render(); checkReminders(); }
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', render);
  }

  // ---------- Premier lancement : configuration guidée ----------

  // Chaque étape est appliquée aux vraies données dès « Continuer » : si on s'arrête en route, l'app est déjà
  // prête pour ce qui a été rempli. L'étape en cours, les réponses et les éléments créés (ids) sont gardés dans
  // state.onboarding, retiré à la fin ; state.meta.onboarded marque le parcours comme terminé.

  var obEl = document.getElementById('onboarding');
  var obDir = 'none';
  var obPct = 0;
  var obDraftTimer = null;
  var OB_SAVE_ERROR = 'Impossible d\'enregistrer sur cet appareil (stockage plein ou navigation privée). Tes réponses sont gardées : réessaie.';

  // Nettoie la progression lue dans le stockage ou une sauvegarde : seules les clés connues sont gardées.
  function sanitizeOb(o) {
    if (!o || typeof o !== 'object' || !o.a || typeof o.a !== 'object') return null;
    var str = function (v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; };
    var a = o.a;
    var out = {
      step: OB_STEPS.indexOf(o.step) >= 0 ? o.step : 'welcome',
      back: o.back === 'recap' ? 'recap' : null,
      skipped: {},
      ids: {},
      a: {
        name: str(a.name, 40),
        needs: Array.isArray(a.needs) ? OB_NEEDS.map(function (x) { return x[0]; }).filter(function (k) { return a.needs.indexOf(k) >= 0; }) : [],
        salary: str(a.salary, 14),
        savings: a.savings === null ? null : str(a.savings, 14),
        bills: {}, subs: {}, envs: {},
        goal: { key: '', name: '', target: '', months: 12 },
        remind: { enabled: !!(a.remind && a.remind.enabled === true), days: 3 },
        theme: ['system', 'light', 'dark'].indexOf(a.theme) >= 0 ? a.theme : 'system'
      }
    };
    Object.keys(OB_OPTIONAL).forEach(function (k) { if (o.skipped && o.skipped[k] === true) out.skipped[k] = true; });
    Object.keys(o.ids || {}).forEach(function (k) {
      var v = o.ids[k];
      if (/^(bill|sub|env):[a-z]+$|^goal$/.test(k) && v && typeof v.id === 'string') out.ids[k] = { id: v.id.slice(0, 40), own: v.own === true };
    });
    Object.keys(OB_LIST).forEach(function (g) {
      OB_LIST[g].forEach(function (p) {
        var x = a[g] && a[g][p[0]];
        if (x && typeof x === 'object') out.a[g][p[0]] = { on: x.on === true, amount: str(x.amount, 14), day: str(String(x.day || ''), 2) };
      });
    });
    var g = a.goal || {};
    if (OB_GOALS.some(function (p) { return p[0] === g.key; })) {
      out.a.goal = { key: g.key, name: str(g.name, 40), target: str(g.target, 14), months: [0, 6, 12, 24, 36].indexOf(g.months) >= 0 ? g.months : 12 };
    }
    var d = a.remind && a.remind.days;
    if ([1, 2, 3, 5].indexOf(d) >= 0) out.a.remind.days = d;
    return out;
  }

  // Prépare le parcours à partir de ce qui existe déjà : un élément du même nom est repris, jamais recréé.
  function obStart() {
    var s = state;
    var o = {
      step: 'welcome', back: null, skipped: {}, ids: {},
      a: {
        name: s.profile.name,
        needs: [],
        salary: s.salary > 0 ? plain(s.salary) : '',
        savings: s.savings > 0 ? plain(s.savings) : null,
        bills: {}, subs: {}, envs: {},
        goal: { key: '', name: '', target: '', months: 12 },
        remind: { enabled: s.settings.reminders.enabled, days: [1, 2, 3, 5].indexOf(s.settings.reminders.daysBefore) >= 0 ? s.settings.reminders.daysBefore : 3 },
        theme: s.settings.theme
      }
    };
    var adopt = function (group, list, prefix) {
      OB_LIST[group].forEach(function (p) {
        var found = list.filter(function (x) { return fold(x.name) === fold(p[1]); })[0];
        if (!found) return;
        o.ids[prefix + ':' + p[0]] = { id: found.id, own: false };
        o.a[group][p[0]] = { on: true, amount: plain(found.amount), day: String(found.day || '') };
      });
    };
    adopt('bills', ofKind('bill'), 'bill');
    adopt('subs', ofKind('sub'), 'sub');
    adopt('envs', s.categories, 'env');
    if (!s.categories.length) o.a.envs.courses = { on: true, amount: '300', day: '' };
    var n = o.a.needs;
    if (ofKind('sub').length) n.push('subs');
    if (s.categories.length) n.push('budget');
    if (s.savings > 0 || s.goals.length) n.push('save');
    if (s.settings.reminders.enabled) n.push('remind');
    if (!n.length) o.a.needs = ['subs', 'budget'];
    state.onboarding = o;
  }

  function obSteps() {
    var n = state.onboarding.a.needs;
    return OB_STEPS.filter(function (s) { return !OB_STEP_NEED[s] || n.indexOf(OB_STEP_NEED[s]) >= 0; });
  }

  function obOpen(again) {
    if (again || !state.onboarding) obStart();
    document.body.classList.add('ob-open');
    obEl.hidden = false;
    obDir = 'none';
    obPct = 0;
    obRender();
  }

  function obClose() {
    obEl.hidden = true;
    obEl.innerHTML = '';
    document.body.classList.remove('ob-open');
  }

  // Garde les réponses en cours de saisie (sans les appliquer), pour les retrouver après une interruption.
  function obDraft() {
    clearTimeout(obDraftTimer);
    obDraftTimer = setTimeout(function () {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* signalé au prochain « Continuer » */ }
    }, 300);
  }

  function obDay(v) {
    var n = parseInt(String(v || '').trim(), 10);
    return /^\d{1,2}$/.test(String(v || '').trim()) && n >= 1 && n <= 31 ? n : null;
  }

  function obSalary() {
    var n = parseAmount(state.onboarding.a.salary);
    return n && n > 0 ? n : state.salary;
  }

  // Ce qui empêche de valider l'étape, avec le champ à corriger.
  function obCheck(step) {
    var a = state.onboarding.a;
    var bad = function (msg, sel) { return { msg: msg, sel: sel }; };
    if (step === 'salary') {
      var n = parseAmount(a.salary);
      if (n === null || n <= 0) return bad('Indique ton salaire net par mois, par exemple 1 800.', '[data-ob-f="salary"]');
      if (n > 1000000) return bad('Ce montant paraît bien élevé : vérifie-le.', '[data-ob-f="salary"]');
    }
    if (OB_LIST[step]) {
      var list = OB_LIST[step];
      for (var i = 0; i < list.length; i++) {
        var p = list[i], x = a[step][p[0]];
        if (!x || !x.on) continue;
        var sel = '[data-g="' + step + '"][data-k="' + p[0] + '"]';
        var amt = parseAmount(x.amount);
        if (amt === null || amt <= 0) return bad('Indique le montant pour « ' + p[1] + ' ».', '[data-ob-f="amt"]' + sel);
        if (step !== 'envs' && !obDay(x.day)) return bad('Choisis un jour entre 1 et 31 pour « ' + p[1] + ' ».', '[data-ob-f="day"]' + sel);
      }
    }
    if (step === 'savings' && (a.savings || '').trim()) {
      var v = parseAmount(a.savings);
      if (v === null) return bad('Indique un montant, par exemple 100.', '[data-ob-f="savings"]');
      if (v > obSalary()) return bad('C\'est plus que ton salaire : choisis un montant plus petit.', '[data-ob-f="savings"]');
    }
    if (step === 'goal' && a.goal.key) {
      var t = parseAmount(a.goal.target);
      if (!a.goal.name.trim()) return bad('Donne un nom à ton objectif.', '[data-ob-f="goal-name"]');
      if (t === null || t <= 0) return bad('Indique le montant à atteindre, par exemple 1 500.', '[data-ob-f="goal-target"]');
    }
    return null;
  }

  // Crée, met à jour ou retire un élément choisi pendant le parcours, sans jamais le dupliquer.
  // Un élément déjà présent (même nom) est repris ; seul ce que le parcours a créé peut être retiré.
  function obSync(key, on, listName, name, fill) {
    var o = state.onboarding;
    var link = o.ids[key];
    var item = link && state[listName].filter(function (x) { return x.id === link.id; })[0];
    if (!on) {
      if (item && link.own) state[listName] = state[listName].filter(function (x) { return x !== item; });
      delete o.ids[key];
      return;
    }
    var isNew = false;
    if (!item) {
      item = state[listName].filter(function (x) { return fold(x.name) === fold(name); })[0];
      if (item) o.ids[key] = { id: item.id, own: false };
    }
    if (!item) {
      item = { id: uid() };
      state[listName].push(item);
      o.ids[key] = { id: item.id, own: true };
      isNew = true;
    }
    fill(item, isNew);
  }

  // Applique une étape aux données. Les valeurs incomplètes sont ignorées (utile pour l'aperçu en direct).
  function obApply(step) {
    var a = state.onboarding.a;
    switch (step) {
      case 'name':
        state.profile.name = a.name.trim().slice(0, 40);
        break;
      case 'salary':
        var n = parseAmount(a.salary);
        if (n > 0) state.salary = n;
        break;
      case 'bills':
      case 'subs':
        var bill = step === 'bills';
        OB_LIST[step].forEach(function (p) {
          var x = a[step][p[0]] || {};
          var amt = parseAmount(x.amount || '');
          var day = obDay(x.day);
          obSync((bill ? 'bill:' : 'sub:') + p[0], x.on && amt > 0 && day, 'subs', p[1], function (s, isNew) {
            if (isNew) {
              s.name = p[1];
              s.frequency = 'month';
              s.month = today().getMonth();
              s.category = bill ? p[2] : p[3];
              s.site = bill ? '' : p[2];
              s.image = null;
              s.trialEnd = '';
              s.paused = false;
              s.kind = bill ? 'bill' : 'sub';
            }
            s.amount = amt;
            s.day = day;
          });
        });
        break;
      case 'envs':
        OB_ENVS.forEach(function (p) {
          var x = a.envs[p[0]] || {};
          var amt = parseAmount(x.amount || '');
          obSync('env:' + p[0], x.on && amt > 0, 'categories', p[1], function (c, isNew) {
            if (isNew) c.name = p[1];
            c.amount = amt;
          });
        });
        break;
      case 'savings':
        var v = (a.savings || '').trim() ? parseAmount(a.savings) : 0;
        if (v !== null) state.savings = v;
        break;
      case 'goal':
        var g = a.goal, target = parseAmount(g.target);
        obSync('goal', !!g.key && !!g.name.trim() && target > 0, 'goals', g.name.trim(), function (x, isNew) {
          if (isNew) { x.saved = 0; x.deposits = []; }
          x.name = g.name.trim().slice(0, 40);
          x.target = target;
          x.open = g.months === 0;
          x.months = g.months || 12;
          x.monthly = 0;
          x.start = monthKey(today());
        });
        break;
      case 'remind':
        state.settings.reminders.enabled = a.remind.enabled;
        state.settings.reminders.daysBefore = a.remind.days;
        break;
      case 'prefs':
        state.settings.theme = a.theme;
        break;
    }
  }

  // « Il te restera » avec les réponses de l'écran en cours, calculé sur une copie des données.
  function obPreview() {
    var out = document.getElementById('ob-preview');
    if (!out) return;
    var keep = state, free = null;
    try {
      state = JSON.parse(JSON.stringify(state));
      obApply(state.onboarding.step);
      free = state.salary > 0 ? totals().free : null;
    } catch (e) { free = null; }
    state = keep;
    out.innerHTML = free === null ? '<span class="muted">Ton reste à vivre s\'affichera ici.</span>'
      : '<span class="muted">Il te restera</span><span class="strong"' + (free < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(free) + '</span><span class="muted">ce mois-ci</span>';
  }

  function obNext() {
    var o = state.onboarding;
    if (o.step === 'done') return obFinish(obFirstAction().action);
    var err = obCheck(o.step);
    if (err) return obError(err);
    obApply(o.step);
    if (o.step === 'prefs') applyTheme();
    delete o.skipped[o.step];
    obAdvance();
  }

  function obSkip() {
    var o = state.onboarding;
    o.skipped[o.step] = true;
    obAdvance();
  }

  function obAdvance() {
    var o = state.onboarding, from = o.step;
    var steps = obSteps();
    var to = o.back === 'recap' ? 'recap' : steps[steps.indexOf(from) + 1] || 'done';
    if (to === 'recap') o.back = null;
    o.step = to;
    if (!save()) { o.step = from; return obError({ msg: OB_SAVE_ERROR }); }
    obDir = 'next';
    obRender();
  }

  // Retour : ce qui est valide sur l'écran est gardé, le reste reste en brouillon.
  function obBack() {
    var o = state.onboarding, from = o.step;
    if (!obCheck(from)) obApply(from);
    var steps = obSteps();
    var to = o.back === 'recap' ? 'recap' : steps[Math.max(0, steps.indexOf(from) - 1)];
    if (to === 'recap') o.back = null;
    o.step = to;
    save();
    obDir = 'prev';
    obRender();
  }

  function obGoTo(step) {
    var o = state.onboarding;
    o.back = 'recap';
    o.step = step;
    obDraft();
    obDir = 'next';
    obRender();
  }

  function obError(err) {
    var box = document.getElementById('ob-error');
    if (!box) return toast(err.msg);
    box.textContent = err.msg;
    box.hidden = false;
    obEl.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
    var field = err.sel && obEl.querySelector(err.sel);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', 'ob-error');
      field.focus();
    }
    playEnter(box, 'ob-shake');
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
  }

  function obFirstAction() {
    if (state.categories.length) return { action: 'exp', title: 'Note ta première dépense', text: 'Des courses, un plein : chaque dépense est retirée de son enveloppe et Finy te dit ce qu\'il reste.', cta: 'Ajouter une dépense' };
    if (!ofKind('sub').length) return { action: 'sub', title: 'Ajoute un abonnement', text: 'Netflix, ton forfait, ta salle de sport : Finy les retire de ce qui reste et te prévient avant chaque prélèvement.', cta: 'Ajouter un abonnement' };
    return { action: 'home', title: 'Découvre ton accueil', text: 'Ce qu\'il te reste, ta répartition et tes prochains prélèvements, en un coup d\'œil.', cta: 'Découvrir mon accueil' };
  }

  function obFinish(action) {
    var o = state.onboarding;
    state.meta.onboarded = iso(today());
    state.meta.firstSteps = iso(today());
    state.onboarding = null;
    if (!save()) {
      state.onboarding = o;
      state.meta.onboarded = null;
      return obError({ msg: OB_SAVE_ERROR });
    }
    obClose();
    applyTheme();
    if (currentRoute() !== '') location.hash = '#/';
    else render();
    checkReminders();
    if (action === 'exp') editExpense(null);
    else if (action === 'sub') editSub(null);
  }

  function obCheckIcon() { return '<span class="ob-check" aria-hidden="true">' + icon('check') + '</span>'; }

  // Les choix d'une liste (charges, abonnements, enveloppes), puis le montant (et le jour) de chacun.
  function obPicker(group, label) {
    var a = state.onboarding.a[group];
    var opts = OB_LIST[group].map(function (p) {
      var on = !!(a[p[0]] && a[p[0]].on);
      var hint = group === 'subs' ? '≈ ' + euro(p[4]) : group === 'envs' ? euro(p[2]) : '';
      return '<button type="button" class="ob-opt" aria-pressed="' + on + '" data-ob="pick" data-g="' + group + '" data-k="' + p[0] + '">' +
        (group === 'subs' ? subTile({ name: p[1], site: p[2] }, 'ob-tile') : '') +
        '<span class="ob-opt-name">' + esc(p[1]) + '</span>' + (hint ? '<span class="ob-opt-hint">' + hint + '</span>' : '') + obCheckIcon() + '</button>';
    }).join('');
    var picked = OB_LIST[group].filter(function (p) { return a[p[0]] && a[p[0]].on; });
    var rows = picked.map(function (p) {
      var x = a[p[0]], at = ' data-g="' + group + '" data-k="' + p[0] + '"';
      return '<div class="ob-item"><span class="ob-item-name">' + esc(p[1]) + '</span>' +
        '<label class="ob-item-amt"><span class="sr-only">Montant pour ' + esc(p[1]) + ' en euros</span><input class="input" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + esc(x.amount) + '" data-ob-f="amt"' + at + '><span aria-hidden="true">€</span></label>' +
        (group === 'envs' ? '' : '<label class="ob-item-day"><span aria-hidden="true">le</span><input class="input" type="text" inputmode="numeric" maxlength="2" autocomplete="off" placeholder="1" value="' + esc(x.day) + '" data-ob-f="day"' + at + ' aria-label="Jour du prélèvement pour ' + esc(p[1]) + '"></label>') + '</div>';
    }).join('');
    return '<div class="ob-grid' + (group === 'subs' ? ' ob-grid-logos' : '') + '" role="group" aria-label="' + label + '">' + opts + '</div>' +
      (rows ? '<div class="ob-items"><p class="label">' + (group === 'envs' ? 'Budget par mois' : 'Montant par mois et jour du prélèvement') + '</p>' + rows + '</div>' : '');
  }

  // Résumé d'une liste : « Loyer, Mutuelle · 685,00 € par mois ».
  function obSum(items, none) {
    if (!items.length) return none;
    var names = items.map(function (x) { return x.name; });
    var total = items.reduce(function (s, x) { return s + (x.frequency === 'year' ? x.amount / 12 : x.amount); }, 0);
    return esc(names.slice(0, 3).join(', ') + (names.length > 3 ? ' et ' + (names.length - 3) + ' autre' + (names.length > 4 ? 's' : '') : '')) + ' · ' + euro(total) + ' par mois';
  }

  var OB_VIEWS = {
    welcome: function () {
      var li = function (ic, t, d) { return '<li><span class="ob-point-ic">' + icon(ic) + '</span><span><span class="ob-card-title">' + t + '</span><span class="caption">' + d + '</span></span></li>'; };
      return {
        art: '<div class="ob-hello" aria-hidden="true"><i></i><i></i><i></i></div>',
        title: 'Bienvenue sur Finy',
        sub: 'En deux minutes, on prépare ton espace ensemble. Ensuite, Finy te dit chaque jour combien il te reste.',
        body: '<ul class="ob-points">' + li('wallet', 'Ton salaire et tes dépenses fixes', 'Pour calculer ce qui reste vraiment') +
          li('sliders', 'Ce que tu veux suivre', 'Abonnements, budget, épargne') + li('bell', 'Tes préférences', 'Rappels et apparence') + '</ul>' +
          '<p class="caption ob-privacy">' + icon('lock') + 'Tout reste sur ton appareil : pas de compte, pas de serveur.</p>',
        next: 'C\'est parti',
        // Relancé depuis Réglages : on peut revenir à l'app sans rien changer.
        alt: state.meta.onboarded ? '<button type="button" class="btn ob-alt" data-ob="quit">Revenir à l\'app</button>'
          : '<label class="btn ob-alt">J\'ai déjà une sauvegarde Finy<input type="file" accept="application/json,.json" class="sr-only" data-input="import"></label>'
      };
    },
    name: function (a) {
      return {
        icon: 'user', title: 'Comment tu t\'appelles&nbsp;?', sub: 'Juste pour te dire bonjour.',
        body: '<label class="sr-only" for="ob-name">Ton prénom</label><input class="input ob-input" id="ob-name" type="text" maxlength="40" autocomplete="given-name" autocapitalize="words" placeholder="Ton prénom" value="' + esc(a.name) + '" data-ob-f="name">' +
          '<div class="ob-mock" aria-hidden="true"><span class="ob-mock-tag">Aperçu de ton accueil</span><span class="label">' + cap(longDay.format(today())) + '</span><span class="ob-mock-title" id="ob-hello">Bonjour' + (a.name.trim() ? ' ' + esc(a.name.trim()) : '') + '</span></div>',
        focus: '#ob-name'
      };
    },
    needs: function (a) {
      var n = a.name.trim();
      return {
        icon: 'sliders', title: (n ? esc(n) + ', qu\'' : 'Qu\'') + 'est-ce qui t\'amène&nbsp;?',
        sub: 'Choisis tout ce qui te parle, on adapte la suite. Savoir ce qu\'il te reste est toujours compris.',
        body: '<div class="ob-cards" role="group" aria-label="Ce que tu veux faire avec Finy">' + OB_NEEDS.map(function (x) {
          return '<button type="button" class="ob-card" role="checkbox" aria-checked="' + (a.needs.indexOf(x[0]) >= 0) + '" data-ob="need" data-k="' + x[0] + '">' +
            '<span class="ob-card-ic">' + icon(x[1]) + '</span><span class="ob-card-txt"><span class="ob-card-title">' + x[2] + '</span><span class="caption">' + x[3] + '</span></span>' + obCheckIcon() + '</button>';
        }).join('') + '</div>'
      };
    },
    salary: function (a) {
      return {
        icon: 'wallet', title: 'Combien tu gagnes par mois&nbsp;?', sub: 'Ton salaire net, celui qui arrive sur ton compte. C\'est la base de tout le calcul.',
        body: '<label class="ob-amount"><span class="sr-only">Salaire net par mois, en euros</span><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(a.salary) + '" data-ob-f="salary"><span aria-hidden="true">€</span></label>' +
          '<p class="caption ob-center">Une prime, un remboursement ? Tu les ajouteras à part avec « Revenu ».</p>',
        preview: true, focus: '[data-ob-f="salary"]'
      };
    },
    bills: function () {
      return {
        icon: 'calendar', title: 'Tes dépenses fixes', sub: 'Ce qui part chaque mois quoi qu\'il arrive. Touche celles que tu as, puis indique leur montant.',
        body: obPicker('bills', 'Dépenses fixes') + '<p class="caption">D\'autres charges ? Tu pourras les ajouter dans Abonnements › Charges fixes.</p>',
        preview: true
      };
    },
    subs: function () {
      return {
        icon: 'card', title: 'Tes abonnements', sub: 'Touche ceux que tu paies. Les prix sont indicatifs : ajuste-les si besoin.',
        body: obPicker('subs', 'Abonnements') + '<p class="caption">Il en manque ? Ajoute-les ensuite, ou importe un relevé bancaire dans Abonnements pour les retrouver.</p>',
        preview: true
      };
    },
    envs: function () {
      return {
        icon: 'receipt', title: 'Ton budget du quotidien', sub: 'Une enveloppe réserve une somme pour chaque poste. Finy suit ce que tu dépenses dedans.',
        body: obPicker('envs', 'Enveloppes'),
        preview: true
      };
    },
    savings: function (a) {
      var sal = obSalary();
      if (a.savings === null) a.savings = plain(Math.round(sal * 0.1));
      var v = parseAmount(a.savings || '0');
      return {
        icon: 'piggy', title: 'Combien mettre de côté chaque mois&nbsp;?', sub: 'Mis de côté dès le début du mois. Ce qui reste, tu le dépenses l\'esprit léger.',
        body: '<div class="chips ob-chips" role="group" aria-label="Part de ton salaire">' + [0, 5, 10, 15, 20].map(function (p) {
          var amt = Math.round(sal * p) / 100;
          return '<button type="button" class="chip" data-ob="pct" data-k="' + amt + '" aria-pressed="' + (v !== null && Math.abs(v - amt) < 0.005) + '">' + (p ? p + ' %' : 'Rien') + '</button>';
        }).join('') + '</div>' +
          '<label class="ob-amount"><span class="sr-only">Épargne par mois, en euros</span><input type="text" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(a.savings) + '" data-ob-f="savings"><span aria-hidden="true">€</span></label>',
        preview: true
      };
    },
    goal: function (a) {
      var g = a.goal;
      var cards = OB_GOALS.map(function (p) {
        return '<button type="button" class="ob-opt" role="radio" aria-checked="' + (g.key === p[0]) + '" data-ob="goal" data-k="' + p[0] + '"><span class="ob-opt-name">' + (p[1] || 'Autre projet') + '</span>' + obCheckIcon() + '</button>';
      }).join('');
      var form = '';
      if (g.key) {
        var t = parseAmount(g.target);
        form = '<div class="ob-items"><label class="field"><span>Nom</span><input class="input" type="text" maxlength="40" autocomplete="off" placeholder="Mon projet" value="' + esc(g.name) + '" data-ob-f="goal-name"></label>' +
          '<label class="field"><span>Montant à atteindre (€)</span><input class="input" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + esc(g.target) + '" data-ob-f="goal-target"></label>' +
          '<div class="field"><span>En combien de temps&nbsp;?</span><div class="chips ob-chips" role="radiogroup" aria-label="Durée">' + [[6, '6 mois'], [12, '1 an'], [24, '2 ans'], [36, '3 ans'], [0, 'Sans échéance']].map(function (d) {
            return '<button type="button" class="chip" role="radio" aria-checked="' + (g.months === d[0]) + '" data-ob="months" data-k="' + d[0] + '">' + d[1] + '</button>';
          }).join('') + '</div></div>' +
          '<p class="pill-info" id="ob-goal-line">' + (g.months === 0 ? '<span class="strong">Tu verses quand tu veux</span><span class="muted">rien n\'est réservé chaque mois</span>'
            : t > 0 ? '<span class="strong">' + euro(Math.ceil(t / g.months * 100) / 100) + ' par mois</span><span class="muted">pendant ' + durationLabel(g.months) + '</span>' : '<span class="muted">Indique un montant pour voir l\'effort par mois.</span>') + '</p></div>';
      }
      return {
        icon: 'target', title: 'Un objectif en tête&nbsp;?', sub: 'Un voyage, un coussin de sécurité… Finy calcule combien mettre de côté chaque mois.',
        body: '<div class="ob-grid" role="radiogroup" aria-label="Objectif">' + cards + '</div>' + form,
        preview: !!g.key, next: g.key ? null : 'Pas d\'objectif pour l\'instant'
      };
    },
    remind: function (a) {
      var can = 'Notification' in window;
      var r = a.remind;
      var u = upcoming()[0];
      var sample = u ? { name: u.sub.name, amount: u.sub.amount } : { name: 'Netflix', amount: 14.99 };
      var when = new Date(today().getFullYear(), today().getMonth(), today().getDate() + r.days);
      return {
        icon: 'bell', title: 'On te prévient avant chaque prélèvement&nbsp;?', sub: 'Une notification quelques jours avant, pour ne jamais être pris de court.',
        body: '<div class="ob-toggle"><span class="ob-card-txt"><span class="ob-card-title">Activer les rappels</span><span class="caption">' +
          (can ? 'Ton appareil va te demander l\'autorisation.' : 'Sur iPhone, ajoute d\'abord Finy à l\'écran d\'accueil (Partager › Sur l\'écran d\'accueil), puis active-les dans Réglages.') + '</span></span>' +
          '<button type="button" class="switch" role="switch" aria-checked="' + r.enabled + '" aria-label="Activer les rappels" data-ob="remind"' + (can ? '' : ' disabled') + '></button></div>' +
          (r.enabled ? '<div class="field"><span>Combien de jours avant&nbsp;?</span><div class="chips ob-chips" role="radiogroup" aria-label="Jours avant le prélèvement">' + [1, 2, 3, 5].map(function (d) {
            return '<button type="button" class="chip" role="radio" aria-checked="' + (r.days === d) + '" data-ob="days" data-k="' + d + '">' + d + (d > 1 ? ' jours' : ' jour') + '</button>';
          }).join('') + '</div></div>' : '') +
          '<div class="ob-notif' + (r.enabled ? '' : ' off') + '" aria-hidden="true"><span class="ob-notif-ic">' + LOGO + '</span><span class="ob-notif-txt"><span class="ob-notif-app">Finy · maintenant</span>' +
          '<span class="strong">' + esc(sample.name) + (r.days === 1 ? ' demain' : ' dans ' + r.days + ' jours') + '</span><span class="caption">' + euro(sample.amount) + ' seront prélevés le ' + shortDate.format(when).replace(/\.$/, '') + '.</span></span></div>',
        next: r.enabled ? null : 'Continuer sans rappels'
      };
    },
    prefs: function (a) {
      return {
        icon: 'sun', title: 'Clair ou sombre&nbsp;?', sub: 'Tu pourras changer d\'avis à tout moment dans Réglages.',
        body: '<div class="ob-themes" role="radiogroup" aria-label="Apparence">' + [['system', 'Système'], ['light', 'Clair'], ['dark', 'Sombre']].map(function (t) {
          return '<button type="button" class="ob-theme" role="radio" aria-checked="' + (a.theme === t[0]) + '" data-ob="theme" data-k="' + t[0] + '">' +
            '<span class="ob-theme-art ob-theme-' + t[0] + '" aria-hidden="true"><i></i><i></i><i></i></span><span class="ob-opt-name">' + t[1] + '</span>' + obCheckIcon() + '</button>';
        }).join('') + '</div>'
      };
    },
    recap: function (a) {
      var t = totals();
      var has = function (need) { return a.needs.indexOf(need) >= 0; };
      var rows = [
        ['name', 'Prénom', state.profile.name ? esc(state.profile.name) : 'Pas renseigné', 'var(--muted)'],
        ['salary', 'Salaire net', euro(state.salary) + ' par mois', 'var(--ink)'],
        ['bills', 'Charges fixes', obSum(ofKind('bill'), 'Aucune pour l\'instant'), 'var(--chart-5)']
      ];
      if (has('subs')) rows.push(['subs', 'Abonnements', obSum(ofKind('sub'), 'Aucun pour l\'instant'), 'var(--chart-2)']);
      if (has('budget')) rows.push(['envs', 'Enveloppes', obSum(state.categories, 'Aucune pour l\'instant'), 'var(--chart-3)']);
      if (has('save')) {
        rows.push(['savings', 'Épargne', state.savings > 0 ? euro(state.savings) + ' par mois' : 'Rien pour l\'instant', 'var(--accent)']);
        rows.push(['goal', 'Objectifs', state.goals.length ? state.goals.map(function (g) { return esc(g.name) + ' · ' + euro(g.target) + (g.open ? ' sans échéance' : ' en ' + durationLabel(g.months)); }).join(', ') : 'Aucun pour l\'instant', 'var(--chart-4)']);
      }
      if (has('remind')) rows.push(['remind', 'Rappels', state.settings.reminders.enabled ? state.settings.reminders.daysBefore + (state.settings.reminders.daysBefore > 1 ? ' jours' : ' jour') + ' avant chaque prélèvement' : 'Désactivés', 'var(--warning)']);
      rows.push(['prefs', 'Apparence', { system: 'Système (comme ton appareil)', light: 'Clair', dark: 'Sombre' }[state.settings.theme], 'var(--muted)']);
      var more = OB_NEEDS.filter(function (x) { return !has(x[0]); });
      return {
        icon: 'check', title: 'Voici ton espace', sub: 'Touche une ligne pour la modifier.',
        body: '<div class="ob-recap-hero"><span class="label">Il te reste ce mois-ci</span>' + hero(t.free) + '</div>' +
          '<div class="group ob-recap">' + rows.map(function (r) {
            return '<button type="button" class="row" data-ob="edit" data-k="' + r[0] + '"><span class="dot" style="--c:' + r[3] + '" aria-hidden="true"></span>' +
              '<span class="row-main"><span class="row-title">' + r[1] + '</span><span class="row-meta"><span>' + r[2] + '</span></span></span>' +
              '<span class="sr-only">Modifier</span>' + icon('right', 'chev') + '</button>';
          }).join('') + '</div>' +
          (more.length ? '<div class="field"><span>Tu veux aussi…</span><div class="ob-more">' + more.map(function (x) {
            return '<button type="button" class="chip" data-ob="addneed" data-k="' + x[0] + '">' + icon('plus') + x[2] + '</button>';
          }).join('') + '</div></div>' : ''),
        next: 'C\'est tout bon'
      };
    },
    done: function (a) {
      var n = a.name.trim();
      var fa = obFirstAction();
      return {
        art: '<div class="ob-done-art" aria-hidden="true"><span class="ob-ring"></span>' + icon('check') + '</div>',
        title: 'C\'est prêt' + (n ? ', ' + esc(n) : '') + '&nbsp;!', sub: 'Ton espace est configuré. Voici ce qu\'il te reste ce mois-ci :',
        body: '<div class="ob-done-amount">' + hero(totals().free, 'ob-free') + '</div>' +
          '<div class="ob-first"><span class="label">Pour commencer</span><span class="ob-card-title">' + fa.title + '</span><span class="caption">' + fa.text + '</span></div>',
        next: fa.cta,
        alt: fa.action === 'home' ? '' : '<button type="button" class="btn ob-alt" data-ob="finish" data-k="home">Découvrir mon accueil</button>'
      };
    }
  };

  // Dessine l'étape en cours. `same` : même étape redessinée après un choix (sans transition, focus gardé).
  function obRender(same) {
    var o = state.onboarding;
    var steps = obSteps();
    if (steps.indexOf(o.step) < 0) o.step = 'needs';
    var v = OB_VIEWS[o.step](o.a);
    var core = steps.filter(function (s) { return s !== 'welcome' && s !== 'done'; });
    var i = core.indexOf(o.step);
    var pct = o.step === 'welcome' ? 0 : o.step === 'done' ? 100 : Math.round((i + 1) / (core.length + 1) * 100);
    var bare = o.step === 'welcome';
    var top = '<header class="ob-top">' +
      (bare ? '<span class="ob-top-space"></span>' : '<button type="button" class="icon-btn" data-ob="back" aria-label="' + (o.back === 'recap' ? 'Revenir au récapitulatif' : 'Revenir à l\'étape précédente') + '">' + icon('left') + '</button>') +
      (bare ? '<span></span>' : o.step === 'done' ? '<span class="ob-top-logo" aria-hidden="true">' + LOGO + 'finy</span>'
        : '<div class="ob-progress" role="progressbar" aria-label="Progression" aria-valuemin="1" aria-valuemax="' + core.length + '" aria-valuenow="' + (i + 1) + '" aria-valuetext="Étape ' + (i + 1) + ' sur ' + core.length + '"><span style="width:' + (same ? pct : obPct) + '%"></span></div>') +
      (OB_OPTIONAL[o.step] && o.back !== 'recap' ? '<button type="button" class="ob-skip" data-ob="skip">Passer</button>' : '<span class="ob-top-space"></span>') + '</header>';
    var scroll = same ? obEl.scrollTop : 0;
    var active = same && document.activeElement && obEl.contains(document.activeElement) ? document.activeElement : null;
    var activeSel = active && active.dataset.ob ? '[data-ob="' + active.dataset.ob + '"]' + (active.dataset.k ? '[data-k="' + active.dataset.k + '"]' : '') : null;
    var just = ui.obJust;
    ui.obJust = null;

    obEl.innerHTML = '<form class="ob-panel" novalidate data-step="' + o.step + '">' + top +
      '<div class="ob-screen' + (!same && obDir !== 'none' ? ' ob-' + obDir : '') + '">' +
      (v.art || '<span class="ob-badge" aria-hidden="true">' + icon(v.icon) + '</span>') +
      '<h1 class="ob-title" id="ob-title" tabindex="-1">' + v.title + '</h1>' +
      (v.sub ? '<p class="ob-sub">' + v.sub + '</p>' : '') +
      '<div class="ob-body">' + v.body + '</div></div>' +
      '<footer class="ob-foot">' + (v.preview ? '<p class="pill-info ob-preview" id="ob-preview" aria-live="polite"></p>' : '') +
      '<p class="alert ob-error" id="ob-error" role="alert" hidden></p>' +
      '<button type="submit" class="btn btn-primary btn-block">' + (v.next || (o.back === 'recap' ? 'Enregistrer' : 'Continuer')) + '</button>' + (v.alt || '') +
      '</footer></form>';

    var bar = obEl.querySelector('.ob-progress span');
    if (bar && !same) requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = pct + '%'; }); });
    obPct = pct;
    if (just) { var j = obEl.querySelector(just); if (j) j.classList.add('ob-just'); }
    if (v.preview) obPreview();
    runCounters(obEl);
    if (same) {
      obEl.scrollTop = scroll;
      var back = activeSel && obEl.querySelector(activeSel);
      if (back) back.focus({ preventScroll: true });
    } else {
      obEl.scrollTop = 0;
      var f = v.focus && window.matchMedia && window.matchMedia('(hover: hover)').matches ? obEl.querySelector(v.focus) : null;
      (f || document.getElementById('ob-title')).focus({ preventScroll: true });
    }
  }

  function obChoice(sel) {
    ui.obJust = sel;
    if (navigator.vibrate) navigator.vibrate(8);
    obDraft();
    obRender(true);
  }

  obEl.addEventListener('submit', function (e) {
    e.preventDefault();
    obNext();
  });

  obEl.addEventListener('click', function (e) {
    var el = e.target.closest('[data-ob]');
    if (!el || !state.onboarding) return;
    var a = state.onboarding.a, k = el.dataset.k;
    switch (el.dataset.ob) {
      case 'back': return obBack();
      case 'skip': return obSkip();
      case 'edit': return obGoTo(k);
      case 'finish': return obFinish(k);
      case 'quit':
        state.onboarding = null;
        save();
        obClose();
        return render();
      case 'need':
        a.needs = a.needs.indexOf(k) >= 0 ? a.needs.filter(function (x) { return x !== k; }) : a.needs.concat(k);
        a.needs = OB_NEEDS.map(function (x) { return x[0]; }).filter(function (x) { return a.needs.indexOf(x) >= 0; });
        return obChoice('[data-ob="need"][data-k="' + k + '"]');
      case 'addneed':
        if (a.needs.indexOf(k) < 0) a.needs.push(k);
        return obGoTo({ subs: 'subs', budget: 'envs', save: 'savings', remind: 'remind' }[k]);
      case 'pick':
        var g = el.dataset.g, p = OB_LIST[g].filter(function (x) { return x[0] === k; })[0];
        var x = a[g][k];
        if (x) x.on = !x.on;
        else a[g][k] = { on: true, amount: g === 'subs' ? plain(p[4]) : g === 'envs' ? plain(p[2]) : '', day: g === 'bills' ? String(p[3]) : g === 'subs' ? '1' : '' };
        obChoice('[data-ob="pick"][data-k="' + k + '"]');
        // Une charge sans montant : on va directement au champ.
        var amt = a[g][k].on && !a[g][k].amount && obEl.querySelector('[data-ob-f="amt"][data-k="' + k + '"]');
        if (amt) amt.focus();
        return;
      case 'pct':
        a.savings = plain(parseFloat(k));
        return obChoice('[data-ob="pct"][data-k="' + k + '"]');
      case 'goal':
        if (a.goal.key === k) { a.goal.key = ''; return obChoice(null); }
        var preset = OB_GOALS.filter(function (x) { return x[0] === k; })[0];
        var target = preset[2] === null ? Math.max(500, Math.round(obSalary() * 3 / 100) * 100) : preset[2];
        a.goal = { key: k, name: preset[1], target: plain(target), months: preset[3] };
        obChoice('[data-ob="goal"][data-k="' + k + '"]');
        if (!preset[1]) { var nm = obEl.querySelector('[data-ob-f="goal-name"]'); if (nm) nm.focus(); }
        return;
      case 'months':
        a.goal.months = parseInt(k, 10);
        return obChoice('[data-ob="months"][data-k="' + k + '"]');
      case 'days':
        a.remind.days = parseInt(k, 10);
        return obChoice('[data-ob="days"][data-k="' + k + '"]');
      case 'theme':
        a.theme = k;
        state.settings.theme = k;
        applyTheme();
        return obChoice('[data-ob="theme"][data-k="' + k + '"]');
      case 'remind':
        if (a.remind.enabled) { a.remind.enabled = false; return flipSwitch(el, function () { obChoice(null); }); }
        if (!('Notification' in window)) return;
        Notification.requestPermission().then(function (perm) {
          if (perm !== 'granted') return obError({ msg: 'Les notifications sont bloquées. Tu pourras les autoriser plus tard dans les réglages de ton appareil, puis dans Réglages › Rappels.' });
          a.remind.enabled = true;
          flipSwitch(el, function () { obChoice(null); });
        });
        return;
    }
  });

  obEl.addEventListener('input', function (e) {
    var el = e.target, f = el.dataset.obF;
    if (!f || !state.onboarding) return;
    var a = state.onboarding.a;
    if (f === 'name') {
      a.name = el.value.slice(0, 40);
      document.getElementById('ob-hello').textContent = 'Bonjour' + (a.name.trim() ? ' ' + a.name.trim() : '');
    }
    if (f === 'salary') a.salary = el.value.slice(0, 14);
    if (f === 'savings') {
      a.savings = el.value.slice(0, 14);
      var v = parseAmount(a.savings);
      obEl.querySelectorAll('[data-ob="pct"]').forEach(function (c) { c.setAttribute('aria-pressed', String(v !== null && Math.abs(v - parseFloat(c.dataset.k)) < 0.005)); });
    }
    if (f === 'amt' || f === 'day') a[el.dataset.g][el.dataset.k][f === 'amt' ? 'amount' : 'day'] = el.value.slice(0, f === 'amt' ? 14 : 2);
    if (f === 'goal-name') a.goal.name = el.value.slice(0, 40);
    if (f === 'goal-target') {
      a.goal.target = el.value.slice(0, 14);
      var t = parseAmount(a.goal.target), line = document.getElementById('ob-goal-line');
      if (line && a.goal.months) line.innerHTML = t > 0 ? '<span class="strong">' + euro(Math.ceil(t / a.goal.months * 100) / 100) + ' par mois</span><span class="muted">pendant ' + durationLabel(a.goal.months) + '</span>' : '<span class="muted">Indique un montant pour voir l\'effort par mois.</span>';
    }
    if (el.getAttribute('aria-invalid')) {
      el.removeAttribute('aria-invalid');
      document.getElementById('ob-error').hidden = true;
    }
    obPreview();
    obDraft();
  });

  // Premiers pas, sur l'accueil après le parcours : se cochent d'eux-mêmes, et se masquent.
  function firstSteps() {
    if (!state.meta.firstSteps) return '';
    var items = [];
    if (state.categories.length) items.push([state.expenses.length > 0, 'Noter une première dépense', 'add-exp']);
    items.push([ofKind('sub').length > 0, 'Ajouter un abonnement', 'add-sub']);
    if (!state.goals.length) items.push([false, 'Te fixer un objectif d\'épargne', 'add-goal']);
    items.push([!!state.meta.lastExport, 'Exporter une sauvegarde', 'export']);
    var done = items.filter(function (x) { return x[0]; }).length;
    if (done === items.length) return '';
    return '<section class="section first-steps"><div class="section-head"><h2 class="heading">Premiers pas</h2>' +
      '<button type="button" class="link-btn" style="color:var(--muted)" data-action="first-steps-hide">Masquer</button></div>' +
      '<div class="group">' + items.map(function (x) {
        return x[0] ? '<div class="row"><span class="fs-check done" aria-hidden="true">' + icon('check') + '</span><span class="row-main"><span class="row-title fs-done">' + x[1] + '</span></span><span class="sr-only">Fait</span></div>'
          : '<button type="button" class="row" data-action="' + x[2] + '"><span class="fs-check" aria-hidden="true"></span><span class="row-main"><span class="row-title">' + x[1] + '</span></span>' + icon('right', 'chev') + '</button>';
      }).join('') + '</div><p class="caption">' + done + ' sur ' + items.length + ' · Tes réglages restent modifiables dans Réglages.</p></section>';
  }

  // ---------- Démarrage ----------

  applyTheme();
  // Données d'avant la configuration guidée : le parcours est considéré comme fait.
  if (!state.meta.onboarded && !state.onboarding && (state.salary > 0 || state.subs.length || state.categories.length || state.goals.length)) {
    state.meta.onboarded = state.meta.since || iso(today());
  }
  // Enregistre la photo du mois dans l'historique dès l'ouverture.
  if (state.salary > 0) save();
  render();
  if (!state.meta.onboarded) obOpen(false);
  checkReminders();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
