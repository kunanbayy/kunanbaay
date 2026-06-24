import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders, amountForPlan } from '../../../../lib/config';
import { log } from '../../../../lib/logger';

export const runtime = 'nodejs';

const Body = z.object({
  userId: z.string().uuid(),
  plan: z.string().optional(),
  paymentMethod: z.enum(['qr', 'kaspi_link']).optional(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { userId, plan, paymentMethod } = Body.parse(json);
    const amount = amountForPlan(plan);
    const now = Date.now();
    const expiresAt = new Date(now + config.receiptMaxAgeMinutes * 60_000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        user_id: userId,
        amount,
        plan: plan || 'premium_1m',
        tariff_id: plan || null,
        payment_method: paymentMethod || 'qr',
        status: 'pending',
        admin_review_status: 'pending',
        expires_at: expiresAt,
      })
      .select('id, amount, status, created_at, expires_at')
      .single();

    if (error) throw error;
    log('info', 'order_created', { orderId: data.id, userId });

    return NextResponse.json(
      { ok: true, orderId: data.id, amount: data.amount, status: data.status, expiresAt: data.expires_at },
      { headers: corsHeaders }
    );
  } catch (e) {
    log('error', 'create_order_failed', e);
    return NextResponse.json(
      { ok: false, message: 'Тапсырыс жасау мүмкін болмады.' },
      { status: 400, headers: corsHeaders }
    );
  }
}
