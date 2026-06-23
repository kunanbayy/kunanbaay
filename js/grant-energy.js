/* ============================================================
   Shyraq — Grant Career Energy менеджері (grant.html)
   ------------------------------------------------------------
   ӨНІМ ЛОГИКАСЫ
   • Толық грант талдауын (full result reveal) ашқан сәтте 1 ⚡ жұмсалады.
   • AI flow мен Manual flow — БІР ОРТАҚ balance (shyraq_energy) пайдаланады.
   • Ашылған "сессия" ағымдағы input signature-ге байланады:
       – параметр/режим өзгерсе → signature өзгереді → нәтиже қайта бұғатталады
         → келесі ашу ТАҒЫ 1 ⚡ алады (жаңа analysis = жаңа тұтыну).
       – signature өзгермесе (тек refresh/қайта render) → тегін, қайта алынбайды.
   • Energy = 0 болса → reveal блокталады, upgrade paywall modal ашылады.
   • shyraq_premium==='1' (админ) → шексіз, ешқашан энергия алынбайды.

   Балансты ShyraqEnergy (js/energy.js) басқарады; бұл модуль соның үстінде
   сессия логикасы + widget + paywall modal-ды қосады.

   Backend-ке көшіру: getCurrentPlan / getRemainingEnergy / canUnlockAnalysis /
   consumeEnergy / openLockedAnalysis әдістерінің ішін API шақыруларына
   ауыстыру жеткілікті — сыртқы интерфейс өзгермейді.
   ============================================================ */
window.GrantEnergy = (function () {
  'use strict';

  var SESSION_KEY = 'shyraq_grant_session';
  var PAYMENT = {
    standard: 'payment.html?plan=standard&next=grant',
    career:   'payment.html?plan=career&next=grant'
  };

  function E() { return window.ShyraqEnergy; }
  function has() { return !!window.ShyraqEnergy; }

  /* ---------- State / plan ---------- */
  function getCurrentPlan() {
    if (!has()) return { tier: 'free', name: 'Free', unlimited: false, totalEnergy: 0, usedEnergy: 0 };
    if (E().unlimited()) return { tier: 'premium', name: 'Premium', unlimited: true, totalEnergy: Infinity, usedEnergy: 0 };
    var total = E().total();
    var tier = 'free', name = 'Free';
    try {
      var u = JSON.parse(localStorage.getItem('shyraq_user') || 'null');
      if (u && u.plan === 'report')        { tier = 'premium';  name = 'Career Report'; }
      else if (u && u.plan === 'standard') { tier = 'standard'; name = 'Standard'; }
    } catch (e) {}
    if (tier === 'free') { // план белгісіз болса — жиынтық энергиядан шамалаймыз
      if (total >= 3)      { tier = 'premium';  name = 'Career Report'; }
      else if (total >= 1) { tier = 'standard'; name = 'Standard'; }
    }
    return { tier: tier, name: name, unlimited: false, totalEnergy: total, usedEnergy: E().used() };
  }
  function getRemainingEnergy() { return has() ? (E().unlimited() ? Infinity : E().bal()) : 0; }
  function canUnlockAnalysis() { return has() && (E().unlimited() || E().bal() > 0); }

  /* ---------- Unlocked session (signature-bound) ---------- */
  function session() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; } }
  function setSession(sig) { localStorage.setItem(SESSION_KEY, JSON.stringify({ sig: sig, at: Date.now() })); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function isUnlocked(sig) {
    if (has() && E().unlimited()) return true;
    var s = session();
    return !!(s && s.sig === sig);
  }

  /* ---------- Consume ---------- */
  function consumeEnergy() { return has() ? E().charge(1) : { ok: false, charged: 0, left: 0 }; }

  // Guarded reveal: ctx = { sig, source }
  function openLockedAnalysis(sig, source) {
    if (has() && E().unlimited()) return { ok: true, charged: 0 };
    if (isUnlocked(sig))          return { ok: true, charged: 0 };   // ағымдағы ақылы сессия
    if (!canUnlockAnalysis()) { showUpgradeModal(source); return { ok: false, charged: 0 }; }
    var r = consumeEnergy();
    if (r.ok) setSession(sig);
    renderEnergyWidget();
    return r;
  }

  /* ============================================================
     UI — widget + paywall modal (DOM + CSS өзі енгізеді)
     ============================================================ */
  function injectStyle() {
    if (document.getElementById('ce-style')) return;
    var css = document.createElement('style');
    css.id = 'ce-style';
    css.textContent = [
      ':root{--ce-p:var(--gp,#6D5DFC);--ce-pd:var(--gp-dark,#5848e0);--ce-line:var(--g-line,#ECECF3);--ce-mut:var(--text-muted,#64748B);--ce-green:var(--g-green,#10B981);--ce-orange:var(--g-orange,#F97316);--ce-red:var(--g-red,#EF4444);}',
      /* widget */
      '.ce-widget{position:fixed;right:20px;bottom:20px;z-index:9000;width:248px;background:#fff;border:1px solid var(--ce-line);border-radius:18px;box-shadow:0 16px 44px rgba(20,20,50,.16);padding:15px 16px;font-family:var(--font-body,inherit);transition:.2s;}',
      '.ce-widget.ce-hide{opacity:0;transform:translateY(12px);pointer-events:none;}',
      '.ce-w-top{display:flex;align-items:center;gap:8px;margin-bottom:9px;}',
      '.ce-w-bolt{width:30px;height:30px;flex:0 0 30px;border-radius:9px;background:var(--gp-soft,#EEEBFF);color:var(--ce-p);display:flex;align-items:center;justify-content:center;font-size:1rem;}',
      '.ce-w-tier{font-weight:800;font-size:.92rem;color:#1e2030;line-height:1.1;}',
      '.ce-w-cap{font-size:.72rem;color:var(--ce-mut);}',
      '.ce-w-count{margin-left:auto;text-align:right;font-weight:800;font-size:1.02rem;color:var(--ce-p);}',
      '.ce-w-count small{display:block;font-weight:600;font-size:.66rem;color:var(--ce-mut);}',
      '.ce-w-bar{height:7px;border-radius:999px;background:#EEF0F6;overflow:hidden;margin:4px 0 8px;}',
      '.ce-w-bar i{display:block;height:100%;border-radius:999px;background:var(--ce-p);transition:width .35s ease;}',
      '.ce-w-status{font-size:.76rem;font-weight:700;display:flex;align-items:center;gap:6px;}',
      '.ce-w-status .dot{width:8px;height:8px;border-radius:50%;background:var(--ce-green);}',
      '.ce-w-cta{display:none;margin-top:11px;width:100%;border:none;border-radius:11px;padding:9px;font-weight:800;font-size:.82rem;font-family:inherit;cursor:pointer;background:var(--ce-p);color:#fff;}',
      '.ce-w-cta:hover{background:var(--ce-pd);}',
      /* states */
      '.ce-widget.warn{border-color:#FED7AA;}',
      '.ce-widget.warn .ce-w-bar i,.ce-widget.warn .ce-w-count{background:var(--ce-orange);} .ce-widget.warn .ce-w-count{background:none;color:var(--ce-orange);}',
      '.ce-widget.warn .ce-w-status .dot{background:var(--ce-orange);}',
      '.ce-widget.empty{border-color:#FECACA;}',
      '.ce-widget.empty .ce-w-bar i{background:var(--ce-red);} .ce-widget.empty .ce-w-count{color:var(--ce-red);}',
      '.ce-widget.empty .ce-w-status .dot{background:var(--ce-red);}',
      '.ce-widget.empty .ce-w-cta{display:block;}',
      '.ce-widget.unlimited .ce-w-bar{display:none;}',
      /* modal */
      '.ce-modal{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(18,18,40,.55);backdrop-filter:blur(3px);}',
      '.ce-modal.open{display:flex;}',
      '.ce-modal-box{width:100%;max-width:440px;background:#fff;border-radius:24px;padding:30px 26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.3);animation:ce-pop .25s ease;}',
      '@keyframes ce-pop{from{opacity:0;transform:scale(.94) translateY(10px);}to{opacity:1;transform:none;}}',
      '.ce-modal-ic{width:62px;height:62px;margin:0 auto 16px;border-radius:50%;background:var(--gp-soft,#EEEBFF);color:var(--ce-p);display:flex;align-items:center;justify-content:center;font-size:1.7rem;}',
      '.ce-modal h3{font-family:var(--font-display,inherit);font-size:1.32rem;margin:0 0 8px;color:#1e2030;}',
      '.ce-modal p{color:var(--ce-mut);font-size:.96rem;line-height:1.55;margin:0 0 22px;}',
      '.ce-modal-btns{display:flex;flex-direction:column;gap:10px;}',
      '.ce-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border-radius:14px;font-weight:800;font-size:.98rem;font-family:inherit;cursor:pointer;text-decoration:none;border:none;transition:.16s;}',
      '.ce-btn-gold{background:var(--ce-p);color:#fff;box-shadow:0 12px 26px rgba(109,93,252,.28);} .ce-btn-gold:hover{background:var(--ce-pd);transform:translateY(-1px);}',
      '.ce-btn-out{background:#fff;color:#1e2030;border:1.5px solid var(--ce-line);} .ce-btn-out:hover{border-color:var(--ce-p);color:var(--ce-p);}',
      '.ce-modal-close{margin-top:14px;background:none;border:none;color:var(--ce-mut);font-size:.86rem;cursor:pointer;text-decoration:underline;}',
      /* Мобильде ықшам — контентті жаппайтын кіші pill (оң төменгі бұрыш) */
      '@media(max-width:640px){',
      '.ce-widget{right:10px;left:auto;bottom:10px;width:auto;max-width:62vw;padding:10px 13px;border-radius:14px;}',
      '.ce-widget .ce-w-bar,.ce-widget .ce-w-cap{display:none;}',
      '.ce-w-top{margin-bottom:4px;gap:7px;}',
      '.ce-w-bolt{width:26px;height:26px;flex:0 0 26px;font-size:.9rem;}',
      '.ce-w-tier{font-size:.82rem;}',
      '.ce-w-count{font-size:.92rem;}.ce-w-count small{font-size:.6rem;}',
      '.ce-w-status{font-size:.7rem;}',
      '.ce-widget.empty .ce-w-cta{margin-top:8px;padding:8px;font-size:.78rem;}',
      '}'
    ].join('');
    document.head.appendChild(css);
  }

  function mount() {
    injectStyle();
    if (!document.getElementById('ceWidget')) {
      var w = document.createElement('div');
      w.id = 'ceWidget'; w.className = 'ce-widget';
      w.innerHTML =
        '<div class="ce-w-top">' +
          '<div class="ce-w-bolt">⚡</div>' +
          '<div><div class="ce-w-tier" id="ceTier">Career Energy</div><div class="ce-w-cap" id="ceCap">мүмкіндік</div></div>' +
          '<div class="ce-w-count" id="ceCount">0<small>қалды</small></div>' +
        '</div>' +
        '<div class="ce-w-bar"><i id="ceBar" style="width:0%"></i></div>' +
        '<div class="ce-w-status" id="ceStatus"><span class="dot"></span><span id="ceStatusTxt">—</span></div>' +
        '<button class="ce-w-cta" id="ceWidgetCta" type="button">Тариф сатып алу</button>';
      document.body.appendChild(w);
      w.querySelector('#ceWidgetCta').addEventListener('click', function () { showUpgradeModal('widget'); });
    }
    if (!document.getElementById('ceModal')) {
      var m = document.createElement('div');
      m.id = 'ceModal'; m.className = 'ce-modal';
      m.innerHTML =
        '<div class="ce-modal-box" role="dialog" aria-modal="true">' +
          '<div class="ce-modal-ic">⚡</div>' +
          '<h3 id="ceModalTitle">Career Energy аяқталды</h3>' +
          '<p id="ceModalText">Толық грант талдауын қайта ашу үшін тариф сатып алыңыз.</p>' +
          '<div class="ce-modal-btns">' +
            '<a class="ce-btn ce-btn-gold" id="ceBuyCareer" href="' + PAYMENT.career + '">🚀 Career Report — 3 ⚡</a>' +
            '<a class="ce-btn ce-btn-out" id="ceBuyStd" href="' + PAYMENT.standard + '">⭐ Standard — 1 ⚡</a>' +
          '</div>' +
          '<button class="ce-modal-close" id="ceModalClose" type="button">Жабу</button>' +
        '</div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m) hideUpgradeModal(); });
      m.querySelector('#ceModalClose').addEventListener('click', hideUpgradeModal);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideUpgradeModal(); });
    }
    renderEnergyWidget();
  }

  function renderEnergyWidget() {
    var w = document.getElementById('ceWidget'); if (!w) return;
    var plan = getCurrentPlan();
    var tierEl = document.getElementById('ceTier');
    var capEl = document.getElementById('ceCap');
    var countEl = document.getElementById('ceCount');
    var barEl = document.getElementById('ceBar');
    var stxt = document.getElementById('ceStatusTxt');

    w.classList.remove('warn', 'empty', 'unlimited');

    if (plan.unlimited) {
      w.classList.add('unlimited');
      tierEl.textContent = 'Premium';
      capEl.textContent = 'Шексіз доступ';
      countEl.innerHTML = '∞';
      stxt.textContent = 'Барлық талдау ашық';
      return;
    }

    var total = plan.totalEnergy, remaining = getRemainingEnergy(), used = plan.usedEnergy;
    tierEl.textContent = plan.name;
    capEl.textContent = 'Career Energy';
    countEl.innerHTML = remaining + (total ? ' / ' + total : '') + '<small>' + (used ? used + ' қолданылды' : 'қалды') + '</small>';
    barEl.style.width = (total ? Math.round(remaining / total * 100) : 0) + '%';

    if (remaining <= 0) {
      w.classList.add('empty');
      stxt.textContent = total ? 'Мүмкіндік аяқталды' : 'Толық талдау үшін тариф қажет';
    } else if (remaining === 1) {
      w.classList.add('warn');
      stxt.textContent = 'Соңғы мүмкіндік';
    } else {
      stxt.textContent = 'Мүмкіндік бар';
    }
  }

  function showUpgradeModal(source) {
    mount();
    var m = document.getElementById('ceModal'); if (!m) return;
    var plan = getCurrentPlan();
    var title = document.getElementById('ceModalTitle');
    var text = document.getElementById('ceModalText');
    if (plan.totalEnergy === 0) {
      title.textContent = 'Career Energy қажет';
      text.textContent = 'Толық грант талдауын ашу үшін тариф сатып алыңыз. Әр энергиямен бір толық анализ ашасыз.';
    } else {
      title.textContent = 'Career Energy аяқталды';
      text.textContent = 'Барлық мүмкіндігіңізді пайдаландыңыз. Толық грант талдауын қайта ашу үшін тариф сатып алыңыз.';
    }
    m.setAttribute('data-source', source || '');
    m.classList.add('open');
  }
  function hideUpgradeModal() {
    var m = document.getElementById('ceModal');
    if (m) m.classList.remove('open');
  }

  return {
    mount: mount,
    getCurrentPlan: getCurrentPlan,
    getRemainingEnergy: getRemainingEnergy,
    canUnlockAnalysis: canUnlockAnalysis,
    isUnlocked: isUnlocked,
    consumeEnergy: consumeEnergy,
    openLockedAnalysis: openLockedAnalysis,
    showUpgradeModal: showUpgradeModal,
    hideUpgradeModal: hideUpgradeModal,
    renderEnergyWidget: renderEnergyWidget,
    clearSession: clearSession
  };
})();
