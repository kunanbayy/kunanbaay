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

  function saveLocalAccount(p, name) {
    const all = accounts();
    const key = (p.email || '').toLowerCase();
    if (!key) return;
    all[key] = { name, email: p.email, password: p.password, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
    saveAccounts(all);
  }

  /* ── ТІРКЕЛУ ──
     Supabase-қа да, localStorage-қа да жазамыз. Сонда email растау қосулы
     болса да (немесе желі қол жетімсіз болса да) қолданушы кіре алады. */
  async function register(p) {
    const name = (p.name || '').trim() || (p.email || '').split('@')[0];
    const key = (p.email || '').toLowerCase();
    if (!key) throw new Error('Email енгізіңіз');
    if (!p.password || p.password.length < 6) throw new Error('Пароль кемінде 6 таңба болуы керек');

    // Локальды аккаунт (fallback логин үшін әрқашан сақтаймыз)
    const existing = accounts()[key];
    saveLocalAccount(p, name);

    // Supabase-қа тіркеу (бапталса)
    if (sb) {
      try {
        const { data, error } = await sb.auth.signUp({
          email: p.email, password: p.password,
          options: { data: { name, class_year: p.classYear || '', city: p.city || '' } }
        });
        if (error && !/already registered|already exists/i.test(error.message)) {
          // нақты қате болса — локальды жазбаны қалдырып, ескертеміз емес, жалғаймыз
          console.warn('Supabase signUp:', error.message);
        }
        if (data && data.user) {
          try { await sb.from('profiles').upsert({ id: data.user.id, name, email: p.email, class_year: p.classYear || '', city: p.city || '' }); } catch (e) {}
        }
      } catch (e) { console.warn('Supabase signUp failed, using local:', e); }
    }

    const user = { name, email: p.email, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
    setSession(user);
    return user;
  }

  /* ── КІРУ ──
     Алдымен Supabase-пен тексереміз; сәтсіз болса (растау/желі) —
     локальды аккаунтпен кіреміз. Сонда тіркелген адам әрқашан кіре алады. */
  async function login(email, password) {
    if (sb) {
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (!error && data && data.user) {
          let name = (data.user.user_metadata && data.user.user_metadata.name) || email.split('@')[0];
          let classYear = '', city = '';
          try {
            const { data: pr } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
            if (pr) { name = pr.name || name; classYear = pr.class_year || ''; city = pr.city || ''; }
          } catch (e) {}
          const user = { name, email, classYear, city, plan: 'free' };
          setSession(user);
          return user;
        }
      } catch (e) { /* fallback-қа өтеміз */ }
    }
    // fallback: локальды аккаунт
    const u = accounts()[(email || '').toLowerCase()];
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
