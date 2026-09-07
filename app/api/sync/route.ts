import { NextRequest } from 'next/server';
import { withApiHandler, apiResponse, ApiError, parseRequestBody } from '@/lib/api';
import { supabase, isSupabaseConfigured, initSupabaseClient, resilientUpsert } from '@/lib/supabase';
import { getServerConfig } from '@/lib/serverConfig';

export const dynamic = 'force-dynamic';

export interface SyncPayload {
  studentId?: string;
  type?: 'student_answer' | 'student_complete' | 'student_upsert' | 'student_delete' | 'full_students_sync' | 'questions_sync' | 'teachers_sync' | 'settings_update' | 'full_sync';
  data?: any;
  timestamp?: string;
}

export interface BatchSyncBody {
  items?: SyncPayload[];
  studentId?: string;
  type?: string;
  data?: any;
}

/**
 * RESTful Background Batch Sync Endpoint
 * Accepts batched array payloads or single background sync payloads from clients.
 * Executes server-authoritative Supabase upserts using server credentials.
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  // Ensure server-side Supabase client is initialized from config.json or env
  let activeClient = supabase;
  if (!activeClient || !isSupabaseConfigured) {
    const config = getServerConfig();
    if (config.supabaseUrl && config.supabaseAnonKey) {
      initSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
      activeClient = supabase;
    }
  }

  const body = await parseRequestBody<BatchSyncBody & SyncPayload>(req);

  // Normalize single item vs batched items
  const items: SyncPayload[] = Array.isArray(body?.items)
    ? body.items
    : body?.type
    ? [body]
    : [];

  if (items.length === 0) {
    throw ApiError.badRequest("Payload sinkronisasi tidak valid. Minimal 1 item sinkronisasi diperlukan.");
  }

  let processedCount = 0;

  // Group items by type for bulk DB operations
  const answersToPersist: { student_id: string; question_id: string; choice_id: number; updated_at: string }[] = [];
  const studentsToUpsert: any[] = [];
  const studentsToDelete: string[] = [];
  const questionsToUpsert: any[] = [];
  const teachersToUpsert: any[] = [];

  for (const item of items) {
    const { type, studentId, data, timestamp } = item;

    if (type === 'student_answer' && studentId && data?.questionId && data?.choiceId !== undefined) {
      answersToPersist.push({
        student_id: studentId,
        question_id: data.questionId,
        choice_id: Number(data.choiceId),
        updated_at: timestamp || new Date().toISOString(),
      });
      processedCount++;
    } else if (type === 'student_upsert' && data) {
      if (Array.isArray(data)) {
        studentsToUpsert.push(...data);
      } else {
        studentsToUpsert.push(data);
      }
      processedCount++;
    } else if (type === 'full_students_sync' && Array.isArray(data)) {
      studentsToUpsert.push(...data);
      processedCount += data.length;
    } else if (type === 'student_delete' && (studentId || data?.id)) {
      studentsToDelete.push(studentId || data?.id);
      processedCount++;
    } else if (type === 'questions_sync' && data) {
      if (Array.isArray(data)) questionsToUpsert.push(...data);
      else questionsToUpsert.push(data);
      processedCount++;
    } else if (type === 'teachers_sync' && data) {
      if (Array.isArray(data)) teachersToUpsert.push(...data);
      else teachersToUpsert.push(data);
      processedCount++;
    } else if (type === 'student_complete' || type === 'settings_update' || type === 'full_sync') {
      processedCount++;
    }
  }

  // Execute database operations if Supabase client is available
  if (activeClient) {
    // 1. Bulk upsert student answers
    if (answersToPersist.length > 0) {
      try {
        const uniqueAnswersMap = new Map<string, typeof answersToPersist[0]>();
        for (const ans of answersToPersist) {
          const key = `${ans.student_id}_${ans.question_id}`;
          const existing = uniqueAnswersMap.get(key);
          if (!existing || new Date(ans.updated_at).getTime() >= new Date(existing.updated_at).getTime()) {
            uniqueAnswersMap.set(key, ans);
          }
        }
        await resilientUpsert(activeClient, 'student_answers', Array.from(uniqueAnswersMap.values()), {
          onConflict: 'student_id,question_id',
        });
      } catch (err) {
        console.warn('[Sync API] Student answers upsert caught:', err);
      }
    }

    // 2. Bulk upsert students
    if (studentsToUpsert.length > 0) {
      try {
        const validRows = studentsToUpsert.map(s => ({
          id: String(s.id || s.studentId || '').trim(),
          name: String(s.name || '').trim(),
          class_group: String(s.class_group || s.classGroup || s.class_name || 'X-1').trim(),
          angkatan: Number(s.angkatan || s.cohort || new Date().getFullYear()),
          archived: Boolean(s.archived || false),
          password: String(s.password || '123456').trim(),
          iq_score: typeof s.iq_score === 'number' ? s.iq_score : (typeof s.iqScore === 'number' ? s.iqScore : null),
          eq_score: typeof s.eq_score === 'number' ? s.eq_score : (typeof s.eqScore === 'number' ? s.eqScore : null),
          riasec_scores: s.riasec_scores || s.riasecScores || null,
          dimension_scores: s.dimension_scores || s.dimensionScores || null,
          locked_out: Boolean(s.locked_out || s.lockedOut || false),
          lock_reason: s.lock_reason || s.lockReason || null,
          test_started: Boolean(s.test_started || s.testStarted || false),
          test_completed: Boolean(s.test_completed || s.testCompleted || false),
          test_started_at: s.test_started_at || s.testStartedAt || null,
          test_completed_at: s.test_completed_at || s.testCompletedAt || null,
          current_question_index: Number(s.current_question_index || s.currentQuestionIndex || 0),
          answers: s.answers || {},
          cheat_warnings: Number(s.cheat_warnings || s.cheatWarnings || 0),
          ai_analysis: typeof s.ai_analysis === 'string' ? s.ai_analysis : (typeof s.aiAnalysis === 'string' ? s.aiAnalysis : null),
          completed_tests: Array.isArray(s.completed_tests) ? s.completed_tests : (Array.isArray(s.completedTests) ? s.completedTests : []),
          allow_test_types: s.allow_test_types || s.allowedTests || null,
          school_origin: s.school_origin || s.schoolOrigin || null,
          validity_status: s.validity_status || s.validityStatus || 'VALID',
          validity_score: typeof s.validity_score === 'number' ? s.validity_score : (typeof s.validityScore === 'number' ? s.validityScore : null),
          validity_flags: Array.isArray(s.validity_flags) ? s.validity_flags : (Array.isArray(s.validityFlags) ? s.validityFlags : []),
          time_spent_seconds: typeof s.time_spent_seconds === 'number' ? s.time_spent_seconds : (typeof s.timeSpentSeconds === 'number' ? s.timeSpentSeconds : (typeof s.examDurationSeconds === 'number' ? s.examDurationSeconds : null))
        })).filter(r => Boolean(r.id) && r.id !== 'undefined');

        if (validRows.length > 0) {
          // Deduplicate validRows by id
          const uniqueStudentsMap = new Map<string, typeof validRows[0]>();
          for (const s of validRows) {
            uniqueStudentsMap.set(s.id, s);
          }
          const deduplicatedRows = Array.from(uniqueStudentsMap.values());

          const chunkSize = 50;
          for (let i = 0; i < deduplicatedRows.length; i += chunkSize) {
            const chunk = deduplicatedRows.slice(i, i + chunkSize);
            await resilientUpsert(activeClient, 'students', chunk);
          }
        }
      } catch (err) {
        console.warn('[Sync API] Students batch upsert caught:', err);
      }
    }

    // 3. Delete students
    if (studentsToDelete.length > 0) {
      try {
        await activeClient.from('students').delete().in('id', studentsToDelete);
      } catch (err) {
        console.warn('[Sync API] Students delete caught:', err);
      }
    }

    // 4. Questions upsert
    if (questionsToUpsert.length > 0) {
      try {
        const mapped = questionsToUpsert.map(q => ({
          id: String(q.id),
          test_type: q.testType || q.test_type,
          dimension: q.dimension,
          text: q.text,
          choices: q.choices,
          image_url: q.imageUrl || q.image_url || null
        }));
        const uniqueQMap = new Map<string, typeof mapped[0]>();
        for (const q of mapped) {
          if (q.id && q.id !== 'undefined') uniqueQMap.set(q.id, q);
        }
        await resilientUpsert(activeClient, 'questions', Array.from(uniqueQMap.values()));
      } catch (err) {
        console.warn('[Sync API] Questions upsert caught:', err);
      }
    }

    // 5. Teachers upsert
    if (teachersToUpsert.length > 0) {
      try {
        const mapped = teachersToUpsert.map(t => ({
          id: String(t.id),
          name: String(t.name),
          role: String(t.role || 'Guru'),
          password: String(t.password || '1234'),
          managed_class: t.managed_class || t.managedClass || null
        }));
        const uniqueTMap = new Map<string, typeof mapped[0]>();
        for (const t of mapped) {
          if (t.id && t.id !== 'undefined') uniqueTMap.set(t.id, t);
        }
        await resilientUpsert(activeClient, 'teachers', Array.from(uniqueTMap.values()));
      } catch (err) {
        console.warn('[Sync API] Teachers upsert caught:', err);
      }
    }
  }

  return apiResponse.success(
    {
      synced: true,
      count: processedCount,
      batchSize: items.length,
      timestamp: new Date().toISOString(),
    },
    `Berhasil memproses ${processedCount} item sinkronisasi dalam batch.`
  );
});

