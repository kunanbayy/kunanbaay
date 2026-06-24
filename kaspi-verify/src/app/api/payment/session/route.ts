import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, authStatus } from '../../../../lib/auth';
import { config, corsHeaders } from '../../../../lib/config';
import { createOrResumeSession, findActiveSession } from '../../../../services/sessions';

export const runtime = 'nodejs';
const Body = z.object({
  tariffId: z.string().min(1),
  paymentMethod: z.enum(['qr', 'kaspi_link']),
});

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const session = await findActiveSession(user.id, req.nextUrl.searchParams.get('tariffId') || undefined);
    return NextResponse.json({ ok: true, session }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Авторизация қажет.' }, { status: authStatus(error), headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = Body.parse(await req.json());
    const result = await createOrResumeSession({ userId: user.id, tariffId: body.tariffId, paymentMethod: body.paymentMethod });
    return NextResponse.json({
      ok: true,
      session: result.session,
      resumed: result.resumed,
      paymentLink: body.paymentMethod === 'kaspi_link' ? config.kaspiPaymentLink : null,
    }, { headers: corsHeaders });
  } catch (error) {
    const status = authStatus(error);
    return NextResponse.json({ ok: false, message: status < 500 ? 'Авторизация қажет.' : 'Төлем сессиясы ашылмады.' }, { status, headers: corsHeaders });
  }
}

