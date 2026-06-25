import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';
import { config } from './config';

const SESSION_TTL_SECONDS = 12 * 60 * 60;

type AdminSession = {
  email: string;
  exp: number;
};

function signature(payload: string): string {
  return createHmac('sha256', config.adminToken).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createAdminSession(email: string): string {
  if (!config.adminToken) throw new Error('ADMIN_TOKEN is not configured');
  const data: AdminSession = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSession(token: string | null | undefined): boolean {
  if (!token || !config.adminToken) return false;
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature || !safeEqual(signature(payload), suppliedSignature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;
    return data.email === config.adminEmail.toLowerCase() && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function authorizeAdmin(req: NextRequest): boolean {
  // Keep legacy server-to-server calls working while the browser moves to signed sessions.
  const legacyToken = req.headers.get('x-admin-token');
  if (legacyToken && config.adminToken && safeEqual(legacyToken, config.adminToken)) return true;

  const bearer = req.headers.get('authorization');
  const bearerToken = bearer?.startsWith('Bearer ') ? bearer.slice(7) : null;
  return verifyAdminSession(req.headers.get('x-admin-session') || bearerToken);
}

export function validAdminCredentials(email: string, password: string): boolean {
  return safeEqual(email.trim().toLowerCase(), config.adminEmail.toLowerCase())
    && safeEqual(password, config.adminPassword);
}
