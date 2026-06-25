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
  // Әр тарифтің нақты сомасы (₸). Чектегі сома осы санға тең болуы керек.
  planAmounts: {
    standard:  Number(process.env.AMOUNT_STANDARD  || 2990),
    once:      Number(process.env.AMOUNT_STANDARD  || 2990),
    career:    Number(process.env.AMOUNT_CAREER    || 4990),
    premium:   Number(process.env.AMOUNT_CAREER    || 4990),
    report990: Number(process.env.AMOUNT_REPORT990 || 990),
  } as Record<string, number>,
  expectedReceiver: process.env.EXPECTED_RECEIVER || '', // бос болса — алушы тексерілмейді
  // Төлем терезесі: чек тапсырыс жасалған сәттен бастап осы минут ішінде болуы керек.
  receiptMaxAgeMinutes: Number(process.env.RECEIPT_MAX_AGE_MINUTES || 6),
  minOcrConfidence: Number(process.env.MIN_OCR_CONFIDENCE || 0.75),
  premiumDays: Number(process.env.PREMIUM_DAYS || 30),

  // ── Kaspi Pay gateway (tapter-dev/kaspi-pos-automation) ──
  kaspiGatewayUrl: process.env.KASPI_GATEWAY_URL || '',
  kaspiTokenSn: process.env.KASPI_TOKEN_SN || '',
  kaspiVtokenSecret: process.env.KASPI_VTOKEN_SECRET || '',
  kaspiProfileId: process.env.KASPI_PROFILE_ID || '',
  kaspiWebhookSecret: process.env.KASPI_WEBHOOK_SECRET || '',

  allowedOrigin: process.env.ALLOWED_ORIGIN || '*',

  // Admin panel-дің барлық тапсырыстарды оқуы үшін құпия токен (x-admin-token).
  adminToken: process.env.ADMIN_TOKEN || '',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@shyraq.edu.kz',
  // Existing installs keep working; production should override this in Vercel.
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
} as const;

/** Тарифке сай күтілетін сома (₸). Белгісіз тариф → premiumAmount. */
export function amountForPlan(plan: string | null | undefined): number {
  if (plan && config.planAmounts[plan] != null) return config.planAmounts[plan];
  return config.premiumAmount;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': config.allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
