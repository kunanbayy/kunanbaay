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
    // acc.energy — админ растаған төлемдер бойынша берілген ЖИЫНТЫҚ энергия.
    // Локальды 'credited' маркер арқылы тек жаңасын ғана қосамыз (бір реттен).
    // Бұл құрылғыдан тәуелсіз жұмыс істейді әрі премиум бітсе де энергия қалады.
    if (acc) {
      var granted  = parseInt(acc.energy || 0, 10) || 0;
      var credited = parseInt(localStorage.getItem('shyraq_energy_credited') || '0', 10) || 0;
      if (granted > credited) {
        var add = granted - credited;
        var cur = parseInt(localStorage.getItem('shyraq_energy') || '0', 10) || 0;
        var tot = parseInt(localStorage.getItem('shyraq_energy_total') || '0', 10) || 0;
        localStorage.setItem('shyraq_energy', String(cur + add));
        localStorage.setItem('shyraq_energy_total', String(tot + add));
        localStorage.setItem('shyraq_energy_credited', String(granted));
        localStorage.removeItem('shyraq_pending_energy');
        changed = true;
      }
    }

    // Күй (премиум не энергия) өзгерсе — бетті бір рет қайта жүктеп, дұрыс көрсету
    if ((nowPremium !== wasPremium || changed) && !sessionStorage.getItem('shyraq_access_synced')) {
      sessionStorage.setItem('shyraq_access_synced', '1');
      window.location.reload();
    }
  } catch (e) { /* елемейміз */ }
})();
