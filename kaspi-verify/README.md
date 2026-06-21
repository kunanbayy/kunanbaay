# Shyraq — Kaspi receipt verification (OCR → Premium)

Fully automated Premium activation. The student pays via Kaspi transfer, uploads the
receipt (image/PDF), and the backend verifies it with **OpenAI Vision OCR** and turns
on Premium — no manual admin step.

> ⚠️ This is a **server** (Next.js API). It cannot run on GitHub Pages (static).
> Deploy it to **Vercel** (or any Node host) and point the static site at it.

## Stack
Next.js 15 (App Router) · Supabase (Postgres + Auth) · OpenAI Vision · TypeScript

## Flow
1. User clicks **Premium алу** → `POST /api/payment/create-order` creates a `pending` order.
2. User transfers money in Kaspi, then uploads the receipt.
3. `POST /api/payment/verify-receipt` (multipart: `orderId`, `userId`, `file`):
   - OCR extracts `{ receiptNumber, amount, receiverName, paymentDate, confidence }`
   - validates: amount = `PREMIUM_AMOUNT`, receiver = `EXPECTED_RECEIVER`,
     receipt fresh (≤ `RECEIPT_MAX_AGE_MINUTES`), confidence ≥ `MIN_OCR_CONFIDENCE`,
     order is `pending`, receipt number never used before
   - stores `payment_transactions` (unique `receipt_number`), activates Premium,
     sets order → `paid`, logs the attempt.

## Folder structure
```
kaspi-verify/
├─ supabase/schema.sql                       # tables, RLS, triggers
├─ src/
│  ├─ types/index.ts                         # shared TS types
│  ├─ lib/{config,supabase,logger}.ts        # env, service client, logging
│  ├─ services/
│  │  ├─ ocr.ts                              # OpenAI Vision OCR (image + PDF)
│  │  ├─ validation.ts                       # pure business rules
│  │  └─ premium.ts                          # premium_until activation
│  └─ app/api/payment/
│     ├─ create-order/route.ts
│     └─ verify-receipt/route.ts
├─ .env.example
└─ package.json
```

## Setup
1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. `cp .env.example .env.local` and fill the keys.
   - `EXPECTED_RECEIVER` must match the Kaspi account holder printed on receipts
     (e.g. the example receipt shows `Мадина Е.`).
3. `npm install && npm run dev` (or deploy to Vercel and add the env vars there).

## Fraud protection
- `receipt_number` is **UNIQUE** → a receipt can be used once (race-safe).
- Order must be `pending` (no double activation per order).
- Receipt must be recent (`RECEIPT_MAX_AGE_MINUTES`).
- OCR `confidence` threshold + `isReadable` / `looksEdited` checks reject blurry or
  tampered images.
- Every attempt (pass/fail) is written to `verification_logs`.

## Connect the static site
In `payment.html` set:
```js
window.SHYRAQ_API = 'https://your-vercel-app.vercel.app';
```
When set, the receipt upload auto-verifies via this API; if empty, it falls back to
manual review.

## Note on the OCR provider
The spec asks for OpenAI Vision (implemented in `services/ocr.ts`). The OCR call is
isolated behind `extractReceipt()`, so swapping in Anthropic Claude Vision, Google
Vision, or Tesseract later only touches that one file.
