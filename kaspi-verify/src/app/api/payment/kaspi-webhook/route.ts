import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config } from '../../../../lib/config';
import { log, logVerification } from '../../../../lib/logger';
import { activatePremium } from '../../../../services/premium';

export const runtime = 'nodejs';

// Verify the HMAC SHA-256 signature sent by kaspi-pos-automation:
//   X-Webhook-Signature: sha256=<hex>
function validSignature(raw: string, header: string | null): boolean {
  if (!config.kaspiWebhookSecret) return true; // no secret configured → skip (not recommended)
  if (!header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', config.kaspiWebhookSecret).update(raw).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-webhook-signature'))) {
    log('warn', 'webhook_bad_signature');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let p: any;
  try { p = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  // We only activate on success; other events are acknowledged & logged.
  if (p.event !== 'payment.success') {
    log('info', 'webhook_event', { event: p.event, paymentId: p.paymentId });
    return NextResponse.json({ ok: true, ignored: p.event });
  }

  try {
    const paymentId = String(p.paymentId);
    // find the pending order this QR belongs to
    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, amount, status')
      .eq('qr_operation_id', paymentId)
      .maybeSingle();

    if (!order) { log('warn', 'webhook_order_not_found', { paymentId }); return NextResponse.json({ ok: true }); }
    if (order.status === 'paid') return NextResponse.json({ ok: true, already: true });

    if (typeof p.amount === 'number' && p.amount !== order.amount) {
      await logVerification({ userId: order.user_id, orderId: order.id, success: false, reason: 'amount_mismatch' });
      return NextResponse.json({ ok: false, reason: 'amount_mismatch' }, { status: 422 });
    }

    // record + activate (receipt_number = paymentId → unique, one activation per payment)
    const { error: txErr } = await supabaseAdmin.from('payment_transactions').insert({
      payment_order_id: order.id,
      user_id: order.user_id,
      receipt_number: paymentId,
      amount: order.amount,
      receiver_name: 'Kaspi Pay (QR)',
      paid_at: p.timestamp || new Date().toISOString(),
    });
    if (txErr && (txErr as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, already: true }); // duplicate webhook
    }
    if (txErr) throw txErr;

    const premiumUntil = await activatePremium(order.user_id);
    await supabaseAdmin.from('payment_orders')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', order.id);

    await logVerification({ userId: order.user_id, orderId: order.id, success: true });
    log('info', 'premium_activated_via_qr', { orderId: order.id, paymentId, premiumUntil });
    return NextResponse.json({ ok: true, premiumUntil });
  } catch (e) {
    log('error', 'webhook_process_failed', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
