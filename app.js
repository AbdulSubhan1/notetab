(function () {
  'use strict';

  // ── Helpers ───────────────────────────────────────────────

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function escHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Storage ───────────────────────────────────────────────
  // Falls back to in-memory when localStorage is blocked (e.g. private browsing in some browsers)

  var store = (function () {
    try {
      localStorage.setItem('__nt', '1');
      localStorage.removeItem('__nt');
      return localStorage;
    } catch (e) {
      var mem = {};
      return {
        getItem:    function (k) { return mem[k] !== undefined ? mem[k] : null; },
        setItem:    function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; }
      };
    }
  })();

  // ── State ─────────────────────────────────────────────────

  var state = { notes: [], activeId: null, theme: 'dark' };

  function loadState() {
    try { state.notes = JSON.parse(store.getItem('nt_notes')) || []; }
    catch (e) { state.notes = []; }
    state.activeId = store.getItem('nt_active') || null;
    state.theme    = store.getItem('nt_theme')  || 'dark';
  }

  function saveState() {
    store.setItem('nt_notes',  JSON.stringify(state.notes));
    store.setItem('nt_active', state.activeId || '');
    store.setItem('nt_theme',  state.theme);
  }

  // ── DOM refs ──────────────────────────────────────────────

  var editor      = document.getElementById('editor');
  var noteList    = document.getElementById('note-list');
  var savedBadge  = document.getElementById('saved-badge');
  var sidebar     = document.getElementById('sidebar');
  var overlay     = document.getElementById('overlay');
  var menuBtn     = document.getElementById('menu-btn');
  var newBtn      = document.getElementById('new-btn');
  var themeBtnTop  = document.getElementById('theme-btn-top');
  var themeBtnSide = document.getElementById('theme-btn-side');

  // ── Render ────────────────────────────────────────────────

  function noteLabel(note) {
    var line = note.content.split('\n')[0].trim();
    return line ? line.slice(0, 30) : 'Untitled';
  }

  function render() {
    var html = '';
    for (var i = 0; i < state.notes.length; i++) {
      var n = state.notes[i];
      var cls = 'note-item' + (n.id === state.activeId ? ' active' : '');
      html += '<li class="' + cls + '" data-id="' + n.id + '">'
            + '<span class="note-label">' + escHtml(noteLabel(n)) + '</span>'
            + '<button class="delete-btn" aria-label="Delete note">&#215;</button>'
            + '</li>';
    }
    noteList.innerHTML = html;
    syncThemeIcon();
  }

  function syncThemeIcon() {
    var icon = state.theme === 'dark' ? '☀' : '☾'; /* ☀ / ☾ */
    if (themeBtnTop)  themeBtnTop.textContent  = icon;
    if (themeBtnSide) themeBtnSide.textContent = icon;
  }

  // ── Note helpers ──────────────────────────────────────────

  function getActive() {
    return state.notes.find(function (n) { return n.id === state.activeId; }) || null;
  }

  function flushEditor() {
    var note = getActive();
    if (note) note.content = rawText();
  }

  function loadEditor(note) {
    editor.innerText = note ? note.content : '';
    updatePlaceholder();
  }

  function rawText() {
    var t = editor.innerText;
    return t === '\n' ? '' : t; /* Chrome returns '\n' for empty contenteditable */
  }

  // ── Note operations ───────────────────────────────────────

  function activateNote(id) {
    flushEditor();
    state.activeId = id;
    loadEditor(getActive());
    saveState();
    render();
    editor.focus();
  }

  function newNote() {
    flushEditor();
    var note = { id: uid(), content: '', updatedAt: Date.now() };
    state.notes.push(note);
    state.activeId = note.id;
    loadEditor(note);
    saveState();
    render();
    editor.focus();
  }

  function deleteNote(id) {
    var idx = state.notes.findIndex(function (n) { return n.id === id; });
    if (idx === -1) return;
    state.notes.splice(idx, 1);
    if (state.notes.length === 0) {
      state.notes.push({ id: uid(), content: '', updatedAt: Date.now() });
    }
    if (state.activeId === id) {
      state.activeId = state.notes[Math.min(idx, state.notes.length - 1)].id;
    }
    loadEditor(getActive());
    saveState();
    render();
  }

  // ── Auto-save (debounced) ─────────────────────────────────

  var hideBadge;
  var doSave = debounce(function () {
    var note = getActive();
    if (!note) return;
    note.content    = rawText();
    note.updatedAt  = Date.now();
    saveState();
    render();
    savedBadge.classList.add('visible');
    clearTimeout(hideBadge);
    hideBadge = setTimeout(function () { savedBadge.classList.remove('visible'); }, 1500);
  }, 400);

  // ── Placeholder ───────────────────────────────────────────

  function updatePlaceholder() {
    if (rawText().trim() === '') {
      editor.setAttribute('data-empty', '');
    } else {
      editor.removeAttribute('data-empty');
    }
  }

  // ── Theme ─────────────────────────────────────────────────

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    syncThemeIcon();
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    saveState();
  }

  // ── Sidebar (mobile) ──────────────────────────────────────

  function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('visible'); }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('visible'); }

  // ── Swipe to open / close sidebar ────────────────────────

  var touchStartX = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (dx >  50 && touchStartX < 40) openSidebar();
    if (dx < -50) closeSidebar();
  }, { passive: true });

  // ── Events ────────────────────────────────────────────────

  // Note list — event delegation handles clicks on items and delete buttons
  noteList.addEventListener('click', function (e) {
    var item = e.target.closest('.note-item');
    if (!item) return;
    if (e.target.closest('.delete-btn')) {
      deleteNote(item.dataset.id);
    } else {
      activateNote(item.dataset.id);
      closeSidebar();
    }
  });

  editor.addEventListener('input', function () {
    updatePlaceholder();
    doSave();
  });

  // Strip HTML on paste — keep plain text only
  editor.addEventListener('paste', function (e) {
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text/plain');
    try {
      document.execCommand('insertText', false, text);
    } catch (ex) {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(text));
      }
    }
  });

  // Tab key inserts spaces instead of moving focus
  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
  });

  menuBtn.addEventListener('click', function () {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);
  newBtn.addEventListener('click', function () { newNote(); closeSidebar(); });
  if (themeBtnTop)  themeBtnTop.addEventListener('click',  toggleTheme);
  if (themeBtnSide) themeBtnSide.addEventListener('click', toggleTheme);

  // ── Init ──────────────────────────────────────────────────

  loadState();
  applyTheme(state.theme);

  if (state.notes.length === 0) {
    state.notes.push({ id: uid(), content: '', updatedAt: Date.now() });
  }
  if (!state.notes.find(function (n) { return n.id === state.activeId; })) {
    state.activeId = state.notes[0].id;
  }

  loadEditor(getActive());
  render();
  editor.focus();

})();
