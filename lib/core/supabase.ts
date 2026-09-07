import { createClient, SupabaseClient } from '@supabase/supabase-js';

export let supabase: SupabaseClient | null = null;
export let isSupabaseConfigured = false;

export function getIsSupabaseConfigured(): boolean {
  return isSupabaseConfigured || !!supabase;
}

export function initSupabaseClient(url: string, key: string): boolean {
  if (!url || !key) return false;
  try {
    supabase = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
    isSupabaseConfigured = true;
    return true;
  } catch (err) {
    console.error("Failed to initialize Supabase dynamically:", err);
    return false;
  }
}

// Initial setup from environment variables
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let finalUrl = envUrl;
let finalKey = envKey;

// If running on server, attempt to load from server-side config.json
if (typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    const CONFIG_PATH = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed.supabaseUrl) finalUrl = parsed.supabaseUrl;
      if (parsed.supabaseAnonKey) finalKey = parsed.supabaseAnonKey;
    }
  } catch (err) {
    console.error("Failed to read server config during supabase.ts initialization:", err);
  }
}

if (finalUrl && finalKey) {
  initSupabaseClient(finalUrl, finalKey);
}

// Session-level memory cache of columns identified as missing in the remote database.
// This prevents repeating dozens of HTTP retry cycles on every subsequent upsert.
const knownUnsupportedColumns: Map<string, Set<string>> = new Map();

export interface SupabaseSyncError {
  timestamp: string;
  table: string;
  code?: string;
  message: string;
  missingColumn?: string;
}

const recentSyncErrors: SupabaseSyncError[] = [];

export function getRecentSyncErrors(): SupabaseSyncError[] {
  return [...recentSyncErrors];
}

export function clearRecentSyncErrors() {
  recentSyncErrors.length = 0;
}

export function getKnownUnsupportedColumns(table: string): string[] {
  return Array.from(knownUnsupportedColumns.get(table) || []);
}

export function getAllKnownUnsupportedColumns(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  knownUnsupportedColumns.forEach((cols, table) => {
    if (cols.size > 0) {
      result[table] = Array.from(cols);
    }
  });
  return result;
}

export function clearKnownUnsupportedColumns() {
  knownUnsupportedColumns.clear();
  clearRecentSyncErrors();
}

/**
 * Generates exact SQL ALTER TABLE & RLS statements for all detected schema differences in Supabase.
 */
export function generateSqlMigrationPatch(): string {
  const allMissing = getAllKnownUnsupportedColumns();
  const tables = Object.keys(allMissing);
  
  const knownTables = ['students', 'questions', 'dimensions', 'teachers', 'school_majors', 'licenses', 'chat_messages', 'test_results'];
  const allTablesToEnsure = Array.from(new Set([...tables, ...knownTables]));

  const lines: string[] = [
    '-- ==========================================================',
    '-- SKRIP PATCH MIGRASI PERBEDAAN SKEMA SUPABASE & RLS',
    '-- Salin & eksekusi skrip ini di SQL Editor Supabase Anda',
    '-- ==========================================================\n'
  ];

  const typeMap: Record<string, string> = {
    cheat_warnings: 'INT DEFAULT 0',
    time_spent_seconds: 'INT DEFAULT 0',
    is_b2b: 'BOOLEAN DEFAULT false',
    personal_quota: 'INT DEFAULT 0',
    choices: 'JSONB DEFAULT \'[]\'::jsonb',
    answers: 'JSONB DEFAULT \'{}\'::jsonb',
    riasec_scores: 'JSONB DEFAULT \'{}\'::jsonb',
    iq_score: 'INT',
    test_type: 'TEXT',
    managed_class: 'TEXT',
    image_url: 'TEXT',
    role: 'TEXT',
    password: 'TEXT',
    class_id: 'TEXT',
    school_id: 'TEXT',
    riasec_type: 'TEXT',
    description: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()'
  };

  if (tables.length > 0) {
    lines.push('-- 1. PENAMBAHAN KOLOM YANG BELUM TERSEDIA:');
    tables.forEach(table => {
      const cols = allMissing[table];
      cols.forEach(col => {
        const colType = typeMap[col.toLowerCase()] || 'TEXT';
        lines.push(`ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${col} ${colType};`);
      });
    });
    lines.push('');
  } else {
    lines.push('-- 1. DDL SKEMA KOLOM: Semua kolom lokal terverifikasi sinkron.\n');
  }

  lines.push('-- 2. KEBIJAKAN AKSES DIBUKA (RLS POLICIES FOR ANON WRITES):');
  allTablesToEnsure.forEach(table => {
    lines.push(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    lines.push(`DROP POLICY IF EXISTS "Allow anon full access on ${table}" ON public.${table};`);
    lines.push(`CREATE POLICY "Allow anon full access on ${table}" ON public.${table} FOR ALL USING (true) WITH CHECK (true);`);
  });

  lines.push('\n-- 3. PAKSA RELOAD CACHE SKEMA POSTGREST SUPABASE:');
  lines.push(`NOTIFY pgrst, 'reload schema';`);

  return lines.join('\n');
}

/**
 * Perform a highly resilient upsert operation on Supabase.
 * If the database complains about missing columns in the schema cache or relation,
 * the function dynamically strips those columns from the payload, caches the missing columns
 * for future requests, and retries cleanly.
 */
export async function resilientUpsert(
  client: SupabaseClient,
  table: string,
  rows: any | any[],
  options?: any
): Promise<{ success: boolean; error?: any }> {
  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    return { success: true };
  }

  const isArray = Array.isArray(rows);
  let attemptRows = isArray ? rows.map((r: any) => ({ ...r })) : [{ ...rows }];

  if (attemptRows.length === 0) {
    return { success: true };
  }

  // Pre-strip columns that were already detected as missing for this table in this session
  const cachedMissingCols = knownUnsupportedColumns.get(table);
  if (cachedMissingCols && cachedMissingCols.size > 0) {
    for (const row of attemptRows) {
      for (const col of cachedMissingCols) {
        delete row[col];
        for (const k of Object.keys(row)) {
          if (k.toLowerCase() === col.toLowerCase()) {
            delete row[k];
          }
        }
      }
    }
  }

  // Deduplicate array rows by conflict target columns or 'id' to prevent Postgres 21000 error
  // ("ON CONFLICT DO UPDATE command cannot affect row a second time")
  if (isArray && attemptRows.length > 1) {
    const conflictCols = typeof options?.onConflict === 'string'
      ? options.onConflict.split(',').map((c: string) => c.trim())
      : ['id'];
    
    const uniqueMap = new Map<string, any>();
    for (const row of attemptRows) {
      const key = conflictCols.map(col => String(row[col] ?? '')).join(':::');
      if (key && key !== ':::') {
        uniqueMap.set(key, row);
      } else {
        uniqueMap.set(JSON.stringify(row), row);
      }
    }
    attemptRows = Array.from(uniqueMap.values());
  }

  const maxAttempts = 30;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const payload = isArray ? attemptRows : attemptRows[0];
    const { error } = await client.from(table).upsert(payload, options);
    
    if (!error) {
      return { success: true };
    }

    const errMsg = error.message || error.details || '';
    
    let missingColumn: string | null = null;

    const regexes = [
      /Could not find the '([^']+)' column/i,
      /Could not find the ([a-zA-Z0-9_-]+) column/i,
      /Could not find column '([^']+)'/i,
      /Could not find column "([^"]+)"/i,
      /Could not find column ([a-zA-Z0-9_-]+)/i,
      /column "([^"]+)" of relation "[^"]+" does not exist/i,
      /column "([^"]+)" does not exist/i,
      /column '([^']+)' does not exist/i,
      /column ([a-zA-Z0-9_-]+) does not exist/i,
      /has no column "([^"]+)"/i,
      /has no column '([^']+)'/i,
      /has no column ([a-zA-Z0-9_-]+)/i
    ];

    for (const rx of regexes) {
      const match = errMsg.match(rx);
      if (match && match[1]) {
        const col = match[1].trim();
        if (col && col !== 'relation' && col !== 'table' && col !== 'column' && col !== 'schema') {
          missingColumn = col;
          break;
        }
      }
    }

    if (missingColumn) {
      if (!knownUnsupportedColumns.has(table)) {
        knownUnsupportedColumns.set(table, new Set());
      }
      knownUnsupportedColumns.get(table)!.add(missingColumn);

      recentSyncErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        table,
        code: error.code,
        message: error.message || error.details || 'Missing column error',
        missingColumn
      });

      console.warn(`[Resilient Upsert] Table '${table}' missing column '${missingColumn}' (Code: ${error.code || 'N/A'}). Cached and stripping...`);
      for (const row of attemptRows) {
        delete row[missingColumn];
        // Also do case-insensitive delete in case postgres lowercased the column name in the error message
        const keys = Object.keys(row);
        for (const k of keys) {
          if (k.toLowerCase() === missingColumn.toLowerCase()) {
            delete row[k];
          }
        }
      }
      continue;
    }

    // Log other errors and return them
    const errMsgLower = errMsg.toLowerCase();
    const syncErrObj: SupabaseSyncError = {
      timestamp: new Date().toLocaleTimeString(),
      table,
      code: error.code,
      message: error.message || error.details || 'Supabase write restricted'
    };
    recentSyncErrors.push(syncErrObj);

    if (error.code === '42P01' || errMsgLower.includes('does not exist') || errMsgLower.includes('relation "')) {
      console.warn(`[Resilient Upsert Notice] Table '${table}' does not exist in the database (Code: ${error.code}). Please execute the SQL script in 'sql-rls.sql' in your Supabase SQL Editor.`);
      return { success: false, error };
    }

    if (error.code === '42501' || errMsgLower.includes('row-level security') || errMsgLower.includes('permission denied')) {
      console.warn(`[Resilient Upsert Notice] Table '${table}' client-side direct write restricted by RLS (Code: ${error.code}).`);
      return { success: false, error };
    }

    const errDetail = error.message || error.details || error.code || 'Unknown error';
    console.warn(`[Resilient Upsert Notice] Table '${table}' upsert notice: ${errDetail}`);
    return { success: false, error };
  }

  return { success: false, error: new Error(`Failed to upsert to '${table}' after recursively stripping missing columns.`) };
}

export async function runSupabaseDiagnosticProbe(client: SupabaseClient): Promise<{
  unsupportedCols: Record<string, string[]>;
  errors: SupabaseSyncError[];
}> {
  clearKnownUnsupportedColumns();
  
  const tablesToProbe = ['students', 'questions', 'dimensions', 'teachers', 'school_majors', 'licenses'];
  
  for (const t of tablesToProbe) {
    try {
      const { error } = await client.from(t).select('id').limit(1);
      if (error) {
        recentSyncErrors.push({
          timestamp: new Date().toLocaleTimeString(),
          table: t,
          code: error.code,
          message: error.message || error.details || 'Select query failed'
        });
      }
    } catch (e: any) {
      recentSyncErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        table: t,
        message: e?.message || String(e)
      });
    }
  }

  return {
    unsupportedCols: getAllKnownUnsupportedColumns(),
    errors: getRecentSyncErrors()
  };
}

