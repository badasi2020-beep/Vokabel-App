// ===================== Foto vom Vokabelheft =====================
// Zwei Wege:
//  1. Mit Claude-API-Schlüssel (⚙️): Claude liest das Foto, auch Handschrift.
//  2. Ohne Schlüssel: Tesseract.js erkennt den Text direkt im Browser (gut bei Druckschrift).

const CLAUDE_MODEL = 'claude-opus-5-5';
const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
const ANTHROPIC_SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm';
const TESSERACT_LANGS = {
  'Deutsch': 'deu', 'Englisch': 'eng', 'Französisch': 'fra',
  'Spanisch': 'spa', 'Italienisch': 'ita', 'Latein': 'lat'
};

let scanRun = 0; // erhöht sich bei jedem neuen Foto oder Abbrechen, damit alte Ergebnisse ignoriert werden

['photo-camera', 'photo-file'].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    input.value = ''; // damit dasselbe Bild nochmal gewählt werden kann
    if (file) handlePhoto(file);
  });
});

async function handlePhoto(file) {
  const run = ++scanRun;
  showScreen('scan-review');
  const preview = document.getElementById('scan-preview');
  preview.src = URL.createObjectURL(file);
  document.getElementById('scan-result').classList.add('hidden');
  const status = document.getElementById('scan-progress');
  status.textContent = 'Foto wird vorbereitet …';

  const fromLang = document.getElementById('lang-from').value;
  const toLang = document.getElementById('lang-to').value;

  try {
    const canvas = await loadImageToCanvas(file, settings.apiKey ? 1568 : 2400);
    let lines;
    if (settings.apiKey) {
      status.textContent = '🤖 Claude liest dein Vokabelheft …';
      const pairs = await aiReadPhoto(canvas, fromLang, toLang);
      lines = pairs.map(p => p.to ? `${p.from} = ${p.to}` : p.from);
    } else {
      status.textContent = '🔍 Texterkennung wird geladen …';
      lines = await ocrPhoto(canvas, fromLang, toLang, pct => {
        if (run === scanRun) status.textContent = `🔍 Text wird erkannt … ${pct}%`;
      });
    }
    if (run !== scanRun) return;
    if (!lines.length) {
      status.textContent = '😕 Auf dem Foto wurden keine Vokabeln gefunden. Versuch es mit einem helleren, geraderen Foto.';
      return;
    }
    status.textContent = `✨ ${lines.length} Zeilen erkannt!`;
    document.getElementById('scan-text').value = lines.join('\n');
    document.getElementById('scan-result').classList.remove('hidden');
  } catch (e) {
    console.error(e);
    if (run !== scanRun) return;
    status.textContent = '😕 Das hat nicht geklappt: ' + (e.message || e) +
      (navigator.onLine === false ? ' (Keine Internetverbindung?)' : '');
  }
}

function acceptScan(append) {
  const scanned = document.getElementById('scan-text').value.trim();
  const input = document.getElementById('vocab-input');
  if (scanned) {
    const current = input.value.trim();
    input.value = append && current ? current + '\n' + scanned : scanned;
    saveDraft();
  }
  scanRun++;
  showScreen('setup');
}

function cancelScan() {
  scanRun++;
  showScreen('setup');
}

function loadImageToCanvas(file, maxSide) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Das Bild konnte nicht geöffnet werden.'));
    img.src = URL.createObjectURL(file);
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Die Texterkennung konnte nicht geladen werden.'));
    document.head.appendChild(s);
  });
}

// ---------- Ohne Schlüssel: Tesseract ----------
async function ocrPhoto(canvas, fromLang, toLang, onProgress) {
  if (!window.Tesseract) await loadScript(TESSERACT_URL);
  const langs = [...new Set([TESSERACT_LANGS[fromLang], TESSERACT_LANGS[toLang]])].filter(Boolean).join('+');
  const result = await Tesseract.recognize(canvas, langs || 'deu+eng', {
    logger: m => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
    }
  });
  return wordsToVocabLines(result.data.words || []);
}

// Sortiert die erkannten Wörter in Zeilen und trennt jede Zeile an der größten Lücke.
// So klappt es auch, wenn die Spalten im Heft weit auseinander stehen.
function wordsToVocabLines(words) {
  const clean = words
    .filter(w => w.confidence >= 30 && (/[\p{L}]/u.test(w.text) || /^[=–—-]$/.test(w.text.trim())))
    .map(w => ({
      text: w.text.trim(),
      x0: w.bbox.x0, x1: w.bbox.x1,
      yc: (w.bbox.y0 + w.bbox.y1) / 2,
      h: w.bbox.y1 - w.bbox.y0
    }))
    .sort((a, b) => a.yc - b.yc);
  if (!clean.length) return [];

  const medianH = clean.map(w => w.h).sort((a, b) => a - b)[Math.floor(clean.length / 2)];
  const rows = [];
  clean.forEach(w => {
    const row = rows[rows.length - 1];
    if (row && Math.abs(w.yc - row.yc) < medianH * 0.6) {
      row.words.push(w);
      row.yc = row.words.reduce((s, x) => s + x.yc, 0) / row.words.length;
    } else {
      rows.push({ yc: w.yc, words: [w] });
    }
  });

  return rows.map(row => {
    const ws = row.words.sort((a, b) => a.x0 - b.x0);
    const text = ws.map(w => w.text).join(' ');
    // Steht schon ein Trennzeichen drin (=, –, ;), nimmt der normale Parser das
    if (/=|\s[–—-]\s|;/.test(text)) {
      const p = splitLine(text);
      if (p && p.to) return `${p.from} = ${p.to}`;
    }
    let bestGap = 0, bestIdx = -1;
    for (let i = 1; i < ws.length; i++) {
      const gap = ws[i].x0 - ws[i - 1].x1;
      if (gap > bestGap) { bestGap = gap; bestIdx = i; }
    }
    if (bestIdx > 0 && bestGap > medianH * 1.5) {
      const from = ws.slice(0, bestIdx).map(w => w.text).join(' ');
      const to = ws.slice(bestIdx).map(w => w.text).join(' ');
      return `${from} = ${to}`.replace(/[|]/g, '').trim();
    }
    return text.replace(/[|]/g, '').trim();
  }).filter(Boolean);
}

// ---------- Mit Schlüssel: Claude ----------
let claudeClient = null;
let claudeClientKey = '';

async function getClaude() {
  if (!settings.apiKey) throw new Error('Kein Claude-Schlüssel eingetragen (⚙️).');
  if (!claudeClient || claudeClientKey !== settings.apiKey) {
    const { default: Anthropic } = await import(ANTHROPIC_SDK_URL);
    // Der Schlüssel liegt nur im Browser dieses Geräts; die App hat keinen eigenen Server.
    claudeClient = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
    claudeClientKey = settings.apiKey;
  }
  return claudeClient;
}

const PAIRS_SCHEMA = {
  type: 'object',
  properties: {
    pairs: {
      type: 'array',
      items: {
        type: 'object',
        properties: { from: { type: 'string' }, to: { type: 'string' } },
        required: ['from', 'to'],
        additionalProperties: false
      }
    }
  },
  required: ['pairs'],
  additionalProperties: false
};

async function askClaudeForPairs(content) {
  const client = await getClaude();
  let response;
  try {
    response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: PAIRS_SCHEMA } },
      messages: [{ role: 'user', content }]
    });
  } catch (e) {
    if (e.status === 401) throw new Error('Der Claude-Schlüssel stimmt nicht (⚙️ prüfen).');
    if (e.status === 429) throw new Error('Gerade zu viele Anfragen. Bitte gleich nochmal versuchen.');
    throw new Error(e.message || 'Claude ist gerade nicht erreichbar.');
  }
  if (response.stop_reason === 'refusal') throw new Error('Claude konnte dieses Bild nicht bearbeiten.');
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const data = JSON.parse(text);
  return (data.pairs || [])
    .map(p => ({ from: String(p.from || '').trim(), to: String(p.to || '').trim() }))
    .filter(p => p.from);
}

async function aiReadPhoto(canvas, fromLang, toLang) {
  const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  return askClaudeForPairs([
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
    {
      type: 'text',
      text: `Das Foto zeigt eine Seite aus dem Vokabelheft eines Schulkinds (${fromLang} und ${toLang}).
Schreib jede Vokabel als Paar ab: "from" ist das Wort auf ${fromLang}, "to" die Übersetzung auf ${toLang}, egal in welcher Spalte sie stehen.
- Übernimm die Wörter genau so, wie sie im Heft stehen, inklusive Artikel (der/die/das, the, le/la …) und Zusätzen wie "to" bei Verben.
- Stehen mehrere Übersetzungen da, trenne sie mit " / ".
- Lass Überschriften, Seitenzahlen, Datum und Beispielsätze weg.
- Fehlt zu einem Wort die Übersetzung, ergänze sie selbst.
- Ist ein Wort unleserlich, lass das Paar weg statt zu raten.`
    }
  ]);
}

async function aiTranslate(words, fromLang, toLang) {
  return askClaudeForPairs([{
    type: 'text',
    text: `Übersetze diese Vokabeln für ein Schulkind von ${fromLang} nach ${toLang}.
Gib für jedes Wort genau ein Paar zurück: "from" ist das Wort genau wie unten geschrieben, "to" die übliche Schulbuch-Übersetzung
(bei Nomen mit Artikel, bei englischen Verben mit "to"). Gibt es zwei gleich übliche Übersetzungen, trenne sie mit " / ".

${words.map(w => '- ' + w).join('\n')}`
  }]);
}
