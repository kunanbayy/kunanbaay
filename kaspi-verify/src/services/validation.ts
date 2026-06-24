import { config } from '../lib/config';
import type { ExtractedReceipt, VerifyFailReason } from '../types';

export interface ValidationOutcome {
  ok: boolean;
  reason?: VerifyFailReason;
  message: string;
}

export interface ValidateOptions {
  /** Тапсырыста бекітілген сома (тарифтің бағасы), ₸. */
  expectedAmount: number;
  /** Тапсырыс жасалған сәт (ms) — 6-минут терезенің басы. */
  windowStartMs: number;
  /** Терезе ұзақтығы (минут). */
  windowMinutes: number;
  /** Қолданушының email-і — чек комментарийінде осы белгі бар-жоғын тексеру (бар болса). */
  expectedEmail?: string;
}

const CLOCK_SKEW_MS = 2 * 60_000; // сағат айырмасына 2 минут жеңілдік

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
export function validateReceipt(r: ExtractedReceipt, opts: ValidateOptions): ValidationOutcome {
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
  // Сома — тапсырыста бекітілген тариф бағасына тең болуы керек
  if (r.amount !== opts.expectedAmount) {
    return { ok: false, reason: 'amount_mismatch', message: `Сома сәйкес емес. Қажет: ${opts.expectedAmount} ₸, чекте: ${r.amount ?? '—'} ₸.` };
  }
  // Алушы тексеруі — тек EXPECTED_RECEIVER орнатылған болса ғана
  if (config.expectedReceiver && normName(r.receiverName) !== normName(config.expectedReceiver)) {
    return { ok: false, reason: 'receiver_mismatch', message: `Алушы сәйкес емес. Аударым «${config.expectedReceiver}» атына жасалуы керек.` };
  }
  // Чек осы қолданушыға тиесілі ме — комментарийде email белгісі болса тексереміз.
  // (Комментарий болмаса — өткіземіз; негізгі қорғаныс: сома + уақыт терезесі + hash.)
  if (opts.expectedEmail && r.comment && r.comment.trim()) {
    const c = r.comment.toLowerCase();
    const email = opts.expectedEmail.toLowerCase().trim();
    const local = email.split('@')[0];
    if (!c.includes(email) && !(local.length >= 3 && c.includes(local))) {
      return { ok: false, reason: 'not_your_receipt', message: 'Чек осы тапсырысқа тиесілі емес. Төлем комментарийіне өз email-іңізді жазыңыз.' };
    }
  }
  // Чектегі күн/уақыт — тапсырыстың 6-минут терезесінің ішінде болуы керек
  const when = r.paymentDate ? Date.parse(r.paymentDate) : NaN;
  if (Number.isNaN(when)) {
    return { ok: false, reason: 'receipt_too_old', message: 'Чек күні/уақыты анықталмады.' };
  }
  const windowStart = opts.windowStartMs - CLOCK_SKEW_MS;
  const windowEnd = opts.windowStartMs + opts.windowMinutes * 60_000 + CLOCK_SKEW_MS;
  if (when < windowStart || when > windowEnd) {
    return {
      ok: false,
      reason: 'receipt_too_old',
      message: `Чектегі уақыт төлем терезесіне (${opts.windowMinutes} мин) сай емес. Тапсырыс жасалған соң ${opts.windowMinutes} минут ішінде төлеп, дәл сол чекті жүктеңіз.`,
    };
  }
  return { ok: true, message: 'Чек расталды.' };
}
