// ===================== Belohnungs-Spiele =====================
// Für je `settings.perTicket` richtige Antworten gibt es ein Spiel-Ticket. Jedes Spiel kostet ein Ticket.

const GAMES = [
  { id: 'jump', icon: '🐬', title: 'Delfin-Sprung', desc: 'Tippe, damit der Delfin springt. Sammle Sterne und spring über die Quallen!' },
  { id: 'bubbles', icon: '🫧', title: 'Blasen-Platzen', desc: 'Tippe die Blasen an, bevor sie wegschweben. Goldene Blasen geben 5 Punkte!' },
  { id: 'memory', icon: '🃏', title: 'Meeres-Memory', desc: 'Finde alle Paare – je schneller, desto mehr Punkte.' }
];

const W = 480, H = 640;
let arcade = null; // läuft gerade ein Spiel?

function renderArcadeMenu() {
  const info = document.getElementById('arcade-info');
  info.textContent = progress.tickets > 0
    ? `Du hast ${progress.tickets} Spiel-Ticket${progress.tickets === 1 ? '' : 's'} 🎟️ – such dir ein Spiel aus!`
    : `Noch keine Tickets. Für ${settings.perTicket} richtige Antworten bekommst du ein Spiel-Ticket 🎟️ (noch ${settings.perTicket - progress.towardTicket}).`;
  const grid = document.getElementById('game-grid');
  grid.innerHTML = '';
  GAMES.forEach(g => {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.disabled = progress.tickets <= 0;
    const best = progress.best[g.id];
    btn.innerHTML = `<div class="icon">${g.icon}</div><div><div class="title">${g.title}</div>
      <div class="desc">${g.desc}</div>${best ? `<div class="best">🏆 Rekord: ${best}</div>` : ''}</div>`;
    btn.onclick = () => startArcade(g.id);
    grid.appendChild(btn);
  });
}

function startArcade(id) {
  if (progress.tickets <= 0) return;
  progress.tickets--;
  saveProgress();
  showScreen('arcade-play');
  document.getElementById('arcade-end').classList.add('hidden');
  const isMemory = id === 'memory';
  document.getElementById('arcade-canvas').classList.toggle('hidden', isMemory);
  document.getElementById('memory-grid').classList.toggle('hidden', !isMemory);
  arcade = { id, score: 0, raf: 0, timers: [], running: true };
  setArcadeScore(0);
  if (id === 'jump') startJump();
  if (id === 'bubbles') startBubbles();
  if (id === 'memory') startMemory();
}

function stopArcade() {
  if (!arcade) return;
  arcade.running = false;
  cancelAnimationFrame(arcade.raf);
  arcade.timers.forEach(t => clearInterval(t));
  const canvas = document.getElementById('arcade-canvas');
  canvas.onpointerdown = null;
  arcade = null;
}

function setArcadeScore(s) {
  arcade.score = Math.max(0, Math.round(s));
  document.getElementById('arcade-score').textContent = arcade.score;
}

function endArcade(msg) {
  if (!arcade || !arcade.running) return;
  const { id, score } = arcade;
  stopArcade();
  const isRecord = score > (progress.best[id] || 0);
  if (isRecord) { progress.best[id] = score; saveProgress(); }
  document.getElementById('arcade-end-title').textContent = isRecord && score > 0 ? '🏆 Neuer Rekord!' : 'Geschafft! 🐬';
  document.getElementById('arcade-end-score').textContent = score + ' ⭐';
  document.getElementById('arcade-end-msg').textContent = msg;
  document.getElementById('arcade-end').classList.remove('hidden');
}

// Countdown für die zeitbegrenzten Spiele
function startCountdown(onEnd) {
  let left = settings.gameSeconds;
  const el = document.getElementById('arcade-time');
  el.textContent = left;
  arcade.timers.push(setInterval(() => {
    left--;
    el.textContent = Math.max(0, left);
    if (left <= 0) onEnd();
  }, 1000));
}

function canvasSetup() {
  const canvas = document.getElementById('arcade-canvas');
  const ctx = canvas.getContext('2d');
  const toLocal = e => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
  };
  return { canvas, ctx, toLocal };
}

function loop(step) {
  let last = performance.now();
  const frame = now => {
    if (!arcade || !arcade.running) return;
    const dt = Math.min(2.5, (now - last) / 16.67); // 1 = ein Frame bei 60 fps
    last = now;
    step(dt);
    arcade.raf = requestAnimationFrame(frame);
  };
  arcade.raf = requestAnimationFrame(frame);
}

function drawEmoji(ctx, emoji, x, y, size, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

// ---------- Spiel 1: Delfin-Sprung ----------
function startJump() {
  const { canvas, ctx } = canvasSetup();
  const WATER = 430;
  const dolphin = { x: 110, y: WATER, vy: 0, jumps: 0 };
  let items = [];
  let popups = [];
  let t = 0, spawn = 0, hitFlash = 0;

  canvas.onpointerdown = e => {
    e.preventDefault();
    if (dolphin.jumps < 2) { dolphin.vy = dolphin.jumps === 0 ? -15 : -11; dolphin.jumps++; }
  };

  startCountdown(() => endArcade('Super gesprungen! 🌊'));

  loop(dt => {
    t += dt;
    const speed = 4 + t / 600;

    // Delfin
    dolphin.vy += 0.6 * dt;
    dolphin.y += dolphin.vy * dt;
    if (dolphin.y >= WATER) { dolphin.y = WATER + Math.sin(t / 10) * 4; dolphin.vy = 0; dolphin.jumps = 0; }

    // Neue Sterne und Quallen
    spawn -= dt;
    if (spawn <= 0) {
      spawn = 40 + Math.random() * 40 - Math.min(20, t / 200);
      const r = Math.random();
      if (r < 0.35) items.push({ kind: 'jelly', x: W + 30, y: WATER + 5 });
      else items.push({ kind: r < 0.9 ? 'star' : 'shell', x: W + 30, y: 140 + Math.random() * 230 });
    }
    items.forEach(it => { it.x -= speed * dt; });

    // Zusammenstöße
    items = items.filter(it => {
      const hit = Math.hypot(it.x - dolphin.x, it.y - dolphin.y) < (it.kind === 'jelly' ? 38 : 42);
      if (hit) {
        if (it.kind === 'jelly') { setArcadeScore(arcade.score - 3); hitFlash = 15; popups.push({ x: it.x, y: it.y - 30, text: '−3', life: 40, color: '#E8479A' }); }
        else { const pts = it.kind === 'shell' ? 5 : 1; setArcadeScore(arcade.score + pts); popups.push({ x: it.x, y: it.y - 20, text: '+' + pts, life: 40, color: '#ffffff' }); }
        return false;
      }
      return it.x > -40;
    });

    // Zeichnen
    const sky = ctx.createLinearGradient(0, 0, 0, WATER);
    sky.addColorStop(0, '#AEE6F8'); sky.addColorStop(1, '#FFD6EC');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    drawEmoji(ctx, '☀️', 410, 70, 50);
    drawEmoji(ctx, '☁️', (W + 60 - (t * 0.6) % (W + 120)), 110, 46);

    items.forEach(it => {
      if (it.kind === 'star') drawEmoji(ctx, '⭐', it.x, it.y, 38);
      if (it.kind === 'shell') drawEmoji(ctx, '🐚', it.x, it.y, 42);
      if (it.kind === 'jelly') drawJelly(ctx, it.x, it.y, t);
    });

    drawEmoji(ctx, '🐬', dolphin.x, dolphin.y - 10, 64, true);

    // Wasser
    ctx.fillStyle = 'rgba(58,174,220,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) ctx.lineTo(x, WATER + 18 + Math.sin((x + t * speed) / 30) * 6);
    ctx.lineTo(W, H);
    ctx.fill();

    popups = popups.filter(p => {
      p.y -= 1 * dt; p.life -= dt;
      ctx.fillStyle = p.color; ctx.font = 'bold 26px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      return p.life > 0;
    });

    if (hitFlash > 0) { hitFlash -= dt; ctx.fillStyle = 'rgba(232,71,154,0.25)'; ctx.fillRect(0, 0, W, H); }
    if (t < 150) {
      ctx.fillStyle = 'white'; ctx.font = 'bold 28px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Tippen = springen', W / 2, 210);
      ctx.font = 'bold 20px Nunito, sans-serif';
      ctx.fillText('Zweimal tippen = Doppelsprung', W / 2, 245);
    }
  });
}

function drawJelly(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#c38cf2';
  ctx.beginPath();
  ctx.arc(0, 0, 24, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a066d6';
  ctx.lineWidth = 4;
  for (let i = -15; i <= 15; i += 10) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.quadraticCurveTo(i + Math.sin(t / 6 + i) * 6, 14, i, 28);
    ctx.stroke();
  }
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(-8, -8, 3, 0, 7); ctx.arc(8, -8, 3, 0, 7); ctx.fill();
  ctx.restore();
}

// ---------- Spiel 2: Blasen-Platzen ----------
function startBubbles() {
  const { canvas, ctx, toLocal } = canvasSetup();
  const FILL = ['🐠', '🐙', '🦀', '🐚', '⭐', '🐬', '🐢', ''];
  let bubbles = [];
  let bursts = [];
  let t = 0, spawn = 0;

  canvas.onpointerdown = e => {
    e.preventDefault();
    const p = toLocal(e);
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      if (Math.hypot(p.x - b.x, p.y - b.y) < b.r + 8) {
        setArcadeScore(arcade.score + (b.gold ? 5 : 1));
        bursts.push({ x: b.x, y: b.y, r: b.r, life: 20, gold: b.gold });
        bubbles.splice(i, 1);
        break;
      }
    }
  };

  startCountdown(() => endArcade('Plopp, plopp, plopp! 🫧'));

  loop(dt => {
    t += dt;
    spawn -= dt;
    if (spawn <= 0) {
      spawn = Math.max(12, 35 - t / 60);
      const r = 26 + Math.random() * 22;
      bubbles.push({
        x: r + Math.random() * (W - 2 * r), y: H + r, r,
        vy: 1.6 + Math.random() * 1.2 + t / 900,
        phase: Math.random() * 6,
        gold: Math.random() < 0.08,
        fill: FILL[Math.floor(Math.random() * FILL.length)]
      });
    }
    bubbles.forEach(b => { b.y -= b.vy * dt; b.phase += 0.05 * dt; });
    bubbles = bubbles.filter(b => b.y > -b.r);

    const sea = ctx.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#6DCFF6'); sea.addColorStop(1, '#2a6fb0');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    drawEmoji(ctx, '🪸', 60, H - 30, 60);
    drawEmoji(ctx, '🌿', 420, H - 34, 56);

    bubbles.forEach(b => {
      const x = b.x + Math.sin(b.phase) * 10;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.gold ? 'rgba(255,211,107,0.75)' : 'rgba(255,255,255,0.28)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = b.gold ? '#f5b800' : 'rgba(255,255,255,0.85)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
      if (b.fill) drawEmoji(ctx, b.fill, x, b.y + 2, b.r);
      b.drawX = x;
    });

    bursts = bursts.filter(p => {
      p.life -= dt;
      ctx.strokeStyle = p.gold ? `rgba(245,184,0,${p.life / 20})` : `rgba(255,255,255,${p.life / 20})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + (20 - p.life) * 2, 0, Math.PI * 2);
      ctx.stroke();
      return p.life > 0;
    });
  });
}

// ---------- Spiel 3: Meeres-Memory ----------
function startMemory() {
  const EMOJIS = ['🐬', '🐳', '🐙', '🐠', '🦀', '🐚', '⭐', '🐢'];
  const cards = shuffle([...EMOJIS, ...EMOJIS]);
  const grid = document.getElementById('memory-grid');
  grid.innerHTML = '';
  let open = [], found = 0, moves = 0, seconds = 0, locked = false;
  const timeEl = document.getElementById('arcade-time');
  timeEl.textContent = 0;
  arcade.timers.push(setInterval(() => { seconds++; timeEl.textContent = seconds; }, 1000));

  cards.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'memory-card';
    btn.onclick = () => {
      if (locked || btn.classList.contains('open') || btn.classList.contains('done')) return;
      btn.classList.add('open');
      btn.textContent = emoji;
      open.push(btn);
      if (open.length < 2) return;
      moves++;
      const [a, b] = open;
      open = [];
      if (a.textContent === b.textContent) {
        a.classList.add('done'); b.classList.add('done');
        found++;
        if (found === EMOJIS.length) {
          setArcadeScore(Math.max(10, 120 - moves * 3 - seconds));
          setTimeout(() => endArcade(`Alle Paare in ${moves} Zügen und ${seconds} Sekunden gefunden! 🧠`), 400);
        }
      } else {
        locked = true;
        setTimeout(() => {
          [a, b].forEach(c => { c.classList.remove('open'); c.textContent = ''; });
          locked = false;
        }, 800);
      }
    };
    grid.appendChild(btn);
  });
}
