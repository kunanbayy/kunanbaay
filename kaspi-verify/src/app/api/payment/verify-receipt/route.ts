import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { log, logVerification } from '../../../../lib/logger';
import { extractReceipt } from '../../../../services/ocr';
import type { VerifyResult } from '../../../../types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function fail(reason: VerifyResult['reason'], message: string, status = 422): NextResponse {
  return NextResponse.json({ ok: false, reason, message } satisfies VerifyResult, { status, headers: corsHeaders });
}

function kaspiDateToIso(value: string | null | undefined): string | null {
  const m = String(value || '').match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min] = m;
  return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh) - 5, Number(min))).toISOString();
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let orderId: string | null = null;
  try {
    const form = await req.formData();
    orderId = String(form.get('orderId') || '');
    userId = String(form.get('userId') || '');
    const file = form.get('file');
    const receiptUrl = String(form.get('receiptUrl') || '') || null;
    const paymentMethod = String(form.get('paymentMethod') || '') || null;

    if (!orderId || !userId) return fail('order_not_found', 'orderId және userId міндетті.', 400);
    if (!(file instanceof File)) return fail('unreadable', 'Чек файлы жүктелмеді.', 400);
    if (file.size > MAX_BYTES) return fail('unreadable', 'Файл тым үлкен (макс. 10 МБ).', 400);
    if (!ALLOWED.includes(file.type)) return fail('unreadable', 'PDF, PNG, JPG немесе WEBP жүктеңіз.', 400);

    // 1) order must exist, belong to the user, and still accept a receipt.
    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, amount, status, created_at, expires_at')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.user_id !== userId) {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_found' });
      return fail('order_not_found', 'Тапсырыс табылмады.', 404);
    }
    if (order.status === 'expired') {
      return fail('order_not_pending', 'Тапсырыс мерзімі бітті. Қайта бастаңыз.');
    }
    if (order.status === 'pending_review') {
      return NextResponse.json(
        { ok: true, status: 'pending_review', message: 'Чек жіберілді. Әкімші тексеріп жатыр.' },
        { headers: corsHeaders }
      );
    }
    if (order.status !== 'pending') {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_pending' });
      return fail('order_not_pending', 'Бұл тапсырыс енді чек қабылдамайды.');
    }

    const expiresMs = order.expires_at
      ? Date.parse(order.expires_at)
      : Date.parse(order.created_at) + config.receiptMaxAgeMinutes * 60_000;
    if (Date.now() > expiresMs) {
      await supabaseAdmin
        .from('payment_orders')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending');
      return fail('order_not_pending', 'Тапсырыс мерзімі бітті. Қайта бастаңыз.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const nowIso = new Date().toISOString();
    const baseFields = {
      receipt_url: receiptUrl,
      receipt_uploaded_at: nowIso,
      payment_method: paymentMethod || undefined,
    };

    let extracted: Awaited<ReturnType<typeof extractReceipt>> | null = null;
    try {
      extracted = await extractReceipt(buffer, file.type);
    } catch (e) {
      // OCR no longer decides payment acceptance. Admin still receives the receipt.
      log('error', 'ocr_failed', e);
      await logVerification({ userId, orderId, success: false, reason: 'ocr_error' });
    }

    // Чектен оқылған деректер тек admin көрінісі үшін сақталады.
    // Auto approve/reject disabled: OCR/validation payment acceptance-ке әсер етпейді.
    const ocrFields = {
      receiver_name: extracted?.receiverName ?? null,
      payer_name: extracted?.payerName ?? null,
      receipt_comment: extracted?.comment ?? null,
      receipt_amount: extracted?.amount ?? null,
      receipt_paid_at: kaspiDateToIso(extracted?.paymentDate),
    };

    const { error: updateErr } = await supabaseAdmin.from('payment_orders')
      .update({
        status: 'pending_review',
        admin_review_status: 'pending_review',
        ...baseFields,
        ...ocrFields,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .eq('status', 'pending');
    if (updateErr) throw updateErr;

    await logVerification({ userId, orderId, success: true, extracted: extracted ?? undefined });
    log('info', 'receipt_pending_review', { userId, orderId });

    return NextResponse.json(
      { ok: true, status: 'pending_review', message: 'Чек жіберілді. Әкімші тексеріп жатыр.', extracted },
      { headers: corsHeaders }
    );
  } catch (e) {
    log('error', 'verify_failed', e);
    await logVerification({ userId, orderId, success: false, reason: 'internal_error' });
    return fail('internal_error', 'Күтпеген қате. Кейінірек қайталаңыз.', 500);
  }
}
