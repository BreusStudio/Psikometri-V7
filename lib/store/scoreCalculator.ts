import { Student, Question, Dimension, TestSettings, DimensionNormRange } from '../types';
import { evaluateStudentPsychometrics } from '../psychometrics/psychometricFacade';

/**
 * Calculates item-level score based on scoringType, isUnfavorable reverse scoring, and custom optionScores
 */
export function calculateItemScore(q: Question, selectedChoiceId: string): number {
  if (!selectedChoiceId) return 0;
  const choice = q.choices.find(c => c.id === selectedChoiceId);
  if (!choice) return 0;

  // Custom explicit option score mapping if provided
  if (q.optionScores && q.optionScores[selectedChoiceId] !== undefined) {
    return q.optionScores[selectedChoiceId];
  }

  // Binary scoring (Single Correct Answer)
  if (q.scoringType === 'binary') {
    if (q.correctChoiceId) {
      return q.correctChoiceId === selectedChoiceId ? (choice.scoreValue || 1) : 0;
    }
    return choice.scoreValue > 0 ? choice.scoreValue : 0;
  }

  let baseScore = choice.scoreValue;

  // Unfavorable / Reverse Scoring for Likert or Graduated scales
  if (q.isUnfavorable && q.choices.length > 1) {
    const scores = q.choices.map(c => c.scoreValue);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    baseScore = (max + min) - baseScore;
  }

  return baseScore;
}

/**
 * Evaluates dimension score against configured norm ranges
 */
export function evaluateDimensionScore(
  dimension: Dimension,
  rawScore: number,
  maxPossibleRaw: number = 100
): {
  normalizedScore: number;
  label: string;
  color: string;
  interpretation: string;
} {
  // If maxPossibleRaw was defaulted to 100 but rawScore is on a 0-20 scale (sub-test items)
  let effectiveMax = maxPossibleRaw;
  if (effectiveMax === 100 && rawScore <= 20) {
    effectiveMax = 20;
  }
  // Enforce boundary bounds: score can never exceed max (0% - 100%)
  const percentage = effectiveMax > 0 
    ? Math.min(100, Math.max(0, Math.round((rawScore / effectiveMax) * 100))) 
    : Math.min(100, Math.max(0, rawScore));
  
  const ranges = dimension.normRanges || [
    { min: 0, max: 40, label: 'Rendah', color: 'rose', interpretation: 'Perlu bimbingan dan pengembangan bertahap.' },
    { min: 41, max: 70, label: 'Cukup / Rata-rata', color: 'blue', interpretation: 'Memiliki kapasitas yang memadai pada aspek ini.' },
    { min: 71, max: 100, label: 'Tinggi / Unggul', color: 'emerald', interpretation: 'Potensi dominan dan kekuatan utama yang dapat diandalkan.' }
  ];

  // Match score against range
  const matchedRange = ranges.find(r => percentage >= r.min && percentage <= r.max) || ranges[ranges.length - 1];

  return {
    normalizedScore: percentage,
    label: matchedRange?.label || 'Standar',
    color: matchedRange?.color || 'blue',
    interpretation: matchedRange?.interpretation || dimension.description || 'Hasil evaluasi dimensi psikometrik.'
  };
}

export function generateStructuredAnalysis(student: Student) {
  const name = student.name || 'Siswa';
  const iq = student.iqScore || 100;
  const eq = student.eqScore || 50;
  const riasec = student.riasecScores || { R: 7, I: 7, A: 5, S: 5, E: 6, C: 7 };

  const sorted = Object.entries(riasec)
    .map(([key, val]) => ({ key, val: Number(val) || 0 }))
    .sort((a, b) => b.val - a.val);

  const code = sorted.slice(0, 3).map(item => item.key).join('') || 'CIR';
  const primary = sorted[0]?.key || 'C';

  let majors: string[] = [];
  let careers: string[] = [];
  let riasecDesc = '';

  switch (primary) {
    case 'R':
      majors = ['Rekayasa Perangkat Lunak (RPL)', 'Teknik Kendaraan Ringan (TKRO)', 'Teknik Pemesinan'];
      careers = ['Software Engineer/Developer', 'Teknisi Otomotif', 'Mechanical Supervisor'];
      riasecDesc = 'Siswa memiliki kecenderungan tipe Realistik yang tinggi. Menyukai aktivitas praktis yang melibatkan koordinasi fisik, pengerjaan alat, mesin, atau berkegiatan teknis.';
      break;
    case 'I':
      majors = ['Teknik Komputer & Jaringan (TKJ)', 'Kimia Analisis', 'Farmasi Klinis'];
      careers = ['Network Administrator', 'Analis Laboratorium', 'Asisten Apoteker/Riset'];
      riasecDesc = 'Siswa didominasi tipe Investigatif. Memiliki ketertarikan tinggi pada pemecahan masalah teoritis, analisis data, eksperimen, dan tugas logis matematis.';
      break;
    case 'A':
      majors = ['Desain Komunikasi Visual (DKV)', 'Kriya Kreatif Batik', 'Tata Busana'];
      careers = ['Graphic Designer / Ilustrator', 'Fashion Designer', 'Content Creator / Copywriter'];
      riasecDesc = 'Siswa menonjol di tipe Artistik. Lebih menyukai kebebasan berekspresi, pengerjaan proyek kreatif, estetika visual, serta menghindari aturan yang terlalu kaku.';
      break;
    case 'S':
      majors = ['Layanan Perbankan Syariah', 'Tata Kecantikan', 'Usaha Layanan Pariwisata (ULP)'];
      careers = ['Customer Service / Humas', 'Therapist / Beauty Specialist', 'Tour Guide / Event Organizer'];
      riasecDesc = 'Siswa memiliki kecenderungan Sosial yang kuat. Menyukai interaksi interpersonal, senang menolong orang lain, mendidik, atau melayani masyarakat.';
      break;
    case 'E':
      majors = ['Bisnis Digital (BD)', 'Manajemen Perkantoran', 'Pemasaran'];
      careers = ['Digital Marketer / Merchant', 'Entrepreneur / Wirausahawan', 'Sales Supervisor'];
      riasecDesc = 'Siswa mengarah pada tipe Enterprising (Giat). Sangat dinamis, menyukai tantangan kepemimpinan, jago bernegosiasi, membujuk orang lain, serta berorientasi target.';
      break;
    case 'C':
    default:
      majors = ['Akuntansi & Keuangan Lembaga (AKL)', 'Logistik', 'Perpajakan'];
      careers = ['Accounting Assistant', 'Database Administrator', 'Logistics Controller / Administrator'];
      riasecDesc = 'Siswa condong ke tipe Conventional (Konvensional). Sangat menyukai keteraturan, administrasi rapi, pengelolaan data/angka terstruktur, serta bekerja berdasarkan SOP yang jelas.';
      break;
  }

  const getIqCat = (s: number) => s >= 130 ? 'Sangat Superior' : s >= 120 ? 'Superior' : s >= 110 ? 'Diatas Rata-rata' : s >= 90 ? 'Rata-rata Normal' : s >= 80 ? 'Dibawah Rata-rata' : 'Perlu Bimbingan Khusus';
  const getEqCat = (s: number) => s >= 65 ? 'Sangat Tinggi (Sangat Stabil)' : s >= 55 ? 'Tinggi (Stabil)' : s >= 45 ? 'Rata-rata (Cukup Stabil)' : s >= 35 ? 'Sedang' : 'Perlu Latihan Regulasi Diri';

  return {
    cognitiveIqSummary: `Siswa "${name}" memiliki kemampuan kognitif berskor ${iq} (${getIqCat(iq)}). Menunjukkan kemampuan logika yang ${iq >= 100 ? "sangat baik dalam memproses pola spasial dan hubungan angka." : "memadai untuk mengikuti pelajaran dengan baik."}`,
    emotionalEqSummary: `Kecerdasan emosional berskor ${eq} (${getEqCat(eq)}). Siswa menunjukkan regulasi emosi yang ${eq >= 55 ? "tinggi, tangguh menghadapi tekanan ujian, dan memiliki empati sosial yang sehat." : "cukup baik dan mampu bersosialisasi secara positif."}`,
    riasecCode: code,
    riasecSummary: riasecDesc + ` Kombinasi kode kepribadian Holland ${code} menandakan potensi terbaik siswa dalam berkarya secara terorganisir dengan sentuhan teknis.`,
    recommendedMajors: majors,
    suggestedCareers: careers,
    developmentPlan: [
      `Fokuskan siswa pada program pengayaan di kompetensi keahlian ${majors[0]} melalui kunjungan industri.`,
      `Berikan pelatihan tambahan kepemimpinan atau manajemen proyek untuk memperkuat bakat interaksinya.`,
      `Guru BK dapat membantu mengarahkan minat magang industri (Prakerin) ke bidang yang menuntut tingkat presisi teknis/administratif.`,
      `Dorong siswa untuk mengikuti ekstrakurikuler yang relevan untuk melatih soft-skills kerja tim.`
    ],
    hasPotentialIssues: (eq && eq < 40) || (iq && iq < 85),
    detailedPsychologicalAnalysis: `Siswa menunjukkan profil psikologis dengan dominasi ${primary}. Secara kognitif, berada pada tingkat yang memadai untuk mengikuti pelajaran dengan baik. Dari sisi emosional, cukup stabil dan mampu bersosialisasi. Rekomendasi pendekatan bagi wali kelas adalah melakukan komunikasi personal secara berkala dan memberikan apresiasi pada setiap pencapaian teknisnya.`
  };
}

export function calculateStudentScores(
  student: Student,
  questions: Question[],
  dimensions: Dimension[],
  settings: TestSettings
) {
  // Delegate core calculations to the modular psychometrics facade engine
  const res = evaluateStudentPsychometrics(student, questions, dimensions, settings);

  // Synchronize validation status text on student object for UI compatibility
  let vStatus = "VALID";
  let vRec = "Hasil tes konsisten dan valid untuk interpretasi.";

  if (res.validity.status === 'INVALID') {
    vStatus = "INVALID - Jawaban Tidak Valid / Unreflective";
    vRec = "Direkomendasikan tes ulang (Re-test) dengan pengawasan.";
  } else if (res.validity.status === 'NEEDS_REVIEW') {
    vStatus = "WARNING - Perlu Peninjauan Psikolog";
    vRec = "Interpretasikan dengan hati-hati. Terdeteksi potensi pencitraan diri / inkonsistensi.";
  }

  student.validationStatus = vStatus;
  student.validationRecommendation = vRec;

  // Evaluate each dimension against its configured norm ranges
  const evaluatedDims: Record<string, {
    normalizedScore: number;
    label: string;
    color: string;
    interpretation: string;
    rawScore: number;
  }> = {};

  dimensions.forEach(dim => {
    let rawVal = student.dimensionScores ? student.dimensionScores[dim.name] : 0;
    if (rawVal === undefined || rawVal === null) {
      rawVal = 0;
    }

    const dimQuestions = questions.filter(q => q.dimension === dim.name || q.dimension === dim.code || q.dimension === dim.id);
    const answeredDimQuestions = dimQuestions.filter(q => student.answers && student.answers[q.id] !== undefined);
    const activeQuestions = answeredDimQuestions.length > 0 ? answeredDimQuestions : dimQuestions;

    let maxDimPossible = activeQuestions.reduce((acc, q) => {
      const optionScores = (q.choices || []).map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : (c.isCorrect ? 1 : 0)));
      return acc + (optionScores.length > 0 ? Math.max(...optionScores) : 1);
    }, 0);

    if (maxDimPossible === 0) {
      maxDimPossible = rawVal > 20 ? 100 : (rawVal > 0 ? rawVal : 20);
    }

    const safeRawVal = Math.min(Math.max(0, rawVal), maxDimPossible);
    const evalResult = evaluateDimensionScore(dim, safeRawVal, maxDimPossible);
    evaluatedDims[dim.name] = {
      ...evalResult,
      rawScore: safeRawVal
    };
  });

  student.evaluatedDimensions = evaluatedDims;

  // Auto-generate structured AI analysis if student completed test or has scores, but AI analysis is missing
  if (student.testCompleted || student.iqScore !== null) {
    const isAiString = typeof student.aiAnalysis === 'string';
    const isAiObject = student.aiAnalysis && typeof student.aiAnalysis === 'object';

    if (!isAiObject || !student.aiAnalysis.narrativeSummary) {
      const defaultAnalysis = generateStructuredAnalysis(student);
      const existingNarrative = isAiString ? student.aiAnalysis : (isAiObject ? student.aiAnalysis.narrativeSummary : undefined);

      student.aiAnalysis = {
        ...defaultAnalysis,
        ...(isAiObject ? student.aiAnalysis : {}),
        narrativeSummary: existingNarrative || defaultAnalysis.cognitiveIqSummary,
        validity: res.validity,
        confidenceScore: res.validity.confidenceScore
      };
    }
  }
}
