import { Question, Student, Teacher } from './types';
import { BLOCK1_RAW_CSV } from './data/block1RawCsv';
import { BLOCK2_RAW_CSV } from './data/block2RawCsv';
import { parseVocationalQuestionsCsv } from './data/parseCsvQuestions';

export const ARCHIVED_LEGACY_QUESTIONS: Question[] = [
  {
    id: 'q-iq-1',
    testType: 'IQ',
    dimension: 'Penalaran Logika & Abstrak',
    text: 'Pilihlah kelanjutan pola logis dari deret berikut: 2, 4, 8, 16, ...',
    choices: [
      { id: 'c-iq1-a', text: '24', scoreValue: 0 },
      { id: 'c-iq1-b', text: '32', scoreValue: 1 },
      { id: 'c-iq1-c', text: '30', scoreValue: 0 },
      { id: 'c-iq1-d', text: '36', scoreValue: 0 }
    ],
    scoringType: 'binary',
    correctChoiceId: 'c-iq1-b',
    archived: true,
    difficultyLevel: 'mudah',
    applicableContexts: ['sekolah_smk', 'global']
  },
  {
    id: 'q-iq-2',
    testType: 'IQ',
    dimension: 'Analisis Angka & Kuantitatif',
    text: 'Jika 5 pekerja dapat menyelesaikan pekerjaan dalam 12 hari, berapa hari yang dibutuhkan oleh 10 pekerja?',
    choices: [
      { id: 'c-iq2-a', text: '6 hari', scoreValue: 1 },
      { id: 'c-iq2-b', text: '8 hari', scoreValue: 0 },
      { id: 'c-iq2-c', text: '10 hari', scoreValue: 0 },
      { id: 'c-iq2-d', text: '15 hari', scoreValue: 0 }
    ],
    scoringType: 'binary',
    correctChoiceId: 'c-iq2-a',
    archived: true,
    difficultyLevel: 'sedang',
    applicableContexts: ['sekolah_smk', 'global']
  },
  {
    id: 'q-iq-3',
    testType: 'IQ',
    dimension: 'Pemahaman Verbal & Bahasa',
    text: 'SINONIM: EFEKTIF = ...',
    choices: [
      { id: 'c-iq3-a', text: 'Hemat waktu', scoreValue: 0 },
      { id: 'c-iq3-b', text: 'Tepat sasaran / Manjur', scoreValue: 1 },
      { id: 'c-iq3-c', text: 'Cepat selesai', scoreValue: 0 },
      { id: 'c-iq3-d', text: 'Murah biaya', scoreValue: 0 }
    ],
    scoringType: 'binary',
    correctChoiceId: 'c-iq3-b',
    archived: true,
    difficultyLevel: 'mudah',
    applicableContexts: ['sekolah_smk', 'global']
  },
  {
    id: 'q-eq-1',
    testType: 'EQ',
    dimension: 'Pengendalian Emosi (Self-Control)',
    text: 'Ketika menghadapi rekan kerja yang emosional dan berbicara keras di depan tim, saya memilih untuk:',
    choices: [
      { id: 'c-eq1-a', text: 'Tetap tenang, mendengarkan inti keluhan, dan mengajaknya berbicara secara privat', scoreValue: 4 },
      { id: 'c-eq1-b', text: 'Menenangkan situasi lalu membicarakan setelah situasi lebih dingin', scoreValue: 3 },
      { id: 'c-eq1-c', text: 'Meninggalkan ruangan sementara agar tidak terpancing', scoreValue: 2 },
      { id: 'c-eq1-d', text: 'Membalas dengan nada yang sama tegasnya agar tidak diremehkan', scoreValue: 1 }
    ],
    scoringType: 'weighted',
    archived: true,
    difficultyLevel: 'sedang',
    applicableContexts: ['sekolah_smk', 'global']
  },
  {
    id: 'q-holland-1',
    testType: 'Holland',
    dimension: 'Realistic (Mekanik & Lapangan)',
    text: 'Saya sangat tertarik memperbaiki perangkat elektronik atau mesin yang rusak.',
    choices: [
      { id: 'c-h1-a', text: 'Sangat Suka / Sangat Sesuai', scoreValue: 4, hollandType: 'R' },
      { id: 'c-h1-b', text: 'Suka / Sesuai', scoreValue: 3, hollandType: 'R' },
      { id: 'c-h1-c', text: 'Ragu-ragu / Biasa Saja', scoreValue: 2, hollandType: 'R' },
      { id: 'c-h1-d', text: 'Tidak Suka', scoreValue: 1, hollandType: 'R' }
    ],
    scoringType: 'weighted',
    archived: true,
    difficultyLevel: 'sedang',
    applicableContexts: ['sekolah_smk', 'global']
  }
];

export const BLOCK1_QUESTIONS: Question[] = parseVocationalQuestionsCsv(BLOCK1_RAW_CSV, 'PKG-VOKASI-A');
export const BLOCK2_QUESTIONS: Question[] = parseVocationalQuestionsCsv(BLOCK2_RAW_CSV, 'PKG-VOKASI-B');

export const PRESET_QUESTIONS: Question[] = [
  ...BLOCK1_QUESTIONS,
  ...BLOCK2_QUESTIONS,
  ...ARCHIVED_LEGACY_QUESTIONS
];

// Seed Initial Students Data
export const INITIAL_STUDENTS: Student[] = [
  {
    id: '12345',
    name: 'Ahmad Subagja',
    classGroup: 'XII RPL 1',
    class_name: 'XII RPL 1',
    angkatan: 2024,
    cohort: 2024,
    major: 'RPL',
    educationLevel: 'SMK',
    password: '123',
    iqScore: 118,
    eqScore: 58,
    riasecScores: { R: 8, I: 9, A: 7, S: 4, E: 6, C: 8 },
    dimensionScores: {
      'Penalaran Logika & Abstrak': 15,
      'Pemahaman Verbal & Bahasa': 12,
      'Analisis Angka & Kuantitatif': 15,
      'Pemahaman Spasial 3D': 12,
      'Kesadaran Diri (Self-Awareness)': 12,
      'Pengendalian Emosi (Self-Control)': 10,
      'Kedisiplinan & Tanggung Jawab': 15
    },
    lockedOut: false,
    lockReason: null,
    testStarted: true,
    testCompleted: true,
    status: 'SELESAI',
    testStartedAt: '2026-08-01T08:00:00.000Z',
    testCompletedAt: '2026-08-01T08:45:00.000Z',
    completedAt: '2026-08-01T08:45:00.000Z',
    currentQuestionIndex: 12,
    answers: {
      'q-iq-1': 'c-iq1-b',
      'q-iq-2': 'c-iq2-a',
      'q-iq-3': 'c-iq3-b',
      'q-eq-1': 'c-eq1-a',
      'q-holland-1': 'c-h1-a'
    },
    cheatWarnings: 0,
    aiAnalysis: `Berdasarkan analisis hasil psikotes CBT:
1. Potensi Kognitif (IQ 118 - High Average): Berpikir logis-matematis sangat kuat. Sangat berbakat di bidang arsitektur perangkat lunak, algoritma, dan rekayasa komputer.
2. Kecerdasan Emosional (EQ 88 - Baik): Memiliki ketahanan stres yang tinggi saat debugging kode dan mampu berkolaborasi dalam tim agile.
3. Kode Holland (IRS): Kombinasi khas problem solver vokasi teknologi modern.
4. Rekomendasi Jurusan & Karir: Software Engineer, Fullstack Web Developer, Cloud Solutions Architect.`,
    validationStatus: 'VALID',
    validationRecommendation: 'Hasil tes konsisten dan dapat dijadikan panduan karir.',
    completedTests: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: '12346',
    name: 'Siti Nurhaliza',
    classGroup: 'XII TKJ 2',
    class_name: 'XII TKJ 2',
    angkatan: 2024,
    cohort: 2024,
    major: 'TKJ',
    educationLevel: 'SMK',
    password: '123',
    iqScore: 112,
    eqScore: 60,
    riasecScores: { R: 9, I: 8, A: 4, S: 6, E: 5, C: 9 },
    dimensionScores: {
      'Penalaran Logika & Abstrak': 12,
      'Pemahaman Verbal & Bahasa': 10,
      'Analisis Angka & Kuantitatif': 12,
      'Kesadaran Diri (Self-Awareness)': 12,
      'Empati & Hubungan Interpersonal': 12
    },
    lockedOut: false,
    lockReason: null,
    testStarted: true,
    testCompleted: true,
    status: 'SELESAI',
    testStartedAt: '2026-08-01T09:00:00.000Z',
    testCompletedAt: '2026-08-01T09:40:00.000Z',
    completedAt: '2026-08-01T09:40:00.000Z',
    currentQuestionIndex: 10,
    answers: {
      'q-iq-1': 'c-iq1-b',
      'q-eq-1': 'c-eq1-a'
    },
    cheatWarnings: 0,
    aiAnalysis: `Siswa memiliki profil teknis dan kecerdasan jaringan yang menonjol. Sangat direkomendasikan untuk sertifikasi Cisco / MikroTik.`,
    validationStatus: 'VALID',
    validationRecommendation: 'Rekomendasi karir: Network Engineer, System Administrator.',
    completedTests: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'NIK-2026-001',
    name: 'Budi Kurniawan, S.T.',
    classGroup: 'Divisi HRD',
    class_name: 'Divisi HRD',
    angkatan: 2025,
    cohort: 2025,
    major: 'HRD',
    educationLevel: 'PERGURUAN_TINGGI',
    password: '123',
    iqScore: 125,
    eqScore: 64,
    riasecScores: { R: 4, I: 7, A: 6, S: 9, E: 9, C: 8 },
    dimensionScores: {
      'Penalaran Logika & Abstrak': 15,
      'Kesadaran Diri (Self-Awareness)': 12,
      'Pengambilan Keputusan Strategis': 15,
      'Pendelegasian & Pemberdayaan Tim': 15
    },
    lockedOut: false,
    lockReason: null,
    testStarted: true,
    testCompleted: true,
    status: 'SELESAI',
    testStartedAt: '2026-08-01T10:00:00.000Z',
    testCompletedAt: '2026-08-01T10:35:00.000Z',
    completedAt: '2026-08-01T10:35:00.000Z',
    currentQuestionIndex: 10,
    answers: {
      'q-iq-1': 'c-iq1-b',
      'q-eq-1': 'c-eq1-a'
    },
    cheatWarnings: 0,
    aiAnalysis: `Karyawan memiliki kecerdasan manajerial unggul. Sangat cocok untuk posisi Senior Manager / HR Director.`,
    validationStatus: 'VALID',
    validationRecommendation: 'Direkomendasikan untuk jenjang promosi eksekutif.',
    completedTests: ['IQ', 'EQ', 'Kepribadian', 'Kepemimpinan', 'Validitas']
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: "super", name: "Super Admin", role: "Superadmin", password: "super" },
  { id: "admin", name: "Pak Eko (Administrator)", role: "Admin", password: "admin" },
  { id: "bk", name: "Ibu Prita (Guru BK)", role: "Wali-Kelas", password: "bk", managed_class: "XII RPL 1" },
  { id: "kakomli", name: "Pak Bambang (Kakomli RPL)", role: "Kakomli", password: "kakomli", managed_major: "RPL" }
];

