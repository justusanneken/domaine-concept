# Validierung – Domänen-Rechtekonzept

Version 1.0 · Stand 01.10.2026 · Verantwortlich: Validator · Geprüfter Stand: Commit `5a34d35`
Grundlage: `docs/PROJEKTPLAN.md`, `docs/DESIGN.md`, `index.html`, `css/style.css`, `js/app.js`

## 1. Vorgehen

- Code-Review aller drei Dateien (HTML-Struktur, CSS-Tokens, gesamte `app.js`).
- Browsertest mit Playwright/Chromium 1194 per `file://` (Desktop 1280×900, mobil 360×740, Hell und Dunkel über
  `prefers-color-scheme` sowie `data-theme`, Druckmedium per `emulateMedia` und PDF-Erzeugung im A4-Format).
- XSS-Test: `<img src=x onerror=alert(1)>"'&` in Firmenname, Rollenname/-beschreibung, Benutzer-Vorname, Ressourcenname,
  -pfad und -beschreibung; durch alle 7 Schritte und den Markdown-Export geführt.
- Kontraste aller Token-Paare **rechnerisch** nach WCAG 2.x (relative Leuchtdichte), zusätzlich DOM-Scan aller sichtbaren
  Texte gegen den tatsächlich wirksamen Hintergrund in allen 7 Schritten (hell und dunkel).
- Tastaturtest: Skip-Link, Menü, Dialog, Löschen per Tastatur, Matrix (Tab/Pfeiltasten), Fokusreihenfolge.
- Import-Negativtests (kaputtes JSON, `schemaVersion: 2`, Array, ungültiger Ressourcentyp), `localStorage` gesperrt.

Konsolenfehler: **keine** (alle Läufe, auch ohne `localStorage`).
Nicht testbar in dieser Umgebung: Firefox und Edge (AK-25), echte Screenreader-Ausgabe.

## 2. Abnahmekriterien

| AK | Ergebnis | Nachweis / Bemerkung |
|---|---|---|
| AK-01 | erfüllt | Alle Felder vorhanden, Intervall 3/6/12, Standard 6 (`index.html:62-123`). |
| AK-02 | erfüllt | Hinweis „Fehler: Firmenname und AD-Domäne sind Pflichtfelder.“ in `role="alert"` plus Feldfehler mit `aria-invalid`. |
| AK-03 | erfüllt | `Firma` → Fehler; `FIRMA.Local` → wird zu `firma.local` normalisiert und akzeptiert. |
| AK-04 | erfüllt | Anlegen/Bearbeiten/Löschen; Löschen über `<dialog>` mit „Endgültig löschen“. |
| AK-05 | erfüllt | Live-Vorschau „Gruppe: GG_VERTRIEBSUED“ für „Vertrieb Süd“. |
| AK-06 | erfüllt | Feldfehler, Hinweis oben, Zeilenmarkierung „Doppelt“, Warn-Badge in der Navigation. |
| AK-07 | erfüllt | Vorschlag `max.mustermannlanger` (auf 20 Zeichen gekürzt), editierbar. |
| AK-08 | erfüllt | Pflichtauswahl Rolle; nach Löschen der Rolle 3 Benutzer mit Badge „Ohne Rolle“. |
| AK-09 | erfüllt | Typ, Name, Kürzel, Pfad/UNC, Beschreibung, Besitzer (Rolle). |
| AK-10 | erfüllt | Vorschau und Tabellenspalte `DL_<RES>_R/M/F`. |
| AK-11 | erfüllt | Rollen × Ressourcen, Standard „– Kein Zugriff“. |
| AK-12 | erfüllt | Bedienbar per Tab/Pfeiltasten; bei 360 px `scrollWidth = 360`, nur `.table-wrap` scrollt. Einschränkung siehe **V-03**. |
| AK-13 | erfüllt | Optionstexte „R Lesen“, „M Ändern“, „F Vollzugriff“, „– Kein Zugriff“. |
| AK-14 | erfüllt | GG mit Benutzer-Mitgliedern, DL mit GG-Mitgliedern, Ressource und Stufe. |
| AK-15 | erfüllt | DL-Mitglieder sind ausschließlich GG; „Kein Zugriff“ erzeugt keine Gruppe (`localGroups`, `js/app.js:249-258`). |
| AK-16 | erfüllt | Deckblatt + Kapitel 1–12 in der geforderten Reihenfolge, 3.1–3.4 inkl. R6. |
| AK-17 | erfüllt | Leere Tabellen → „Keine Einträge erfasst“. |
| AK-18 | erfüllt | Druck: Kopfzeile/Navigation/Buttons ausgeblendet, auch im Dunkelmodus weißer Hintergrund und schwarzer Text, `break-before:page` an allen 12 `h2`, `thead` als `table-header-group`. PDF: 13 Seiten A4. |
| AK-19 | erfüllt | Datei `rechtekonzept-firma.local-2026-10-01.md`, gleiches Dokumentmodell wie HTML. Escaping-Lücken siehe **V-06**, **V-07**. |
| AK-20 | erfüllt | Export mit `schemaVersion: 1`, Import stellt den Stand wieder her. |
| AK-21 | erfüllt | Alle 4 Negativtests abgelehnt, Daten unverändert, Fehler-Toast mit dem Text aus dem Design. |
| AK-22 | erfüllt | Neuladen stellt Daten und Schritt wieder her; ohne `localStorage` erscheinen Hinweis und „Speichern nicht möglich“, die App läuft weiter. Datenverlust-Risiko siehe **V-04**. |
| AK-23 | erfüllt | 5 Rollen, 10 Benutzer, 6 Ressourcen (1 Drucker, 1 Anwendung). Fachliche Anmerkung siehe **V-05**. |
| AK-24 | erfüllt | Nach Bestätigung leerer Zustand, Schritt 1. |
| AK-25 | erfüllt (nur Chromium geprüft) | Deutsch, keine Konsolenfehler, `file://` funktioniert. Firefox/Edge nicht geprüft. |
| AK-26 | erfüllt | Payload überall als Text dargestellt; kein `<img>` im DOM, kein `alert`. Alle `innerHTML`-Stellen geprüft (siehe 4). |
| AK-27 | **nicht erfüllt** | Kontrast `--success` auf `--success-bg` 4,49:1 (**V-01**); Skip-Link nach dem Laden nicht per erstem Tab erreichbar (**V-02**). |
| AK-28 | erfüllt | System, Hell und Dunkel funktionieren, Wahl wird gespeichert; kein horizontales Scrollen bei 360 px (alle 7 Schritte, hell und dunkel). |

## 3. Kontraste (rechnerisch)

Text ≥ 4,5:1, Rahmen und Fokus ≥ 3:1. Abweichungen sind **fett** markiert.

| Paar | Hell | Dunkel |
|---|---|---|
| `--text` / `--bg` · `--surface` · `--surface-2` | 15,27 · 16,51 · 14,46 | 15,20 · 13,92 · 12,37 |
| `--text-muted` / `--surface` · `--bg` · `--surface-2` | 7,56 · 6,99 · 6,62 | 7,74 · 8,45 · 6,87 |
| `--primary` / `--surface` | 6,70 | 7,52 |
| `--on-primary` / `--primary` · `--primary-hover` | 6,70 · 8,72 | 8,31 · 10,77 |
| `--on-danger` / `--danger` · `--danger-hover` | 6,47 · 8,31 | 6,92 · 10,09 |
| `--danger` / `--surface` · `--danger-bg` | 6,47 · 5,66 | 6,12 · 6,19 |
| `--success` / `--success-bg` (Badge DL) | **4,49** | 8,87 |
| `--warning` / `--warning-bg` | 6,44 | 9,25 |
| `--info` / `--info-bg` (Badge GG) | 5,81 | 7,13 |
| `--text` auf Hinweis-Hintergründen (info/warning/danger/success) | 14,31 · 15,00 · 14,46 · 14,77 | 13,20 · 12,70 · 14,08 · 12,71 |
| Toast `--bg` / `--text` | 15,27 | 15,20 |
| Stufen none · R · M · F | 6,62 · 8,49 · 8,15 · 8,20 | 8,19 · 8,49 · 7,79 · 8,20 |
| `--border-input` / `--surface` · `--bg` | 3,77 · 3,49 | 3,68 · 4,02 |
| `--focus` / `--surface` · `--bg` · Stufen-Hintergründe | 6,70 · 6,20 · ≥ 5,49 | 9,74 · 10,63 · ≥ 4,99 |

Der DOM-Scan bestätigt das: Die einzige Unterschreitung im gerenderten Zustand ist die DL-Badge (`DL_WAWI_F`, 4,49:1, hell).

## 4. Escaping (alle `innerHTML`/`insertAdjacentHTML`-Stellen)

| Stelle (`js/app.js`) | Benutzerdaten | Ergebnis |
|---|---|---|
| 413 `renderNav` | nur Zahlen und Konstanten | ok |
| 431 `renderFooter` | Konstanten, `esc` | ok |
| 476/512/593/690/768 `hintHtml` | Warntexte mit `esc` | ok |
| 489 `emptyCard` | `esc`; `btnAttr` ist eine Konstante | ok |
| 541 / 712 Gruppenvorschau | normalisierter Code (A–Z, 0–9) + `esc` | ok |
| 598 / 695 / 773 Tabellen | Name, Beschreibung, Pfad, Anmeldename und IDs (auch in Attributen) mit `esc` | ok |
| 624 `fillRoleSelect` | `esc` für Wert und Text | ok |
| 851 Matrix | Name, Typ und Code mit `esc`; `data-cell` mit `esc`; Selektor mit `CSS.escape` | ok |
| 905/911/919 Gruppen | `esc`; Stufe und Typ stammen aus Whitelist-Konstanten | ok |
| 1107–1151 Dokument | `partsToHtml`/`esc` für alle Inhalte; `cls` und `lvl` sind intern | ok |

Toasts, Dialogtexte und Feldfehler nutzen `textContent`. Import und Laden validieren gegen eine Whitelist für Typ und Stufe.
**HTML-Escaping: keine Befunde.** Für den Markdown-Export gibt es Befunde: siehe V-06 und V-07.

## 5. Befunde

Schweregrade: Kritisch / Hoch / Mittel / Niedrig. Kritisch: 0 · Hoch: 0 · Mittel: 5 · Niedrig: 6.

### V-01 · Mittel · Kontrast der DL-Badge unter 4,5:1 (AK-27)
- **Fundstelle:** `css/style.css:15` (`--success:#15803d`), verwendet in `css/style.css:258` (`.badge-dl`); identisch in `docs/DESIGN.md` §1.
- **Befund:** `#15803d` auf `#e7f6ec` ergibt 4,49:1. Der Text ist 12 px, 600, also normaler Text; gefordert sind 4,5:1. Betroffen sind die DL-Gruppennamen in Schritt 4 (hell).
- **Lösung:** `--success` (hell) auf `#166534` setzen (≈ 6,5:1 auf `--success-bg`, ≈ 7,1:1 auf Weiß). Alternativ `--success-bg` minimal aufhellen. Die Druck-Tokens (`css/style.css:395`) und `DESIGN.md` gleichziehen.

### V-02 · Mittel · Erster Tab nach dem Laden überspringt Skip-Link, Kopfzeile und den aktiven Schritt (WCAG 2.4.1/2.4.3, AK-27)
- **Fundstelle:** `js/app.js:443-446` (`active.scrollIntoView(...)` in `goToStep`), aufgerufen beim Start in `js/app.js:1333`.
- **Befund:** Chromium verschiebt bei `scrollIntoView` den Startpunkt der sequenziellen Fokusnavigation auf das gescrollte Element. Nach dem Laden landet der erste Tab deshalb auf dem **nächsten** Schritt-Link (z. B. „2 Rollen“). Ist Schritt 3 gespeichert, landet er auf „4 Ressourcen“. Skip-Link, Theme- und Menü-Button sind nur per Umschalt+Tab erreichbar. Verifiziert: Mit wirkungslos gemachtem `scrollIntoView` ist die Reihenfolge korrekt (Skip-Link → Theme → Menü).
- **Lösung:** Statt `scrollIntoView` die Leiste direkt scrollen, z. B. `ol.scrollLeft = link.offsetLeft - (ol.clientWidth - link.offsetWidth) / 2`. Das nur mobil tun, wenn `ol.scrollWidth > ol.clientWidth`; beim initialen Aufruf (`focus === false`) nicht `scrollIntoView` verwenden.

### V-03 · Mittel · Fokussierte Matrixzelle wird zur Hälfte von der sticky Rollenspalte verdeckt (WCAG 2.4.11, AK-12)
- **Fundstelle:** `css/style.css:321-323` (sticky `th[scope=row]`, min. 9rem) zusammen mit `js/app.js:887-891` (`scrollIntoView({inline:'nearest'})`).
- **Befund:** Bei 360 px bleiben beim Tab auf `r1|s2`, `r1|s4` und `r2|s1` nur 74 von 152 px des Selects sichtbar. Der Stufentext („M Ändern“) ist verdeckt, nur „rn“ ist lesbar (Screenshot geprüft). Der Fokus ist nicht vollständig verdeckt, daher formal kein AA-Verstoß, aber die Tastaturbedienung ist deutlich erschwert.
- **Lösung:** `.matrix` bzw. deren `.table-wrap` mit `scroll-padding-left` in Breite der Rollenspalte versehen (z. B. `scroll-padding-inline-start: 9.5rem`). Alternativ in `focusin` `scrollLeft` so korrigieren, dass `rect.left >= th.right`.

### V-04 · Mittel · Ein ungültiger Eintrag im `localStorage` löscht beim Start stillschweigend alle Daten
- **Fundstelle:** `js/app.js:132-139` (`load` verwirft bei `null`), danach `js/app.js:1332` (`if (storageOk) save();`).
- **Befund:** Scheitert die Validierung an einem einzigen Datensatz (getestet: Ressource mit `typ: "Ordner"`) oder an einem künftigen Schema, startet die App leer und überschreibt den gespeicherten Stand sofort. Es gibt keinen Hinweis und keine Wiederherstellung. Verifiziert per Playwright.
- **Lösung:** Beim Start nicht unbedingt speichern. Bei fehlgeschlagenem `load` den Rohwert unter einem Backup-Schlüssel sichern (z. B. `domaenen-rechtekonzept-v1-defekt`) und einen Hinweis mit dem Rat zum JSON-Export bzw. zur Prüfung anzeigen. Erst nach der ersten Benutzeränderung speichern.

### V-05 · Mittel · Beispielmatrix widerspricht Least Privilege und Need-to-know (fachlich, AK-23)
- **Fundstelle:** `js/app.js:1283` (`r5` IT: `F` auf alle Ressourcen).
- **Befund:** Die Rolle IT erhält Vollzugriff auf Buchhaltung (laut Beschreibung „Belege, Abschlüsse, Lohn“) und Vertrieb. Das widerspricht Kapitel 3.2/3.3 des erzeugten Dokuments. Administrativer Vollzugriff ist laut R6 bereits über `Domänen-Admins`/`SYSTEM` abgedeckt. Für eine Lern-App für Auszubildende vermittelt das Beispiel ein Negativmuster.
- **Lösung:** IT nur dort `F` geben, wo sie Besitzer ist (`s4` Austausch, `s5` Drucker). Bei fachlichen Ablagen (`s1`–`s3`) und WAWI höchstens `R` bzw. keinen Zugriff vergeben.

### V-06 · Niedrig · Markdown-Tabellenkopf escaped `|` nicht – Matrix-Tabelle zerfällt
- **Fundstelle:** `js/app.js:1171` (`tableMd`: Kopfzellen nur durch `mdText`, nicht durch `mdCell`), Inhalt aus `js/app.js:1053`.
- **Befund:** Ressourcenname `A|B Projekte` ergibt in Kapitel 8 die Kopfzeile `| Rolle | … | A|B Projekte (ABPROJEKTE) |` mit 4 Zellen bei 3 Trennzellen. Nach GFM wird das nicht mehr als Tabelle erkannt. In Kapitel 6 wird derselbe Name korrekt als `A\|B` escaped.
- **Lösung:** In `tableMd` die Kopfzellen ebenfalls über `mdCell` (bzw. `mdText(h).replace(/\|/g,'\\|')`) ausgeben.

### V-07 · Niedrig · `mdText` escaped weder `&`/Entities noch `~`; Code-Spans mit `` `` `` brechen
- **Fundstelle:** `js/app.js:1154` (`mdText`), `js/app.js:1159-1161` (Code-Spans).
- **Befund:** Eingaben wie `A &amp; B` werden im gerenderten Markdown als „A & B“ angezeigt, `~~x~~` wird durchgestrichen. Der Inhalt weicht dann von der HTML-Vorschau ab (AK-19 „identischer Inhalt“). Ein Pfad mit zwei aufeinanderfolgenden Backticks beendet den Code-Span vorzeitig. Ein Sicherheitsrisiko besteht nicht, denn `<` und `>` sind escaped.
- **Lösung:** `&` und `~` in die Escape-Klasse von `mdText` aufnehmen. Für Code-Spans einen Delimiter wählen, der länger ist als die längste Backtick-Folge im Inhalt.

### V-08 · Niedrig · Prozess „Beantragung“ passt nicht zu R1 (fachlich)
- **Fundstelle:** `js/app.js:1066-1068` (Kapitel 9, Schritte 1 und 3).
- **Befund:** Schritt 1 beschreibt Einzelanträge je Benutzer und Ressource. Schritt 3 setzt sie über „Benutzer → GG_“ um. Nach R1 ist jeder Benutzer aber Mitglied genau einer GG. Ein Einzelrecht ließe sich nur durch eine zweite GG (verstößt gegen R1) oder über die gesamte Rolle umsetzen.
- **Lösung:** Text präzisieren: Einzelanträge führen entweder zu einem Rollenwechsel (Benutzer → andere GG) oder zu einer Matrixänderung für die ganze Rolle (GG → DL). Individuelle Zusatzrechte sind ausgeschlossen bzw. nur befristet über eine Rollenänderung möglich.

### V-09 · Niedrig · Live-Region „Gespeichert“ wird bei jedem Tastendruck neu geschrieben
- **Fundstelle:** `js/app.js:121-125` (`setSaveStatus` setzt immer `textContent`), aufgerufen pro `input` in `js/app.js:517-520`; Region `index.html:23` (`aria-live="polite"`).
- **Befund:** Beim Tippen von 6 Zeichen entstehen 6 DOM-Mutationen in der Live-Region (MutationObserver), obwohl sich der Text nicht ändert. Je nach Screenreader wird „Gespeichert“ wiederholt angesagt und überlagert die Eingabe.
- **Lösung:** Nur schreiben, wenn sich der Status ändert (`if (el.textContent !== neu)`).

### V-10 · Niedrig · ARIA-Fehlverwendungen
- **Fundstellen:** `index.html:29` (`aria-haspopup="true"` = Menü, die Liste hat aber kein `role="menu"`/`menuitem`); `js/app.js:416` (`aria-label` auf `<span class="badge-count">` ohne Rolle); `js/app.js:833` (`aria-label="Legende"` auf `<div>` ohne Rolle).
- **Befund:** Nach ARIA 1.2 ist die Benennung generischer Elemente nicht erlaubt; das Label wird ignoriert. `aria-haspopup="true"` kündigt ein Menü an, das semantisch keines ist.
- **Lösung:** Beim Menü-Button `aria-haspopup` entfernen (Disclosure-Muster mit `aria-expanded` genügt). Das Zähler-Badge mit sichtbarer Zahl plus `.sr-only`-Text „Einträge“ versehen. Die Legende als `<p>` bzw. mit `role="group"` auszeichnen.

### V-11 · Niedrig · Tote Fokus-Pause im Toast
- **Fundstelle:** `js/app.js:313-314`.
- **Befund:** `focusin`/`focusout` werden nur an Erfolgs-Toasts gebunden. Diese enthalten kein fokussierbares Element, die Handler greifen also nie. Fehler-Toasts mit Button kehren vorher zurück (`js/app.js:299-306`). Die Design-Vorgabe „bei Fokus pausieren“ ist damit nur scheinbar umgesetzt.
- **Lösung:** Handler entfernen oder sinnvoll machen. Doppelte `start()`-Aufrufe (Hover und Fokus) über eine Laufzustandsvariable absichern.

## 6. Design-Abgleich (ohne Befund)

Die Tokens hell/dunkel entsprechen `DESIGN.md` §1 exakt, einschließlich duplizierter `prefers-color-scheme`-Block. Komponenten wie Buttons, Badges, Hinweise, Dialog (Fokus auf „Abbrechen“, Esc schließt), Toasts (max. 3, Fehler mit „Schließen“), Leerzustände, Mikrotexte, Fokusring 3 px + Halo, Skip-Link, H1-Fokus mit `document.title`, `prefers-reduced-motion` und das Druckstylesheet einschließlich Querformat ab > 6 Ressourcen und Unterschriftenzeilen sind umgesetzt. `overflow-x:hidden` auf `html`/`body` wird nicht verwendet.

## 7. Fazit

Keine Kritisch- oder Hoch-Befunde. AK-27 ist wegen V-01 und V-02 nicht erfüllt; beide lassen sich mit geringem Aufwand beheben. Alle übrigen AK sind erfüllt. V-03 bis V-05 werden zur Behebung vor der Abnahme empfohlen, V-06 bis V-11 können als offene Punkte übernommen werden.

## 8. Korrekturen

Stand 01.10.2026 · Verantwortlich: Webentwickler. Erneut getestet mit Playwright/Chromium per `file://`, Desktop 1280 px und mobil 360 px: keine Konsolenfehler, kein horizontales Seiten-Scrollen in allen 7 Schritten. Export und Import sind unverändert funktionsfähig.

| Befund | Status | Umsetzung / Nachweis |
|---|---|---|
| V-01 | behoben | `--success` (hell und Druck) auf `#166534` gesetzt (≈ 6,5:1 auf `--success-bg`). `DESIGN.md` §1 nennt noch `#15803d`; der Designer sollte das nachziehen. |
| V-02 | behoben | `goToStep` scrollt die Schrittleiste per `scrollLeft` und nur, wenn sie scrollbar ist, statt `scrollIntoView` aufzurufen. Test: Mit gespeichertem Schritt 3 landet der erste Tab auf dem Skip-Link. |
| V-03 | behoben | `focusin` in der Matrix korrigiert `scrollLeft`, sodass die Zelle rechts der sticky Rollenspalte und im sichtbaren Bereich liegt. Test bei 360 px: Jeder per Tab fokussierte Select ist vollständig sichtbar (152/152 px). |
| V-04 | behoben | Ein ungültiger Stand wird unter `domaenen-rechtekonzept-v1-defekt` gesichert. Der Originalschlüssel bleibt unverändert. Es erscheint ein Warnhinweis (`role="alert"`) und der Status „Noch nicht gespeichert“. Beim Start wird nicht mehr gespeichert, erst bei der ersten Änderung. Per Playwright verifiziert. |
| V-05 | behoben | Beispielmatrix IT: `F` nur auf eigene Ressourcen (Austausch, Drucker), `R` auf Projekte und WAWI, kein Zugriff auf Buchhaltung und Vertrieb. |
| V-06 | behoben | Kopfzellen in `tableMd` laufen über `mdCell`: `\| Rolle \| A\|B Projekte (ABPROJEKTE) \|`. |
| V-07 | behoben | `mdText` escaped zusätzlich `~` und `&` (als `&amp;`). Code-Spans verwenden einen Delimiter, der länger ist als die längste Backtick-Folge im Inhalt (`x``y` → ```` ``` x``y ``` ````). |
| V-08 | behoben | Kapitel 9 neu gefasst: Anträge führen entweder zur Rollenzuordnung bzw. zum Rollenwechsel (genau eine GG, R1) oder zur Matrixänderung für die ganze Rolle (GG → DL). Individuelle Zusatzrechte sind ausgeschlossen. |
| V-09 | behoben | `setSaveStatus` schreibt die Live-Region nur noch, wenn sich der Text ändert. |
| V-10 | behoben | `aria-haspopup` am Menü-Button entfernt (Disclosure-Muster). Das Zähler-Badge enthält sichtbare Zahl plus `.sr-only` „Einträge“. Die Legende hat `role="group"` mit `aria-label`. |
| V-11 | behoben | Die wirkungslosen `focusin`/`focusout`-Handler sind entfernt. Hover-Pause und -Fortsetzung sind über eine Laufzustandsvariable gegen doppelte Timer abgesichert. |

Offen: Firefox/Edge und echte Screenreader-Ausgabe sind weiterhin nicht geprüft (Umgebung).
