/* =========================================================================
   Domänen-Rechtekonzept – Anwendungslogik (Vanilla JS, ohne Module,
   lauffähig per file://).
   Inhalt:
     1  Konstanten & Hilfsfunktionen (Escaping, Normalisierung)
     2  Zustand, Speichern/Laden (localStorage)
     3  Ableitungen (Kürzel, Gruppen, Prüfungen)
     4  UI-Infrastruktur (Toasts, Dialog, Menü, Theme, Navigation)
     5  Schritt 1 Stammdaten
     6  Schritt 2–4 Rollen, Benutzer, Ressourcen
     7  Schritt 5 Matrix, Schritt 6 Gruppen
     8  Dokumentmodell → HTML und Markdown (Schritt 7)
     9  Export/Import, Beispieldaten, Zurücksetzen
    10  Start
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     1  Konstanten & Hilfsfunktionen
     --------------------------------------------------------------------- */
  var STORAGE_KEY = 'domaenen-rechtekonzept-v1';
  var THEME_KEY = 'domaenen-rechtekonzept-theme';
  var STEP_KEY = 'domaenen-rechtekonzept-schritt';
  var BACKUP_KEY = 'domaenen-rechtekonzept-v1-defekt';
  var APP_NAME = 'Domänen-Rechtekonzept';

  var STEPS = [
    { n: 1, name: 'Stammdaten', short: 'Stamm' },
    { n: 2, name: 'Rollen', short: 'Rollen' },
    { n: 3, name: 'Benutzer', short: 'Benutzer' },
    { n: 4, name: 'Ressourcen', short: 'Ressourcen' },
    { n: 5, name: 'Matrix', short: 'Matrix' },
    { n: 6, name: 'Gruppen', short: 'Gruppen' },
    { n: 7, name: 'Dokument & Export', short: 'Dokument' }
  ];

  var LEVELS = ['R', 'M', 'F'];
  var LEVEL_NAMES = { '': 'Kein Zugriff', R: 'Lesen', M: 'Ändern', F: 'Vollzugriff' };
  var LEVEL_SHORT = { '': '–', R: 'R', M: 'M', F: 'F' };
  var LEVEL_CLASS = { '': 'lvl-none', R: 'lvl-r', M: 'lvl-m', F: 'lvl-f' };
  var TYPES = { ordner: 'Ordner/Freigabe', drucker: 'Drucker', anwendung: 'Anwendung' };
  /* Konkrete Rechte je Typ und Stufe (Projektplan 3.2) */
  var PERMS = {
    ordner:    { R: 'NTFS: Lesen, Ausführen, Ordnerinhalt anzeigen', M: 'NTFS: Ändern', F: 'NTFS: Vollzugriff' },
    drucker:   { R: 'Drucken', M: 'Drucken + Dokumente verwalten', F: 'Drucker verwalten' },
    anwendung: { R: 'Benutzen', M: 'Benutzen + Daten bearbeiten', F: 'Administrieren' }
  };

  /** HTML-Escaping für alle Benutzereingaben (AK-26). */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(id) { return document.getElementById(id); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function formatDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '');
  }
  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function translit(s) {
    return String(s || '')
      .replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE')
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/ẞ/g, 'SS').replace(/ß/g, 'ss');
  }
  /** Kürzel-Normalisierung nach 3.3: Umlaute, Großbuchstaben, nur A–Z/0–9, max. 15. */
  function normalizeCode(s) {
    return translit(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
  }
  /** Teil eines Anmeldenamens: klein, nur a–z/0–9. */
  function normalizeLoginPart(s) {
    return translit(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function suggestLogin(vor, nach) {
    var a = normalizeLoginPart(vor), b = normalizeLoginPart(nach);
    return (a && b ? a + '.' + b : a + b).slice(0, 20);
  }
  /** Freie Eingabe eines Anmeldenamens bereinigen (klein, a–z 0–9 . - _). */
  function cleanLogin(s) {
    return translit(String(s || '').trim()).toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
  }
  function isValidFqdn(d) {
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d || '');
  }

  /* ---------------------------------------------------------------------
     2  Zustand und Persistenz
     --------------------------------------------------------------------- */
  function emptyState() {
    return {
      schemaVersion: 1,
      meta: { firma: '', domaene: '', netbios: '', verantwortlich: '', funktion: '',
              ersteller: '', version: '1.0', datum: todayISO(), rezertifizierungMonate: 6 },
      rollen: [], benutzer: [], ressourcen: [], matrix: {}
    };
  }

  var state = emptyState();
  var storageOk = true;
  var currentStep = 1;

  function storageAvailable() {
    try {
      var k = '__test__';
      window.localStorage.setItem(k, k);
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsRemove(k) { try { window.localStorage.removeItem(k); } catch (e) { /* ignorieren */ } }

  function setSaveStatus(ok) {
    var el = $('save-status');
    var text = ok ? 'Gespeichert' : 'Speichern nicht möglich';
    // V-09: Live-Region nur bei tatsächlicher Statusänderung beschreiben
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle('is-error', !ok);
  }
  /** Speichert den Zustand (AK-22). */
  function save() {
    if (!storageOk) { setSaveStatus(false); return; }
    var ok = lsSet(STORAGE_KEY, JSON.stringify(state));
    setSaveStatus(ok);
  }
  /**
   * Lädt den gespeicherten Stand. Ist er ungültig (V-04), wird der Rohwert unter
   * BACKUP_KEY gesichert, ein Hinweis angezeigt und nichts überschrieben, bis der
   * Benutzer selbst etwas ändert. Rückgabe: true = ok/leer, false = defekt.
   */
  function load() {
    var raw = lsGet(STORAGE_KEY);
    if (!raw) return true;
    var parsed = null;
    try { parsed = validateAndNormalize(JSON.parse(raw)); } catch (e) { parsed = null; }
    if (parsed) { state = parsed; return true; }
    lsSet(BACKUP_KEY, raw);
    $('storage-corrupt-hint').hidden = false;
    $('save-status').textContent = 'Noch nicht gespeichert';
    return false;
  }

  /**
   * Prüft importierte/gespeicherte Daten gegen Schema v1 und gibt eine bereinigte
   * Kopie zurück – oder null, wenn das Schema nicht passt (AK-20/21).
   */
  function validateAndNormalize(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    if (d.schemaVersion !== 1) return null;
    if (!d.meta || typeof d.meta !== 'object' || Array.isArray(d.meta)) return null;
    if (!Array.isArray(d.rollen) || !Array.isArray(d.benutzer) || !Array.isArray(d.ressourcen)) return null;
    if (d.matrix == null || typeof d.matrix !== 'object' || Array.isArray(d.matrix)) return null;
    function str(v) { return v == null ? '' : String(v); }
    function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
    var out = emptyState();
    var m = d.meta;
    ['firma', 'domaene', 'netbios', 'verantwortlich', 'funktion', 'ersteller', 'version', 'datum'].forEach(function (k) {
      if (m[k] != null) out.meta[k] = str(m[k]);
    });
    var rz = Number(m.rezertifizierungMonate);
    out.meta.rezertifizierungMonate = [3, 6, 12].indexOf(rz) >= 0 ? rz : 6;

    var ids = {};
    function okId(o) { return isObj(o) && typeof o.id === 'string' && o.id && !ids[o.id]; }
    for (var i = 0; i < d.rollen.length; i++) {
      var r = d.rollen[i];
      if (!okId(r)) return null;
      ids[r.id] = 1;
      out.rollen.push({ id: r.id, name: str(r.name), kuerzel: str(r.kuerzel), beschreibung: str(r.beschreibung) });
    }
    for (i = 0; i < d.benutzer.length; i++) {
      var u = d.benutzer[i];
      if (!okId(u)) return null;
      ids[u.id] = 1;
      out.benutzer.push({ id: u.id, vorname: str(u.vorname), nachname: str(u.nachname),
        anmeldename: str(u.anmeldename), rolleId: str(u.rolleId) });
    }
    for (i = 0; i < d.ressourcen.length; i++) {
      var s = d.ressourcen[i];
      if (!okId(s) || !TYPES.hasOwnProperty(s.typ)) return null;
      ids[s.id] = 1;
      out.ressourcen.push({ id: s.id, typ: s.typ, name: str(s.name), kuerzel: str(s.kuerzel),
        pfad: str(s.pfad), beschreibung: str(s.beschreibung), besitzerRolleId: str(s.besitzerRolleId) });
    }
    var roleIds = {}, resIds = {};
    out.rollen.forEach(function (x) { roleIds[x.id] = 1; });
    out.ressourcen.forEach(function (x) { resIds[x.id] = 1; });
    // Verwaiste Verweise bereinigen
    out.benutzer.forEach(function (x) { if (!roleIds[x.rolleId]) x.rolleId = ''; });
    out.ressourcen.forEach(function (x) { if (!roleIds[x.besitzerRolleId]) x.besitzerRolleId = ''; });
    for (var rid in d.matrix) {
      if (!Object.prototype.hasOwnProperty.call(d.matrix, rid)) continue;
      var row = d.matrix[rid];
      if (!isObj(row)) return null;
      for (var sid in row) {
        if (!Object.prototype.hasOwnProperty.call(row, sid)) continue;
        var v = row[sid];
        if (v === '' || v == null) continue;
        if (LEVELS.indexOf(v) < 0) return null;
        if (roleIds[rid] && resIds[sid]) {
          out.matrix[rid] = out.matrix[rid] || {};
          out.matrix[rid][sid] = v;
        }
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------------
     3  Ableitungen
     --------------------------------------------------------------------- */
  function roleById(id) { return state.rollen.filter(function (r) { return r.id === id; })[0] || null; }
  function resById(id) { return state.ressourcen.filter(function (r) { return r.id === id; })[0] || null; }
  function codeOf(o) { return normalizeCode(o.kuerzel) || normalizeCode(o.name) || 'OHNEKUERZEL'; }
  function ggName(role) { return 'GG_' + codeOf(role); }
  function dlName(res, lvl) { return 'DL_' + codeOf(res) + '_' + lvl; }
  function getLevel(roleId, resId) { return (state.matrix[roleId] && state.matrix[roleId][resId]) || ''; }
  function setLevel(roleId, resId, lvl) {
    if (!lvl) {
      if (state.matrix[roleId]) {
        delete state.matrix[roleId][resId];
        if (!Object.keys(state.matrix[roleId]).length) delete state.matrix[roleId];
      }
    } else {
      state.matrix[roleId] = state.matrix[roleId] || {};
      state.matrix[roleId][resId] = lvl;
    }
  }
  function usersOfRole(roleId) { return state.benutzer.filter(function (u) { return u.rolleId === roleId; }); }
  function fullName(u) { return (u.vorname + ' ' + u.nachname).trim(); }

  /** Liefert die Menge doppelter Kürzel in einer Liste. */
  function duplicateCodes(list) {
    var count = {}, dup = {};
    list.forEach(function (o) { var c = codeOf(o); count[c] = (count[c] || 0) + 1; });
    Object.keys(count).forEach(function (c) { if (count[c] > 1) dup[c] = true; });
    return dup;
  }
  function duplicateLogins() {
    var count = {}, dup = {};
    state.benutzer.forEach(function (u) { if (u.anmeldename) count[u.anmeldename] = (count[u.anmeldename] || 0) + 1; });
    Object.keys(count).forEach(function (c) { if (count[c] > 1) dup[c] = true; });
    return dup;
  }

  /** Globale Gruppen (R1): eine je Rolle, Mitglieder = Benutzer der Rolle. */
  function globalGroups() {
    return state.rollen.map(function (r) { return { name: ggName(r), role: r, members: usersOfRole(r.id) }; });
  }
  /** Domänenlokale Gruppen (R2/R3): nur verwendete, Mitglieder = globale Gruppen. */
  function localGroups() {
    var out = [];
    state.ressourcen.forEach(function (s) {
      LEVELS.forEach(function (lvl) {
        var roles = state.rollen.filter(function (r) { return getLevel(r.id, s.id) === lvl; });
        if (roles.length) out.push({ name: dlName(s, lvl), res: s, level: lvl, roles: roles });
      });
    });
    return out;
  }
  function assignmentCount() {
    var n = 0;
    state.rollen.forEach(function (r) { state.ressourcen.forEach(function (s) { if (getLevel(r.id, s.id)) n++; }); });
    return n;
  }
  function metaErrors() {
    var e = {};
    if (!state.meta.firma.trim()) e.firma = 'Fehler: Firmenname ist ein Pflichtfeld.';
    if (!state.meta.domaene.trim()) e.domaene = 'Fehler: AD-Domäne ist ein Pflichtfeld.';
    else if (!isValidFqdn(state.meta.domaene.trim()))
      e.domaene = 'Fehler: Bitte einen FQDN angeben, z. B. firma.local (nur a–z, 0–9, Bindestrich, Punkt).';
    return e;
  }
  /** Sammelt Konsistenzwarnungen für Dokument und Navigation. */
  function collectWarnings() {
    var w = [];
    var me = metaErrors();
    if (me.firma || (me.domaene && !state.meta.domaene.trim())) w.push('Firmenname und AD-Domäne sind Pflichtfelder und noch nicht vollständig erfasst.');
    else if (me.domaene) w.push('Die AD-Domäne „' + state.meta.domaene + '“ ist kein gültiger FQDN.');
    Object.keys(duplicateCodes(state.rollen)).forEach(function (c) { w.push('Das Rollen-Kürzel „' + c + '“ wird mehrfach verwendet (Gruppe GG_' + c + ' nicht eindeutig).'); });
    Object.keys(duplicateCodes(state.ressourcen)).forEach(function (c) { w.push('Das Ressourcen-Kürzel „' + c + '“ wird mehrfach verwendet (DL-Gruppen nicht eindeutig).'); });
    var noRole = state.benutzer.filter(function (u) { return !roleById(u.rolleId); });
    if (noRole.length) w.push(noRole.length + ' Benutzer ohne Rolle: ' + noRole.map(fullName).join(', ') + '.');
    Object.keys(duplicateLogins()).forEach(function (l) { w.push('Der Anmeldename „' + l + '“ ist mehrfach vergeben.'); });
    return w;
  }

  /* ---------------------------------------------------------------------
     4  UI-Infrastruktur
     --------------------------------------------------------------------- */
  /* Toasts (max. 3, 5 s, Pause bei Hover/Fokus; Fehler erst per „Schließen“) */
  function toast(msg, isError) {
    var region = isError ? $('toast-alerts') : $('toast-status');
    var all = document.querySelectorAll('.toast');
    if (all.length >= 3) all[0].remove();
    var t = document.createElement('div');
    t.className = 'toast' + (isError ? ' is-error' : '');
    var span = document.createElement('span');
    span.textContent = msg;
    t.appendChild(span);
    if (isError) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'btn'; b.textContent = 'Schließen';
      b.addEventListener('click', function () { t.remove(); });
      t.appendChild(b);
      region.appendChild(t);
      return;
    }
    region.appendChild(t);
    // Erfolgs-Toasts enthalten kein fokussierbares Element → Pause nur bei Hover (V-11)
    var remaining = 5000, started = 0, timer = null, running = false;
    function start() {
      if (running) return;
      running = true; started = Date.now();
      timer = setTimeout(function () { t.remove(); }, remaining);
    }
    function pause() {
      if (!running) return;
      running = false; clearTimeout(timer); remaining -= Date.now() - started;
    }
    t.addEventListener('mouseenter', pause);
    t.addEventListener('mouseleave', start);
    start();
  }

  /* Bestätigungsdialog (Promise<boolean>) */
  function confirmDialog(title, text, okLabel) {
    return new Promise(function (resolve) {
      var dlg = $('confirm-dialog');
      var prevFocus = document.activeElement;
      $('confirm-title').textContent = title;
      $('confirm-text').textContent = text;
      $('confirm-ok').textContent = okLabel;
      dlg.returnValue = '';
      function onClose() {
        dlg.removeEventListener('close', onClose);
        var ok = dlg.returnValue === 'ok';
        if (!ok && prevFocus && document.contains(prevFocus)) prevFocus.focus();
        resolve(ok);
      }
      dlg.addEventListener('close', onClose);
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
        $('confirm-cancel').focus();
      } else {
        // Fallback für sehr alte Browser
        dlg.removeEventListener('close', onClose);
        resolve(window.confirm(title + '\n' + text));
      }
    });
  }

  /* Menü „⋯“ */
  function initMenu() {
    var btn = $('menu-button'), list = $('menu-list');
    function items() { return Array.prototype.slice.call(list.querySelectorAll('.menu-item')); }
    function open() { list.hidden = false; btn.setAttribute('aria-expanded', 'true'); items()[0].focus(); }
    function close(focusBtn) { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); }
    btn.addEventListener('click', function () { if (list.hidden) open(); else close(false); });
    list.addEventListener('keydown', function (e) {
      var its = items(), i = its.indexOf(document.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); its[(i + 1) % its.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); its[(i - 1 + its.length) % its.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); its[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); its[its.length - 1].focus(); }
      else if (e.key === 'Tab') { close(false); }
    });
    document.addEventListener('click', function (e) {
      if (!list.hidden && !list.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(false);
    });
    list.addEventListener('click', function (e) {
      var item = e.target.closest('.menu-item');
      if (!item) return;
      close(true);
      var a = item.getAttribute('data-action');
      if (a === 'sample') loadSampleData();
      else if (a === 'import') $('import-file').click();
      else if (a === 'export-json') exportJson();
      else if (a === 'reset') resetAll();
      else if (a === 'theme-system') setTheme('system');
      else if (a === 'theme-light') setTheme('light');
      else if (a === 'theme-dark') setTheme('dark');
    });
  }

  /* Theme (AK-28): system → hell → dunkel */
  var THEME_LABEL = { system: 'System', light: 'Hell', dark: 'Dunkel' };
  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  }
  function setTheme(t) {
    if (t === 'system') { document.documentElement.removeAttribute('data-theme'); lsRemove(THEME_KEY); }
    else { document.documentElement.setAttribute('data-theme', t); lsSet(THEME_KEY, t); }
    updateThemeUi();
  }
  function updateThemeUi() {
    var t = currentTheme();
    $('theme-label').textContent = THEME_LABEL[t];
    $('theme-toggle').setAttribute('aria-label', 'Darstellung: ' + THEME_LABEL[t] + ' (umschalten)');
    ['system', 'light', 'dark'].forEach(function (k) {
      var el = document.querySelector('[data-action="theme-' + k + '"]');
      el.setAttribute('aria-pressed', String(k === t));
    });
  }

  /* Schritt-Navigation */
  function renderNav() {
    var dupR = Object.keys(duplicateCodes(state.rollen)).length;
    var dupS = Object.keys(duplicateCodes(state.ressourcen)).length;
    var noRole = state.benutzer.some(function (u) { return !roleById(u.rolleId); }) || Object.keys(duplicateLogins()).length;
    var info = {
      1: { err: Object.keys(metaErrors()).length > 0 },
      2: { count: state.rollen.length, err: dupR > 0 },
      3: { count: state.benutzer.length, err: !!noRole },
      4: { count: state.ressourcen.length, err: dupS > 0 },
      5: { count: assignmentCount() },
      6: { count: state.rollen.length + localGroups().length }
    };
    $('steps-list').innerHTML = STEPS.map(function (s) {
      var i = info[s.n] || {};
      var badges = '';
      if (i.count) badges += '<span class="badge badge-count">' + i.count + '<span class="sr-only"> Einträge</span></span>';
      if (i.err) badges += '<span class="badge badge-error" role="img" aria-label="Fehler vorhanden">!</span>';
      return '<li><button type="button" class="step-link" data-goto="' + s.n + '"' +
        (s.n === currentStep ? ' aria-current="step"' : '') + '>' +
        '<span class="step-num" aria-hidden="true">' + s.n + '</span>' +
        '<span class="step-name-long">' + esc(s.name) + '</span>' +
        '<span class="step-name-short">' + esc(s.short) + '</span>' +
        '<span class="sr-only"> (Schritt ' + s.n + ' von 7)</span>' +
        (badges ? '<span class="step-badges">' + badges + '</span>' : '') +
        '</button></li>';
    }).join('');
  }

  function renderFooter() {
    var prev = STEPS[currentStep - 2], next = STEPS[currentStep];
    $('step-footer').innerHTML =
      (prev ? '<button type="button" class="btn btn-secondary" data-goto="' + prev.n + '">← Zurück</button>' : '') +
      (next ? '<button type="button" class="btn btn-primary btn-next" data-goto="' + next.n + '">Weiter: ' + esc(next.name) + ' →</button>' : '');
  }

  function goToStep(n, focus) {
    n = Math.min(7, Math.max(1, Number(n) || 1));
    currentStep = n;
    lsSet(STEP_KEY, String(n));
    document.querySelectorAll('.step').forEach(function (sec) { sec.hidden = Number(sec.getAttribute('data-step')) !== n; });
    document.title = STEPS[n - 1].name + ' – ' + APP_NAME;
    renderAll();
    var active = document.querySelector('.step-link[aria-current="step"]');
    // V-02: Leiste direkt scrollen statt scrollIntoView (verschiebt sonst den Tab-Startpunkt)
    var ol = $('steps-list');
    if (active && ol.scrollWidth > ol.clientWidth) {
      ol.scrollLeft = active.parentNode.offsetLeft - (ol.clientWidth - active.offsetWidth) / 2;
    }
    if (focus) {
      window.scrollTo(0, 0);
      $('h-step-' + n).focus();
    }
  }

  /** Markiert Tabellen-Container als scrollbar (Schatten-Hinweis). */
  function updateScrollHints() {
    document.querySelectorAll('.table-wrap').forEach(function (w) {
      w.classList.toggle('is-scrollable', w.scrollWidth > w.clientWidth + 1);
    });
  }

  /** Zeichnet alle dynamischen Bereiche neu. */
  function renderAll() {
    renderNav();
    renderFooter();
    renderMetaErrors();
    renderRoles();
    renderUsers();
    renderResources();
    renderMatrix();
    renderGroups();
    if (currentStep === 7) renderDoc();
    updateScrollHints();
  }
  /** Nach jeder Datenänderung: speichern + neu zeichnen. */
  function changed() { save(); renderAll(); }

  function hintHtml(kind, prefix, items) {
    if (!items.length) return '';
    var body = items.length === 1 ? ' ' + esc(items[0]) :
      '<ul>' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
    return '<div class="hint hint-' + kind + '"><strong>' + prefix + '</strong>' + body + '</div>';
  }
  function setFieldError(inputId, msg) {
    var input = $(inputId), err = $(inputId + '-err');
    if (msg) { input.setAttribute('aria-invalid', 'true'); err.textContent = msg; err.hidden = false; }
    else { input.removeAttribute('aria-invalid'); err.textContent = ''; err.hidden = true; }
  }
  /** Setzt innerHTML nur bei Änderung (verhindert wiederholte Screenreader-Ansagen). */
  function setHtmlIfChanged(el, html) { if (el.innerHTML !== html) el.innerHTML = html; }
  function emptyCard(title, text, btnLabel, btnAttr) {
    return '<div class="card empty-state"><p class="empty-title">' + esc(title) + '</p>' +
      '<p class="empty-text">' + esc(text) + '</p>' +
      (btnLabel ? '<div class="form-actions"><button type="button" class="btn btn-primary" ' + btnAttr + '>' + esc(btnLabel) + '</button></div>' : '') +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     5  Schritt 1 – Stammdaten
     --------------------------------------------------------------------- */
  var META_FIELDS = { firma: 'm-firma', domaene: 'm-domaene', netbios: 'm-netbios', verantwortlich: 'm-verantwortlich',
    funktion: 'm-funktion', ersteller: 'm-ersteller', version: 'm-version', datum: 'm-datum', rezertifizierungMonate: 'm-rezert' };

  function fillMetaForm() {
    Object.keys(META_FIELDS).forEach(function (k) { $(META_FIELDS[k]).value = String(state.meta[k]); });
  }
  function renderMetaErrors() {
    var e = metaErrors();
    setFieldError('m-firma', e.firma);
    setFieldError('m-domaene', e.domaene);
    var items = [];
    if (e.firma || (e.domaene && !state.meta.domaene.trim())) items.push('Firmenname und AD-Domäne sind Pflichtfelder.');
    if (e.domaene && state.meta.domaene.trim()) items.push('Bitte einen FQDN angeben, z. B. firma.local (nur a–z, 0–9, Bindestrich, Punkt).');
    setHtmlIfChanged($('meta-alert'), hintHtml('danger', 'Fehler:', items));
  }
  function initMeta() {
    Object.keys(META_FIELDS).forEach(function (k) {
      var el = $(META_FIELDS[k]);
      el.addEventListener('input', function () {
        state.meta[k] = k === 'rezertifizierungMonate' ? Number(el.value) : el.value;
        save();
        renderNav();
      });
      el.addEventListener('change', function () {
        if (k === 'domaene') { el.value = el.value.trim().toLowerCase(); state.meta.domaene = el.value; }
        if (k === 'netbios') { el.value = el.value.trim().toUpperCase(); state.meta.netbios = el.value; }
        if (k === 'rezertifizierungMonate') state.meta[k] = Number(el.value);
        changed();
      });
    });
    $('meta-form').addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* ---------------------------------------------------------------------
     6  Schritte 2–4 – Rollen, Benutzer, Ressourcen
     --------------------------------------------------------------------- */
  var editing = { role: null, user: null, res: null };

  /* ---- Rollen ---- */
  function roleFormCode() { return normalizeCode($('r-kuerzel').value) || normalizeCode($('r-name').value); }
  function updateRolePreview() {
    var c = roleFormCode();
    $('r-preview').innerHTML = c ? 'Gruppe: <code>GG_' + esc(c) + '</code>' : '';
    var clash = c && state.rollen.some(function (r) { return r.id !== editing.role && codeOf(r) === c; });
    setFieldError('r-kuerzel', clash ? 'Fehler: Das Kürzel „' + c + '“ wird bereits verwendet.' : '');
  }
  function resetRoleForm() {
    editing.role = null;
    $('role-form').reset();
    $('role-form-title').textContent = 'Neu anlegen';
    $('role-submit').textContent = 'Hinzufügen';
    $('role-cancel').hidden = true;
    setFieldError('r-name', '');
    updateRolePreview();
  }
  function editRole(id) {
    var r = roleById(id); if (!r) return;
    editing.role = id;
    $('r-name').value = r.name; $('r-kuerzel').value = r.kuerzel; $('r-beschreibung').value = r.beschreibung;
    $('role-form-title').textContent = 'Rolle bearbeiten';
    $('role-submit').textContent = 'Änderungen speichern';
    $('role-cancel').hidden = false;
    setFieldError('r-name', '');
    updateRolePreview();
    $('r-name').focus();
  }
  function submitRole(e) {
    e.preventDefault();
    var name = $('r-name').value.trim();
    if (!name) { setFieldError('r-name', 'Fehler: Bitte einen Namen angeben.'); $('r-name').focus(); return; }
    setFieldError('r-name', '');
    var data = { name: name, kuerzel: roleFormCode(), beschreibung: $('r-beschreibung').value.trim() };
    if (editing.role) { Object.assign(roleById(editing.role), data); toast('Gespeichert'); }
    else { state.rollen.push(Object.assign({ id: uid('r') }, data)); toast('Rolle „' + name + '“ hinzugefügt'); }
    resetRoleForm();
    changed();
    $('r-name').focus();
  }
  async function deleteRole(id) {
    var r = roleById(id); if (!r) return;
    var ok = await confirmDialog('Rolle „' + r.name + '“ löschen?', 'Betroffene Benutzer werden als „ohne Rolle“ markiert.', 'Endgültig löschen');
    if (!ok) return;
    var idx = state.rollen.indexOf(r);
    state.rollen.splice(idx, 1);
    state.benutzer.forEach(function (u) { if (u.rolleId === id) u.rolleId = ''; });
    state.ressourcen.forEach(function (s) { if (s.besitzerRolleId === id) s.besitzerRolleId = ''; });
    delete state.matrix[id];
    if (editing.role === id) resetRoleForm();
    changed();
    focusAfterDelete('roles-list', idx, 'r-name');
  }
  function renderRoles() {
    var dup = duplicateCodes(state.rollen);
    var warn = Object.keys(dup).map(function (c) { return 'Das Kürzel „' + c + '“ wird bereits verwendet.'; });
    setHtmlIfChanged($('roles-alert'), hintHtml('danger', 'Fehler:', warn));
    if (!state.rollen.length) {
      $('roles-list').innerHTML = emptyCard('Noch keine Rollen angelegt.', 'Lege Abteilungen oder Funktionen an, z. B. Vertrieb oder Buchhaltung.', 'Erste Rolle anlegen', 'data-focus="r-name"');
      return;
    }
    $('roles-list').innerHTML = '<div class="table-wrap"><table><caption>Rollen (' + state.rollen.length + ')</caption>' +
      '<thead><tr><th scope="col">Name</th><th scope="col">Kürzel</th><th scope="col">Globale Gruppe</th><th scope="col">Beschreibung</th><th scope="col" class="num">Benutzer</th><th scope="col"><span class="sr-only">Aktionen</span></th></tr></thead><tbody>' +
      state.rollen.map(function (r) {
        var c = codeOf(r), isDup = dup[c];
        return '<tr data-row' + (isDup ? ' class="row-error"' : '') + '><th scope="row">' + esc(r.name) + '</th>' +
          '<td><div class="cell-stack"><code>' + esc(c) + '</code>' + (isDup ? '<span class="badge badge-error">Doppelt</span>' : '') + '</div></td>' +
          '<td><span class="badge badge-gg"><code>' + esc(ggName(r)) + '</code></span></td>' +
          '<td>' + esc(r.beschreibung) + '</td>' +
          '<td class="num">' + usersOfRole(r.id).length + '</td>' +
          '<td class="actions-cell"><button type="button" class="btn btn-ghost" data-edit-role="' + esc(r.id) + '" aria-label="Rolle ' + esc(r.name) + ' bearbeiten">Bearbeiten</button>' +
          '<button type="button" class="btn btn-ghost is-danger" data-del-role="' + esc(r.id) + '" aria-label="Rolle ' + esc(r.name) + ' löschen">Löschen</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /** Fokus nach Löschen auf nächste Zeile bzw. Leerzustand-Button setzen. */
  function focusAfterDelete(listId, idx, fallbackId) {
    var list = $(listId);
    var rows = list.querySelectorAll('tr[data-row]');
    var row = rows[Math.min(idx, rows.length - 1)];
    var target = row ? row.querySelector('button') : list.querySelector('.empty-state button');
    (target || $(fallbackId)).focus();
  }

  /* ---- Benutzer ---- */
  var loginTouched = false;
  function fillRoleSelect(sel, emptyLabel, value) {
    sel.innerHTML = '<option value="">' + esc(emptyLabel) + '</option>' +
      state.rollen.map(function (r) { return '<option value="' + esc(r.id) + '">' + esc(r.name) + ' (' + esc(ggName(r)) + ')</option>'; }).join('');
    sel.value = roleById(value) ? value : '';
  }
  function resetUserForm() {
    editing.user = null; loginTouched = false;
    $('user-form').reset();
    $('user-form-title').textContent = 'Neu anlegen';
    $('user-submit').textContent = 'Hinzufügen';
    $('user-cancel').hidden = true;
    ['u-vorname', 'u-nachname', 'u-anmeldename', 'u-rolle'].forEach(function (id) { setFieldError(id, ''); });
    fillRoleSelect($('u-rolle'), '– Rolle wählen –', '');
  }
  function editUser(id) {
    var u = state.benutzer.filter(function (x) { return x.id === id; })[0]; if (!u) return;
    editing.user = id; loginTouched = true;
    $('u-vorname').value = u.vorname; $('u-nachname').value = u.nachname; $('u-anmeldename').value = u.anmeldename;
    fillRoleSelect($('u-rolle'), '– Rolle wählen –', u.rolleId);
    $('user-form-title').textContent = 'Benutzer bearbeiten';
    $('user-submit').textContent = 'Änderungen speichern';
    $('user-cancel').hidden = false;
    $('u-vorname').focus();
  }
  function submitUser(e) {
    e.preventDefault();
    var v = $('u-vorname').value.trim(), n = $('u-nachname').value.trim();
    var login = cleanLogin($('u-anmeldename').value) || suggestLogin(v, n);
    var rid = $('u-rolle').value;
    var errs = {
      'u-vorname': v ? '' : 'Fehler: Bitte einen Vornamen angeben.',
      'u-nachname': n ? '' : 'Fehler: Bitte einen Nachnamen angeben.',
      'u-anmeldename': login ? '' : 'Fehler: Bitte einen Anmeldenamen angeben.',
      'u-rolle': roleById(rid) ? '' : (state.rollen.length ? 'Fehler: Bitte eine Rolle wählen.' : 'Fehler: Lege zuerst eine Rolle an (Schritt 2).')
    };
    var first = null;
    Object.keys(errs).forEach(function (id) { setFieldError(id, errs[id]); if (errs[id] && !first) first = id; });
    if (first) { $(first).focus(); return; }
    var data = { vorname: v, nachname: n, anmeldename: login, rolleId: rid };
    if (editing.user) {
      Object.assign(state.benutzer.filter(function (x) { return x.id === editing.user; })[0], data);
      toast('Gespeichert');
    } else { state.benutzer.push(Object.assign({ id: uid('u') }, data)); toast('Benutzer „' + v + ' ' + n + '“ hinzugefügt'); }
    resetUserForm();
    changed();
    $('u-vorname').focus();
  }
  async function deleteUser(id) {
    var u = state.benutzer.filter(function (x) { return x.id === id; })[0]; if (!u) return;
    var ok = await confirmDialog('Benutzer „' + fullName(u) + '“ löschen?', 'Der Benutzer wird aus dem Konzept entfernt.', 'Endgültig löschen');
    if (!ok) return;
    var idx = state.benutzer.indexOf(u);
    state.benutzer.splice(idx, 1);
    if (editing.user === id) resetUserForm();
    changed();
    focusAfterDelete('users-list', idx, 'u-vorname');
  }
  function renderUsers() {
    // Rollenauswahl aktuell halten, ohne laufende Eingabe zu verlieren
    var sel = $('u-rolle'), keep = sel.value;
    fillRoleSelect(sel, '– Rolle wählen –', keep);
    var noRole = state.benutzer.filter(function (u) { return !roleById(u.rolleId); });
    var dupL = duplicateLogins();
    var items = [];
    if (!state.rollen.length) items.push('Benutzer brauchen eine Rolle. Lege zuerst Rollen an (Schritt 2).');
    if (noRole.length) items.push(noRole.length + ' Benutzer ohne Rolle – bitte eine Rolle zuweisen.');
    Object.keys(dupL).forEach(function (l) { items.push('Der Anmeldename „' + l + '“ ist mehrfach vergeben.'); });
    setHtmlIfChanged($('users-alert'), hintHtml('warning', 'Warnung:', items));
    if (!state.benutzer.length) {
      $('users-list').innerHTML = emptyCard('Noch keine Benutzer angelegt.', 'Benutzer brauchen eine Rolle. Lege zuerst Rollen an.', 'Ersten Benutzer anlegen', 'data-focus="u-vorname"');
      return;
    }
    $('users-list').innerHTML = '<div class="table-wrap"><table><caption>Benutzer (' + state.benutzer.length + ')</caption>' +
      '<thead><tr><th scope="col">Name</th><th scope="col">Anmeldename</th><th scope="col">Rolle</th><th scope="col">Globale Gruppe</th><th scope="col"><span class="sr-only">Aktionen</span></th></tr></thead><tbody>' +
      state.benutzer.map(function (u) {
        var r = roleById(u.rolleId);
        return '<tr data-row' + (!r ? ' class="row-error"' : '') + '><th scope="row">' + esc(fullName(u)) + '</th>' +
          '<td><div class="cell-stack"><code>' + esc(u.anmeldename) + '</code>' + (dupL[u.anmeldename] ? '<span class="badge badge-error">Doppelt</span>' : '') + '</div></td>' +
          '<td>' + (r ? esc(r.name) : '<span class="badge badge-warning">Ohne Rolle</span>') + '</td>' +
          '<td>' + (r ? '<span class="badge badge-gg"><code>' + esc(ggName(r)) + '</code></span>' : '–') + '</td>' +
          '<td class="actions-cell"><button type="button" class="btn btn-ghost" data-edit-user="' + esc(u.id) + '" aria-label="Benutzer ' + esc(fullName(u)) + ' bearbeiten">Bearbeiten</button>' +
          '<button type="button" class="btn btn-ghost is-danger" data-del-user="' + esc(u.id) + '" aria-label="Benutzer ' + esc(fullName(u)) + ' löschen">Löschen</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---- Ressourcen ---- */
  function resFormCode() { return normalizeCode($('s-kuerzel').value) || normalizeCode($('s-name').value); }
  function updateResPreview() {
    var c = resFormCode();
    $('s-preview').innerHTML = c ? 'Gruppen: ' + LEVELS.map(function (l) { return '<code>DL_' + esc(c) + '_' + l + '</code>'; }).join(', ') : '';
    var clash = c && state.ressourcen.some(function (s) { return s.id !== editing.res && codeOf(s) === c; });
    setFieldError('s-kuerzel', clash ? 'Fehler: Das Kürzel „' + c + '“ wird bereits verwendet.' : '');
  }
  function resetResForm() {
    editing.res = null;
    $('res-form').reset();
    $('res-form-title').textContent = 'Neu anlegen';
    $('res-submit').textContent = 'Hinzufügen';
    $('res-cancel').hidden = true;
    setFieldError('s-name', '');
    fillRoleSelect($('s-besitzer'), '– keine Angabe –', '');
    updateResPreview();
  }
  function editRes(id) {
    var s = resById(id); if (!s) return;
    editing.res = id;
    $('s-typ').value = s.typ; $('s-name').value = s.name; $('s-kuerzel').value = s.kuerzel;
    $('s-pfad').value = s.pfad; $('s-beschreibung').value = s.beschreibung;
    fillRoleSelect($('s-besitzer'), '– keine Angabe –', s.besitzerRolleId);
    $('res-form-title').textContent = 'Ressource bearbeiten';
    $('res-submit').textContent = 'Änderungen speichern';
    $('res-cancel').hidden = false;
    setFieldError('s-name', '');
    updateResPreview();
    $('s-typ').focus();
  }
  function submitRes(e) {
    e.preventDefault();
    var name = $('s-name').value.trim();
    if (!name) { setFieldError('s-name', 'Fehler: Bitte einen Namen angeben.'); $('s-name').focus(); return; }
    setFieldError('s-name', '');
    var data = { typ: $('s-typ').value, name: name, kuerzel: resFormCode(), pfad: $('s-pfad').value.trim(),
      beschreibung: $('s-beschreibung').value.trim(), besitzerRolleId: $('s-besitzer').value };
    if (editing.res) { Object.assign(resById(editing.res), data); toast('Gespeichert'); }
    else { state.ressourcen.push(Object.assign({ id: uid('s') }, data)); toast('Ressource „' + name + '“ hinzugefügt'); }
    resetResForm();
    changed();
    $('s-typ').focus();
  }
  async function deleteRes(id) {
    var s = resById(id); if (!s) return;
    var ok = await confirmDialog('Ressource „' + s.name + '“ löschen?', 'Alle Berechtigungen auf diese Ressource werden aus der Matrix entfernt.', 'Endgültig löschen');
    if (!ok) return;
    var idx = state.ressourcen.indexOf(s);
    state.ressourcen.splice(idx, 1);
    Object.keys(state.matrix).forEach(function (rid) { setLevel(rid, id, ''); });
    if (editing.res === id) resetResForm();
    changed();
    focusAfterDelete('res-list', idx, 's-typ');
  }
  function renderResources() {
    var sel = $('s-besitzer'), keep = sel.value;
    fillRoleSelect(sel, '– keine Angabe –', keep);
    var dup = duplicateCodes(state.ressourcen);
    var warn = Object.keys(dup).map(function (c) { return 'Das Kürzel „' + c + '“ wird bereits verwendet.'; });
    setHtmlIfChanged($('res-alert'), hintHtml('danger', 'Fehler:', warn));
    if (!state.ressourcen.length) {
      $('res-list').innerHTML = emptyCard('Noch keine Ressourcen erfasst.', 'Erfasse Freigaben, Drucker und Anwendungen.', 'Erste Ressource anlegen', 'data-focus="s-typ"');
      return;
    }
    $('res-list').innerHTML = '<div class="table-wrap"><table><caption>Ressourcen (' + state.ressourcen.length + ')</caption>' +
      '<thead><tr><th scope="col">Name</th><th scope="col">Typ</th><th scope="col">Kürzel</th><th scope="col">Pfad/UNC</th><th scope="col">Besitzer</th><th scope="col">Mögliche DL-Gruppen</th><th scope="col"><span class="sr-only">Aktionen</span></th></tr></thead><tbody>' +
      state.ressourcen.map(function (s) {
        var c = codeOf(s), isDup = dup[c], owner = roleById(s.besitzerRolleId);
        return '<tr data-row' + (isDup ? ' class="row-error"' : '') + '><th scope="row">' + esc(s.name) +
          (s.beschreibung ? '<br><span class="help">' + esc(s.beschreibung) + '</span>' : '') + '</th>' +
          '<td><span class="badge">' + esc(TYPES[s.typ]) + '</span></td>' +
          '<td><div class="cell-stack"><code>' + esc(c) + '</code>' + (isDup ? '<span class="badge badge-error">Doppelt</span>' : '') + '</div></td>' +
          '<td><code>' + esc(s.pfad) + '</code></td>' +
          '<td>' + (owner ? esc(owner.name) : '–') + '</td>' +
          '<td><div class="cell-stack">' + LEVELS.map(function (l) { return '<span class="badge badge-dl"><code>' + esc(dlName(s, l)) + '</code></span>'; }).join('') + '</div></td>' +
          '<td class="actions-cell"><button type="button" class="btn btn-ghost" data-edit-res="' + esc(s.id) + '" aria-label="Ressource ' + esc(s.name) + ' bearbeiten">Bearbeiten</button>' +
          '<button type="button" class="btn btn-ghost is-danger" data-del-res="' + esc(s.id) + '" aria-label="Ressource ' + esc(s.name) + ' löschen">Löschen</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function initCrud() {
    $('role-form').addEventListener('submit', submitRole);
    $('role-cancel').addEventListener('click', function () { resetRoleForm(); $('r-name').focus(); });
    $('r-name').addEventListener('input', updateRolePreview);
    $('r-kuerzel').addEventListener('input', updateRolePreview);

    $('user-form').addEventListener('submit', submitUser);
    $('user-cancel').addEventListener('click', function () { resetUserForm(); $('u-vorname').focus(); });
    function suggest() { if (!loginTouched) $('u-anmeldename').value = suggestLogin($('u-vorname').value, $('u-nachname').value); }
    $('u-vorname').addEventListener('input', suggest);
    $('u-nachname').addEventListener('input', suggest);
    $('u-anmeldename').addEventListener('input', function () { loginTouched = $('u-anmeldename').value !== ''; });

    $('res-form').addEventListener('submit', submitRes);
    $('res-cancel').addEventListener('click', function () { resetResForm(); $('s-typ').focus(); });
    $('s-name').addEventListener('input', updateResPreview);
    $('s-kuerzel').addEventListener('input', updateResPreview);

    // Esc bricht Bearbeiten ab
    [['role-form', function () { resetRoleForm(); $('r-name').focus(); }],
     ['user-form', function () { resetUserForm(); $('u-vorname').focus(); }],
     ['res-form', function () { resetResForm(); $('s-typ').focus(); }]].forEach(function (p) {
      $(p[0]).addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); p[1](); } });
    });

    // Delegierte Klicks in Listen und Leerzuständen
    document.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a;
      if ((a = b.getAttribute('data-goto'))) goToStep(a, true);
      else if ((a = b.getAttribute('data-focus'))) $(a).focus();
      else if ((a = b.getAttribute('data-edit-role'))) editRole(a);
      else if ((a = b.getAttribute('data-del-role'))) deleteRole(a);
      else if ((a = b.getAttribute('data-edit-user'))) editUser(a);
      else if ((a = b.getAttribute('data-del-user'))) deleteUser(a);
      else if ((a = b.getAttribute('data-edit-res'))) editRes(a);
      else if ((a = b.getAttribute('data-del-res'))) deleteRes(a);
    });
  }

  /* ---------------------------------------------------------------------
     7  Schritt 5 Matrix, Schritt 6 Gruppen
     --------------------------------------------------------------------- */
  function legendHtml() {
    return '<div class="legend" role="group" aria-label="Legende">' + ['', 'R', 'M', 'F'].map(function (l) {
      return '<span class="chip ' + LEVEL_CLASS[l] + '">' + LEVEL_SHORT[l] + ' ' + LEVEL_NAMES[l] + '</span>';
    }).join('') + '</div><p class="help">Standard ist „Kein Zugriff“.</p>';
  }
  function renderMatrix() {
    var area = $('matrix-area');
    if (currentStep !== 5) { area.innerHTML = ''; return; }
    if (!state.rollen.length || !state.ressourcen.length) {
      area.innerHTML = '<div class="card empty-state"><p class="empty-title">Die Matrix braucht mindestens eine Rolle und eine Ressource.</p>' +
        '<div class="form-actions"><button type="button" class="btn btn-primary" data-goto="' + (state.rollen.length ? 4 : 2) + '">' +
        (state.rollen.length ? 'Zu Ressourcen' : 'Zu Rollen') + '</button>' +
        '<button type="button" class="btn btn-secondary" data-goto="' + (state.rollen.length ? 2 : 4) + '">' +
        (state.rollen.length ? 'Zu Rollen' : 'Zu Ressourcen') + '</button></div></div>';
      return;
    }
    // Fokus merken, damit Neuzeichnen die Tastaturbedienung nicht unterbricht
    var active = document.activeElement, keyFocus = active && active.getAttribute && active.getAttribute('data-cell');
    var opts = ['', 'R', 'M', 'F'];
    var html = legendHtml() + '<div class="table-wrap"><table class="matrix"><caption class="sr-only">Berechtigungsmatrix: Rollen (Zeilen) und Ressourcen (Spalten)</caption><thead><tr><th scope="col">Rolle \\ Ressource</th>' +
      state.ressourcen.map(function (s) {
        return '<th scope="col"><div class="res-head"><span>' + esc(s.name) + '</span><span class="badge">' + esc(TYPES[s.typ]) + '</span><code>' + esc(codeOf(s)) + '</code></div></th>';
      }).join('') + '</tr></thead><tbody>' +
      state.rollen.map(function (r) {
        return '<tr><th scope="row">' + esc(r.name) + '<br><code class="help">' + esc(ggName(r)) + '</code></th>' +
          state.ressourcen.map(function (s) {
            var lvl = getLevel(r.id, s.id), key = r.id + '|' + s.id;
            return '<td><select class="' + LEVEL_CLASS[lvl] + '" data-cell="' + esc(key) + '" aria-label="' + esc(r.name) + ' – ' + esc(s.name) + '">' +
              opts.map(function (o) {
                return '<option value="' + o + '"' + (o === lvl ? ' selected' : '') + '>' + LEVEL_SHORT[o] + ' ' + LEVEL_NAMES[o] + '</option>';
              }).join('') + '</select></td>';
          }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    var n = assignmentCount(), dl = localGroups().length;
    html += '<p class="matrix-summary" aria-live="polite">' + n + (n === 1 ? ' Zuweisung' : ' Zuweisungen') + ' · ' + dl + ' DL-' + (dl === 1 ? 'Gruppe wird' : 'Gruppen werden') + ' erzeugt</p>';
    area.innerHTML = html;
    if (keyFocus) {
      var el = area.querySelector('select[data-cell="' + (window.CSS && CSS.escape ? CSS.escape(keyFocus) : keyFocus) + '"]');
      if (el) el.focus();
    }
  }
  function initMatrix() {
    var area = $('matrix-area');
    area.addEventListener('change', function (e) {
      var sel = e.target.closest('select[data-cell]'); if (!sel) return;
      var p = sel.getAttribute('data-cell').split('|');
      setLevel(p[0], p[1], sel.value);
      save();
      // Nur Klasse/Zähler aktualisieren statt neu zu zeichnen (Fokus bleibt stabil)
      sel.className = LEVEL_CLASS[sel.value];
      var n = assignmentCount(), dl = localGroups().length;
      var sum = area.querySelector('.matrix-summary');
      if (sum) sum.textContent = n + (n === 1 ? ' Zuweisung' : ' Zuweisungen') + ' · ' + dl + ' DL-' + (dl === 1 ? 'Gruppe wird' : 'Gruppen werden') + ' erzeugt';
      renderNav();
    });
    area.addEventListener('focusin', function (e) {
      var sel = e.target;
      if (!sel.matches('select[data-cell]')) return;
      try { sel.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (x) { /* alt */ }
      // V-03: Zelle nicht unter der sticky Rollenspalte verstecken
      var wrap = sel.closest('.table-wrap'), th = sel.closest('tr').querySelector('th[scope="row"]');
      if (!wrap || !th) return;
      var cell = sel.parentNode.getBoundingClientRect(), stickyRight = th.getBoundingClientRect().right;
      if (cell.left < stickyRight) wrap.scrollLeft -= (stickyRight - cell.left);
      var wrapRight = wrap.getBoundingClientRect().right;
      if (cell.right > wrapRight) wrap.scrollLeft += (cell.right - wrapRight);
    });
  }

  function renderGroups() {
    var area = $('groups-area');
    area.innerHTML = '';
    if (currentStep !== 6) return;
    var gg = globalGroups(), dl = localGroups();
    if (!dl.length) {
      area.innerHTML = '<div class="card empty-state"><p class="empty-title">Noch keine Gruppen abgeleitet. Vergib in der Matrix mindestens eine Berechtigung.</p>' +
        '<div class="form-actions"><button type="button" class="btn btn-primary" data-goto="5">Zur Matrix</button></div></div>';
      if (!gg.length) return;
    }
    var html = '<div class="hint"><strong>Hinweis:</strong> Benutzer sind nur Mitglied ihrer globalen Gruppe; globale Gruppen sind Mitglied der domänenlokalen Gruppen. Rechte (ACL) erhalten ausschließlich DL-Gruppen. „Kein Zugriff“ erzeugt keine Gruppe.</div>';
    html += '<h2>Globale Gruppen (GG)</h2><div class="table-wrap"><table><caption class="sr-only">Globale Gruppen mit Benutzer-Mitgliedern</caption><thead><tr><th scope="col">Gruppe</th><th scope="col">Bereich/Typ</th><th scope="col">Rolle</th><th scope="col">Mitglieder (Benutzer)</th></tr></thead><tbody>' +
      gg.map(function (g) {
        return '<tr><th scope="row"><code>' + esc(g.name) + '</code></th><td>Global / Sicherheit</td><td>' + esc(g.role.name) + '</td><td>' +
          (g.members.length ? g.members.map(function (u) { return esc(fullName(u)) + ' (<code>' + esc(u.anmeldename) + '</code>)'; }).join('<br>') : '<span class="help">keine Mitglieder</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    if (dl.length) {
      html += '<h2>Domänenlokale Gruppen (DL)</h2><div class="table-wrap"><table><caption class="sr-only">Domänenlokale Gruppen mit GG-Mitgliedern</caption><thead><tr><th scope="col">Gruppe</th><th scope="col">Bereich/Typ</th><th scope="col">Ressource</th><th scope="col">Stufe</th><th scope="col">Mitglieder (GG)</th></tr></thead><tbody>' +
        dl.map(function (g) {
          return '<tr><th scope="row"><code>' + esc(g.name) + '</code></th><td>Lokal (in Domäne) / Sicherheit</td><td>' + esc(g.res.name) +
            (g.res.pfad ? '<br><code class="help">' + esc(g.res.pfad) + '</code>' : '') + '</td>' +
            '<td><span class="chip ' + LEVEL_CLASS[g.level] + '">' + g.level + ' ' + LEVEL_NAMES[g.level] + '</span><br><span class="help">' + esc(PERMS[g.res.typ][g.level]) + '</span></td>' +
            '<td>' + g.roles.map(function (r) { return '<code>' + esc(ggName(r)) + '</code>'; }).join('<br>') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    area.insertAdjacentHTML('beforeend', html);
  }

  /* ---------------------------------------------------------------------
     8  Dokumentmodell (eine Quelle → HTML-Vorschau und Markdown, AK-16/19)
     Inline-Inhalte („parts“): String oder Array aus Strings, {code:'…'}, {b:'…'}.
     --------------------------------------------------------------------- */
  function C(t) { return { code: t }; }
  function B(t) { return { b: t }; }

  function buildDocModel() {
    var m = state.meta;
    var rz = m.rezertifizierungMonate;
    var domain = m.domaene || '(nicht angegeben)';
    var blocks = [];
    var gg = globalGroups(), dl = localGroups();
    var EMPTY = { t: 'empty' };
    function h2(t) { blocks.push({ t: 'h2', text: t }); }
    function h3(t) { blocks.push({ t: 'h3', text: t }); }
    function p(parts) { blocks.push({ t: 'p', parts: parts }); }
    function ul(items) { blocks.push({ t: 'ul', items: items }); }
    function ol(items) { blocks.push({ t: 'ol', items: items }); }
    function table(caption, head, rows) { blocks.push(rows.length ? { t: 'table', caption: caption, head: head, rows: rows } : EMPTY); }
    function dash(v) { return v ? v : '–'; }

    // Deckblatt
    blocks.push({
      t: 'cover', firma: m.firma || '(Firmenname fehlt)', title: 'Berechtigungskonzept Active Directory',
      rows: [
        ['AD-Domäne', m.domaene ? [C(m.domaene)] : '–'],
        ['NetBIOS-Name', m.netbios ? [C(m.netbios)] : '–'],
        ['Version', dash(m.version)],
        ['Datum', dash(formatDate(m.datum))],
        ['Verantwortlich', dash([m.verantwortlich, m.funktion].filter(Boolean).join(', '))],
        ['Ersteller', dash(m.ersteller)],
        ['Rezertifizierung', 'alle ' + rz + ' Monate']
      ],
      warnings: collectWarnings()
    });

    // 1 Ziele
    h2('1 Ziele');
    p(['Dieses Dokument beschreibt das Berechtigungskonzept für die Active-Directory-Domäne ', C(domain), ' der ' + (m.firma || 'Organisation') + '. Es verfolgt folgende Ziele:']);
    ul([
      'Nachvollziehbare, rollenbasierte Vergabe von Zugriffsrechten auf Dateifreigaben, Drucker und Anwendungen.',
      'Umsetzung des AGDLP-Prinzips, damit Rechte zentral über Gruppen statt über einzelne Personen gesteuert werden.',
      'Minimale Rechte für jede Rolle (Least Privilege) und Zugriff nur bei fachlicher Notwendigkeit (Need-to-know).',
      'Klare Prozesse für Beantragung, Änderung, Entzug und regelmäßige Rezertifizierung von Berechtigungen.',
      'Prüfbarkeit gegenüber Revision und Datenschutz (Art. 32 DSGVO: Vertraulichkeit und Integrität).'
    ]);

    // 2 Geltungsbereich
    h2('2 Geltungsbereich');
    p(['Das Konzept gilt für alle Benutzerkonten, Sicherheitsgruppen und Ressourcen der Domäne ', C(domain),
      m.netbios ? [' (NetBIOS: ', C(m.netbios), ')'] : '', '. Erfasst sind ' + state.rollen.length + ' Rollen, ' +
      state.benutzer.length + ' Benutzer und ' + state.ressourcen.length + ' Ressourcen.']);
    p('Nicht Bestandteil dieses Konzepts sind lokale Konten auf Clients und Servern, Universal-Gruppen, Multi-Domain- bzw. Forest-Szenarien sowie explizite Verweigern-Einträge (Deny-ACEs).');

    // 3 Grundsätze
    h2('3 Grundsätze');
    h3('3.1 AGDLP');
    p([B('A'), 'ccount → ', B('G'), 'lobale Gruppe → ', B('D'), 'omänen', B('L'), 'okale Gruppe → ', B('P'), 'ermission. Daraus folgen verbindlich:']);
    ul([
      ['Jeder Benutzer ist Mitglied genau einer Rolle und damit genau einer globalen Gruppe ', C('GG_<ROLLE>'), '.'],
      ['Berechtigungen (ACL-Einträge) werden ausschließlich an domänenlokale Gruppen ', C('DL_…'), ' vergeben – nie an Benutzer oder globale Gruppen.'],
      'Globale Gruppen werden gemäß Berechtigungsmatrix Mitglied der domänenlokalen Gruppen. Benutzer werden nie direkt Mitglied einer DL-Gruppe.'
    ]);
    h3('3.2 Least Privilege');
    p('Jede Rolle erhält nur die Rechte, die sie für ihre Aufgaben benötigt. Standard jeder Matrixzelle ist „Kein Zugriff“; Rechte werden nur bewusst vergeben. „Kein Zugriff“ bedeutet: keine Gruppenmitgliedschaft – es werden keine Verweigern-Einträge gesetzt.');
    h3('3.3 Need-to-know');
    p('Zugriff auf Informationen erhalten nur Rollen, die diese Informationen für ihre fachlichen Aufgaben tatsächlich benötigen. Der Besitzer einer Ressource entscheidet fachlich über die Zugriffe.');
    h3('3.4 Freigabe- und Administratorberechtigungen');
    ul([
      ['Freigabeberechtigung jeder Dateifreigabe: ', B('Authentifizierte Benutzer – Ändern'), '. Die eigentliche Zugriffssteuerung erfolgt ausschließlich über NTFS-Berechtigungen.'],
      [C('Domänen-Admins'), ' und ', C('SYSTEM'), ' behalten auf allen Ressourcen Vollzugriff.']
    ]);

    // 4 Namenskonvention
    h2('4 Namenskonvention');
    table('Namensschema', ['Objekt', 'Schema', 'Beispiel', 'Bereich/Typ'], [
      ['Globale Gruppe', [C('GG_<ROLLE>')], [C('GG_VERTRIEB')], 'Global / Sicherheit'],
      ['Domänenlokale Gruppe', [C('DL_<RESSOURCE>_<R|M|F>')], [C('DL_PROJEKTE_M')], 'Lokal (in Domäne) / Sicherheit'],
      ['Benutzeranmeldename', [C('vorname.nachname')], [C('max.mustermann')], 'max. 20 Zeichen (sAMAccountName)']
    ]);
    p('Kürzel für Rollen und Ressourcen werden normalisiert: ä→AE, ö→OE, ü→UE, ß→SS; Großbuchstaben; nur A–Z und 0–9 (Leerzeichen, Bindestriche und Unterstriche entfallen); maximal 15 Zeichen. Kürzel sind je Typ eindeutig. Es werden nur DL-Gruppen angelegt, die in der Matrix verwendet werden.');
    table('Berechtigungsstufen', ['Stufe', 'Kürzel', 'Ordner/Freigabe (NTFS)', 'Drucker', 'Anwendung'], [
      ['Kein Zugriff', '–', 'keine Gruppe', 'keine Gruppe', 'keine Gruppe'],
      ['Lesen', [C('R')], 'Lesen, Ausführen, Ordnerinhalt anzeigen', 'Drucken', 'Benutzen'],
      ['Ändern', [C('M')], 'Ändern', 'Drucken + Dokumente verwalten', 'Benutzen + Daten bearbeiten'],
      ['Vollzugriff', [C('F')], 'Vollzugriff', 'Drucker verwalten', 'Administrieren']
    ]);

    // 5 Rollen und Benutzer
    h2('5 Rollen und Benutzer');
    h3('5.1 Rollen');
    table('Rollen', ['Rolle', 'Kürzel', 'Globale Gruppe', 'Beschreibung', 'Benutzer'],
      state.rollen.map(function (r) { return [r.name, [C(codeOf(r))], [C(ggName(r))], dash(r.beschreibung), String(usersOfRole(r.id).length)]; }));
    h3('5.2 Benutzer');
    table('Benutzer', ['Name', 'Anmeldename', 'Rolle', 'Globale Gruppe'],
      state.benutzer.map(function (u) {
        var r = roleById(u.rolleId);
        return [fullName(u), [C(u.anmeldename)], r ? r.name : 'ohne Rolle', r ? [C(ggName(r))] : '–'];
      }));

    // 6 Ressourcen
    h2('6 Ressourcen');
    table('Ressourcen', ['Ressource', 'Typ', 'Kürzel', 'Pfad/UNC', 'Besitzer', 'Beschreibung'],
      state.ressourcen.map(function (s) {
        var o = roleById(s.besitzerRolleId);
        return [s.name, TYPES[s.typ], [C(codeOf(s))], s.pfad ? [C(s.pfad)] : '–', o ? o.name : '–', dash(s.beschreibung)];
      }));

    // 7 Gruppen
    h2('7 Gruppen');
    h3('7.1 Globale Gruppen');
    table('Globale Gruppen', ['Gruppe', 'Bereich/Typ', 'Rolle', 'Mitglieder (Benutzer)'],
      gg.map(function (g) {
        return [[C(g.name)], 'Global / Sicherheit', g.role.name,
          g.members.length ? g.members.map(function (u) { return fullName(u) + ' (' + u.anmeldename + ')'; }).join(', ') : 'keine Mitglieder'];
      }));
    h3('7.2 Domänenlokale Gruppen');
    table('Domänenlokale Gruppen', ['Gruppe', 'Bereich/Typ', 'Ressource', 'Stufe', 'Berechtigung', 'Mitglieder (GG)'],
      dl.map(function (g) {
        var members = [];
        g.roles.forEach(function (r, i) { if (i) members.push(', '); members.push(C(ggName(r))); });
        return [[C(g.name)], 'Lokal (in Domäne) / Sicherheit', g.res.name, g.level + ' ' + LEVEL_NAMES[g.level], PERMS[g.res.typ][g.level], members];
      }));

    // 8 Berechtigungsmatrix
    var mBlocks = [];
    mBlocks.push({ t: 'h2', text: '8 Berechtigungsmatrix' });
    mBlocks.push({ t: 'p', parts: 'Zeilen: Rollen (globale Gruppen), Spalten: Ressourcen. – = Kein Zugriff, R = Lesen, M = Ändern, F = Vollzugriff.' });
    if (state.rollen.length && state.ressourcen.length) {
      mBlocks.push({ t: 'table', caption: 'Berechtigungsmatrix', cls: 'matrix-doc',
        head: ['Rolle'].concat(state.ressourcen.map(function (s) { return s.name + ' (' + codeOf(s) + ')'; })),
        rows: state.rollen.map(function (r) {
          return [r.name].concat(state.ressourcen.map(function (s) {
            var l = getLevel(r.id, s.id);
            return { parts: LEVEL_SHORT[l] + ' ' + LEVEL_NAMES[l], lvl: LEVEL_CLASS[l] };
          }));
        }) });
    } else mBlocks.push(EMPTY);
    blocks.push({ t: 'section', cls: state.ressourcen.length > 6 ? 'doc-matrix doc-matrix-landscape' : 'doc-matrix', blocks: mBlocks });

    // 9 Prozess Beantragung/Änderung
    h2('9 Prozess Beantragung/Änderung');
    ol([
      'Die Führungskraft beantragt die Änderung schriftlich bzw. per Ticket (Begründung, ggf. Befristung). Beantragt werden entweder die Zuordnung eines Benutzers zu einer Rolle oder eine geänderte Berechtigung einer ganzen Rolle.',
      'Der Besitzer der betroffenen Ressource prüft den Antrag nach Need-to-know und Least Privilege und gibt ihn frei oder lehnt ihn ab.',
      ['Rollenzuordnung bzw. Rollenwechsel: Der Benutzer wird Mitglied der globalen Gruppe seiner (neuen) Rolle (', C('GG_<ROLLE>'), '); die bisherige Mitgliedschaft wird entfernt. Ein Benutzer ist nie Mitglied mehrerer globaler Gruppen (R1).'],
      ['Rechteänderung: Die Berechtigungsmatrix wird für die gesamte Rolle angepasst, und die IT ändert die Mitgliedschaft ', C('GG_<ROLLE>'), ' → ', C('DL_<RESSOURCE>_<STUFE>'), '. Individuelle Zusatzrechte für einzelne Benutzer und direkte Rechte an Benutzer werden nicht vergeben.'],
      'Die Umsetzung wird im Ticket dokumentiert, dem Antragsteller bestätigt und dieses Dokument versioniert aktualisiert.'
    ]);

    // 10 Prozess Entzug
    h2('10 Prozess Entzug (Austritt/Wechsel)');
    h3('10.1 Austritt');
    ul([
      'Die Personalabteilung meldet den Austritt rechtzeitig mit Datum an die IT.',
      'Am letzten Arbeitstag wird das Konto deaktiviert, das Kennwort zurückgesetzt und alle Gruppenmitgliedschaften werden entfernt.',
      'Daten werden nach Vorgabe der Führungskraft übergeben; das Konto wird nach Ablauf der Aufbewahrungsfrist gelöscht.'
    ]);
    h3('10.2 Abteilungs- bzw. Rollenwechsel');
    ul([
      'Die bisherige globale Gruppe wird entzogen, bevor die neue Rolle zugewiesen wird (keine Rechteanhäufung).',
      'Übergangsrechte werden nur befristet und mit Freigabe des Ressourcenbesitzers vergeben.'
    ]);

    // 11 Rezertifizierung
    h2('11 Rezertifizierung');
    p(['Alle Berechtigungen werden ', B('alle ' + rz + ' Monate'), ' überprüft. Dabei bestätigen die Ressourcenbesitzer bzw. Führungskräfte:']);
    ul([
      'die Mitglieder jeder globalen Gruppe (stimmen Benutzer und Rolle noch überein?),',
      'die Mitgliedschaften der globalen in den domänenlokalen Gruppen gemäß Berechtigungsmatrix,',
      'dass keine direkten Benutzerberechtigungen und keine verwaisten Konten oder Gruppen bestehen.'
    ]);
    p('Abweichungen werden umgehend korrigiert; das Ergebnis wird mit Datum und Unterschrift dokumentiert.');

    // 12 Änderungshistorie/Freigabe
    h2('12 Änderungshistorie/Freigabe');
    table('Änderungshistorie', ['Version', 'Datum', 'Änderung', 'Autor'], [
      [dash(m.version), dash(formatDate(m.datum)), 'Erstellung des Berechtigungskonzepts', dash(m.ersteller)]
    ]);
    blocks.push({ t: 'signature', labels: ['Erstellt', 'Geprüft', 'Freigegeben'] });
    return blocks;
  }

  /* ---- Rendering nach HTML ---- */
  function partsToHtml(parts) {
    if (parts == null) return '';
    if (typeof parts === 'string') return esc(parts);
    if (Array.isArray(parts)) return parts.map(partsToHtml).join('');
    if (parts.code != null) return '<code>' + esc(parts.code) + '</code>';
    if (parts.b != null) return '<strong>' + esc(parts.b) + '</strong>';
    return '';
  }
  function tableHtml(b) {
    return '<div class="table-wrap"><table' + (b.cls ? ' class="' + b.cls + '"' : '') + '><caption class="sr-only">' + esc(b.caption) + '</caption><thead><tr>' +
      b.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      b.rows.map(function (row) {
        return '<tr>' + row.map(function (c, i) {
          var tag = i === 0 ? 'th scope="row"' : 'td';
          var close = i === 0 ? 'th' : 'td';
          if (c && c.lvl) return '<td class="' + c.lvl + '">' + partsToHtml(c.parts) + '</td>';
          return '<' + tag + '>' + partsToHtml(c) + '</' + close + '>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function blocksToHtml(blocks) {
    return blocks.map(function (b) {
      switch (b.t) {
        case 'cover':
          return '<header class="doc-cover"><p class="cover-firma">' + esc(b.firma) + '</p><p class="cover-title">' + esc(b.title) + '</p>' +
            tableHtml({ caption: 'Stammdaten', head: ['Angabe', 'Wert'], rows: b.rows }) +
            (b.warnings.length ? '<div class="hint hint-warning"><strong>Warnung:</strong> Offene Punkte im Konzept<ul>' +
              b.warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul></div>' : '') + '</header>';
        case 'h2': return '<h2>' + esc(b.text) + '</h2>';
        case 'h3': return '<h3>' + esc(b.text) + '</h3>';
        case 'p': return '<p>' + partsToHtml(b.parts) + '</p>';
        case 'ul': case 'ol':
          return '<' + b.t + '>' + b.items.map(function (i) { return '<li>' + partsToHtml(i) + '</li>'; }).join('') + '</' + b.t + '>';
        case 'table': return tableHtml(b);
        case 'empty': return '<p class="doc-empty">Keine Einträge erfasst</p>';
        case 'section': return '<section class="' + b.cls + '">' + blocksToHtml(b.blocks) + '</section>';
        case 'signature':
          return '<div class="doc-signature">' + b.labels.map(function (l) {
            return '<div><p class="sig-label">' + esc(l) + '</p><p class="sig-line">Datum, Unterschrift</p></div>';
          }).join('') + '</div>';
      }
      return '';
    }).join('');
  }
  function renderDoc() { $('doc').innerHTML = blocksToHtml(buildDocModel()); }

  /* ---- Rendering nach Markdown ---- */
  function mdText(s) {
    // V-07: auch ~ und & escapen (sonst Durchstreichung bzw. Entity-Auflösung)
    return String(s).replace(/([\\`*_[\]<>~])/g, '\\$1').replace(/&/g, '&amp;').replace(/\r?\n/g, ' ');
  }
  function partsToMd(parts) {
    if (parts == null) return '';
    if (typeof parts === 'string') return mdText(parts);
    if (Array.isArray(parts)) return parts.map(partsToMd).join('');
    if (parts.code != null) {
      var t = String(parts.code).replace(/\r?\n/g, ' ');
      // V-07: Delimiter länger als die längste Backtick-Folge im Inhalt
      var runs = t.match(/`+/g) || [], max = 0;
      runs.forEach(function (r) { max = Math.max(max, r.length); });
      var fence = new Array(max + 2).join('`');
      return max ? fence + ' ' + t + ' ' + fence : '`' + t + '`';
    }
    if (parts.b != null) return '**' + mdText(parts.b) + '**';
    return '';
  }
  function mdCell(c) {
    var s = c && c.lvl ? partsToMd(c.parts) : partsToMd(c);
    return s.replace(/\|/g, '\\|');
  }
  function tableMd(b) {
    return '| ' + b.head.map(mdCell).join(' | ') + ' |\n' +
      '|' + b.head.map(function () { return ' --- '; }).join('|') + '|\n' +
      b.rows.map(function (r) { return '| ' + r.map(mdCell).join(' | ') + ' |'; }).join('\n') + '\n';
  }
  function blocksToMd(blocks) {
    return blocks.map(function (b) {
      switch (b.t) {
        case 'cover':
          return '# ' + mdText(b.firma) + '\n\n**' + mdText(b.title) + '**\n\n' +
            tableMd({ head: ['Angabe', 'Wert'], rows: b.rows }) +
            (b.warnings.length ? '\n> **Warnung:** Offene Punkte im Konzept\n>\n' + b.warnings.map(function (w) { return '> - ' + mdText(w); }).join('\n') + '\n' : '');
        case 'h2': return '## ' + mdText(b.text) + '\n';
        case 'h3': return '### ' + mdText(b.text) + '\n';
        case 'p': return partsToMd(b.parts) + '\n';
        case 'ul': return b.items.map(function (i) { return '- ' + partsToMd(i); }).join('\n') + '\n';
        case 'ol': return b.items.map(function (i, n) { return (n + 1) + '. ' + partsToMd(i); }).join('\n') + '\n';
        case 'table': return tableMd(b);
        case 'empty': return '*Keine Einträge erfasst*\n';
        case 'section': return blocksToMd(b.blocks);
        case 'signature':
          return '| ' + b.labels.join(' | ') + ' |\n|' + b.labels.map(function () { return ' --- '; }).join('|') + '|\n' +
            '| ' + b.labels.map(function () { return '<br><br>\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_'; }).join(' | ') + ' |\n' +
            '| ' + b.labels.map(function () { return 'Datum, Unterschrift'; }).join(' | ') + ' |\n';
      }
      return '';
    }).join('\n');
  }

  /* ---------------------------------------------------------------------
     9  Export/Import, Beispieldaten, Zurücksetzen
     --------------------------------------------------------------------- */
  function fileBase() {
    var d = String(state.meta.domaene || '').trim().toLowerCase().replace(/[^a-z0-9.-]/g, '') || 'ohne-domaene';
    var date = /^\d{4}-\d{2}-\d{2}$/.test(state.meta.datum) ? state.meta.datum : todayISO();
    return 'rechtekonzept-' + d + '-' + date;
  }
  function download(name, mime, content) {
    var blob = new Blob([content], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportMarkdown() {
    download(fileBase() + '.md', 'text/markdown', blocksToMd(buildDocModel()));
    toast('Export erstellt');
  }
  function exportJson() {
    download(fileBase() + '.json', 'application/json', JSON.stringify(state, null, 2));
    toast('Export erstellt');
  }
  var IMPORT_ERROR = 'Import fehlgeschlagen: Die Datei ist kein gültiges Rechtekonzept (schemaVersion 1). Deine Daten wurden nicht verändert.';
  function importJsonText(text) {
    var parsed = null;
    try { parsed = validateAndNormalize(JSON.parse(text)); } catch (e) { parsed = null; }
    if (!parsed) { toast(IMPORT_ERROR, true); return false; }
    state = parsed;
    resetAllForms();
    fillMetaForm();
    changed();
    toast('JSON importiert');
    return true;
  }
  function initImport() {
    var input = $('import-file');
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () { importJsonText(String(reader.result)); input.value = ''; };
      reader.onerror = function () { toast(IMPORT_ERROR, true); input.value = ''; };
      reader.readAsText(f, 'utf-8');
    });
  }
  function resetAllForms() { resetRoleForm(); resetUserForm(); resetResForm(); }

  function sampleData() {
    var s = emptyState();
    s.meta = { firma: 'Muster Logistik GmbH', domaene: 'muster-logistik.local', netbios: 'MUSTERLOG',
      verantwortlich: 'Petra Schäfer', funktion: 'IT-Leitung', ersteller: 'Jonas Krüger (Auszubildender FISI)',
      version: '1.0', datum: todayISO(), rezertifizierungMonate: 6 };
    s.rollen = [
      { id: 'r1', name: 'Geschäftsführung', kuerzel: 'GESCHAEFTSFUEHR', beschreibung: 'Unternehmensleitung' },
      { id: 'r2', name: 'Vertrieb', kuerzel: 'VERTRIEB', beschreibung: 'Kundenbetreuung und Angebote' },
      { id: 'r3', name: 'Buchhaltung', kuerzel: 'BUCHHALTUNG', beschreibung: 'Finanz- und Lohnbuchhaltung' },
      { id: 'r4', name: 'Lager', kuerzel: 'LAGER', beschreibung: 'Wareneingang, Kommissionierung, Versand' },
      { id: 'r5', name: 'IT', kuerzel: 'IT', beschreibung: 'Administration der IT-Infrastruktur' }
    ];
    var people = [
      ['Petra', 'Schäfer', 'r5'], ['Jonas', 'Krüger', 'r5'], ['Michael', 'Becker', 'r1'],
      ['Sabine', 'Müller', 'r2'], ['Tobias', 'Weiß', 'r2'], ['Aylin', 'Yılmaz', 'r3'],
      ['Klaus', 'Groß', 'r3'], ['Lena', 'Hoffmann', 'r4'], ['Marco', 'Özdemir', 'r4'], ['Julia', 'Fuchs', 'r2']
    ];
    s.benutzer = people.map(function (p, i) {
      return { id: 'u' + (i + 1), vorname: p[0], nachname: p[1], anmeldename: suggestLogin(p[0], p[1]), rolleId: p[2] };
    });
    s.ressourcen = [
      { id: 's1', typ: 'ordner', name: 'Projekte', kuerzel: 'PROJEKTE', pfad: '\\\\fs01\\projekte', beschreibung: 'Projektablage aller Abteilungen', besitzerRolleId: 'r1' },
      { id: 's2', typ: 'ordner', name: 'Buchhaltung', kuerzel: 'BUCHHALTUNG', pfad: '\\\\fs01\\buchhaltung', beschreibung: 'Belege, Abschlüsse, Lohn', besitzerRolleId: 'r3' },
      { id: 's3', typ: 'ordner', name: 'Vertrieb', kuerzel: 'VERTRIEB', pfad: '\\\\fs01\\vertrieb', beschreibung: 'Angebote und Kundenunterlagen', besitzerRolleId: 'r2' },
      { id: 's4', typ: 'ordner', name: 'Austausch', kuerzel: 'AUSTAUSCH', pfad: '\\\\fs01\\austausch', beschreibung: 'Temporärer Datenaustausch', besitzerRolleId: 'r5' },
      { id: 's5', typ: 'drucker', name: 'Drucker Büro EG', kuerzel: 'DRBUEROEG', pfad: '\\\\ps01\\DR-BUERO-EG', beschreibung: 'Multifunktionsgerät Erdgeschoss', besitzerRolleId: 'r5' },
      { id: 's6', typ: 'anwendung', name: 'Warenwirtschaft', kuerzel: 'WAWI', pfad: 'https://wawi.muster-logistik.local', beschreibung: 'ERP für Lager und Vertrieb', besitzerRolleId: 'r4' }
    ];
    s.matrix = {
      r1: { s1: 'M', s2: 'R', s3: 'R', s4: 'M', s5: 'R', s6: 'R' },
      r2: { s1: 'M', s3: 'M', s4: 'M', s5: 'R', s6: 'M' },
      r3: { s1: 'R', s2: 'M', s4: 'M', s5: 'R', s6: 'R' },
      r4: { s4: 'M', s5: 'R', s6: 'M' },
      // IT: Vollzugriff nur auf eigene Ressourcen (Besitzer), sonst Least Privilege (V-05);
      // administrativer Vollzugriff läuft über Domänen-Admins/SYSTEM (R6).
      r5: { s1: 'R', s4: 'F', s5: 'F', s6: 'R' }
    };
    return s;
  }
  async function loadSampleData() {
    var ok = await confirmDialog('Beispieldaten laden?', 'Alle aktuellen Eingaben werden ersetzt.', 'Beispieldaten laden');
    if (!ok) return;
    state = sampleData();
    resetAllForms();
    fillMetaForm();
    changed();
    toast('Beispieldaten geladen');
  }
  async function resetAll() {
    var ok = await confirmDialog('Alle Daten löschen?', 'Dies kann nicht rückgängig gemacht werden.', 'Alles löschen');
    if (!ok) return;
    state = emptyState();
    lsRemove(STORAGE_KEY);
    resetAllForms();
    fillMetaForm();
    save();
    goToStep(1, true);
    toast('Alle Daten gelöscht');
  }

  /* ---------------------------------------------------------------------
     10  Start
     --------------------------------------------------------------------- */
  function init() {
    storageOk = storageAvailable();
    if (!storageOk) { $('storage-hint').hidden = false; setSaveStatus(false); }
    load();
    fillMetaForm();
    initMenu();
    initMeta();
    initCrud();
    initMatrix();
    initImport();
    $('theme-toggle').addEventListener('click', function () {
      var order = ['system', 'light', 'dark'];
      setTheme(order[(order.indexOf(currentTheme()) + 1) % 3]);
    });
    updateThemeUi();
    $('btn-print').addEventListener('click', function () { renderDoc(); window.print(); });
    $('btn-md').addEventListener('click', exportMarkdown);
    $('btn-json').addEventListener('click', exportJson);
    window.addEventListener('beforeprint', renderDoc);
    window.addEventListener('resize', updateScrollHints);
    resetAllForms();
    // V-04: beim Start nicht speichern – erst die erste Benutzeränderung schreibt.
    goToStep(Number(lsGet(STEP_KEY)) || 1, false);
  }

  // Für automatisierte Tests (keine Abhängigkeit im UI)
  window.RechteKonzept = {
    normalizeCode: normalizeCode, suggestLogin: suggestLogin, isValidFqdn: isValidFqdn,
    importJsonText: importJsonText, toMarkdown: function () { return blocksToMd(buildDocModel()); },
    getState: function () { return JSON.parse(JSON.stringify(state)); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
