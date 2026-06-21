import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';
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

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let orderId: string | null = null;
  try {
    const form = await req.formData();
    orderId = String(form.get('orderId') || '');
    userId = String(form.get('userId') || '');
    const file = form.get('file');

    if (!orderId || !userId) return fail('order_not_found', 'orderId және userId міндетті.', 400);
    if (!(file instanceof File)) return fail('unreadable', 'Чек файлы жүктелмеді.', 400);
    if (file.size > MAX_BYTES) return fail('unreadable', 'Файл тым үлкен (макс. 10 МБ).', 400);
    if (!ALLOWED.includes(file.type)) return fail('unreadable', 'PDF, PNG, JPG немесе WEBP жүктеңіз.', 400);

    // 1) order must exist, belong to the user, and be pending
    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, amount, status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.user_id !== userId) {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_found' });
      return fail('order_not_found', 'Тапсырыс табылмады.', 404);
    }
    if (order.status !== 'pending') {
      await logVerification({ userId, orderId, success: false, reason: 'order_not_pending' });
      return fail('order_not_pending', 'Бұл тапсырыс бойынша төлем бұрын расталған.');
    }

    // 2) OCR
    const buffer = Buffer.from(await file.arrayBuffer());
    let extracted;
    try {
      extracted = await extractReceipt(buffer, file.type);
    } catch (e) {
      log('error', 'ocr_failed', e);
      await logVerification({ userId, orderId, success: false, reason: 'ocr_error' });
      return fail('ocr_error', 'Чекті оқу мүмкін болмады. Қайталап көріңіз.', 502);
    }

    // 3) business rules (pure)
    const v = validateReceipt(extracted);
    if (!v.ok) {
      await logVerification({ userId, orderId, success: false, reason: v.reason, extracted });
      return fail(v.reason, v.message);
    }

    // 4) duplicate receipt guard (explicit check + DB unique constraint below)
    const { data: existing } = await supabaseAdmin
      .from('payment_transactions')
      .select('id')
      .eq('receipt_number', extracted.receiptNumber!)
      .maybeSingle();
    if (existing) {
      await logVerification({ userId, orderId, success: false, reason: 'duplicate_receipt', extracted });
      return fail('duplicate_receipt', 'Бұл чек бұрын қолданылған.');
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
      // 23505 = unique_violation → someone used this receipt a moment ago
      const dup = (txErr as { code?: string }).code === '23505';
      await logVerification({ userId, orderId, success: false, reason: dup ? 'duplicate_receipt' : 'internal_error', extracted });
      return fail(dup ? 'duplicate_receipt' : 'internal_error', dup ? 'Бұл чек бұрын қолданылған.' : 'Ішкі қате.', dup ? 422 : 500);
    }

    // 6) activate premium + close order
    const premiumUntil = await activatePremium(userId);
    await supabaseAdmin.from('payment_orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    await logVerification({ userId, orderId, success: true, extracted });
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
