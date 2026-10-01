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

## 6. Druck-/PDF-Layout (`@media print`, AK-18)

Leitbild: seriöses IT-Konzeptdokument. Eine Akzentfarbe (Marineblau), sonst Graustufen; S/W-Druck bleibt eindeutig.
Ziel bei Beispieldaten: ca. 7–8 Seiten statt 14. Zielbrowser Chromium ≥ 131 (Margin-Boxen, `counter(pages)`).

**6.1 HTML-Struktur aus `renderDoc`** (`<article class="doc">`, Reihenfolge verbindlich)
```html
<section class="doc-cover">                       <!-- Seite 1, eigene @page cover -->
  <p class="cover-firma">Muster Logistik GmbH</p>
  <h1 class="cover-title">Berechtigungskonzept Active Directory</h1>
  <p class="cover-subtitle">Rollen, Gruppen und Zugriffsrechte der Domäne <code>muster-logistik.local</code></p>
  <dl class="cover-meta"><div><dt>Version</dt><dd>1.0</dd></div> … Datum, Verantwortlich, Ersteller, Status</dl>
  <p class="cover-class">Intern</p>                <!-- meta.klassifizierung: „Intern“ (Standard) | „Vertraulich“ -->
</section>
<section class="doc-control">                      <!-- Seite 2: Dokumentinformationen + Inhalt -->
  <h2 class="unnumbered">Dokumentinformationen</h2> <table class="doc-kv">…Stammdaten (2 Spalten)…</table>
  [<div class="hint hint-warning">…offene Punkte…</div>]   <!-- Warnungen hierhin, nie aufs Deckblatt -->
  <h2 class="unnumbered">Inhalt</h2>
  <nav class="doc-toc" aria-label="Inhaltsverzeichnis"><ol><li><a href="#kap-3"><span class="toc-nr">3</span>Grundsätze</a>
    <ol><li><a href="#kap-3-1"><span class="toc-nr">3.1</span>AGDLP</a></li></ol></li>…</ol></nav>
</section>
<section class="doc-chapter" id="kap-1"><h2><span class="nr">1</span>Ziele</h2>…</section>   <!-- je Kapitel 1–12 -->
```
- `h2`/`h3` bekommen IDs `kap-N` / `kap-N-M`; Nummer in `<span class="nr">`. Das TOC wird aus denselben Blöcken erzeugt
  (ohne Seitenzahlen – `target-counter()` kann Chromium nicht; Links bleiben im PDF klickbar).
- **Zusammenhalt:** Jede `h3` wird mit dem direkt folgenden Block in `<div class="keep">` gekapselt; ist dieser eine Tabelle
  mit > 8 Zeilen, nur `h3` + Einleitungssatz kapseln. Kapitel 8 bleibt `<section class="doc-chapter doc-matrix[ doc-matrix-landscape]">`.
- Matrixzellen: `<td class="lvl-r"><span class="lvl-key">R</span> Lesen</td>`; Kopfzellen `Name<span class="th-sub">KÜRZEL</span>`.
- `<code>`-Inhalt: nach `_`, `\`, `.` ein `<wbr>` einfügen (saubere Umbrüche statt Überlauf).
- Kap. 12 Unterschriften: je Spalte `<div class="sig"><p class="sig-label">Erstellt</p><p class="sig-name">Jonas Krüger</p>
  <p class="sig-line">Datum, Unterschrift</p></div>`; Namen: Erstellt = Ersteller, Freigegeben = Verantwortlich, Geprüft leer.
- Kopf-/Fußzeilentexte schreibt `renderDoc` zusätzlich in `<style id="doc-page-style">` (Strings CSS-escapen: `\` `"` Zeilenumbruch):
  `@page { @top-left{content:"<Firma>"} @top-right{content:"Berechtigungskonzept Active Directory"}`
  `@bottom-left{content:"<Klassifizierung> · Version <v> · <Datum>"} }`

**6.2 Seiten und laufende Kopf-/Fußzeile** (in `style.css`, außerhalb `@media print`)
```css
@page { size:A4; margin:24mm 18mm 22mm 20mm;
  @top-left     { font:8pt system-ui,"Segoe UI",Arial,sans-serif; color:#5b6675; vertical-align:bottom; padding-bottom:4mm; }
  @top-right    { font:8pt system-ui,"Segoe UI",Arial,sans-serif; color:#5b6675; vertical-align:bottom; padding-bottom:4mm; }
  @bottom-left  { font:8pt system-ui,"Segoe UI",Arial,sans-serif; color:#5b6675; vertical-align:top; padding-top:4mm; }
  @bottom-right { content:"Seite " counter(page) " von " counter(pages);
                  font:8pt system-ui,"Segoe UI",Arial,sans-serif; color:#5b6675; vertical-align:top; padding-top:4mm; }
}
@page cover  { margin:0; @top-left{content:none} @top-right{content:none} @bottom-left{content:none} @bottom-right{content:none} }
@page matrix { size:A4 landscape; margin:20mm 18mm 18mm; }
```
Deckblatt zählt als Seite 1, trägt aber keine Kopf-/Fußzeile. Margin-Box-Regeln aus `#doc-page-style` gelten auch für `matrix`.

**6.3 Druck-Tokens, Typografie, Fluss** (`@media print`)
```css
:root { --p-accent:#1e3a5f; --p-accent-mid:#c5d0de; --p-accent-tint:#eaeef4; --p-text:#1a1f29;
        --p-muted:#5b6675; --p-rule:#c9d1dc; --p-zebra:#f5f7fa; }      /* --p-muted 5,9:1 auf Weiß */
* { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
body { font:10pt/1.45 var(--font); color:var(--p-text); background:#fff; }
.doc p, .doc li { orphans:3; widows:3; } .doc ul, .doc ol { padding-left:14pt; margin:0 0 8pt; } .doc li { margin-bottom:2pt; }
.doc h2 { font-size:14pt; font-weight:700; color:var(--p-accent); margin:20pt 0 8pt; padding-bottom:3pt;
          border-bottom:1pt solid var(--p-accent); break-before:auto; break-after:avoid; }
.doc h2 .nr, .doc h3 .nr { display:inline-block; min-width:1.8em; }
.doc h3 { font-size:11pt; font-weight:600; margin:14pt 0 5pt; break-after:avoid; }
.doc-chapter:first-of-type h2, .doc-control h2:first-child { margin-top:0; }
.keep, tr, .hint, .doc-signature, .doc-toc li { break-inside:avoid; }
.doc-control { break-after:page; }
.doc code { font:8.5pt var(--font-mono); background:none; padding:0; color:inherit; }
a { color:inherit; text-decoration:none; }
```
Kein Kapitel erzwingt einen Seitenumbruch – Ausnahmen: nach Deckblatt, nach Dokumentinformationen, Querformat-Matrix.

**6.4 Deckblatt** (`.doc-cover { page:cover; height:297mm; box-sizing:border-box; padding:34mm 22mm 24mm 32mm;
display:flex; flex-direction:column; position:relative; break-after:page; }`)
- Akzentbalken: `::before { content:""; position:absolute; left:0; top:0; bottom:0; width:6mm; background:var(--p-accent); }`.
- `.cover-firma` 11pt, 600, `text-transform:uppercase; letter-spacing:.08em`, Akzentfarbe. `.cover-title` 26pt/1.15, 700,
  `margin-top:62mm`, `max-width:140mm`. `.cover-subtitle` 13pt, `--p-muted`, `margin-top:6pt`; Trennlinie darunter 40mm × 2pt Akzent.
- `.cover-meta` `margin-top:auto` (nach unten): Raster 2 Spalten × je `dt` 8pt Versalien `--p-muted` / `dd` 10.5pt 600,
  Zeilenabstand 8pt, oben `border-top:.5pt solid var(--p-rule); padding-top:10pt`.
- `.cover-class` rechts unten: `align-self:flex-end; border:1pt solid var(--p-accent); padding:3pt 10pt; 9pt 700 Versalien,
  letter-spacing:.1em`; Präfix per CSS „Klassifizierung: “ in 400. Bei „Vertraulich“ Rahmen 2pt.

**6.5 Tabellen** (alle `.doc table`, inkl. `.doc-kv`)
```css
.doc table { width:100%; border-collapse:collapse; font-size:8.5pt; line-height:1.35; margin:4pt 0 12pt;
             border:0; border-bottom:1pt solid var(--p-accent); }
.doc thead { display:table-header-group; }   /* Kopf wiederholt sich auf Folgeseiten */
.doc thead th { background:var(--p-accent); color:#fff; font-weight:600; text-align:left; vertical-align:bottom;
                padding:4pt 6pt; border:0; position:static; }
.doc td, .doc tbody th { padding:3.5pt 6pt; border:0; border-bottom:.5pt solid var(--p-rule); vertical-align:top; text-align:left; }
.doc tbody th { font-weight:600; }  .doc tbody tr:nth-child(even) { background:var(--p-zebra); }
.doc td:last-child.num { text-align:right; }   .doc .table-wrap { overflow:visible; border:0; }
.doc-kv { width:auto; min-width:110mm; } .doc-kv thead { display:none; } .doc-kv tbody th { width:42mm; color:var(--p-muted); font-weight:400; }
```
**6.6 Berechtigungsmatrix:** `.matrix-doc { table-layout:fixed; }` erste Spalte 34mm (Hochformat) bzw. 42mm (Querformat),
übrige gleich breit; Datenzellen `text-align:center; vertical-align:middle; padding:5pt 3pt; border-left:.5pt solid var(--p-rule)`;
`.th-sub { display:block; font:7.5pt var(--font-mono); opacity:.8; }`. Querformat (`.doc-matrix-landscape { page:matrix; }`)
nur bei > 6 Ressourcen, sonst fließt die Matrix im Hochformat (`break-inside:avoid` auf der Section, wenn ≤ 10 Rollen).
Stufen ohne Farbabhängigkeit – Kürzel-Kästchen `.lvl-key { display:inline-block; min-width:12pt; padding:0 3pt; font-weight:700;
border:.75pt solid var(--p-accent); border-radius:2pt; }`, Zellhintergrund immer neutral (Zebra), Steigerung über Füllung:
| Stufe | `.lvl-key` | Text |
|---|---|---|
| `.lvl-none` | kein Rahmen, „–“ | „Kein Zugriff“ in `--p-muted` |
| `.lvl-r` | Rahmen, weiß | „Lesen“ |
| `.lvl-m` | Rahmen, bg `--p-accent-mid` | „Ändern“ |
| `.lvl-f` | bg `--p-accent`, Schrift weiß | „Vollzugriff“, 600 |

**6.7 Hinweise, Leerzustand, Unterschriften, Ausblenden**
- `.hint` 9pt, `border-left:3pt solid var(--p-accent); background:var(--p-accent-tint); padding:6pt 9pt; border-radius:0`;
  `.hint-warning` Randfarbe `#92400e`, bg `#fdf3e1`; Präfix „Hinweis:“/„Warnung:“ bleibt (Information nicht nur über Farbe).
- `.doc-empty` 9pt kursiv `--p-muted`, `padding:4pt 0`.
- `.doc-signature { display:grid; grid-template-columns:repeat(3,1fr); gap:10mm; margin-top:18pt; }`; `.sig-label` 8pt
  Versalien `--p-muted`, `letter-spacing:.06em`; `.sig-name` 10pt 600, `min-height:12pt`; danach 18mm Freiraum,
  `.sig-line { border-top:.75pt solid var(--p-text); padding-top:3pt; font-size:8pt; color:var(--p-muted); }`.
- Ausblenden wie bisher: App-Kopfzeile, Navigation, `.no-print`, `.btn`, Toasts, Dialoge, `.doc-actions`, Skip-Link,
  alle `.step` außer `#step-7`; `main, .doc { max-width:none; padding:0; margin:0; box-shadow:none; border:0; }`.
- Bildschirmvorschau nutzt dieselben Klassen mit `rem`-Werten (§2); `@page`-Kopf/Fuß erscheint nur im Druck.

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
