import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './environment';

/**
 * Supabase client for anonymous/user operations
 * Uses the anon key which respects Row Level Security (RLS) policies
 */
export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side doesn't need session persistence
    },
  }
);

/**
 * Supabase client for admin/service operations
 * Uses the service role key which bypasses Row Level Security (RLS) policies
 * Use with caution - only for trusted server-side operations
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get a Supabase client with a specific user's JWT token
 * Useful for operations that need to respect RLS for a specific user
 */
export function getSupabaseClientForUser(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
