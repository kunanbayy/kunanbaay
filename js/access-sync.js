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
      // Төлем расталды → күтудегі Career Energy-ді есепке қосамыз (бір рет)
      var pend = parseInt(localStorage.getItem('shyraq_pending_energy') || '0', 10);
      if (pend > 0) {
        var cur = parseInt(localStorage.getItem('shyraq_energy') || '0', 10);
        localStorage.setItem('shyraq_energy', String(cur + pend));
        localStorage.setItem('shyraq_energy_total', String((parseInt(localStorage.getItem('shyraq_energy_total') || '0', 10)) + pend));
        localStorage.removeItem('shyraq_pending_energy');
      }
    } else {
      localStorage.removeItem('shyraq_premium');
      localStorage.removeItem('shyraq_premium_until');
    }

    // Күй өзгерсе — бетті бір рет қайта жүктеп, дұрыс көрсету
    if (nowPremium !== wasPremium && !sessionStorage.getItem('shyraq_access_synced')) {
      sessionStorage.setItem('shyraq_access_synced', '1');
      window.location.reload();
    }
  } catch (e) { /* елемейміз */ }
})();
