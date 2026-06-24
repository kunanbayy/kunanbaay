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

  async function recordRegistration(user, action) {
    if (!sb || !user || !user.email) return;
    try {
      const email = String(user.email).toLowerCase();
      const { data } = await sb.from('settings').select('value').eq('key', 'registrations').maybeSingle();
      const list = Array.isArray(data && data.value) ? data.value : [];
      const idx = list.findIndex(x => String(x.email || '').toLowerCase() === email);
      const now = new Date().toISOString();
      const row = Object.assign({}, idx >= 0 ? list[idx] : {}, {
        name: user.name || email.split('@')[0],
        email,
        classYear: user.classYear || user.class_year || '',
        city: user.city || '',
        plan: user.plan || 'free',
        createdAt: (idx >= 0 && list[idx].createdAt) ? list[idx].createdAt : now,
        lastLoginAt: action === 'login' ? now : ((idx >= 0 && list[idx].lastLoginAt) ? list[idx].lastLoginAt : now)
      });
      if (idx >= 0) list[idx] = row;
      else list.unshift(row);
      await sb.from('settings').upsert({ key: 'registrations', value: list, updated_at: now });
    } catch (e) { /* admin статистикасы үшін жазу user flow-ды тоқтатпасын */ }
  }

  function setSession(user) {
    localStorage.setItem('shyraq_user', JSON.stringify(user));
    // Жаңа сессия — премиумды тазалаймыз. Премиум тек DB access арқылы беріледі
    // (access-sync admin доступ берген кезде қояды).
    localStorage.removeItem('shyraq_premium');
    localStorage.removeItem('shyraq_premium_until');
    try { sessionStorage.removeItem('shyraq_access_synced'); } catch (e) {}
  }

  function saveLocalAccount(p, name) {
    const all = accounts();
    const key = (p.email || '').toLowerCase();
    if (!key) return;
    all[key] = { name, email: p.email, password: p.password, classYear: p.classYear || '', city: p.city || '', plan: 'free', blocked: false, createdAt: new Date().toISOString() };
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
    let authId = '';
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
          authId = data.user.id;
          try { await sb.from('profiles').upsert({ id: data.user.id, name, email: p.email, class_year: p.classYear || '', city: p.city || '' }); } catch (e) {}
        }
      } catch (e) { console.warn('Supabase signUp failed, using local:', e); }
    }

    const user = { id: authId || undefined, name, email: p.email, classYear: p.classYear || '', city: p.city || '', plan: 'free' };
    setSession(user);
    await recordRegistration(user, 'register');
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
          const user = { id: data.user.id, name, email, classYear, city, plan: 'free' };
          setSession(user);
          await recordRegistration(user, 'login');
          return user;
        }
      } catch (e) { /* fallback-қа өтеміз */ }
    }
    // fallback: локальды аккаунт
    const u = accounts()[(email || '').toLowerCase()];
    if (!u || u.password !== password) throw new Error('Email немесе пароль қате');
    if (u.blocked) throw new Error('Аккаунт бұғатталған. Әкімшіге хабарласыңыз.');
    const user = { name: u.name, email: u.email, classYear: u.classYear, city: u.city, plan: u.plan || 'free', blocked: false };
    setSession(user);
    await recordRegistration(user, 'login');
    return user;
  }

  /* ── ШЫҒУ ── */
  async function logout() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    localStorage.removeItem('shyraq_user');
    localStorage.removeItem('shyraq_admin');
  }

  async function getAccessToken() {
    if (!sb) return '';
    try {
      const { data } = await sb.auth.getSession();
      return (data && data.session && data.session.access_token) || '';
    } catch (e) { return ''; }
  }

  async function getAuthUser() {
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getUser();
      return data && data.user ? data.user : null;
    } catch (e) { return null; }
  }

  window.ShyraqAuth = { register, login, logout, getAccessToken, getAuthUser, configured, _client: () => sb };
})();
