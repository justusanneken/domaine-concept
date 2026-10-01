# Domänen-Rechtekonzept

Statische Web-App zum Erstellen eines **Active-Directory-Berechtigungskonzepts nach AGDLP** auf Deutsch – gedacht für
Administratoren und Auszubildende (Fachinformatiker Systemintegration). Ohne Server, ohne Build, ohne externe Abhängigkeiten.

## Starten

`index.html` per Doppelklick im Browser öffnen (Chrome, Edge oder Firefox). Die Daten werden automatisch im
`localStorage` des Browsers gespeichert – für eine Sicherung „JSON exportieren“ nutzen.

## Funktionen

- **7 Schritte:** Stammdaten · Rollen · Benutzer · Ressourcen · Matrix · Gruppen · Dokument & Export
- Rollen/Abteilungen, Benutzer (Anmeldename-Vorschlag `vorname.nachname`) und Ressourcen (Ordner/Freigabe, Drucker, Anwendung)
- Berechtigungsmatrix Rolle × Ressource: Kein Zugriff, Lesen (`R`), Ändern (`M`), Vollzugriff (`F`)
- Automatische Gruppennamen: `GG_<ROLLE>` (global) und `DL_<RESSOURCE>_<R|M|F>` (domänenlokal)
- Generiertes Konzeptdokument: Ziele, Grundsätze, Namenskonvention, Gruppen, Matrix, Beantragung, Entzug, Rezertifizierung
- Export: Drucken/PDF, Markdown, JSON (Export und Import); Beispieldaten laden; Zurücksetzen
- Hell-/Dunkelmodus, responsiv ab 360 px, tastaturbedienbar

## Projektstruktur

```
index.html            Oberfläche
css/style.css         Design-Tokens, Komponenten, Druckansicht
js/app.js             Logik: Daten, Namenskonvention, Rendering, Export/Import
docs/PROJEKTPLAN.md   Anforderungen, Abnahmekriterien, fachliche Regeln, Abnahme
docs/DESIGN.md        Designsystem
docs/VALIDIERUNG.md   Prüfbericht und Korrekturen
.claude/agents/       Agenten-Definitionen für Claude Code
```

## Die 4 Agenten

Das Projekt wurde mit vier Subagenten in [Claude Code](https://claude.com/claude-code) erstellt. Die Definitionen liegen in
`.claude/agents/`:

| Agent | Datei | Aufgabe | Ergebnis |
|---|---|---|---|
| Projektmanager | `projektmanager.md` | Anforderungen, Abnahmekriterien, Abnahme | `docs/PROJEKTPLAN.md` |
| Designer | `designer.md` | Designsystem, Barrierefreiheit, Druck-Layout | `docs/DESIGN.md` |
| Webentwickler | `webentwickler.md` | Umsetzung, Behebung von Befunden | `index.html`, `css/`, `js/` |
| Validator | `validator.md` | Prüfung gegen Plan, Design, Code, WCAG, Fachlichkeit | `docs/VALIDIERUNG.md` |

**Nutzung in Claude Code:** Claude Code im Repo-Verzeichnis starten (`claude`). Die Agenten werden automatisch erkannt
(Übersicht mit `/agents`). Aufruf per Auftrag an Claude, z. B.:

```
Nutze den validator-Agenten, um die App erneut gegen docs/PROJEKTPLAN.md zu prüfen.
```

Empfohlene Reihenfolge: Projektmanager → Designer → Webentwickler → Validator → Webentwickler (Korrekturen) → Projektmanager (Abnahme).
