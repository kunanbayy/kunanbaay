import { config } from '../lib/config';
import type { ExtractedReceipt, VerifyFailReason } from '../types';

export interface ValidationOutcome {
  ok: boolean;
  reason?: VerifyFailReason;
  message: string;
}

/** Normalise a receiver name for tolerant comparison (case / spaces / punctuation). */
function normName(s: string | null | undefined): string {
  return (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .trim();
}

/**
 * Pure, side-effect-free validation of the OCR result against business rules.
 * Duplicate-receipt and order-status checks that need the DB are done in the route.
 */
export function validateReceipt(r: ExtractedReceipt): ValidationOutcome {
  if (!r.isReadable) {
    return { ok: false, reason: 'unreadable', message: 'Чек анық емес немесе Kaspi чегі емес. Сапалы скриншот/PDF жүктеңіз.' };
  }
  if (r.looksEdited) {
    return { ok: false, reason: 'looks_edited', message: 'Чекте өзгертілу белгілері байқалды. Түпнұсқа чекті жүктеңіз.' };
  }
  if (r.confidence < config.minOcrConfidence) {
    return { ok: false, reason: 'low_confidence', message: 'Чекті нақты оқу мүмкін болмады. Анығырақ суретпен қайталаңыз.' };
  }
  if (!r.receiptNumber) {
    return { ok: false, reason: 'no_receipt_number', message: 'Чек нөмірі табылмады.' };
  }
  if (r.amount !== config.premiumAmount) {
    return { ok: false, reason: 'amount_mismatch', message: `Сома сәйкес емес. Қажет: ${config.premiumAmount} ₸, чекте: ${r.amount ?? '—'} ₸.` };
  }
  if (normName(r.receiverName) !== normName(config.expectedReceiver)) {
    return { ok: false, reason: 'receiver_mismatch', message: `Алушы сәйкес емес. Аударым «${config.expectedReceiver}» атына жасалуы керек.` };
  }
  // freshness
  const when = r.paymentDate ? Date.parse(r.paymentDate) : NaN;
  if (Number.isNaN(when)) {
    return { ok: false, reason: 'receipt_too_old', message: 'Чек күні анықталмады.' };
  }
  const ageMin = (Date.now() - when) / 60000;
  if (ageMin > config.receiptMaxAgeMinutes || ageMin < -10 /* allow small clock skew */) {
    return { ok: false, reason: 'receipt_too_old', message: `Чек ${config.receiptMaxAgeMinutes} минут ішінде жасалуы керек. Жаңа аударым жасаңыз.` };
  }
  return { ok: true, message: 'Чек расталды.' };
}
