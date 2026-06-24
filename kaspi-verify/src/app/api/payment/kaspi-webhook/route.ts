import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config } from '../../../../lib/config';
import { approveSession, rejectSession } from '../../../../services/sessions';

export const runtime = 'nodejs';

function validSignature(raw: string, header: string | null): boolean {
  if (!config.kaspiWebhookSecret || !header) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', config.kaspiWebhookSecret).update(raw).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected)); }
  catch { return false; }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get('x-webhook-signature'))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const operationId = String(payload.paymentId || payload.qrOperationId || '');
  const { data: session } = await supabaseAdmin.from('payment_sessions').select('*').eq('qr_operation_id', operationId).maybeSingle();
  if (!session) return NextResponse.json({ ok: true, ignored: 'session_not_found' });

  if (payload.event === 'payment.expired' || payload.event === 'payment.failed') {
    await rejectSession(session.id, payload.event === 'payment.expired' ? 'Kaspi QR мерзімі аяқталды' : 'Kaspi төлемі сәтсіз аяқталды');
    return NextResponse.json({ ok: true });
  }
  if (payload.event !== 'payment.success') return NextResponse.json({ ok: true, ignored: payload.event });
  if (session.status === 'approved') return NextResponse.json({ ok: true, already: true });

  const paidAt = Date.parse(String(payload.timestamp || '')) || Date.now();
  if (Date.now() > Date.parse(session.expires_at) || paidAt < Date.parse(session.started_at) || paidAt > Date.parse(session.expires_at)) {
    await rejectSession(session.id, 'Төлем 6 минуттық сессиядан тыс жасалған');
    return NextResponse.json({ ok: false, reason: 'receipt_outside_session' }, { status: 422 });
  }
  if (typeof payload.amount === 'number' && payload.amount !== session.amount) {
    await rejectSession(session.id, `Сома сәйкес емес: ${payload.amount} ₸`);
    return NextResponse.json({ ok: false, reason: 'amount_mismatch' }, { status: 422 });
  }

  await supabaseAdmin.from('payment_sessions').update({
    receipt_paid_at: new Date(paidAt).toISOString(),
    provider_payload: payload,
  }).eq('id', session.id);
  const approved = await approveSession(session.id, 'auto_approved');
  return NextResponse.json({ ok: true, session: approved });
}
