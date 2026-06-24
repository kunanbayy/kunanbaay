import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders, amountForPlan } from '../../../../lib/config';
import { log } from '../../../../lib/logger';

export const runtime = 'nodejs';

const Body = z.object({
  userId: z.string().uuid(),
  plan: z.string().optional(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { userId, plan } = Body.parse(json);
    const amount = amountForPlan(plan);

    const { data, error } = await supabaseAdmin
      .from('payment_orders')
      .insert({ user_id: userId, amount, plan: plan || 'premium_1m', status: 'pending' })
      .select('id, amount, status, created_at')
      .single();

    if (error) throw error;
    log('info', 'order_created', { orderId: data.id, userId });

    return NextResponse.json(
      { ok: true, orderId: data.id, amount: data.amount, status: data.status },
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
