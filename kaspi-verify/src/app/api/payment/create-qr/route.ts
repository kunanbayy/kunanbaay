import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '../../../../lib/supabase';
import { config, corsHeaders } from '../../../../lib/config';
import { log } from '../../../../lib/logger';
import { createQr } from '../../../../services/kaspi';

export const runtime = 'nodejs';

const Body = z.object({ userId: z.string().uuid(), plan: z.string().optional() });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = Body.parse(await req.json());

    // 1) pending order
    const { data: order, error } = await supabaseAdmin
      .from('payment_orders')
      .insert({ user_id: userId, amount: config.premiumAmount, plan: plan || 'premium_1m', status: 'pending', provider: 'kaspi_qr' })
      .select('id')
      .single();
    if (error) throw error;

    // 2) Kaspi QR
    const qr = await createQr(config.premiumAmount);

    // 3) attach QR to the order
    await supabaseAdmin.from('payment_orders')
      .update({ qr_operation_id: qr.qrOperationId, qr_token: qr.qrToken, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    log('info', 'qr_created', { orderId: order.id, qrOperationId: qr.qrOperationId });
    return NextResponse.json(
      { ok: true, orderId: order.id, qrToken: qr.qrToken, qrOperationId: qr.qrOperationId, expireDate: qr.expireDate, amount: qr.amount },
      { headers: corsHeaders }
    );
  } catch (e) {
    log('error', 'create_qr_failed', e);
    return NextResponse.json({ ok: false, message: 'Kaspi QR жасау мүмкін болмады.' }, { status: 502, headers: corsHeaders });
  }
}
