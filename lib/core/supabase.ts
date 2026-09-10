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
  
  // Real active master tables in our system architecture
  const knownTables = [
    'students',
    'teachers',
    'questions',
    'dimensions',
    'school_majors',
    'test_settings',
    'registered_classes',
    'registered_cohorts',
    'vouchers',
    'purchases',
    'packages',
    'referrals',
    'commissions',
    'registration_requests',
    'student_answers'
  ];

  const lines: string[] = [
    '-- ==============================================================================',
    '-- SKRIP PATCH MIGRASI PERBEDAAN SKEMA SUPABASE & KEBIJAKAN RLS',
    '-- Salin & eksekusi skrip ini di SQL Editor Supabase Anda.',
    '-- ==============================================================================\n'
  ];

  // 0. Auto Migration RPC Helper
  lines.push('-- 0. MEMASTIKAN FUNGSI AUTO-MIGRASI AKTIF UNTUK UPDATE OTOMATIS DARI APLIKASI:');
  lines.push('CREATE OR REPLACE FUNCTION public.execute_auto_migration(migration_sql text)');
  lines.push('RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$');
  lines.push('BEGIN EXECUTE migration_sql; END; $$;');
  lines.push('GRANT EXECUTE ON FUNCTION public.execute_auto_migration(text) TO anon, authenticated, service_role;\n');

  // 1. Ensure tables exist first (safe DDL) with proper primary key
  lines.push('-- 1. MEMASTIKAN TABEL UTAMA SUDAH DIBUAT (SAFE DDL):');
  knownTables.forEach(table => {
    if (table === 'vouchers' || table === 'referrals') {
      lines.push(`CREATE TABLE IF NOT EXISTS public.${table} (code TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());`);
      lines.push(`ALTER TABLE IF EXISTS public.${table} ADD COLUMN IF NOT EXISTS id TEXT;`);
    } else if (table === 'student_answers') {
      lines.push(`CREATE TABLE IF NOT EXISTS public.${table} (student_id TEXT, question_id TEXT, choice_id INTEGER, PRIMARY KEY(student_id, question_id));`);
    } else {
      lines.push(`CREATE TABLE IF NOT EXISTS public.${table} (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW());`);
    }
  });
  lines.push('');

  const typeMap: Record<string, string> = {
    cheat_warnings: 'NUMERIC DEFAULT 0',
    time_spent_seconds: 'NUMERIC DEFAULT 0',
    exam_duration_seconds: 'NUMERIC DEFAULT 0',
    exam_started_at: 'TEXT',
    validity_status: 'TEXT DEFAULT \'VALID\'',
    validation_status: 'TEXT DEFAULT \'VALID\'',
    validity_score: 'NUMERIC DEFAULT 95',
    validity_flags: 'JSONB DEFAULT \'[]\'::jsonb',
    validity_reasoning: 'TEXT',
    validation_recommendation: 'TEXT',
    completed_tests: 'JSONB DEFAULT \'[]\'::jsonb',
    allow_test_types: 'JSONB DEFAULT \'[]\'::jsonb',
    cheating_logs: 'JSONB DEFAULT \'[]\'::jsonb',
    test_order: 'JSONB DEFAULT \'[]\'::jsonb',
    randomized_questions: 'JSONB DEFAULT \'[]\'::jsonb',
    school_origin: 'TEXT',
    is_b2b: 'BOOLEAN DEFAULT false',
    personal_quota: 'INT DEFAULT 0',
    choices: 'JSONB DEFAULT \'[]\'::jsonb',
    answers: 'JSONB DEFAULT \'{}\'::jsonb',
    rubric: 'TEXT',
    option_scores: 'JSONB',
    is_validated: 'BOOLEAN DEFAULT false',
    verification_status: 'TEXT DEFAULT \'DRAFT\'',
    weight: 'NUMERIC DEFAULT 1',
    riasec_scores: 'JSONB DEFAULT \'{}\'::jsonb',
    iq_score: 'NUMERIC',
    test_type: 'TEXT',
    managed_class: 'TEXT',
    image_url: 'TEXT',
    explanation: 'TEXT',
    is_active: 'BOOLEAN DEFAULT true',
    deleted_at: 'TEXT',
    role: 'TEXT',
    password: 'TEXT',
    class_id: 'TEXT',
    school_id: 'TEXT',
    riasec_type: 'TEXT',
    description: 'TEXT',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()'
  };

  if (tables.length > 0) {
    lines.push('-- 2. PENAMBAHAN KOLOM YANG BELUM TERSEDIA:');
    tables.forEach(table => {
      const cols = allMissing[table];
      cols.forEach(col => {
        const colType = typeMap[col.toLowerCase()] || 'TEXT';
        lines.push(`ALTER TABLE IF EXISTS public.${table} ADD COLUMN IF NOT EXISTS "${col}" ${colType};`);
      });
    });
    lines.push('');
  } else {
    lines.push('-- 2. DDL SKEMA KOLOM: Semua kolom lokal terverifikasi sinkron.\n');
  }

  lines.push('-- 3. KEBIJAKAN AKSES DIBUKA (RLS POLICIES FOR ANON & AUTHENTICATED WRITES):');
  knownTables.forEach(table => {
    lines.push(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY;`);
    lines.push(`DROP POLICY IF EXISTS "Allow anon full access on ${table}" ON public.${table};`);
    lines.push(`CREATE POLICY "Allow anon full access on ${table}" ON public.${table} FOR ALL USING (true) WITH CHECK (true);`);
  });

  lines.push('\n-- 4. INDEKS B-TREE OPTIMASI PERFORMA & DUKUNGAN SUPABASE FREE TIER:');
  lines.push('CREATE INDEX IF NOT EXISTS idx_students_school_origin ON public.students (school_origin);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (email);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_students_invoice ON public.students (invoice_number);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_students_cbt_status ON public.students (test_started, test_completed, locked_out);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registration_requests (status);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_registrations_email ON public.registration_requests (admin_email);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_student_answers_student ON public.student_answers (student_id);');
  lines.push('CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions (category, is_active);');

  lines.push('\n-- 5. REALTIME REPLICATION (MULTI-DEVICE INSTANT SYNC):');
  lines.push('ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.questions, public.students, public.test_settings, public.teachers, public.registered_classes;');

  lines.push('\n-- 6. PAKSA RELOAD CACHE SKEMA POSTGREST SUPABASE:');
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
  
  const tablesToProbe = [
    'students',
    'teachers',
    'questions',
    'dimensions',
    'school_majors',
    'test_settings',
    'registered_classes',
    'registered_cohorts',
    'vouchers',
    'purchases',
    'packages',
    'referrals',
    'commissions',
    'registration_requests',
    'student_answers'
  ];
  
  for (const tableName of tablesToProbe) {
    try {
      // Using count exact with head true probes existence safely without relying on any specific column name
      const { error } = await client.from(tableName).select('*', { count: 'exact', head: true });
      if (error) {
        recentSyncErrors.push({
          timestamp: new Date().toLocaleTimeString(),
          table: tableName,
          code: error.code,
          message: error.message || error.details || 'Select query failed'
        });
      } else {
        // Deep probe modern columns for drift detection
        if (tableName === 'students') {
          const modernCols = ['allow_test_types', 'school_origin', 'cheat_warnings', 'validity_status', 'time_spent_seconds'];
          const { error: cErr } = await client.from('students').select(modernCols.join(',')).limit(1);
          if (cErr) {
            for (const col of modernCols) {
              if (cErr.message?.includes(col) || cErr.details?.includes(col) || cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find')) {
                if (!knownUnsupportedColumns.has('students')) {
                  knownUnsupportedColumns.set('students', new Set());
                }
                knownUnsupportedColumns.get('students')!.add(col);
              }
            }
          }
        } else if (tableName === 'test_settings') {
          const modernCols = ['iq_active', 'iq_duration', 'randomize_questions'];
          const { error: cErr } = await client.from('test_settings').select(modernCols.join(',')).limit(1);
          if (cErr) {
            for (const col of modernCols) {
              if (cErr.message?.includes(col) || cErr.details?.includes(col) || cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find')) {
                if (!knownUnsupportedColumns.has('test_settings')) {
                  knownUnsupportedColumns.set('test_settings', new Set());
                }
                knownUnsupportedColumns.get('test_settings')!.add(col);
              }
            }
          }
        } else if (tableName === 'packages') {
          const modernCols = ['logo_url', 'header_title', 'price_per_account'];
          const { error: cErr } = await client.from('packages').select(modernCols.join(',')).limit(1);
          if (cErr) {
            for (const col of modernCols) {
              if (cErr.message?.includes(col) || cErr.details?.includes(col) || cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find')) {
                if (!knownUnsupportedColumns.has('packages')) {
                  knownUnsupportedColumns.set('packages', new Set());
                }
                knownUnsupportedColumns.get('packages')!.add(col);
              }
            }
          }
        }
      }
    } catch (e: any) {
      recentSyncErrors.push({
        timestamp: new Date().toLocaleTimeString(),
        table: tableName,
        message: e?.message || String(e)
      });
    }
  }

  return {
    unsupportedCols: getAllKnownUnsupportedColumns(),
    errors: getRecentSyncErrors()
  };
}

