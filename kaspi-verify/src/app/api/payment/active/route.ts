import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';

export const runtime = 'nodejs';

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * Қолданушының соңғы белсенді (pending әрі мерзімі бітпеген) сессиясы.
 * User қайта кіргенде frontend осыны сұрап, сол сессияны жалғастырады.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const plan = req.nextUrl.searchParams.get('plan');
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'userId required' }, { status: 400, headers: corsHeaders });
  }

  let q = supabaseAdmin
    .from('payment_orders')
    .select('id, plan, amount, status, created_at, expires_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);
  if (plan) q = q.eq('plan', plan);

  const { data } = await q.maybeSingle();
  if (!data) return NextResponse.json({ ok: true, session: null }, { headers: corsHeaders });

  // Мерзімі бітіп қалса — expired етіп, бос қайтарамыз
  const windowMs = config.receiptMaxAgeMinutes * 60_000;
  const expiresMs = data.expires_at ? Date.parse(data.expires_at) : Date.parse(data.created_at) + windowMs;
  if (Date.now() > expiresMs) {
    await supabaseAdmin.from('payment_orders')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', data.id).eq('status', 'pending');
    return NextResponse.json({ ok: true, session: null }, { headers: corsHeaders });
  }

  return NextResponse.json({
    ok: true,
    session: {
      orderId: data.id, plan: data.plan, amount: data.amount,
      status: data.status, createdAt: data.created_at,
      expiresAt: data.expires_at || new Date(expiresMs).toISOString(),
    },
  }, { headers: corsHeaders });
}
