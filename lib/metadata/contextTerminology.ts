export type ClientContextType = 
  | 'school_sd'
  | 'school_smp'
  | 'school_sma'
  | 'school_smk'
  | 'personal'
  | 'corporate';

export interface ContextTerminology {
  contextType: ClientContextType;
  entityName: string; // e.g. "Siswa", "User", "Kandidat"
  entityNamePlural: string; // e.g. "Siswa", "User", "Kandidat"
  idLabel: string; // e.g. "NIS / ID Siswa", "ID User", "NIK / ID Karyawan"
  groupLabel: string; // e.g. "Kelas / Rombel", "Pendidikan Terakhir", "Divisi / Unit Kerja"
  subGroupLabel: string; // e.g. "Jurusan / Peminatan", "Kota Domisili", "Posisi yang Dilamar"
  supervisorLabel: string; // e.g. "Guru BK / Wali Kelas", "Konselor Karir", "Tim HRD / Asesor"
  examTitle: string; // e.g. "Asesmen Minat Bakat Siswa", "Asesmen Psikotes Mandiri", "Asesmen Potensi Kerja"
  dashboardHeader: string; // e.g. "DASHBOARD UJIAN SISWA", "DASHBOARD UJIAN MANDIRI", "DASHBOARD ASESMEN KERJA"
  showResultsToUser: boolean; // false for schools & corporate, true for personal
  allowPdfDownload: boolean; // false for schools & corporate, true for personal
  completionNote: string; // Message shown after finishing
}

export const CONTEXT_TERMINOLOGIES: Record<ClientContextType, ContextTerminology> = {
  school_sd: {
    contextType: 'school_sd',
    entityName: 'Siswa',
    entityNamePlural: 'Siswa',
    idLabel: 'NIS / ID Siswa',
    groupLabel: 'Kelas / Rombel',
    subGroupLabel: 'Peminatan',
    supervisorLabel: 'Guru Kelas / Wali Kelas',
    examTitle: 'Asesmen Bakat & Kognitif Siswa SD',
    dashboardHeader: 'DASHBOARD UJIAN SISWA',
    showResultsToUser: false,
    allowPdfDownload: false,
    completionNote: 'Hasil asesmen akan dikompilasi dan disampaikan secara terpadu oleh Guru Kelas / Pihak Sekolah.'
  },
  school_smp: {
    contextType: 'school_smp',
    entityName: 'Siswa',
    entityNamePlural: 'Siswa',
    idLabel: 'NIS / ID Siswa',
    groupLabel: 'Kelas / Rombel',
    subGroupLabel: 'Peminatan Lanjutan',
    supervisorLabel: 'Guru BK / Wali Kelas',
    examTitle: 'Asesmen Minat Bakat & Penjurusan Siswa SMP',
    dashboardHeader: 'DASHBOARD UJIAN SISWA',
    showResultsToUser: false,
    allowPdfDownload: false,
    completionNote: 'Hasil asesmen akan dikompilasi dan disampaikan oleh Guru BK / Konselor Sekolah.'
  },
  school_sma: {
    contextType: 'school_sma',
    entityName: 'Siswa',
    entityNamePlural: 'Siswa',
    idLabel: 'NIS / ID Siswa',
    groupLabel: 'Kelas / Rombel',
    subGroupLabel: 'Jurusan / Peminatan',
    supervisorLabel: 'Guru BK / Wali Kelas',
    examTitle: 'Asesmen Minat Bakat & Eksplorasi Karir Siswa SMA',
    dashboardHeader: 'DASHBOARD UJIAN SISWA',
    showResultsToUser: false,
    allowPdfDownload: false,
    completionNote: 'Hasil psikotes resmi akan dikompilasi dan dibagikan secara terpadu melalui Guru Bimbingan Konseling (BK).'
  },
  school_smk: {
    contextType: 'school_smk',
    entityName: 'Siswa',
    entityNamePlural: 'Siswa',
    idLabel: 'NIS / ID Siswa',
    groupLabel: 'Kelas / Rombel',
    subGroupLabel: 'Konsentrasi Keahlian / Jurusan',
    supervisorLabel: 'Guru BK / Kaprodi',
    examTitle: 'Asesmen Kesiapan Vokasi & Minat Karir Siswa SMK',
    dashboardHeader: 'DASHBOARD UJIAN SISWA',
    showResultsToUser: false,
    allowPdfDownload: false,
    completionNote: 'Hasil psikotes resmi akan dikompilasi dan dibagikan secara terpadu melalui Guru Bimbingan Konseling (BK).'
  },
  personal: {
    contextType: 'personal',
    entityName: 'User',
    entityNamePlural: 'User',
    idLabel: 'ID User / Registrasi',
    groupLabel: 'Pendidikan Terakhir',
    subGroupLabel: 'Kota Domisili',
    supervisorLabel: 'Konselor Mandiri',
    examTitle: 'Asesmen Psikotes & Minat Karir Mandiri',
    dashboardHeader: 'DASHBOARD UJIAN MANDIRI',
    showResultsToUser: true,
    allowPdfDownload: true,
    completionNote: 'Anda dapat langsung melihat ringkasan skor dan mengunduh Laporan Resmi Psikotes dalam format PDF.'
  },
  corporate: {
    contextType: 'corporate',
    entityName: 'User',
    entityNamePlural: 'User',
    idLabel: 'NIK / ID User',
    groupLabel: 'Unit Kerja / Divisi',
    subGroupLabel: 'Posisi yang Dilamar',
    supervisorLabel: 'Tim HRD / Asesor Perusahaan',
    examTitle: 'Asesmen Kompetensi & Potensi Karyawan',
    dashboardHeader: 'DASHBOARD ASESMEN KERJA',
    showResultsToUser: false,
    allowPdfDownload: false,
    completionNote: 'Hasil asesmen telah tersimpan aman dan akan dievaluasi langsung oleh Tim Rekrutmen / HRD.'
  }
};
