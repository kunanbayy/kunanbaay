import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSession, validAdminCredentials } from '../../../../lib/admin-auth';
import { corsHeaders } from '../../../../lib/config';

export const runtime = 'nodejs';

const headers = {
  ...corsHeaders,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-session',
};

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = Body.parse(await req.json());
    if (!validAdminCredentials(email, password)) {
      return NextResponse.json({ ok: false, message: 'Админ логині немесе паролі қате' }, { status: 401, headers });
    }
    return NextResponse.json({ ok: true, token: createAdminSession(email), expiresIn: 12 * 60 * 60 }, { headers });
  } catch (error) {
    const isValidationError = error instanceof z.ZodError;
    const message = isValidationError ? 'Email және парольді дұрыс енгізіңіз' : 'Admin session ашылмады';
    return NextResponse.json({ ok: false, message }, { status: isValidationError ? 400 : 500, headers });
  }
}
