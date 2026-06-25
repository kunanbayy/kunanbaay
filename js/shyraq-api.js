/* ============================================================
   Shyraq — Kaspi OCR backend (kaspi-verify) баптауы (production)
   ------------------------------------------------------------
   Бір ғана нәрсе керек: kaspi-verify серверінің деплой URL-і.
   Оны екі жолмен қоюға болады:
     1) Төмендегі PROD_API жолына жазу (содан соң сайтты қайта деплой), НЕМЕСЕ
     2) Браузер консолінде (қайта деплойсыз, бірден қосылады):
          localStorage.setItem('shyraq_api_url', 'https://СІЗДІҢ-БЭКЕНД.vercel.app')

   Бос болса — payment.html "қолмен растау" режимінде (OCR автотексеру болмайды).
   URL қойылса — receipt upload → backend OCR → approved/rejected автоматты іске қосылады.
   ============================================================ */

// ← Production backend (Vercel-ге деплой жасалған kaspi-verify):
var PROD_API = 'https://kaspi-verify.vercel.app';
window.SHYRAQ_API = (function () {
  try { var o = localStorage.getItem('shyraq_api_url'); if (o) return o.replace(/\/$/, ''); } catch (e) {}
  return PROD_API.replace(/\/$/, '');
})();

window.SHYRAQ_ADMIN_SESSION = (function () {
  try { return localStorage.getItem('shyraq_admin_session') || ''; } catch (e) { return ''; }
})();
