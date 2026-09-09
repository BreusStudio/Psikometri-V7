import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError, parseRequestBody } from '@/lib/api';
import { Student } from '@/lib/types';
import { supabase, isSupabaseConfigured, initSupabaseClient, resilientUpsert } from '@/lib/supabase';
import { getServerConfig } from '@/lib/serverConfig';
import { mapDatabaseRowToStudent } from '@/lib/store/dbMappers';
import { mapStudentToDbRow } from '@/lib/store/supabaseSync';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function getActiveSupabaseClient() {
  if (supabase && isSupabaseConfigured) return supabase;
  const config = getServerConfig();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    initSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
    return supabase;
  }
  return null;
}

/**
 * GET /api/students/[id] - Find Student by ID in Supabase
 */
export const GET = withApiHandler(async (_req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;
  const client = getActiveSupabaseClient();

  if (client) {
    const { data, error } = await client.from('students').select('*').eq('id', studentId).maybeSingle();
    if (!error && data) {
      return apiResponse.success(mapDatabaseRowToStudent(data));
    }
  }

  throw ApiError.notFound(`Siswa dengan NIS/NIM "${studentId}" tidak ditemukan.`);
});

/**
 * PUT /api/students/[id] - Update Student Details or Answers in Supabase
 */
export const PUT = withApiHandler(async (req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;
  const body = await parseRequestBody<Partial<Student>>(req);
  const client = getActiveSupabaseClient();

  let existingStudent: Student | null = null;

  if (client) {
    const { data } = await client.from('students').select('*').eq('id', studentId).maybeSingle();
    if (data) {
      existingStudent = mapDatabaseRowToStudent(data);
    }
  }

  const updatedStudent: Student = {
    ...(existingStudent || {
      id: studentId,
      name: body.name || 'Peserta',
      classGroup: body.classGroup || 'Umum',
      angkatan: body.angkatan || new Date().getFullYear(),
      password: body.password || '123456'
    }),
    ...body,
    id: studentId, // preserve ID
  };

  if (client) {
    const dbRow = mapStudentToDbRow(updatedStudent);
    await resilientUpsert(client, 'students', dbRow);
  }

  return apiResponse.success(updatedStudent, 'Data siswa berhasil diperbarui.');
});

/**
 * DELETE /api/students/[id] - Delete Student Record from Supabase
 */
export const DELETE = withApiHandler(async (_req: NextRequest, context?: RouteContext) => {
  const params = context?.params ? await context.params : { id: '' };
  const studentId = params.id;
  const client = getActiveSupabaseClient();

  if (client) {
    await client.from('students').delete().eq('id', studentId);
  }

  return apiResponse.success({ id: studentId, deleted: true }, `Siswa dengan NIS/NIM "${studentId}" berhasil dihapus.`);
});
