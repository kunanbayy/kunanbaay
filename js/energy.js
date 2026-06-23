/* ============================================================
   Shyraq — Career Energy қол жеткізу жүйесі
   Энергия = толық анализ ашатын «валюта».
   • Әр толық бөлімді ашу 1 ⚡ алады; ашылған соң ол бөлім сақталады
     (қайта есептеу/қайта кіру тегін, екінші рет алынбайды).
   • Standard = 1 ⚡, Career Report = 3 ⚡ (admin растағанда беріледі).
   • shyraq_premium==='1' — админ берген ШЕКСІЗ доступ; одан энергия алынбайды.
   localStorage кілттері: shyraq_energy (қалдық), shyraq_energy_total (барлығы),
   shyraq_unlocked (ашылған бөлімдер картасы).
   ============================================================ */
(function () {
  function bal() { return parseInt(localStorage.getItem('shyraq_energy') || '0', 10) || 0; }
  function setBal(n) { localStorage.setItem('shyraq_energy', String(Math.max(0, n | 0))); }
  function total() { return parseInt(localStorage.getItem('shyraq_energy_total') || '0', 10) || 0; }
  function used() { return Math.max(0, total() - bal()); }
  function unlimited() { return localStorage.getItem('shyraq_premium') === '1'; }

  // Қалдықты дерекқорға (access.energy) жазу — admin панелі мен басқа құрылғылар
  // бірдей мәнді көреді. Кірген қолданушы болса ғана; әйтпесе тек localStorage.
  function persistRemaining() {
    try {
      if (localStorage.getItem('shyraq_admin') === '1') return;
      var u = JSON.parse(localStorage.getItem('shyraq_user') || 'null');
      if (!u || !u.email) return;
      if (!(window.ShyraqDB && window.ShyraqDB.ready())) return;
      window.ShyraqDB.setAccess(u.email, { energy: bal(), energy_total: total() });
    } catch (e) { /* елемейміз — localStorage күйі сақталады, келесі грантта түзеледі */ }
  }

  // Балансты тікелей азайту (бөлім кілтінсіз) — grant.html сессиялық тұтыну үшін.
  // Қайтарады: {ok, charged, left}
  function charge(n) {
    n = parseInt(n, 10) || 1;
    if (unlimited()) return { ok: true, charged: 0, left: Infinity };
    var b = bal();
    if (b < n) return { ok: false, charged: 0, left: b };
    setBal(b - n);
    persistRemaining();
    return { ok: true, charged: n, left: b - n };
  }

  function map() {
    try { return JSON.parse(localStorage.getItem('shyraq_unlocked') || '{}') || {}; }
    catch (e) { return {}; }
  }
  function isUnlocked(key) { return unlimited() || !!map()[key]; }
  function markUnlocked(key) {
    var m = map(); m[key] = true;
    localStorage.setItem('shyraq_unlocked', JSON.stringify(m));
  }

  // Бөлімді ашу әрекеті. Қайтарады: {ok, charged, left}
  function spend(key) {
    if (isUnlocked(key)) return { ok: true, charged: 0, left: unlimited() ? Infinity : bal() };
    var b = bal();
    if (b <= 0) return { ok: false, charged: 0, left: 0 };
    setBal(b - 1);
    markUnlocked(key);
    persistRemaining();
    return { ok: true, charged: 1, left: b - 1 };
  }

  function grant(n) {
    n = parseInt(n, 10) || 0;
    if (n <= 0) return;
    setBal(bal() + n);
    var tot = parseInt(localStorage.getItem('shyraq_energy_total') || '0', 10) || 0;
    localStorage.setItem('shyraq_energy_total', String(tot + n));
    persistRemaining();
  }

  window.ShyraqEnergy = {
    bal: bal, total: total, used: used, unlimited: unlimited,
    isUnlocked: isUnlocked, markUnlocked: markUnlocked,
    charge: charge, spend: spend, grant: grant, persist: persistRemaining
  };
})();
