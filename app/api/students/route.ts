import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError, parsePaginationParams, parseRequestBody } from '@/lib/api';
import { supabase, isSupabaseConfigured, initSupabaseClient, resilientUpsert } from '@/lib/supabase';
import { getServerConfig } from '@/lib/serverConfig';
import { Student } from '@/lib/types';
import { mapDatabaseRowToStudent } from '@/lib/store/dbMappers';
import { mapStudentToDbRow } from '@/lib/store/supabaseSync';

export const dynamic = 'force-dynamic';

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
 * GET /api/students - Real Paginated & Database-Sorted List of Students
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const { page, limit, search, sortBy, order } = parsePaginationParams(req);
  const client = getActiveSupabaseClient();

  if (!client) {
    return apiResponse.paginate([], page, limit, 0);
  }

  try {
    let query = client.from('students').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%,class_group.ilike.%${search}%`);
    }

    const sortColumn = sortBy === 'name' ? 'name' : sortBy === 'id' ? 'id' : 'name';
    const isAscending = order !== 'desc';
    query = query.order(sortColumn, { ascending: isAscending });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1;
    query = query.range(startIndex, endIndex);

    const { data, error, count } = await query;

    if (error) {
      console.warn('[Students API] Database query error:', error);
      return apiResponse.paginate([], page, limit, 0);
    }

    const items: Student[] = Array.isArray(data) ? data.map(mapDatabaseRowToStudent) : [];
    const total = typeof count === 'number' ? count : items.length;

    return apiResponse.paginate(items, page, limit, total);
  } catch (err) {
    console.warn('[Students API] Database query caught:', err);
    return apiResponse.paginate([], page, limit, 0);
  }
});

/**
 * POST /api/students - Create or Bulk Create New Student Record(s) in Supabase
 */
export const POST = withApiHandler(
  async (req: NextRequest) => {
    const client = getActiveSupabaseClient();
    const body = await parseRequestBody<any>(req);

    const inputItems: Partial<Student>[] = Array.isArray(body) ? body : [body];

    if (inputItems.length === 0) {
      throw ApiError.badRequest("Request body siswa kosong.");
    }

    const createdStudents: Student[] = [];

    for (const item of inputItems) {
      if (!item.id || !item.name) continue;

      const newStudent: Student = {
        id: String(item.id).trim(),
        name: String(item.name).trim(),
        classGroup: item.classGroup || item.class_name || 'X-1',
        angkatan: item.angkatan || item.cohort || new Date().getFullYear(),
        class_name: item.class_name || item.classGroup || 'X-1',
        major: item.major || 'Umum',
        cohort: item.cohort || item.angkatan || new Date().getFullYear(),
        gender: item.gender || 'L',
        status: item.status || 'BELUM_TES',
        password: item.password || '123456',
        testType: item.testType || 'Pilihan Karir',
        school_origin: item.school_origin || item.schoolOrigin || '',
        email: item.email || '',
        answers: item.answers || {},
        scores: item.scores || {},
        completedAt: item.completedAt || null,
        examStartedAt: item.examStartedAt || null,
        examDurationSeconds: item.examDurationSeconds || 0,
        violatingCount: item.violatingCount || 0,
        cheatLogs: item.cheatLogs || [],
        iqScore: item.iqScore ?? null,
        eqScore: item.eqScore ?? null,
        riasecScores: item.riasecScores ?? null,
        dimensionScores: item.dimensionScores ?? null,
        lockedOut: item.lockedOut ?? false,
        lockReason: item.lockReason ?? null,
        testStarted: item.testStarted ?? false,
        testCompleted: item.testCompleted ?? false,
        testStartedAt: item.testStartedAt ?? null,
        testCompletedAt: item.testCompletedAt ?? null,
        currentQuestionIndex: item.currentQuestionIndex ?? 0,
        cheatWarnings: item.cheatWarnings ?? 0,
        aiAnalysis: item.aiAnalysis ?? null,
        completedTests: item.completedTests || [],
      };

      createdStudents.push(newStudent);
    }

    if (client && createdStudents.length > 0) {
      try {
        const rows = createdStudents.map(mapStudentToDbRow);
        const { error } = await resilientUpsert(client, 'students', rows);
        if (error) {
          console.warn('[Students API] Supabase resilient upsert error:', error.message);
        }
      } catch (err) {
        console.warn('[Students API] Supabase batch insert exception:', err);
      }
    }

    return apiResponse.created(
      createdStudents.length === 1 ? createdStudents[0] : createdStudents,
      `Berhasil menyimpan ${createdStudents.length} data siswa.`
    );
  },
  {
    validateBody: (body: any) => {
      if (!body || (typeof body !== 'object' && !Array.isArray(body))) {
        return { valid: false, error: 'Request body tidak valid.' };
      }
      return { valid: true };
    },
  }
);

