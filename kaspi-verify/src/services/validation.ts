import crypto from 'crypto';
import type { ExtractedReceipt, PaymentSessionStatus, VerifyFailReason } from '../types';

export interface ValidationOutcome {
  ok: boolean;
  reason?: VerifyFailReason;
  message: string;
  receiptHash?: string;
  paidAtIso?: string;
}

const ALMATY_TIME_ZONE = 'Asia/Almaty';
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
  const parts = almatyParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function timeZoneOffsetMinutes(date: Date): number {
  const parts = almatyParts(date);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
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

/**
 * Pure, side-effect-free validation of the OCR result against business rules.
 * Duplicate-receipt and order-status checks that need the DB are done in the route.
 */
export function validateReceipt(r: ExtractedReceipt, expected: {
  amount: number;
  startedAt: string;
  expiresAt: string;
  status: PaymentSessionStatus;
}): ValidationOutcome {
  if (expected.status === 'expired') {
    return { ok: false, reason: 'session_expired', message: 'Чек expired session-ге тиесілі болса' };
  }

  const normalizedMerchant = normalizeMerchant(r.receiverName);
  if (!normalizedMerchant.includes('BAYGROUP')) {
    return { ok: false, reason: 'receiver_mismatch', message: 'Сатушы сәйкес емес' };
  }

  let receiptAmount: number;
  let cleanedAmount: string;
  let tariffAmount: number;
  try {
    ({ amount: receiptAmount, cleanedAmount } = parseAmount(r.amount));
    ({ amount: tariffAmount } = parseAmount(expected.amount));
  } catch {
    return { ok: false, reason: 'amount_mismatch', message: 'Сома сәйкес емес' };
  }
  if (receiptAmount !== tariffAmount) {
    return { ok: false, reason: 'amount_mismatch', message: 'Сома сәйкес емес' };
  }

  let paidAt: Date;
  try {
    paidAt = parseKaspiPaidAt(r.paymentDate);
  } catch {
    return { ok: false, reason: 'receipt_outside_session', message: 'Төлем уақыты сәйкес емес' };
  }

  const startedAt = new Date(expected.startedAt);
  const expiresAt = new Date(expected.expiresAt);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(expiresAt.getTime())) {
    return { ok: false, reason: 'receipt_outside_session', message: 'Төлем уақыты сәйкес емес' };
  }

  if (almatyDateKey(paidAt) !== almatyDateKey(startedAt)) {
    return { ok: false, reason: 'receipt_outside_session', message: 'Чек күні басқа күн болса' };
  }

  const validFrom = startedAt.getTime() - 2 * 60_000;
  const validUntil = expiresAt.getTime() + 2 * 60_000;
  if (paidAt.getTime() < validFrom || paidAt.getTime() > validUntil) {
    return { ok: false, reason: 'receipt_outside_session', message: 'Төлем уақыты сәйкес емес' };
  }

  const receiptNumber = String(r.receiptNumber ?? '').split(/\s+/).join('');
  if (!receiptNumber) {
    return { ok: false, reason: 'no_receipt_number', message: 'Чек нөмірі оқылмады' };
  }

  const hashPayload = receiptNumber + cleanedAmount + formatHashTime(paidAt) + normalizedMerchant;
  return {
    ok: true,
    message: 'Төлем қабылданды',
    receiptHash: createReceiptHash(hashPayload),
    paidAtIso: paidAt.toISOString(),
  };
}

function formatHashTime(date: Date): string {
  const parts = almatyParts(date);
  return [
    parts.year,
    String(parts.month).padStart(2, '0'),
    String(parts.day).padStart(2, '0'),
    String(parts.hour).padStart(2, '0'),
    String(parts.minute).padStart(2, '0'),
  ].join('');
}

function createReceiptHash(payload: string): string {
  // node:crypto keeps this deterministic on the server and in tests.
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}
