import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse } from '@/lib/api';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SERVER_START_TIME = Date.now();

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  timestamp: string;
  memory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
  };
  database: {
    configured: boolean;
    reachable: boolean;
    latencyMs?: number;
    error?: string;
  };
  hybridConfig: {
    architecture: 'Controlled Hybrid + Smart Batching';
    batchSizeLimit: number;
    syncIntervalSec: number;
  };
}

/**
 * GET /api/health
 * System Health & Resource Telemetry Endpoint
 * Monitors memory, runtime uptime, and DB connection status for holistic observability.
 */
export const GET = withApiHandler(async (_req: NextRequest) => {
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.round((Date.now() - SERVER_START_TIME) / 1000);

  let dbReachable = false;
  let dbLatencyMs: number | undefined = undefined;
  let dbError: string | undefined = undefined;

  if (isSupabaseConfigured && supabase) {
    const startDb = Date.now();
    try {
      // Lightweight connection check
      const { error } = await supabase.from('app_config').select('key').limit(1);
      dbLatencyMs = Date.now() - startDb;

      if (!error || error.code === 'PGRST116' || error.message.includes('relation')) {
        dbReachable = true;
      } else {
        dbError = error.message;
      }
    } catch (err: any) {
      dbError = err?.message || 'Database request failed';
    }
  }

  const overallStatus: HealthStatus['status'] = !isSupabaseConfigured
    ? 'healthy' // Local memory-first mode is fully healthy
    : dbReachable
    ? 'healthy'
    : 'degraded'; // Fallbacks are active even if DB is temporarily down

  const payload: HealthStatus = {
    status: overallStatus,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    memory: {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
    },
    database: {
      configured: isSupabaseConfigured,
      reachable: dbReachable,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    hybridConfig: {
      architecture: 'Controlled Hybrid + Smart Batching',
      batchSizeLimit: 15,
      syncIntervalSec: 5,
    },
  };

  return apiResponse.success(payload);
});
