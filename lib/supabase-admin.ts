import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Admin/service-role client without importing next/headers.
 * Safe to import from shared service modules used by client components.
 * NEVER expose the service role key to the browser — only call from
 * server routes, or from client code that merely types against services
 * that themselves must not ship the key (prefer API routes for mutations).
 */
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url =
    process.env.SUPABASE_SERVER_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || url.startsWith('/')) {
    const fallbackUrl = process.env.SUPABASE_SERVER_URL || 'http://127.0.0.1:54321';
    if (!serviceKey) return null;
    return createClient(fallbackUrl, serviceKey);
  }
  return createClient(url, serviceKey);
}
