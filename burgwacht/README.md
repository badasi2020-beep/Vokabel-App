# Burgwacht

Ein Fantasy-Tower-Defense fürs iPhone, gebaut als Web-App, die ohne App Store läuft.
Im Querformat spielen; nach „Zum Home-Bildschirm“ läuft das Spiel im Vollbild und offline.

## Spielprinzip

Gegner laufen eine feste Straße entlang zur Burg. Auf den Bauplätzen neben der Straße baust du Türme.
Jeder Gegner, der die Burg erreicht, kostet Leben. Bei 0 Leben ist das Level verloren.

- **Turm bauen:** Bauplatz antippen → Turm antippen (zeigt Infos und Reichweite) → nochmal antippen zum Bauen.
- **Ausbauen, Zielwahl, Verkaufen:** Turm antippen.
- **⚔ an der Straße:** ruft die nächste Welle. Wer früh ruft, bekommt Bonusgold.
- **1× / 2× / 3×:** Spielgeschwindigkeit.

### Türme

| Turm | Stärke | Spezialisierungen (Stufe 4) |
|---|---|---|
| Bogenschützen | schnell, trifft Flieger | Langbogen (Reichweite, Krits) · Armbrust-Salve (2 Ziele) |
| Magierturm | Magie ignoriert Rüstung | Feuermagier (Fläche + Brand) · Sturmmagier (Kettenblitz) |
| Bombarde | Flächenschaden, nur Boden | Großmörser · Teerwerfer (verlangsamt) |
| Frostturm | verlangsamt | Gletscher (Einfrieren) · Eissplitter (+25 % Schaden auf Ziele) |

Die Bombarde wird nach Level 1 freigeschaltet, der Frostturm nach Level 2 und die Spezialisierungen nach Level 3.

### Gegner

Goblin, Ork, Warg (schnell), Troll (gepanzert), Schamane (heilt), Fledermaus und Wyvern (fliegen),
Ork-Kriegsherr (Boss) und der Uralte Drache (Endboss).

### Sterne und Schmiede

Bis zu 3 Sterne pro Level, je nachdem, wie viele Leben verloren gingen. Auf **Schwer** gibt es zusätzlich eine Krone (+1 Stern).
In der **Schmiede** werden Sterne in dauerhafte Verbesserungen investiert (Startgold, Leben, Turmschaden, Baukosten, Verkaufswert).
„Zurücksetzen“ gibt alle Sterne zurück.

## Aufs iPhone bringen (GitHub Pages)

1. Auf GitHub im Repository: **Settings → Pages** → Source *Deploy from a branch*, Branch `main`, Ordner `/ (root)`, **Save**.
2. Nach 1–2 Minuten ist das Spiel erreichbar unter `https://<benutzername>.github.io/<repository>/burgwacht/`
3. Auf dem iPhone in **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**.

## Technik

Eine einzige Datei `index.html` ohne Abhängigkeiten. Grafik und Sound werden im Browser erzeugt (Canvas, Web Audio).
Der Spielstand liegt im Browser (localStorage). `sw.js` speichert das Spiel für den Offline-Betrieb.

Die Spielregeln stehen im Block `<script id="core">` (Türme, Gegner, Level, Wellen) und kommen ohne DOM aus.
Wellen-Schreibweise: `o12,w10+4,g15+6@1` = 12 Orks, nach 4 s 10 Warge, nach 6 s 15 Goblins auf Pfad 2.
Buchstaben: g Goblin, o Ork, w Warg, t Troll, s Schamane, b Fledermaus, y Wyvern, K Kriegsherr, D Drache.
