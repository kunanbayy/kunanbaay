import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { activateTariff } from '../../../../services/premium';
import { log } from '../../../../lib/logger';

export const runtime = 'nodejs';

const adminHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
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
  if (!config.adminToken || req.headers.get('x-admin-token') !== config.adminToken) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401, headers: adminHeaders });
  }
  try {
    const { orderId, action, reason } = Body.parse(await req.json());
    const now = new Date().toISOString();

    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, status, plan, tariff_id, amount, receipt_url, receipt_uploaded_at')
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

      const activation = await activateTariff(order.user_id, order.tariff_id || order.plan, order.amount);
      await supabaseAdmin.from('payment_orders').update({
        status: 'approved', approved_at: now, admin_review_status: 'reviewed_approved',
        rejected_reason: null, updated_at: now,
      }).eq('id', orderId);
      log('info', 'admin_approved', { orderId, energyGranted: activation.energyGranted, resultsUnlocked: activation.resultsUnlocked });
      return NextResponse.json({ ok: true, status: 'approved', ...activation }, { headers: adminHeaders });
    }

    await supabaseAdmin.from('payment_orders').update({
      status: 'rejected', rejected_reason: reason || 'Админ қабылдамады',
      admin_review_status: 'reviewed_rejected', updated_at: now,
    }).eq('id', orderId);
    log('info', 'admin_rejected', { orderId });
    return NextResponse.json({ ok: true, status: 'rejected' }, { headers: adminHeaders });
  } catch (e) {
    log('error', 'admin_review_failed', e);
    return NextResponse.json({ ok: false, message: 'bad request' }, { status: 400, headers: adminHeaders });
  }
}
