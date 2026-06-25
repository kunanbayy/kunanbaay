/* ============================================================
   Shyraq notifications — admin broadcast → user bell
   Requires: supabase-db.js for cross-device persistence.
   Falls back to localStorage so the UI never breaks.
   ============================================================ */
(function () {
  function parse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (e) { return fallback; }
  }
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('shyraq_user') || 'null'); }
    catch (e) { return null; }
  }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function dateLabel(value) {
    if (!value) return '';
    try {
      var d = new Date(value);
      if (isNaN(d)) return '';
      return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
    } catch (e) { return ''; }
  }
  function readKey(email) {
    return 'shyraq_notification_reads_' + String(email || 'guest').toLowerCase();
  }
  function localNotes(email) {
    var notes = parse('shyraq_notifications', []);
    var reads = parse(readKey(email), {});
    return notes.map(function (note) {
      return Object.assign({}, note, { is_read: !!reads[note.id] });
    }).sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }
  function localMarkRead(id, email) {
    var reads = parse(readKey(email), {});
    reads[id] = true;
    localStorage.setItem(readKey(email), JSON.stringify(reads));
  }
  async function loadNotifications(user) {
    if (window.ShyraqDB && window.ShyraqDB.listNotifications && window.ShyraqDB.ready()) {
      var rows = await window.ShyraqDB.listNotifications(user.email);
      if (rows) return rows;
    }
    return localNotes(user.email);
  }
  async function markRead(note, user) {
    if (!note || note.is_read) return;
    note.is_read = true;
    if (window.ShyraqDB && window.ShyraqDB.markNotificationRead && window.ShyraqDB.ready()) {
      await window.ShyraqDB.markNotificationRead(note.id, user);
    }
    localMarkRead(note.id, user.email);
  }
  function styleOnce() {
    if (document.getElementById('shyraqNotificationStyles')) return;
    var style = document.createElement('style');
    style.id = 'shyraqNotificationStyles';
    style.textContent = [
      '.shy-notify{position:relative;display:inline-flex;align-items:center;z-index:1000}',
      '.shy-notify.open{z-index:10000}',
      '.shy-notify-btn{width:42px;height:42px;border:1px solid rgba(226,232,240,.9);border-radius:14px;background:rgba(255,255,255,.92);color:#1E3A5F;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 24px rgba(30,58,95,.08);transition:.18s}',
      '.shy-notify-btn:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(30,58,95,.14)}',
      '.shy-notify-btn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
      '.shy-notify-count{position:absolute;right:-5px;top:-5px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#EF4444;color:#fff;font-size:11px;font-weight:900;display:none;align-items:center;justify-content:center;border:2px solid #fff}',
      '.shy-notify.has-unread .shy-notify-count{display:flex}',
      '.shy-notify-panel{position:absolute;right:0;top:50px;width:min(360px,calc(100vw - 28px));max-height:min(440px,calc(100dvh - 96px));overflow:auto;background:rgba(255,255,255,.98);border:1px solid #E5EBF2;border-radius:18px;box-shadow:0 24px 70px rgba(15,27,45,.18);padding:12px;display:none;text-align:left;color:#0F1B2D;backdrop-filter:blur(16px);z-index:10001}',
      '.dashboard-header .shy-notify-panel,.mobile-top-bar .shy-notify-panel{position:fixed;right:16px;top:72px;width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 96px)}',
      '.shy-notify.open .shy-notify-panel{display:block}',
      '.shy-notify-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 4px 10px;border-bottom:1px solid #F1F5F9;margin-bottom:8px}',
      '.shy-notify-head strong{font-size:14px;color:#0F1B2D}',
      '.shy-notify-head span{font-size:12px;color:#7A8AA0;font-weight:700}',
      '.shy-note{border:1px solid #EEF2F7;border-radius:14px;padding:12px 13px;margin-bottom:8px;background:linear-gradient(180deg,#fff,#FAFCFF)}',
      '.shy-note.unread{border-color:rgba(45,84,145,.26);background:linear-gradient(180deg,#F7FBFF,#fff)}',
      '.shy-note-title{font-weight:850;color:#1E3A5F;font-size:14px;margin-bottom:5px;line-height:1.3}',
      '.shy-note-body{font-size:13px;line-height:1.45;color:#475569;white-space:pre-wrap}',
      '.shy-note-date{font-size:11px;color:#94A3B8;font-weight:800;margin-top:8px}',
      '.shy-note-empty{padding:24px 12px;text-align:center;color:#7A8AA0;font-size:13px}',
      '@media(max-width:560px){.shy-notify-panel,.dashboard-header .shy-notify-panel,.mobile-top-bar .shy-notify-panel{position:fixed;left:12px;right:12px;top:68px;width:auto;max-height:calc(100dvh - 92px)}}'
    ].join('');
    document.head.appendChild(style);
  }
  function targetContainers() {
    return [
      document.querySelector('.dash-header-right'),
      document.querySelector('.mobile-top-bar'),
      document.querySelector('.nav-actions.auth-show'),
      document.querySelector('.nav-actions'),
      document.querySelector('.maj-topbar'),
      document.querySelector('.profile-hero'),
      document.querySelector('.rs-top')
    ].filter(Boolean);
  }
  function renderPanel(root, notes) {
    var unread = notes.filter(function (n) { return !n.is_read; }).length;
    root.classList.toggle('has-unread', unread > 0);
    root.querySelector('.shy-notify-count').textContent = unread > 9 ? '9+' : String(unread);
    root.querySelector('.shy-notify-list').innerHTML = notes.length ? notes.map(function (note) {
      return '<article class="shy-note ' + (!note.is_read ? 'unread' : '') + '">' +
        '<div class="shy-note-title">' + esc(note.title) + '</div>' +
        '<div class="shy-note-body">' + esc(note.body) + '</div>' +
        '<div class="shy-note-date">' + esc(dateLabel(note.created_at)) + '</div>' +
      '</article>';
    }).join('') : '<div class="shy-note-empty">Әзірге хабарлама жоқ</div>';
  }
  function createBell(user) {
    var root = document.createElement('div');
    root.className = 'shy-notify';
    root.innerHTML =
      '<button class="shy-notify-btn" type="button" aria-label="Хабарламалар" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>' +
      '</button>' +
      '<span class="shy-notify-count">0</span>' +
      '<div class="shy-notify-panel" role="dialog" aria-label="Хабарламалар">' +
        '<div class="shy-notify-head"><strong>Хабарламалар</strong><span>Shyraq</span></div>' +
        '<div class="shy-notify-list"><div class="shy-note-empty">Жүктелуде...</div></div>' +
      '</div>';
    var notes = [];
    var btn = root.querySelector('.shy-notify-btn');
    btn.addEventListener('click', async function (event) {
      event.stopPropagation();
      var open = !root.classList.contains('open');
      root.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var unread = notes.filter(function (n) { return !n.is_read; });
        await Promise.all(unread.map(function (note) { return markRead(note, user); }));
        renderPanel(root, notes);
      }
    });
    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) {
        root.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    loadNotifications(user).then(function (rows) {
      notes = rows || [];
      renderPanel(root, notes);
    });
    return root;
  }
  function mount() {
    var user = currentUser();
    var adminPreview = localStorage.getItem('shyraq_admin') === '1' && location.search.includes('as=student');
    if (!user || !user.email || (localStorage.getItem('shyraq_admin') === '1' && !adminPreview)) return;
    styleOnce();
    targetContainers().forEach(function (container, index) {
      if (container.querySelector('.shy-notify')) return;
      var bell = createBell(user);
      if (container.classList.contains('mobile-top-bar')) {
        container.insertBefore(bell, container.lastElementChild);
      } else if (container.classList.contains('maj-topbar')) {
        container.insertBefore(bell, container.querySelector('.maj-cabinet') || container.lastElementChild);
      } else if (container.classList.contains('profile-hero')) {
        container.insertBefore(bell, container.lastElementChild);
      } else {
        container.insertBefore(bell, container.firstChild);
      }
      if (index > 0) bell.classList.add('shy-notify-secondary');
    });
  }
  document.addEventListener('DOMContentLoaded', mount);
})();
