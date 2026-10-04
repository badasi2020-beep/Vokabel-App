// ===================== Speicher =====================
// Alles bleibt nur im Browser dieses Geräts (localStorage).
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('delfin.' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('delfin.' + key, JSON.stringify(value)); } catch (e) { /* privat-Modus o. ä. */ }
  }
};

const settings = Object.assign({ perTicket: 10, gameSeconds: 45, apiKey: '' }, store.get('settings', {}));
const progress = Object.assign({ correctTotal: 0, towardTicket: 0, tickets: 0, best: {} }, store.get('progress', {}));
let savedLists = store.get('lists', []);

function saveProgress() { store.set('progress', progress); updateTicketDisplay(); }

// ===================== Spielzustand =====================
let vocabPairs = [];      // alle Paare der aktuellen Liste (auch für falsche MC-Antworten)
let roundPairs = [];      // Paare, die in dieser Runde abgefragt werden
let questions = [];
let currentIndex = 0;
let score = 0;
let lives = 3;
let streak = 0;
let correctCount = 0;
let wrongPairs = [];
let ticketsThisRound = 0;
let gameMode = 'mc';
let direction = 'forward';
let answered = false;
let hintShown = false;

const SCREENS = ['setup', 'scan-review', 'lists', 'settings', 'game', 'celebration', 'arcade', 'arcade-play'];

function showScreen(id) {
  if (typeof stopArcade === 'function') stopArcade();
  SCREENS.forEach(s => document.getElementById(s).classList.toggle('hidden', s !== id));
  if (id === 'lists') renderLists();
  if (id === 'settings') renderSettings();
  if (id === 'arcade') renderArcadeMenu();
  window.scrollTo(0, 0);
}

function updateTicketDisplay() {
  document.getElementById('ticket-count').textContent = progress.tickets;
}

// ===================== Einstellungen & Entwurf =====================
function setMode(m) {
  gameMode = m;
  document.querySelectorAll('[id^="mode-"]').forEach(b => b.classList.toggle('active', b.id === 'mode-' + m));
  saveDraft();
}

function setDirection(d) {
  direction = d;
  document.querySelectorAll('[id^="dir-"]').forEach(b => b.classList.toggle('active', b.id === 'dir-' + d));
  saveDraft();
}

function saveDraft() {
  store.set('draft', {
    text: document.getElementById('vocab-input').value,
    from: document.getElementById('lang-from').value,
    to: document.getElementById('lang-to').value,
    mode: gameMode,
    direction
  });
}

function loadDraft() {
  const d = store.get('draft', null);
  if (!d) return;
  document.getElementById('vocab-input').value = d.text || '';
  if (d.from) document.getElementById('lang-from').value = d.from;
  if (d.to) document.getElementById('lang-to').value = d.to;
  setMode(d.mode || 'mc');
  setDirection(d.direction || 'forward');
}

function renderSettings() {
  document.getElementById('set-per-ticket').value = settings.perTicket;
  document.getElementById('set-game-seconds').value = settings.gameSeconds;
  document.getElementById('set-api-key').value = settings.apiKey;
}

function saveSettings() {
  const per = parseInt(document.getElementById('set-per-ticket').value, 10);
  const secs = parseInt(document.getElementById('set-game-seconds').value, 10);
  settings.perTicket = Math.min(100, Math.max(1, per || 10));
  settings.gameSeconds = Math.min(300, Math.max(15, secs || 45));
  settings.apiKey = document.getElementById('set-api-key').value.trim();
  store.set('settings', settings);
  showScreen('setup');
}

function clearInput() {
  if (!document.getElementById('vocab-input').value.trim()) return;
  if (!confirm('Alle Vokabeln im Eingabefeld löschen?')) return;
  document.getElementById('vocab-input').value = '';
  hideNotice();
  saveDraft();
}

function showNotice(html) {
  const el = document.getElementById('parse-notice');
  el.innerHTML = html;
  el.classList.remove('hidden');
}
function hideNotice() { document.getElementById('parse-notice').classList.add('hidden'); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===================== Listen =====================
function saveCurrentList() {
  const text = document.getElementById('vocab-input').value.trim();
  if (!text) { alert('Es gibt noch keine Vokabeln zum Speichern. 🐬'); return; }
  const name = (prompt('Wie soll die Liste heißen? (z. B. „Unit 3“)') || '').trim();
  if (!name) return;
  const entry = {
    name,
    from: document.getElementById('lang-from').value,
    to: document.getElementById('lang-to').value,
    text,
    saved: Date.now()
  };
  const existing = savedLists.findIndex(l => l.name === name);
  if (existing >= 0) {
    if (!confirm(`Die Liste „${name}“ gibt es schon. Überschreiben?`)) return;
    savedLists[existing] = entry;
  } else {
    savedLists.push(entry);
  }
  store.set('lists', savedLists);
  alert(`Liste „${name}“ gespeichert! 💾`);
}

function renderLists() {
  const c = document.getElementById('lists-container');
  if (!savedLists.length) {
    c.innerHTML = '<p class="hint-small">Noch keine Listen gespeichert. Tippe beim Eingeben auf „💾 Liste speichern“.</p>';
    return;
  }
  c.innerHTML = '';
  savedLists.forEach((l, i) => {
    const count = parseVocab(l.text).pairs.length;
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `<div class="name">${escapeHtml(l.name)}<div class="count">${count} Vokabeln · ${escapeHtml(l.from)} → ${escapeHtml(l.to)}</div></div>`;
    const load = document.createElement('button');
    load.className = 'btn-small';
    load.textContent = 'Laden';
    load.onclick = () => loadList(i);
    const del = document.createElement('button');
    del.className = 'btn-small danger';
    del.textContent = '🗑️';
    del.onclick = () => deleteList(i);
    row.append(load, del);
    c.appendChild(row);
  });
}

function loadList(i) {
  const l = savedLists[i];
  document.getElementById('vocab-input').value = l.text;
  document.getElementById('lang-from').value = l.from;
  document.getElementById('lang-to').value = l.to;
  hideNotice();
  saveDraft();
  showScreen('setup');
}

function deleteList(i) {
  if (!confirm(`Liste „${savedLists[i].name}“ wirklich löschen?`)) return;
  savedLists.splice(i, 1);
  store.set('lists', savedLists);
  renderLists();
}

// ===================== Vokabeln einlesen =====================
// Trennzeichen zwischen Wort und Übersetzung, in dieser Reihenfolge probiert.
// Nur das erste Vorkommen trennt, damit Kommas in der Übersetzung erhalten bleiben (z. B. "gehen = to go, to walk").
const SEPARATORS = [/\t+/, /\s*=\s*/, /\s+[–—-]\s+/, /\s*;\s*/, /\s*,\s*/, /\s{2,}/];

function splitLine(line) {
  const clean = line.replace(/^\s*(\d+[.)]|[-•*])\s+/, '').trim();
  if (!clean) return null;
  for (const sep of SEPARATORS) {
    const m = sep.exec(clean);
    if (m && m.index > 0) {
      const from = clean.slice(0, m.index).trim();
      const to = clean.slice(m.index + m[0].length).trim();
      if (from && to) return { from, to };
    }
  }
  return { from: clean, to: '' };
}

function parseVocab(raw) {
  const pairs = [];
  const missing = [];
  const seen = new Set();
  raw.split('\n').forEach(line => {
    const p = splitLine(line);
    if (!p) return;
    if (!p.to) { missing.push(p.from); return; }
    const key = normalize(p.from) + '|' + normalize(p.to);
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push(p);
  });
  return { pairs, missing };
}

// Mehrere richtige Antworten: "to go / to walk", "Haus, Gebäude"
function alternatives(text) {
  const parts = text.split(/\s*[\/,;]\s*/).filter(Boolean);
  const out = new Set();
  parts.forEach(p => {
    const n = normalize(p);
    if (!n) return;
    out.add(n);
    // Klammern optional: "(sich) freuen" -> "sich freuen" oder "freuen"
    if (/[()]/.test(n)) {
      out.add(normalize(n.replace(/\([^)]*\)/g, ' ')));
      out.add(normalize(n.replace(/[()]/g, '')));
    }
  });
  // Ganzer Text zählt auch, falls jemand alles abtippt
  out.add(normalize(text));
  return [...out].filter(Boolean);
}

function normalize(s) {
  return String(s)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[„“"«»!?.¡¿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ===================== Spielstart =====================
async function startGame() {
  const input = document.getElementById('vocab-input');
  const raw = input.value.trim();
  if (!raw) { alert('Lotte, trag zuerst Vokabeln ein! 🐬'); return; }

  const fromLang = document.getElementById('lang-from').value;
  const toLang = document.getElementById('lang-to').value;
  let { pairs, missing } = parseVocab(raw);
  hideNotice();

  if (missing.length && settings.apiKey) {
    const btn = document.getElementById('start-btn');
    btn.innerHTML = 'Claude übersetzt<span class="loading-dots"><span></span><span></span><span></span></span>';
    btn.disabled = true;
    try {
      const translated = await aiTranslate(missing, fromLang, toLang);
      // Übersetzungen ins Eingabefeld schreiben, damit sie beim nächsten Mal schon da sind
      const lookup = new Map(translated.map(t => [t.from, t.to]));
      input.value = raw.split('\n').map(line => {
        const p = splitLine(line);
        return p && !p.to && lookup.get(p.from) ? `${p.from} = ${lookup.get(p.from)}` : line;
      }).join('\n');
      saveDraft();
      ({ pairs, missing } = parseVocab(input.value));
    } catch (e) {
      console.error(e);
      showNotice('Die automatische Übersetzung hat nicht geklappt (' + escapeHtml(e.message || e) + '). Wörter ohne Übersetzung werden übersprungen.');
    } finally {
      btn.innerHTML = 'Los geht\'s, Lotte! 🚀';
      btn.disabled = false;
    }
  }

  if (missing.length) {
    showNotice(`⚠️ Ohne Übersetzung, deshalb übersprungen: <b>${missing.map(escapeHtml).join(', ')}</b><br>
      Schreib die Übersetzung mit <b>=</b> dahinter, z.&nbsp;B. „${escapeHtml(missing[0])} = …“.` +
      (settings.apiKey ? '' : ' Mit einem Claude-Schlüssel (⚙️) übersetzt die App das automatisch.'));
  }

  if (pairs.length < 2) {
    alert('Bitte mindestens 2 Vokabeln mit Übersetzung eingeben! 🐬');
    return;
  }

  vocabPairs = pairs;
  startRound(pairs);
}

function startRound(pairs) {
  roundPairs = pairs;
  const fromLang = document.getElementById('lang-from').value;
  const toLang = document.getElementById('lang-to').value;
  questions = shuffle(pairs.map(p => {
    const reverse = direction === 'backward' || (direction === 'mixed' && Math.random() < 0.5);
    return reverse
      ? { pair: p, prompt: p.to, answer: p.from, side: 'from', label: toLang + ' → ' + fromLang }
      : { pair: p, prompt: p.from, answer: p.to, side: 'to', label: fromLang + ' → ' + toLang };
  }));
  currentIndex = 0; score = 0; lives = 3; streak = 0; correctCount = 0;
  wrongPairs = []; ticketsThisRound = 0;
  showScreen('game');
  renderQuestion();
}

function renderQuestion() {
  if (currentIndex >= questions.length || lives <= 0) { showResults(); return; }

  answered = false; hintShown = false;
  const q = questions[currentIndex];

  document.getElementById('q-lang').textContent = q.label;
  document.getElementById('q-word').textContent = q.prompt;
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('next-btn').classList.add('hidden');
  document.getElementById('progress-fill').style.width = (currentIndex / questions.length) * 100 + '%';
  updateStats();

  const mc = gameMode === 'mc';
  document.getElementById('mc-area').classList.toggle('hidden', !mc);
  document.getElementById('type-area').classList.toggle('hidden', mc);
  if (mc) {
    renderChoices(q);
  } else {
    const inp = document.getElementById('answer-input');
    inp.value = ''; inp.className = ''; inp.disabled = false;
    document.getElementById('submit-btn').classList.remove('hidden');
    document.getElementById('hint-btn').classList.remove('hidden');
    document.getElementById('hint-text').classList.add('hidden');
    document.getElementById('hint-text').textContent = '';
    setTimeout(() => inp.focus(), 100);
  }
}

function renderChoices(q) {
  const grid = document.getElementById('choices-grid');
  grid.innerHTML = '';
  // Falsche Antworten aus derselben Sprache, ohne Doppelte
  const seen = new Set([normalize(q.answer)]);
  const others = [];
  shuffle(vocabPairs.map(p => p[q.side])).forEach(t => {
    const n = normalize(t);
    if (!seen.has(n)) { seen.add(n); others.push(t); }
  });
  shuffle([q.answer, ...others.slice(0, 3)]).forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.dataset.correct = choice === q.answer ? '1' : '';
    btn.onclick = () => checkChoice(btn);
    grid.appendChild(btn);
  });
}

function checkChoice(btn) {
  if (answered) return;
  answered = true;
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    if (b.dataset.correct) b.classList.add('reveal-correct');
  });
  if (btn.dataset.correct) {
    btn.classList.remove('reveal-correct');
    btn.classList.add('selected-correct');
    onCorrect();
  } else {
    btn.classList.add('selected-wrong');
    onWrong();
  }
  document.getElementById('next-btn').classList.remove('hidden');
}

function checkTyped() {
  if (answered) return;
  const inp = document.getElementById('answer-input');
  const userAnswer = normalize(inp.value);
  if (!userAnswer) return;
  const q = questions[currentIndex];
  const accepted = alternatives(q.answer);

  answered = true;
  inp.disabled = true;
  document.getElementById('submit-btn').classList.add('hidden');
  document.getElementById('hint-btn').classList.add('hidden');

  const exact = accepted.includes(userAnswer) ||
    // Englische Verben: "swim" statt "to swim" gilt auch
    accepted.some(a => a.startsWith('to ') && a.slice(3) === userAnswer);
  const almost = !exact && accepted.some(a => {
    const limit = a.length > 9 ? 2 : a.length > 4 ? 1 : 0;
    return limit > 0 && levenshtein(userAnswer, a) <= limit;
  });

  if (exact || almost) {
    inp.classList.add('correct');
    onCorrect(hintShown ? 1 : 0, almost ? q.answer : null);
  } else {
    inp.classList.add('wrong');
    onWrong();
  }
  document.getElementById('next-btn').classList.remove('hidden');
}

const correctMessages = [
  '🐬 Toll, Lotte!', '💙 Super gemacht!', '🌊 Wellen-Klasse!',
  '⭐ Fantastisch!', '🩷 Du rockst das!', '🐬 Delfin-stark!'
];
const wrongMessages = [
  '💙 Fast! Nächstes Mal klappt\'s!', '🌊 Nicht aufgeben, Lotte!', '🐬 Delfine üben auch!'
];

function onCorrect(penalty = 0, spelling = null) {
  streak++;
  correctCount++;
  const bonus = streak >= 3 ? 2 : 1;
  const gained = Math.max(0, bonus - penalty);
  score += gained;
  let msg = correctMessages[Math.floor(Math.random() * correctMessages.length)];
  msg += streak >= 3 ? ` Kombo x${streak}! +${gained} ⭐` : ` +${gained} ⭐`;
  if (spelling) msg += ` (Fast richtig geschrieben: „${spelling}“)`;
  if (gained > 0 && countTowardTicket()) msg += ' 🎟️ Spiel-Ticket gewonnen!';
  showFeedback(msg, true);
  updateStats();
}

function onWrong() {
  const q = questions[currentIndex];
  streak = 0; lives--;
  if (!wrongPairs.includes(q.pair)) wrongPairs.push(q.pair);
  const base = wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
  showFeedback(`${base} Richtig ist: „${q.answer}“`, false);
  updateStats();
}

// Gibt true zurück, wenn gerade ein neues Ticket verdient wurde
function countTowardTicket() {
  progress.correctTotal++;
  progress.towardTicket++;
  let earned = false;
  if (progress.towardTicket >= settings.perTicket) {
    progress.towardTicket = 0;
    progress.tickets++;
    ticketsThisRound++;
    earned = true;
  }
  saveProgress();
  return earned;
}

function showFeedback(msg, ok) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = 'feedback show ' + (ok ? 'correct-fb' : 'wrong-fb');
}

function nextQuestion() {
  if (!answered) return;
  currentIndex++;
  renderQuestion();
}

function updateStats() {
  document.getElementById('score-display').textContent = score;
  document.getElementById('streak-display').textContent = streak;
  document.getElementById('lives-pill').textContent =
    lives <= 0 ? '💔' : '💙'.repeat(lives) + '🤍'.repeat(3 - lives);
}

function showHint() {
  if (answered) return;
  hintShown = true;
  const first = questions[currentIndex].answer.split(/\s*[\/,;]\s*/)[0];
  const hint = [...first].map((c, i) => c === ' ' ? '  ' : i === 0 ? c : '_').join(' ');
  document.getElementById('hint-text').textContent = '💡 Tipp: ' + hint;
  document.getElementById('hint-text').classList.remove('hidden');
  document.getElementById('hint-btn').classList.add('hidden');
}

function showResults() {
  showScreen('celebration');
  const total = questions.length;
  const gameOver = lives <= 0;
  const pct = Math.round((correctCount / total) * 100);

  document.getElementById('result-score').textContent = score + ' ⭐';

  let name, stars, msg;
  if (gameOver) {
    name = 'Oh, keine Herzen mehr!';
    stars = '💙';
    msg = `Du hattest ${correctCount} von ${total} richtig. Übe die schwierigen Wörter noch einmal, dann schaffst du es! 🐬`;
  } else if (pct >= 80) {
    name = 'Super, Lotte!';
    stars = '⭐⭐⭐';
    msg = `${correctCount} von ${total} richtig! Du bist eine echte Delfin-Meisterin! 🐬💙`;
  } else if (pct >= 50) {
    name = 'Sehr gut, Lotte!';
    stars = '⭐⭐';
    msg = `${correctCount} von ${total} richtig! 🌊 Noch ein bisschen üben und du schaffst alles!`;
  } else {
    name = 'Guter Start, Lotte!';
    stars = '⭐';
    msg = `${correctCount} von ${total} richtig. 💙 Delfine üben auch jeden Tag – nochmal versuchen!`;
  }
  document.getElementById('result-name').textContent = name;
  document.getElementById('result-stars').textContent = stars;
  document.getElementById('result-msg').textContent = msg;

  const banner = document.getElementById('reward-banner');
  banner.classList.toggle('hidden', ticketsThisRound === 0);
  banner.textContent = ticketsThisRound === 1
    ? '🎟️ Du hast ein Spiel-Ticket gewonnen!'
    : `🎟️ Du hast ${ticketsThisRound} Spiel-Tickets gewonnen!`;
  document.getElementById('play-reward-btn').classList.toggle('hidden', progress.tickets === 0);
  document.getElementById('ticket-progress').textContent =
    `Noch ${settings.perTicket - progress.towardTicket} richtige Antworten bis zum nächsten Spiel-Ticket 🎟️`;
  document.getElementById('retry-wrong-btn').classList.toggle('hidden', wrongPairs.length === 0);
}

function retryWrong() { startRound([...wrongPairs]); }
function restartSame() { startRound(roundPairs); }
function backToSetup() { showScreen('setup'); }

function quitGame() {
  if (confirm('Runde abbrechen?')) showScreen('setup');
}

// ===================== Hilfsfunktionen =====================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] :
        1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

// ===================== Start =====================
document.getElementById('answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); answered ? nextQuestion() : checkTyped(); }
});
// Nach einer Antwort geht's mit Enter weiter (das Eingabefeld ist dann gesperrt)
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && answered &&
      !document.getElementById('game').classList.contains('hidden')) nextQuestion();
});
['vocab-input', 'lang-from', 'lang-to'].forEach(id =>
  document.getElementById(id).addEventListener('input', saveDraft));

loadDraft();
updateTicketDisplay();
