import { createClient } from '@supabase/supabase-js';

// Supabase project credentials for Cafe's Corner CRM
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lqmpwasppujlujrhyrhn.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_-6Df6OZBKhaNkf28y8LKuA_a94s7gHY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
