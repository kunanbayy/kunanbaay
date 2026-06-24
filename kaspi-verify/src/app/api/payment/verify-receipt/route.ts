import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { log, logVerification } from '../../../../lib/logger';
import { extractReceipt } from '../../../../services/ocr';
import { validateReceipt } from '../../../../services/validation';
import { activatePremium } from '../../../../services/premium';
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

// Сапа мәселелері — қайта жүктеуге болады (order pending қалады), reject емес.
const RETRYABLE = new Set(['unreadable', 'low_confidence', 'ocr_error']);

async function markRejected(orderId: string, reason: string, extra: Record<string, unknown> = {}) {
  await supabaseAdmin
    .from('payment_orders')
    .update({
      status: 'rejected',
      rejected_reason: reason,
      admin_review_status: 'auto_rejected',
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq('id', orderId);
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

    // 1) order must exist, belong to the user, and be pending
    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, amount, status, created_at')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.user_id !== userId) {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_found' });
      return fail('order_not_found', 'Тапсырыс табылмады.', 404);
    }
    if (order.status === 'expired') {
      return fail('order_not_pending', 'Тапсырыс мерзімі бітті. Қайта бастаңыз.');
    }
    if (order.status !== 'pending') {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_pending' });
      return fail('order_not_pending', 'Бұл тапсырыс бойынша төлем бұрын расталған.');
    }

    // 6-минут терезе бітсе — тапсырысты «expired» етеміз, чекті қабылдамаймыз
    const windowStartMs = Date.parse(order.created_at);
    const windowMs = config.receiptMaxAgeMinutes * 60_000;
    if (Date.now() > windowStartMs + windowMs) {
      await supabaseAdmin.from('payment_orders')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      await logVerification({ userId, orderId, success: false, reason: 'receipt_too_old' });
      return fail('receipt_too_old', `Төлем терезесі (${config.receiptMaxAgeMinutes} мин) бітті. Тапсырыс отменен — қайта бастаңыз.`);
    }

    // 2) Чектің файл-хэші (anti-fraud) + жалпы өрістер
    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptHash = createHash('sha256').update(buffer).digest('hex');
    const nowIso = new Date().toISOString();
    const baseFields = {
      receipt_url: receiptUrl,
      receipt_uploaded_at: nowIso,
      payment_method: paymentMethod || undefined,
    };

    // Anti-fraud: дәл сондай файл (хэш) бұрын қолданылған ба?
    const { data: hashHit } = await supabaseAdmin
      .from('payment_orders')
      .select('id')
      .eq('receipt_hash', receiptHash)
      .neq('id', orderId)
      .maybeSingle();
    if (hashHit) {
      await markRejected(orderId, 'Бұл чек бұрын қолданылған', baseFields); // хэшті қайта жазбаймыз (unique)
      await logVerification({ userId, orderId, success: false, reason: 'duplicate_receipt', receiptHash });
      return fail('duplicate_receipt', 'Бұл чек бұрын қолданылған.');
    }

    // 3) OCR
    let extracted;
    try {
      extracted = await extractReceipt(buffer, file.type);
    } catch (e) {
      log('error', 'ocr_failed', e);
      await logVerification({ userId, orderId, success: false, reason: 'ocr_error', receiptHash });
      return fail('ocr_error', 'Чекті оқу мүмкін болмады. Қайталап көріңіз.', 502); // pending қалады
    }

    // 4) business rules — сома тапсырыстан, уақыт тапсырыс терезесінен
    const v = validateReceipt(extracted, {
      expectedAmount: order.amount,
      windowStartMs,
      windowMinutes: config.receiptMaxAgeMinutes,
    });
    if (!v.ok) {
      await logVerification({ userId, orderId, success: false, reason: v.reason, extracted, receiptHash });
      if (v.reason && RETRYABLE.has(v.reason)) {
        return fail(v.reason, v.message); // сапа мәселесі — pending, қайта жүктеуге болады
      }
      await markRejected(orderId, v.message, { ...baseFields, receipt_hash: receiptHash });
      return fail(v.reason, v.message);
    }

    // 5) record transaction (unique receipt_number = race-safe final guard)
    const { error: txErr } = await supabaseAdmin.from('payment_transactions').insert({
      payment_order_id: orderId,
      user_id: userId,
      receipt_number: extracted.receiptNumber!,
      amount: extracted.amount!,
      receiver_name: extracted.receiverName,
      paid_at: extracted.paymentDate!,
    });
    if (txErr) {
      const dup = (txErr as { code?: string }).code === '23505';
      await logVerification({ userId, orderId, success: false, reason: dup ? 'duplicate_receipt' : 'internal_error', extracted, receiptHash });
      if (dup) await markRejected(orderId, 'Бұл чек бұрын қолданылған', baseFields);
      return fail(dup ? 'duplicate_receipt' : 'internal_error', dup ? 'Бұл чек бұрын қолданылған.' : 'Ішкі қате.', dup ? 422 : 500);
    }

    // 6) approve: premium қосу + тапсырысты жабу (бар өрістерімен)
    const premiumUntil = await activatePremium(userId);
    await supabaseAdmin.from('payment_orders')
      .update({
        status: 'paid',
        approved_at: nowIso,
        admin_review_status: 'auto_approved',
        receipt_hash: receiptHash,
        receipt_paid_at: extracted.paymentDate,
        ...baseFields,
        updated_at: nowIso,
      })
      .eq('id', orderId);

    await logVerification({ userId, orderId, success: true, extracted, receiptHash });
    log('info', 'premium_activated', { userId, orderId, premiumUntil });

    return NextResponse.json(
      { ok: true, message: 'Төлем расталды — Premium қосылды!', premiumUntil, extracted } satisfies VerifyResult,
      { headers: corsHeaders }
    );
  } catch (e) {
    log('error', 'verify_failed', e);
    await logVerification({ userId, orderId, success: false, reason: 'internal_error' });
    return fail('internal_error', 'Күтпеген қате. Кейінірек қайталаңыз.', 500);
  }
}
