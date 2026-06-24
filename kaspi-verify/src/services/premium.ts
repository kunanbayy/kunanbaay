import { supabaseAdmin } from '../lib/supabase';
import { config } from '../lib/config';

export interface TariffActivationResult {
  premiumUntil: string | null;
  email: string | null;
  energyGranted: number;
  resultsUnlocked: boolean;
}

/**
 * Extend (or start) the user's Premium window.
 *   premium_until > now  → add PREMIUM_DAYS to the existing date (stacking)
 *   otherwise            → now + PREMIUM_DAYS
 * Returns the new premium_until ISO string.
 */
export async function activatePremium(userId: string): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('premium_until')
    .eq('id', userId)
    .maybeSingle();

  const now = Date.now();
  const current = profile?.premium_until ? Date.parse(profile.premium_until) : 0;
  const base = current > now ? current : now;
  const next = new Date(base + config.premiumDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, premium_until: next }, { onConflict: 'id' });

  if (error) throw new Error(`premium_upsert_failed: ${error.message}`);
  return next;
}

function energyForPlan(plan: string | null | undefined, amount: number | null | undefined): number {
  const key = String(plan || '').toLowerCase();
  if (key.includes('report990')) return 0;
  if (key.includes('career') || key.includes('premium') || Number(amount || 0) >= config.planAmounts.career) return 3;
  if (key.includes('standard') || key.includes('once') || Number(amount || 0) >= config.planAmounts.standard) return 1;
  return 0;
}

function isResultsPlan(plan: string | null | undefined, amount: number | null | undefined): boolean {
  const key = String(plan || '').toLowerCase();
  return key.includes('report990') || Number(amount || 0) === config.planAmounts.report990;
}

async function emailForUser(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  return data?.email ? String(data.email).toLowerCase() : null;
}

/**
 * Unlock the purchased tariff after an admin approval.
 * This is the only place payment orders should grant access.
 */
export async function activateTariff(userId: string, plan: string | null | undefined, amount: number): Promise<TariffActivationResult> {
  const email = await emailForUser(userId);
  const resultsUnlocked = isResultsPlan(plan, amount);
  const energyGranted = resultsUnlocked ? 0 : energyForPlan(plan, amount);
  const now = new Date().toISOString();

  let premiumUntil: string | null = null;
  if (!resultsUnlocked) {
    premiumUntil = await activatePremium(userId);
  }

  if (email) {
    const { data: current } = await supabaseAdmin
      .from('access')
      .select('email, energy, energy_total')
      .eq('email', email)
      .maybeSingle();

    const currentEnergy = Number(current?.energy || 0);
    const currentTotal = Number(current?.energy_total ?? currentEnergy);
    const patch: Record<string, unknown> = {
      email,
      blocked: false,
      updated_at: now,
    };
    if (resultsUnlocked) {
      patch.results_unlocked = true;
      patch.results_unlocked_at = now;
    } else {
      patch.premium = true;
      patch.premium_until = premiumUntil;
      patch.energy = currentEnergy + energyGranted;
      patch.energy_total = currentTotal + energyGranted;
    }

    const { error } = await supabaseAdmin.from('access').upsert(patch, { onConflict: 'email' });
    if (error) throw new Error(`access_upsert_failed: ${error.message}`);
  }

  return { premiumUntil, email, energyGranted, resultsUnlocked };
}
