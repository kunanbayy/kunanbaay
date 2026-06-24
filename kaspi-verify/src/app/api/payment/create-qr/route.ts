import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, authStatus } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';
import { createOrResumeSession } from '../../../../services/sessions';
import { createQr } from '../../../../services/kaspi';

export const runtime = 'nodejs';
const Body = z.object({ tariffId: z.string().min(1) });
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { tariffId } = Body.parse(await req.json());
    const { session, resumed } = await createOrResumeSession({ userId: user.id, tariffId, paymentMethod: 'qr' });
    if (resumed && session.qr_token) {
      return NextResponse.json({ ok: true, session, qrToken: session.qr_token, resumed: true }, { headers: corsHeaders });
    }

    const qr = await createQr(session.amount);
    const { data, error } = await supabaseAdmin.from('payment_sessions').update({
      qr_operation_id: qr.qrOperationId,
      qr_token: qr.qrToken,
      provider_payload: qr,
      updated_at: new Date().toISOString(),
    }).eq('id', session.id).eq('user_id', user.id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, session: data, qrToken: qr.qrToken, resumed: false }, { headers: corsHeaders });
  } catch (error) {
    const status = authStatus(error);
    return NextResponse.json({ ok: false, message: status < 500 ? 'Авторизация қажет.' : 'Kaspi QR жасау мүмкін болмады.' }, { status: status < 500 ? status : 502, headers: corsHeaders });
  }
}

