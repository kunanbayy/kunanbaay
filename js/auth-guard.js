/* Auth guard — include AFTER main.js on every protected page */
(function() {
  const FREE_LIMITS = { specialties: 3, universities: 3, grantUses: 1 };

  function getGrantUses() { return +(localStorage.getItem('shyraq_grantUses') || 0); }
  function incGrantUses() { localStorage.setItem('shyraq_grantUses', getGrantUses() + 1); }

  /* Page-level auth check — shows modal but doesn't redirect */
  function guardPage(reason) {
    if (!isLoggedIn()) {
      document.addEventListener('DOMContentLoaded', () => showAuthModal(reason));
      return false;
    }
    return true;
  }

  /* Apply free-limit gate to a list container */
  function applyListGate(listEl, total, freeMax, featureName, callbackRender) {
    if (!listEl) return;
    if (isPremium()) { callbackRender(total); return; }
    callbackRender(freeMax);
    showFreeLimitBanner(listEl.parentElement || listEl, total, freeMax, featureName);
  }

  /* Expose helpers globally for page scripts */
  window.ShyraqGate = {
    guardPage,
    applyListGate,
    getGrantUses,
    incGrantUses,
    FREE_LIMITS,
  };
})();
