export type EducationLevel = 'SD' | 'MI' | 'SMP' | 'MTS' | 'SMA' | 'SMK' | 'MA' | 'PERGURUAN_TINGGI';

export const EDUCATION_LEVELS: { id: EducationLevel; label: string; shortLabel: string }[] = [
  { id: 'SD', label: 'Sekolah Dasar (SD)', shortLabel: 'SD' },
  { id: 'MI', label: 'Madrasah Ibtidaiyah (MI)', shortLabel: 'MI' },
  { id: 'SMP', label: 'Sekolah Menengah Pertama (SMP)', shortLabel: 'SMP' },
  { id: 'MTS', label: 'Madrasah Tsanawiyah (MTs)', shortLabel: 'MTs' },
  { id: 'SMA', label: 'Sekolah Menengah Atas (SMA)', shortLabel: 'SMA' },
  { id: 'SMK', label: 'Sekolah Menengah Kejuruan (SMK)', shortLabel: 'SMK' },
  { id: 'MA', label: 'Madrasah Aliyah (MA)', shortLabel: 'MA' },
  { id: 'PERGURUAN_TINGGI', label: 'Perguruan Tinggi / Universitas', shortLabel: 'Perguruan Tinggi' },
];

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  SD: 'Sekolah Dasar (SD)',
  MI: 'Madrasah Ibtidaiyah (MI)',
  SMP: 'Sekolah Menengah Pertama (SMP)',
  MTS: 'Madrasah Tsanawiyah (MTs)',
  SMA: 'Sekolah Menengah Atas (SMA)',
  SMK: 'Sekolah Menengah Kejuruan (SMK)',
  MA: 'Madrasah Aliyah (MA)',
  PERGURUAN_TINGGI: 'Perguruan Tinggi / Universitas',
};

export interface Student {
  id: string; // NIM / NISN
  name: string;
  classGroup: string; // e.g. "XII RPL 1"
  angkatan: number | string;
  educationLevel?: string; // SD, MI, SMP, MTS, SMA, SMK, MA, PERGURUAN_TINGGI
  archived?: boolean;
  password: string;
  iqScore: number | null;
  eqScore: number | null;
  riasecScores: Record<string, number> | null; // { R, I, A, S, E, C }
  dimensionScores: Record<string, number> | null; // Detailed sub-scores
  evaluatedDimensions?: Record<string, {
    normalizedScore: number;
    label: string;
    color: string;
    interpretation: string;
    rawScore: number;
  }> | null;
  lockedOut: boolean;
  lockReason: string | null;
  testStarted: boolean;
  testCompleted: boolean;
  testStartedAt: string | null;
  testCompletedAt: string | null;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> choiceId
  cheatWarnings: number;
  aiAnalysis: any | null;
  validationStatus?: string | null;
  validationRecommendation?: string | null;
  completedTests?: string[];
  allowedTests?: string[];
  schoolOrigin?: string;
  class_name?: string;
  major?: string;
  cohort?: number | string;
  gender?: string;
  status?: string;
  completedAt?: string | null;
  testType?: string;
  school_origin?: string;
  email?: string;
  phone?: string;
  paymentStatus?: 'UNPAID' | 'PAID' | 'REJECTED';
  registrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  packageId?: string;
  packageName?: string;
  paymentProofUrl?: string;
  rejectionReason?: string;
  invoiceNumber?: string;
  amount?: number;
  paymentVerifiedAt?: string | null;
  paymentVerifiedBy?: string | null;
  scores?: any;
  examStartedAt?: string | null;
  examDurationSeconds?: number;
  timeSpentSeconds?: number;
  validityScore?: number;
  validityFlags?: string[];
  validityReasoning?: string;
  violatingCount?: number;
  cheatLogs?: any[];
  isDummy?: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  role: string;
  password: string;
  managed_class?: string;
  managed_major?: string;
  school_origin?: string;
  context?: string;
  applicableContexts?: string[];
}

export type ItemDifficultyLevel = 'sangat_mudah' | 'mudah' | 'sedang' | 'sulit' | 'sangat_sulit';
export type ItemReviewStatus = 'AUTO' | 'VERIFIED' | 'OVERRIDDEN';
export type ScoringType = 'binary' | 'weighted' | 'likert';

export interface DimensionNormRange {
  min: number;
  max: number;
  label: string;
  color?: string; // e.g. 'emerald', 'blue', 'amber', 'rose'
  interpretation?: string; // Narrative template for reports
}

export const DIFFICULTY_LEVEL_LABELS: Record<ItemDifficultyLevel, { label: string; color: string; badgeBg: string; pValueRange: string }> = {
  sangat_mudah: { label: 'Sangat Mudah', color: 'text-emerald-700', badgeBg: 'bg-emerald-50 border-emerald-200', pValueRange: '0.81 - 1.00' },
  mudah: { label: 'Mudah', color: 'text-teal-700', badgeBg: 'bg-teal-50 border-teal-200', pValueRange: '0.61 - 0.80' },
  sedang: { label: 'Sedang', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200', pValueRange: '0.41 - 0.60' },
  sulit: { label: 'Sulit', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200', pValueRange: '0.21 - 0.40' },
  sangat_sulit: { label: 'Sangat Sulit', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-200', pValueRange: '0.00 - 0.20' }
};

export interface Question {
  id: string;
  testType: string;
  dimension: string; // e.g. "Spasial", "Verbal", "Regulasi Emosi", "Realistic"
  text: string;
  choices: {
    id: string;
    text: string;
    scoreValue: number; // For IQ/EQ: contribution to score. For Holland: score contribution.
    hollandType?: string; // "R" | "I" | "A" | "S" | "E" | "C" for Holland
  }[];
  options?: { label: string; score: number }[];
  imageUrl?: string;
  licenseCode?: string;
  applicableContexts?: string[];
  packageId?: string; // 'PKG-VOKASI-A' | 'PKG-VOKASI-B' or custom
  archived?: boolean; // Archived legacy items for historical student records
  
  // Item-level Scoring Rubric & Evaluation
  scoringType?: ScoringType;
  isUnfavorable?: boolean; // Reverse scoring flag for negative statements
  correctChoiceId?: string; // For binary / single correct key
  optionScores?: Record<string, number>; // Specific option key to score mapping e.g. { "A": 5, "B": 4 }

  // Psychometric & Level Classification
  code?: string;
  validationType?: string; // 'val-con-1a' | 'val-con-1b' | 'val-con-2a' | 'val-con-2b' | 'val-cross-1' | 'val-cross-2'
  educationLevel?: string; // e.g. 'SD' | 'SMP' | 'SMA' | 'PERGURUAN_TINGGI' | 'PROFESIONAL' | 'ALL'
  difficultyLevel?: ItemDifficultyLevel;
  difficultyIndex?: number; // CTT p-value index (0.00 - 1.00)
  discriminationIndex?: number; // Point-biserial index (-1.00 - 1.00)
  
  // Expert & Psychologist Verification
  verificationStatus?: 'VERIFIED' | 'DRAFT';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;

  aiClassification?: {
    suggestedLevel: string;
    suggestedDifficulty: ItemDifficultyLevel;
    confidence: number;
    reasoning?: string;
    reviewStatus: ItemReviewStatus;
    lastAnalyzedAt?: string;
  };
}

export interface Dimension {
  id: string;
  name: string;
  testType?: string;
  description: string;
  code?: string;
  weight?: number;
  targetLevels?: string[]; // Education levels this dimension applies to
  
  // Dimension-level Scoring & Norm Rubric
  scoringMethod?: 'sum_raw' | 'mean' | 'sten' | 'percentage';
  minScore?: number;
  maxScore?: number;
  passingGrade?: number;
  normRanges?: DimensionNormRange[];
}

export interface SchoolMajor {
  id: string;
  code: string;
  name: string;
  riasecType?: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  description: string;
  passingGrades?: Record<string, number>;
  applicableContexts?: string[];
}

export interface TestType {
  id: string;
  name: string;
  description: string;
  active?: boolean;
  duration?: number; // minutes
  questionLimit?: number;
  icon?: string;
  isSystem?: boolean; // system-defined test types cannot be deleted
  targetLevels?: string[]; // SD, MI, SMP, MTS, SMA, SMK, MA, PERGURUAN_TINGGI
  scoringEngine?: 'standard' | 'vak' | 'multiple_intelligences' | 'riasec' | 'brain_dominance' | 'work_readiness' | 'academic_potential';
  durationMinutes?: number;
  totalQuestions?: number;
  pricePerUser?: number;
}

export interface IqConversionBracket {
  minPercentage: number;
  maxPercentage: number;
  iqScore: number;
  label: string;
}

export interface ScoringCalibrationSettings {
  mode: 'curve' | 'table';
  iqBaselinePercentage: number; // percentage of correct answers that maps to IQ 100 (e.g. 35%)
  iqSpreadPercentage: number;   // percentage spread for 1 SD (15 IQ points) (e.g. 15%)
  minIq: number;                // default 65
  maxIq: number;                // default 145
  
  eqBaselinePercentage: number; // percentage of scores to map to T-Score 50 (e.g. 50%)
  eqSpreadPercentage: number;   // percentage spread for 1 SD (10 T-Score points) (e.g. 18%)
  minEq: number;                // default 20
  maxEq: number;                // default 80
  
  iqBrackets?: IqConversionBracket[];
}

export const DEFAULT_IQ_BRACKETS: IqConversionBracket[] = [
  { minPercentage: 85, maxPercentage: 100, iqScore: 130, label: 'Sangat Superior' },
  { minPercentage: 70, maxPercentage: 84, iqScore: 120, label: 'Superior' },
  { minPercentage: 55, maxPercentage: 69, iqScore: 110, label: 'Di Atas Rata-rata' },
  { minPercentage: 35, maxPercentage: 54, iqScore: 100, label: 'Rata-rata Normal' },
  { minPercentage: 25, maxPercentage: 34, iqScore: 90, label: 'Rata-rata Bawah' },
  { minPercentage: 15, maxPercentage: 24, iqScore: 80, label: 'Di Bawah Rata-rata' },
  { minPercentage: 0, maxPercentage: 14, iqScore: 70, label: 'Batas Rendah / Khusus' }
];

export const DEFAULT_SCORING_CALIBRATION: ScoringCalibrationSettings = {
  mode: 'curve',
  iqBaselinePercentage: 35, // 35% correct answers in challenging vocational aptitude = IQ 100
  iqSpreadPercentage: 15,   // 15% delta = 1 SD (15 IQ points)
  minIq: 65,
  maxIq: 145,
  eqBaselinePercentage: 50, // 50% = T-Score 50
  eqSpreadPercentage: 18,   // 18% = 1 SD (10 T-Score points)
  minEq: 20,
  maxEq: 80,
  iqBrackets: DEFAULT_IQ_BRACKETS
};

export interface TestSettings {
  iqActive: boolean;
  eqActive: boolean;
  hollandActive: boolean;
  kepribadianActive: boolean;
  validitasActive: boolean;
  autoAiAnalysis: boolean;
  iqLimit: number;
  eqLimit: number;
  hollandLimit: number;
  kepribadianLimit: number;
  validitasLimit: number;
  randomizeQuestions: boolean;
  randomizeChoices: boolean;
  iqDuration: number;      // minutes
  eqDuration: number;      // minutes
  hollandDuration: number;  // minutes
  kepribadianDuration: number; // minutes
  validitasDuration: number; // minutes
  aiPromptTemplate?: string;
  aiSystemInstruction?: string;
  certBackgroundPreset?: string;
  certCustomBackground?: string;
  certTitle?: string;
  certMainWording?: string;
  certCounselorName?: string;
  certCounselorTitle?: string;
  certCounselorNip?: string;
  scoringCalibration?: ScoringCalibrationSettings;
}

export interface Voucher {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  usageCount: number;
  schoolName?: string;
  maxUsage?: number;
  isUnlimited?: boolean;
  expiredAt?: string;
  testTypes?: string[];      // Checked/allowed test types, e.g. ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  testCount?: number;        // Max user capacity (e.g. 1 user for Personal, 50 users for Group)
  generatedAccounts?: {      // Pre-generated student credentials
    username: string;
    password: string;
    redeemed: boolean;
    redeemedBy?: string;     // Name of the student who redeemed it
    classGroup?: string;     // Class of the student who redeemed it
  }[];
  adminUsername?: string;    // Pre-generated admin account for this voucher (if group)
  adminPassword?: string;
}

export interface Purchase {
  id: string;
  platform: 'TikTok' | 'Shopee' | 'QRIS' | 'Manual';
  packageName: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  voucherUsed: string | null;
  referralUsed: string | null;
  commissionEarned: number;
  date: string;
  status: 'Completed' | 'Pending';
  quotaAdded: number;
  generatedVoucher?: string;
}

export interface ReferralCode {
  code: string;
  ownerName: string;
  commissionRate: number;
  totalEarned: number;
  bankInfo: string;
}

export interface Commission {
  id: string;
  referralCode: string;
  buyerName: string;
  purchaseAmount: number;
  commissionAmount: number;
  status: 'Pending' | 'Paid';
  paidDate: string | null;
  transferReceipt: string | null;
  date: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  testCount?: number;
  category?: string;
  description?: string;
  testTypes?: string[];
  active?: boolean;
  logoUrl?: string;
  headerTitle?: string;
  institutionName?: string;
  institutionSub?: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureNip?: string;
  educationLevels?: string[]; // SD, MI, SMP, MTS, SMA, SMK, MA, PERGURUAN_TINGGI
  popular?: boolean;
  quota?: number;
  originalPrice?: number;
  features?: string[];
  badgeText?: string;
  testTypeId?: string;
  pricePerAccount?: number;
  discountPercentage?: number;
  packageCode?: string; // e.g. 'PKG-VOKASI-A', 'PKG-VOKASI-B'
  isParallelPackage?: boolean;
}

export interface RegisteredClass {
  id: string;
  name: string;
}

export interface RegisteredCohort {
  id: string;
  year: number;
}

export interface RegistrationRequest {
  id: string;
  registrationType?: 'instansi' | 'personal';
  schoolName: string;
  adminEmail: string;
  adminPhone: string;
  address: string;
  estimatedStudents: number;
  schoolType: 'SMK' | 'SMA' | 'SMP' | 'SD' | 'Instansi' | 'Lainnya';
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentStatus?: 'UNPAID' | 'PAID' | 'REJECTED';
  invoiceNumber?: string;
  amount?: number;
  paymentVerifiedAt?: string | null;
  paymentVerifiedBy?: string | null;
  requestedAt: string;
  adminPassword?: string;
  personalStudentId?: string;
}

export interface LandingPageContent {
  heroHeadline: string;
  heroSubheading: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  statSchools: number;
  statStudents: number;
  statTests: number;
}

