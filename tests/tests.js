/* Tests de Finy : calculs, dates et import. Ouvre tests/index.html (serveur local) pour les lancer. */
(function () {
  'use strict';
  var T = window.FINY_TEST;
  var api = T.api;
  var out = document.getElementById('out');
  var passed = 0, failed = 0;

  function line(cls, text) {
    var p = document.createElement('p');
    p.className = cls;
    p.textContent = text;
    out.appendChild(p);
  }

  function group(name) {
    var h = document.createElement('h2');
    h.textContent = name;
    out.appendChild(h);
  }

  function test(name, fn) {
    try { fn(); passed++; line('ok', '✓ ' + name); } catch (e) { failed++; line('ko', '✗ ' + name + '\n    ' + e.message); }
  }

  function eq(got, want, what) {
    var g = JSON.stringify(got), w = JSON.stringify(want);
    if (g !== w) throw new Error((what ? what + ' : ' : '') + 'obtenu ' + g + ', attendu ' + w);
  }

  function near(got, want, what) {
    if (Math.abs(got - want) > 0.011) throw new Error((what ? what + ' : ' : '') + 'obtenu ' + got + ', attendu ' + want);
  }

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function d(s) { return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
  function at(day) { T.now = day + 'T12:00:00'; }
  function reset(data) { api.reset(data); }
  function sub(o) { return Object.assign({ id: 's' + Math.random(), name: 'Test', amount: 10, day: 1, frequency: 'month', month: 0, category: 'Autre', site: '', image: null, trialEnd: '', paused: false, kind: 'sub' }, o); }
  function per(p) { return { start: iso(p.start), end: iso(p.end), key: p.key, days: p.days }; }

  // ---------- Mois budgétaire ----------
  group('Mois budgétaire (jour de paie)');

  test('payé le 1er : le mois du calendrier', function () {
    at('2026-11-04'); reset({ settings: { payday: 1 } });
    eq(per(api.period()), { start: '2026-11-01', end: '2026-11-30', key: '2026-11', days: 30 });
  });

  test('payé le 28 : du 28 octobre au 27 novembre, budget de novembre', function () {
    at('2026-11-04'); reset({ settings: { payday: 28 } });
    eq(per(api.period()), { start: '2026-10-28', end: '2026-11-27', key: '2026-11', days: 31 });
  });

  test('payé le 28, le jour de paie : on passe au budget de décembre', function () {
    at('2026-11-28'); reset({ settings: { payday: 28 } });
    eq(per(api.period()), { start: '2026-11-28', end: '2026-12-27', key: '2026-12', days: 30 });
  });

  test('payé le 5 : le 4 novembre est encore dans le budget d\'octobre', function () {
    at('2026-11-04'); reset({ settings: { payday: 5 } });
    eq(api.curKey(), '2026-10');
    at('2026-11-05');
    eq(per(api.period()), { start: '2026-11-05', end: '2026-12-04', key: '2026-11', days: 30 });
  });

  test('passage d\'année : payé le 28, le 30 décembre est en janvier', function () {
    at('2026-12-30'); reset({ settings: { payday: 28 } });
    eq(api.curKey(), '2027-01');
    eq(iso(api.periodFor('2027-01').start), '2026-12-28');
  });

  test('periodFor retrouve le mois d\'une clé', function () {
    reset({ settings: { payday: 1 } });
    eq(iso(api.periodFor('2026-02').end), '2026-02-28');
    reset({ settings: { payday: 10 } });
    eq(iso(api.periodFor('2026-11').start), '2026-11-10');
    eq(api.shiftKey('2026-01', 1), '2025-12');
    eq(api.shiftKey('2026-12', -1), '2027-01');
  });

  // ---------- Fréquences ----------
  group('Prélèvements et fréquences');

  test('mensuel le 31 : le dernier jour d\'un mois court', function () {
    reset({});
    eq(iso(api.nextDate(sub({ day: 31 }), d('2026-02-01'))), '2026-02-28');
  });

  test('trimestriel : janvier, avril, juillet, octobre', function () {
    reset({});
    eq(iso(api.nextDate(sub({ frequency: 'quarter', month: 0, day: 15 }), d('2026-11-04'))), '2027-01-15');
    eq(iso(api.nextDate(sub({ frequency: 'quarter', month: 1, day: 15 }), d('2026-10-10'))), '2026-11-15');
  });

  test('semestriel et annuel', function () {
    reset({});
    eq(iso(api.nextDate(sub({ frequency: 'half', month: 2, day: 1 }), d('2026-11-04'))), '2027-03-01');
    eq(iso(api.nextDate(sub({ frequency: 'year', month: 5, day: 10 }), d('2026-11-04'))), '2027-06-10');
  });

  test('essai gratuit : rien avant la fin de l\'essai', function () {
    reset({});
    eq(iso(api.nextDate(sub({ day: 5, trialEnd: '2026-12-20' }), d('2026-11-04'))), '2027-01-05');
  });

  test('calendrier : un trimestriel n\'apparaît que ses mois', function () {
    reset({});
    var s = sub({ frequency: 'quarter', month: 1, day: 15 });
    eq(!!api.chargeIn(s, 2026, 10), true, 'novembre');
    eq(!!api.chargeIn(s, 2026, 11), false, 'décembre');
  });

  test('coût du mois avec jour de paie : un annuel du 30 octobre compte dans le budget de novembre', function () {
    at('2026-11-04');
    var s = sub({ frequency: 'year', month: 9, day: 30, amount: 120 });
    reset({ settings: { payday: 28 }, subs: [s] });
    eq(api.costThisMonth(api.state().subs[0]), 120, 'payé le 28');
    reset({ settings: { payday: 1 }, subs: [s] });
    eq(api.costThisMonth(api.state().subs[0]), 0, 'payé le 1er');
  });

  test('un mensuel compte une seule fois par mois budgétaire', function () {
    at('2026-11-04');
    reset({ settings: { payday: 28 }, subs: [sub({ day: 30, amount: 9.99 })] });
    eq(api.costThisMonth(api.state().subs[0]), 9.99);
  });

  test('lissé : un trimestriel compte un tiers chaque mois, et 4 fois par an', function () {
    at('2026-11-04');
    reset({ settings: { annualMode: 'smooth' }, subs: [sub({ frequency: 'quarter', month: 0, amount: 30 })] });
    near(api.costThisMonth(api.state().subs[0]), 10);
    eq(api.yearTotal('sub'), 120);
  });

  // ---------- Ce qu'il te reste ----------
  group('Ce qu\'il te reste, budget par jour, enveloppes');

  test('hors enveloppe retiré du libre, budget par jour sur les jours restants', function () {
    at('2026-11-04');
    reset({
      salary: 2000, savings: 200,
      subs: [sub({ amount: 15, day: 10 })],
      categories: [{ id: 'a', name: 'Alimentation', amount: 300 }],
      expenses: [{ id: 'x1', cat: 'a', amount: 100, date: '2026-11-02' }, { id: 'x2', cat: '', amount: 50, date: '2026-11-03' }]
    });
    var t = api.totals();
    near(t.free, 1435, 'libre');
    eq(t.loose, 50, 'hors enveloppe');
    eq(t.daysLeft, 27, 'jours restants');
    near(t.daily, 1435 / 27, 'par jour');
    near(t.spent, 165, 'dépensé');
  });

  test('une dépense d\'avant le jour de paie ne compte pas dans le mois', function () {
    at('2026-11-04');
    reset({ salary: 1000, settings: { payday: 28 }, expenses: [{ id: 'x', cat: '', amount: 40, date: '2026-10-27' }, { id: 'y', cat: '', amount: 5, date: '2026-10-28' }] });
    eq(api.totals().loose, 5);
  });

  test('enveloppe dépassée : le dépassement est retiré', function () {
    at('2026-11-04');
    reset({ salary: 1000, categories: [{ id: 'a', name: 'A', amount: 300 }], expenses: [{ id: 'x', cat: 'a', amount: 350, date: '2026-11-02' }] });
    eq(api.totals().cats, 350);
  });

  test('report : le reste des mois d\'avant s\'ajoute, sans coûter au mois en cours', function () {
    at('2026-11-04');
    reset({
      salary: 1000,
      categories: [{ id: 'a', name: 'Cadeaux', amount: 100, carry: true, carryFrom: '2026-09' }],
      expenses: [{ id: '1', cat: 'a', amount: 60, date: '2026-09-10' }, { id: '2', cat: 'a', amount: 30, date: '2026-10-10' }, { id: '0', cat: 'a', amount: 999, date: '2026-08-10' }]
    });
    var c = api.state().categories[0];
    eq(api.carryIn(c), 110, 'report (40 de septembre + 70 d\'octobre)');
    eq(api.catCost(c), 100, 'rien dépensé ce mois-ci');
    api.state().expenses.push({ id: '3', cat: 'a', amount: 150, date: '2026-11-02', note: '', ref: '' });
    eq(api.catCost(c), 100, '150 dépensés, couverts par budget et report');
    api.state().expenses.push({ id: '4', cat: 'a', amount: 100, date: '2026-11-03', note: '', ref: '' });
    eq(api.catCost(c), 140, '250 dépensés : 140 sur le mois en cours');
  });

  test('report activé ce mois-ci : rien des mois d\'avant', function () {
    at('2026-11-04');
    reset({ categories: [{ id: 'a', name: 'A', amount: 100, carry: true, carryFrom: '2026-11' }] });
    eq(api.carryIn(api.state().categories[0]), 0);
  });

  test('report désactivé : toujours 0', function () {
    at('2026-11-04');
    reset({ categories: [{ id: 'a', name: 'A', amount: 100, carry: false, carryFrom: '2026-01' }] });
    eq(api.carryIn(api.state().categories[0]), 0);
  });

  test('prévision : l\'enveloppe suit le rythme du mois', function () {
    at('2026-11-10');
    reset({ salary: 2000, categories: [{ id: 'a', name: 'Alimentation', amount: 300 }], expenses: [{ id: 'x', cat: 'a', amount: 150, date: '2026-11-05' }] });
    var f = api.forecast();
    near(f.end, 1550, 'fin de mois');
    eq(f.worst && f.worst.name, 'Alimentation', 'enveloppe qui dépasse');
    eq(f.lastDay, '30');
  });

  test('prévision : rien avant le 5e jour du mois budgétaire', function () {
    at('2026-11-03');
    reset({ salary: 2000, categories: [{ id: 'a', name: 'A', amount: 300 }], expenses: [{ id: 'x', cat: 'a', amount: 50, date: '2026-11-02' }] });
    eq(api.forecast(), null);
  });

  // ---------- Objectifs ----------
  group('Objectifs d\'épargne');

  test('montant mensuel recalculé avec le temps restant', function () {
    at('2026-11-04');
    reset({ goals: [{ id: 'g', name: 'Voyage', target: 1200, saved: 0, months: 12, start: '2026-08' }] });
    var p = api.goalPlan(api.state().goals[0]);
    eq(p.left, 9);
    near(p.monthly, 133.34);
  });

  test('un versement ne fait pas baisser le montant du mois', function () {
    at('2026-11-04');
    reset({ goals: [{ id: 'g', name: 'Voyage', target: 1200, saved: 50, months: 12, start: '2026-08', deposits: [{ m: '2026-11', amount: 50 }] }] });
    var p = api.goalPlan(api.state().goals[0]);
    near(p.monthly, 133.34);
    near(p.toGo, 83.34);
  });

  test('objectif sans échéance : la date de fin découle du montant mensuel', function () {
    at('2026-11-04');
    reset({ goals: [{ id: 'g', name: 'Coussin', target: 1000, saved: 400, months: 12, start: '2026-11', open: true, monthly: 100 }] });
    var p = api.goalPlan(api.state().goals[0]);
    eq(p.left, 6);
    eq(iso(p.end), '2027-05-01');
  });

  // ---------- Import ----------
  group('Import de relevés');

  test('montants et dates de banque', function () {
    eq(api.parseMoney('-6,99€'), -6.99);
    eq(api.parseMoney('1 234,56'), 1234.56);
    eq(api.parseMoney('1,234.56'), 1234.56);
    eq(api.parseMoney('(6.99)'), -6.99);
    eq(iso(api.parseDate('12/10/2026')), '2026-10-12');
    eq(iso(api.parseDate('12 oct. 2026')), '2026-10-12');
    eq(iso(api.parseDate('2026-10-12')), '2026-10-12');
  });

  test('CSV avec point-virgule et guillemets', function () {
    eq(api.parseCsv('Date;Libellé;Montant\n12/10/2026;"CB ""MONOP"" PARIS";-12,30\n'), [['Date', 'Libellé', 'Montant'], ['12/10/2026', 'CB "MONOP" PARIS', '-12,30']]);
  });

  test('libellé nettoyé', function () {
    eq(api.cleanLabel('PRLV SEPA CRUNCHYROLL 12/10 REF 8823'), 'crunchyroll');
    eq(api.shopKey('CB CARREFOUR MARKET 12/10'), 'carrefour market');
  });

  function tx(label, amount, dates) { return dates.map(function (s) { return { date: d(s), label: label, amount: amount }; }); }

  test('abonnements trouvés : mensuel, trimestriel, annuel', function () {
    reset({});
    var found = api.findRecurring([].concat(
      tx('PRLV NETFLIX.COM', -13.49, ['2026-07-05', '2026-08-05', '2026-09-05', '2026-10-05']),
      tx('PRLV EDF CLIENTS', -120, ['2026-01-12', '2026-04-12', '2026-07-13']),
      tx('AMAZON PRIME FR', -69.9, ['2025-06-01', '2026-06-01']),
      tx('VIREMENT LOYER', -700, ['2026-08-01', '2026-09-01', '2026-10-01']),
      tx('CB BOULANGERIE', -3, ['2026-10-01', '2026-10-02', '2026-10-03'])
    ));
    var by = {};
    found.forEach(function (f) { by[f.name] = f.frequency; });
    eq(by['Netflix'], 'month', 'Netflix');
    eq(by['Edf Clients'], 'quarter', 'EDF');
    eq(by['Amazon Prime'], 'year', 'Prime');
    eq(Object.keys(by).length, 3, 'virement et boulangerie écartés');
  });

  test('montant qui varie trop : pas un abonnement', function () {
    reset({});
    eq(api.findRecurring(tx('CB RESTO', -10, ['2026-08-05', '2026-09-05']).concat(tx('CB RESTO', -45, ['2026-10-05']))).length, 0);
  });

  test('facture : fréquence trimestrielle et total TTC', function () {
    reset({});
    var f = api.readInvoice('Votre facture Abonnement trimestriel Montant HT 24,99 € Total TTC 29,99 € Date 12/10/2026');
    eq(f.frequency, 'quarter');
    eq(f.amount, 29.99);
  });

  test('enveloppe proposée : enseigne connue, puis règle apprise', function () {
    reset({ categories: [{ id: 'a', name: 'Alimentation', amount: 300 }, { id: 'e', name: 'Essence', amount: 100 }] });
    eq(api.guessCat('CB CARREFOUR MARKET 12/10'), 'a');
    eq(api.guessCat('CB TOTALENERGIES STATION 4'), 'e');
    eq(api.guessCat('CB LIBRAIRIE DU COIN'), '');
    api.state().rules['librairie coin'] = 'a';
    eq(api.guessCat('CB LIBRAIRIE DU COIN'), 'a');
    api.state().rules['librairie coin'] = 'supprimee';
    eq(api.guessCat('CB LIBRAIRIE DU COIN'), '', 'enveloppe supprimée depuis');
  });

  test('montants fréquents d\'une enveloppe', function () {
    at('2026-11-04');
    var x = function (n, day) { return { id: 'x' + Math.random(), cat: 'a', amount: n, date: day }; };
    reset({ categories: [{ id: 'a', name: 'A', amount: 300 }], expenses: [x(12.5, '2026-10-01'), x(12.5, '2026-10-08'), x(12.5, '2026-11-01'), x(30, '2026-09-10'), x(30, '2026-10-10'), x(8, '2026-10-11'), x(99, '2026-01-01'), x(99, '2026-01-02')] });
    eq(api.frequentAmounts('a'), [12.5, 30]);
  });

  // ---------- Données ----------
  group('Lecture des données');

  test('valeurs inconnues ou hors bornes corrigées', function () {
    var s = api.merge(api.defaults(), {
      settings: { payday: 40 },
      subs: [{ name: 'X', amount: 5, frequency: 'toString' }, { name: 'Y', amount: 5, frequency: 'half', month: 3 }],
      expenses: [{ cat: '', amount: 4, date: '2026-11-01' }, { cat: 'a', amount: -4, date: '2026-11-01' }],
      rules: { ok: 'a', bad: 3 }
    });
    eq(s.settings.payday, 28);
    eq(s.subs.map(function (x) { return x.frequency; }), ['month', 'half']);
    eq(s.expenses.length, 1);
    eq(s.expenses[0].cat, '');
    eq(s.rules, { ok: 'a' });
  });

  // ---------- Résultat ----------
  at('2026-11-04');
  var total = passed + failed;
  var sum = document.getElementById('summary');
  sum.className = failed ? 'ko' : 'ok';
  sum.textContent = failed ? failed + ' test' + (failed > 1 ? 's' : '') + ' en échec sur ' + total : 'Les ' + total + ' tests passent';
  document.title = (failed ? '✗ ' : '✓ ') + passed + '/' + total + ' · Tests Finy';
  try { localStorage.removeItem('finy:test'); } catch (e) {}
})();
