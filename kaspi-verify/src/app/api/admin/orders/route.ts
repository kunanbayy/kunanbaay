import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';

export const runtime = 'nodejs';

const adminHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: adminHeaders });
}

/**
 * Admin: барлық төлем тапсырыстары мен олардың статусы.
 * x-admin-token арқылы қорғалған (ADMIN_TOKEN env). Service role RLS-ті айналып өтеді.
 * status: pending | approved (paid) | expired | rejected (терезе ішінде сәтсіз әрекет болды)
 */
export async function GET(req: NextRequest) {
  if (!config.adminToken || req.headers.get('x-admin-token') !== config.adminToken) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401, headers: adminHeaders });
  }

  // Соңғы 200 тапсырыс + сәйкес транзакция (расталған чек) мәліметі
  const { data: orders, error } = await supabaseAdmin
    .from('payment_orders')
    .select('id, user_id, plan, tariff_id, amount, status, payment_method, created_at, expires_at, updated_at, receipt_url, receipt_uploaded_at, receipt_paid_at, receipt_amount, payer_name, receipt_comment, receiver_name, approved_at, rejected_reason, admin_review_status, payment_transactions(receipt_number, paid_at)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500, headers: adminHeaders });
  }

  // Әр тапсырыс бойынша сәтсіз әрекеттер саны (anti-fraud / қате чек)
  const { data: fails } = await supabaseAdmin
    .from('verification_logs')
    .select('payment_order_id, reason')
    .eq('success', false)
    .order('created_at', { ascending: false })
    .limit(1000);

  const failByOrder = new Map<string, { count: number; lastReason: string | null }>();
  (fails || []).forEach((f) => {
    if (!f.payment_order_id) return;
    const cur = failByOrder.get(f.payment_order_id) || { count: 0, lastReason: null };
    cur.count += 1;
    if (cur.lastReason === null) cur.lastReason = f.reason ?? null;
    failByOrder.set(f.payment_order_id, cur);
  });

  const rows = (orders || []).map((o) => {
    const tx = Array.isArray(o.payment_transactions) ? o.payment_transactions[0] : null;
    const f = failByOrder.get(o.id);
    // Көрсетілетін статус
    let display: 'pending' | 'approved' | 'expired' | 'rejected' = 'pending';
    if (o.status === 'paid') display = 'approved';
    else if (o.status === 'expired') display = f && f.count > 0 ? 'rejected' : 'expired';
    else if (o.status === 'failed') display = 'rejected';
    else display = 'pending';

    return {
      id: o.id,
      userId: o.user_id,
      plan: o.plan,
      tariffId: o.tariff_id ?? o.plan,
      amount: o.amount,
      paymentMethod: o.payment_method ?? 'qr',
      status: display,
      rawStatus: o.status,
      adminReviewStatus: o.admin_review_status ?? 'pending',
      receiptNumber: tx?.receipt_number ?? null,
      receiptUrl: o.receipt_url ?? null,
      receiptUploadedAt: o.receipt_uploaded_at ?? null,
      receiptPaidAt: o.receipt_paid_at ?? tx?.paid_at ?? null,
      parsedAmount: o.receipt_amount ?? null,
      payerName: o.payer_name ?? null,
      receiverName: o.receiver_name ?? null,
      comment: o.receipt_comment ?? null,
      approvedAt: o.approved_at ?? null,
      rejectedReason: o.rejected_reason ?? null,
      startedAt: o.created_at,
      expiresAt: o.expires_at ?? null,
      failedAttempts: f?.count ?? 0,
      lastFailReason: f?.lastReason ?? null,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    };
  });

  return NextResponse.json({ ok: true, orders: rows }, { headers: adminHeaders });
}
