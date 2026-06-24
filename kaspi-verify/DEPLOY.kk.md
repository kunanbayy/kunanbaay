# Shyraq — автоматты Kaspi чек тексеру (6-минут терезе) деплой нұсқаулығы

Бұл backend чектегі **сома / күн / уақытты** оқып (OpenAI Vision OCR), оны тапсырыстың
**6-минут төлем терезесіне** салыстырады, **бір чекті 1 рет** қана қабылдайды (anti-fraud)
және сәтті болса тарифті **автоматты** қосады.

> ⚠️ Статикалық сайт (GitHub Pages) мұны өзі істей алмайды — бұл бөлек **сервер**.
> Оны **Vercel**-ге деплой жасап, сайтты соған бағыттаңыз.

---

## 🚀 ОҢАЙ ЖОЛ — бір батырмамен деплой (~3 минут)

1. Мына сілтемені ашыңыз (Vercel «Clone & Deploy», root = `kaspi-verify` автоматты):
   👉 https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkunanbayy%2Fshyraq.asia&root-directory=kaspi-verify&env=SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,OPENAI_API_KEY,AMOUNT_STANDARD,AMOUNT_CAREER,AMOUNT_REPORT990,EXPECTED_RECEIVER,RECEIPT_MAX_AGE_MINUTES,ADMIN_TOKEN,ALLOWED_ORIGIN

2. Env өрістерін толтырыңыз. **Құпия емес — дайын мәндер** (көшіріп қойыңыз):

   | Айнымалы | Мән |
   |---|---|
   | `SUPABASE_URL` | `https://ppohzbystcciueazupyj.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://ppohzbystcciueazupyj.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (js/supabase-config.js ішіндегі anon key) |
   | `AMOUNT_STANDARD` | `2990` |
   | `AMOUNT_CAREER` | `4990` |
   | `AMOUNT_REPORT990` | `990` |
   | `RECEIPT_MAX_AGE_MINUTES` | `6` |
   | `ALLOWED_ORIGIN` | `https://shyraq.asia` |

   **Тек сіз ғана бере алатын құпия 4 мән:**
   | Айнымалы | Қайдан |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` (құпия!) |
   | `OPENAI_API_KEY` | platform.openai.com → API keys |
   | `EXPECTED_RECEIVER` | Kaspi чегінде көрінетін алушы аты (мыс. `Ержан К.`) |
   | `ADMIN_TOKEN` | `openssl rand -hex 24` (кез келген ұзын жол) |

3. **Deploy** → URL аласыз (мыс. `https://shyraq-kaspi-verify.vercel.app`).

4. Сайтты қосу (қайта деплойсыз) — браузер консолінде:
   ```js
   localStorage.setItem('shyraq_api_url', 'https://СІЗДІҢ-URL.vercel.app')
   // admin.html-де:
   localStorage.setItem('shyraq_admin_token', 'ADMIN_TOKEN мәні')
   ```
   Немесе `js/shyraq-api.js`-тегі `PROD_API`-ге жазып, сайтты қайта деплой жасаңыз.

5. URL мен ADMIN_TOKEN-ді **маған берсеңіз**, мен `js/shyraq-api.js`-ке жазып,
   GitHub-қа push жасаймын — сонда барлық қолданушыға тұрақты қосылады.

> Деплой URL-і пайда болғанда auto-verification бірден іске қосылады:
> receipt upload → OCR (сома/уақыт/hash) → approved/rejected. `SHYRAQ_API` бос болса
> сайт автоматты түрде manual режимде қалады.

---

## 1. Supabase дайындау
1. Supabase жобасында **SQL Editor** ашыңыз.
2. Алдымен `supabase/schema.sql`, **сосын** `supabase/schema-v2.sql` іске қосыңыз
   (payment_session өрістері: payment_method, expires_at, receipt_url/hash/paid_at,
   approved_at, rejected_reason, admin_review_status + `tariffs` кестесі + receipt_hash unique).
3. Кілттерді алыңыз: **Project Settings → API**:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service role — құпия!), `anon` key.

## 2. Vercel-ге деплой
1. `kaspi-verify/` папкасын жеке Git репозиторий етіп (немесе monorepo subdir) Vercel-ге импорттаңыз.
2. **Environment Variables** қосыңыз (`.env.example` қараңыз):

| Айнымалы | Мәні |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase API кілттері |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | сол жоба |
| `OPENAI_API_KEY` | OpenAI кілті (Vision OCR) |
| `AMOUNT_STANDARD` | `2990` |
| `AMOUNT_CAREER` | `4990` |
| `AMOUNT_REPORT990` | `990` |
| `EXPECTED_RECEIVER` | Kaspi чегінде көрінетін алушы аты (мыс. `Ержан К.`) |
| `RECEIPT_MAX_AGE_MINUTES` | `6` (6-минут терезе) |
| `MIN_OCR_CONFIDENCE` | `0.75` |
| `PREMIUM_DAYS` | `30` |
| `ALLOWED_ORIGIN` | `https://shyraq.asia` |
| `ADMIN_TOKEN` | ұзын кездейсоқ жол — `openssl rand -hex 24` |

3. Deploy → URL аласыз, мыс: `https://shyraq-kaspi-verify.vercel.app`.

## 3. Статикалық сайтты жалғау
`js/shyraq-api.js` файлында:
```js
window.SHYRAQ_API = 'https://shyraq-kaspi-verify.vercel.app';
window.SHYRAQ_ADMIN_TOKEN = 'ADMIN_TOKEN-мен бірдей';
```
Содан кейін `payment.html` чекті автоматты тексереді, `admin.html` барлық
тапсырыстарды статусымен көрсетеді.

---

## Логика (қалай жұмыс істейді)
1. Қолданушы тарифті таңдап `payment.html`-ге өтеді → **6-минут таймер** басталады,
   бэкендте `payment_orders` (status=`pending`) жазылады.
2. QR арқылы төлеп, чекті (PDF/сурет) жүктейді.
3. Backend OCR жасайды → тексереді:
   - **сома** = тарифтің бағасы (`AMOUNT_*`)
   - **алушы** = `EXPECTED_RECEIVER`
   - **чектегі уақыт** тапсырыс терезесінің (6 мин) ішінде
   - чек анық, өзгертілмеген, confidence жеткілікті
   - **чек нөмірі бұрын қолданылмаған** (UNIQUE → anti-fraud)
4. Бәрі дұрыс болса → тариф автоматты қосылады (`status=paid`), бұғатталған бөлімдер ашылады.
5. 6 минут ішінде төленбесе/чек жүктелмесе → тапсырыс **`expired`** (отменен).

## Статустар (admin panel)
- **pending** — күтілуде (терезе ашық)
- **approved** (paid) — расталды, тариф қосылды
- **rejected** — сәтсіз әрекет(тер) болды (сома/уақыт/қайталанған чек)
- **expired** — 6 минут бітті, төленбеді

## API маршруттары
- `POST /api/payment/create-order` — тапсырыс жасау (6-мин терезе осыдан басталады)
- `POST /api/payment/verify-receipt` — чекті OCR-мен тексеру + тариф қосу
- `POST /api/payment/expire-order` — терезе біткенде тапсырысты отмена ету
- `GET  /api/payment/status?orderId=…` — статусты сұрау
- `GET  /api/admin/orders` — (x-admin-token) барлық тапсырыстар + статус
