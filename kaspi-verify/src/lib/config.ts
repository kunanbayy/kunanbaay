// Central, env-driven configuration. Fail fast if required secrets are missing.

export const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://invalid.supabase.co',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key',

  openaiApiKey: process.env.OPENAI_API_KEY || 'missing-openai-key',
  openaiModel: process.env.OPENAI_VISION_MODEL || 'gpt-4o',

  expectedReceiver: process.env.EXPECTED_RECEIVER || 'Мадина Е.',
  minOcrConfidence: Number(process.env.MIN_OCR_CONFIDENCE || 0.75),

  // ── Kaspi Pay gateway (tapter-dev/kaspi-pos-automation) ──
  kaspiGatewayUrl: process.env.KASPI_GATEWAY_URL || '',
  kaspiTokenSn: process.env.KASPI_TOKEN_SN || '',
  kaspiVtokenSecret: process.env.KASPI_VTOKEN_SECRET || '',
  kaspiProfileId: process.env.KASPI_PROFILE_ID || '',
  kaspiWebhookSecret: process.env.KASPI_WEBHOOK_SECRET || '',
  kaspiPaymentLink: process.env.KASPI_PAYMENT_LINK || 'https://kaspi.kz/',

  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
} as const;

export function assertServerConfig(requireOpenAI = false): void {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('server_not_configured');
  }
  if (requireOpenAI && !process.env.OPENAI_API_KEY) throw new Error('ocr_not_configured');
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': config.allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
