/**
 * lib/supabase-server.js · server-only Supabase client
 *
 * Uses the SUPABASE_SERVICE_KEY (bypasses RLS) — NEVER ship this module to the
 * browser. It's CommonJS so Vercel's Node serverless functions can require() it
 * directly the same way api/chat.js works.
 *
 * Singleton: callers always get the same client instance per cold start.
 */

const { createClient } = require('@supabase/supabase-js');

let cachedClient = null;

function getSupabaseServer() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'supabase_misconfigured: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the environment.'
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      // Server-side, no session persistence, no auto refresh.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

module.exports = { getSupabaseServer };
module.exports.default = getSupabaseServer;
