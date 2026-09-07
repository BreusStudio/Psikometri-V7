import { Student, Question, Dimension, TestSettings } from '../types';

const TEST_NAME_TO_ID: Record<string, string> = {
  "Potensi Kognitif (IQ)": "IQ",
  "Kecerdasan Emosional (EQ)": "EQ",
  "Minat Karir RIASEC": "Holland",
  "Gaya Belajar (VAK)": "GayaBelajar",
  "Kecerdasan Majemuk (MI)": "MultipleIntelligences",
  "Kepribadian Big Five": "Kepribadian",
  "Kesiapan Kerja Vokasi": "KesiapanKerja",
  "Potensi Akademik & Karir": "PotensiAkademik",
  "Indikator Konsistensi": "Validitas"
};

export function mapDatabaseRowToStudent(row: any): Student {
  let allowed: string[] = ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas'];
  
  if (Array.isArray(row.allow_test_types)) {
    allowed = row.allow_test_types.map((t: string) => TEST_NAME_TO_ID[t] || t);
  } else if (typeof row.test_type === 'string' && row.test_type.trim() !== '') {
    allowed = row.test_type.split(',').map((t: string) => {
      const cleaned = t.trim();
      return TEST_NAME_TO_ID[cleaned] || cleaned;
    });
  } else if (typeof row.testType === 'string' && row.testType.trim() !== '') {
    allowed = row.testType.split(',').map((t: string) => {
      const cleaned = t.trim();
      return TEST_NAME_TO_ID[cleaned] || cleaned;
    });
  }

  return {
    id: row.id,
    name: row.name,
    classGroup: row.class_group || row.class_name || 'X-1',
    angkatan: row.angkatan || new Date().getFullYear(),
    archived: row.archived || false,
    password: row.password,
    iqScore: row.iq_score,
    eqScore: row.eq_score,
    riasecScores: row.riasec_scores,
    dimensionScores: row.dimension_scores,
    lockedOut: row.locked_out,
    lockReason: row.lock_reason,
    testStarted: row.test_started,
    testCompleted: row.test_completed,
    testStartedAt: row.test_started_at,
    testCompletedAt: row.test_completed_at,
    currentQuestionIndex: row.current_question_index || 0,
    answers: row.answers || {},
    cheatWarnings: row.cheat_warnings || 0,
    aiAnalysis: row.ai_analysis,
    completedTests: row.completed_tests || [],
    allowedTests: allowed,
    schoolOrigin: row.school_origin
  };
}

export function parseQuestionChoices(rawChoices: any): any[] {
  if (typeof rawChoices === 'string') {
    try {
      return JSON.parse(rawChoices);
    } catch (err) {
      console.error("Failed to parse choices JSON:", err);
      return [];
    }
  }
  return Array.isArray(rawChoices) ? rawChoices : [];
}

export function mapDatabaseRowToQuestion(q: any): Question {
  const rawType = q.test_type;
  const mappedType = TEST_NAME_TO_ID[rawType] || rawType;
  const rawId = String(q.id || '');
  const derivedPackageId = q.package_id || q.packageId || (rawId.startsWith('Q-B1') ? 'PKG-VOKASI-A' : rawId.startsWith('Q-B2') ? 'PKG-VOKASI-B' : undefined);

  const isValidated = Boolean(
    q.is_validated === true || 
    q.isValidated === true || 
    q.verification_status === 'VERIFIED' || 
    q.verificationStatus === 'VERIFIED'
  );

  return {
    id: q.id,
    testType: mappedType as any,
    dimension: q.dimension,
    text: q.text,
    choices: parseQuestionChoices(q.choices),
    imageUrl: q.image_url || undefined,
    packageId: derivedPackageId,
    applicableContexts: Array.isArray(q.applicable_contexts) ? q.applicable_contexts : q.applicableContexts,
    difficultyLevel: q.difficulty_level || q.difficultyLevel,
    difficultyIndex: typeof q.difficulty_index === 'number' ? q.difficulty_index : q.difficultyIndex,
    discriminationIndex: typeof q.discrimination_index === 'number' ? q.discrimination_index : q.discriminationIndex,
    educationLevel: q.education_level || q.educationLevel,
    verificationStatus: isValidated ? 'VERIFIED' : (q.verification_status || q.verificationStatus || 'DRAFT'),
    verifiedBy: q.verified_by || q.verifiedBy,
    verifiedAt: q.verified_at || q.verifiedAt,
    aiClassification: q.ai_classification || q.aiClassification,
    archived: q.archived || false,
    scoringType: q.scoring_type || q.scoringType,
    isUnfavorable: q.is_unfavorable !== undefined ? q.is_unfavorable : q.isUnfavorable,
    correctChoiceId: q.correct_choice_id || q.correctChoiceId,
    optionScores: q.option_scores || q.optionScores || q.answers || q.rubric
  };
}

export function mapDatabaseRowToDimension(d: any): Dimension {
  return {
    id: d.id,
    name: d.name,
    testType: d.test_type as any,
    description: d.description || ''
  };
}

export function mapDatabaseRowToTestSettings(row: any, currentSettings: TestSettings): TestSettings {
  return {
    ...currentSettings,
    iqActive: row.iq_active,
    eqActive: row.eq_active,
    hollandActive: row.holland_active,
    kepribadianActive: row.kepribadian_active !== undefined ? row.kepribadian_active : true,
    validitasActive: row.validitas_active !== undefined ? row.validitas_active : true,
    autoAiAnalysis: row.auto_ai_analysis,
    iqLimit: row.iq_limit,
    eqLimit: row.eq_limit,
    hollandLimit: row.holland_limit,
    kepribadianLimit: row.kepribadian_limit !== undefined ? row.kepribadian_limit : 12,
    validitasLimit: row.validitas_limit !== undefined ? row.validitas_limit : 12,
    randomizeQuestions: row.randomize_questions,
    randomizeChoices: row.randomize_choices !== undefined ? row.randomize_choices : true,
    iqDuration: row.iq_duration || 15,
    eqDuration: row.eq_duration || 15,
    hollandDuration: row.holland_duration || 15,
    kepribadianDuration: row.kepribadian_duration || 15,
    validitasDuration: row.validitas_duration || 15
  };
}
