# Haushalt – Patchwork-Finanz-App (Prototyp V1)

Einfache Web-App für den Familienhaushalt: Einnahmen, Fixkosten, Ausgaben und eine
neutrale Auswertung „Für wen?“ (Haushalt, Kinder, Erwachsene).

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst der Seite |
| `style.css` | Aussehen (Farben stehen ganz oben als Variablen) |
| `app.js` | Die ganze Logik |
| `manifest.json`, `icon*` | Damit die App als Symbol auf dem Home-Bildschirm liegt |

## Wo liegen die Daten?

Nur im Browser des jeweiligen Handys (localStorage), **nicht** auf einem Server und **nicht** im Repository.
Zwischen zwei Handys gleicht ihr über **Mehr → Daten senden / Daten übernehmen** ab.
Jeder Eintrag wird dabei nur einmal übernommen, Löschungen werden mit übertragen.

## Aufs Handy bringen (GitHub Pages)

1. Auf GitHub im Repository: **Settings → Pages**.
2. Unter „Build and deployment“: Source = *Deploy from a branch*, Branch auswählen, Ordner `/ (root)`, **Save**.
3. Nach 1–2 Minuten ist die App erreichbar unter
   `https://<benutzername>.github.io/<repository>/haushalt/`
4. Auf dem Handy öffnen und **„Zum Home-Bildschirm hinzufügen“** wählen
   (iPhone: Teilen-Symbol, Android: Menü ⋮). Das ist wichtig, damit der Browser die Daten nicht nach einiger Zeit aufräumt.

## Lokal ausprobieren

`index.html` im Browser öffnen genügt.
