import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/keepalive
 * Vercel Cron Job endpoint to keep Supabase database active 24/7 on Free Tier (prevents 7-day auto-pause).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  // Standard Vercel Cron Authorization Check or Direct Keepalive Request
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Return unauthorized if CRON_SECRET is set but doesn't match
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiResponse.unauthorized('Invalid cron secret token');
    }
  }

  let dbPingOk = false;
  let latencyMs = 0;
  let message = 'Local memory mode active. Supabase not configured.';

  if (isSupabaseConfigured && supabase) {
    const start = Date.now();
    try {
      // Lightweight 1-row ping
      const { error } = await supabase.from('test_settings').select('id').limit(1);
      latencyMs = Date.now() - start;
      if (!error) {
        dbPingOk = true;
        message = 'Supabase keepalive ping successful!';
      } else {
        message = `Ping execute warning: ${error.message}`;
      }
    } catch (err: any) {
      message = `Ping failed: ${err?.message || 'Connection error'}`;
    }
  }

  return apiResponse.success({
    keepalive: true,
    dbPingOk,
    latencyMs,
    message,
    timestamp: new Date().toISOString()
  });
}
