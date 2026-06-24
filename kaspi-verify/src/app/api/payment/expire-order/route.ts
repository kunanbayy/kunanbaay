import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { log } from '../../../../lib/logger';

export const runtime = 'nodejs';

const Body = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * 6-минут терезесі біткенде frontend осыны шақырады.
 * Тек «pending» әрі шынымен мерзімі өткен тапсырыс «expired» болады
 * (расталған/төленген тапсырысқа тимейді).
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, userId } = Body.parse(await req.json());

    const { data: order } = await supabaseAdmin
      .from('payment_orders')
      .select('id, user_id, status, created_at, expires_at')
      .eq('id', orderId)
      .maybeSingle();

    if (!order || order.user_id !== userId) {
      return NextResponse.json({ ok: false, message: 'not found' }, { status: 404, headers: corsHeaders });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ ok: true, status: order.status }, { headers: corsHeaders });
    }

    const expiresMs = order.expires_at ? Date.parse(order.expires_at) : Date.parse(order.created_at) + config.receiptMaxAgeMinutes * 60_000;
    const expiredByTime = Date.now() > expiresMs;
    if (!expiredByTime) {
      // Терезе әлі бітпеген — өзгертпейміз (клиент сағаты қате болуы мүмкін)
      return NextResponse.json({ ok: true, status: 'pending' }, { headers: corsHeaders });
    }

    await supabaseAdmin
      .from('payment_orders')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending');

    log('info', 'order_expired', { orderId, userId });
    return NextResponse.json({ ok: true, status: 'expired' }, { headers: corsHeaders });
  } catch (e) {
    log('error', 'expire_order_failed', e);
    return NextResponse.json({ ok: false, message: 'bad request' }, { status: 400, headers: corsHeaders });
  }
}
