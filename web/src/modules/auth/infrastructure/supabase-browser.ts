import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseBrowserConfigured = Boolean(url && anonKey);

if (!isSupabaseBrowserConfigured) {
  console.warn("Supabase browser environment is not configured.");
}

export const supabase = createClient(
  url || "http://127.0.0.1:54321",
  anonKey || "missing-anon-key",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
    },
  },
);
