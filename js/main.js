/* ===== SHYRAQ EDUCATION — MAIN JS v2 ===== */

// ── DATA ──────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  { id: 1, code: 'B001', name: 'Маркетинг', subjects: ['Математика', 'География'], sector: 'Бизнес', icon: '📊', desc: 'Маркетинг, брендинг, SMM және жарнама саласы', jobs: 'Маркетолог, SMM, бренд-менеджер, аналитик', grant: true, demand: 'Жоғары', salary: '250 000–600 000 ₸' },
  { id: 2, code: 'B002', name: 'Психология', subjects: ['Биология', 'География'], sector: 'Психология', icon: '🧠', desc: 'Адам психикасын зерттеу, кеңес беру', jobs: 'Психолог, HR, коуч, тренер', grant: true, demand: 'Жоғары', salary: '200 000–500 000 ₸' },
  { id: 3, code: 'B003', name: 'Ағылшын тілі мұғалімі', subjects: ['Дүниежүзі тарихы', 'Ағылшын тілі'], sector: 'Білім беру', icon: '📚', desc: 'Ағылшын тілін оқыту, педагогика', jobs: 'Мұғалім, репетитор, аудармашы', grant: true, demand: 'Жоғары', salary: '180 000–400 000 ₸' },
  { id: 4, code: 'B004', name: 'Халықаралық қатынастар', subjects: ['Дүниежүзі тарихы', 'Ағылшын тілі'], sector: 'Құқық', icon: '🌍', desc: 'Дипломатия, халықаралық ұйымдар', jobs: 'Дипломат, аудармашы, сарапшы', grant: true, demand: 'Орташа', salary: '300 000–800 000 ₸' },
  { id: 5, code: 'B005', name: 'IT / Информатика', subjects: ['Математика', 'Физика'], sector: 'IT', icon: '💻', desc: 'Бағдарламалау, деректер ғылымы', jobs: 'Программист, аналитик, DevOps', grant: true, demand: 'Өте жоғары', salary: '400 000–1 500 000 ₸' },
  { id: 6, code: 'B006', name: 'Медицина', subjects: ['Биология', 'Химия'], sector: 'Медицина', icon: '🏥', desc: 'Дәрігерлік мамандық, денсаулық сақтау', jobs: 'Дәрігер, маман, хирург', grant: true, demand: 'Жоғары', salary: '350 000–1 200 000 ₸' },
  { id: 7, code: 'B007', name: 'Заңтану', subjects: ['Дүниежүзі тарихы', 'Қазақ тілі'], sector: 'Құқық', icon: '⚖️', desc: 'Заң, прокуратура, адвокатура', jobs: 'Заңгер, прокурор, судья, нотариус', grant: true, demand: 'Жоғары', salary: '300 000–1 000 000 ₸' },
  { id: 8, code: 'B008', name: 'Журналистика', subjects: ['Дүниежүзі тарихы', 'Қазақ тілі'], sector: 'Маркетинг', icon: '📰', desc: 'БАҚ, репортаж, мультимедиа журналистикасы', jobs: 'Журналист, редактор, диктор', grant: false, demand: 'Орташа', salary: '180 000–450 000 ₸' },
  { id: 9, code: 'B009', name: 'Аударма ісі', subjects: ['Дүниежүзі тарихы', 'Ағылшын тілі'], sector: 'Тілдер', icon: '🗣️', desc: 'Жазбаша және ауызша аударма', jobs: 'Аудармашы, тілмаш, редактор', grant: true, demand: 'Орташа', salary: '200 000–600 000 ₸' },
  { id: 10, code: 'B010', name: 'Туризм', subjects: ['География', 'Ағылшын тілі'], sector: 'Туризм', icon: '✈️', desc: 'Туризм индустриясы, отель бизнесі', jobs: 'Тур-менеджер, гид, отель менеджері', grant: false, demand: 'Орташа', salary: '180 000–400 000 ₸' },
  { id: 11, code: 'B011', name: 'Инженерия', subjects: ['Математика', 'Физика'], sector: 'Инженерия', icon: '⚙️', desc: 'Машина жасау, өнеркәсіп технологиялары', jobs: 'Инженер, технолог, конструктор', grant: true, demand: 'Жоғары', salary: '280 000–700 000 ₸' },
  { id: 12, code: 'B012', name: 'Дизайн', subjects: ['Математика', 'Ағылшын тілі'], sector: 'Дизайн', icon: '🎨', desc: 'Графикалық дизайн, UI/UX, 3D', jobs: 'Дизайнер, арт-директор, 3D аниматор', grant: false, demand: 'Жоғары', salary: '250 000–800 000 ₸' },
];

function makeUniversityShortName(name) {
  const clean = String(name || '').replace(/[«»"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const preferred = clean.match(/[A-ZА-ЯӘІҢҒҮҰҚӨҺ]{2,}/g);
  if (preferred && preferred.length) return preferred.slice(0, 2).join('').slice(0, 7);
  return clean.split(' ').filter(Boolean).slice(0, 3).map(word => word[0]).join('').toUpperCase() || 'ЖОО';
}

function buildUniversityCards(seed) {
  return (seed || []).map(uni => ({
    ...uni,
    name: uni.name_kz,
    abbr: uni.short_name || makeUniversityShortName(uni.name_kz),
    cityLabel: uni.city || 'Қала кейін толтырылады',
    typeLabel: uni.university_type || 'ЖОО',
    categoryLabel: uni.category || 'Бағыты кейін толтырылады',
    websiteLabel: uni.official_website || 'Сайт кейін қосылады',
    logo: uni.logo_url,
    logoSource: uni.logo_source_url,
    descriptionText: uni.description || 'Бұл университет ENIC Kazakhstan ресми ЖОО тізімінен қосылды. Қала, сайт, категория және сипаттама admin panel арқылы кейін толықтырылады.',
    color: '#1E3A5F'
  }));
}

const UNIVERSITIES = buildUniversityCards(window.UNIVERSITIES_SEED || []).map(uni => ({
  id: uni.id,
  name: uni.name,
  abbr: uni.abbr,
  city: uni.cityLabel,
  type: uni.typeLabel,
  grant: false,
  dorm: false,
  specialties: 'Кейін толтырылады',
  minScore: null,
  tuition: 'Кейін толтырылады',
  desc: uni.descriptionText,
  color: uni.color,
  logo_url: uni.logo_url,
  logo_source_url: uni.logo_source_url
}));

const UBT_SUBJECTS = [
  { id: 'hist_kaz', name: 'Қазақстан тарихы', emoji: '🏛️', mandatory: true },
  { id: 'literacy', name: 'Оқу сауаттылығы', emoji: '📖', mandatory: true },
  { id: 'math_lit', name: 'Матем. сауаттылық', emoji: '🔢', mandatory: true },
  { id: 'math', name: 'Математика', emoji: '📐', mandatory: false },
  { id: 'physics', name: 'Физика', emoji: '⚛️', mandatory: false },
  { id: 'chemistry', name: 'Химия', emoji: '🧪', mandatory: false },
  { id: 'biology', name: 'Биология', emoji: '🌱', mandatory: false },
  { id: 'geography', name: 'География', emoji: '🗺️', mandatory: false },
  { id: 'world_hist', name: 'Дүниежүзі тарихы', emoji: '🌐', mandatory: false },
  { id: 'english', name: 'Ағылшын тілі', emoji: '🇬🇧', mandatory: false },
  { id: 'kaz_lit', name: 'Қазақ тілі/Әдебиет', emoji: '📜', mandatory: false },
];

// ── AUTH SYSTEM ────────────────────────────────────────────────────────────
function getUser() {
  const savedUser = JSON.parse(localStorage.getItem('shyraq_user') || 'null');
  if (localStorage.getItem('shyraq_demo_premium') !== 'off') {
    if (savedUser) return { ...savedUser, plan: 'premium' };
    return {
      name: 'Ержан',
      email: 'demo@shyraq.edu.kz',
      classYear: '11',
      city: 'Алматы',
      plan: 'premium'
    };
  }
  if (savedUser) return savedUser;
  return null;
}
function getPlan() { return getUser()?.plan || 'guest'; }
function isLoggedIn() { return !!getUser(); }
function isPremium() {
  // Demo preview: keep Premium unlocked locally so all updated university cards/logos are visible.
  if (localStorage.getItem('shyraq_demo_premium') !== 'off') return true;
  const p = getPlan();
  return p === 'premium' || p === 'ai_premium';
}
function isAIPremium() { return getPlan() === 'ai_premium'; }

function saveUser(user) { localStorage.setItem('shyraq_user', JSON.stringify(user)); }

// ── AUTH MODAL ─────────────────────────────────────────────────────────────
function showAuthModal(reason) {
  removeModal('auth-modal');
  const overlay = document.createElement('div');
  overlay.id = 'auth-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)';

  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:24px;padding:40px 36px;max-width:440px;width:100%;text-align:center;position:relative;box-shadow:0 24px 80px rgba(0,0,0,.18)';

  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:14px;right:16px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#94A3B8';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => overlay.remove());

  const emoji = document.createElement('div');
  emoji.style.cssText = 'font-size:3rem;margin-bottom:14px';
  emoji.textContent = '🔆';

  const title = document.createElement('h3');
  title.style.cssText = 'font-family:"Manrope","Noto Sans",Arial,sans-serif;font-size:1.4rem;font-weight:800;color:#1E3A5F;margin-bottom:8px';
  title.textContent = 'Жалғастыру үшін тіркел';

  const desc = document.createElement('p');
  desc.style.cssText = 'font-size:0.875rem;color:#64748B;margin-bottom:24px;line-height:1.6';
  desc.textContent = reason || 'Бұл бетті пайдалану үшін аккаунт жасаңыз. Тегін 30 секундта тіркелесіз.';

  const feats = document.createElement('div');
  feats.style.cssText = 'background:#F8FAFC;border-radius:12px;padding:14px 16px;margin-bottom:22px;text-align:left;display:flex;flex-direction:column;gap:8px';
  const featItems = ['✓ Мамандық тесті — тегін', '✓ Грант калькулятор — тегін', '✓ Университеттер базасы — тегін', '⭐ Толық анализ — Premium арқылы'];
  featItems.forEach(text => {
    const item = document.createElement('div');
    item.style.cssText = 'font-size:0.82rem;color:#374151;display:flex;align-items:center;gap:6px';
    item.textContent = text;
    feats.appendChild(item);
  });

  const btnReg = document.createElement('a');
  btnReg.href = 'register.html';
  btnReg.style.cssText = 'display:block;background:#1E3A5F;color:#fff;padding:13px;border-radius:12px;font-weight:700;font-size:0.95rem;margin-bottom:10px;font-family:"Manrope","Noto Sans",Arial,sans-serif;text-decoration:none';
  btnReg.textContent = 'Тегін тіркелу →';

  const btnLogin = document.createElement('a');
  btnLogin.href = 'login.html';
  btnLogin.style.cssText = 'display:block;background:#F8FAFC;color:#1E3A5F;padding:13px;border-radius:12px;font-weight:600;font-size:0.9rem;border:1.5px solid #E2E8F0;font-family:"Manrope","Noto Sans",Arial,sans-serif;text-decoration:none';
  btnLogin.textContent = 'Аккаунтым бар — Кіру';

  box.appendChild(closeBtn); box.appendChild(emoji); box.appendChild(title);
  box.appendChild(desc); box.appendChild(feats); box.appendChild(btnReg); box.appendChild(btnLogin);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── PREMIUM LOCK OVERLAY ───────────────────────────────────────────────────
function addPremiumLock(containerEl, featureName) {
  if (!containerEl) return;
  containerEl.style.position = 'relative';

  const lock = document.createElement('div');
  lock.className = 'premium-lock-overlay';
  lock.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,0) 0%,rgba(255,255,255,.97) 40%);border-radius:inherit;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:28px;text-align:center;z-index:10';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size:2rem;margin-bottom:10px';
  icon.textContent = '🔒';

  const t = document.createElement('div');
  t.style.cssText = 'font-family:"Manrope","Noto Sans",Arial,sans-serif;font-weight:800;color:#1E3A5F;font-size:1rem;margin-bottom:6px';
  t.textContent = 'Premium мүмкіндігі';

  const d = document.createElement('p');
  d.style.cssText = 'font-size:0.8rem;color:#64748B;margin-bottom:14px;line-height:1.5';
  d.textContent = (featureName || 'Бұл функция') + ' Premium қолданушыларға қолжетімді.';

  const btn = document.createElement('a');
  btn.href = 'pricing.html';
  btn.style.cssText = 'display:inline-flex;align-items:center;gap:7px;background:#F2B84B;color:#1E3A5F;padding:10px 22px;border-radius:999px;font-weight:700;font-size:0.85rem;text-decoration:none;font-family:"Manrope","Noto Sans",Arial,sans-serif';
  btn.textContent = '⭐ Premium алу — 990 ₸/ай';

  lock.appendChild(icon); lock.appendChild(t); lock.appendChild(d); lock.appendChild(btn);
  containerEl.appendChild(lock);
}

// Show inline free-limit banner
function showFreeLimitBanner(el, total, shown, featureName) {
  if (!el || isPremium()) return;
  const banner = document.createElement('div');
  banner.style.cssText = 'background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid #F2B84B;border-radius:16px;padding:20px 24px;margin:16px 0;display:flex;align-items:center;gap:16px;flex-wrap:wrap';
  const left = document.createElement('div');
  left.style.flex = '1';
  const h = document.createElement('div');
  h.style.cssText = 'font-family:"Manrope","Noto Sans",Arial,sans-serif;font-weight:800;color:#1E3A5F;font-size:0.95rem;margin-bottom:4px';
  h.textContent = '🔒 ' + total + ' ' + featureName + ' табылды. Free нұсқада тек ' + shown + ' көрінеді.';
  const p = document.createElement('p');
  p.style.cssText = 'font-size:0.8rem;color:#92400E';
  p.textContent = 'Толық тізімді ашу үшін Premium қосыңыз.';
  left.appendChild(h); left.appendChild(p);
  const a = document.createElement('a');
  a.href = 'pricing.html';
  a.style.cssText = 'background:#F2B84B;color:#1E3A5F;padding:9px 20px;border-radius:999px;font-weight:700;font-size:0.82rem;text-decoration:none;font-family:"Manrope","Noto Sans",Arial,sans-serif;white-space:nowrap';
  a.textContent = '⭐ Premium алу';
  banner.appendChild(left); banner.appendChild(a);
  el.appendChild(banner);
}

// ── REQUIRE AUTH (redirect or modal) ──────────────────────────────────────
function requireAuth(reason) {
  if (!isLoggedIn()) {
    showAuthModal(reason);
    return false;
  }
  return true;
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function removeModal(id) { const el = document.getElementById(id); if (el) el.remove(); }

function showToast(msg, type) {
  const existing = document.querySelector('.shyraq-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'shyraq-toast';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (type === 'error' ? '#DC2626' : '#1E3A5F') + ';color:#fff;padding:13px 20px;border-radius:12px;font-size:0.875rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,.15);display:flex;align-items:center;gap:9px;animation:fadeUpT .3s ease;font-family:"Manrope","Noto Sans",Arial,sans-serif;max-width:320px';
  const style = document.createElement('style');
  style.textContent = '@keyframes fadeUpT{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(style);
  const icon = document.createElement('span');
  icon.textContent = type === 'error' ? '✕' : '✓';
  const text = document.createElement('span');
  text.textContent = msg;
  t.appendChild(icon); t.appendChild(text);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

// ── FAVORITES ─────────────────────────────────────────────────────────────
function toggleFavorite(id, type) {
  if (!requireAuth('Таңдаулыға сақтау үшін тіркелу керек.')) return;
  if (!isPremium()) { showToast('Таңдаулыларға сақтау — Premium мүмкіндігі', 'error'); window.location.href = 'pricing.html'; return; }
  const key = type + '-' + id;
  const favs = JSON.parse(localStorage.getItem('shyraq_favorites') || '[]');
  const idx = favs.indexOf(key);
  if (idx === -1) { favs.push(key); showToast('Таңдаулыларға сақталды'); }
  else { favs.splice(idx, 1); showToast('Жойылды'); }
  localStorage.setItem('shyraq_favorites', JSON.stringify(favs));
  document.querySelectorAll('[data-fav="' + key + '"]').forEach(btn => {
    btn.textContent = idx === -1 ? '❤️ Сақталды' : '🤍 Сақтау';
  });
}

// ── COUNTER ANIMATION ─────────────────────────────────────────────────────
function animateCounter(el, target, suffix) {
  const dur = 1400, start = performance.now();
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target).toLocaleString('kk') + (suffix || '');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, +e.target.dataset.counter, e.target.dataset.suffix || '');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-counter]').forEach(el => obs.observe(el));
}

// ── NAV ───────────────────────────────────────────────────────────────────
function initNav() {
  const mobileBtn = document.querySelector('.nav-mobile-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
  }
  document.querySelectorAll('.mobile-menu-close, .mm-close').forEach(el => {
    el.addEventListener('click', () => { if (mobileMenu) mobileMenu.classList.remove('open'); });
  });

  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .sidebar-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === path || href.endsWith('/' + path)) link.classList.add('active');
  });

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }
}

// Update nav based on auth state
function updateNavAuth() {
  const user = getUser();
  document.querySelectorAll('.auth-hide').forEach(el => el.style.display = user ? 'none' : '');
  document.querySelectorAll('.auth-show').forEach(el => el.style.display = user ? 'flex' : 'none');
  document.querySelectorAll('.user-name').forEach(el => { el.textContent = user?.name || ''; });

  // Protected nav links — intercept clicks if not logged in
  const protectedLinks = ['specialties.html','ubt.html','universities.html','grant.html','dashboard.html','test.html','results.html','profile.html'];
  document.querySelectorAll('.nav-link, .mm-link, .mobile-menu-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const page = href.split('/').pop();
    if (protectedLinks.includes(page)) {
      link.addEventListener('click', e => {
        if (!isLoggedIn()) {
          e.preventDefault();
          showAuthModal('Бұл бетті пайдалану үшін тегін тіркелу керек.');
        }
      });
    }
  });
}

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        e.target.style.animation = 'fadeUpT ' + (0.45 + i * 0.06) + 's ease both';
        e.target.style.opacity = '1';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(el => { el.style.opacity = '0'; obs.observe(el); });
}

// ── GRANT CALCULATOR ──────────────────────────────────────────────────────
function calculateGrant(score, specialty, quota) {
  const thresholds = { general:{h:100,m:75,l:58}, pedagogy:{h:80,m:60,l:45}, medicine:{h:110,m:90,l:72}, it:{h:100,m:78,l:62}, law:{h:105,m:82,l:65}, humanities:{h:90,m:68,l:52}, economy:{h:95,m:72,l:58} };
  const t = thresholds[specialty] || thresholds.general;
  const quotaNote = quota && quota !== 'none' ? ' Квота ҰБТ балына қосымша балл қоспайды, тек грант конкурсында арнайы санат ретінде ескеріледі.' : '';
  if (score >= t.h) return { level:'Қауіпсіз таңдау', color:'emerald', msg:'Грант мүмкіндігі жоғары. Бірнеше ЖОО-ға тіркел.' + quotaNote };
  if (score >= t.m) return { level:'Орташа мүмкіндік', color:'gold', msg:'Грант мүмкіндігі бар. Бірнеше ЖОО-ға тіркелу ұсынылады.' + quotaNote };
  if (score >= t.l) return { level:'Тәуекел', color:'orange', msg:'Грант мүмкіндігі тәуекелді. Балыңды арттыруға тырыс.' + quotaNote };
  return { level:'Мүмкіндігі төмен', color:'red', msg:'Балыңды арттыру қажет. Дайындықты күшейт!' + quotaNote };
}

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  updateNavAuth();
  initCounters();
  initReveal();
});
