import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, authStatus } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';
import { corsHeaders } from '../../../../lib/config';
import { approveSession, rejectSession } from '../../../../services/sessions';

export const runtime = 'nodejs';
const Body = z.object({
  sessionId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

export async function GET(req: NextRequest) {
  try {
    await requireUser(req, true);
    const { data, error } = await supabaseAdmin.from('payment_sessions').select('*, tariffs(name, career_energy, premium_days)').order('started_at', { ascending: false }).limit(200);
    if (error) throw error;
    const userIds = [...new Set((data || []).map(row => row.user_id))];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from('profiles').select('id, email, name').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));
    const sessions = await Promise.all((data || []).map(async (row) => {
      let receiptSignedUrl: string | null = null;
      if (row.receipt_url) {
        const { data: signed } = await supabaseAdmin.storage.from('payment-receipts').createSignedUrl(row.receipt_url, 600);
        receiptSignedUrl = signed?.signedUrl ?? null;
      }
      const profile = profileMap.get(row.user_id) || null;
      return { ...row, tariff: row.tariffs, profile, email: profile?.email ?? null, receiptSignedUrl };
    }));
    return NextResponse.json({ ok: true, sessions }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Admin рұқсаты қажет.' }, { status: authStatus(error), headers: corsHeaders });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireUser(req, true);
    const body = Body.parse(await req.json());
    const session = body.action === 'approve'
      ? await approveSession(body.sessionId, 'manual_approved')
      : (await rejectSession(body.sessionId, body.reason || 'Admin төлемді қабылдамады', 'manual_rejected'), null);
    return NextResponse.json({ ok: true, session }, { headers: corsHeaders });
  } catch (error) {
    const status = authStatus(error);
    return NextResponse.json({ ok: false, message: status < 500 ? 'Admin рұқсаты қажет.' : 'Операция орындалмады.' }, { status, headers: corsHeaders });
  }
}
