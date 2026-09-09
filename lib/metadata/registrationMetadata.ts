export type RegistrationCategoryType = 'personal' | 'sekolah' | 'kampus' | 'instansi' | 'perusahaan';

export interface RegistrationTypeOption {
  id: RegistrationCategoryType;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  isB2B: boolean;
  requiresToken: boolean;
  defaultQuota: number;
  subTypes?: { id: string; label: string }[];
}

export const REGISTRATION_TYPE_OPTIONS: RegistrationTypeOption[] = [
  {
    id: 'personal',
    title: 'Peserta Personal / Mandiri',
    description: 'Pendaftaran mandiri untuk individu. Tanpa token, akun langsung aktif setelah verifikasi.',
    iconName: 'User',
    isB2B: false,
    requiresToken: false,
    defaultQuota: 1,
  },
  {
    id: 'sekolah',
    title: 'Sekolah (SD / SMP / SMA / SMK)',
    description: 'Pendaftaran kolektif sekolah untuk siswa (pemetaan bakat minat, RIASEC, & TPA).',
    iconName: 'School',
    badge: 'Diskon Kuota Massal',
    isB2B: true,
    requiresToken: true,
    defaultQuota: 50,
    subTypes: [
      { id: 'SMK', label: 'Sekolah Menengah Kejuruan (SMK Vokasi)' },
      { id: 'SMA', label: 'Sekolah Menengah Atas / MA (SMA)' },
      { id: 'SMP', label: 'Sekolah Menengah Pertama / MTs (SMP)' },
      { id: 'SD', label: 'Sekolah Dasar / MI (SD)' },
    ]
  },
  {
    id: 'kampus',
    title: 'Kampus / Universitas',
    description: 'Tes asesmen mahasiswa, seleksi jurusan, dan kesiapan karir perguruan tinggi.',
    iconName: 'GraduationCap',
    badge: 'Perguruan Tinggi',
    isB2B: true,
    requiresToken: true,
    defaultQuota: 100,
  },
  {
    id: 'instansi',
    title: 'Instansi / Perusahaan',
    description: 'Rekrutmen pegawai, talent mapping, evaluasi kepemimpinan, dan kecerdasan kerja.',
    iconName: 'Building2',
    badge: 'Korporat & B2B',
    isB2B: true,
    requiresToken: true,
    defaultQuota: 30,
    subTypes: [
      { id: 'Perusahaan', label: 'Swasta / Korporasi' },
      { id: 'Instansi', label: 'Instansi Pemerintah / BUMN' },
      { id: 'Lainnya', label: 'Organisasi / Yayasan' },
    ]
  }
];

export interface TestModulePricingOption {
  id: string; // e.g. 'IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas', 'Kepemimpinan', 'Gaya Belajar'
  name: string;
  category: string;
  description: string;
  pricePerUser: number;
  durationMinutes: number;
  questionCount: number;
  badge?: string;
  isPopular?: boolean;
}

export const AVAILABLE_TEST_MODULES: TestModulePricingOption[] = [
  {
    id: 'IQ',
    name: 'Tes Potensi Kognitif (IQ)',
    category: 'Kognitif & Logika',
    description: 'Penalaran logis-matematis, verbal, dan kemampuan spasial keruangan.',
    pricePerUser: 15000,
    durationMinutes: 15,
    questionCount: 8,
    badge: 'Sangat Direkomendasikan',
    isPopular: true
  },
  {
    id: 'Holland',
    name: 'Tes Minat Bakat Karir (Holland RIASEC)',
    category: 'Orientasi Karir',
    description: 'Pemetaan orientasi karir vokasi, gaya kerja, dan rekomendasi jurusan.',
    pricePerUser: 15000,
    durationMinutes: 15,
    questionCount: 12,
    badge: 'Favorit Sekolah',
    isPopular: true
  },
  {
    id: 'EQ',
    name: 'Tes Kecerdasan Emosional (EQ)',
    category: 'Emosi & Resiliensi',
    description: 'Kesadaran diri, regulasi emosi, empati, dan daya tahan stres di tempat kerja.',
    pricePerUser: 10000,
    durationMinutes: 15,
    questionCount: 8
  },
  {
    id: 'Kepribadian',
    name: 'Tes Kepribadian & Work Style',
    category: 'Karakter & Etika',
    description: 'Evaluasi kedisiplinan, dinamika kerja sama tim, dan adaptabilitas.',
    pricePerUser: 12000,
    durationMinutes: 45,
    questionCount: 50
  },
  {
    id: 'Validitas',
    name: 'Tes Skala Kejujuran & Validitas',
    category: 'Integritas Pengerjaan',
    description: 'Deteksi konsistensi jawaban, kecenderungan manipulasi, dan kesungguhan.',
    pricePerUser: 8000,
    durationMinutes: 15,
    questionCount: 12
  },
  {
    id: 'Kepemimpinan',
    name: 'Tes Kompetensi Kepemimpinan & Manajemen',
    category: 'Manajerial & Leadership',
    description: 'Keputusan strategis, pendelegasian wewenang, dan kepemimpinan tim.',
    pricePerUser: 20000,
    durationMinutes: 15,
    questionCount: 10
  },
  {
    id: 'Gaya Belajar',
    name: 'Tes Modalitas Gaya Belajar (VAK)',
    category: 'Gaya Belajar',
    description: 'Pemetaan gaya belajar dominan (Visual, Auditori, Kinestetik).',
    pricePerUser: 8000,
    durationMinutes: 10,
    questionCount: 10
  }
];

export function getDynamicTestModules(customTestTypes?: any[]): TestModulePricingOption[] {
  if (!customTestTypes || customTestTypes.length === 0) {
    return AVAILABLE_TEST_MODULES;
  }

  return AVAILABLE_TEST_MODULES.map(staticMod => {
    const match = customTestTypes.find((t: any) => 
      t.id === staticMod.id || 
      t.id?.toLowerCase() === staticMod.id?.toLowerCase() ||
      (t.name && staticMod.name && t.name.toLowerCase().includes(staticMod.id.toLowerCase()))
    );
    if (match && match.pricePerUser !== undefined && Number(match.pricePerUser) >= 0) {
      return { 
        ...staticMod, 
        pricePerUser: Number(match.pricePerUser),
        durationMinutes: match.duration || match.durationMinutes || staticMod.durationMinutes,
        questionCount: match.questionLimit || match.totalQuestions || staticMod.questionCount
      };
    }
    return staticMod;
  });
}

export const REGISTRATION_EXPIRY_HOURS = 48; // 2x24 Jam

export function calculateRegistrationPrice(
  selectedModuleIds: string[],
  studentCount: number = 1,
  customTestTypes?: any[]
): {
  basePricePerStudent: number;
  discountPercentage: number;
  discountedPricePerStudent: number;
  subtotal: number;
  discountAmount: number;
  finalTotalAmount: number;
} {
  const dynamicModules = getDynamicTestModules(customTestTypes);
  const selectedModules = dynamicModules.filter(m => selectedModuleIds.includes(m.id));
  const basePricePerStudent = selectedModules.reduce((sum, m) => sum + m.pricePerUser, 0);

  let discountPercentage = 0;
  if (studentCount >= 200) {
    discountPercentage = 25; // 25% discount for 200+
  } else if (studentCount >= 100) {
    discountPercentage = 20; // 20% discount for 100-199
  } else if (studentCount >= 50) {
    discountPercentage = 15; // 15% discount for 50-99
  } else if (studentCount >= 20) {
    discountPercentage = 10; // 10% discount for 20-49
  }

  const discountedPricePerStudent = Math.round(basePricePerStudent * (1 - discountPercentage / 100));
  const subtotal = basePricePerStudent * studentCount;
  const finalTotalAmount = discountedPricePerStudent * studentCount;
  const discountAmount = subtotal - finalTotalAmount;

  return {
    basePricePerStudent,
    discountPercentage,
    discountedPricePerStudent,
    subtotal,
    discountAmount,
    finalTotalAmount
  };
}

export function isRegistrationExpired(submittedAtString: string, hoursLimit: number = REGISTRATION_EXPIRY_HOURS): boolean {
  if (!submittedAtString) return false;
  const submittedDate = new Date(submittedAtString).getTime();
  if (isNaN(submittedDate)) return false;
  const now = Date.now();
  const diffHours = (now - submittedDate) / (1000 * 60 * 60);
  return diffHours >= hoursLimit;
}

export function getRegistrationExpiryTimeLeft(submittedAtString: string, hoursLimit: number = REGISTRATION_EXPIRY_HOURS): {
  isExpired: boolean;
  hoursLeft: number;
  minutesLeft: number;
  formattedText: string;
} {
  if (!submittedAtString) {
    return { isExpired: false, hoursLeft: 48, minutesLeft: 0, formattedText: '48j 0m' };
  }
  const submittedDate = new Date(submittedAtString).getTime();
  if (isNaN(submittedDate)) {
    return { isExpired: false, hoursLeft: 48, minutesLeft: 0, formattedText: '48j 0m' };
  }
  const expiryDate = submittedDate + hoursLimit * 60 * 60 * 1000;
  const now = Date.now();
  const diffMs = expiryDate - now;

  if (diffMs <= 0) {
    return { isExpired: true, hoursLeft: 0, minutesLeft: 0, formattedText: 'Kadaluarsa (2x24j)' };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minutesLeft = totalMinutes % 60;

  return {
    isExpired: false,
    hoursLeft,
    minutesLeft,
    formattedText: `${hoursLeft}j ${minutesLeft}m`
  };
}
