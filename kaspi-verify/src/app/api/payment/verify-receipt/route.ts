import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireUser, authStatus } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';
import { log, logVerification } from '../../../../lib/logger';
import { extractReceipt } from '../../../../services/ocr';
import { validateReceipt } from '../../../../services/validation';
import { approveSession, getOwnedSession, rejectSession } from '../../../../services/sessions';
import type { VerifyFailReason, VerifyResult } from '../../../../types';

export const runtime = 'nodejs';
export const maxDuration = 60;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
function fail(reason: VerifyFailReason, message: string, status = 422) {
  return NextResponse.json({ ok: false, reason, message } satisfies VerifyResult, { status, headers: corsHeaders });
}
function ext(file: File): string {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(req: NextRequest) {
  let sessionId = '';
  let userId: string | null = null;
  try {
    const user = await requireUser(req);
    userId = user.id;
    const form = await req.formData();
    sessionId = String(form.get('sessionId') || form.get('orderId') || '');
    const file = form.get('file');
    if (!sessionId) return fail('order_not_found', 'Төлем сессиясы табылмады.', 400);
    if (!(file instanceof File)) return fail('unreadable', 'Чек файлы жүктелмеді.', 400);
    if (file.size > MAX_BYTES) return fail('unreadable', 'Файл тым үлкен (макс. 10 МБ).', 400);
    if (!ALLOWED.includes(file.type)) return fail('unreadable', 'PDF, PNG, JPG немесе WEBP жүктеңіз.', 400);

    const session = await getOwnedSession(sessionId, user.id, { expire: false });
    if (!session) return fail('order_not_found', 'Төлем сессиясы табылмады.', 404);
    if (session.status === 'expired') return fail('session_expired', '6 минут аяқталды. Жаңа төлем сессиясын ашыңыз.');
    if (session.status === 'approved') return fail('order_not_pending', 'Бұл төлем бұрын қабылданған.');

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadHash = crypto.randomUUID();
    const path = `${user.id}/${session.id}/${uploadHash}.${ext(file)}`;
    const { error: uploadError } = await supabaseAdmin.storage.from('payment-receipts').upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError && !/already exists/i.test(uploadError.message)) throw uploadError;

    const now = new Date().toISOString();
    const { error: markError } = await supabaseAdmin.from('payment_sessions').update({
      receipt_url: path,
      receipt_uploaded_at: now,
      status: 'verifying',
      admin_review_status: 'pending',
      updated_at: now,
    }).eq('id', session.id).eq('user_id', user.id);
    if (markError) {
      if ((markError as { code?: string }).code === '23505') return fail('duplicate_receipt', 'Бұл чек бұрын қолданылған.');
      throw markError;
    }

    let extracted;
    try {
      extracted = await extractReceipt(buffer, file.type);
    } catch (error) {
      log('error', 'ocr_failed', error);
      await rejectSession(session.id, 'Чекті оқу мүмкін болмады');
      await logVerification({ userId, orderId: session.id, success: false, reason: 'ocr_error' });
      return fail('ocr_error', 'Чекті оқу мүмкін болмады. Анығырақ файл жүктеңіз.', 502);
    }

    const validation = validateReceipt(extracted, {
      amount: session.amount,
      startedAt: session.started_at,
      expiresAt: session.expires_at,
      status: session.status,
    });
    if (!validation.ok) {
      await supabaseAdmin.from('payment_sessions').update({
        receipt_parsed: extracted,
        updated_at: new Date().toISOString(),
      }).eq('id', session.id);
      await rejectSession(session.id, validation.message);
      await logVerification({ userId, orderId: session.id, success: false, reason: validation.reason, extracted });
      return fail(validation.reason!, validation.message);
    }

    const { data: duplicate } = await supabaseAdmin
      .from('payment_sessions')
      .select('id')
      .eq('receipt_hash', validation.receiptHash!)
      .neq('id', session.id)
      .maybeSingle();
    if (duplicate) {
      await supabaseAdmin.from('payment_sessions').update({
        receipt_hash: validation.receiptHash,
        receipt_paid_at: validation.paidAtIso,
        receipt_parsed: extracted,
        updated_at: new Date().toISOString(),
      }).eq('id', session.id);
      await rejectSession(session.id, 'Бұл чек бұрын қолданылған');
      await logVerification({ userId, orderId: session.id, success: false, reason: 'duplicate_receipt', extracted });
      return fail('duplicate_receipt', 'Бұл чек бұрын қолданылған');
    }

    const { error: parsedUpdateError } = await supabaseAdmin.from('payment_sessions').update({
      receipt_hash: validation.receiptHash,
      receipt_paid_at: validation.paidAtIso,
      receipt_parsed: extracted,
      updated_at: new Date().toISOString(),
    }).eq('id', session.id);
    if (parsedUpdateError) {
      if ((parsedUpdateError as { code?: string }).code === '23505') {
        await rejectSession(session.id, 'Бұл чек бұрын қолданылған');
        return fail('duplicate_receipt', 'Бұл чек бұрын қолданылған');
      }
      throw parsedUpdateError;
    }

    const approved = await approveSession(session.id, 'auto_approved');
    await logVerification({ userId, orderId: session.id, success: true, extracted });
    log('info', 'payment_auto_approved', { userId, sessionId: session.id, tariffId: session.tariff_id });
    return NextResponse.json({
      ok: true,
      message: 'Төлем қабылданды',
      status: approved.status,
      session: approved,
    } satisfies VerifyResult & { status: string; session: unknown }, { headers: corsHeaders });
  } catch (error) {
    const status = authStatus(error);
    log('error', 'receipt_verify_failed', error);
    if (status === 401 || status === 403) return fail('order_not_found', 'Авторизация қажет.', status);
    await logVerification({ userId, orderId: sessionId || null, success: false, reason: 'internal_error' });
    return fail('internal_error', 'Чекті тексеру кезінде қате болды.', 500);
  }
}
