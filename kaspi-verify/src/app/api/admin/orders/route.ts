import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';

export const runtime = 'nodejs';

const adminHeaders = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
};

const ORDER_COLUMNS = [
  'id', 'user_id', 'plan', 'tariff_id', 'amount', 'status', 'payment_method',
  'created_at', 'expires_at', 'updated_at', 'receipt_url', 'receipt_uploaded_at',
  'receipt_paid_at', 'receipt_amount', 'payer_name', 'receipt_comment',
  'receiver_name', 'approved_at', 'rejected_reason', 'admin_review_status',
].join(', ');

type OrderRow = Record<string, any>;

function isAdmin(req: NextRequest): boolean {
  return Boolean(config.adminToken && req.headers.get('x-admin-token') === config.adminToken);
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: adminHeaders });
}

async function approvedRevenue(): Promise<number> {
  let total = 0;
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from('payment_orders')
      .select('amount')
      .in('status', ['approved', 'paid'])
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data || [];
    total += rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    if (rows.length < pageSize) return total;
  }
}

function receiptStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname;
    const marker = '/storage/v1/object/public/receipts/';
    const index = pathname.indexOf(marker);
    return index < 0 ? null : decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

async function deleteOrders(ids: string[], receiptUrls: Array<string | null>): Promise<void> {
  if (!ids.length) return;

  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);
    // verification_logs has no FK cascade in older installations.
    const { error: logError } = await supabaseAdmin
      .from('verification_logs')
      .delete()
      .in('payment_order_id', chunk);
    if (logError) throw logError;

    // payment_transactions is removed by ON DELETE CASCADE.
    const { error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .delete()
      .in('id', chunk);
    if (orderError) throw orderError;
  }

  const paths = receiptUrls.map(receiptStoragePath).filter((path): path is string => Boolean(path));
  if (paths.length) {
    const { error: storageError } = await supabaseAdmin.storage.from('receipts').remove(paths);
    // The database deletion is authoritative; a stale/missing storage object must not undo it.
    if (storageError) console.error('receipt_storage_cleanup_failed', storageError.message);
  }
}

/** Admin payment list. payment_orders is the canonical payment-session source. */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401, headers: adminHeaders });
  }

  try {
    const [{ data: orders, error }, revenue] = await Promise.all([
      supabaseAdmin
        .from('payment_orders')
        .select(ORDER_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(500),
      approvedRevenue(),
    ]);
    if (error) throw error;

    const orderRows = (orders || []) as unknown as OrderRow[];
    const userIds = [...new Set(orderRows.map((order) => order.user_id).filter(Boolean))];
    const profileById = new Map<string, { email: string | null }>();
    if (userIds.length) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('id', userIds);
      if (profileError) throw profileError;
      (profiles || []).forEach((profile) => profileById.set(profile.id, { email: profile.email ?? null }));
    }

    const rows = orderRows.map((order) => {
      const profile = profileById.get(order.user_id);
      const status = order.status === 'paid' ? 'approved' : order.status;
      return {
        id: order.id,
        userId: order.user_id,
        userEmail: profile?.email ?? null,
        user: profile?.email ?? `User ${String(order.user_id || '').slice(0, 8)}`,
        plan: order.plan,
        tariffId: order.tariff_id ?? order.plan,
        amount: order.amount,
        paymentMethod: order.payment_method ?? 'qr',
        status,
        adminReviewStatus: order.admin_review_status ?? 'pending',
        receiptUrl: order.receipt_url ?? null,
        receiptUploadedAt: order.receipt_uploaded_at ?? null,
        receiptPaidAt: order.receipt_paid_at ?? null,
        parsedAmount: order.receipt_amount ?? null,
        payerName: order.payer_name ?? null,
        receiverName: order.receiver_name ?? null,
        comment: order.receipt_comment ?? null,
        approvedAt: order.approved_at ?? null,
        rejectedReason: order.rejected_reason ?? null,
        startedAt: order.created_at,
        expiresAt: order.expires_at ?? null,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    });

    return NextResponse.json(
      { ok: true, orders: rows, summary: { approvedRevenue: revenue, total: rows.length } },
      { headers: adminHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'orders_load_failed';
    return NextResponse.json({ ok: false, message }, { status: 500, headers: adminHeaders });
  }
}

/** Delete one payment session or all sessions, including related audit data. */
export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, message: 'unauthorized' }, { status: 401, headers: adminHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as { orderId?: string; all?: boolean };
    if (!body.all && !body.orderId) {
      return NextResponse.json({ ok: false, message: 'orderId немесе all міндетті' }, { status: 400, headers: adminHeaders });
    }

    let orders: Array<{ id: string; receipt_url: string | null }> = [];
    if (body.all) {
      const pageSize = 1000;
      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabaseAdmin
          .from('payment_orders')
          .select('id, receipt_url')
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const page = data || [];
        orders.push(...page);
        if (page.length < pageSize) break;
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from('payment_orders')
        .select('id, receipt_url')
        .eq('id', body.orderId as string);
      if (error) throw error;
      orders = data || [];
    }
    if (!body.all && (!orders || orders.length === 0)) {
      return NextResponse.json({ ok: false, message: 'Төлем табылмады' }, { status: 404, headers: adminHeaders });
    }

    const ids = (orders || []).map((order) => order.id);
    await deleteOrders(ids, (orders || []).map((order) => order.receipt_url));
    return NextResponse.json({ ok: true, deleted: ids.length }, { headers: adminHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'delete_failed';
    return NextResponse.json({ ok: false, message }, { status: 500, headers: adminHeaders });
  }
}
