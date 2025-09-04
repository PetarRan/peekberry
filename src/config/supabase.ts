import { createClient } from "@supabase/supabase-js";

// Supabase configuration
const supabaseUrl = __VITE_SUPABASE_URL__;
const supabaseAnonKey = __VITE_SUPABASE_ANON_KEY__;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
