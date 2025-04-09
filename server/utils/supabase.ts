// server/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const getServerSupabaseClient = () => {
  const url = process.env.NUXT_SUPABASE_URL;
  const key = process.env.NUXT_SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('Supabase env vars are missing');
  }

  return createClient(url, key);
};