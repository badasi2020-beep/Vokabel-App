# 🐬 Lottes Delfin-Schule

Vokabel-Trainer für Kinder: Vokabeln eintippen oder aus dem Vokabelheft fotografieren, abfragen lassen
und mit richtigen Antworten Spiel-Tickets für kleine Belohnungs-Spiele sammeln.

## Funktionen

- **Vokabeln eingeben**: eine pro Zeile, z. B. `Haus = house`, `Haus, house`, `Haus – house` oder mit Tab getrennt.
  Mehrere richtige Antworten mit `/`: `gehen = to go / to walk`. Optionale Teile in Klammern: `(sich) freuen`.
- **📷 Vokabelheft fotografieren**: Foto machen oder Bild wählen. Die erkannten Vokabeln kann man vor dem Übernehmen kontrollieren und verbessern.
  - *Ohne Schlüssel*: Texterkennung (Tesseract.js) direkt im Browser, kostenlos. Gut bei Druckschrift, schwach bei Handschrift.
  - *Mit Claude-API-Schlüssel* (⚙️ Einstellungen): Claude liest auch Handschrift und übersetzt Wörter, bei denen die Übersetzung fehlt.
    Den Schlüssel gibt es auf console.anthropic.com. Ein Foto kostet ungefähr 1–3 Cent.
- **Abfrage**: „Antwort wählen“ oder „Eintippen“, Richtung links→rechts, rechts→links oder gemischt.
  Kleine Tippfehler werden verziehen, aber die richtige Schreibweise wird angezeigt. Am Ende kann man die falschen Wörter gezielt üben.
- **📚 Listen speichern**: z. B. eine Liste pro Unit.
- **🎟️ Belohnungs-Spiele**: Für jeweils 10 richtige Antworten (einstellbar) gibt es ein Spiel-Ticket.
  Jedes Spiel kostet ein Ticket: 🐬 Delfin-Sprung, 🫧 Blasen-Platzen, 🃏 Meeres-Memory. Die Spieldauer ist einstellbar.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst der Seite |
| `style.css` | Aussehen (Farben stehen ganz oben als Variablen) |
| `app.js` | Vokabeln, Abfrage, Listen, Tickets, Einstellungen |
| `scan.js` | Foto-Erkennung (Tesseract oder Claude) |
| `games.js` | Die Belohnungs-Spiele |
| `manifest.json`, `icon*` | Damit die App als Symbol auf dem Home-Bildschirm liegt |

## Wo liegen die Daten?

Nur im Browser des jeweiligen Geräts (localStorage): Vokabeln, Listen, Tickets, Rekorde und der optionale API-Schlüssel.
Für die Foto-Erkennung wird das Bild an Claude geschickt (mit Schlüssel); ohne Schlüssel verlässt es das Gerät nicht.

## Aufs Handy bringen (GitHub Pages)

1. Auf GitHub im Repository: **Settings → Pages**.
2. Source = *Deploy from a branch*, Branch `main`, Ordner `/ (root)`, **Save**.
3. Nach 1–2 Minuten ist die App erreichbar unter `https://<benutzername>.github.io/<repository>/`
4. Auf dem Handy öffnen und **„Zum Home-Bildschirm hinzufügen“** wählen.
