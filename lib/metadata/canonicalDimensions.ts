import { Dimension } from '../core/types';

/**
 * CANONICAL_DIMENSIONS
 * Standard Master Registry for Psychometric Dimensions (18 Standard Dimensions).
 * All AI categorizations, Excel imports, and scoring logic normalize into these keys.
 */
export const CANONICAL_DIMENSIONS: Dimension[] = [
  // 1. KOGNITIF (IQ) - 4 Pilar Utama
  {
    id: 'dim-iq-logic',
    code: 'LOGIC',
    name: 'Penalaran Logika & Abstrak',
    testType: 'IQ',
    description: 'Kemampuan analisis pola deduktif, induktif, dan logika berpikir sistematis.'
  },
  {
    id: 'dim-iq-verbal',
    code: 'VERBAL',
    name: 'Pemahaman Verbal & Bahasa',
    testType: 'IQ',
    description: 'Kemampuan mengolah kata, analogi verbal, dan penalaran semantik.'
  },
  {
    id: 'dim-iq-numerical',
    code: 'NUMERICAL',
    name: 'Analisis Angka & Kuantitatif',
    testType: 'IQ',
    description: 'Kemampuan manipulasi angka, deret aritmatika, dan penalaran matematis.'
  },
  {
    id: 'dim-iq-spatial',
    code: 'SPATIAL',
    name: 'Pemahaman Spasial 3D',
    testType: 'IQ',
    description: 'Visualisasi keruangan 2D/3D, rotasi objek, dan rekonstruksi pola visual.'
  },

  // 2. EMOSIONAL (EQ) - 4 Pilar Utama
  {
    id: 'dim-eq-self',
    code: 'SELF_AWARE',
    name: 'Kesadaran Diri (Self-Awareness)',
    testType: 'EQ',
    description: 'Kemampuan mengenali emosi pribadi, kekuatan, dan batas diri.'
  },
  {
    id: 'dim-eq-regulation',
    code: 'REGULATION',
    name: 'Pengendalian Emosi (Self-Control)',
    testType: 'EQ',
    description: 'Kemampuan mengelola dorongan emosi, mengontrol impuls, dan kestabilan di bawah tekanan.'
  },
  {
    id: 'dim-eq-empathy',
    code: 'EMPATHY',
    name: 'Empati & Hubungan Interpersonal',
    testType: 'EQ',
    description: 'Sensitivitas sosial, pemahaman sudut pandang orang lain, dan kepekaan afektif.'
  },
  {
    id: 'dim-eq-resilience',
    code: 'RESILIENCE',
    name: 'Daya Tahan Stres & Resiliensi',
    testType: 'EQ',
    description: 'Ketangguhan bangkit dari kegagalan, toleransi frustrasi, dan adaptabilitas mental.'
  },

  // 3. HOLLAND RIASEC (Minat Karir) - 6 Pilar
  {
    id: 'dim-riasec-r',
    code: 'RIASEC_R',
    name: 'Realistic (Mekanik & Lapangan)',
    testType: 'Holland',
    description: 'Minat pada aktivitas praktis, mesin, perkakas, konstruksi, dan outdoor.'
  },
  {
    id: 'dim-riasec-i',
    code: 'RIASEC_I',
    name: 'Investigative (Analitis & Riset)',
    testType: 'Holland',
    description: 'Minat pada penyelidikan ilmiah, analisis data, eksperimen, dan eksplorasi teoritis.'
  },
  {
    id: 'dim-riasec-a',
    code: 'RIASEC_A',
    name: 'Artistic (Kreatif & Seni)',
    testType: 'Holland',
    description: 'Minat pada ekspresi artistik, desain visual, sastra, musik, dan kreasi inovatif.'
  },
  {
    id: 'dim-riasec-s',
    code: 'RIASEC_S',
    name: 'Social (Edukasi & Pelayanan)',
    testType: 'Holland',
    description: 'Minat pada pendampingan manusia, pelayanan sosial, konseling, dan kerja kolaboratif.'
  },
  {
    id: 'dim-riasec-e',
    code: 'RIASEC_E',
    name: 'Enterprising (Bisnis & Persuasi)',
    testType: 'Holland',
    description: 'Minat pada kepemimpinan tim, negosiasi bisnis, penjualan, dan inisiatif usaha.'
  },
  {
    id: 'dim-riasec-c',
    code: 'RIASEC_C',
    name: 'Conventional (Terstruktur & Detail)',
    testType: 'Holland',
    description: 'Minat pada manajemen data teratur, akurasi administrasi, kepatuhan SOP, dan pembukuan.'
  },

  // 4. KEPRIBADIAN & WORK STYLE - 3 Pilar
  {
    id: 'dim-pers-discipline',
    code: 'DISCIPLINE',
    name: 'Kedisiplinan & Tanggung Jawab',
    testType: 'Kepribadian',
    description: 'Ketepatan waktu, integritas moral, komitmen tugas, dan kepatuhan aturan kerja.'
  },
  {
    id: 'dim-pers-teamwork',
    code: 'TEAMWORK',
    name: 'Kerjasama & Kolaborasi Tim',
    testType: 'Kepribadian',
    description: 'Keterbukaan ide, partisipasi aktif kelompok, dan resolusi konflik konstruktif.'
  },
  {
    id: 'dim-pers-adaptability',
    code: 'ADAPTABILITY',
    name: 'Adaptabilitas & Fleksibilitas',
    testType: 'Kepribadian',
    description: 'Kemampuan beradaptasi dengan perubahan teknologi, peran baru, dan lingkungan dinamis.'
  },

  // 5. SKALA VALIDITAS & KONSISTENSI - 1 Pilar
  {
    id: 'dim-valid-honesty',
    code: 'HONESTY',
    name: 'Kejujuran & Konsistensi Jawaban',
    testType: 'Validitas',
    description: 'Deteksi kecenderungan pencitraan sosial (*social desirability* / *faking good*) dan konsistensi respon.'
  }
];

/**
 * Normalizes any dimension string into one of the canonical names.
 */
export function normalizeCanonicalDimension(nameOrCode: string | undefined | null, testTypeHint?: string): string {
  if (!nameOrCode) return 'Penalaran Logika & Abstrak';
  const clean = String(nameOrCode).trim().toLowerCase();

  // 1. Exact canonical matches
  for (const c of CANONICAL_DIMENSIONS) {
    if (c.name.toLowerCase() === clean || c.code.toLowerCase() === clean || c.id.toLowerCase() === clean) {
      return c.name;
    }
  }

  // 2. IQ Dimension Mapping
  if (clean.includes('logik') || clean.includes('abstrak') || clean.includes('deduktif') || clean.includes('induktif') || clean.includes('pola') || clean.includes('silogisme')) {
    return 'Penalaran Logika & Abstrak';
  }
  if (clean.includes('verbal') || clean.includes('bahasa') || clean.includes('kata') || clean.includes('sinonim') || clean.includes('antonim') || clean.includes('analogi') || clean.includes('pemahaman bacaan')) {
    return 'Pemahaman Verbal & Bahasa';
  }
  if (clean.includes('angka') || clean.includes('kuantitatif') || clean.includes('hitung') || clean.includes('numerik') || clean.includes('aritmatika') || clean.includes('matematika')) {
    return 'Analisis Angka & Kuantitatif';
  }
  if (clean.includes('spasial') || clean.includes('ruang') || clean.includes('3d') || clean.includes('figural') || clean.includes('gambar') || clean.includes('rotasi')) {
    return 'Pemahaman Spasial 3D';
  }

  // 3. EQ Dimension Mapping
  if (clean.includes('sadar') || clean.includes('self-aware') || clean.includes('kesadaran diri') || clean.includes('mengenali diri') || clean.includes('intrapersonal')) {
    return 'Kesadaran Diri (Self-Awareness)';
  }
  if (clean.includes('kendali') || clean.includes('kontrol') || clean.includes('self-control') || clean.includes('pengendalian emosi') || clean.includes('regulasi') || clean.includes('impuls')) {
    return 'Pengendalian Emosi (Self-Control)';
  }
  if (clean.includes('empati') || clean.includes('empathy') || clean.includes('interpersonal') || clean.includes('sosial') || clean.includes('hubungan') || clean.includes('kepekaan')) {
    return 'Empati & Hubungan Interpersonal';
  }
  if (clean.includes('resiliensi') || clean.includes('resilience') || clean.includes('stres') || clean.includes('daya tahan') || clean.includes('ketahanan') || clean.includes('tekanan') || clean.includes('frustrasi')) {
    return 'Daya Tahan Stres & Resiliensi';
  }

  // 4. Holland RIASEC Mapping
  if (clean.includes('realis') || clean === 'r' || clean.includes('mekanik') || clean.includes('lapangan')) {
    return 'Realistic (Mekanik & Lapangan)';
  }
  if (clean.includes('investiga') || clean === 'i' || clean.includes('analitis') || clean.includes('riset') || clean.includes('sains')) {
    return 'Investigative (Analitis & Riset)';
  }
  if (clean.includes('artist') || clean === 'a' || clean.includes('kreatif') || clean.includes('seni') || clean.includes('desain')) {
    return 'Artistic (Kreatif & Seni)';
  }
  if (clean.includes('social') || clean.includes('sosial') || clean === 's' || clean.includes('pelayanan') || clean.includes('edukasi')) {
    return 'Social (Edukasi & Pelayanan)';
  }
  if (clean.includes('enterpris') || clean.includes('giat') || clean === 'e' || clean.includes('bisnis') || clean.includes('persuasi') || clean.includes('pemimpin')) {
    return 'Enterprising (Bisnis & Persuasi)';
  }
  if (clean.includes('convent') || clean.includes('konvensional') || clean === 'c' || clean.includes('detail') || clean.includes('administrasi') || clean.includes('terstruktur')) {
    return 'Conventional (Terstruktur & Detail)';
  }

  // 5. Kepribadian Mapping
  if (clean.includes('disiplin') || clean.includes('tanggung jawab') || clean.includes('integritas') || clean.includes('aturan')) {
    return 'Kedisiplinan & Tanggung Jawab';
  }
  if (clean.includes('kerja sama') || clean.includes('kerjasama') || clean.includes('teamwork') || clean.includes('kolaborasi')) {
    return 'Kerjasama & Kolaborasi Tim';
  }
  if (clean.includes('adapt') || clean.includes('fleksibel') || clean.includes('penyesuaian')) {
    return 'Adaptabilitas & Fleksibilitas';
  }

  // 6. Validitas
  if (clean.includes('jujur') || clean.includes('valid') || clean.includes('faking') || clean.includes('konsisten')) {
    return 'Kejujuran & Konsistensi Jawaban';
  }

  // 7. Fallback based on testTypeHint
  if (testTypeHint) {
    const hint = testTypeHint.toUpperCase().trim();
    if (hint === 'IQ') return 'Penalaran Logika & Abstrak';
    if (hint === 'EQ') return 'Kesadaran Diri (Self-Awareness)';
    if (hint === 'HOLLAND') return 'Realistic (Mekanik & Lapangan)';
    if (hint === 'KEPRIBADIAN') return 'Kedisiplinan & Tanggung Jawab';
    if (hint === 'VALIDITAS') return 'Kejujuran & Konsistensi Jawaban';
  }

  return 'Penalaran Logika & Abstrak';
}
