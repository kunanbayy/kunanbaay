import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Service-role client — server-only. NEVER expose this key to the browser.
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
