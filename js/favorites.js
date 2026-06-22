/* ============================================================
   Shyraq — Таңдаулылар (favorites) — localStorage
   ============================================================ */
(function () {
  const KEY = 'shyraq_favorites';
  function list() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { localStorage.setItem(KEY, JSON.stringify(a)); }
  function has(code) { return list().some(x => x.code === code); }
  function add(item) { const a = list(); if (!a.some(x => x.code === item.code)) { a.unshift(item); save(a); } }
  function remove(code) { save(list().filter(x => x.code !== code)); }
  function toggle(item) {
    if (has(item.code)) { remove(item.code); return false; }
    add(item); return true;
  }
  window.ShyraqFav = { list, has, add, remove, toggle };
})();
