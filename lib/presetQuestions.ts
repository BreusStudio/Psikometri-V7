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

// Seed Initial Students Data - Empty by default (All students sourced from Supabase)
export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: "super", name: "Super Admin", role: "Superadmin", password: "super" },
  { id: "admin", name: "Pak Eko (Administrator)", role: "Admin", password: "admin" },
  { id: "bk", name: "Ibu Prita (Guru BK)", role: "Wali-Kelas", password: "bk", managed_class: "XII RPL 1" },
  { id: "kakomli", name: "Pak Bambang (Kakomli RPL)", role: "Kakomli", password: "kakomli", managed_major: "RPL" }
];

