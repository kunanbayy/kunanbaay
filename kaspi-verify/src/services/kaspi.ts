// Thin client for the Kaspi Pay gateway (tapter-dev/kaspi-pos-automation).
// The gateway holds the authenticated Kaspi session; we pass the session headers
// (obtained once via its /api/auth flow) from server-side env vars.

import { config } from '../lib/config';

function sessionHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Token-SN': config.kaspiTokenSn,
    'X-Vtoken-Secret': config.kaspiVtokenSecret,
    'X-Profile-Id': config.kaspiProfileId,
  };
}

export interface KaspiQr {
  qrOperationId: string;
  qrToken: string;        // pay.kaspi.kz link → render as QR
  expireDate: string | null;
  amount: number | null;
  receiptUrl: string | null;
}

/** Create a Kaspi Pay QR for the given amount (₸). */
export async function createQr(amount: number): Promise<KaspiQr> {
  if (!config.kaspiGatewayUrl) throw new Error('kaspi_gateway_not_configured');
  const res = await fetch(`${config.kaspiGatewayUrl}/api/qr/create`, {
    method: 'POST',
    headers: sessionHeaders(),
    body: JSON.stringify({ amount }),
  });
  const j = await res.json().catch(() => ({}));
  if (j?.StatusCode !== 0 || !j?.Data) throw new Error('kaspi_qr_create_failed');
  return {
    qrOperationId: String(j.Data.QrOperationId),
    qrToken: j.Data.QrToken,
    expireDate: j.Data.ExpireDate ?? null,
    amount: j.Data.Amount ?? amount,
    receiptUrl: j.Data.ReceiptUrl ?? null,
  };
}

/** Poll a QR payment's status (fallback to webhook). */
export async function getQrStatus(qrOperationId: string): Promise<unknown> {
  if (!config.kaspiGatewayUrl) throw new Error('kaspi_gateway_not_configured');
  const res = await fetch(
    `${config.kaspiGatewayUrl}/api/qr/status?qrOperationId=${encodeURIComponent(qrOperationId)}`,
    { headers: sessionHeaders() }
  );
  return res.json();
}
