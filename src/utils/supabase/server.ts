import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  // For now, use anon key directly
  // TODO: Set up proper Clerk JWT integration once template is configured
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase;
}
