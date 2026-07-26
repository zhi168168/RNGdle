import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function firstConfigLine(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) || "";
}

const config = window.RNGDLE_SUPABASE_CONFIG || {};
const SUPABASE_URL = firstConfigLine(config.url);
const SUPABASE_ANON_KEY = firstConfigLine(config.anonKey);

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
