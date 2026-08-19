(function () {
  'use strict';

  var API = 'https://openlibrary.org';
  var STORE_KEY = 'booknest.library.v1';
  var RECENT_KEY = 'booknest.recent.v1';
  var THEME_KEY = 'booknest.theme';
  var LAYOUT_KEY = 'booknest.layout';

  var el = {
    grid: document.getElementById('grid'),
    gridTitle: document.getElementById('gridTitle'),
    gridCount: document.getElementById('gridCount'),
    empty: document.getElementById('empty'),
    form: document.getElementById('searchForm'),
    input: document.getElementById('searchInput'),
    pills: document.getElementById('pills'),
    shelves: document.getElementById('shelves'),
    layoutToggle: document.getElementById('layoutToggle'),
    quickEmpty: document.getElementById('quickEmpty'),
    quickBody: document.getElementById('quickBody'),
    offline: document.getElementById('offline'),
    toast: document.getElementById('toast'),
    tagline: document.getElementById('tagline'),
    theme: document.getElementById('themeToggle')
  };

  var state = { view: 'search', books: [], selected: null, query: '', shelf: 'all', trending: null, layout: 'grid' };
  try { state.layout = localStorage.getItem(LAYOUT_KEY) === 'list' ? 'list' : 'grid'; } catch (e) {}

  var SHELVES = [
    { id: 'all', label: 'All' },
    { id: 'want', label: 'Want to Read' },
    { id: 'reading', label: 'Reading' },
    { id: 'finished', label: 'Finished' }
  ];
  var STATUS_LABEL = { want: 'Want to read', reading: 'Reading', finished: 'Finished' };

  /* ---------- storage ---------- */
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function library() { return read(STORE_KEY); }
  function inLibrary(id) { return library().some(function (b) { return b.id === id; }); }
  function shelfCounts() {
    var list = library();
    var counts = { all: list.length, want: 0, reading: 0, finished: 0 };
    list.forEach(function (b) { if (counts[b.status] !== undefined) counts[b.status]++; });
    return counts;
  }
  function saveBook(book) {
    var list = library();
    if (list.some(function (b) { return b.id === book.id; })) return false;
    book.status = 'want';
    book.rating = null;
    book.notes = '';
    book.addedAt = Date.now();
    list.unshift(book);
    write(STORE_KEY, list);
    return true;
  }
  function removeBook(id) {
    write(STORE_KEY, library().filter(function (b) { return b.id !== id; }));
  }
  function setStatus(id, status) {
    var list = library().map(function (b) { if (b.id === id) b.status = status; return b; });
    write(STORE_KEY, list);
  }
  // Explicit shelf-action API — used by the UI buttons so each move
  // (want-to-read / reading / finished) is a distinct, named action
  // rather than a generic dropdown value change.
  function moveToShelf(id, shelf) { setStatus(id, shelf); }
  function addToShelf(book, shelf) {
    var added = saveBook(book);
    if (shelf && shelf !== 'want') moveToShelf(book.id, shelf);
    return added;
  }
  function setRating(id, rating) {
    var list = library().map(function (b) { if (b.id === id) b.rating = rating; return b; });
    write(STORE_KEY, list);
  }
  function setNotes(id, notes) {
    var list = library().map(function (b) { if (b.id === id) b.notes = notes; return b; });
    write(STORE_KEY, list);
  }
  function pushRecent(book) {
    var list = read(RECENT_KEY).filter(function (b) { return b.id !== book.id; });
    list.unshift(book);
    write(RECENT_KEY, list.slice(0, 15)); // keep only the 15 most recent
  }

  /* ---------- helpers ---------- */
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.toast.classList.remove('show'); }, 2000);
  }
  function coverUrl(id, size) {
    return id ? 'https://covers.openlibrary.org/b/id/' + id + '-' + (size || 'M') + '.jpg' : '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mapDoc(d) {
    return {
      id: (d.key || '').replace('/works/', ''),
      title: d.title || 'Untitled',
      author: (d.author_name && d.author_name[0]) || 'Unknown author',
      year: d.first_publish_year || null,
      cover: d.cover_i || null,
      subjects: (d.subject || []).slice(0, 3)
    };
  }

  /* ---------- rendering ---------- */
  function skeletons(n) {
    var html = '';
    for (var i = 0; i < n; i++) html += '<div class="skeleton"></div>';
    el.grid.innerHTML = html;
    el.empty.hidden = true;
  }

  function heartIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.5-7-9a4 4 0 017-2.5A4 4 0 0119 11c0 4.5-7 9-7 9z"/></svg>';
  }
  function trashIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>';
  }
  function starIcon(filled) {
    return '<svg viewBox="0 0 24 24" class="star' + (filled ? ' is-filled' : '') + '" style="' + (filled ? 'fill:currentColor' : '') + '"><path d="M12 3l2.6 5.8 6.2.6-4.7 4.2 1.4 6.3L12 16.9 6.5 19.9l1.4-6.3-4.7-4.2 6.2-.6z"/></svg>';
  }

  function setActiveNav(view) {
    var isSearch = view === 'search';
    if (el.pills) el.pills.hidden = !isSearch;
    if (el.form) el.form.hidden = !isSearch;
  }

  function clockIcon() {
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>';
  }
  function checkIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
  }

  function renderShelves() {
    if (state.view !== 'library') {
      el.shelves.hidden = true;
      if (el.layoutToggle) el.layoutToggle.hidden = true;
      return;
    }
    var counts = shelfCounts();
    el.shelves.hidden = false;
    el.shelves.innerHTML = SHELVES.map(function (s) {
      return '<button class="pill shelf-pill' + (state.shelf === s.id ? ' is-active' : '') + '" data-shelf="' + s.id + '">' +
        s.label + ' <span class="shelf-count">' + counts[s.id] + '</span></button>';
    }).join('');
    if (el.layoutToggle) {
      el.layoutToggle.hidden = false;
      Array.prototype.forEach.call(el.layoutToggle.children, function (b) {
        b.classList.toggle('is-active', b.dataset.layout === state.layout);
      });
    }
  }

  function shelfActionButtons(b) {
    return state.view === 'library'
      ? (b.status !== 'reading' ? '<button class="icon-btn" data-act="mark-reading" aria-label="Move to Reading" title="Currently reading">' + clockIcon() + '</button>' : '') +
        (b.status !== 'finished' ? '<button class="icon-btn" data-act="mark-finished" aria-label="Move to Finished" title="Finished">' + checkIcon() + '</button>' : '')
      : '';
  }

  function renderGridCard(b) {
    var saved = inLibrary(b.id);
    var img = b.cover
      ? '<img src="' + coverUrl(b.cover, 'M') + '" alt="Cover of ' + esc(b.title) + '" loading="lazy" />'
      : '<div class="cover-fallback">' + esc(b.title) + '</div>';
    var badge = (state.view === 'library' && b.status)
      ? '<span class="status-badge status-' + b.status + '">' + STATUS_LABEL[b.status] + '</span>' : '';
    return '<article class="card book-item' + (state.selected && state.selected.id === b.id ? ' is-selected' : '') + '" data-id="' + esc(b.id) + '" tabindex="0">' +
      '<div class="cover">' + img + badge +
        '<div class="card-actions">' +
          shelfActionButtons(b) +
          (state.view !== 'library' ? '<button class="icon-btn' + (saved ? ' is-on' : '') + '" data-act="save" aria-label="' + (saved ? 'Saved' : 'Save to Shelve') + '">' + heartIcon() + '</button>' : '') +
          (state.view === 'library' ? '<button class="icon-btn" data-act="remove" aria-label="Remove from library">' + trashIcon() + '</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="card-body"><p class="card-title">' + esc(b.title) + '</p>' +
      '<p class="card-meta">' + esc(b.author) + (b.year ? ' · ' + b.year : '') + '</p></div>' +
    '</article>';
  }

  // No <img> at all here on purpose — list view is the "works fully offline"
  // mode, so a shelf never breaks just because a cover image wasn't cached.
  function renderListCard(b) {
    var badge = (state.view === 'library' && b.status)
      ? '<span class="status-badge status-' + b.status + '">' + STATUS_LABEL[b.status] + '</span>' : '';
    return '<article class="list-item book-item' + (state.selected && state.selected.id === b.id ? ' is-selected' : '') + '" data-id="' + esc(b.id) + '" tabindex="0">' +
      '<div class="list-item-main">' +
        '<p class="list-item-title">' + esc(b.title) + '</p>' +
        '<p class="list-item-meta">' + esc(b.author) + (b.year ? ' · ' + b.year : '') + '</p>' +
      '</div>' +
      badge +
      '<div class="list-item-actions">' +
        shelfActionButtons(b) +
        (state.view === 'library' ? '<button class="icon-btn" data-act="remove" aria-label="Remove from library">' + trashIcon() + '</button>' : '') +
      '</div>' +
    '</article>';
  }

  function render() {
    var books = state.books;
    el.gridCount.textContent = books.length ? books.length + ' book' + (books.length === 1 ? '' : 's') : '';
    var isList = state.view === 'library' && state.layout === 'list';
    el.grid.classList.toggle('is-list', isList);
    if (!books.length) {
      el.grid.innerHTML = '';
      el.empty.hidden = false;
      el.empty.textContent = state.view === 'library'
        ? (state.shelf === 'all'
            ? 'Nothing saved yet. Search for books and tap the heart to add them to a shelf.'
            : 'Nothing on this shelf yet.')
        : state.view === 'recent'
          ? 'Nothing viewed yet. Open a book to see it here.'
          : 'No books found. Try another title, author or keyword.';
      return;
    }
    el.empty.hidden = true;
    el.grid.innerHTML = books.map(isList ? renderListCard : renderGridCard).join('');
  }

  function renderQuick(book, details) {
    if (!book) { el.quickEmpty.hidden = false; el.quickBody.hidden = true; return; }
    el.quickEmpty.hidden = true;
    el.quickBody.hidden = false;
    var saved = inLibrary(book.id);
    var entry = library().filter(function (b) { return b.id === book.id; })[0];
    var desc = details && details.description
      ? (typeof details.description === 'string' ? details.description : details.description.value)
      : 'No description available for this title yet.';
    var subjects = (details && details.subjects ? details.subjects.slice(0, 4) : book.subjects || []);
    var rating = entry ? entry.rating : null;
    var notes = entry ? (entry.notes || '') : '';

    el.quickBody.innerHTML =
      (book.cover ? '<img class="quick-cover" src="' + coverUrl(book.cover, 'L') + '" alt="Cover of ' + esc(book.title) + '" />' : '') +
      '<h3>' + esc(book.title) + '</h3>' +
      '<p class="author">' + esc(book.author) + (book.year ? ' · ' + book.year : '') + '</p>' +
      (subjects.length ? '<div class="tags">' + subjects.map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
      '<p class="desc">' + esc(String(desc).slice(0, 600)) + '</p>' +
      (saved ? '<div class="shelf-move" id="shelfMove" role="group" aria-label="Move to shelf">' +
        SHELVES.filter(function (s) { return s.id !== 'all'; }).map(function (s) {
          return '<button type="button" class="shelf-move-btn' + (entry && entry.status === s.id ? ' is-active' : '') + '" data-shelf="' + s.id + '">' + s.label + '</button>';
        }).join('') + '</div>' : '') +
      (saved ? '<div class="rating" id="ratingRow" aria-label="Your rating">' +
        [1, 2, 3, 4, 5].map(function (n) {
          return '<button type="button" class="star-btn" data-star="' + n + '" aria-label="Rate ' + n + ' star' + (n > 1 ? 's' : '') + '">' + starIcon(rating && n <= rating) + '</button>';
        }).join('') + '</div>' : '') +
      (saved ? '<textarea class="notes-input" id="notesInput" placeholder="Add a private note…" maxlength="500">' + esc(notes) + '</textarea>' : '') +
      (saved ? '<button type="button" class="btn-ghost notes-save-btn" id="notesSave">Save note</button>' : '') +
      '<div class="row">' +
        '<button class="' + (saved ? 'btn-ghost' : 'btn-primary') + '" id="quickSave">' + (saved ? 'Remove' : 'Save to Shelf') + '</button>' +
        '<a class="btn-ghost" style="text-align:center;text-decoration:none" target="_blank" rel="noopener" href="' + API + '/works/' + esc(book.id) + '">Open Library</a>' +
      '</div>';

    var shelfMove = document.getElementById('shelfMove');
    if (shelfMove) shelfMove.addEventListener('click', function (e) {
      var btn = e.target.closest('.shelf-move-btn');
      if (!btn) return;
      moveToShelf(book.id, btn.dataset.shelf);
      toast('Moved to ' + STATUS_LABEL[btn.dataset.shelf]);
      renderQuick(book, details);
      if (state.view === 'library') { loadLibrary(); renderShelves(); }
    });

    var ratingRow = document.getElementById('ratingRow');
    if (ratingRow) ratingRow.addEventListener('click', function (e) {
      var btn = e.target.closest('.star-btn');
      if (!btn) return;
      var n = Number(btn.dataset.star);
      var current = library().filter(function (b) { return b.id === book.id; })[0];
      var next = (current && current.rating === n) ? null : n; // click same star again to clear
      setRating(book.id, next);
      renderQuick(book, details);
    });

    var notesInput = document.getElementById('notesInput');
    if (notesInput) notesInput.addEventListener('change', function () {
      setNotes(book.id, notesInput.value.trim());
      toast('Note saved');
    });
    var notesSave = document.getElementById('notesSave');
    if (notesSave) notesSave.addEventListener('click', function () {
      setNotes(book.id, notesInput.value.trim());
      toast('Note saved');
    });

    document.getElementById('quickSave').onclick = function () {
      if (inLibrary(book.id)) { removeBook(book.id); toast('Removed from Shelf'); }
      else { saveBook(Object.assign({}, book)); toast('Added to Shelf'); }
      renderQuick(book, details);
      if (state.view === 'library') { loadLibrary(); renderShelves(); } else render();
    };
  }

  /* ---------- data ---------- */
  // Books only ever enter the library/shelves via an explicit user action
  // (heart icon or "Save to library" in Quick Look) — see saveBook(). Nothing
  // else in this file writes to STORE_KEY, so shelves never fill themselves.

  function search(query, forceRefresh) {
    state.view = 'search';
    state.query = query;
    el.gridTitle.textContent = query ? 'Top 50 results for “' + query + '”' : 'Top 50 trending picks';
    setActiveNav('search');
    renderShelves();

    // "Trending picks" (empty query) is cached for the life of the page —
    // navigating back to Search shouldn't reshuffle it. Only a real page
    // reload (forceRefresh, set at init) or an actual typed/category search
    // fetches new results.
    if (!query && state.trending && !forceRefresh) {
      state.books = state.trending;
      render();
      return;
    }

    skeletons(10);
    fetch(API + '/search.json?q=' + encodeURIComponent(query || 'bestseller') + '&limit=50&fields=key,title,author_name,first_publish_year,cover_i,subject')
      .then(function (r) { if (!r.ok) throw new Error('Request failed'); return r.json(); })
      .then(function (data) {
        state.books = (data.docs || []).map(mapDoc).filter(function (b) { return b.id; });
        if (!query) state.trending = state.books;
        render();
      })
      .catch(function () {
        state.books = [];
        render();
        el.empty.hidden = false;
        el.empty.textContent = 'Could not reach the book service. Check your connection and try again.';
      });
  }

  function loadLibrary(shelf) {
    state.view = 'library';
    if (shelf) state.shelf = shelf;
    var shelfMeta = SHELVES.filter(function (s) { return s.id === state.shelf; })[0];
    el.gridTitle.textContent = state.shelf === 'all' ? 'My Shelf' : shelfMeta.label;
    setActiveNav('library');
    state.books = state.shelf === 'all'
      ? library()
      : library().filter(function (b) { return b.status === state.shelf; });
    renderShelves();
    render();
  }
  function loadRecent() {
    state.view = 'recent';
    el.gridTitle.textContent = 'Recently viewed';
    setActiveNav('recent');
    state.books = read(RECENT_KEY);
    renderShelves();
    render();
  }

  function openBook(book) {
    state.selected = book;
    pushRecent(book);
    render();
    renderQuick(book, null);
    fetch(API + '/works/' + book.id + '.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && state.selected && state.selected.id === book.id) renderQuick(book, d); })
      .catch(function () {});
  }

  /* ---------- events ---------- */
  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    Array.prototype.forEach.call(el.pills.children, function (p) { p.classList.remove('is-active'); });
    search(el.input.value.trim());
  });

  el.pills.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    Array.prototype.forEach.call(el.pills.children, function (p) { p.classList.remove('is-active'); });
    pill.classList.add('is-active');
    el.input.value = '';
    search(pill.dataset.q);
  });

  el.shelves.addEventListener('click', function (e) {
    var pill = e.target.closest('.shelf-pill');
    if (!pill) return;
    loadLibrary(pill.dataset.shelf);
  });

  el.grid.addEventListener('click', function (e) {
    var card = e.target.closest('.book-item');
    if (!card) return;
    var book = state.books.filter(function (b) { return b.id === card.dataset.id; })[0];
    if (!book) return;
    var act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      if (act.dataset.act === 'save') {
        if (inLibrary(book.id)) { removeBook(book.id); toast('Removed from Shelf'); }
        else { saveBook(Object.assign({}, book)); toast('Added to Shelf'); }
      } else if (act.dataset.act === 'mark-reading') {
        moveToShelf(book.id, 'reading');
        toast('Moved to Reading');
      } else if (act.dataset.act === 'mark-finished') {
        moveToShelf(book.id, 'finished');
        toast('Moved to Finished');
      } else {
        removeBook(book.id);
        toast('Removed from Shelf');
      }
      if (state.view === 'library') { loadLibrary(); } else render();
      if (state.selected && state.selected.id === book.id) renderQuick(state.selected, null);
      return;
    }
    openBook(book);
  });

  el.grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var card = e.target.closest('.book-item');
    if (card) card.click();
  });

  if (el.layoutToggle) el.layoutToggle.addEventListener('click', function (e) {
    var btn = e.target.closest('.layout-btn');
    if (!btn || btn.dataset.layout === state.layout) return;
    state.layout = btn.dataset.layout;
    try { localStorage.setItem(LAYOUT_KEY, state.layout); } catch (err) {}
    renderShelves();
    render();
  });

  document.querySelectorAll('.rail-btn[data-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.rail-btn[data-view]').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state.selected = null;
      renderQuick(null);
      var v = btn.dataset.view;
      el.tagline.textContent = v === 'library' ? 'Your shelves — organised by what you\'re reading'
        : v === 'recent' ? 'Pick up where you left off'
        : 'Find your next favourite read';
      if (v === 'library') loadLibrary(
