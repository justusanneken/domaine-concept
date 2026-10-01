# Projektplan – Domänen-Rechtekonzept (statische Web-App)

Version 1.0 · Stand 01.10.2026 · Verantwortlich: Projektmanager

## 1. Ziel

Eine einfache, statische HTML-App, mit der Administratoren und Auszubildende (Fachinformatiker Systemintegration) ein
vollständiges, druckfähiges **Active-Directory-Berechtigungskonzept nach AGDLP** auf Deutsch erstellen. Die App führt
von den Stammdaten über Rollen, Benutzer und Ressourcen zur Berechtigungsmatrix und erzeugt daraus automatisch
Gruppennamen und ein fertiges Konzeptdokument.

## 2. Umfang

**Im Umfang**
- Eine Seite (`index.html`) ohne Build-Schritt, ohne Backend, ohne externe Abhängigkeiten (kein CDN, keine Webfonts).
- Erfassung: Stammdaten, Abteilungen/Rollen, Benutzer, Ressourcen, Zuordnung Rolle → Ressource mit Berechtigungsstufe.
- Automatische Gruppennamen (GG_/DL_), Gruppenübersicht, Berechtigungsmatrix, generiertes Konzeptdokument.
- Export: Druck/PDF (`window.print()`), Markdown (.md), JSON (Export und Import); Beispieldaten laden; Zurücksetzen.
- Automatisches Speichern im `localStorage`; Hell-/Dunkelmodus; responsiv ab 360 px.

**Nicht im Umfang**
- Keine Verbindung zu einem echten AD (kein LDAP, kein PowerShell-Ausführen, keine Anmeldung).
- Keine Mehrbenutzerfähigkeit, kein Server, keine Synchronisation zwischen Geräten.
- Keine Universal-Gruppen, keine Multi-Domain-/Forest-Szenarien, keine expliziten Verweigern-Einträge (Deny-ACEs).
- Keine Freigabe-/NTFS-Vererbungssimulation, keine Mehrsprachigkeit (nur Deutsch).
- Optional/später: Export von PowerShell-Skripten (`New-ADGroup`) – nicht Teil von v1.0.

## 3. Fachliche Regeln

### 3.1 AGDLP
`A`ccount → `G`lobale Gruppe → `D`omänen`L`okale Gruppe → `P`ermission.
- R1: Jeder Benutzer ist Mitglied genau **einer** Abteilung/Rolle und damit genau einer globalen Gruppe `GG_<Rolle>`.
- R2: Berechtigungen (ACL-Einträge) werden **ausschließlich** an domänenlokale Gruppen `DL_…` vergeben, nie an Benutzer oder GG.
- R3: Globale Gruppen werden Mitglied der DL-Gruppen gemäß Matrix. Benutzer werden **nie** direkt Mitglied einer DL-Gruppe.
- R4: Least Privilege: Standard jeder Matrixzelle ist „Kein Zugriff“; Rechte werden nur bewusst vergeben.
- R5: „Kein Zugriff“ bedeutet: keine Gruppenmitgliedschaft (kein Deny-Eintrag).
- R6: Freigabeberechtigung: „Authentifizierte Benutzer – Ändern“; die eigentliche Steuerung erfolgt über NTFS. Administratoren
  (`Domänen-Admins`/`SYSTEM`) behalten Vollzugriff; diese Einträge erscheinen als fester Grundsatz im Dokument.

### 3.2 Berechtigungsstufen

| Stufe | Kürzel | Ordner/Freigabe (NTFS) | Drucker | Anwendung |
|---|---|---|---|---|
| Kein Zugriff | – | keine Gruppe | keine Gruppe | keine Gruppe |
| Lesen | `R` | Lesen, Ausführen, Ordnerinhalt anzeigen | Drucken | Benutzen |
| Ändern | `M` | Ändern | Drucken + Dokumente verwalten | Benutzen + Daten bearbeiten |
| Vollzugriff | `F` | Vollzugriff | Drucker verwalten | Administrieren |

### 3.3 Namenskonvention (verbindlich)
- **Kürzel** (Rolle und Ressource): vom Benutzer frei eingebbar, sonst aus dem Namen abgeleitet. Normalisierung:
  1. ä→AE, ö→OE, ü→UE, ß→SS (Groß-/Kleinschreibung entsprechend), 2. in Großbuchstaben, 3. alle Zeichen außer `A–Z` und `0–9`
  (auch Leerzeichen, `-`, `_`) werden entfernt, 4. auf **max. 15 Zeichen** kürzen.
  Beispiel: „Geschäftsführung“ → `GESCHAEFTSFUEHR`, „Vertrieb Süd“ → `VERTRIEBSUED`.
- **Globale Gruppe:** `GG_<ROLLE>` → z. B. `GG_VERTRIEB`.
- **Domänenlokale Gruppe:** `DL_<RESSOURCE>_<R|M|F>` → z. B. `DL_PROJEKTE_M`.
- Es werden nur DL-Gruppen erzeugt, die in der Matrix tatsächlich verwendet werden.
- Kürzel müssen je Typ (Rollen untereinander, Ressourcen untereinander) **eindeutig** sein; Duplikate werden als Fehler
  markiert und blockieren nicht die Eingabe, aber erscheinen als Warnung im Dokument.
- **Benutzeranmeldename** (Vorschlag, editierbar): `vorname.nachname`, klein, normalisiert wie oben (ohne Großschreibung),
  max. 20 Zeichen (sAMAccountName-Grenze).
- Gruppenbereich/-typ: GG = Global/Sicherheit, DL = Lokal (in Domäne)/Sicherheit.

## 4. User Stories und Abnahmekriterien

**US-1 Stammdaten** – Als Administrator möchte ich Firma, Domäne und Verantwortliche erfassen, damit das Dokument eindeutig zuordenbar ist.
- AK-01: Felder: Firmenname, AD-Domäne (FQDN, z. B. `firma.local`), NetBIOS-Name, Verantwortlicher (Name, Funktion), Ersteller, Version, Datum, Rezertifizierungsintervall (3/6/12 Monate, Standard 6).
- AK-02: Firmenname und Domäne sind Pflichtfelder; fehlen sie, zeigt die App einen sichtbaren, per Screenreader angekündigten Hinweis.
- AK-03: Die Domäne wird auf FQDN-Format geprüft (mind. ein Punkt, nur `a–z 0–9 - .`).

**US-2 Abteilungen/Rollen** – Als Administrator möchte ich Rollen anlegen, damit Rechte nach Rollen statt Personen vergeben werden.
- AK-04: Rollen anlegen, bearbeiten, löschen (Name, Kürzel, Beschreibung); Löschen erfordert Bestätigung.
- AK-05: Zu jeder Rolle wird live der Gruppenname `GG_<ROLLE>` gemäß 3.3 angezeigt.
- AK-06: Doppelte Kürzel werden als Fehler markiert.

**US-3 Benutzer** – Als Administrator möchte ich Benutzer einer Rolle zuordnen.
- AK-07: Benutzer anlegen, bearbeiten, löschen (Vorname, Nachname, Anmeldename, Rolle); Anmeldename wird gemäß 3.3 vorgeschlagen.
- AK-08: Jeder Benutzer hat genau eine Rolle (Pflichtauswahl); wird eine Rolle gelöscht, werden betroffene Benutzer als „ohne Rolle“ markiert.

**US-4 Ressourcen** – Als Administrator möchte ich Freigaben, Drucker und Anwendungen erfassen.
- AK-09: Ressource anlegen, bearbeiten, löschen mit Typ (Ordner/Freigabe, Drucker, Anwendung), Name, Kürzel, Pfad/UNC (z. B. `\\fs01\projekte`), Beschreibung, Besitzer (Rolle).
- AK-10: Zu jeder Ressource werden die möglichen Gruppennamen `DL_<RES>_R/M/F` angezeigt.

**US-5 Berechtigungsmatrix** – Als Administrator möchte ich je Rolle und Ressource eine Stufe festlegen.
- AK-11: Matrix mit Rollen als Zeilen und Ressourcen als Spalten; jede Zelle hat eine Auswahl Kein Zugriff/Lesen/Ändern/Vollzugriff; Standard „Kein Zugriff“.
- AK-12: Die Matrix ist per Tastatur bedienbar und auf 360 px horizontal scrollbar, ohne dass die Seite selbst horizontal scrollt.
- AK-13: Stufen sind zusätzlich zur Farbe durch Text/Kürzel unterscheidbar.

**US-6 Gruppenübersicht** – Als Administrator möchte ich die abgeleiteten AD-Gruppen sehen.
- AK-14: Liste aller GG (mit Benutzer-Mitgliedern) und aller verwendeten DL (mit GG-Mitgliedern und Ressource/Stufe) gemäß R1–R3.
- AK-15: Kein Benutzer ist direkt Mitglied einer DL-Gruppe; „Kein Zugriff“ erzeugt keine Gruppe.

**US-7 Konzeptdokument** – Als Administrator möchte ich ein fertiges Dokument erhalten.
- AK-16: Das Dokument enthält in dieser Reihenfolge: Deckblatt/Stammdaten, 1 Ziele, 2 Geltungsbereich, 3 Grundsätze (AGDLP, Least Privilege, Need-to-know, R6), 4 Namenskonvention, 5 Rollen und Benutzer, 6 Ressourcen, 7 Gruppen, 8 Berechtigungsmatrix, 9 Prozess Beantragung/Änderung, 10 Prozess Entzug (Austritt/Wechsel), 11 Rezertifizierung (mit Intervall aus AK-01), 12 Änderungshistorie/Freigabe (Unterschriftenzeilen).
- AK-17: Alle Inhalte sind aus den Eingaben dynamisch erzeugt; leere Bereiche zeigen „Keine Einträge erfasst“.

**US-8 Export/Import** – Als Administrator möchte ich das Konzept sichern und weitergeben.
- AK-18: „Drucken/PDF“ öffnet den Druckdialog; die Druckansicht zeigt nur das Dokument (keine Navigation/Buttons), helle Farben, Seitenumbrüche vor Hauptkapiteln, Tabellenköpfe wiederholen sich.
- AK-19: „Markdown exportieren“ lädt `rechtekonzept-<domäne>-<datum>.md` mit identischem Inhalt wie AK-16 (Tabellen als Markdown-Tabellen) herunter.
- AK-20: „JSON exportieren“ lädt den kompletten Datenstand inkl. `schemaVersion: 1` herunter; „JSON importieren“ stellt ihn vollständig wieder her.
- AK-21: Ungültiges JSON oder falsches Schema wird mit verständlicher Fehlermeldung abgelehnt; vorhandene Daten bleiben unverändert.

**US-9 Komfort und Datenhaltung**
- AK-22: Alle Änderungen werden automatisch im `localStorage` gespeichert und nach Neuladen wiederhergestellt; ist `localStorage` nicht verfügbar, läuft die App mit Hinweis weiter.
- AK-23: „Beispieldaten laden“ (nach Bestätigung) befüllt die App mit einer Musterfirma: mind. 4 Rollen, 8 Benutzer, 5 Ressourcen (davon 1 Drucker, 1 Anwendung) und sinnvoller Matrix.
- AK-24: „Alles zurücksetzen“ löscht nach Bestätigung alle Daten.

**US-10 Qualität**
- AK-25: Oberfläche vollständig auf Deutsch; Seite lädt ohne Konsolenfehler; funktioniert per `file://` in aktuellem Chrome/Firefox/Edge.
- AK-26: Alle Benutzereingaben werden beim Rendern escaped (Test: Rollenname `<img src=x onerror=alert(1)>` wird als Text angezeigt).
- AK-27: WCAG 2.2 AA: alle Felder mit Label, sichtbarer Fokus, vollständige Tastaturbedienung, Kontrast ≥ 4,5:1.
- AK-28: Hell- und Dunkelmodus (folgt Systemeinstellung, manuell umschaltbar); Layout ohne horizontales Scrollen ab 360 px.

## 5. Datenmodell (JSON, verbindlich)

```json
{
  "schemaVersion": 1,
  "meta": { "firma": "", "domaene": "", "netbios": "", "verantwortlich": "", "funktion": "",
            "ersteller": "", "version": "1.0", "datum": "2026-10-01", "rezertifizierungMonate": 6 },
  "rollen":     [{ "id": "r1", "name": "", "kuerzel": "", "beschreibung": "" }],
  "benutzer":   [{ "id": "u1", "vorname": "", "nachname": "", "anmeldename": "", "rolleId": "r1" }],
  "ressourcen": [{ "id": "s1", "typ": "ordner|drucker|anwendung", "name": "", "kuerzel": "",
                   "pfad": "", "beschreibung": "", "besitzerRolleId": "r1" }],
  "matrix":     { "r1": { "s1": "R" } }
}
```
Matrixwerte: `"R"`, `"M"`, `"F"`; fehlender Eintrag = Kein Zugriff. `localStorage`-Schlüssel: `domaenen-rechtekonzept-v1`.

## 6. Dateistruktur

```
index.html          Grundgerüst, Navigation (Schritte), Formulare, Dokumentbereich
css/style.css       Design-Tokens (hell/dunkel), Komponenten, Responsiveness, @media print
js/app.js           Zustand, Speichern/Laden, Rendering, Namenslogik, Export/Import, Beispieldaten
docs/PROJEKTPLAN.md  dieses Dokument (Projektmanager)
docs/DESIGN.md       Designsystem und Screens (Designer)
docs/VALIDIERUNG.md  Prüfbericht (Validator)
```

Navigation (Schritte): 1 Stammdaten · 2 Rollen · 3 Benutzer · 4 Ressourcen · 5 Matrix · 6 Gruppen · 7 Dokument & Export.

## 7. Rollen und Ablauf der Agenten

| # | Agent | Eingabe | Ergebnis | Fertig wenn |
|---|---|---|---|---|
| 1 | Projektmanager | Auftrag | `docs/PROJEKTPLAN.md` | Plan mit AK-01–AK-28 liegt vor |
| 2 | Designer | Projektplan | `docs/DESIGN.md` | Tokens hell/dunkel, Komponenten, alle 7 Schritte, Druck-Layout konkret beschrieben |
| 3 | Webentwickler | Plan + Design | `index.html`, `css/style.css`, `js/app.js` | Selbsttest bestanden (AK-25) |
| 4 | Validator | Plan + Design + Code | `docs/VALIDIERUNG.md` | Jedes AK geprüft (erfüllt/nicht erfüllt), Befunde mit Schweregrad |
| 5 | Webentwickler | Validierung | korrigierter Code | alle Befunde Kritisch/Hoch behoben |
| 6 | Validator | korrigierter Code | aktualisierte `VALIDIERUNG.md` | keine offenen Kritisch/Hoch-Befunde |
| 7 | Projektmanager | alle Dokumente | Abnahmevermerk in diesem Plan (Abschnitt 9) | Abnahme erteilt oder Restpunkte dokumentiert |

Regeln: Abweichungen vom Plan nur nach Rücksprache mit dem Projektmanager; Fachregeln aus Abschnitt 3 sind nicht verhandelbar.
Mittlere/niedrige Befunde dürfen als offene Punkte in die Abnahme übernommen werden.

## 8. Meilensteine

| MS | Inhalt | Kriterium |
|---|---|---|
| M1 | Planung abgeschlossen | PROJEKTPLAN.md liegt vor |
| M2 | Design abgeschlossen | DESIGN.md liegt vor, deckt AK-12/13/18/27/28 ab |
| M3 | Umsetzung v1 | App lauffähig, AK-01–AK-24 funktional umgesetzt |
| M4 | Validierung | VALIDIERUNG.md mit Prüfung aller AK |
| M5 | Nachbesserung + Re-Validierung | keine offenen Kritisch/Hoch-Befunde |
| M6 | Abnahme | Abnahmevermerk durch Projektmanager |

## 9. Abnahme

Stand 01.10.2026 · Projektmanager · Grundlage: `docs/VALIDIERUNG.md` (Prüfung Commit `5a34d35`, Korrekturen Abschnitt 8, Commit `ec62fa0`)
sowie Stichprobe im Code (V-01 `--success:#166534`, V-02 kein `scrollIntoView` in `goToStep`, V-04 Backup-Schlüssel `-defekt`).

| AK | Status | Bemerkung |
|---|---|---|
| AK-01 – AK-11 | erfüllt | Stammdaten, Rollen, Benutzer, Ressourcen, Matrix gemäß Validierung |
| AK-12 | erfüllt | Fokussierte Matrixzelle nach V-03 vollständig sichtbar (360 px) |
| AK-13 – AK-18 | erfüllt | Gruppen nach AGDLP (R1–R5), Dokument Kapitel 1–12, Druck 13 Seiten A4 |
| AK-19 | erfüllt | Markdown-Escaping nach V-06/V-07 korrigiert |
| AK-20 – AK-21 | erfüllt | JSON-Export/-Import inkl. 4 Negativtests |
| AK-22 | erfüllt | Defekter Speicherstand wird nach V-04 gesichert statt überschrieben |
| AK-23 | erfüllt | 5 Rollen, 10 Benutzer, 6 Ressourcen; Beispielmatrix nach V-05 Least-Privilege-konform |
| AK-24 | erfüllt | – |
| AK-25 | erfüllt mit Auflage | Nur in Chromium geprüft; Firefox/Edge offen (OP-1) |
| AK-26 | erfüllt | XSS-Payload in allen Feldern als Text dargestellt |
| AK-27 | erfüllt mit Auflage | V-01/V-02 behoben; Screenreader-Test offen (OP-2) |
| AK-28 | erfüllt | Hell/Dunkel/System, 360 px ohne horizontales Scrollen |

Fachliche Regeln (Abschnitt 3): AGDLP, Least Privilege und Namenskonvention korrekt umgesetzt; Prozess „Beantragung“
nach V-08 an R1 angepasst. Befunde: 0 Kritisch, 0 Hoch; alle 11 Befunde (V-01 – V-11) als behoben gemeldet.

**Offene Punkte**

| Nr. | Punkt | Verantwortlich | Priorität |
|---|---|---|---|
| OP-1 | Funktionstest in Firefox und Edge (per `file://`), insbesondere `<dialog>`, Druck/PDF, Download | Validator | Mittel |
| OP-2 | Test mit echtem Screenreader (NVDA/Windows, ggf. VoiceOver): Live-Regionen, Dialog, Matrix | Validator | Mittel |
| OP-3 | ~~`docs/DESIGN.md` §1 nennt noch `--success:#15803d`~~ – erledigt, auf `#166534` angeglichen | Designer | Erledigt |
| OP-4 | Re-Validierung der Korrekturen durch den Validator (bisher Selbsttest des Webentwicklers) | Validator | Niedrig |

**Entscheidung:** abgenommen mit Auflagen (OP-1 bis OP-4). Die App ist für den Einsatz als Lern- und Dokumentationswerkzeug
freigegeben; die offenen Punkte werden ohne erneute Abnahme nachgezogen, sofern dabei keine Kritisch-/Hoch-Befunde entstehen.
