import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const tableMappings: Record<string, string> = {
  Student: 'students',
  Teacher: 'teachers',
  Question: 'questions',
  Dimension: 'dimensions',
  SchoolMajor: 'school_majors',
  TestType: 'test_types',
  TestSettings: 'test_settings',
  RegisteredClass: 'registered_classes',
  RegisteredCohort: 'registered_cohorts',
  Voucher: 'vouchers',
  Purchase: 'purchases',
  ReferralCode: 'referrals',
  Commission: 'commissions',
  Package: 'packages'
};

const getPgType = (tsType: string) => {
  if (tsType.includes('[]')) return 'JSONB';
  if (tsType.startsWith('Record') || tsType.startsWith('{')) return 'JSONB';
  if (tsType === 'boolean') return 'BOOLEAN';
  if (tsType.includes('number')) return 'NUMERIC';
  if (tsType.includes('any')) return 'JSONB';
  return 'TEXT';
};

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

function parseInterface(content: string, interfaceName: string) {
  const lines = content.split('\n');
  let inInterface = false;
  let braceCount = 0;
  let bodyLines = [];

  for (const line of lines) {
    if (!inInterface && line.trim().startsWith(`export interface ${interfaceName}`)) {
      inInterface = true;
      if (line.includes('{')) braceCount++;
      continue;
    }

    if (inInterface) {
      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;
      
      if (braceCount === 0) {
        break; 
      }
      bodyLines.push(line);
    }
  }

  return bodyLines;
}

export async function POST(req: Request) {
  try {
    const { missingTables } = await req.json();
    
    if (!missingTables || missingTables.length === 0) {
      return NextResponse.json({ success: true, sql: '-- No missing tables to generate.' });
    }

    const filePath = path.join(process.cwd(), 'lib', 'types.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let sqlScript = `-- ==========================================\n`;
    sqlScript += `-- AUTO-GENERATED SQL MIGRATION\n`;
    sqlScript += `-- Based on local TypeScript interfaces in lib/types.ts\n`;
    sqlScript += `-- ==========================================\n\n`;
    
    for (const [interfaceName, tableName] of Object.entries(tableMappings)) {
      if (!missingTables.includes(tableName)) continue;
      
      const bodyLines = parseInterface(content, interfaceName);
      if (bodyLines.length === 0) continue;
      
      let columns = [];
      let hasId = false;
      let inNested = false;
      
      for (let line of bodyLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;
        
        // Skip properties inside nested objects (e.g., choices: { ... })
        if (trimmed.includes('{')) {
          inNested = true;
          // Process the root property name before jumping into nested
          const propNameMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\?)?:/);
          if (propNameMatch) {
             const columnName = toSnakeCase(propNameMatch[1]);
             columns.push(`"${columnName}" JSONB`);
          }
          continue;
        }
        if (inNested && trimmed.includes('}')) {
          inNested = false;
          continue;
        }
        if (inNested) continue;

        // Parse standard properties: propertyName?: type;
        const propMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\?)?:\s*([^;]+)/);
        if (propMatch) {
          const propName = propMatch[1];
          const typeStr = propMatch[3].split('//')[0].trim();
          
          const columnName = toSnakeCase(propName);
          const pgType = getPgType(typeStr);
          
          let columnDef = `"${columnName}" ${pgType}`;
          
          if (propName === 'id' || propName === 'code') {
            columnDef += ' PRIMARY KEY';
            hasId = true;
          }
          
          columns.push(columnDef);
        }
      }
      
      // Ensure specific tables have primary keys if not explicitly defined
      if (!hasId && tableName === 'test_settings') {
        columns.unshift(`"id" TEXT PRIMARY KEY DEFAULT 'global'`);
      } else if (!hasId) {
        columns.unshift(`"id" UUID PRIMARY KEY DEFAULT uuid_generate_v4()`);
      }
      
      sqlScript += `CREATE TABLE IF NOT EXISTS public.${tableName} (\n  ${columns.join(',\n  ')}\n);\n\n`;
      sqlScript += `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;\n`;
      sqlScript += `DROP POLICY IF EXISTS "Enable read access for all users on ${tableName}" ON public.${tableName};\n`;
      sqlScript += `CREATE POLICY "Enable read access for all users on ${tableName}" ON public.${tableName} FOR SELECT USING (true);\n`;
      sqlScript += `DROP POLICY IF EXISTS "Enable insert access for all users on ${tableName}" ON public.${tableName};\n`;
      sqlScript += `CREATE POLICY "Enable insert access for all users on ${tableName}" ON public.${tableName} FOR INSERT WITH CHECK (true);\n`;
      sqlScript += `DROP POLICY IF EXISTS "Enable update access for all users on ${tableName}" ON public.${tableName};\n`;
      sqlScript += `CREATE POLICY "Enable update access for all users on ${tableName}" ON public.${tableName} FOR UPDATE USING (true);\n`;
      sqlScript += `DROP POLICY IF EXISTS "Enable delete access for all users on ${tableName}" ON public.${tableName};\n`;
      sqlScript += `CREATE POLICY "Enable delete access for all users on ${tableName}" ON public.${tableName} FOR DELETE USING (true);\n\n`;
    }

    // Add explicit schema patch helper queries for existing databases at the end
    sqlScript += `-- ==========================================\n`;
    sqlScript += `-- COMPATIBILITY & UPGRADE PATCHES\n`;
    sqlScript += `-- Run this to update existing tables if they already exist:\n`;
    sqlScript += `-- ==========================================\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.teachers ADD COLUMN IF NOT EXISTS "managed_class" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "completed_tests" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "allow_test_types" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "school_origin" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "cheat_warnings" NUMERIC DEFAULT 0;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "cheating_logs" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "test_order" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS "randomized_questions" JSONB DEFAULT '[]'::jsonb;\n\n`;

    sqlScript += `-- Upgrades for test_settings\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "iq_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "eq_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "holland_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "kepribadian_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "validitas_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "auto_ai_analysis" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "iq_limit" NUMERIC DEFAULT 12;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "eq_limit" NUMERIC DEFAULT 12;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "holland_limit" NUMERIC DEFAULT 12;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "kepribadian_limit" NUMERIC DEFAULT 12;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "validitas_limit" NUMERIC DEFAULT 12;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "randomize_questions" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "randomize_choices" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "iq_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "eq_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "holland_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "kepribadian_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "validitas_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "minat_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "bakat_duration" NUMERIC DEFAULT 15;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "test_types" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "registered_classes" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "registered_cohorts" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.test_settings ADD COLUMN IF NOT EXISTS "quota_added" NUMERIC DEFAULT 0;\n\n`;

    sqlScript += `-- Upgrades for packages\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "logo_url" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "header_title" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "features" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "allowed_subtests" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "price_per_account" NUMERIC DEFAULT 0;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'sekolah';\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.packages ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;\n\n`;

    sqlScript += `-- Upgrades for vouchers\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'available';\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "distribution_type" TEXT DEFAULT 'individual';\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "allowed_test_types" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "school_target" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "created_students" JSONB DEFAULT '[]'::jsonb;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.vouchers ADD COLUMN IF NOT EXISTS "created_at" TEXT;\n\n`;

    sqlScript += `-- Upgrades for questions\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS "image_url" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS "explanation" TEXT;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;\n`;
    sqlScript += `ALTER TABLE IF EXISTS public.questions ADD COLUMN IF NOT EXISTS "deleted_at" TEXT;\n\n`;
    
    sqlScript += `-- ==========================================\n`;
    sqlScript += `-- STORAGE BUCKETS & POLICIES\n`;
    sqlScript += `-- Ensure public access to upload question images:\n`;
    sqlScript += `-- ==========================================\n`;
    sqlScript += `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)\n`;
    sqlScript += `VALUES ('psychometric-assets', 'psychometric-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])\n`;
    sqlScript += `ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];\n\n`;
    sqlScript += `-- Enable RLS on storage.objects if not already enabled (commented out to avoid 'must be owner' permission error)\n`;
    sqlScript += `-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;\n\n`;
    sqlScript += `-- Allow SELECT for public access\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Access" ON storage.objects;\n`;
    sqlScript += `CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'psychometric-assets');\n\n`;
    sqlScript += `-- Allow INSERT for public access\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Insert" ON storage.objects;\n`;
    sqlScript += `CREATE POLICY "Public Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'psychometric-assets');\n\n`;
    sqlScript += `-- Allow UPDATE for public access\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Update" ON storage.objects;\n`;
    sqlScript += `CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'psychometric-assets') WITH CHECK (bucket_id = 'psychometric-assets');\n\n`;
    sqlScript += `-- Allow DELETE for public access\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Delete" ON storage.objects;\n`;
    sqlScript += `CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'psychometric-assets');\n\n`;
    sqlScript += `-- Comprehensive ALL Operations fallback policy for maximum security compatibility\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Storage All Access" ON storage.objects;\n`;
    sqlScript += `CREATE POLICY "Public Storage All Access" ON storage.objects FOR ALL TO public USING (bucket_id = 'psychometric-assets') WITH CHECK (bucket_id = 'psychometric-assets');\n\n`;
    sqlScript += `-- Allow SELECT on public buckets\n`;
    sqlScript += `DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;\n`;
    sqlScript += `CREATE POLICY "Public Bucket Access" ON storage.buckets FOR SELECT TO public USING (public = true);\n\n`;

    return NextResponse.json({ success: true, sql: sqlScript });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
