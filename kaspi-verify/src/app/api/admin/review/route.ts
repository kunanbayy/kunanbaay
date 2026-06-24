import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { activatePremium } from '../../../../services/premium';
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
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ ok: false, message: 'not found' }, { status: 404, headers: adminHeaders });
    }

    if (action === 'approve') {
      const premiumUntil = await activatePremium(order.user_id);
      await supabaseAdmin.from('payment_orders').update({
        status: 'paid', approved_at: now, admin_review_status: 'reviewed_approved',
        rejected_reason: null, updated_at: now,
      }).eq('id', orderId);
      log('info', 'admin_approved', { orderId });
      return NextResponse.json({ ok: true, status: 'approved', premiumUntil }, { headers: adminHeaders });
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
