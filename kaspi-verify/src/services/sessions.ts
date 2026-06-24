import { supabaseAdmin } from '../lib/supabase';
import crypto from 'crypto';
import type { PaymentMethod, PaymentSession, PaymentSessionStatus } from '../types';

const ACTIVE: PaymentSessionStatus[] = ['pending', 'receipt_uploaded', 'verifying'];

export async function expireSessionIfNeeded(session: PaymentSession): Promise<PaymentSession> {
  if (session.status !== 'pending' || Date.parse(session.expires_at) > Date.now()) return session;
  const { data, error } = await supabaseAdmin
    .from('payment_sessions')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .in('status', ACTIVE)
    .select('*')
    .single();
  if (error) throw error;
  return data as PaymentSession;
}

export async function getOwnedSession(id: string, userId: string, options: { expire?: boolean } = {}): Promise<PaymentSession | null> {
  const { data, error } = await supabaseAdmin
    .from('payment_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return options.expire === false ? data as PaymentSession : expireSessionIfNeeded(data as PaymentSession);
}

export async function findActiveSession(userId: string, tariffId?: string): Promise<PaymentSession | null> {
  let query = supabaseAdmin
    .from('payment_sessions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ACTIVE)
    .gt('expires_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1);
  if (tariffId) query = query.eq('tariff_id', tariffId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return (data as PaymentSession | null) ?? null;
}

export async function createOrResumeSession(input: {
  userId: string;
  tariffId: string;
  paymentMethod: PaymentMethod;
}): Promise<{ session: PaymentSession; resumed: boolean }> {
  const active = await findActiveSession(input.userId, input.tariffId);
  if (active) {
    if (active.payment_method !== input.paymentMethod && active.status === 'pending' && !active.receipt_url) {
      const { data, error } = await supabaseAdmin.from('payment_sessions')
        .update({ payment_method: input.paymentMethod, updated_at: new Date().toISOString() })
        .eq('id', active.id).eq('user_id', input.userId).select('*').single();
      if (error) throw error;
      return { session: data as PaymentSession, resumed: true };
    }
    return { session: active, resumed: true };
  }

  const { data: tariff, error: tariffError } = await supabaseAdmin
    .from('tariffs')
    .select('id, amount, active')
    .eq('id', input.tariffId)
    .eq('active', true)
    .maybeSingle();
  if (tariffError) throw tariffError;
  if (!tariff) throw new Error('tariff_not_found');

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + 6 * 60 * 1000);
  const { data, error } = await supabaseAdmin
    .from('payment_sessions')
    .insert({
      user_id: input.userId,
      tariff_id: tariff.id,
      amount: tariff.amount,
      payment_method: input.paymentMethod,
      payment_reference: `SHY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return { session: data as PaymentSession, resumed: false };
}

export async function rejectSession(id: string, reason: string, review = 'needs_review'): Promise<void> {
  const status = review === 'manual_rejected' ? 'manual_rejected' : 'needs_review';
  const { error } = await supabaseAdmin.from('payment_sessions').update({
    status: 'rejected',
    rejected_reason: reason,
    admin_review_status: status,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

export async function approveSession(id: string, review: 'auto_approved' | 'manual_approved') {
  const { data, error } = await supabaseAdmin.rpc('approve_payment_session', {
    p_session_id: id,
    p_review_status: review,
  });
  if (error) throw error;
  return data as PaymentSession;
}
