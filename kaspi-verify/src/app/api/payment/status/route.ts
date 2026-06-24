import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';

export const runtime = 'nodejs';

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// Frontend polls this after showing the QR; returns 'paid' once the webhook lands.
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ ok: false, message: 'orderId required' }, { status: 400, headers: corsHeaders });

  const { data: order } = await supabaseAdmin
    .from('payment_orders')
    .select('id, user_id, status, rejected_reason, admin_review_status, approved_at, expires_at')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: false, message: 'not found' }, { status: 404, headers: corsHeaders });

  let premiumUntil: string | null = null;
  if (order.status === 'paid') {
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('premium_until').eq('id', order.user_id).maybeSingle();
    premiumUntil = profile?.premium_until ?? null;
  }
  return NextResponse.json({
    ok: true,
    status: order.status,
    rejectedReason: order.rejected_reason ?? null,
    adminReviewStatus: order.admin_review_status ?? null,
    approvedAt: order.approved_at ?? null,
    expiresAt: order.expires_at ?? null,
    premiumUntil,
  }, { headers: corsHeaders });
}
