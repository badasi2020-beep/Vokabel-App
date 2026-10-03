/* ============================================================
   Haushalt – Patchwork-Finanz-App (Prototyp, Version 1)

   Aufbau dieser Datei:
     1. Grundeinstellungen & Hilfsfunktionen
     2. Datenspeicher (die EINZIGE Stelle, die Daten liest/schreibt)
     3. Berechnungen (Monatssummen, Fixkosten, Auswertung)
     4. Navigation & Bildschirm-Zustand
     5. Ansichten (Übersicht, Monat, Eintragen, Auswertung, Mehr …)
     6. Aktionen (was passiert, wenn man etwas antippt)
   ============================================================ */
'use strict';

/* ============================================================
   1. Grundeinstellungen & Hilfsfunktionen
   ============================================================ */

const STORAGE_KEY = 'haushalt.v1';          // gemeinsame Haushaltsdaten
const PROFILE_KEY = 'haushalt.profile';     // wer benutzt DIESES Gerät (nur lokal)
const LAST_SYNC_KEY = 'haushalt.lastSync';  // letzter Datenabgleich (nur lokal)
const COLLECTIONS = ['entries', 'recurring', 'categories'];

// Feste „Für wen“-Werte. Die Namen stehen in den Einstellungen.
const WHO = ['haushalt', 'k1', 'k2', 'p1', 'p2'];
const WHO_ICON = { haushalt: '🏠', k1: '🧒', k2: '👧', p1: '🙂', p2: '😊' };

const INTERVALS = [
  { value: 1, label: 'monatlich' },
  { value: 3, label: 'vierteljährlich' },
  { value: 6, label: 'halbjährlich' },
  { value: 12, label: 'jährlich' },
  { value: 0, label: 'einmalig' },
];

const EUR = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Cent-Betrag als „1.240,00 €“ */
const money = cents => EUR.format((cents || 0) / 100);

/** Betrag als Text für ein Eingabefeld: 5480 -> „54,80“ */
const centsToInput = cents => (cents / 100).toFixed(2).replace('.', ',');

/**
 * Liest Eingaben wie „54,80“, „54.80“, „1.240“ oder „1.240,50 €“.
 * Ergebnis in Cent (ganze Zahl), damit es keine Rundungsfehler gibt.
 */
function parseAmount(str) {
  let s = String(str || '').replace(/[€\s]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

// --- Datum & Monat (Monat immer als Text „2026-10“, Datum als „2026-10-03“) ---
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const currentMonth = () => todayStr().slice(0, 7);

function addMonths(month, n) {
  let [y, m] = month.split('-').map(Number);
  m += n;
  y += Math.floor((m - 1) / 12);
  m = ((m - 1) % 12 + 12) % 12 + 1;
  return `${y}-${pad(m)}`;
}
function monthDiff(from, to) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
function monthLabel(month, short = false) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('de-DE',
    short ? { month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' });
}
function dayLabel(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE',
    { weekday: 'short', day: '2-digit', month: '2-digit' });
}
const shortDate = date => `${date.slice(8, 10)}.${date.slice(5, 7)}.`;

/* ============================================================
   2. Datenspeicher
   Alles, was gespeichert wird, läuft über „Store“. Wenn später
   eine Synchronisierung (z. B. über das Internet) dazukommt,
   muss nur dieser Teil angepasst werden.
   ============================================================ */

function defaultState() {
  // Feste IDs für die Standard-Kategorien, damit zwei Handys beim
  // Abgleich nicht jede Kategorie doppelt haben.
  const c = (id, name, icon, type, defaultFor = null) =>
    ({ id: 'c-' + id, name, icon, type, defaultFor, updatedAt: 0 });
  return {
    version: 1,
    settings: {
      names: { p1: 'Person 1', p2: 'Person 2', k1: 'Luna', k2: 'Lotte' },
      updatedAt: 0,
    },
    categories: [
      c('lebensmittel', 'Lebensmittel', '🛒', 'expense'),
      c('drogerie', 'Drogerie', '🧴', 'expense'),
      c('haushalt', 'Haushalt', '🧽', 'expense'),
      c('kleidung', 'Kleidung', '👕', 'expense'),
      c('freizeit', 'Freizeit', '🎈', 'expense'),
      c('mobilitaet', 'Mobilität', '🚗', 'expense'),
      c('restaurant', 'Restaurant', '🍽️', 'expense'),
      c('gesundheit', 'Gesundheit', '💊', 'expense'),
      c('schule', 'Schule', '🎒', 'expense'),
      c('kita', 'Kita', '🧸', 'expense', 'k1'),
      c('geschenke', 'Geschenke', '🎁', 'expense'),
      c('hobby', 'Hobby', '🎨', 'expense'),
      c('miete', 'Miete', '🔑', 'expense'),
      c('strom', 'Strom & Energie', '⚡', 'expense'),
      c('internet', 'Internet & Handy', '📱', 'expense'),
      c('versicherung', 'Versicherungen', '🛡️', 'expense'),
      c('abos', 'Abos', '📺', 'expense'),
      c('unterhalt', 'Unterhalt', '🤝', 'expense', 'k2'),
      c('sonstiges', 'Sonstiges', '📦', 'expense'),
      c('gehalt', 'Gehalt', '💼', 'income'),
      c('kindergeld', 'Kindergeld', '👶', 'income'),
      c('elterngeld', 'Elterngeld', '🍼', 'income'),
      c('unterhalt-ein', 'Unterhalt', '🤝', 'income'),
      c('einnahme-sonst', 'Sonstige Einnahme', '➕', 'income'),
    ],
    entries: [],
    recurring: [],
  };
}

function normalizeState(s) {
  const base = defaultState();
  if (!s || typeof s !== 'object') return base;
  for (const coll of COLLECTIONS) if (!Array.isArray(s[coll])) s[coll] = base[coll];
  if (!s.settings || !s.settings.names) s.settings = base.settings;
  s.settings.names = Object.assign({}, base.settings.names, s.settings.names);
  return s;
}

const Store = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.state = normalizeState(raw ? JSON.parse(raw) : null);
    } catch (e) {
      this.state = defaultState();
    }
    // Bittet den Browser, die Daten nicht automatisch zu löschen.
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      toast('⚠️ Speichern hat nicht geklappt!');
    }
  },

  /** Nur nicht-gelöschte Einträge einer Sammlung */
  live(coll) {
    return this.state[coll].filter(x => !x.deleted);
  },

  get(coll, id) {
    return this.state[coll].find(x => x.id === id);
  },

  upsert(coll, obj) {
    obj.updatedAt = Date.now();
    const arr = this.state[coll];
    const i = arr.findIndex(x => x.id === obj.id);
    if (i >= 0) arr[i] = obj; else arr.push(obj);
    this.save();
  },

  /** Gelöschtes wird nur markiert – so kann der Abgleich es auf dem anderen Handy auch löschen. */
  remove(coll, id) {
    const obj = this.get(coll, id);
    if (!obj) return;
    obj.deleted = true;
    obj.updatedAt = Date.now();
    this.save();
  },

  restore(coll, id) {
    const obj = this.get(coll, id);
    if (!obj) return;
    delete obj.deleted;
    obj.updatedAt = Date.now();
    this.save();
  },

  setNames(names) {
    this.state.settings.names = Object.assign({}, this.state.settings.names, names);
    this.state.settings.updatedAt = Date.now();
    this.save();
  },

  /**
   * Führt Daten vom anderen Handy mit den eigenen zusammen.
   * Pro Eintrag gewinnt die jeweils neuere Version. Nichts wird doppelt angelegt.
   */
  merge(incoming) {
    incoming = normalizeState(incoming);
    let changed = 0;
    for (const coll of COLLECTIONS) {
      const map = new Map(this.state[coll].map(x => [x.id, x]));
      for (const item of incoming[coll]) {
        if (!item || !item.id) continue;
        const mine = map.get(item.id);
        if (!mine || (item.updatedAt || 0) > (mine.updatedAt || 0)) {
          map.set(item.id, item);
          changed++;
        }
      }
      this.state[coll] = [...map.values()];
    }
    if ((incoming.settings.updatedAt || 0) > (this.state.settings.updatedAt || 0)) {
      this.state.settings = incoming.settings;
      changed++;
    }
    this.save();
    return changed;
  },

  reset() {
    this.state = defaultState();
    this.save();
  },
};

// Gerätebezogene Einstellungen (werden NICHT abgeglichen)
const Device = {
  get profile() { try { return localStorage.getItem(PROFILE_KEY); } catch (e) { return null; } },
  set profile(v) { try { localStorage.setItem(PROFILE_KEY, v); } catch (e) { /* egal */ } },
  get lastSync() { try { return Number(localStorage.getItem(LAST_SYNC_KEY)) || 0; } catch (e) { return 0; } },
  set lastSync(v) { try { localStorage.setItem(LAST_SYNC_KEY, String(v)); } catch (e) { /* egal */ } },
};

/* ============================================================
   3. Berechnungen
   ============================================================ */

const names = () => Store.state.settings.names;
const whoName = w => (w === 'haushalt' ? 'Haushalt' : names()[w] || w);

function catById(id) {
  return Store.get('categories', id) || { name: 'Ohne Kategorie', icon: '❔', type: 'expense' };
}

/** Kategorien einer Art, häufig benutzte zuerst */
function categoriesSorted(type) {
  const since = Date.now() - 120 * 24 * 3600 * 1000;
  const usage = {};
  for (const e of Store.live('entries')) {
    if (e.type === type && (e.updatedAt || 0) > since) usage[e.categoryId] = (usage[e.categoryId] || 0) + 1;
  }
  const cats = Store.live('categories').filter(c => c.type === type);
  return cats
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (usage[b.c.id] || 0) - (usage[a.c.id] || 0) || a.i - b.i)
    .map(x => x.c);
}

// --- Regelmäßige Zahlungen (Fixkosten & feste Einnahmen) ---

/** Betrag, der in einem bestimmten Monat gilt (Beträge haben eine „gültig ab“-Historie) */
function amountFor(rec, month) {
  const list = [...rec.amounts].sort((a, b) => a.from.localeCompare(b.from));
  let cents = list[0] ? list[0].cents : 0;
  for (const a of list) if (a.from <= month) cents = a.cents;
  return cents;
}

function isPaused(rec, month) {
  return (rec.pauses || []).some(p => month >= p.from && (!p.to || month <= p.to));
}

function isEnded(rec) {
  return !!rec.endMonth && rec.endMonth < currentMonth();
}

/** Ist die regelmäßige Zahlung in diesem Monat fällig? */
function isDueIn(rec, month) {
  if (rec.deleted || month < rec.startMonth) return false;
  if (rec.endMonth && month > rec.endMonth) return false;
  const diff = monthDiff(rec.startMonth, month);
  if (rec.interval === 0 ? diff !== 0 : diff % rec.interval !== 0) return false;
  return !isPaused(rec, month);
}

/** Alle Fixkosten/festen Einnahmen eines Monats als „virtuelle“ Buchungen */
function occurrences(month) {
  const out = [];
  for (const r of Store.live('recurring')) {
    if (!isDueIn(r, month)) continue;
    const day = Math.min(r.dueDay || 1, daysInMonth(month));
    out.push({
      kind: 'fix', id: r.id, type: r.type, amount: amountFor(r, month),
      date: `${month}-${pad(day)}`, categoryId: r.categoryId, forWhom: r.forWhom,
      paidBy: r.paidBy, note: r.name,
    });
  }
  return out;
}

/** Alle Buchungen eines Monats: eingetragene + regelmäßige */
function monthItems(month) {
  const entries = Store.live('entries')
    .filter(e => e.date && e.date.startsWith(month))
    .map(e => Object.assign({ kind: 'entry' }, e));
  return entries.concat(occurrences(month));
}

/** Kernrechnung für die Übersicht */
function summary(month) {
  const today = todayStr();
  const s = { income: 0, fix: 0, fixOpen: 0, variable: 0, byCat: {} };
  for (const it of monthItems(month)) {
    if (it.type === 'income') { s.income += it.amount; continue; }
    if (it.kind === 'fix') {
      s.fix += it.amount;
      if (it.date > today) s.fixOpen += it.amount;
    } else {
      s.variable += it.amount;
      s.byCat[it.categoryId] = (s.byCat[it.categoryId] || 0) + it.amount;
    }
  }
  s.available = s.income - s.fix - s.variable;
  return s;
}

/**
 * Auswertung: Ausgaben nach „Für wen“ und dann nach Kategorie.
 * Jede Ausgabe gehört zu genau EINER Person/Gruppe → nichts wird doppelt gezählt.
 */
function breakdown(months, includeFix) {
  const groups = {};
  let total = 0;
  for (const m of months) {
    for (const it of monthItems(m)) {
      if (it.type !== 'expense') continue;
      if (!includeFix && it.kind === 'fix') continue;
      const w = WHO.includes(it.forWhom) ? it.forWhom : 'haushalt';
      const g = groups[w] || (groups[w] = { total: 0, cats: {} });
      g.total += it.amount;
      g.cats[it.categoryId] = (g.cats[it.categoryId] || 0) + it.amount;
      total += it.amount;
    }
  }
  return { groups, total };
}

/* ============================================================
   4. Navigation & Bildschirm-Zustand
   ============================================================ */

const ui = {
  view: 'overview',
  month: currentMonth(),
  filter: { type: 'all', who: 'all' },
  stats: { period: 'month', includeFix: true },
  form: null,      // Eintragen/Bearbeiten
  rform: null,     // regelmäßige Zahlung
  cform: null,     // Kategorie
  welcome: null,
};

const TAB_OF = {
  overview: 'overview', list: 'list', form: 'add', stats: 'stats', more: 'more',
  recurringList: 'more', recurringForm: 'more', categories: 'more', categoryForm: 'more',
};

function go(view, { replace = false } = {}) {
  ui.view = view;
  const st = { view };
  if (replace) history.replaceState(st, ''); else history.pushState(st, '');
  render();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', e => {
  ui.view = (e.state && e.state.view) || 'overview';
  if (ui.view === 'form' && !ui.form) ui.view = 'overview';
  if (ui.view === 'recurringForm' && !ui.rform) ui.view = 'recurringList';
  if (ui.view === 'categoryForm' && !ui.cform) ui.view = 'categories';
  render();
});

/* ============================================================
   5. Ansichten
   ============================================================ */

const VIEWS = {
  welcome: viewWelcome,
  overview: viewOverview,
  list: viewList,
  form: viewForm,
  stats: viewStats,
  more: viewMore,
  recurringList: viewRecurringList,
  recurringForm: viewRecurringForm,
  categories: viewCategories,
  categoryForm: viewCategoryForm,
};

const TITLES = {
  welcome: 'Willkommen', overview: 'Übersicht', list: 'Monat', form: 'Eintragen',
  stats: 'Auswertung', more: 'Mehr', recurringList: 'Regelmäßig',
  recurringForm: 'Regelmäßig', categories: 'Kategorien', categoryForm: 'Kategorie',
};

function render() {
  if (!Device.profile && ui.view !== 'welcome') {
    ui.view = 'welcome';
  }
  const v = VIEWS[ui.view] || viewOverview;
  document.getElementById('view').innerHTML = v();

  document.getElementById('topbar-title').textContent =
    ui.view === 'form' && ui.form && ui.form.id ? 'Bearbeiten' : TITLES[ui.view] || 'Haushalt';

  const chip = document.getElementById('profile-chip');
  chip.hidden = ui.view === 'welcome';
  if (Device.profile) chip.textContent = WHO_ICON[Device.profile] + ' ' + whoName(Device.profile);

  const tabbar = document.getElementById('tabbar');
  tabbar.hidden = ui.view === 'welcome';
  const activeTab = TAB_OF[ui.view];
  tabbar.querySelectorAll('[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === activeTab));

  afterRender();
}

function afterRender() {
  const auto = document.querySelector('[data-autofocus]');
  if (auto) { auto.focus(); }
}

// --- Bausteine ---

function monthNav() {
  return `<div class="month-nav">
    <button data-action="month" data-step="-1" aria-label="Vorheriger Monat">‹</button>
    <button class="label" data-action="month" data-step="0" title="Zum aktuellen Monat">${esc(monthLabel(ui.month))}</button>
    <button data-action="month" data-step="1" aria-label="Nächster Monat">›</button>
  </div>`;
}

function whoChips(selected, action, { withAll = false, small = false, only = WHO } = {}) {
  const items = (withAll ? ['all'] : []).concat(only);
  return `<div class="chips ${small ? 'small scroll' : ''}">${items.map(w => `
    <button class="chip ${selected === w ? 'on' : ''}" data-action="${action}" data-value="${w}">
      ${w === 'all' ? 'Alle' : `${WHO_ICON[w]} ${esc(whoName(w))}`}
    </button>`).join('')}</div>`;
}

function itemRow(it) {
  const cat = catById(it.categoryId);
  const today = todayStr();
  const isOpen = it.kind === 'fix' && it.date > today;
  const title = it.note || cat.name;
  const parts = [];
  if (it.note && it.note !== cat.name) parts.push(cat.name);
  if (it.type === 'expense') parts.push(whoName(it.forWhom));
  if (it.paidBy) parts.push((it.type === 'income' ? 'an ' : '💳 ') + whoName(it.paidBy));
  const badge = it.kind === 'fix' ? ' <span class="badge">fix</span>' : '';
  const action = it.kind === 'fix' ? 'edit-recurring' : 'edit-entry';
  const sign = it.type === 'income' ? '+' : '−';
  return `<li class="row tappable ${isOpen ? 'open' : ''}" data-action="${action}" data-id="${it.id}">
    <div class="ico">${esc(cat.icon)}</div>
    <div class="txt">
      <div class="ttl">${esc(title)}${badge}</div>
      <div class="sub">${esc(parts.join(' · '))}${isOpen ? ` · fällig ${shortDate(it.date)}` : ''}</div>
    </div>
    <div class="amt ${it.type === 'income' ? 'income' : ''}">${sign} ${money(it.amount)}</div>
  </li>`;
}

// --- Willkommen (erster Start auf einem Gerät) ---

function viewWelcome() {
  if (!ui.welcome) ui.welcome = Object.assign({ me: 'p1' }, clone(names()));
  const w = ui.welcome;
  const field = (key, label) => `<div class="field">
      <label for="wn-${key}">${label}</label>
      <input class="input" id="wn-${key}" data-model="welcome.${key}" value="${esc(w[key])}" autocomplete="off">
    </div>`;
  return `<div class="welcome">
    <h1>👋 Willkommen</h1>
    <p>Kurz einrichten – dauert 20 Sekunden. Alles lässt sich später unter „Mehr“ ändern.</p>
    <div class="card">
      <h3>Erwachsene</h3>
      ${field('p1', 'Person 1')}
      ${field('p2', 'Person 2')}
      <h3>Kinder</h3>
      ${field('k1', 'Gemeinsames Kind')}
      ${field('k2', 'Kind von Person 1')}
    </div>
    <div class="card">
      <h3>Wer benutzt dieses Handy?</h3>
      <div class="chips">
        <button class="chip ${w.me === 'p1' ? 'on' : ''}" data-action="welcome-me" data-value="p1">🙂 Person 1</button>
        <button class="chip ${w.me === 'p2' ? 'on' : ''}" data-action="welcome-me" data-value="p2">😊 Person 2</button>
      </div>
    </div>
    <button class="btn" data-action="welcome-done">Los geht's</button>
    <button class="btn secondary" data-action="import">Daten vom anderen Handy übernehmen</button>
  </div>`;
}

// --- Übersicht ---

function viewOverview() {
  const m = ui.month;
  const cur = currentMonth();
  const s = summary(m);
  const when = m === cur ? 'now' : m < cur ? 'past' : 'future';

  const heroLabel = { now: 'Noch verfügbar', past: 'Übrig geblieben', future: 'Voraussichtlich übrig' }[when];
  let hint = '';
  if (when === 'now') {
    const daysLeft = daysInMonth(m) - Number(todayStr().slice(8, 10)) + 1;
    hint = s.available > 0
      ? `noch ${daysLeft} Tage · ca. ${money(Math.floor(s.available / daysLeft))} pro Tag`
      : `noch ${daysLeft} Tage in diesem Monat`;
  }

  const hasAnything = Store.live('entries').length || Store.live('recurring').length;
  const setupCard = hasAnything ? '' : `<div class="card">
      <h3>Erster Schritt</h3>
      <p style="margin-top:0">Tragt einmal eure festen Einnahmen (Gehalt, Kindergeld) und Fixkosten (Miete, Strom …) ein. Dann rechnet die App jeden Monat automatisch.</p>
      <button class="btn" data-action="goto" data-view="recurringList">Regelmäßiges anlegen</button>
    </div>`;

  // Größte Kategorien (nur variable Ausgaben – die Miete ist sowieso immer vorne)
  const top = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const max = top.length ? top[0][1] : 1;
  const topHtml = top.length ? `<div class="card"><h3>Wofür am meisten (ohne Fixkosten)</h3>
      ${top.map(([id, v]) => {
        const c = catById(id);
        return `<div class="sumrow" style="display:block;border:0;padding:6px 0">
          <div style="display:flex;justify-content:space-between"><span>${esc(c.icon)} ${esc(c.name)}</span><span class="val">${money(v)}</span></div>
          <div class="bar"><span style="width:${Math.max(4, Math.round(v / max * 100))}%"></span></div>
        </div>`;
      }).join('')}</div>` : '';

  // Nächste fällige Fixkosten
  let dueHtml = '';
  if (when !== 'past') {
    const today = todayStr();
    const open = occurrences(m).filter(o => o.type === 'expense' && o.date > today)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (open.length) {
      dueHtml = `<div class="card"><h3>Als Nächstes fällig</h3><ul class="list">
        ${open.slice(0, 4).map(itemRow).join('')}</ul>
        ${open.length > 4 ? `<div class="small muted">… und ${open.length - 4} weitere</div>` : ''}</div>`;
    } else if (s.fix > 0 && when === 'now') {
      dueHtml = `<div class="card"><h3>Fixkosten</h3><div>✅ Alle Fixkosten für diesen Monat sind durch.</div></div>`;
    }
  }

  // Zuletzt eingetragen
  const recent = Store.live('entries').filter(e => e.date.startsWith(m))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 3);
  const recentHtml = recent.length ? `<div class="card"><h3>Zuletzt eingetragen</h3>
      <ul class="list">${recent.map(e => itemRow(Object.assign({ kind: 'entry' }, e))).join('')}</ul>
      <button class="link-btn" data-action="goto" data-view="list">Alle anzeigen →</button></div>` : '';

  // Erinnerung an den Datenabgleich zwischen den Handys
  const pending = Store.state.entries.concat(Store.state.recurring)
    .filter(x => (x.updatedAt || 0) > Device.lastSync).length;
  const days = Device.lastSync ? Math.floor((Date.now() - Device.lastSync) / 86400000) : null;
  const syncHint = pending > 0 && (days === null || days >= 3)
    ? `<div class="card small" data-action="goto" data-view="more" style="cursor:pointer">🔄 ${pending} Änderung${pending === 1 ? '' : 'en'} noch nicht mit dem anderen Handy abgeglichen → <b>Abgleichen</b></div>`
    : '';

  return `${monthNav()}
    ${setupCard}
    <div class="card hero">
      <div class="hero-label">${heroLabel}</div>
      <div class="hero-value ${s.available >= 0 ? 'good' : 'bad'}">${money(s.available)}</div>
      ${hint ? `<div class="hero-hint">${hint}</div>` : ''}
    </div>
    <div class="card">
      <div class="sumrow"><span>Einnahmen</span><span class="val income">+ ${money(s.income)}</span></div>
      <div class="sumrow" ${s.fixOpen && when === 'now' ? 'style="border:0"' : ''}><span>Fixkosten</span><span class="val">− ${money(s.fix)}</span></div>
      ${s.fixOpen && when === 'now' ? `<div class="sumrow sub"><span>davon noch offen</span><span>${money(s.fixOpen)}</span></div>` : ''}
      <div class="sumrow"><span>Ausgaben</span><span class="val">− ${money(s.variable)}</span></div>
      <div class="sumrow total"><span><b>${when === 'past' ? 'Übrig' : 'Verfügbar'}</b></span><span class="val ${s.available >= 0 ? '' : 'warn'}">${money(s.available)}</span></div>
    </div>
    ${dueHtml}
    ${topHtml}
    ${recentHtml}
    ${syncHint}`;
}

// --- Monatsansicht ---

function viewList() {
  const f = ui.filter;
  let items = monthItems(ui.month);
  if (f.type === 'expense') items = items.filter(i => i.type === 'expense' && i.kind === 'entry');
  if (f.type === 'income') items = items.filter(i => i.type === 'income');
  if (f.type === 'fix') items = items.filter(i => i.kind === 'fix');
  if (f.who !== 'all') items = items.filter(i => i.type === 'expense' && i.forWhom === f.who);
  items.sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'fix') - (b.kind === 'fix'));

  let html = '';
  let lastDay = null;
  let open = false;
  for (const it of items) {
    if (it.date !== lastDay) {
      if (open) html += '</ul></div>';
      html += `<div class="day-head">${esc(dayLabel(it.date))}</div><div class="card" style="padding:4px 16px"><ul class="list">`;
      open = true;
      lastDay = it.date;
    }
    html += itemRow(it);
  }
  if (open) html += '</ul></div>';

  const sum = items.reduce((acc, i) => acc + (i.type === 'income' ? i.amount : -i.amount), 0);
  const typeBtn = (v, label) => `<button class="${f.type === v ? 'on' : ''}" data-action="filter-type" data-value="${v}">${label}</button>`;

  return `${monthNav()}
    <div class="segmented">
      ${typeBtn('all', 'Alle')}${typeBtn('expense', 'Ausgaben')}${typeBtn('fix', 'Fix')}${typeBtn('income', 'Einnahmen')}
    </div>
    ${whoChips(f.who, 'filter-who', { withAll: true, small: true })}
    ${items.length ? html : `<div class="empty"><div class="big">🗒️</div>Keine Einträge${f.type !== 'all' || f.who !== 'all' ? ' für diesen Filter' : ' in diesem Monat'}.</div>`}
    ${items.length ? `<div class="meta">${items.length} Einträge · Summe ${sum >= 0 ? '+' : '−'} ${money(Math.abs(sum))}</div>` : ''}`;
}

// --- Eintragen / Bearbeiten ---

function newForm(type = 'expense') {
  return {
    id: null, type, amountStr: '', categoryId: null, forWhom: 'haushalt', forTouched: false,
    paidBy: Device.profile || 'p1', date: todayStr(), note: '', showAllCats: false, showMore: false,
  };
}

function viewForm() {
  const f = ui.form;
  const cats = categoriesSorted(f.type);
  let shown = f.showAllCats ? cats : cats.slice(0, 8);
  if (f.categoryId && !shown.some(c => c.id === f.categoryId)) shown = shown.concat([catById(f.categoryId)]);

  const catChips = shown.map(c => `<button class="chip ${f.categoryId === c.id ? 'on' : ''}" data-action="form-cat" data-value="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('');
  const moreCats = !f.showAllCats && cats.length > 8
    ? `<button class="chip" data-action="form-allcats">… mehr</button>` : '';

  const created = f.id ? Store.get('entries', f.id) : null;
  const createdInfo = created && created.createdBy
    ? `<div class="meta">Eingetragen von ${esc(whoName(created.createdBy))}${created.createdAt ? ' am ' + new Date(created.createdAt).toLocaleDateString('de-DE') : ''}</div>` : '';

  const isIncome = f.type === 'income';
  const details = f.showMore || f.id ? `
      <div class="inline-fields">
        <div class="field"><label for="f-date">Datum</label>
          <input class="input" type="date" id="f-date" data-model="form.date" value="${esc(f.date)}"></div>
      </div>
      <div class="field"><span class="field-label">${isIncome ? 'Wer bekommt es?' : 'Bezahlt von'}</span>
        ${whoChips(f.paidBy, 'form-paid', { only: ['p1', 'p2'] })}</div>
      <div class="field"><label for="f-note">Notiz (optional)</label>
        <input class="input" id="f-note" data-model="form.note" value="${esc(f.note)}" placeholder="${isIncome ? 'z. B. Oktober' : 'z. B. Schuhe, Rewe …'}" autocomplete="off"></div>`
    : `<button class="more-toggle" data-action="form-more">▸ ${f.date === todayStr() ? 'Heute' : shortDate(f.date)} · ${isIncome ? 'an' : 'bezahlt von'} ${esc(whoName(f.paidBy))}${f.note ? ' · ' + esc(f.note) : ''} · <u>ändern</u></button>`;

  return `
    ${f.id ? '' : `<div class="segmented">
      <button class="${!isIncome ? 'on' : ''}" data-action="form-type" data-value="expense">Ausgabe</button>
      <button class="${isIncome ? 'on' : ''}" data-action="form-type" data-value="income">Einnahme</button>
    </div>`}
    <div class="card amount-wrap">
      <input class="amount-input ${isIncome ? 'income' : ''}" id="f-amount" inputmode="decimal" placeholder="0,00"
        data-model="form.amountStr" value="${esc(f.amountStr)}" autocomplete="off" ${f.id ? '' : 'data-autofocus'}>
      <div class="euro">Euro</div>
    </div>
    <div class="field"><span class="field-label">${isIncome ? 'Was?' : 'Wofür?'}</span>
      <div class="chips">${catChips}${moreCats}</div></div>
    ${isIncome ? '' : `<div class="field"><span class="field-label">Für wen?</span>${whoChips(f.forWhom, 'form-who')}</div>`}
    ${details}
    <button class="btn" data-action="form-save">${f.id ? 'Speichern' : 'Eintragen'}</button>
    ${f.id ? `<button class="btn danger" data-action="form-delete">Löschen</button>` : ''}
    ${createdInfo}
    ${f.id ? '' : `<div class="center" style="margin-top:12px"><button class="link-btn" data-action="new-recurring" data-type="${f.type}">🔁 Regelmäßige ${isIncome ? 'Einnahme' : 'Zahlung'} anlegen</button></div>`}`;
}

// --- Auswertung ---

function statsMonths() {
  if (ui.stats.period === 'month') return [ui.month];
  const year = ui.month.slice(0, 4);
  const cur = currentMonth();
  const months = [];
  for (let i = 1; i <= 12; i++) {
    const m = `${year}-${pad(i)}`;
    if (year === cur.slice(0, 4) && m > cur) break; // laufendes Jahr: nur bis heute
    months.push(m);
  }
  return months;
}

function viewStats() {
  const st = ui.stats;
  const months = statsMonths();
  const { groups, total } = breakdown(months, st.includeFix);
  const periodLabel = st.period === 'month' ? monthLabel(ui.month)
    : months.length < 12 ? `${monthLabel(months[0], true)} – ${monthLabel(months[months.length - 1], true)}` : ui.month.slice(0, 4);

  const order = ['haushalt', 'k1', 'k2', 'p1', 'p2'];
  const cards = order.filter(w => groups[w]).map(w => {
    const g = groups[w];
    const share = total ? Math.round(g.total / total * 100) : 0;
    const cats = Object.entries(g.cats).sort((a, b) => b[1] - a[1]);
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <b style="font-size:18px">${WHO_ICON[w]} ${esc(whoName(w))}</b>
        <b>${money(g.total)}</b>
      </div>
      <div class="bar"><span style="width:${Math.max(2, share)}%"></span></div>
      <div class="small muted" style="margin-bottom:6px">${share} % aller Ausgaben</div>
      ${cats.map(([id, v]) => {
        const c = catById(id);
        return `<div class="sumrow"><span>${esc(c.icon)} ${esc(c.name)}</span><span class="val">${money(v)}</span></div>`;
      }).join('')}
    </div>`;
  }).join('');

  const navStep = st.period === 'month' ? 1 : 12;
  return `
    <div class="segmented">
      <button class="${st.period === 'month' ? 'on' : ''}" data-action="stats-period" data-value="month">Monat</button>
      <button class="${st.period === 'year' ? 'on' : ''}" data-action="stats-period" data-value="year">Jahr</button>
    </div>
    <div class="month-nav">
      <button data-action="month" data-step="-${navStep}" aria-label="Zurück">‹</button>
      <span class="label">${esc(periodLabel)}</span>
      <button data-action="month" data-step="${navStep}" aria-label="Weiter">›</button>
    </div>
    <div class="card hero">
      <div class="hero-label">Ausgaben gesamt${st.includeFix ? '' : ' (ohne Fixkosten)'}</div>
      <div class="hero-value">${money(total)}</div>
      <div class="hero-hint">Jede Ausgabe zählt genau einmal.</div>
    </div>
    <div class="chips small" style="margin-bottom:14px">
      <button class="chip ${st.includeFix ? 'on' : ''}" data-action="stats-fix" data-value="1">mit Fixkosten</button>
      <button class="chip ${!st.includeFix ? 'on' : ''}" data-action="stats-fix" data-value="0">nur variable Ausgaben</button>
    </div>
    ${cards || '<div class="empty"><div class="big">🧩</div>Noch keine Ausgaben in diesem Zeitraum.</div>'}
    <div class="meta">Die Auswertung zeigt, <b>wofür</b> euer Geld ausgegeben wird – nicht, wer es ausgibt.</div>`;
}

// --- Mehr / Einstellungen ---

function viewMore() {
  const n = names();
  const nameField = (key, label) => `<div class="field">
      <label for="n-${key}">${label}</label>
      <input class="input" id="n-${key}" data-name="${key}" value="${esc(n[key])}" autocomplete="off">
    </div>`;
  const last = Device.lastSync ? new Date(Device.lastSync).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }) : 'noch nie';
  const pending = Store.state.entries.concat(Store.state.recurring)
    .filter(x => (x.updatedAt || 0) > Device.lastSync).length;
  const recCount = Store.live('recurring').filter(r => !isEnded(r)).length;

  return `
    <div class="card">
      <ul class="list">
        <li class="row tappable" data-action="goto" data-view="recurringList">
          <div class="ico">🔁</div><div class="txt"><div class="ttl">Regelmäßige Zahlungen</div>
          <div class="sub">Fixkosten & feste Einnahmen · ${recCount} aktiv</div></div><div class="amt">›</div></li>
        <li class="row tappable" data-action="goto" data-view="categories">
          <div class="ico">🏷️</div><div class="txt"><div class="ttl">Kategorien</div>
          <div class="sub">Namen, Symbole, Standard „Für wen“</div></div><div class="amt">›</div></li>
      </ul>
    </div>

    <div class="card">
      <h3>Dieses Handy gehört</h3>
      ${whoChips(Device.profile, 'set-profile', { only: ['p1', 'p2'] })}
    </div>

    <div class="card">
      <h3>Namen</h3>
      ${nameField('p1', 'Person 1')}
      ${nameField('p2', 'Person 2')}
      ${nameField('k1', 'Gemeinsames Kind')}
      ${nameField('k2', 'Kind von Person 1')}
      <div class="small muted">Wird automatisch gespeichert.</div>
    </div>

    <div class="card">
      <h3>🔄 Mit dem anderen Handy abgleichen</h3>
      <p class="small" style="margin-top:0">Die Daten liegen nur auf diesem Handy. So bekommt das andere Handy eure Einträge:
        <br>1. Hier <b>„Daten senden“</b> → z. B. per WhatsApp/Mail an die andere Person.
        <br>2. Dort unter „Mehr“ <b>„Daten übernehmen“</b> → Datei auswählen.
        <br>Danach dasselbe in die andere Richtung. Nichts wird doppelt gezählt.</p>
      <div class="small muted" style="margin-bottom:10px">Letzter Abgleich: ${esc(last)}${pending ? ` · <b>${pending} neue Änderung${pending === 1 ? '' : 'en'}</b>` : ''}</div>
      <button class="btn" data-action="export">📤 Daten senden</button>
      <button class="btn secondary" data-action="import">📥 Daten übernehmen</button>
    </div>

    <div class="card">
      <h3>Gefahrenzone</h3>
      <button class="btn danger small" data-action="reset-all">Alle Daten auf diesem Handy löschen</button>
    </div>
    <div class="meta">Haushalt · Prototyp Version 1</div>`;
}

// --- Regelmäßige Zahlungen ---

const RECURRING_PRESETS = [
  { name: 'Miete', cat: 'c-miete', type: 'expense', dueDay: 1 },
  { name: 'Strom', cat: 'c-strom', type: 'expense' },
  { name: 'Internet', cat: 'c-internet', type: 'expense' },
  { name: 'Handy', cat: 'c-internet', type: 'expense' },
  { name: 'Versicherung', cat: 'c-versicherung', type: 'expense' },
  { name: 'Kita', cat: 'c-kita', type: 'expense', who: 'k1' },
  { name: 'Unterhalt', cat: 'c-unterhalt', type: 'expense', who: 'k2', paidBy: 'p1' },
  { name: 'Streaming', cat: 'c-abos', type: 'expense' },
  { name: 'Gehalt', cat: 'c-gehalt', type: 'income' },
  { name: 'Kindergeld', cat: 'c-kindergeld', type: 'income' },
];

function recurringSub(r) {
  const cur = currentMonth();
  const interval = INTERVALS.find(i => i.value === r.interval);
  const parts = [interval ? interval.label : ''];
  if (r.interval === 0) parts[0] = 'einmalig ' + monthLabel(r.startMonth, true);
  parts.push(`am ${r.dueDay}.`);
  if (r.type === 'expense') parts.push(whoName(r.forWhom));
  if (r.startMonth > cur) parts.push('ab ' + monthLabel(r.startMonth, true));
  return parts.join(' · ');
}

function viewRecurringList() {
  const cur = currentMonth();
  const all = Store.live('recurring');
  const active = all.filter(r => !isEnded(r));
  const ended = all.filter(isEnded);

  const row = r => {
    const paused = isPaused(r, cur);
    const c = catById(r.categoryId);
    const badge = isEnded(r) ? ' <span class="badge grey">beendet</span>' : paused ? ' <span class="badge grey">pausiert</span>' : '';
    const amt = amountFor(r, r.startMonth > cur ? r.startMonth : cur);
    return `<li class="row tappable ${paused || isEnded(r) ? 'open' : ''}" data-action="edit-recurring" data-id="${r.id}">
      <div class="ico">${esc(c.icon)}</div>
      <div class="txt"><div class="ttl">${esc(r.name)}${badge}</div><div class="sub">${esc(recurringSub(r))}</div></div>
      <div class="amt ${r.type === 'income' ? 'income' : ''}">${money(amt)}</div></li>`;
  };

  // Durchschnitt pro Monat (jährliche Kosten anteilig) – hilft beim Einschätzen
  const perMonth = type => active.filter(r => r.type === type && r.interval > 0 && !isPaused(r, cur))
    .reduce((s, r) => s + amountFor(r, cur) / r.interval, 0);

  const section = (type, title) => {
    const list = active.filter(r => r.type === type).sort((a, b) => a.dueDay - b.dueDay);
    return `<div class="card"><h3>${title}</h3>
      ${list.length ? `<ul class="list">${list.map(row).join('')}</ul>
        <div class="small muted" style="margin-top:8px">Im Schnitt ca. <b>${money(Math.round(perMonth(type)))}</b> pro Monat</div>`
        : '<div class="small muted">Noch nichts angelegt.</div>'}
      <button class="btn secondary small" style="margin-top:12px" data-action="new-recurring" data-type="${type}">+ ${type === 'income' ? 'Feste Einnahme' : 'Fixkosten'} anlegen</button>
    </div>`;
  };

  const presets = all.length < 3 ? `<div class="card"><h3>Schnellstart – antippen zum Anlegen</h3>
      <div class="chips small">${RECURRING_PRESETS.map((p, i) => `<button class="chip" data-action="preset" data-value="${i}">${esc(catById(p.cat).icon)} ${esc(p.name)}</button>`).join('')}</div></div>` : '';

  return `<button class="back" data-action="back">‹ Mehr</button>
    ${presets}
    ${section('income', '💰 Feste Einnahmen')}
    ${section('expense', '🧾 Fixkosten')}
    ${ended.length ? `<div class="card"><h3>Beendet</h3><ul class="list">${ended.map(row).join('')}</ul></div>` : ''}`;
}

function newRecurringForm(type = 'expense', preset = null) {
  const f = {
    id: null, type, name: '', amountStr: '', categoryId: type === 'income' ? 'c-gehalt' : 'c-miete',
    forWhom: 'haushalt', paidBy: Device.profile || 'p1', interval: 1, dueDay: 1,
    startMonth: currentMonth(), amountFrom: 'this', origCents: null,
  };
  if (preset) {
    Object.assign(f, { type: preset.type, name: preset.name, categoryId: preset.cat });
    if (preset.who) f.forWhom = preset.who;
    if (preset.paidBy) f.paidBy = preset.paidBy;
    if (preset.dueDay) f.dueDay = preset.dueDay;
  }
  return f;
}

function viewRecurringForm() {
  const f = ui.rform;
  const cur = currentMonth();
  const isIncome = f.type === 'income';
  const cats = Store.live('categories').filter(c => c.type === f.type);
  if (f.categoryId && !cats.some(c => c.id === f.categoryId)) cats.push(Object.assign({ id: f.categoryId }, catById(f.categoryId)));

  const months = [];
  for (let i = -24; i <= 24; i++) months.push(addMonths(cur, i));
  if (!months.includes(f.startMonth)) months.unshift(f.startMonth);

  const rec = f.id ? Store.get('recurring', f.id) : null;
  const newCents = parseAmount(f.amountStr);
  const amountChanged = rec && f.origCents !== null && Number.isFinite(newCents) && newCents !== f.origCents;
  const canChooseFrom = rec && rec.startMonth < cur;
  const paused = rec && isPaused(rec, cur);

  return `<button class="back" data-action="back">‹ Zurück</button>
    <div class="page-title">${f.id ? 'Bearbeiten' : isIncome ? 'Feste Einnahme' : 'Fixkosten'}</div>
    ${f.id ? '' : `<div class="segmented">
      <button class="${!isIncome ? 'on' : ''}" data-action="rform-type" data-value="expense">Fixkosten</button>
      <button class="${isIncome ? 'on' : ''}" data-action="rform-type" data-value="income">Einnahme</button>
    </div>`}
    <div class="field"><label for="r-name">Name</label>
      <input class="input" id="r-name" data-model="rform.name" value="${esc(f.name)}" placeholder="${isIncome ? 'z. B. Gehalt' : 'z. B. Miete'}" autocomplete="off"></div>
    <div class="field"><label for="r-amount">Betrag in Euro</label>
      <input class="input" id="r-amount" inputmode="decimal" data-model="rform.amountStr" value="${esc(f.amountStr)}" placeholder="0,00" autocomplete="off"></div>
    ${canChooseFrom ? `<div class="field" id="r-from" ${amountChanged ? '' : 'hidden'}><span class="field-label">Neuer Betrag gilt ab …</span>
      <div class="chips small">
        <button class="chip ${f.amountFrom === 'this' ? 'on' : ''}" data-action="rform-from" data-value="this">${esc(monthLabel(cur, true))}</button>
        <button class="chip ${f.amountFrom === 'next' ? 'on' : ''}" data-action="rform-from" data-value="next">${esc(monthLabel(addMonths(cur, 1), true))}</button>
        <button class="chip ${f.amountFrom === 'all' ? 'on' : ''}" data-action="rform-from" data-value="all">von Anfang an</button>
      </div>
      <div class="small muted" style="margin-top:6px">Frühere Monate bleiben dann unverändert.</div></div>` : ''}
    <div class="field"><label for="r-cat">Kategorie</label>
      <select class="input" id="r-cat" data-model="rform.categoryId">
        ${cats.map(c => `<option value="${c.id}" ${c.id === f.categoryId ? 'selected' : ''}>${esc(c.icon)} ${esc(c.name)}</option>`).join('')}
      </select></div>
    ${isIncome ? '' : `<div class="field"><span class="field-label">Für wen?</span>${whoChips(f.forWhom, 'rform-who')}</div>`}
    <div class="field"><span class="field-label">${isIncome ? 'Wer bekommt es?' : 'Bezahlt von'}</span>
      ${whoChips(f.paidBy, 'rform-paid', { only: ['p1', 'p2'] })}</div>
    <div class="inline-fields">
      <div class="field"><label for="r-int">Wie oft?</label>
        <select class="input" id="r-int" data-model="rform.interval" data-number data-rerender>
          ${INTERVALS.map(i => `<option value="${i.value}" ${i.value === f.interval ? 'selected' : ''}>${i.label}</option>`).join('')}
        </select></div>
      <div class="field"><label for="r-day">Fällig am</label>
        <select class="input" id="r-day" data-model="rform.dueDay" data-number>
          ${Array.from({ length: 31 }, (_, i) => i + 1).map(d => `<option value="${d}" ${d === f.dueDay ? 'selected' : ''}>${d}.</option>`).join('')}
        </select></div>
    </div>
    <div class="field"><label for="r-start">${f.interval === 0 ? 'In welchem Monat?' : 'Erstmals im'}</label>
      <select class="input" id="r-start" data-model="rform.startMonth">
        ${months.map(m => `<option value="${m}" ${m === f.startMonth ? 'selected' : ''}>${esc(monthLabel(m))}</option>`).join('')}
      </select></div>
    <button class="btn" data-action="rform-save">Speichern</button>
    ${rec ? `<button class="btn secondary" data-action="rform-pause">${paused ? '▶️ Fortsetzen' : '⏸️ Pausieren'}</button>
      <button class="btn danger" data-action="rform-delete">Beenden / Löschen</button>` : ''}`;
}

// --- Kategorien ---

function viewCategories() {
  const list = type => Store.live('categories').filter(c => c.type === type).map(c => `
    <li class="row tappable" data-action="edit-category" data-id="${c.id}">
      <div class="ico">${esc(c.icon)}</div>
      <div class="txt"><div class="ttl">${esc(c.name)}</div>
      ${c.defaultFor ? `<div class="sub">Standard: ${esc(whoName(c.defaultFor))}</div>` : ''}</div>
      <div class="amt">›</div></li>`).join('');
  return `<button class="back" data-action="back">‹ Mehr</button>
    <div class="card"><h3>Ausgaben</h3><ul class="list">${list('expense')}</ul>
      <button class="btn secondary small" style="margin-top:12px" data-action="new-category" data-type="expense">+ Neue Kategorie</button></div>
    <div class="card"><h3>Einnahmen</h3><ul class="list">${list('income')}</ul>
      <button class="btn secondary small" style="margin-top:12px" data-action="new-category" data-type="income">+ Neue Kategorie</button></div>`;
}

function viewCategoryForm() {
  const f = ui.cform;
  return `<button class="back" data-action="back">‹ Kategorien</button>
    <div class="page-title">${f.id ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</div>
    <div class="inline-fields">
      <div class="field" style="flex:0 0 90px"><label for="c-icon">Symbol</label>
        <input class="input center" id="c-icon" data-model="cform.icon" value="${esc(f.icon)}" maxlength="4" autocomplete="off"></div>
      <div class="field"><label for="c-name">Name</label>
        <input class="input" id="c-name" data-model="cform.name" value="${esc(f.name)}" autocomplete="off" ${f.id ? '' : 'data-autofocus'}></div>
    </div>
    ${f.type === 'expense' ? `<div class="field"><span class="field-label">Standard „Für wen“ beim Eintragen</span>
      ${whoChips(f.defaultFor || 'haushalt', 'cform-who')}
      <div class="small muted" style="margin-top:6px">Beispiel: Kita → automatisch das gemeinsame Kind.</div></div>` : ''}
    <button class="btn" data-action="cform-save">Speichern</button>
    ${f.id ? '<button class="btn danger" data-action="cform-delete">Kategorie löschen</button>' : ''}`;
}

/* ============================================================
   6. Aktionen
   ============================================================ */

let toastTimer = null;
function toast(msg, action) {
  const el = document.getElementById('toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
  el.hidden = false;
  if (action) el.querySelector('button').onclick = () => { el.hidden = true; action.run(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, action ? 5000 : 2500);
}

/** Einfache Auswahl-Abfrage von unten. Gibt den gewählten Wert zurück (oder null). */
function choose(title, text, options) {
  return new Promise(resolve => {
    const el = document.getElementById('modal');
    el.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">
      <h2>${esc(title)}</h2>${text ? `<p>${esc(text)}</p>` : ''}
      ${options.map((o, i) => `<button class="btn ${o.style || ''}" data-i="${i}">${esc(o.label)}</button>`).join('')}
      <button class="btn secondary" data-i="-1">Abbrechen</button></div>`;
    el.hidden = false;
    const close = v => { el.hidden = true; el.onclick = null; resolve(v); };
    el.onclick = e => {
      if (e.target === el) return close(null);
      const b = e.target.closest('[data-i]');
      if (b) close(b.dataset.i === '-1' ? null : options[Number(b.dataset.i)].value);
    };
  });
}

function openEntryForm(entry) {
  if (entry) {
    ui.form = Object.assign(newForm(entry.type), {
      id: entry.id, amountStr: centsToInput(entry.amount), categoryId: entry.categoryId,
      forWhom: entry.forWhom || 'haushalt', forTouched: true, paidBy: entry.paidBy || 'p1',
      date: entry.date, note: entry.note || '',
    });
  } else {
    ui.form = newForm(ui.form && !ui.form.id ? ui.form.type : 'expense');
  }
  go('form');
}

function openRecurringForm(rec) {
  const cur = currentMonth();
  if (rec) {
    const refMonth = rec.startMonth > cur ? rec.startMonth : cur;
    const cents = amountFor(rec, refMonth);
    ui.rform = Object.assign(newRecurringForm(rec.type), {
      id: rec.id, name: rec.name, amountStr: centsToInput(cents), categoryId: rec.categoryId,
      forWhom: rec.forWhom || 'haushalt', paidBy: rec.paidBy || 'p1', interval: rec.interval,
      dueDay: rec.dueDay, startMonth: rec.startMonth, amountFrom: 'this', origCents: cents,
    });
  }
  go('recurringForm');
}

const ACTIONS = {
  goto: el => go(el.dataset.view),
  back: () => history.back(),

  month: el => {
    const step = Number(el.dataset.step);
    ui.month = step === 0 ? currentMonth() : addMonths(ui.month, step);
    render();
  },

  'switch-profile': () => {
    Device.profile = Device.profile === 'p1' ? 'p2' : 'p1';
    render();
    toast(`Du bist jetzt ${whoName(Device.profile)}`);
  },
  'set-profile': el => { Device.profile = el.dataset.value; render(); },

  // Willkommen
  'welcome-me': el => { ui.welcome.me = el.dataset.value; render(); },
  'welcome-done': () => {
    const w = ui.welcome;
    const n = {};
    for (const k of ['p1', 'p2', 'k1', 'k2']) n[k] = (w[k] || '').trim() || defaultState().settings.names[k];
    Store.setNames(n);
    Device.profile = w.me;
    ui.welcome = null;
    go('overview', { replace: true });
  },

  // Monatsliste
  'filter-type': el => { ui.filter.type = el.dataset.value; render(); },
  'filter-who': el => { ui.filter.who = el.dataset.value; render(); },
  'edit-entry': el => openEntryForm(Store.get('entries', el.dataset.id)),
  'edit-recurring': el => openRecurringForm(Store.get('recurring', el.dataset.id)),

  // Eintragen
  'form-type': el => {
    ui.form.type = el.dataset.value;
    ui.form.categoryId = null;
    ui.form.forWhom = 'haushalt';
    ui.form.forTouched = false;
    render();
  },
  'form-cat': el => {
    const f = ui.form;
    f.categoryId = el.dataset.value;
    if (!f.forTouched) f.forWhom = catById(f.categoryId).defaultFor || 'haushalt';
    render();
  },
  'form-allcats': () => { ui.form.showAllCats = true; render(); },
  'form-who': el => { ui.form.forWhom = el.dataset.value; ui.form.forTouched = true; render(); },
  'form-paid': el => { ui.form.paidBy = el.dataset.value; render(); },
  'form-more': () => { ui.form.showMore = true; render(); },
  'form-save': () => {
    const f = ui.form;
    const cents = parseAmount(f.amountStr);
    if (!cents || !Number.isFinite(cents)) { toast('Bitte einen Betrag eingeben'); document.getElementById('f-amount').focus(); return; }
    if (!f.categoryId) { toast(f.type === 'income' ? 'Bitte auswählen, was es ist' : 'Bitte „Wofür?“ auswählen'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) f.date = todayStr();
    const old = f.id ? Store.get('entries', f.id) : null;
    const entry = Object.assign(old ? clone(old) : { id: uid(), createdBy: Device.profile, createdAt: Date.now() }, {
      type: f.type, amount: cents, date: f.date, categoryId: f.categoryId,
      forWhom: f.type === 'income' ? 'haushalt' : f.forWhom, paidBy: f.paidBy, note: f.note.trim(),
    });
    Store.upsert('entries', entry);
    ui.month = entry.date.slice(0, 7);
    const wasNew = !old;
    ui.form = null;
    go(wasNew ? 'overview' : 'list', { replace: true });
    toast(wasNew ? `✓ ${money(cents)} eingetragen` : '✓ Gespeichert', wasNew ? {
      label: 'Rückgängig', run: () => { Store.remove('entries', entry.id); render(); },
    } : null);
  },
  'form-delete': () => {
    const id = ui.form.id;
    Store.remove('entries', id);
    ui.form = null;
    go('list', { replace: true });
    toast('Gelöscht', { label: 'Rückgängig', run: () => { Store.restore('entries', id); render(); } });
  },

  // Auswertung
  'stats-period': el => { ui.stats.period = el.dataset.value; render(); },
  'stats-fix': el => { ui.stats.includeFix = el.dataset.value === '1'; render(); },

  // Regelmäßige Zahlungen
  'new-recurring': el => { ui.rform = newRecurringForm(el.dataset.type); go('recurringForm'); },
  preset: el => { ui.rform = newRecurringForm('expense', RECURRING_PRESETS[Number(el.dataset.value)]); go('recurringForm'); },
  'rform-type': el => {
    ui.rform.type = el.dataset.value;
    ui.rform.categoryId = el.dataset.value === 'income' ? 'c-gehalt' : 'c-miete';
    render();
  },
  'rform-who': el => { ui.rform.forWhom = el.dataset.value; render(); },
  'rform-paid': el => { ui.rform.paidBy = el.dataset.value; render(); },
  'rform-from': el => { ui.rform.amountFrom = el.dataset.value; render(); },
  'rform-save': () => {
    const f = ui.rform;
    const cur = currentMonth();
    const cents = parseAmount(f.amountStr);
    if (!cents || !Number.isFinite(cents)) { toast('Bitte einen Betrag eingeben'); return; }
    const name = f.name.trim() || catById(f.categoryId).name;
    const old = f.id ? Store.get('recurring', f.id) : null;
    const rec = old ? clone(old) : { id: uid(), endMonth: null, pauses: [], amounts: [], createdBy: Device.profile };
    Object.assign(rec, {
      type: f.type, name, categoryId: f.categoryId, forWhom: f.type === 'income' ? 'haushalt' : f.forWhom,
      paidBy: f.paidBy, interval: f.interval, dueDay: f.dueDay, startMonth: f.startMonth,
    });
    if (!old) {
      rec.amounts = [{ from: rec.startMonth, cents }];
    } else if (cents !== f.origCents) {
      // Betrag geändert: Vergangenheit bleibt, wenn „ab diesem/nächsten Monat“ gewählt
      let from = f.amountFrom === 'next' ? addMonths(cur, 1) : f.amountFrom === 'all' ? rec.startMonth : cur;
      if (from <= rec.startMonth) rec.amounts = [{ from: rec.startMonth, cents }];
      else rec.amounts = rec.amounts.filter(a => a.from < from).concat([{ from, cents }]);
    }
    Store.upsert('recurring', rec);
    ui.rform = null;
    go('recurringList', { replace: true });
    toast('✓ Gespeichert');
  },
  'rform-pause': () => {
    const rec = clone(Store.get('recurring', ui.rform.id));
    const cur = currentMonth();
    rec.pauses = rec.pauses || [];
    if (isPaused(rec, cur)) {
      const p = rec.pauses.find(x => cur >= x.from && (!x.to || cur <= x.to));
      if (p.from >= cur) rec.pauses = rec.pauses.filter(x => x !== p);
      else p.to = addMonths(cur, -1);
      toast('▶️ Läuft wieder ab diesem Monat');
    } else {
      rec.pauses.push({ from: cur, to: null });
      toast('⏸️ Pausiert ab diesem Monat');
    }
    Store.upsert('recurring', rec);
    ui.rform = null;
    go('recurringList', { replace: true });
  },
  'rform-delete': async () => {
    const id = ui.rform.id;
    const cur = currentMonth();
    const choice = await choose('Beenden oder löschen?', 'Beim Beenden bleiben vergangene Monate korrekt in der Auswertung.', [
      { label: `Ab ${monthLabel(cur)} beenden`, value: 'end' },
      { label: 'Komplett löschen (auch Vergangenheit)', value: 'all', style: 'danger' },
    ]);
    if (!choice) return;
    const rec = clone(Store.get('recurring', id));
    if (choice === 'end' && addMonths(cur, -1) >= rec.startMonth) {
      rec.endMonth = addMonths(cur, -1);
      Store.upsert('recurring', rec);
      toast('Beendet');
    } else {
      Store.remove('recurring', id);
      toast('Gelöscht', { label: 'Rückgängig', run: () => { Store.restore('recurring', id); render(); } });
    }
    ui.rform = null;
    go('recurringList', { replace: true });
  },

  // Kategorien
  'edit-category': el => { ui.cform = clone(Store.get('categories', el.dataset.id)); go('categoryForm'); },
  'new-category': el => { ui.cform = { id: null, type: el.dataset.type, name: '', icon: '🏷️', defaultFor: null }; go('categoryForm'); },
  'cform-who': el => { ui.cform.defaultFor = el.dataset.value === 'haushalt' ? null : el.dataset.value; render(); },
  'cform-save': () => {
    const f = ui.cform;
    if (!f.name.trim()) { toast('Bitte einen Namen eingeben'); return; }
    const cat = Object.assign(f.id ? clone(Store.get('categories', f.id)) : { id: 'c-' + uid() }, {
      name: f.name.trim(), icon: f.icon.trim() || '🏷️', type: f.type, defaultFor: f.defaultFor || null,
    });
    Store.upsert('categories', cat);
    ui.cform = null;
    go('categories', { replace: true });
  },
  'cform-delete': async () => {
    const ok = await choose('Kategorie löschen?', 'Bisherige Einträge behalten ihre Kategorie, sie ist nur nicht mehr auswählbar.', [
      { label: 'Löschen', value: true, style: 'danger' },
    ]);
    if (!ok) return;
    Store.remove('categories', ui.cform.id);
    ui.cform = null;
    go('categories', { replace: true });
  },

  // Datenabgleich
  export: async () => {
    const data = JSON.stringify({ app: 'haushalt', exportedAt: Date.now(), from: Device.profile, state: Store.state });
    const who = (whoName(Device.profile) || 'handy').replace(/[^\wäöüÄÖÜß-]+/g, '');
    const fileName = `haushalt-${todayStr()}-${who}.json`;
    const file = new File([data], fileName, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Haushalt-Daten' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      }
      Device.lastSync = Date.now();
      render();
      toast('📤 Datei erstellt – jetzt an das andere Handy schicken');
    } catch (e) {
      if (e && e.name !== 'AbortError') toast('Senden hat nicht geklappt');
    }
  },
  import: () => document.getElementById('import-file').click(),

  'reset-all': async () => {
    const ok = await choose('Wirklich alles löschen?', 'Alle Einträge auf diesem Handy werden gelöscht. Tipp: vorher „Daten senden“ als Sicherung.', [
      { label: 'Ja, alles löschen', value: true, style: 'danger' },
    ]);
    if (!ok) return;
    Store.reset();
    Device.lastSync = 0;
    go('overview', { replace: true });
    toast('Alle Daten gelöscht');
  },
};

// Klicks
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    if (tab.dataset.tab === 'add') openEntryForm(null);
    else go(tab.dataset.tab);
    return;
  }
  const el = e.target.closest('[data-action]');
  if (el && ACTIONS[el.dataset.action]) {
    e.preventDefault();
    ACTIONS[el.dataset.action](el);
  }
});

// Eingabefelder → Zustand (ohne die Seite neu aufzubauen, damit die Tastatur offen bleibt)
function onFieldInput(e) {
  const el = e.target;
  if (el.dataset.model) {
    const [obj, key] = el.dataset.model.split('.');
    if (!ui[obj]) return;
    ui[obj][key] = 'number' in el.dataset ? Number(el.value) : el.value;
    if (e.type === 'change' && 'rerender' in el.dataset) render();
    // „Gilt ab“-Auswahl nur zeigen, wenn sich der Betrag geändert hat (ohne Neuaufbau)
    if (el.id === 'r-amount' && ui.rform) {
      const box = document.getElementById('r-from');
      const c = parseAmount(el.value);
      if (box) box.hidden = !(Number.isFinite(c) && c > 0 && c !== ui.rform.origCents);
    }
  }
  if (el.dataset.name && e.type === 'change') {
    const v = el.value.trim();
    if (v) { Store.setNames({ [el.dataset.name]: v }); render(); toast('✓ Name gespeichert'); }
  }
}
document.addEventListener('input', onFieldInput);
document.addEventListener('change', onFieldInput);

// Enter im Betragsfeld speichert direkt
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'f-amount' && ui.form && ui.form.categoryId) ACTIONS['form-save']();
});

// Datei vom anderen Handy übernehmen
document.getElementById('import-file').addEventListener('change', async e => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || data.app !== 'haushalt' || !data.state) throw new Error('falsches Format');
    const changed = Store.merge(data.state);
    Device.lastSync = Date.now();
    if (ui.view === 'welcome') ui.welcome = Object.assign({ me: data.from === 'p1' ? 'p2' : 'p1' }, clone(names()));
    render();
    toast(changed ? `📥 ${changed} Änderung${changed === 1 ? '' : 'en'} übernommen` : 'Alles war schon aktuell ✓');
  } catch (err) {
    toast('Diese Datei kann ich nicht lesen');
  }
});

/* ---------- Start ---------- */
Store.load();
history.replaceState({ view: Device.profile ? 'overview' : 'welcome' }, '');
ui.view = Device.profile ? 'overview' : 'welcome';
render();
