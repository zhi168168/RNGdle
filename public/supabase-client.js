import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const config = window.RNGDLE_SUPABASE_CONFIG || {};
const SUPABASE_URL = config.url || "";
const SUPABASE_ANON_KEY = config.anonKey || "";

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;
