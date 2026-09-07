import { SchoolMajor, Dimension, TestType, Package } from '../types';

export const PRESET_MAJORS: SchoolMajor[] = [
  // SMK Konsentrasi Keahlian
  { id: 'maj-rpl', code: 'RPL', name: 'Rekayasa Perangkat Lunak', description: 'Pengembangan software, pemrograman web & mobile, database, dan AI.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-tkj', code: 'TKJ', name: 'Teknik Komputer & Jaringan', description: 'Infrastruktur jaringan, server, keamanan siber, dan sistem cloud.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-dkv', code: 'DKV', name: 'Desain Komunikasi Visual', description: 'Desain grafis, animasi, multimedia, branding, dan industri kreatif.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-akl', code: 'AKL', name: 'Akuntansi & Keuangan Lembaga', description: 'Pencatatan keuangan, perpajakan, audit, dan administrasi finansial.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-otkp', code: 'OTKP', name: 'Otomatisasi & Tata Kelola Perkantoran', description: 'Manajemen kearsipan, komunikasi publik, dan tata kelola sekretariat.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-tkro', code: 'TKRO', name: 'Teknik Kendaraan Ringan Otomotif', description: 'Perbaikan kendaraan bermotor, mekatronika, dan pemeliharaan mesin.', applicableContexts: ['sekolah_smk'] },
  { id: 'maj-bdp', code: 'BDP', name: 'Bisnis Daring & Pemasaran', description: 'Digital marketing, e-commerce, manajemen ritel, dan strategi penjualan.', applicableContexts: ['sekolah_smk'] },

  // SMA Peminatan
  { id: 'maj-mipa', code: 'MIPA', name: 'Matematika & Ilmu Pengetahuan Alam', description: 'Fokus penalaran sains, fisika, kimia, biologi, dan analitis matematis.', applicableContexts: ['sekolah_sma'] },
  { id: 'maj-ips', code: 'IPS', name: 'Ilmu Pengetahuan Sosial', description: 'Fokus sosiologi, ekonomi, geografi, dan pemahaman dinamika sosial.', applicableContexts: ['sekolah_sma'] },
  { id: 'maj-bhs', code: 'BHS', name: 'Bahasa & Budaya', description: 'Penguasaan sastra, linguistik, komunikasi antara budaya, dan bahasa asing.', applicableContexts: ['sekolah_sma'] },

  // SD / SMP Program
  { id: 'maj-reg', code: 'REG', name: 'Program Reguler / Umum', description: 'Kurikulum standar nasional pembentukan karakter dan kompetensi dasar.', applicableContexts: ['sekolah_sd', 'sekolah_smp'] },
  { id: 'maj-bil', code: 'BIL', name: 'Program Bilingual / Imersi', description: 'Pembelajaran berbasis pengantar bahasa internasional dan pengayaan.', applicableContexts: ['sekolah_sd', 'sekolah_smp'] },

  // Perusahaan / Swasta (Divisi / Jabatan)
  { id: 'maj-hrd', code: 'HRD', name: 'Human Resource & Development', description: 'Pengelolaan SDM, rekrutmen, pelatihan, dan manajemen kinerja.', applicableContexts: ['perusahaan'] },
  { id: 'maj-ops', code: 'OPS', name: 'Divisi Operasional & Logistik', description: 'Manajemen operasional, supply chain, dan efisiensi alur kerja.', applicableContexts: ['perusahaan'] },
  { id: 'maj-it', code: 'IT', name: 'IT & Software Engineering', description: 'Pengembangan teknologi informasi, infrastruktur cloud, dan keamanan data.', applicableContexts: ['perusahaan'] },
  { id: 'maj-fin', code: 'FIN', name: 'Finance & Accounting', description: 'Pengelolaan anggaran, perancangan keuangan, akuntansi, dan audit internal.', applicableContexts: ['perusahaan'] },
  { id: 'maj-mkt', code: 'MKT', name: 'Marketing & Sales', description: 'Pemasaran produk, ekspansi pasar, branding, dan manajemen penjualan.', applicableContexts: ['perusahaan'] },

  // Instansi Pemerintah
  { id: 'maj-asn', code: 'ASN', name: 'Administrasi & Pelayanan Publik', description: 'Tata kelola pemerintahan, kebijakan publik, dan pelayanan masyarakat.', applicableContexts: ['instansi_pemerintah'] },
  { id: 'maj-kebijakan', code: 'ANL', name: 'Analis Kebijakan & Tata Kelola', description: 'Evaluasi regulasi, perumusan kebijakan strategis, dan reformasi birokrasi.', applicableContexts: ['instansi_pemerintah'] },

  // Personal / Mandiri
  { id: 'maj-personal', code: 'PSN', name: 'Pengembangan Diri & Karir Mandiri', description: 'Pemetaan potensi pribadi, orientasi minat bakat, dan perencanaan karir independen.', applicableContexts: ['personal'] }
];

// 15-Minute Rotating Token Generator (Deterministic hash based on time block)
export function getRotatingToken(timestamp: number = Date.now()): { token: string; secondsLeft: number } {
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  const block = Math.floor(timestamp / FIFTEEN_MINUTES_MS);
  const nextBlockTime = (block + 1) * FIFTEEN_MINUTES_MS;
  const secondsLeft = Math.floor((nextBlockTime - timestamp) / 1000);

  // Simple deterministic pseudorandom 6-digit code based on time block
  const seed = (block * 314159 + 271828) % 1000000;
  const token = String(seed < 100000 ? seed + 100000 : seed);

  return { token, secondsLeft };
}

export const DEFAULT_AI_PROMPT_TEMPLATE = `Lakukan analisis psikometrik mendalam, komprehensif, dan sangat terstruktur untuk siswa SMK bernama "{studentName}" dengan profil hasil tes sebagai berikut:
- Tes IQ (Kognitif): Skor {iqScore} / 120 (Kategori: {iqCategory})
- Tes EQ (Emosi): Skor {eqScore} / 100 (Kategori: {eqCategory})
- Tes Holland RIASEC (Skor Min: 0, Maks: 10):
  * R (Realistic): {riasecR}
  * I (Investigative): {riasecI}
  * A (Artistic): {riasecA}
  * S (Social): {riasecS}
  * E (Enterprising): {riasecE}
  * C (Conventional): {riasecC}

Analisis detail jawaban per-dimensi spesifik yang dicapai oleh siswa: {dimensionAnswers}

Berikan laporan terstruktur, kaya informasi, dan sangat detail dalam bahasa Indonesia yang berfokus pada:
1. Ringkasan Kognitif & Logika (IQ): Jelaskan potensi pemecahan masalah secara logis-matematis, verbal, dan spasial siswa. Cantumkan rekomendasi gaya belajar terbaik (Visual, Auditori, atau Kinestetik) lengkap dengan taktik belajar mandiri konkret yang relevan bagi anak SMK.
2. Ringkasan Kecerdasan Emosional (EQ): Analisis kestabilan emosi siswa, kesiapan mental menghadapi lingkungan kerja industri (Prakerin/Magang), cara mengelola stres di bawah tekanan, serta kecenderungan empati sosial dan kerja sama tim.
3. Kode Tiga Huruf Holland tertinggi (contoh: RIA, CSE) beserta interpretasi mendalam untuk konteks pengembangan diri siswa SMK. Jelaskan bagaimana kombinasi tipe kepribadian karir ini memengaruhi orientasi kerja siswa.
4. Rekomendasi Jurusan SMK yang paling cocok (sebutkan 3 jurusan vokasional nyata di Indonesia, misal: Rekayasa Perangkat Lunak, Teknik Komputer Jaringan, Desain Komunikasi Visual, Akuntansi, Teknik Kendaraan Ringan Otomotif, Bisnis Digital, dll) lengkap dengan justifikasi rasional kenapa jurusan tersebut sesuai dengan profil kognitif dan kepribadiannya.
5. Rekomendasi Karir/Pekerjaan masa depan yang sangat relevan dan spesifik di industri saat ini.
6. Rencana pengembangan diri terpadu: Berikan rencana aksi berurutan dan konkret bagi siswa, saran tindakan bimbingan spesifik bagi Guru BK (preventif dan kuratif), serta keterlibatan orang tua dalam mendukung iklim belajar di rumah.
7. Identifikasi potensi masalah secara holistik: Apakah terdapat indikasi kesulitan konsentrasi, kecemasan berlebih, prokrastinasi, atau ketidakstabilan perilaku berdasarkan skor dimensi-dimensi yang rendah.
8. Analisis psikologis mendalam khusus bagi wali kelas: Berikan panduan gaya pendampingan yang disarankan, cara berkomunikasi, dan tindakan afektif di kelas agar siswa ini merasa didukung dan potensinya berkembang secara optimal.`;

export const DEFAULT_AI_SYSTEM_INSTRUCTION = `Anda adalah seorang Psikolog Pendidikan Senior, Konselor Bimbingan Konseling (BK), dan Pakar Penyelaras Karir Vokasi (SMK) di Indonesia. Buatlah laporan analisis psikometrik yang sangat mendalam, detail, komprehensif, mendidik, humanis, dan mudah dipahami oleh guru BK, wali kelas, orang tua, dan siswa itu sendiri. Gunakan format tulisan yang rapi, berbobot, profesional, dan kaya akan insight psikologis taktis.`;

export const PRESET_DIMENSIONS: Dimension[] = [
  { id: 'dim-iq-logic', code: 'LOGIC', name: 'Penalaran Logika & Abstrak', testType: 'IQ', description: 'Kemampuan analisis pola deduktif dan logika berpikir sistematis.' },
  { id: 'dim-iq-verbal', code: 'VERBAL', name: 'Pemahaman Verbal & Bahasa', testType: 'IQ', description: 'Kemampuan mengolah kata, pemahaman konsep, dan komunikasi lisan/tulis.' },
  { id: 'dim-iq-numerical', code: 'NUMERICAL', name: 'Analisis Angka & Kuantitatif', testType: 'IQ', description: 'Kemampuan manipulasi angka, hitungan cepat, dan penalaran statistik.' },
  { id: 'dim-iq-spatial', code: 'SPATIAL', name: 'Pemahaman Spasial 3D', testType: 'IQ', description: 'Visualisasi keruangan, rotasi objek, dan pemetaan bentuk visual.' },
  { id: 'dim-eq-self', code: 'SELF_AWARE', name: 'Kesadaran Diri (Self-Awareness)', testType: 'EQ', description: 'Pemahaman akan emosi diri, kelebihan, dan kelemahan pribadi.' },
  { id: 'dim-eq-regulation', code: 'REGULATION', name: 'Pengendalian Emosi (Self-Control)', testType: 'EQ', description: 'Kemampuan mengontrol dorongan emosional dan mengelola stres di bawah tekanan.' },
  { id: 'dim-eq-empathy', code: 'EMPATHY', name: 'Empati & Hubungan Interpersonal', testType: 'EQ', description: 'Sensitivitas terhadap emosi orang lain dan keterampilan membangun hubungan.' },
  { id: 'dim-eq-resilience', code: 'RESILIENCE', name: 'Daya Tahan Stres & Resiliensi', testType: 'EQ', description: 'Ketangguhan bangkit dari kegagalan dan ketahanan menghadapi rintangan.' },
  { id: 'dim-riasec-r', code: 'RIASEC_R', name: 'Realistic (Mekanik & Lapangan)', testType: 'Holland', description: 'Minat pada pekerjaan praktikal, penggunaan mesin, alat, dan kegiatan outdoor.' },
  { id: 'dim-riasec-i', code: 'RIASEC_I', name: 'Investigative (Analitis & Riset)', testType: 'Holland', description: 'Minat pada observasi, riset ilmiah, matematika, dan pemecahan masalah.' },
  { id: 'dim-riasec-a', code: 'RIASEC_A', name: 'Artistic (Kreatif & Seni)', testType: 'Holland', description: 'Minat pada ekspresi kreatif, seni, desain, musik, dan kebebasan berkarya.' },
  { id: 'dim-riasec-s', code: 'RIASEC_S', name: 'Social (Edukasi & Pelayanan)', testType: 'Holland', description: 'Minat membantu, mengajar, membimbing, dan melayani masyarakat.' },
  { id: 'dim-riasec-e', code: 'RIASEC_E', name: 'Enterprising (Bisnis & Persuasi)', testType: 'Holland', description: 'Minat memimpin, mempengaruhi orang, bisnis, dan pencapaian target.' },
  { id: 'dim-riasec-c', code: 'RIASEC_C', name: 'Conventional (Terstruktur & Detail)', testType: 'Holland', description: 'Minat pada ketelitian angka, administrasi data, dan prosedur teratur.' },
  { id: 'dim-pers-discipline', code: 'DISCIPLINE', name: 'Kedisiplinan & Tanggung Jawab', testType: 'Kepribadian', description: 'Sikap patuh pada aturan, ketepatan waktu, dan integritas kerja.' },
  { id: 'dim-pers-teamwork', code: 'TEAMWORK', name: 'Kerjasama & Kolaborasi Tim', testType: 'Kepribadian', description: 'Kemampuan bekerja dalam tim, keluwesan antarpribadi, dan koordinasi.' },
  { id: 'dim-pers-adaptability', code: 'ADAPTABILITY', name: 'Adaptabilitas & Fleksibilitas', testType: 'Kepribadian', description: 'Kemampuan menyesuaikan diri dengan perubahan lingkungan dan teknologi.' },
  { id: 'dim-valid-honesty', code: 'HONESTY', name: 'Kejujuran & Konsistensi Jawaban', testType: 'Validitas', description: 'Tingkat kesungguhan pengerjaan tes dan deteksi kecenderungan simpangan.' },
  { id: 'dim-lead-decision', code: 'LEAD_DECISION', name: 'Pengambilan Keputusan Strategis', testType: 'Kepemimpinan', description: 'Kemampuan mengambil keputusan tegas, berisiko terukur, dan berdampak luas.' },
  { id: 'dim-lead-delegation', code: 'LEAD_DELEGATION', name: 'Pendelegasian & Pemberdayaan Tim', testType: 'Kepemimpinan', description: 'Kemampuan membagi wewenang dan membina potensi anggota tim.' }
];

export const PRESET_TEST_TYPES: TestType[] = [
  {
    id: 'IQ',
    name: 'Tes Potensi Kognitif (IQ)',
    description: 'Asesmen kemampuan berpikir logis-matematis, verbal, dan penalaran spasial.',
    isSystem: true,
    applicableContexts: ['sekolah_sd', 'sekolah_smp', 'sekolah_sma', 'sekolah_smk', 'personal', 'perusahaan', 'instansi_pemerintah'],
    duration: 15,
    durationMinutes: 15,
    questionLimit: 8,
    totalQuestions: 8,
    scoringEngine: 'standard',
    pricePerUser: 10000
  },
  {
    id: 'EQ',
    name: 'Tes Kecerdasan Emosional (EQ)',
    description: 'Asesmen kesadaran diri, pengendalian emosi, empati, dan resiliensi di bawah tekanan.',
    isSystem: true,
    applicableContexts: ['sekolah_smp', 'sekolah_sma', 'sekolah_smk', 'personal', 'perusahaan', 'instansi_pemerintah'],
    duration: 15,
    durationMinutes: 15,
    questionLimit: 8,
    totalQuestions: 8,
    scoringEngine: 'standard',
    pricePerUser: 8000
  },
  {
    id: 'Holland',
    name: 'Tes Minat Karir (Holland RIASEC)',
    description: 'Asesmen kesesuaian orientasi bidang kerja vokasi dan profesi industri (R-I-A-S-E-C).',
    isSystem: true,
    applicableContexts: ['sekolah_smp', 'sekolah_sma', 'sekolah_smk', 'personal', 'perusahaan'],
    duration: 15,
    durationMinutes: 15,
    questionLimit: 12,
    totalQuestions: 12,
    scoringEngine: 'riasec',
    pricePerUser: 7000
  },
  {
    id: 'Kepribadian',
    name: 'Tes Kepribadian & Work Style',
    description: 'Asesmen karakter, kedisiplinan, keterbukaan ide, adaptabilitas, dan kerja sama tim.',
    isSystem: true,
    applicableContexts: ['sekolah_sma', 'sekolah_smk', 'personal', 'perusahaan', 'instansi_pemerintah'],
    duration: 45,
    durationMinutes: 45,
    questionLimit: 50,
    totalQuestions: 50,
    scoringEngine: 'standard',
    pricePerUser: 8000
  },
  {
    id: 'Validitas',
    name: 'Tes Skala Kejujuran & Validitas',
    description: 'Instrumen deteksi konsistensi jawaban, kesungguhan pengerjaan, dan kecenderungan faking.',
    isSystem: true,
    applicableContexts: ['sekolah_sd', 'sekolah_smp', 'sekolah_sma', 'sekolah_smk', 'personal', 'perusahaan', 'instansi_pemerintah'],
    duration: 15,
    durationMinutes: 15,
    questionLimit: 12,
    totalQuestions: 12,
    scoringEngine: 'standard',
    pricePerUser: 5000
  },
  {
    id: 'Kepemimpinan',
    name: 'Tes Kompetensi Kepemimpinan & Manajemen',
    description: 'Asesmen kapabilitas keputusan strategis, pendelegasian, dan kepemimpinan tim.',
    isSystem: false,
    applicableContexts: ['perusahaan', 'instansi_pemerintah', 'personal'],
    duration: 15,
    durationMinutes: 15,
    questionLimit: 10,
    totalQuestions: 10,
    scoringEngine: 'standard',
    pricePerUser: 10000
  },
  {
    id: 'Gaya Belajar',
    name: 'Tes Modalitas Gaya Belajar',
    description: 'Identifikasi modalitas belajar dominan (Visual, Auditori, Kinestetik) untuk efisiensi studi.',
    isSystem: false,
    applicableContexts: ['sekolah_sd', 'sekolah_smp', 'sekolah_sma', 'sekolah_smk', 'personal'],
    duration: 10,
    durationMinutes: 10,
    questionLimit: 10,
    totalQuestions: 10,
    scoringEngine: 'vak',
    pricePerUser: 5000
  }
];

export const PRESET_PACKAGES: Package[] = [
  {
    id: 'pkg-personal-b2c',
    name: 'Paket Personal / Mandiri (B2C)',
    category: 'personal',
    description: 'Layanan mandiri pemetaan potensi kognitif, minat karir RIASEC, gaya belajar, dan evaluasi pribadi.',
    pricePerAccount: 25000,
    quota: 1,
    testCount: 1,
    price: 25000,
    discountPercentage: 0,
    active: true,
    popular: true,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian']
  },
  {
    id: 'pkg-sd-mi',
    name: 'Paket Sekolah Dasar (SD / MI)',
    category: 'school_sd',
    description: 'Pemetaan gaya belajar VAK, kecerdasan majemuk, dan modalitas kognitif awal siswa sekolah dasar.',
    pricePerAccount: 10000,
    quota: 50,
    testCount: 50,
    price: 500000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['Gaya Belajar', 'Kecerdasan Majemuk']
  },
  {
    id: 'pkg-smp-mts',
    name: 'Paket Sekolah Menengah Pertama (SMP / MTs)',
    category: 'school_smp',
    description: 'Pemetaan potensi akademik, bakat kognitif dasar, serta minat penjurusan sekolah menengah pertama.',
    pricePerAccount: 12500,
    quota: 50,
    testCount: 50,
    price: 625000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['IQ', 'EQ', 'Holland', 'Gaya Belajar']
  },
  {
    id: 'pkg-vokasi-a',
    name: 'Paket Paralel Vokasi A (Blok 1 - 200 Butir)',
    packageCode: 'PKG-VOKASI-A',
    isParallelPackage: true,
    category: 'school_sma',
    description: 'Bank Soal Psikometrik Terstandar Blok 1 (200 Butir: EQ Situational Judgment, IQ Penalaran Logika-Kuantitatif-Spasial, Kepribadian Big Five, Holland RIASEC, & Validitas Konsistensi).',
    pricePerAccount: 15000,
    quota: 100,
    testCount: 100,
    price: 1500000,
    discountPercentage: 0,
    active: true,
    popular: true,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'pkg-vokasi-b',
    name: 'Paket Paralel Vokasi B (Blok 2 - 200 Butir)',
    packageCode: 'PKG-VOKASI-B',
    isParallelPackage: true,
    category: 'school_sma',
    description: 'Bank Soal Paralel Ekivalen Blok 2 (200 Butir Ekivalen untuk rotasi butir, pencegahan bias pengulangan, dan CBT berkeadilan tinggi).',
    pricePerAccount: 15000,
    quota: 100,
    testCount: 100,
    price: 1500000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'pkg-vokasi-dynamic',
    name: 'Paket Vokasi Multi-Blok (Dynamic Random Draw)',
    packageCode: 'PKG-VOKASI-DYNAMIC',
    isParallelPackage: true,
    category: 'school_sma',
    description: 'Pengundian butir acak proporsional berimbang dari gabungan Blok 1 & Blok 2 (Total 400 butir) untuk variasi soal maksimal antar-siswa.',
    pricePerAccount: 17500,
    quota: 100,
    testCount: 100,
    price: 1750000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'pkg-smk-vokasi',
    name: 'Paket Vokasi SMK & SMA Standard',
    category: 'school_sma',
    description: 'Layanan lengkap psikotes pemetaan minat bakat, potensi IQ, EQ, Holland RIASEC, dan validitas konsistensi.',
    pricePerAccount: 15000,
    quota: 100,
    testCount: 100,
    price: 1500000,
    discountPercentage: 0,
    active: true,
    popular: true,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'pkg-perguruan-tinggi',
    name: 'Paket Perguruan Tinggi & Mahasiswa',
    category: 'kuliah',
    description: 'Pemetaan potensi akademik tingkat lanjut, readiness karir lulusan, kecocokan bidang spesialisasi.',
    pricePerAccount: 20000,
    quota: 100,
    testCount: 100,
    price: 2000000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']
  },
  {
    id: 'pkg-gov-asn',
    name: 'Paket Asesmen Pegawai ASN / Instansi',
    category: 'pemerintahan',
    description: 'Layanan evaluasi kompetensi pegawai pemerintah, analisis kinerja, kepemimpinan, dan integritas kerja.',
    pricePerAccount: 30000,
    quota: 100,
    testCount: 100,
    price: 3000000,
    discountPercentage: 0,
    active: true,
    popular: false,
    testTypes: ['IQ', 'EQ', 'Kepribadian', 'Kepemimpinan', 'Validitas']
  },
  {
    id: 'pkg-corporate-exec',
    name: 'Paket Rekrutmen & Executive Assessment (B2B)',
    category: 'pt_cv',
    description: 'Layanan profesional penilaian calon karyawan, promosi jabatan, kepemimpinan, dan kecocokan tim korporat.',
    pricePerAccount: 35000,
    quota: 100,
    testCount: 100,
    price: 3500000,
    discountPercentage: 0,
    active: true,
    popular: true,
    testTypes: ['IQ', 'EQ', 'Kepribadian', 'Kepemimpinan', 'Validitas']
  }
];

