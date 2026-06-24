import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReceipt } from './validation';
import type { ExtractedReceipt } from '../types';

const expected = {
  amount: 2990,
  startedAt: '2026-06-24T10:00:00.000Z',
  expiresAt: '2026-06-24T10:06:00.000Z',
  status: 'pending' as const,
};

function receipt(patch: Partial<ExtractedReceipt> = {}): ExtractedReceipt {
  return {
    receiptNumber: '1234567890',
    amount: 2990,
    receiverName: 'BAY GROUP',
    payerName: 'Aruzhan Test',
    payerEmail: 'student@example.com',
    paymentReference: 'SHY-A1B2C3D4',
    purpose: 'Shyraq SHY-A1B2C3D4',
    paymentDate: '24.06.2026 15:04',
    transferType: 'Перевод',
    confidence: 0.99,
    isReadable: true,
    looksEdited: false,
    rawText: 'SHY-A1B2C3D4 student@example.com',
    ...patch,
  };
}

test('approves a receipt matching merchant, amount and time', () => {
  assert.equal(validateReceipt(receipt(), expected).ok, true);
});

test('accepts merchant OCR noise after normalization', () => {
  assert.equal(validateReceipt(receipt({ receiverName: 'B.А.Y GR0UP' }), expected).ok, true);
});

test('rejects merchant mismatch', () => {
  const result = validateReceipt(receipt({ receiverName: 'OTHER SHOP' }), expected);
  assert.equal(result.reason, 'receiver_mismatch');
  assert.equal(result.message, 'Сатушы сәйкес емес');
});

test('rejects amount mismatch', () => {
  assert.equal(validateReceipt(receipt({ amount: 4990 }), expected).reason, 'amount_mismatch');
});

test('allows two-minute payment window tolerance', () => {
  assert.equal(validateReceipt(receipt({ paymentDate: '24.06.2026 14:58' }), expected).ok, true);
  assert.equal(validateReceipt(receipt({ paymentDate: '24.06.2026 15:08' }), expected).ok, true);
});

test('rejects payment outside the tolerated six-minute session', () => {
  assert.equal(validateReceipt(receipt({ paymentDate: '24.06.2026 14:57' }), expected).reason, 'receipt_outside_session');
  assert.equal(validateReceipt(receipt({ paymentDate: '24.06.2026 15:09' }), expected).reason, 'receipt_outside_session');
});

test('rejects another receipt date', () => {
  const result = validateReceipt(receipt({ paymentDate: '25.06.2026 15:04' }), expected);
  assert.equal(result.reason, 'receipt_outside_session');
  assert.equal(result.message, 'Чек күні басқа күн болса');
});

test('rejects expired sessions before other checks', () => {
  const result = validateReceipt(receipt({ receiverName: 'OTHER SHOP' }), { ...expected, status: 'expired' as const });
  assert.equal(result.reason, 'session_expired');
  assert.equal(result.message, 'Чек expired session-ге тиесілі болса');
});
