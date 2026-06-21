/* ============================================================
   Shyraq — аутентификация модулі
   Supabase бапталса → нақты backend (тіркелу/кіру/сессия сақталады).
   Бапталмаса → localStorage fallback (демо, бірақ нақты аты сақталады).
   Жүктелу реті: supabase-js (CDN) → supabase-config.js → осы файл.
   ============================================================ */
(function () {
  const cfg = window.SHYRAQ_SUPABASE || {};
  let sb = null;

  function configured() {
    return !!(cfg.url && cfg.anonKey && window.supabase && window.supabase.createClient);
  }
  if (configured()) {
    try { sb = window.supabase.createClient(cfg.url, cfg.anonKey); } catch (e) { sb = null; }
  }

  /* ── localStorage fallback аккаунттар қоймасы ── */
  const KEY = 'shyraq_accounts';
  const accounts = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const saveAccounts = a => localStorage.setItem(KEY, JSON.stringify(a));

  function setSession(user) { localStorage.setItem('shyraq_user', JSON.stringify(user)); }

  /* ── ТІРКЕЛУ ── */
  async function register(p) {
    // p: { name, email, password, classYear, city }
    const name = (p.name || '').trim() || (p.email || '').split('@')[0];
    if (sb) {
      const { data, error } = await sb.auth.signUp({
        email: p.email, password: p.password,
        options: { data: { name, class_year: p.classYear || '', city: p.city || '' } }
      });
      if (error) throw new Error(error.message);
      try {
        if (data.user) await sb.from('profiles').upsert({
          id: data.user.id, name, email: p.email, class_year: p.classYear || '', city: p.city || ''
        });
      } catch (e) { /* профиль кестесі болмаса — елемейміз */ }
      const user = { name, email: p.email, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
      setSession(user);
      return user;
    }
    // fallback
    const all = accounts();
    const key = (p.email || '').toLowerCase();
    if (!key) throw new Error('Email енгізіңіз');
    if (all[key]) throw new Error('Бұл email тіркелген. Кіріңіз.');
    all[key] = { name, email: p.email, password: p.password, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
    saveAccounts(all);
    const user = { name, email: p.email, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
    setSession(user);
    return user;
  }

  /* ── КІРУ ── */
  async function login(email, password) {
    if (sb) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Email немесе пароль қате');
      let name = (data.user.user_metadata && data.user.user_metadata.name) || email.split('@')[0];
      let classYear = '', city = '';
      try {
        const { data: pr } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (pr) { name = pr.name || name; classYear = pr.class_year || ''; city = pr.city || ''; }
      } catch (e) { /* елемейміз */ }
      const user = { name, email, classYear, city, plan: 'free' };
      setSession(user);
      return user;
    }
    // fallback
    const all = accounts();
    const u = all[(email || '').toLowerCase()];
    if (!u || u.password !== password) throw new Error('Email немесе пароль қате');
    const user = { name: u.name, email: u.email, classYear: u.classYear, city: u.city, plan: u.plan || 'free' };
    setSession(user);
    return user;
  }

  /* ── ШЫҒУ ── */
  async function logout() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    localStorage.removeItem('shyraq_user');
    localStorage.removeItem('shyraq_admin');
  }

  window.ShyraqAuth = { register, login, logout, configured, _client: () => sb };
})();
