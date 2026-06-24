import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';
import { assertServerConfig } from './config';

export interface RequestUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
}

export async function requireUser(req: NextRequest, admin = false): Promise<RequestUser> {
  assertServerConfig();
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new Error('unauthorized');

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error('unauthorized');

  const role = data.user.app_metadata?.role;
  const isAdmin = role === 'admin' || role === 'super_admin';
  if (admin && !isAdmin) throw new Error('forbidden');
  return { id: data.user.id, email: data.user.email ?? null, isAdmin };
}

export function authStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : '';
  if (message === 'unauthorized') return 401;
  if (message === 'forbidden') return 403;
  return 500;
}
