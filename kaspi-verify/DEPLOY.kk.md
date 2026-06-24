# Shyraq — автоматты Kaspi чек тексеру (6-минут терезе) деплой нұсқаулығы

Бұл backend чектегі **сома / күн / уақытты** оқып (OpenAI Vision OCR), оны тапсырыстың
**6-минут төлем терезесіне** салыстырады, **бір чекті 1 рет** қана қабылдайды (anti-fraud)
және сәтті болса тарифті **автоматты** қосады.

> ⚠️ Статикалық сайт (GitHub Pages) мұны өзі істей алмайды — бұл бөлек **сервер**.
> Оны **Vercel**-ге деплой жасап, сайтты соған бағыттаңыз.

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
