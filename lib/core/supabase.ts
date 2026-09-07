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

export function getKnownUnsupportedColumns(table: string): string[] {
  return Array.from(knownUnsupportedColumns.get(table) || []);
}

export function clearKnownUnsupportedColumns() {
  knownUnsupportedColumns.clear();
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

      console.warn(`[Resilient Upsert] Table '${table}' missing column '${missingColumn}'. Cached and stripping...`);
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
    if (error.code === '42P01' || errMsgLower.includes('does not exist') || errMsgLower.includes('relation "')) {
      console.warn(`[Resilient Upsert Notice] Table '${table}' does not exist in the database. Please execute the SQL script in 'sql-rls.sql' in your Supabase SQL Editor to initialize or update your database schema.`);
      return { success: false, error };
    }

    if (error.code === '42501' || errMsgLower.includes('row-level security') || errMsgLower.includes('permission denied')) {
      console.warn(`[Resilient Upsert Notice] Table '${table}' client-side direct write restricted by RLS (server API background queue sync is active).`);
      return { success: false, error };
    }

    const errDetail = error.message || error.details || error.code || 'Unknown error';
    console.warn(`[Resilient Upsert Notice] Table '${table}' upsert notice: ${errDetail}`);
    return { success: false, error };
  }

  return { success: false, error: new Error(`Failed to upsert to '${table}' after recursively stripping missing columns.`) };
}

