/* ============================================================
   Shyraq — Kaspi OCR backend (kaspi-verify) баптауы (production)
   ------------------------------------------------------------
   Бір ғана нәрсе керек: kaspi-verify серверінің деплой URL-і.
   Оны екі жолмен қоюға болады:
     1) Төмендегі PROD_API жолына жазу (содан соң сайтты қайта деплой), НЕМЕСЕ
     2) Браузер консолінде (қайта деплойсыз, бірден қосылады):
          localStorage.setItem('shyraq_api_url', 'https://СІЗДІҢ-БЭКЕНД.vercel.app')
          localStorage.setItem('shyraq_admin_token', 'ADMIN_TOKEN мәні')  // тек admin.html-де

   Бос болса — payment.html "қолмен растау" режимінде (OCR автотексеру болмайды).
   URL қойылса — receipt upload → backend OCR → approved/rejected автоматты іске қосылады.
   ============================================================ */

// ← Деплойдан кейінгі production URL осында (немесе localStorage арқылы):
var PROD_API = '';            // мыс: 'https://shyraq-kaspi-verify.vercel.app'
var PROD_ADMIN_TOKEN = '';    // backend ADMIN_TOKEN-мен бірдей (тек admin.html үшін)

window.SHYRAQ_API = (function () {
  try { var o = localStorage.getItem('shyraq_api_url'); if (o) return o.replace(/\/$/, ''); } catch (e) {}
  return PROD_API.replace(/\/$/, '');
})();

window.SHYRAQ_ADMIN_TOKEN = (function () {
  try { var t = localStorage.getItem('shyraq_admin_token'); if (t) return t; } catch (e) {}
  return PROD_ADMIN_TOKEN;
})();
