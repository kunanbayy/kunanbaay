import { createHash } from 'crypto';
import type { ExtractedReceipt, PaymentStatus, VerifyFailReason } from '../types';

export interface ValidationOutcome {
  ok: boolean;
  reason?: VerifyFailReason;
  message: string;
  receiptHash?: string;
  paidAtIso?: string;
}

export interface ValidateOptions {
  expectedAmount: number;
  windowStartMs: number;
  windowMinutes: number;
  orderStatus?: PaymentStatus;
}

const ALMATY_TIME_ZONE = 'Asia/Almaty';
const CLOCK_SKEW_MS = 2 * 60_000;
const MERCHANT_TRANSLATION: Record<string, string> = {
  '0': 'O',
  'А': 'A',
  'В': 'B',
  'Р': 'P',
  'О': 'O',
};

function normalizeMerchant(value: unknown): string {
  return String(value ?? '')
    .toUpperCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .replace(/[0АВРО]/g, (char) => MERCHANT_TRANSLATION[char] ?? char);
}

function parseAmount(value: unknown): { amount: number; cleanedAmount: string } {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  if (!digits) throw new Error('amount_parse_failed');
  const amount = Number.parseInt(digits, 10);
  if (!Number.isFinite(amount)) throw new Error('amount_parse_failed');
  return { amount, cleanedAmount: String(amount) };
}

function almatyParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ALMATY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function almatyDateKey(date: Date): string {
  const p = almatyParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function timeZoneOffsetMinutes(date: Date): number {
  const p = almatyParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (asUtc - date.getTime()) / 60000;
}

function parseKaspiPaidAt(value: unknown): Date {
  const raw = String(value ?? '').trim();
  const match = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(raw);
  if (!match) throw new Error('paid_at_parse_failed');

  const [, dd, mm, yyyy, hh, min] = match;
  const localAsUtc = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), 0);
  const offset = timeZoneOffsetMinutes(new Date(localAsUtc));
  return new Date(localAsUtc - offset * 60_000);
}

function hashTime(date: Date): string {
  const p = almatyParts(date);
  return [
    p.year,
    String(p.month).padStart(2, '0'),
    String(p.day).padStart(2, '0'),
    String(p.hour).padStart(2, '0'),
    String(p.minute).padStart(2, '0'),
  ].join('');
}

export function validateReceipt(r: ExtractedReceipt, opts: ValidateOptions): ValidationOutcome {
  if (opts.orderStatus === 'expired') {
    return { ok: false, reason: 'order_not_pending', message: 'Чек expired session-ге тиесілі болса' };
  }

  const normalizedMerchant = normalizeMerchant(r.receiverName);
  if (!normalizedMerchant.includes('BAYGROUP')) {
    return { ok: false, reason: 'receiver_mismatch', message: 'Сатушы сәйкес емес' };
  }

  let receiptAmount: number;
  let cleanedAmount: string;
  let expectedAmount: number;
  try {
    ({ amount: receiptAmount, cleanedAmount } = parseAmount(r.amount));
    ({ amount: expectedAmount } = parseAmount(opts.expectedAmount));
  } catch {
    return { ok: false, reason: 'amount_mismatch', message: 'Сома сәйкес емес' };
  }
  if (receiptAmount !== expectedAmount) {
    return { ok: false, reason: 'amount_mismatch', message: 'Сома сәйкес емес' };
  }

  let paidAt: Date;
  try {
    paidAt = parseKaspiPaidAt(r.paymentDate);
  } catch {
    return { ok: false, reason: 'receipt_outside_session', message: 'Төлем уақыты сәйкес емес' };
  }

  const startedAt = new Date(opts.windowStartMs);
  if (almatyDateKey(paidAt) !== almatyDateKey(startedAt)) {
    return { ok: false, reason: 'receipt_outside_session', message: 'Чек күні басқа күн болса' };
  }

  const validFrom = opts.windowStartMs - CLOCK_SKEW_MS;
  const validUntil = opts.windowStartMs + opts.windowMinutes * 60_000 + CLOCK_SKEW_MS;
  if (paidAt.getTime() < validFrom || paidAt.getTime() > validUntil) {
    return { ok: false, reason: 'receipt_outside_session', message: 'Төлем уақыты сәйкес емес' };
  }

  const receiptNumber = String(r.receiptNumber ?? '').split(/\s+/).join('');
  if (!receiptNumber) {
    return { ok: false, reason: 'no_receipt_number', message: 'Чек нөмірі оқылмады' };
  }

  const hashPayload = receiptNumber + cleanedAmount + hashTime(paidAt) + normalizedMerchant;
  return {
    ok: true,
    message: 'Төлем қабылданды',
    receiptHash: createHash('sha256').update(hashPayload, 'utf8').digest('hex'),
    paidAtIso: paidAt.toISOString(),
  };
}
