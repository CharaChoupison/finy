/* Finy — web app. Toutes les données restent dans le navigateur (localStorage). */
(function () {
  'use strict';

  // ---------- Constantes ----------

  var STORE_KEY = 'finy:v1';
  var WEEKS_PER_MONTH = 52 / 12;
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
    close: 'M6 6l12 12M18 6L6 18'
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
      settings: {
        theme: 'system',
        homeCount: 3,
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
        image: isImageData(s.image) ? s.image : null
      };
    }) : [];
    var st = data.settings || {};
    out.settings.theme = ['system', 'light', 'dark'].indexOf(st.theme) >= 0 ? st.theme : 'system';
    out.settings.homeCount = st.homeCount === 5 ? 5 : 3;
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
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      toast("Impossible d'enregistrer sur cet appareil");
    }
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
  var ui = { abosFilter: 'Tous', abosQuery: '', calOffset: 0, calSel: null, focusAfter: null };

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

  // Prochain prélèvement d'un abonnement à partir d'une date (mensuel ou annuel).
  function nextDate(s, from) {
    var y = from.getFullYear();
    if (s.frequency === 'year') {
      var a = onDay(y, s.month, s.day);
      return a < from ? onDay(y + 1, s.month, s.day) : a;
    }
    var d = onDay(y, from.getMonth(), s.day);
    return d < from ? onDay(y, from.getMonth() + 1, s.day) : d;
  }

  // L'abonnement est-il prélevé pendant ce mois ?
  function chargedIn(s, m) { return s.frequency !== 'year' || s.month === m; }

  // Coût ramené au mois : un abonnement annuel compte pour 1/12 chaque mois.
  function monthlyCost(s) { return s.frequency === 'year' ? s.amount / 12 : s.amount; }

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

  // ---------- Calculs ----------

  function totals() {
    var subs = state.subs.reduce(function (a, s) { return a + monthlyCost(s); }, 0);
    var cats = state.categories.reduce(function (a, c) { return a + c.amount; }, 0);
    var rest = state.salary - state.savings - subs;
    return { subs: subs, cats: cats, rest: rest, free: rest - cats, weekly: Math.max(0, rest) / WEEKS_PER_MONTH };
  }

  function yearlyCount() {
    return state.subs.filter(function (s) { return s.frequency === 'year'; }).length;
  }

  function upcoming() {
    var t = today();
    return state.subs.map(function (s) {
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
    var extra = (showCategory ? esc(s.category) + ' · ' : '') + shortDate.format(u.date) +
      (s.frequency === 'year' ? ' · ≈ ' + euro(s.amount / 12) + '/mois' : '');
    return '<button type="button" class="row tall" data-action="edit-sub" data-id="' + esc(s.id) + '">' +
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

  function hero(n, cls) {
    var p = heroParts(n);
    return '<p class="amount-hero' + (n < 0 ? ' negative' : '') + (cls ? ' ' + cls : '') + '"><span class="int">' + p.int + '</span><span class="dec">' + p.dec + '</span></p>';
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
      html += '<section class="hero a-hero" aria-label="Ce qu\'il te reste"><p class="label">Il te reste ce mois-ci</p>' + hero(t.rest) +
        '<p class="pill-info"><span class="strong">' + euro(t.weekly) + '</span><span class="muted">pour te faire plaisir cette semaine</span></p></section>';
    }

    html += '<section class="actions a-actions" aria-label="Actions rapides">' +
      action('add-sub', 'plus', 'Ajouter') + action('edit-salary', 'wallet', 'Salaire') +
      action('add-cat', 'grid', 'Catégorie') + action('go-reminders', 'bell', 'Rappels') + '</section>';

    if (state.salary > 0) {
      var parts = [
        { name: 'Épargne', value: state.savings, color: 'var(--accent)', href: '#/epargne' },
        { name: 'Abonnements', value: t.subs, color: 'var(--chart-2)', href: '#/abonnements' }
      ];
      state.categories.forEach(function (c, i) {
        parts.push({ name: c.name, value: c.amount, color: CAT_PALETTE[i % CAT_PALETTE.length], id: c.id });
      });
      var bar = parts.concat([{ name: 'Libre', value: Math.max(0, t.free), color: 'var(--border)' }]);
      var aria = bar.filter(function (p) { return p.value > 0; }).map(function (p) { return p.name + ' ' + euro(p.value); }).join(', ');

      html += '<section class="section a-main"><div class="section-head"><h2 class="heading">Répartition</h2>' +
        '<span class="label">Salaire ' + euro(state.salary) + '</span></div>' + splitBar(bar, aria) + '<div class="group">' +
        parts.map(function (p) {
          var inner = '<span class="dot" style="--c:' + p.color + '" aria-hidden="true"></span><span class="row-main"><span class="row-title">' + esc(p.name) + '</span></span><span class="row-amount">' + euro(p.value) + '</span>';
          return p.href
            ? '<a class="row" href="' + p.href + '">' + inner + '</a>'
            : '<button type="button" class="row" data-action="edit-cat" data-id="' + esc(p.id) + '">' + inner + '</button>';
        }).join('') +
        '<div class="row"><span class="dot" style="--c:var(--border)" aria-hidden="true"></span><span class="row-main"><span class="row-title strong">Libre</span></span>' +
        '<span class="row-amount"' + (t.free < 0 ? ' style="color:var(--danger)"' : '') + '>' + euro(t.free) + '</span></div>' +
        '<button type="button" class="row row-link" data-action="add-cat">' + icon('plus') + 'Ajouter une catégorie</button></div>' +
        (t.rest < 0 ? '<p class="alert">Tes dépenses fixes dépassent ton salaire. Baisse ton épargne ou retire un abonnement.</p>' : '') +
        '</section>';
    }

    var next = upcoming().slice(0, state.settings.homeCount);
    html += '<section class="section a-side"><div class="section-head"><h2 class="heading">À venir</h2><a href="#/calendrier" class="label" style="color:var(--accent)">Calendrier</a></div><div class="group">' +
      (next.length ? next.map(function (u) { return subRow(u, false); }).join('')
        : '<div class="empty"><span>Aucun abonnement pour l\'instant.</span><button type="button" class="link-btn" data-action="add-sub">Ajouter mon premier abonnement</button></div>') +
      '</div></section>';
    return html;
  }

  function action(name, ic, label) {
    return '<button type="button" class="action" data-action="' + name + '"><span>' + icon(ic) + '</span><span>' + label + '</span></button>';
  }

  // ---------- Écran : Abonnements ----------

  function viewAbos() {
    var t = totals();
    var html = '<header class="topbar a-top"><h1 class="title">Abonnements</h1>' +
      '<button type="button" class="btn btn-primary" data-action="add-sub">' + icon('plus') + 'Ajouter</button></header>';

    html += '<section class="hero a-hero" aria-label="Total"><p class="amount-big">' + euro(t.subs) + '<small>/mois</small></p>' +
      '<p class="label" style="font-weight:400">' + euro(t.subs * 12) + ' sur un an · ' + state.subs.length + ' abonnement' + (state.subs.length > 1 ? 's' : '') +
      (yearlyCount() ? ', dont ' + yearlyCount() + ' annuel' + (yearlyCount() > 1 ? 's' : '') + ' compté' + (yearlyCount() > 1 ? 's' : '') + ' au mois' : '') + '</p></section>';

    if (!state.subs.length) {
      return html + '<div class="group a-main"><div class="empty"><span>Aucun abonnement pour l\'instant.</span><span class="caption">Ajoute tes paiements récurrents pour voir où part ton argent.</span></div></div>';
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
    state.subs.forEach(function (s) { byCat[s.category] = (byCat[s.category] || 0) + monthlyCost(s); });
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
      '<div class="group" id="abos-list"></div></section>';
    return html;
  }

  function fillAbosList() {
    var list = document.getElementById('abos-list');
    if (!list) return;
    var q = ui.abosQuery.trim().toLowerCase();
    var items = upcoming().filter(function (u) {
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
    var inMonth = state.subs.filter(function (s) { return chargedIn(s, m); });
    inMonth.forEach(function (s) {
      var d = Math.min(s.day, n);
      (byDay[d] = byDay[d] || []).push(s);
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
      var cls = ['day'];
      if (has) cls.push('has');
      if (diff < 0) cls.push('past');
      if (has && diff >= 0 && diff <= state.settings.alertDays) cls.push('soon-day');
      if (diff === 0) cls.push('today');
      html += '<button type="button" class="' + cls.join(' ') + '" data-action="cal-day" data-day="' + day + '" aria-pressed="' + (day === ui.calSel) + '" aria-label="' + day + ' ' + cap(new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date)) + (has ? ', prélèvement prévu' : '') + '"><span>' + day + '</span><i aria-hidden="true"></i></button>';
    }
    html += '</div><div class="cal-legend"><span><i style="--c:var(--accent)"></i>À venir</span><span><i style="--c:var(--warning)"></i>Bientôt</span><span><i style="--c:var(--chart-2)"></i>Déjà prélevé</span></div></section>';

    var sel = ui.calSel && ui.calSel <= n ? ui.calSel : null;
    html += '<section class="section a-side"><h2 class="heading">' + (sel ? cap(longDay.format(new Date(y, m, sel))) : 'Choisis un jour') + '</h2><div class="group">';
    var items = sel ? (byDay[sel] || []) : [];
    if (items.length) {
      var d = diffDays(new Date(y, m, sel), t);
      html += items.map(function (s) {
        var soon = d >= 0 && d <= state.settings.alertDays;
        return '<button type="button" class="row tall" data-action="edit-sub" data-id="' + esc(s.id) + '">' + subTile(s) +
          '<span class="row-main"><span class="row-title">' + esc(s.name) + '</span><span class="row-meta"><span class="' + (soon ? 'soon' : '') + '">' + relative(d) + '</span></span></span>' +
          '<span class="row-amount">' + priceLabel(s) + '</span></button>';
      }).join('');
    } else {
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
    html += '</section><section class="section a-side"><h2 class="heading">Ce qu\'il te reste</h2><div class="group" id="sv-calc"></div><p class="alert" id="sv-alert" hidden>Avec ce montant, tes dépenses fixes dépassent ton salaire. Baisse un peu ton épargne.</p></section>';
    return html;
  }

  function fillSavings(skipInput) {
    var heroEl = document.getElementById('sv-hero');
    if (!heroEl) return;
    var t = totals();
    heroEl.innerHTML = hero(state.savings);
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
      calcRow('Épargne', '− ' + euro(state.savings), 'var(--accent)') +
      calcRow(yearlyCount() ? 'Abonnements (annuels au mois)' : 'Abonnements', '− ' + euro(t.subs), 'var(--chart-2)') +
      '<div class="row" style="min-height:60px"><span class="row-main"><span class="strong">Il te reste</span></span><span class="row-amount" style="font-size:20px;line-height:26px;font-weight:700' + (t.rest < 0 ? ';color:var(--danger)' : '') + '">' + euro(t.rest) + '</span></div>' +
      '<div class="row"><span class="row-main"><span class="muted">Pour te faire plaisir chaque semaine</span></span><span class="row-amount">' + euro(t.weekly) + '</span></div>';
    document.getElementById('sv-alert').hidden = !(state.salary > 0 && t.rest < 0);
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
    if (r.after) r.after();
    document.querySelectorAll('.tabbar a').forEach(function (a) {
      if (a.dataset.tab === r.tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.title = { '': 'Finy', calendrier: 'Calendrier · Finy', abonnements: 'Abonnements · Finy', epargne: 'Épargne · Finy', reglages: 'Réglages · Finy' }[key];
    if (ui.focusAfter) {
      var target = document.getElementById(ui.focusAfter);
      ui.focusAfter = null;
      if (target) { target.scrollIntoView({ block: 'start' }); return; }
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
    sheetForm.innerHTML = '<span class="sheet-handle" aria-hidden="true"></span>' +
      '<div class="sheet-head"><h2 class="heading" id="sheet-title">' + title + '</h2>' +
      '<button type="button" class="icon-btn" aria-label="Fermer" data-action="sheet-close">' + icon('close') + '</button></div>' +
      body + '<p class="alert" id="sheet-error" hidden></p>' +
      '<div class="sheet-actions"><button type="submit" class="btn btn-primary btn-block">' + submitLabel + '</button>' + (extra || '') + '</div>';
    if (typeof sheet.showModal === 'function') sheet.showModal();
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

  function editSub(id) {
    var s = state.subs.filter(function (x) { return x.id === id; })[0];
    var isNew = !s;
    s = s || { name: '', amount: 0, day: today().getDate(), month: today().getMonth(), frequency: 'month', category: 'Streaming', site: '', image: null };
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
    var body = '<div class="image-pick"><span id="draft-tile">' + subTile(sheetDraft, 'tile-lg') + '</span>' +
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
      '<span class="caption">Pour afficher son logo automatiquement. Seul le nom du site est envoyé à DuckDuckGo pour récupérer l\'icône.</span></label>';
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
        category: data.category || 'Autre', site: site, image: sheetDraft.image
      };
      if (isNew) state.subs.push(item);
      else state.subs = state.subs.map(function (x) { return x.id === id ? item : x; });
      toast(isNew ? 'Abonnement ajouté' : 'Abonnement modifié');
    }, del);
  }

  function editCat(id) {
    var c = state.categories.filter(function (x) { return x.id === id; })[0];
    var isNew = !c;
    c = c || { name: '', amount: 0 };
    var body = '<p class="caption">Une catégorie réserve une part de ton salaire pour une dépense régulière : alimentation, soins, essence…</p>' +
      '<label class="field"><span>Nom</span><input class="input" name="name" type="text" maxlength="40" autocomplete="off" placeholder="Alimentation" value="' + esc(c.name) + '"></label>' +
      amountField('amount', 'Montant par mois (€)', c.amount);
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
    Object.keys(state.notified).forEach(function (k) {
      if (!keep[k] && diffDays(t, new Date(state.notified[k])) > 40) { delete state.notified[k]; changed = true; }
    });
    if (changed) save();
  }

  function toggleReminders() {
    var r = state.settings.reminders;
    if (r.enabled) {
      r.enabled = false;
      save(); render();
      return;
    }
    if (!('Notification' in window)) return toast('Notifications indisponibles ici');
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') {
        toast('Autorise les notifications dans les réglages du téléphone');
        return;
      }
      r.enabled = true;
      save(); render();
      checkReminders();
    });
  }

  // ---------- Sauvegarde ----------

  function exportData() {
    var data = JSON.parse(JSON.stringify(state));
    delete data.notified;
    var name = 'finy-sauvegarde-' + iso(today()) + '.json';
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var file;
    try { file = new File([blob], name, { type: 'application/json' }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Sauvegarde Finy' }).catch(function () {});
      return;
    }
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
      case 'sheet-close': return closeSheet();
      case 'delete-sub':
        if (!window.confirm('Supprimer cet abonnement ?')) return;
        state.subs = state.subs.filter(function (s) { return s.id !== id; });
        closeSheet(); save(); render(); toast('Abonnement supprimé');
        return;
      case 'delete-cat':
        if (!window.confirm('Supprimer cette catégorie ?')) return;
        state.categories = state.categories.filter(function (c) { return c.id !== id; });
        closeSheet(); save(); render();
        return;
      case 'go-reminders':
        ui.focusAfter = 'rappels';
        if (currentRoute() === 'reglages') render(); else location.hash = '#/reglages';
        return;
      case 'abos-filter':
        ui.abosFilter = v;
        document.querySelectorAll('.chip[data-action="abos-filter"]').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.value === v)); });
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
        save(); return render();
      case 'step':
        var key = el.dataset.key;
        var target = key === 'alertDays' ? state.settings : state.settings.reminders;
        target[key] = Math.min(30, Math.max(1, target[key] + parseInt(v, 10)));
        save(); return render();
      case 'toggle-reminders': return toggleReminders();
      case 'toggle-sameday':
        state.settings.reminders.sameDay = !state.settings.reminders.sameDay;
        save(); return render();
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
  render();
  checkReminders();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
