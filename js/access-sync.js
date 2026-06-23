/* ============================================================
   Shyraq — Қолжетімділік синхрондау
   Кірген қолданушының премиум/бұғат күйін Supabase 'access' кестесінен
   оқып, localStorage-ты жаңартады. Сонда admin доступ берсе/алса —
   бет жаңарған соң сайттағы барлық премиум функция ашылады/жабылады.
   Жүктелу реті: supabase-js → config → auth → db → осы файл.
   ============================================================ */
(async function () {
  try {
    if (localStorage.getItem('shyraq_admin') === '1') return;       // админге қатысы жоқ
    var u = JSON.parse(localStorage.getItem('shyraq_user') || 'null');
    if (!u || !u.email) return;
    if (!(window.ShyraqDB && window.ShyraqDB.ready())) return;

    var acc = await window.ShyraqDB.getAccess(u.email);
    var wasPremium = localStorage.getItem('shyraq_premium') === '1';
    var nowPremium = false;
    var changed = false;

    if (acc) {
      nowPremium = !!acc.premium && (!acc.premium_until || new Date(acc.premium_until) > new Date());
      // бұғат
      if (acc.blocked) {
        localStorage.removeItem('shyraq_premium');
        localStorage.removeItem('shyraq_user');
        alert('Аккаунтыңыз бұғатталған. Әкімшіге хабарласыңыз.');
        window.location.href = 'login.html';
        return;
      }
    }

    if (nowPremium) {
      localStorage.setItem('shyraq_premium', '1');
      if (acc.premium_until) localStorage.setItem('shyraq_premium_until', acc.premium_until);
    } else {
      localStorage.removeItem('shyraq_premium');
      localStorage.removeItem('shyraq_premium_until');
    }

    // ── Career Energy ──
    // acc.energy — НАҚТЫ ҚАЛДЫҚ (бірден-бір ақиқат көзі, дерекқорда).
    // acc.energy_total — барлық берілген (виджеттегі «x / total» үшін).
    // Дерекқорды localStorage-қа айна ретінде көшіреміз: admin қосса/алса не
    // grant.html жұмсаса — қалдық осы арқылы барлық құрылғыда дұрыс көрінеді.
    if (acc) {
      var remaining = parseInt(acc.energy || 0, 10) || 0;
      var totalGranted = acc.energy_total != null
        ? (parseInt(acc.energy_total, 10) || 0)
        : Math.max(remaining, parseInt(localStorage.getItem('shyraq_energy_total') || '0', 10) || 0);
      var prevRemaining = parseInt(localStorage.getItem('shyraq_energy') || '0', 10) || 0;
      localStorage.setItem('shyraq_energy', String(remaining));
      localStorage.setItem('shyraq_energy_total', String(totalGranted));
      localStorage.removeItem('shyraq_energy_credited');   // ескі модельден тазарту
      localStorage.removeItem('shyraq_pending_energy');
      if (remaining !== prevRemaining) changed = true;
    }

    // ── Results Full Report (990₸) — Career Energy-ден БӨЛЕК entitlement ──
    if (acc) {
      var wasResults = localStorage.getItem('shyraq_results_unlocked') === '1';
      var nowResults = !!acc.results_unlocked;
      if (nowResults) localStorage.setItem('shyraq_results_unlocked', '1');
      else localStorage.removeItem('shyraq_results_unlocked');
      if (nowResults !== wasResults) changed = true;
    }

    // Күй (премиум не энергия) өзгерсе — бетті бір рет қайта жүктеп, дұрыс көрсету
    if ((nowPremium !== wasPremium || changed) && !sessionStorage.getItem('shyraq_access_synced')) {
      sessionStorage.setItem('shyraq_access_synced', '1');
      window.location.reload();
    }
  } catch (e) { /* елемейміз */ }
})();
