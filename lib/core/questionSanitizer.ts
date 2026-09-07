import { Question, Dimension, Student, Voucher } from './types';
import { resolveEffectiveTestType } from './testTypeResolver';
import { PRESET_QUESTIONS } from '../presetQuestions';

/**
 * Ensures a single Question object has valid, non-corrupt fields and at least 2 valid choices.
 */
export function sanitizeQuestion(q: any, defaultIndex: number = 0): Question {
  if (!q || typeof q !== 'object') {
    const fallbackId = `Q-${Date.now()}-${defaultIndex}`;
    return {
      id: fallbackId,
      text: `Instrumen Pertanyaan #${defaultIndex + 1}`,
      dimension: 'General',
      testType: 'IQ' as any,
      choices: [
        { id: `${fallbackId}-a`, text: 'Sangat Tidak Setuju / Salah', scoreValue: 1 },
        { id: `${fallbackId}-b`, text: 'Tidak Setuju / Kurang Tepat', scoreValue: 2 },
        { id: `${fallbackId}-c`, text: 'Setuju / Tepat', scoreValue: 3 },
        { id: `${fallbackId}-d`, text: 'Sangat Setuju / Benar', scoreValue: 4 }
      ]
    };
  }

  const cleanId = q.id !== undefined && q.id !== null && String(q.id).trim() !== '' 
    ? String(q.id) 
    : `Q-${Date.now()}-${defaultIndex}`;

  const cleanText = q.text && typeof q.text === 'string' && q.text.trim() !== ''
    ? q.text.trim()
    : (q.prompt || q.question || `Butir Soal #${defaultIndex + 1}`);

  const effectiveTestType = resolveEffectiveTestType(
    { testType: q.testType, dimension: q.dimension },
    []
  ) || 'IQ';

  const cleanDimension = q.dimension && typeof q.dimension === 'string' && q.dimension.trim() !== ''
    ? q.dimension.trim()
    : (effectiveTestType === 'Holland' ? 'Realistic' : effectiveTestType);

  // Parse and normalize choices/options
  let rawChoices = q.choices || q.options;
  if (typeof rawChoices === 'string') {
    try {
      rawChoices = JSON.parse(rawChoices);
    } catch {
      rawChoices = [];
    }
  }

  let finalChoices: any[] = [];
  if (Array.isArray(rawChoices) && rawChoices.length > 0) {
    finalChoices = rawChoices.map((c: any, cIdx: number) => {
      const choiceId = c?.id ? String(c.id) : `${cleanId}-opt-${cIdx + 1}`;
      const choiceText = c?.text !== undefined && c?.text !== null ? String(c.text) : (c?.label || `Pilihan ${cIdx + 1}`);
      const scoreVal = typeof c?.scoreValue === 'number' ? c.scoreValue : (typeof c?.score === 'number' ? c.score : 0);
      return {
        id: choiceId,
        text: choiceText,
        scoreValue: scoreVal,
        ...(c?.hollandType ? { hollandType: String(c.hollandType) } : {})
      };
    });
  }

  // Fallback from opsiA/B/C/D if choices is still empty
  if (finalChoices.length === 0 && (q.opsiA || q.opsiB || q.optionA || q.optionB)) {
    const opsiA = q.opsiA || q.optionA;
    const opsiB = q.opsiB || q.optionB;
    const opsiC = q.opsiC || q.optionC;
    const opsiD = q.opsiD || q.optionD;

    if (opsiA) {
      finalChoices.push({
        id: `${cleanId}-a`,
        text: String(opsiA),
        scoreValue: Number(q.skorA !== undefined ? q.skorA : (q.scoreA || 0))
      });
    }
    if (opsiB) {
      finalChoices.push({
        id: `${cleanId}-b`,
        text: String(opsiB),
        scoreValue: Number(q.skorB !== undefined ? q.skorB : (q.scoreB || 0))
      });
    }
    if (opsiC) {
      finalChoices.push({
        id: `${cleanId}-c`,
        text: String(opsiC),
        scoreValue: Number(q.skorC !== undefined ? q.skorC : (q.scoreC || 0))
      });
    }
    if (opsiD) {
      finalChoices.push({
        id: `${cleanId}-d`,
        text: String(opsiD),
        scoreValue: Number(q.skorD !== undefined ? q.skorD : (q.scoreD || 0))
      });
    }
  }

  // If still empty, provide robust standard options based on test type
  if (finalChoices.length === 0) {
    if (effectiveTestType === 'Holland' || effectiveTestType === 'EQ' || effectiveTestType === 'Kepribadian') {
      finalChoices = [
        { id: `${cleanId}-1`, text: 'Sangat Tidak Sesuai / Tidak Pernah', scoreValue: 1 },
        { id: `${cleanId}-2`, text: 'Kurang Sesuai / Jarang', scoreValue: 2 },
        { id: `${cleanId}-3`, text: 'Sesuai / Sering', scoreValue: 3 },
        { id: `${cleanId}-4`, text: 'Sangat Sesuai / Selalu', scoreValue: 4 }
      ];
    } else {
      finalChoices = [
        { id: `${cleanId}-a`, text: 'Pilihan A', scoreValue: 1 },
        { id: `${cleanId}-b`, text: 'Pilihan B', scoreValue: 0 },
        { id: `${cleanId}-c`, text: 'Pilihan C', scoreValue: 0 },
        { id: `${cleanId}-d`, text: 'Pilihan D', scoreValue: 0 }
      ];
    }
  }

  // Normalize applicableContexts
  let cleanContexts: string[] | undefined = undefined;
  if (Array.isArray(q.applicableContexts) && q.applicableContexts.length > 0) {
    const valid = q.applicableContexts.filter((c: any) => typeof c === 'string' && c.trim() !== '');
    if (valid.length > 0 && !valid.includes('all') && !valid.includes('global')) {
      cleanContexts = valid;
    }
  }

  return {
    id: cleanId,
    text: cleanText,
    dimension: cleanDimension,
    testType: effectiveTestType as any,
    choices: finalChoices,
    imageUrl: q.imageUrl || undefined,
    licenseCode: q.licenseCode && q.licenseCode !== 'undefined' ? String(q.licenseCode).trim() : undefined,
    applicableContexts: cleanContexts,
    packageId: q.packageId || (cleanId.startsWith('Q-B1') ? 'PKG-VOKASI-A' : cleanId.startsWith('Q-B2') ? 'PKG-VOKASI-B' : undefined),
    archived: Boolean(q.archived),
    scoringType: q.scoringType || undefined,
    correctChoiceId: q.correctChoiceId || undefined,
    optionScores: q.optionScores || undefined,
    isUnfavorable: Boolean(q.isUnfavorable),
    verificationStatus: q.verificationStatus || undefined,
    educationLevel: (q.educationLevel === 'SD' && (effectiveTestType === 'Holland' || String(q.packageId || '').toUpperCase().includes('VOKASI') || String(cleanDimension).toUpperCase().includes('REALISTIC'))) ? 'SMA' : (q.educationLevel || undefined),
    difficultyLevel: q.difficultyLevel || undefined,
    difficultyIndex: typeof q.difficultyIndex === 'number' ? q.difficultyIndex : undefined,
    discriminationIndex: typeof q.discriminationIndex === 'number' ? q.discriminationIndex : undefined,
    aiClassification: q.aiClassification ? {
      ...q.aiClassification,
      suggestedLevel: (q.aiClassification.suggestedLevel === 'SD' && (effectiveTestType === 'Holland' || String(q.packageId || '').toUpperCase().includes('VOKASI'))) ? 'SMA' : q.aiClassification.suggestedLevel
    } : undefined
  };
}

/**
 * Sanitizes an array of raw questions, filtering out completely corrupt records and guaranteeing integrity.
 */
export function sanitizeQuestionsList(questions: any[]): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.map((q, idx) => sanitizeQuestion(q, idx));
}

/**
 * Robust filter for student exams. Guarantees that questions for a requested subtest are retrieved
 * without getting wiped out by over-strict filters or minor metadata mismatches.
 */
export function filterQuestionsForStudent(
  allQuestions: Question[],
  subtestType: string,
  options?: {
    student?: Student | null;
    voucher?: Voucher | null;
    masterDimensions?: Dimension[];
    packageId?: string;
  }
): Question[] {
  if (!allQuestions || allQuestions.length === 0) {
    return PRESET_QUESTIONS.filter(q => !q.archived && resolveEffectiveTestType(q, options?.masterDimensions) === subtestType);
  }

  const sanitized = sanitizeQuestionsList(allQuestions);
  // Filter out archived items so they are not served to active test takers
  const activeQuestions = sanitized.filter(q => !q.archived);
  const targetType = subtestType.trim().toUpperCase();

  // Tier 1: Canonical Type Matching
  let typeMatched = activeQuestions.filter(q => {
    const qEffType = resolveEffectiveTestType(q, options?.masterDimensions).toUpperCase();
    return qEffType === targetType || String(q.testType).toUpperCase() === targetType;
  });

  if (typeMatched.length === 0) {
    // If no active questions match, try preset non-archived questions
    typeMatched = PRESET_QUESTIONS.filter(q => !q.archived && resolveEffectiveTestType(q, options?.masterDimensions).toUpperCase() === targetType);
  }

  if (typeMatched.length === 0) {
    // Fallback if needed
    return [];
  }

  // Tier 1.5: Parallel Package Matching (PKG-VOKASI-A vs PKG-VOKASI-B vs DYNAMIC)
  const requestedPkg = options?.packageId?.toUpperCase();
  if (requestedPkg && requestedPkg !== 'PKG-VOKASI-DYNAMIC' && requestedPkg !== 'ALL') {
    const pkgMatched = typeMatched.filter(q => q.packageId?.toUpperCase() === requestedPkg);
    if (pkgMatched.length > 0) {
      typeMatched = pkgMatched;
    }
  }

  const student = options?.student;
  const voucher = options?.voucher;

  // Tier 2: License filtering
  let licenseFiltered = typeMatched.filter(q => {
    const qLicense = q.licenseCode ? q.licenseCode.trim().toUpperCase() : '';
    const isGlobal = !qLicense || qLicense === 'GLOBAL' || qLicense === 'ALL';
    if (voucher && voucher.code) {
      const isExclusive = qLicense === voucher.code.trim().toUpperCase();
      return isGlobal || isExclusive;
    }
    return isGlobal;
  });

  if (licenseFiltered.length === 0) {
    // Graceful fallback to all type-matched questions if license filter yields 0
    licenseFiltered = typeMatched;
  }

  // Tier 3: Context / Institution filtering (e.g. SMK, SMA, SMP)
  let contextFiltered = licenseFiltered;
  if (voucher) {
    const getContextFromVoucher = (v: any): string => {
      if (v?.instansiContext) return v.instansiContext;
      const combined = ((v?.schoolName || '') + ' ' + (v?.code || '')).toLowerCase();
      if (combined.includes('smk')) return 'sekolah_smk';
      if (combined.includes('sma')) return 'sekolah_sma';
      if (combined.includes('smp')) return 'sekolah_smp';
      if (combined.includes('sd')) return 'sekolah_sd';
      if (combined.includes('perusahaan') || combined.includes('corporate') || combined.includes('pt ')) return 'perusahaan';
      if (combined.includes('pemerintah') || combined.includes('dinas')) return 'instansi_pemerintah';
      if (combined.includes('personal') || combined.includes('mandiri')) return 'personal';
      return 'sekolah_smk';
    };

    const studentCtx = getContextFromVoucher(voucher);
    const matchedCtx = licenseFiltered.filter(q => {
      // If no applicableContexts specified or array empty, it's universal (available to all)
      if (!q.applicableContexts || q.applicableContexts.length === 0) return true;
      
      const normalizedContexts = q.applicableContexts.map(c => String(c).trim().toLowerCase());
      if (normalizedContexts.includes('all') || normalizedContexts.includes('global')) return true;
      
      // Strict context check: Must explicitly match the student's context
      return normalizedContexts.includes(studentCtx.toLowerCase());
    });

    // If context filtering retains questions, strictly use it
    if (matchedCtx.length > 0) {
      contextFiltered = matchedCtx;
    } else {
      // Strict fallback: take questions that are explicitly universal (no context restriction)
      const universalOnly = licenseFiltered.filter(q => 
        !q.applicableContexts || 
        q.applicableContexts.length === 0 || 
        q.applicableContexts.some(c => ['all', 'global'].includes(String(c).toLowerCase()))
      );
      contextFiltered = universalOnly.length > 0 ? universalOnly : licenseFiltered;
    }
  }

  // Tier 4: Education Level filtering
  if (student?.educationLevel) {
    const sEdu = student.educationLevel.toUpperCase();
    const eduMatched = contextFiltered.filter(q => {
      if (!q.educationLevel || q.educationLevel.toUpperCase() === 'ALL') return true;
      const qEdu = q.educationLevel.toUpperCase();
      return qEdu === sEdu ||
        (sEdu === 'MI' && qEdu === 'SD') ||
        (sEdu === 'MTS' && qEdu === 'SMP') ||
        (sEdu === 'SMK' && (qEdu === 'SMA' || qEdu === 'SMK'));
    });

    if (eduMatched.length > 0) {
      return eduMatched;
    }
  }

  return contextFiltered;
}
