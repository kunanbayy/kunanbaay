import { supabaseAdmin } from './supabase';
import type { ExtractedReceipt, VerifyFailReason } from '../types';

type LogLevel = 'info' | 'warn' | 'error';

export function log(level: LogLevel, msg: string, meta?: unknown) {
  const line = { ts: new Date().toISOString(), level, msg, meta };
  // structured stdout log (picked up by Vercel / hosting logs)
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(line));
}

/** Persist every verification attempt for fraud auditing. Never throws. */
export async function logVerification(input: {
  userId?: string | null;
  orderId?: string | null;
  success: boolean;
  reason?: VerifyFailReason | null;
  extracted?: ExtractedReceipt | null;
  receiptHash?: string | null;
}) {
  try {
    await supabaseAdmin.from('verification_logs').insert({
      user_id: input.userId ?? null,
      payment_order_id: input.orderId ?? null,
      success: input.success,
      reason: input.reason ?? null,
      ocr_confidence: input.extracted?.confidence ?? null,
      raw_ocr: input.extracted ?? null,
      receipt_hash: input.receiptHash ?? null,
    });
  } catch (e) {
    log('error', 'failed to write verification_log', e);
  }
}
