import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';
import { activateTariff } from '../../../../services/premium';
import { log } from '../../../../lib/logger';
import { authorizeAdmin } from '../../../../lib/admin-auth';

export const runtime = 'nodejs';

const adminHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token, x-admin-session',
};

const Body = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: adminHeaders });
}

/** Admin қолмен растау/қабылдамау (x-admin-token арқылы қорғалған). */
export async function POST(req: NextRequest) {
  if (!authorizeAdmin(req)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401, headers: adminHeaders });
  }
  try {
    const { orderId, action, reason } = Body.parse(await req.json());
    const now = new Date().toISOString();

    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, message: 'not found' }, { status: 404, headers: adminHeaders });
    }

    if (action === 'approve') {
      if (order.status === 'expired') {
        return NextResponse.json({ ok: false, message: 'expired order approve болмайды' }, { status: 409, headers: adminHeaders });
      }
      if (order.status === 'approved' || order.status === 'paid') {
        return NextResponse.json({ ok: true, status: 'approved', already: true }, { headers: adminHeaders });
      }
      if (order.status !== 'pending_review') {
        return NextResponse.json({ ok: false, message: 'Чек әлі жүктелмеген немесе review статусында емес' }, { status: 409, headers: adminHeaders });
      }
      if (!order.receipt_url && !order.receipt_uploaded_at) {
        return NextResponse.json({ ok: false, message: 'Чек файлы жоқ' }, { status: 409, headers: adminHeaders });
      }

      // Claim exactly this pending_review session before granting access. The conditional
      // update prevents two admin clicks from granting Career Energy twice.
      const { data: claimed, error: claimError } = await supabaseAdmin.from('payment_orders').update({
        status: 'approved', approved_at: now, admin_review_status: 'reviewed_approved',
        rejected_reason: null, updated_at: now,
      }).eq('id', orderId).eq('status', 'pending_review').select('id').maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        return NextResponse.json({ ok: false, message: 'Төлем статусы өзгеріп кетті. Тізімді жаңартыңыз.' }, { status: 409, headers: adminHeaders });
      }

      let activation;
      try {
        activation = await activateTariff(order.user_id, order.tariff_id || order.plan, order.amount);
      } catch (activationError) {
        await supabaseAdmin.from('payment_orders').update({
          status: 'pending_review', approved_at: null, admin_review_status: 'pending_review', updated_at: new Date().toISOString(),
        }).eq('id', orderId).eq('status', 'approved');
        throw activationError;
      }
      log('info', 'admin_approved', { orderId, energyGranted: activation.energyGranted, resultsUnlocked: activation.resultsUnlocked });
      return NextResponse.json({ ok: true, status: 'approved', ...activation }, { headers: adminHeaders });
    }

    if (order.status !== 'pending_review') {
      return NextResponse.json({ ok: false, message: 'Тек admin review-дегі төлемді қабылдамауға болады' }, { status: 409, headers: adminHeaders });
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ ok: false, message: 'Қабылдамау себебін жазыңыз' }, { status: 400, headers: adminHeaders });
    }
    const { data: rejected, error: rejectError } = await supabaseAdmin.from('payment_orders').update({
      status: 'rejected', rejected_reason: reason || 'Админ қабылдамады',
      admin_review_status: 'reviewed_rejected', updated_at: now,
    }).eq('id', orderId).eq('status', 'pending_review').select('id').maybeSingle();
    if (rejectError) throw rejectError;
    if (!rejected) {
      return NextResponse.json({ ok: false, message: 'Төлем статусы өзгеріп кетті. Тізімді жаңартыңыз.' }, { status: 409, headers: adminHeaders });
    }
    log('info', 'admin_rejected', { orderId });
    return NextResponse.json({ ok: true, status: 'rejected' }, { headers: adminHeaders });
  } catch (e) {
    log('error', 'admin_review_failed', e);
    const isValidationError = e instanceof z.ZodError;
    const message = isValidationError ? 'Сұрау деректері дұрыс емес' : (e instanceof Error ? e.message : 'admin_review_failed');
    return NextResponse.json({ ok: false, message }, { status: isValidationError ? 400 : 500, headers: adminHeaders });
  }
}
