import {
  Student, Teacher, Question, Dimension, SchoolMajor, TestSettings, TestType, Voucher, Purchase, ReferralCode, Commission, Package, RegistrationRequest
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
    vouchers: [
      {
        code: "VCHR-SMK-001",
        type: "fixed",
        value: 0,
        active: true,
        usageCount: 0,
        testCount: 200,
        testTypes: ["IQ", "EQ", "Holland", "Kepribadian", "Validitas"],
        adminUsername: "ADMIN_SMK_001",
        adminPassword: "SMK1PASSWORD",
        generatedAccounts: Array.from({ length: 200 }, (_, i) => ({
          username: `SMK-001_${String(i + 1).padStart(3, '0')}`,
          password: `SMK1PASS${i + 1}`,
          redeemed: i < 45,
          redeemedBy: i < 45 ? `Siswa SMK ${i + 1}` : undefined,
          classGroup: "XII RPL 1"
        }))
      },
      {
        code: "VCHR-SMA-002",
        type: "fixed",
        value: 0,
        active: true,
        usageCount: 0,
        testCount: 80,
        testTypes: ["IQ", "EQ", "Holland", "Kepribadian", "Validitas"],
        adminUsername: "ADMIN_SMA_002",
        adminPassword: "SMA2PASS",
        generatedAccounts: Array.from({ length: 80 }, (_, i) => ({
          username: `SMA-002_${String(i + 1).padStart(2, '0')}`,
          password: `SMA2PASS${i + 1}`,
          redeemed: i < 20,
          redeemedBy: i < 20 ? `Siswa SMA ${i + 1}` : undefined,
          classGroup: "XII MIPA 2"
        }))
      },
      {
        code: "VCHR-SMP-003",
        type: "fixed",
        value: 0,
        active: true,
        usageCount: 0,
        testCount: 1,
        testTypes: ["IQ", "EQ", "Holland", "Kepribadian", "Validitas"],
        generatedAccounts: [
          {
            username: "SISWA_SMP-003",
            password: "MANDIRIPASS1",
            redeemed: true,
            redeemedBy: "Ahmad Fauzi",
            classGroup: "XII Mandiri"
          }
        ]
      },
      {
        code: "VCHR-CORP-004",
        type: "fixed",
        value: 0,
        active: true,
        usageCount: 0,
        testCount: 300,
        testTypes: ["IQ", "EQ", "Holland", "Kepribadian", "Validitas"],
        adminUsername: "ADMIN_CORP_004",
        adminPassword: "PTTECHPASS",
        generatedAccounts: Array.from({ length: 300 }, (_, i) => ({
          username: `CORP-004_${String(i + 1).padStart(3, '0')}`,
          password: `PTTECH${i + 1}`,
          redeemed: i < 15,
          redeemedBy: i < 15 ? `Kandidat PTTech ${i + 1}` : undefined,
          classGroup: "Recruitment Batch 1"
        }))
      }
    ],
    referrals: [
      {
        code: "BK_PRO_KARTIKA",
        ownerName: "Bu Kartika Handayani (Guru BK SMA Kartika)",
        commissionRate: 10,
        totalEarned: 144000,
        bankInfo: "BCA - 892019281"
      },
      {
        code: "INDO_ASRI_CONS",
        ownerName: "Drs. Hermawan M.Psi (Konsultan Karir)",
        commissionRate: 15,
        totalEarned: 2310000,
        bankInfo: "Mandiri - 131002930192"
      },
      {
        code: "AFF_ALUMNI_SMK",
        ownerName: "Andi Saputra (Ikatan Alumni SMK)",
        commissionRate: 10,
        totalEarned: 0,
        bankInfo: "BNI - 0829102831"
      }
    ],
    commissions: [
      {
        id: "COM-001",
        referralCode: "INDO_ASRI_CONS",
        buyerName: "SMKN 1 Bandung",
        purchaseAmount: 3400000,
        commissionAmount: 510000,
        status: "Paid",
        paidDate: "2026-07-16T11:00:00Z",
        transferReceipt: "https://picsum.photos/seed/receipt1/400/600",
        date: "2026-07-15T08:30:00Z"
      },
      {
        id: "COM-002",
        referralCode: "BK_PRO_KARTIKA",
        buyerName: "SMA Budi Luhur",
        purchaseAmount: 1440000,
        commissionAmount: 144000,
        status: "Paid",
        paidDate: "2026-07-21T14:30:00Z",
        transferReceipt: "https://picsum.photos/seed/receipt2/400/600",
        date: "2026-07-20T10:15:00Z"
      },
      {
        id: "COM-003",
        referralCode: "INDO_ASRI_CONS",
        buyerName: "PT Tech Solusindo",
        purchaseAmount: 12000000,
        commissionAmount: 1800000,
        status: "Pending",
        paidDate: null,
        transferReceipt: null,
        date: "2026-07-29T16:45:00Z"
      }
    ],
    purchases: [
      {
        id: "TX-SMK-001",
        platform: "Manual",
        packageName: "Paket Vokasi SMK & SMA Standard",
        buyerName: "SMKN 1 Bandung",
        buyerEmail: "info@smkn1bandung.sch.id",
        amount: 3400000,
        voucherUsed: null,
        referralUsed: "INDO_ASRI_CONS",
        commissionEarned: 510000,
        date: "2026-07-15T08:30:00Z",
        status: "Completed",
        quotaAdded: 200,
        generatedVoucher: "VCHR-SMK-001"
      },
      {
        id: "TX-SMA-002",
        platform: "Shopee",
        packageName: "Paket Peminatan Sekolah",
        buyerName: "SMA Budi Luhur",
        buyerEmail: "budi.luhur@sch.id",
        amount: 1440000,
        voucherUsed: null,
        referralUsed: "BK_PRO_KARTIKA",
        commissionEarned: 144000,
        date: "2026-07-20T10:15:00Z",
        status: "Completed",
        quotaAdded: 80,
        generatedVoucher: "VCHR-SMA-002"
      },
      {
        id: "TX-SMP-003",
        platform: "QRIS",
        packageName: "Paket Mandiri Personal",
        buyerName: "Ahmad Fauzi",
        buyerEmail: "ahmad.fauzi@gmail.com",
        amount: 99000,
        voucherUsed: null,
        referralUsed: null,
        commissionEarned: 0,
        date: "2026-07-28T13:20:00Z",
        status: "Completed",
        quotaAdded: 1,
        generatedVoucher: "VCHR-SMP-003"
      },
      {
        id: "TX-CORP-004",
        platform: "Manual",
        packageName: "Paket Rekrutmen & Executive Assessment",
        buyerName: "PT Tech Solusindo",
        buyerEmail: "hr@techsolusindo.com",
        amount: 12000000,
        voucherUsed: null,
        referralUsed: "INDO_ASRI_CONS",
        commissionEarned: 1800000,
        date: "2026-07-29T16:45:00Z",
        status: "Completed",
        quotaAdded: 300,
        generatedVoucher: "VCHR-CORP-004"
      }
    ],
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
      certCounselorNip: '-'
    }
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const localSettings = localStorage.getItem('psychometric_test_settings');
    if (localSettings) {
      defaultState.testSettings = { ...defaultState.testSettings, ...JSON.parse(localSettings) };
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
