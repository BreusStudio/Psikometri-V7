import {
  Student, Teacher, Question, Dimension, SchoolMajor, TestSettings, TestType, Voucher, Purchase, ReferralCode, Commission, Package, RegistrationRequest, DEFAULT_SCORING_CALIBRATION
} from '../types';
import { PRESET_QUESTIONS, INITIAL_STUDENTS, INITIAL_TEACHERS } from '../presetQuestions';
import {
  PRESET_MAJORS, PRESET_DIMENSIONS, PRESET_TEST_TYPES, PRESET_PACKAGES,
  DEFAULT_AI_PROMPT_TEMPLATE, DEFAULT_AI_SYSTEM_INSTRUCTION
} from '../mock/presets';
import { CANONICAL_DIMENSIONS } from '../metadata/canonicalDimensions';

export interface StoreDataState {
  testSettings: TestSettings;
  testTypes: TestType[];
  students: Student[];
  questions: Question[];
  dimensions: Dimension[];
  schoolMajors: SchoolMajor[];
  teachers: Teacher[];
  registeredClasses: string[];
  registeredCohorts: number[];
  vouchers: Voucher[];
  referrals: ReferralCode[];
  commissions: Commission[];
  purchases: Purchase[];
  packages: Package[];
  quotaAdded: number;
  syncMode: 'sync' | 'async';
  registrations: RegistrationRequest[];
}

export function saveLocalStorageState(state: StoreDataState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('psychometric_test_settings', JSON.stringify(state.testSettings));
    localStorage.setItem('psychometric_test_types', JSON.stringify(state.testTypes));
    localStorage.setItem('psychometric_vouchers', JSON.stringify(state.vouchers));
    localStorage.setItem('psychometric_referrals', JSON.stringify(state.referrals));
    localStorage.setItem('psychometric_commissions', JSON.stringify(state.commissions));
    localStorage.setItem('psychometric_purchases', JSON.stringify(state.purchases));
    localStorage.setItem('psychometric_packages', JSON.stringify(state.packages));
    localStorage.setItem('psychometric_quota_added', String(state.quotaAdded));
    localStorage.setItem('psychometric_sync_mode', state.syncMode);
    localStorage.setItem('psychometric_registrations', JSON.stringify(state.registrations || []));
    if (Array.isArray(state.questions)) {
      try {
        localStorage.setItem('psychometric_questions', JSON.stringify(state.questions));
      } catch (qErr) {
        console.warn("Storage quota warning while caching questions locally:", qErr);
      }
    }
    if (Array.isArray(state.dimensions)) {
      try {
        localStorage.setItem('psychometric_dimensions', JSON.stringify(state.dimensions));
      } catch (dErr) {
        console.warn("Storage quota warning while caching dimensions locally:", dErr);
      }
    }
  } catch (err) {
    console.error("Failed to save state to localStorage:", err);
  }
}

export function loadLocalStorageState(): StoreDataState {
  const defaultState: StoreDataState = {
    questions: [...PRESET_QUESTIONS],
    dimensions: [...PRESET_DIMENSIONS],
    schoolMajors: [...PRESET_MAJORS],
    testTypes: [...PRESET_TEST_TYPES],
    packages: [...PRESET_PACKAGES],
    teachers: [...INITIAL_TEACHERS],
    students: [...INITIAL_STUDENTS],
    registeredClasses: Array.from(new Set(INITIAL_STUDENTS.map(s => s.classGroup))).filter(Boolean).sort(),
    registeredCohorts: Array.from(new Set(INITIAL_STUDENTS.map(s => s.angkatan))).filter(Boolean).sort((a,b) => a-b),
    vouchers: [],
    referrals: [],
    commissions: [],
    purchases: [],
    quotaAdded: 0,
    syncMode: 'async',
    registrations: [],
    testSettings: {
      iqActive: true,
      eqActive: true,
      hollandActive: true,
      kepribadianActive: true,
      validitasActive: true,
      autoAiAnalysis: true,
      iqLimit: 8,
      eqLimit: 8,
      hollandLimit: 12,
      kepribadianLimit: 12,
      validitasLimit: 12,
      randomizeQuestions: true,
      randomizeChoices: true,
      iqDuration: 15,
      eqDuration: 15,
      hollandDuration: 15,
      kepribadianDuration: 15,
      validitasDuration: 15,
      aiPromptTemplate: DEFAULT_AI_PROMPT_TEMPLATE,
      aiSystemInstruction: DEFAULT_AI_SYSTEM_INSTRUCTION,
      certBackgroundPreset: 'elegant-navy',
      certCustomBackground: '',
      certTitle: 'SERTIFIKAT HASIL ASESMEN PSIKOMETRI',
      certMainWording: 'Dengan ini menerangkan bahwa {nama} dari {sekolah} pada tanggal {tanggal} telah menyelesaikan seluruh rangkaian Ujian CBT Psikometri. Hasil ini disusun sebagai instrumen panduan bimbingan karir vokasi, potensi kognitif (IQ), regulasi emosi (EQ), serta kecenderungan minat karir (RIASEC) di bawah pengawasan Guru Bimbingan Konseling dan divalidasi oleh CBT Core AI Engine.',
      certCounselorName: 'Prita Oktavia Surya Winanti, S. Psi',
      certCounselorTitle: 'Guru BK / Konselor Sekolah',
      certCounselorNip: '-',
      scoringCalibration: DEFAULT_SCORING_CALIBRATION
    }
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const localSettings = localStorage.getItem('psychometric_test_settings');
    if (localSettings) {
      const parsed = JSON.parse(localSettings);
      defaultState.testSettings = { 
        ...defaultState.testSettings, 
        ...parsed,
        scoringCalibration: parsed.scoringCalibration || DEFAULT_SCORING_CALIBRATION
      };
    }
    const localTypes = localStorage.getItem('psychometric_test_types');
    if (localTypes) {
      const parsed = JSON.parse(localTypes);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((t: any) => (t.id || t.name || '').toLowerCase()));
        const missingPresets = PRESET_TEST_TYPES.filter(
          pt => !existingIds.has(pt.id.toLowerCase()) && !existingIds.has(pt.name.toLowerCase())
        );
        defaultState.testTypes = [...parsed, ...missingPresets];
      }
    }
    const localVouchers = localStorage.getItem('psychometric_vouchers');
    if (localVouchers) {
      defaultState.vouchers = JSON.parse(localVouchers);
    }
    const localReferrals = localStorage.getItem('psychometric_referrals');
    if (localReferrals) {
      defaultState.referrals = JSON.parse(localReferrals);
    }
    const localPurchases = localStorage.getItem('psychometric_purchases');
    if (localPurchases) {
      defaultState.purchases = JSON.parse(localPurchases);
    }
    const localCommissions = localStorage.getItem('psychometric_commissions');
    if (localCommissions) {
      defaultState.commissions = JSON.parse(localCommissions);
    }
    const localQuotaAdded = localStorage.getItem('psychometric_quota_added');
    if (localQuotaAdded) {
      defaultState.quotaAdded = parseInt(localQuotaAdded, 10) || 0;
    }
    const localSyncMode = localStorage.getItem('psychometric_sync_mode');
    if (localSyncMode === 'sync' || localSyncMode === 'async') {
      defaultState.syncMode = localSyncMode;
    }
    const localPackages = localStorage.getItem('psychometric_packages');
    if (localPackages) {
      const parsed = JSON.parse(localPackages);
      defaultState.packages = parsed.map((p: any) => ({
        ...p,
        active: p.active !== undefined ? p.active : true
      }));
    }
    const localRegistrations = localStorage.getItem('psychometric_registrations');
    if (localRegistrations) {
      defaultState.registrations = JSON.parse(localRegistrations);
    }
    const localQuestions = localStorage.getItem('psychometric_questions');
    const localDeletedQuestions = localStorage.getItem('psychometric_deleted_question_ids');
    const deletedQuestionIds = new Set<string>(localDeletedQuestions ? JSON.parse(localDeletedQuestions) : []);

    if (localQuestions !== null) {
      try {
        const parsedQ = JSON.parse(localQuestions);
        if (Array.isArray(parsedQ)) {
          defaultState.questions = parsedQ.filter(q => !deletedQuestionIds.has(String(q.id)));
        }
      } catch (e) {
        console.warn("Failed to parse cached questions:", e);
      }
    } else if (deletedQuestionIds.size > 0) {
      defaultState.questions = defaultState.questions.filter(q => !deletedQuestionIds.has(String(q.id)));
    }
    const localDimensions = localStorage.getItem('psychometric_dimensions');
    if (localDimensions) {
      try {
        const parsedD = JSON.parse(localDimensions);
        if (Array.isArray(parsedD) && parsedD.length > 0) {
          // If cached dimensions exceed canonical count or are polluted, standardize to CANONICAL_DIMENSIONS
          if (parsedD.length > 20) {
            defaultState.dimensions = [...CANONICAL_DIMENSIONS];
            localStorage.setItem('psychometric_dimensions', JSON.stringify(CANONICAL_DIMENSIONS));
          } else {
            defaultState.dimensions = parsedD;
          }
        }
      } catch (e) {
        console.warn("Failed to parse cached dimensions:", e);
      }
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
  }

  return defaultState;
}
