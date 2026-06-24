// Shared TypeScript types for the Kaspi verification flow.

export type PaymentMethod = 'qr' | 'kaspi_link';
export type PaymentSessionStatus = 'pending' | 'receipt_uploaded' | 'verifying' | 'approved' | 'rejected' | 'expired';
export type AdminReviewStatus = 'pending' | 'needs_review' | 'auto_approved' | 'manual_approved' | 'manual_rejected';

export interface Tariff {
  id: string;
  name: string;
  amount: number;
  career_energy: number;
  premium_days: number;
  features: string[];
  active: boolean;
}

export interface PaymentSession {
  id: string;
  user_id: string;
  tariff_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference: string;
  status: PaymentSessionStatus;
  started_at: string;
  expires_at: string;
  receipt_url: string | null;
  receipt_uploaded_at: string | null;
  receipt_hash: string | null;
  receipt_paid_at: string | null;
  receipt_parsed: ExtractedReceipt | null;
  approved_at: string | null;
  rejected_reason: string | null;
  admin_review_status: AdminReviewStatus;
  qr_operation_id: string | null;
  qr_token: string | null;
  provider_payload?: unknown;
  updated_at: string;
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
  payerName: string | null;
  payerEmail: string | null;
  paymentReference: string | null;
  purpose: string | null;
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
  | 'session_expired'
  | 'receipt_outside_session'
  | 'receipt_not_for_order'
  | 'payer_mismatch'
  | 'unreadable'
  | 'looks_edited'
  | 'low_confidence'
  | 'no_receipt_number'
  | 'duplicate_receipt'
  | 'amount_mismatch'
  | 'receiver_mismatch'
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
