# Design – Domänen-Rechtekonzept

Version 1.0 · Stand 01.10.2026 · Verantwortlich: Designer · Grundlage: `docs/PROJEKTPLAN.md`
Ziel: ruhiges, dichtes Admin-Werkzeug. Alle Maße in `rem` (1 rem = 16 px). Umsetzung in `css/style.css`.

## 1. Farb-Tokens (WCAG 2.2 AA geprüft: Text ≥ 4,5:1, Rahmen/Fokus ≥ 3:1)

```css
:root {
  color-scheme: light;
  --bg:#f5f6f8; --surface:#ffffff; --surface-2:#eef0f3; --text:#1a1f29; --text-muted:#4b5563;
  --border:#d5d9e0;            /* dekorativ (Karten, Tabellenlinien) */
  --border-input:#7b8494;      /* Eingabefelder, 3,6:1 auf --surface */
  --primary:#1d4ed8; --primary-hover:#1e40af; --on-primary:#ffffff;
  --danger:#b91c1c;  --danger-hover:#991b1b;  --on-danger:#ffffff;
  --success:#166534; --warning:#92400e; --info:#1d4ed8; /* V-01: statt #15803d, ≥ 4,5:1 auf --success-bg */
  --success-bg:#e7f6ec; --warning-bg:#fdf3e1; --danger-bg:#fdecec; --info-bg:#e8effd;
  --focus:#1d4ed8; --focus-halo:#ffffff;
  /* Berechtigungsstufen (Hintergrund / Text) */
  --lvl-none-bg:#eef0f3; --lvl-none-fg:#4b5563;
  --lvl-r-bg:#dbeafe;    --lvl-r-fg:#1e3a8a;
  --lvl-m-bg:#fef3c7;    --lvl-m-fg:#78350f;
  --lvl-f-bg:#fee2e2;    --lvl-f-fg:#7f1d1d;
  --shadow:0 1px 2px rgb(0 0 0 / .06), 0 2px 8px rgb(0 0 0 / .06);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* = Dunkel-Block */ } }
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg:#0f141b; --surface:#171d26; --surface-2:#1f2733; --text:#e6e9ef; --text-muted:#a7b0be;
  --border:#2e3745; --border-input:#6b7687;
  --primary:#7aaeff; --primary-hover:#a3c6ff; --on-primary:#0b1220;
  --danger:#f87171;  --danger-hover:#fca5a5;  --on-danger:#1a0b0b;
  --success:#4ade80; --warning:#fbbf24; --info:#7aaeff;
  --success-bg:#12291b; --warning-bg:#2d2310; --danger-bg:#2e1414; --info-bg:#14213a;
  --focus:#a3c6ff; --focus-halo:#0f141b;
  --lvl-none-bg:#262f3c; --lvl-none-fg:#c3cad5;
  --lvl-r-bg:#1e3a8a;    --lvl-r-fg:#dbeafe;
  --lvl-m-bg:#713f12;    --lvl-m-fg:#fef3c7;
  --lvl-f-bg:#7f1d1d;    --lvl-f-fg:#fee2e2;
  --shadow:none;
}
```
Dunkel-Werte im `prefers-color-scheme`-Block identisch duplizieren. Theme-Schalter setzt `data-theme` auf `<html>`
(`light`/`dark`; ohne Attribut = System) und speichert die Wahl im `localStorage`. `body { background:var(--bg); color:var(--text); }`.

## 2. Typografie, Abstände, Radien

```css
--font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
--font-mono:ui-monospace,"Cascadia Mono",Consolas,"Liberation Mono",monospace;
--fs-xs:.75rem; --fs-sm:.875rem; --fs-base:1rem; --fs-lg:1.125rem; --fs-xl:1.375rem; --fs-2xl:1.75rem;
--lh:1.5; --lh-tight:1.25;  /* Gewichte: 400 Text, 600 Labels/Überschriften/Buttons */
--sp-1:.25rem; --sp-2:.5rem; --sp-3:.75rem; --sp-4:1rem; --sp-5:1.5rem; --sp-6:2rem; --sp-7:3rem;
--r-sm:4px; --r-md:6px; --r-lg:10px; --r-full:999px;
--control-h:2.5rem;  /* 40 px; Touch-Ziele mind. 24×24 px (WCAG 2.5.8), Buttons/Felder 40 px */
```
Gruppennamen, Kürzel, Pfade, Anmeldenamen immer in `--font-mono` (`<code>`). H1 `--fs-xl`, H2 `--fs-lg`, Fließtext `--fs-base`,
Tabellen/Hilfetexte `--fs-sm`. Maximale Lesebreite Formulare `48rem`.

## 3. Layout

```
┌ Kopfzeile (sticky, 56 px) ─ App-Titel · Speicherstatus · [Theme] [Menü ⋯] ─────────┐
├ Schritt-Navigation (Seitenleiste 15rem | mobil: horizontale Leiste) ──────────────┤
│ 1 Stammdaten  2 Rollen  3 Benutzer  4 Ressourcen  5 Matrix  6 Gruppen  7 Dokument & Export │
├ Inhalt (main, max-width 72rem, padding --sp-5) ───────────────────────────────────┤
│ H1 Schritttitel · Einleitung (1 Satz) · Karten/Formulare/Tabellen                  │
│ Fußleiste des Schritts: [← Zurück]                              [Weiter: <Schritt> →] │
└────────────────────────────────────────────────────────────────────────────────────┘
```
- **Grid:** `body` → `grid-template-columns:15rem 1fr` ab `min-width:64rem`; darunter einspaltig.
- **Kopfzeile:** `position:sticky; top:0; z-index:10; background:var(--surface); border-bottom:1px solid var(--border)`.
  Speicherstatus als Text („Gespeichert“ / „Speichern nicht möglich“), `aria-live="polite"`. Menü „⋯“ enthält
  Beispieldaten laden, JSON importieren/exportieren, Alles zurücksetzen.
- **Schritt-Navigation:** `<nav aria-label="Schritte"><ol>` mit Links/Buttons; aktiver Schritt `aria-current="step"`,
  linker Balken 3 px `--primary`, Text `--primary`, 600. Jeder Eintrag: Nummernkreis (24 px, `--r-full`) + Name +
  optional Zähler-Badge (z. B. „4“ Rollen) bzw. Warn-Badge „!“ bei Fehlern (mit `aria-label="Fehler vorhanden"`).
- **Mobil (< 64rem):** Navigation als horizontale, scrollbare Leiste unter der Kopfzeile (`overflow-x:auto;
  scroll-snap-type:x mandatory`), nur Nummer + Kurzname; aktiver Eintrag wird per `scrollIntoView({inline:"center"})` sichtbar.
  Ab 360 px: `padding-inline:var(--sp-4)`, Formularfelder 100 % breit, Tabellen in `.table-wrap{overflow-x:auto}`.
  `html,body{overflow-x:hidden}` ist verboten – horizontales Scrollen nur innerhalb `.table-wrap` (AK-12/28).
- **Schritte:** 1 Formular in Karten „Unternehmen“, „Verantwortung“, „Dokument“. 2–4 je: Karte „Neu anlegen“ (Formular)
  + Tabelle der Einträge (Bearbeiten inline in der Formularkarte). 5 Matrix + Legende. 6 zwei Abschnitte GG / DL als Tabellen.
  7 Aktionsleiste (Drucken/PDF, Markdown, JSON) + Dokumentvorschau auf `--surface`, Papieroptik (max. 52rem, `--shadow`).

## 4. Komponenten

**Buttons** (`.btn`, Höhe `--control-h`, `padding:0 var(--sp-4)`, `--r-md`, 600, `--fs-sm`, Icon optional links, Gap `--sp-2`)

| Variante | Normal | Hover | Aktiv | Deaktiviert |
|---|---|---|---|---|
| `.btn-primary` | bg `--primary`, Text `--on-primary` | bg `--primary-hover` | `transform:translateY(1px)` | `opacity:.5; cursor:not-allowed` + `disabled` |
| `.btn-secondary` | bg `--surface`, Rand 1px `--border-input`, Text `--text` | bg `--surface-2` | wie oben | wie oben |
| `.btn-danger` | bg `--danger`, Text `--on-danger` | bg `--danger-hover` | wie oben | wie oben |
| `.btn-ghost` (Tabellenaktionen) | transparent, Text `--primary` | bg `--surface-2` | wie oben | wie oben |

Pro Bereich höchstens ein Primär-Button. Löschen in Tabellen als `.btn-ghost` mit Text „Löschen“ (Farbe `--danger`);
die Bestätigung erfolgt im `<dialog>` mit `.btn-danger`. Icon-only-Buttons brauchen `aria-label`.

**Eingabefelder** (`input`, `select`, `textarea`): Höhe `--control-h`, `padding:0 var(--sp-3)`, Rand 1px `--border-input`,
`--r-md`, bg `--surface`. Label immer sichtbar darüber (`<label for>`, 600, `--fs-sm`, Abstand `--sp-1`); Pflichtfeld:
„*“ + `aria-required="true"` + Hinweis „* Pflichtfeld“ oben im Formular. Hilfetext darunter (`--fs-xs`, `--text-muted`,
per `aria-describedby`). Zustände: Hover Rand `--text-muted`; Fokus siehe §5; Fehler Rand 2px `--danger`, `aria-invalid="true"`,
Fehlertext darunter mit Präfix „Fehler:“ in `--danger`; deaktiviert bg `--surface-2`. Live-Vorschau des Gruppennamens
rechts/unter dem Kürzelfeld: „Gruppe: `GG_VERTRIEB`“ (`aria-live="polite"`).

**Tabellen:** `width:100%; border-collapse:collapse; font-size:--fs-sm`. Kopf bg `--surface-2`, 600, `position:sticky; top:0`.
Zellen `padding:var(--sp-2) var(--sp-3)`, Zeilenlinie 1px `--border`, Hover-Zeile bg `--surface-2`. Zahlen rechtsbündig.
Jede Tabelle hat `<caption>` (sichtbar oder `.sr-only`) und `scope` an `<th>`. Fehlerzeile (doppeltes Kürzel): linker
Rand 3px `--danger` + Badge „Doppelt“. Benutzer ohne Rolle: Badge „Ohne Rolle“ (Warnung).

**Berechtigungsmatrix** (Schritt 5): Zeilen = Rollen (`<th scope="row">`, sticky links, bg `--surface`), Spalten =
Ressourcen (`<th scope="col">` mit Name + Typ-Badge + Kürzel mono). Jede Zelle enthält ein `<select>` mit
`aria-label="<Rolle> – <Ressource>"` und Optionen „– Kein Zugriff“, „R Lesen“, „M Ändern“, „F Vollzugriff“.
Zellenfarbe per Klasse `.lvl-none/.lvl-r/.lvl-m/.lvl-f` (bg/fg aus §1) auf dem Select; der sichtbare Wert beginnt immer mit
dem Kürzel (AK-13). Mindestbreite Zelle 7.5rem; `.table-wrap` mit Schatten-Hinweis am rechten Rand, wenn scrollbar.
Legende oberhalb: vier Chips `– Kein Zugriff · R Lesen · M Ändern · F Vollzugriff` + Satz „Standard ist „Kein Zugriff“.“
Unter der Matrix: Zähler „12 Zuweisungen · 7 DL-Gruppen werden erzeugt“.

**Karten:** bg `--surface`, Rand 1px `--border`, `--r-lg`, `padding:var(--sp-5)` (mobil `--sp-4`), `--shadow`,
Abstand untereinander `--sp-5`. Kopf: H2 + optionale Aktion rechts.

**Badges:** inline-flex, Höhe 1.375rem, `padding:0 var(--sp-2)`, `--r-full`, `--fs-xs`, 600. Varianten: neutral
(`--surface-2`/`--text-muted`), Typ (Ordner/Drucker/Anwendung, neutral mit Textlabel), GG (`--info-bg`/`--info`), DL
(`--success-bg`/`--success`), Warnung (`--warning-bg`/`--warning`), Fehler (`--danger-bg`/`--danger`). Badges tragen immer Text.

**Leerzustände:** zentriert in Karte, `padding:var(--sp-6)`, Titel 600, ein erklärender Satz `--text-muted`, ein
Primär-Button mit nächster Aktion. Im Dokument nur der Text „Keine Einträge erfasst“ (kursiv, `--text-muted`).

**Hinweise (inline):** Box mit Rand links 4px + Hintergrund (`--info-bg`/`--warning-bg`/`--danger-bg`/`--success-bg`),
`--r-md`, `padding:var(--sp-3) var(--sp-4)`, Titel fett mit Präfix „Hinweis:“/„Warnung:“/„Fehler:“. Pflichtfeldfehler
(AK-02) und Duplikatwarnungen als Hinweis oben im Schritt mit `role="alert"`.
**Toasts:** unten rechts (mobil unten, volle Breite minus `--sp-4`), max. 24rem, bg `--text`, Text `--bg`, `--r-md`,
Container `role="status" aria-live="polite"`; Fehler-Toast `role="alert"`. Ausblenden nach 5 s, bei Fehlern erst per
„Schließen“; bei Hover/Fokus pausieren. Max. 3 gleichzeitig.
**Dialoge:** natives `<dialog>` (`showModal()`), max. 28rem, `--r-lg`; Fokus initial auf „Abbrechen“; Esc schließt.

## 5. Fokus und Tastatur

- Fokus global: `:focus-visible { outline:3px solid var(--focus); outline-offset:2px; box-shadow:0 0 0 5px var(--focus-halo); }`.
  `outline:none` ohne Ersatz ist verboten. In Matrixzellen `outline-offset:-3px` (kein Abschneiden durch Scrollcontainer).
- Erstes Element im `body`: Skip-Link „Zum Inhalt springen“ (`.sr-only`, bei Fokus sichtbar oben links) → `#main`.
- Tab-Reihenfolge = visuelle Reihenfolge; kein positives `tabindex`. Schrittwechsel setzt Fokus auf die H1 (`tabindex="-1"`)
  und aktualisiert `document.title` („Rollen – Domänen-Rechtekonzept“).
- Matrix: Tab bewegt zeilenweise durch die Selects; Stufenwahl über native Select-Bedienung (Pfeil hoch/runter,
  Tippen von `R`/`M`/`F`/`-` springt per Optionstext). Keine eigene Tastaturlogik nötig. Fokussierte Zelle wird per
  `scrollIntoView({block:"nearest",inline:"nearest"})` sichtbar.
- Enter in Formularen = „Speichern“; Esc bricht Bearbeiten ab. Nach Löschen Fokus auf die nächste Zeile bzw. den Leerzustand-Button.
- `prefers-reduced-motion: reduce` → alle Transitionen `0s`. Standard-Transition: `120ms ease-out` auf Farbe/Hintergrund.
- `.sr-only` Hilfsklasse (Standard-Clip-Muster) für Captions, Statusmeldungen.

## 6. Druckstylesheet (`@media print`, AK-18)

```css
@page { size:A4; margin:18mm 16mm 20mm; }
@media print {
  :root { color-scheme:light; /* alle Tokens auf Hell-Werte zwingen */ }
  body > header, body > nav, .no-print, .btn, .toast-region, dialog, .doc-actions { display:none !important; }
  body { display:block; background:#fff; color:#000; font:10.5pt/1.45 var(--font); }
  main, .doc { max-width:none; padding:0; box-shadow:none; border:0; }
  .doc-cover { min-height:240mm; display:flex; flex-direction:column; justify-content:center; break-after:page; }
  .doc h2 { break-before:page; font-size:15pt; }   /* jedes Hauptkapitel 1–12 */
  .doc h2, .doc h3 { break-after:avoid; }
  table { font-size:9pt; border:1px solid #666; } th, td { border:1px solid #999; padding:3pt 5pt; }
  thead { display:table-header-group; } tr, .doc-signature { break-inside:avoid; }
  .table-wrap { overflow:visible; }
  .lvl-r, .lvl-m, .lvl-f, .lvl-none { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  a { color:#000; text-decoration:none; }
}
```
- Dokumentaufbau: Deckblatt (Firmenname 24pt, „Berechtigungskonzept Active Directory“, Domäne, Version, Datum,
  Verantwortlicher, Ersteller), danach Kapitel 1–12 gemäß AK-16 mit Nummerierung „1 Ziele“ usw.
- Matrix im Druck: Zellen zeigen Kürzel + Wort („R Lesen“), Farbe nur zusätzlich; ab > 6 Ressourcen Abschnitt in
  `@page matrix { size:A4 landscape; }` (`.doc-matrix { page:matrix; }`).
- Unterschriftenzeilen (Kap. 12): drei Spalten „Erstellt“, „Geprüft“, „Freigegeben“, je Linie 1px 50mm, darunter „Datum, Unterschrift“.
- Keine laufende Kopf-/Fußzeile (Browser-Druck unterstützt sie nicht zuverlässig); Firmenname und Version nur auf dem Deckblatt.

## 7. Mikrotexte (verbindlich)

| Kontext | Text |
|---|---|
| Navigation | „Zurück“, „Weiter: Rollen“ … „Weiter: Dokument & Export“ |
| Formular | „Hinzufügen“, „Änderungen speichern“, „Abbrechen“, „Bearbeiten“, „Löschen“, „* Pflichtfeld“ |
| Löschdialog | Titel „Rolle „Vertrieb“ löschen?“ · Text „Betroffene Benutzer werden als „ohne Rolle“ markiert.“ · „Endgültig löschen“ / „Abbrechen“ |
| Menü | „Beispieldaten laden“, „JSON importieren“, „JSON exportieren“, „Alles zurücksetzen“, „Darstellung: System/Hell/Dunkel“ |
| Beispieldaten-Dialog | „Beispieldaten laden? Alle aktuellen Eingaben werden ersetzt.“ · „Beispieldaten laden“ / „Abbrechen“ |
| Zurücksetzen-Dialog | „Alle Daten löschen? Dies kann nicht rückgängig gemacht werden.“ · „Alles löschen“ / „Abbrechen“ |
| Export (Schritt 7) | „Drucken / PDF“, „Markdown exportieren“, „JSON exportieren“ |
| Leer: Rollen | „Noch keine Rollen angelegt.“ – „Lege Abteilungen oder Funktionen an, z. B. Vertrieb oder Buchhaltung.“ – „Erste Rolle anlegen“ |
| Leer: Benutzer | „Noch keine Benutzer angelegt.“ – „Benutzer brauchen eine Rolle. Lege zuerst Rollen an.“ – „Ersten Benutzer anlegen“ |
| Leer: Ressourcen | „Noch keine Ressourcen erfasst.“ – „Erfasse Freigaben, Drucker und Anwendungen.“ – „Erste Ressource anlegen“ |
| Leer: Matrix | „Die Matrix braucht mindestens eine Rolle und eine Ressource.“ – „Zu Rollen“ / „Zu Ressourcen“ |
| Leer: Gruppen | „Noch keine Gruppen abgeleitet. Vergib in der Matrix mindestens eine Berechtigung.“ – „Zur Matrix“ |
| Pflichtfeld (AK-02) | „Fehler: Firmenname und AD-Domäne sind Pflichtfelder.“ |
| Domäne (AK-03) | „Fehler: Bitte einen FQDN angeben, z. B. firma.local (nur a–z, 0–9, Bindestrich, Punkt).“ |
| Duplikat (AK-06) | „Fehler: Das Kürzel „VERTRIEB“ wird bereits verwendet.“ |
| Toasts | „Gespeichert“, „Beispieldaten geladen“, „JSON importiert“, „Export erstellt“, „Alle Daten gelöscht“ |
| Importfehler (AK-21) | „Import fehlgeschlagen: Die Datei ist kein gültiges Rechtekonzept (schemaVersion 1). Deine Daten wurden nicht verändert.“ |
| Speicher (AK-22) | „Hinweis: Lokales Speichern ist nicht verfügbar. Sichere deine Daten per JSON-Export.“ |
