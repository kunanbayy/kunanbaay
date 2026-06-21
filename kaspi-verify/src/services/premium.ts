import { supabaseAdmin } from '../lib/supabase';
import { config } from '../lib/config';

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
