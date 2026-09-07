import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError, parsePaginationParams, parseRequestBody } from '@/lib/api';
import { supabase, isSupabaseConfigured, initSupabaseClient, resilientUpsert } from '@/lib/supabase';
import { getServerConfig } from '@/lib/serverConfig';
import { INITIAL_STUDENTS } from '@/lib/presetQuestions';
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
 * GET /api/students - Paginated List & Search of Students from DB or Fallback
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const { page, limit, search, sortBy, order } = parsePaginationParams(req);
  const client = getActiveSupabaseClient();

  let results: Student[] = [];

  if (client) {
    try {
      let query = client.from('students').select('*');
      if (search) {
        query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%,class_group.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        results = data.map(mapDatabaseRowToStudent);
      }
    } catch (err) {
      console.warn('[Students API] Database query caught:', err);
    }
  }

  if (results.length === 0) {
    results = [...INITIAL_STUDENTS];
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.classGroup && s.classGroup.toLowerCase().includes(q))
      );
    }
  }

  if (sortBy === 'name') {
    results.sort((a, b) => (order === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
  } else if (sortBy === 'id') {
    results.sort((a, b) => (order === 'desc' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)));
  }

  const total = results.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = results.slice(startIndex, startIndex + limit);

  return apiResponse.paginate(paginatedItems, page, limit, total);
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

