import { Question, Dimension } from '../types';
import { classifyQuestionItem } from '../services/itemClassifierService';
import { normalizeCanonicalDimension } from '../metadata/canonicalDimensions';

export interface DataGridImportCallbacks {
  addStudent: (student: { id: string; name: string; classGroup: string; angkatan: number; password: string }) => boolean;
  addQuestion: (q: Question) => void;
  questions: Question[];
  dimensions: Dimension[];
}

export function processDataGridImport(
  type: 'students' | 'questions' | 'dimensions',
  rows: any[],
  callbacks: DataGridImportCallbacks
): { successCount: number; errors: string[] } {
  let successCount = 0;
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    try {
      // Helper function to extract cell value in a flexible way
      const getVal = (...keys: string[]): any => {
        const normalizedRow: Record<string, any> = {};
        for (const rawKey of Object.keys(row)) {
          normalizedRow[rawKey.trim().toUpperCase().replace(/[\s_]+/g, '')] = row[rawKey];
        }
        for (const k of keys) {
          const normK = k.trim().toUpperCase().replace(/[\s_]+/g, '');
          if (normalizedRow[normK] !== undefined && normalizedRow[normK] !== null) {
            return normalizedRow[normK];
          }
        }
        return undefined;
      };

      if (type === 'students') {
        const NIM = getVal('NIM', 'id', 'Nis', 'NisNisn', 'Nisn', 'studentId', 'student_id', 'ID', 'Username', 'NIP', 'NIK', 'No') || `SISWA-${String(idx + 1).padStart(3, '0')}`;
        const Nama = getVal('Nama', 'name', 'NamaSiswa', 'studentName', 'NamaUser', 'NamaLengkap', 'NamaKaryawan');
        const Kelas = getVal('Kelas', 'class', 'classGroup', 'class_group', 'rombel', 'Rombel', 'Kelompok', 'Divisi', 'UnitKerja') || 'Umum';
        const Password = getVal('Password', 'pass', 'sandi', 'KataSandi') || '123456';
        const Angkatan = getVal('Angkatan', 'year', 'cohort', 'angkatan_tahun', 'Tahun', 'TahunMasuk') || new Date().getFullYear();

        if (!Nama) {
          errors.push(`Baris ${idx + 1}: Kolom Nama Siswa/User wajib diisi.`);
          return;
        }

        const ok = callbacks.addStudent({
          id: String(NIM).trim(),
          name: String(Nama).trim(),
          classGroup: String(Kelas).trim(),
          angkatan: Angkatan ? Number(Angkatan) : new Date().getFullYear(),
          password: String(Password).trim()
        });
        if (ok) successCount++;
        else {
          // If already exists, still consider successful if updated
          successCount++;
        }
      } else if (type === 'questions') {
        const rawExplicitId = getVal('ID', 'questionId', 'id_soal', 'soalId', 'KodeSoal');
        const rawRowNumber = getVal('NO', 'NOSOAL', 'NUM', 'No', 'Nomor');
        const rawId = rawExplicitId;
        const Jenis_Tes = getVal('Jenis_Tes', 'jenis_tes', 'JenisTes', 'testType', 'test_type', 'TipeTes', 'Tipe') || 'Holland';
        const Dimensi = getVal('Dimensi', 'dimension', 'aspek', 'NamaDimensi', 'AspekPsikologi', 'Kategori') || 'General';
        const Pertanyaan = getVal('Pertanyaan', 'question', 'text', 'soal', 'Pernyataan', 'PernyataanSoal', 'ButirSoal', 'IsiSoal');
        
        const Opsi_A = getVal('Opsi_A', 'Osci_A', 'OpsiA', 'a', 'opsi1', 'jawaban_a', 'pilihan_a', 'PilihanA', 'OptionA') || 'Sangat Sesuai';
        const Skor_A = getVal('Skor_A', 'SkorA', 'score_a', 'nilai_a', 'skor1', 'BobotA') ?? 2;
        
        const Opsi_B = getVal('Opsi_B', 'OpsiB', 'b', 'opsi2', 'jawaban_b', 'pilihan_b', 'PilihanB', 'OptionB') || 'Sesuai';
        const Skor_B = getVal('Skor_B', 'SkorB', 'score_b', 'nilai_b', 'skor2', 'BobotB') ?? 1;
        
        const Opsi_C = getVal('Opsi_C', 'OpsiC', 'c', 'opsi3', 'jawaban_c', 'pilihan_c', 'PilihanC', 'OptionC');
        const Skor_C = getVal('Skor_C', 'SkorC', 'score_c', 'nilai_c', 'skor3', 'BobotC') ?? 0;
        
        const Opsi_D = getVal('Opsi_D', 'OpsiD', 'd', 'opsi4', 'jawaban_d', 'pilihan_d', 'PilihanD', 'OptionD');
        const Skor_D = getVal('Skor_D', 'SkorD', 'score_d', 'nilai_d', 'skor4', 'BobotD') ?? 0;
        
        const Tipe_Holland = getVal('Tipe_Holland', 'TipeHolland', 'hollandType', 'holland_type', 'tipe');

        if (!Pertanyaan) {
          errors.push(`Baris ${idx + 1}: Kolom Pertanyaan/Pernyataan wajib diisi.`);
          return;
        }

        let finalId = rawExplicitId ? String(rawExplicitId).trim() : '';
        const isCollision = finalId ? callbacks.questions.some(q => String(q.id).toLowerCase() === finalId.toLowerCase()) : false;
        
        if (!finalId || isCollision) {
          const prefix = String(Jenis_Tes).toUpperCase().includes('IQ') ? 'Q-IQ' : String(Jenis_Tes).toUpperCase().includes('EQ') ? 'Q-EQ' : 'Q-HOL';
          const totalExisting = callbacks.questions.length;
          finalId = `${prefix}-${String(totalExisting + idx + 1).padStart(3, '0')}`;
        }

        const choices = [
          { id: `${finalId}-a`, text: String(Opsi_A), scoreValue: Number(Skor_A || 0), hollandType: Tipe_Holland },
          { id: `${finalId}-b`, text: String(Opsi_B), scoreValue: Number(Skor_B || 0), hollandType: Tipe_Holland },
        ];

        if (Opsi_C) choices.push({ id: `${finalId}-c`, text: String(Opsi_C), scoreValue: Number(Skor_C || 0), hollandType: Tipe_Holland });
        if (Opsi_D) choices.push({ id: `${finalId}-d`, text: String(Opsi_D), scoreValue: Number(Skor_D || 0), hollandType: Tipe_Holland });

        const imageUrlVal = getVal('Gambar', 'GambarSoal', 'GambarURL', 'ImageUrl', 'Image_Url', 'URLGambar');
        const Lisensi_Khusus = getVal('LisensiKhusus', 'licenseCode', 'license_code', 'lisensi');
        const Konteks_Instansi = getVal('KonteksInstansi', 'applicableContexts', 'applicable_contexts', 'konteks');
        const Tingkat_Pendidikan = getVal('TingkatPendidikan', 'educationLevel', 'education_level', 'jenjang');
        const Tingkat_Kesulitan = getVal('TingkatKesulitan', 'difficultyLevel', 'difficulty_level', 'kesulitan');

        const canonicalDimName = normalizeCanonicalDimension(String(Dimensi).trim(), String(Jenis_Tes).trim());

        const unclassifiedQuestion: Question = {
          id: finalId,
          testType: String(Jenis_Tes).trim() as 'IQ' | 'EQ' | 'Holland',
          dimension: canonicalDimName,
          text: String(Pertanyaan).trim(),
          choices,
          ...(imageUrlVal ? { imageUrl: String(imageUrlVal).trim() } : {}),
          ...(Lisensi_Khusus ? { licenseCode: String(Lisensi_Khusus).trim() } : {}),
          ...(Konteks_Instansi ? { applicableContexts: String(Konteks_Instansi).split(',').map((s: string) => s.trim()).filter(Boolean) } : {}),
          ...(Tingkat_Pendidikan ? { educationLevel: String(Tingkat_Pendidikan).trim() } : {}),
          ...(Tingkat_Kesulitan ? { difficultyLevel: String(Tingkat_Kesulitan).trim() as any } : {})
        };

        const classifiedQuestion = classifyQuestionItem(unclassifiedQuestion);

        callbacks.addQuestion(classifiedQuestion);
        successCount++;
      } else if (type === 'dimensions') {
        const ID = getVal('ID', 'id_dimensi', 'dimensionId', 'Code', 'Kode') || `DIM-${String(idx + 1).padStart(3, '0')}`;
        const rawNama = getVal('Nama', 'name', 'NamaDimensi', 'Dimensi');
        const Jenis_Tes = getVal('Jenis_Tes', 'jenis_tes', 'JenisTes', 'testType', 'test_type') || 'Holland';
        const Deskripsi = getVal('Deskripsi', 'description', 'keterangan', 'Penjelasan') || '';

        if (!rawNama) {
          errors.push(`Baris ${idx + 1}: Kolom Nama Dimensi wajib diisi.`);
          return;
        }

        const canonicalName = normalizeCanonicalDimension(String(rawNama).trim(), String(Jenis_Tes).trim());

        const existingIdx = callbacks.dimensions.findIndex(d => d.id === String(ID) || d.name === canonicalName);
        const dimObj: Dimension = {
          id: String(ID).trim(),
          name: canonicalName,
          testType: String(Jenis_Tes).trim() as 'IQ' | 'EQ' | 'Holland',
          description: String(Deskripsi).trim()
        };

        if (existingIdx >= 0) {
          callbacks.dimensions[existingIdx] = dimObj;
        } else {
          callbacks.dimensions.push(dimObj);
        }
        successCount++;
      }
    } catch (err: any) {
      errors.push(`Baris ${idx + 1}: Terjadi kesalahan - ${err.message}`);
    }
  });

  return { successCount, errors };
}
