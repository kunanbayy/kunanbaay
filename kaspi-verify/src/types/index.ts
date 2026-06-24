// Shared TypeScript types for the Kaspi verification flow.

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'rejected';

export interface PaymentOrder {
  id: string;
  user_id: string;
  amount: number;
  plan: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_order_id: string;
  user_id: string;
  receipt_number: string;
  amount: number;
  receiver_name: string | null;
  paid_at: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  premium_until: string | null;
}

/** Raw structured data extracted from a Kaspi receipt by OCR. */
export interface ExtractedReceipt {
  receiptNumber: string | null;
  amount: number | null;          // integer KZT
  receiverName: string | null;    // merchant/recipient, expected to normalize to BAYGROUP
  payerName: string | null;       // sender / Жіберуші / Отправитель
  comment: string | null;         // purpose / Назначение / Комментарий
  paymentDate: string | null;     // Kaspi local time: DD.MM.YYYY HH:mm
  transferType: string | null;
  confidence: number;             // 0..1, model self-reported
  isReadable: boolean;            // false if blurry / cropped
  looksEdited: boolean;           // true if signs of tampering
  rawText?: string;
}

export type VerifyFailReason =
  | 'order_not_found'
  | 'order_not_pending'
  | 'unreadable'
  | 'looks_edited'
  | 'low_confidence'
  | 'no_receipt_number'
  | 'duplicate_receipt'
  | 'amount_mismatch'
  | 'receiver_mismatch'
  | 'receipt_outside_session'
  | 'not_your_receipt'
  | 'receipt_too_old'
  | 'ocr_error'
  | 'internal_error';

export interface VerifyResult {
  ok: boolean;
  reason?: VerifyFailReason;
  message: string;
  premiumUntil?: string;
  extracted?: ExtractedReceipt;
}
