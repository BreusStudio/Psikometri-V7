import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError } from '@/lib/api';
import { createClient } from '@supabase/supabase-js';
import { getServerConfig } from '@/lib/serverConfig';
import { generateSqlMigrationPatch } from '@/lib/core/supabase';

export const dynamic = 'force-dynamic';

/**
 * Auto-Migrate API Endpoint
 * Executes automated DDL column/table patching via Supabase RPC `execute_auto_migration`
 * or via Supabase service/admin client.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const customSql = typeof body?.sql === 'string' && body.sql.trim().length > 0 ? body.sql : null;
  const sqlToExecute = customSql || generateSqlMigrationPatch();

  if (!sqlToExecute || sqlToExecute.trim().length === 0) {
    return apiResponse.success({ applied: false, message: 'Tidak ada patch DDL yang perlu dieksekusi.' });
  }

  const config = getServerConfig();
  const supabaseUrl = config.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = (config as any).supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    throw ApiError.badRequest('Konfigurasi Supabase URL & Key belum tersedia.');
  }

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // 1. Try calling the One-Time Master RPC helper: execute_auto_migration
  try {
    const { data: rpcData, error: rpcError } = await client.rpc('execute_auto_migration', {
      migration_sql: sqlToExecute
    });

    if (!rpcError) {
      return apiResponse.success({
        applied: true,
        method: 'rpc_execute_auto_migration',
        result: rpcData || 'Migration applied successfully via RPC helper.'
      }, 'Skema database Supabase berhasil diperbarui secara otomatis via RPC!');
    }

    // If RPC failed specifically because the function does not exist (PostgreSQL code 42883)
    const isRpcMissing = rpcError.code === '42883' || rpcError.message?.includes('does not exist') || rpcError.message?.includes('function');

    if (isRpcMissing) {
      return apiResponse.error(
        'Fungsi RPC "execute_auto_migration" belum dibuat di Supabase Anda. Buat fungsi helper 1 kali di SQL Editor Supabase agar tombol Auto-Fix dapat berjalan otomatis.',
        400,
        {
          code: 'RPC_NOT_INSTALLED',
          suggestedSql: `-- JALANKAN 1 KALI DI SQL EDITOR SUPABASE:\nCREATE OR REPLACE FUNCTION public.execute_auto_migration(migration_sql text)\nRETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    EXECUTE migration_sql;\nEND;\n$$;\n\nNOTIFY pgrst, 'reload schema';`,
          rawError: rpcError
        }
      );
    }

    return apiResponse.error(
      `Gagal mengeksekusi migrasi DDL: ${rpcError.message || rpcError.details || 'Unknown RPC error'}`,
      500,
      rpcError
    );
  } catch (err: any) {
    return apiResponse.error(
      `Exception saat auto-migrate: ${err?.message || String(err)}`,
      500,
      err
    );
  }
});
