/**
 * lib/supabase-browser.js · public, browser-safe Supabase client (read-only)
 *
 * Reads anon key + URL from a global `window.__SUPABASE_CONFIG__` object that
 * the page is responsible for injecting BEFORE this module loads. We prefer to
 * proxy DB writes through /api/* routes (so the service key stays on the
 * server), but this client is here for any future read-only realtime or direct
 * subscription needs.
 *
 * Usage:
 *   <script>
 *     window.__SUPABASE_CONFIG__ = { url: '...', anonKey: '...' };
 *   </script>
 *   <script type="module">
 *     import { getSupabaseBrowser } from './lib/supabase-browser.js';
 *     const supabase = getSupabaseBrowser();
 *   </script>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.103.3';

let cachedClient = null;

export function getSupabaseBrowser() {
  if (cachedClient) return cachedClient;

  const cfg = (typeof window !== 'undefined' && window.__SUPABASE_CONFIG__) || null;
  if (!cfg || !cfg.url || !cfg.anonKey) {
    throw new Error(
      'supabase-browser: window.__SUPABASE_CONFIG__ must be set with { url, anonKey } before importing this module.'
    );
  }

  cachedClient = createClient(cfg.url, cfg.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

export default getSupabaseBrowser;
