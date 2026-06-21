// Central, env-driven configuration. Fail fast if required secrets are missing.

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_ROLE_KEY'),

  openaiApiKey: required('OPENAI_API_KEY'),
  openaiModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',

  premiumAmount: Number(process.env.PREMIUM_AMOUNT || 990),
  expectedReceiver: process.env.EXPECTED_RECEIVER || 'Мадина Е.',
  receiptMaxAgeMinutes: Number(process.env.RECEIPT_MAX_AGE_MINUTES || 30),
  minOcrConfidence: Number(process.env.MIN_OCR_CONFIDENCE || 0.75),
  premiumDays: Number(process.env.PREMIUM_DAYS || 30),

  // ── Kaspi Pay gateway (tapter-dev/kaspi-pos-automation) ──
  kaspiGatewayUrl: process.env.KASPI_GATEWAY_URL || '',
  kaspiTokenSn: process.env.KASPI_TOKEN_SN || '',
  kaspiVtokenSecret: process.env.KASPI_VTOKEN_SECRET || '',
  kaspiProfileId: process.env.KASPI_PROFILE_ID || '',
  kaspiWebhookSecret: process.env.KASPI_WEBHOOK_SECRET || '',

  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
} as const;

export const corsHeaders = {
  'Access-Control-Allow-Origin': config.allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
