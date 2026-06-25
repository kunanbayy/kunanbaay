/* ============================================================
   Shyraq — Admin overrides layer
   Admin панельде енгізілген өзгерістерді (университеттер,
   мамандықтар, пікірлер, тарифтер) публикалық беттерге қолданады.
   Деректер localStorage-та сақталады (статикалық сайт).
   Бұл файл js/universities-data.js-тен КЕЙІН жүктелуі тиіс.
   ============================================================ */
(function () {
  function read(key, def) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; }
    catch (e) { return def; }
  }

  /* ── 1) Университет өзгерістерін seed-ке қолдану ── */
  const seed = window.UNIVERSITIES_SEED;
  if (Array.isArray(seed)) {
    const ov = read('shyraq_uni_overrides', {});
    for (let i = seed.length - 1; i >= 0; i--) {
      const o = ov[seed[i].id];
      if (!o) continue;
      if (o.hidden) { seed.splice(i, 1); continue; }
      if (o.name_kz != null && o.name_kz !== '') seed[i].name_kz = o.name_kz;
      if (o.city != null && o.city !== '') seed[i].city = o.city;
      if (o.category != null && o.category !== '') seed[i].category = o.category;
      if (o.status != null && o.status !== '') seed[i].status = o.status;
      if (o.phone != null && o.phone !== '') seed[i].phone = o.phone;
      if (o.official_website != null && o.official_website !== '') seed[i].official_website = o.official_website;
      if (o.description != null && o.description !== '') seed[i].description = o.description;
    }
  }

  /* ── 2) Мамандық (MAJOR_PROGRAMS) өзгерістері ── */
  window.applySpecOverrides = function (arr) {
    if (!Array.isArray(arr)) return arr;
    const ov = read('shyraq_spec_overrides', {});
    const del = read('shyraq_spec_deleted', []);
    const add = read('shyraq_spec_added', []);
    for (let i = arr.length - 1; i >= 0; i--) {
      if (del.indexOf(arr[i].code) !== -1) { arr.splice(i, 1); continue; }
      const o = ov[arr[i].code];
      if (o) {
        if (o.name != null && o.name !== '') arr[i].name = o.name;
        if (o.subject != null && o.subject !== '') arr[i].subject = o.subject;
      }
    }
    add.forEach(s => { if (!arr.some(x => x.code === s.code)) arr.unshift(s); });
    return arr;
  };

  /* Бір мамандықтың толық override-ы (name, subject, threshold, grant, desc) */
  window.getSpecFullOverride = function (code) {
    const ov = read('shyraq_spec_overrides', {});
    const add = read('shyraq_spec_added', []);
    const a = add.find(s => s.code === code);
    return Object.assign({}, a || {}, ov[code] || {});
  };

  /* ── 3) Пікірлер (homepage testimonials) ── */
  window.getAdminReviews = function () { return read('shyraq_admin_reviews', null); };

  /* ── 4) Тарифтер (pricing.html) ── */
  window.applyPricing = function (annual) {
    const p = read('shyraq_pricing', null);
    if (!p) return;
    const val = k => p[k];
    const fmt = n => Number(n).toLocaleString('ru-RU').replace(/[ ,]/g, ' ') + ' ₸';
    document.querySelectorAll('.pamt[data-plan]').forEach(el => {
      const k = el.getAttribute('data-plan');
      const raw = val(k);
      if (raw == null) return;
      const m = Number(raw);
      if (el.hasAttribute('data-m')) {
        el.dataset.m = fmt(m);
        el.dataset.a = fmt(Math.round(m * 0.8));
        el.innerHTML = (annual ? el.dataset.a : el.dataset.m) + ' <small>/ ай</small>';
      } else {
        el.innerHTML = fmt(m);
      }
    });
  };
})();
