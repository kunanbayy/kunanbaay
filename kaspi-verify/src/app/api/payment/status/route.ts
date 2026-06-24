import { NextRequest, NextResponse } from 'next/server';
import { requireUser, authStatus } from '../../../../lib/auth';
import { corsHeaders } from '../../../../lib/config';
import { getOwnedSession } from '../../../../services/sessions';

export const runtime = 'nodejs';
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const sessionId = req.nextUrl.searchParams.get('sessionId') || req.nextUrl.searchParams.get('orderId');
    if (!sessionId) return NextResponse.json({ ok: false, message: 'sessionId required' }, { status: 400, headers: corsHeaders });
    const session = await getOwnedSession(sessionId, user.id);
    if (!session) return NextResponse.json({ ok: false, message: 'not found' }, { status: 404, headers: corsHeaders });
    return NextResponse.json({ ok: true, status: session.status, session }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Авторизация қажет.' }, { status: authStatus(error), headers: corsHeaders });
  }
}

