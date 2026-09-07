import { BaseRepository } from './base.repository';
import { Question } from '../types';
import { classifyQuestionItem } from '../services/itemClassifierService';

const TEST_NAME_TO_ID: Record<string, string> = {
  "Potensi Kognitif (IQ)": "IQ",
  "Kecerdasan Emosional (EQ)": "EQ",
  "Minat Karir RIASEC": "Holland",
  "Gaya Belajar (VAK)": "GayaBelajar",
  "Kecerdasan Majemuk (MI)": "MultipleIntelligences",
  "Kepribadian Big Five": "Kepribadian",
  "Kesiapan Kerja Vokasi": "KesiapanKerja",
  "Potensi Akademik & Karir": "PotensiAkademik",
  "Indikator Konsistensi": "Validitas"
};

function normalizeTestType(raw: string | undefined): string {
  if (!raw) return 'Pilihan Karir';
  return TEST_NAME_TO_ID[raw] || raw;
}

function getHollandCode(dimensionName: string): string | undefined {
  if (!dimensionName) return undefined;
  const clean = dimensionName.trim().toUpperCase();
  if (clean.startsWith('REALISTIC') || clean.startsWith('R ')) return 'R';
  if (clean.startsWith('INVESTIGATIVE') || clean.startsWith('I ')) return 'I';
  if (clean.startsWith('ARTISTIC') || clean.startsWith('A ')) return 'A';
  if (clean.startsWith('SOCIAL') || clean.startsWith('S ')) return 'S';
  if (clean.startsWith('ENTERPRISING') || clean.startsWith('E ')) return 'E';
  if (clean.startsWith('CONVENTIONAL') || clean.startsWith('C ')) return 'C';
  // Fallbacks:
  if (clean === 'R') return 'R';
  if (clean === 'I') return 'I';
  if (clean === 'A') return 'A';
  if (clean === 'S') return 'S';
  if (clean === 'E') return 'E';
  if (clean === 'C') return 'C';
  return undefined;
}

export class QuestionRepository extends BaseRepository<Question, string | number> {
  getAll(): Question[] {
    return this.store.getQuestions();
  }

  getById(id: string | number): Question | undefined {
    return this.store.getQuestions().find(q => String(q.id) === String(id));
  }

  add(qData: Partial<Question> & Record<string, any>): boolean | string {
    if (!qData.text || !qData.dimension) {
      return 'Teks Soal dan Dimensi wajib diisi.';
    }

    const newId = qData.id ? String(qData.id) : `Q-${Date.now()}`;
    let choices = qData.choices || [];

    const normalizedType = normalizeTestType(qData.testType);

    if (choices.length === 0) {
      const hollandType = normalizedType === 'Holland' ? getHollandCode(qData.dimension) : undefined;
      
      if (qData.opsiA) {
        choices.push({
          id: `${newId}-a`,
          text: String(qData.opsiA),
          scoreValue: Number(qData.skorA !== undefined ? qData.skorA : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (qData.opsiB) {
        choices.push({
          id: `${newId}-b`,
          text: String(qData.opsiB),
          scoreValue: Number(qData.skorB !== undefined ? qData.skorB : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (qData.opsiC) {
        choices.push({
          id: `${newId}-c`,
          text: String(qData.opsiC),
          scoreValue: Number(qData.skorC !== undefined ? qData.skorC : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (qData.opsiD) {
        choices.push({
          id: `${newId}-d`,
          text: String(qData.opsiD),
          scoreValue: Number(qData.skorD !== undefined ? qData.skorD : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
    }

    const unclassifiedQuestion: Question = {
      id: newId,
      text: qData.text,
      dimension: qData.dimension,
      testType: normalizedType as any,
      choices,
      imageUrl: qData.imageUrl || undefined,
      licenseCode: qData.licenseCode || undefined,
      applicableContexts: qData.applicableContexts || undefined,
      educationLevel: qData.educationLevel,
      difficultyLevel: qData.difficultyLevel
    };

    const newQuestion = classifyQuestionItem(unclassifiedQuestion);

    this.store.saveQuestion(newQuestion);
    return true;
  }

  update(id: string | number, updates: Partial<Question> & Record<string, any>, skipSave = false): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Soal dengan ID ${id} tidak ditemukan.`;
    }

    const newId = String(id);
    let choices = updates.choices || [];

    const normalizedType = normalizeTestType(updates.testType || existing.testType);

    if (choices.length === 0 && (updates.opsiA || updates.opsiB)) {
      const hollandType = normalizedType === 'Holland' 
        ? getHollandCode(updates.dimension || existing.dimension) 
        : undefined;

      if (updates.opsiA) {
        choices.push({
          id: `${newId}-a`,
          text: String(updates.opsiA),
          scoreValue: Number(updates.skorA !== undefined ? updates.skorA : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (updates.opsiB) {
        choices.push({
          id: `${newId}-b`,
          text: String(updates.opsiB),
          scoreValue: Number(updates.skorB !== undefined ? updates.skorB : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (updates.opsiC) {
        choices.push({
          id: `${newId}-c`,
          text: String(updates.opsiC),
          scoreValue: Number(updates.skorC !== undefined ? updates.skorC : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
      if (updates.opsiD) {
        choices.push({
          id: `${newId}-d`,
          text: String(updates.opsiD),
          scoreValue: Number(updates.skorD !== undefined ? updates.skorD : 0),
          ...(hollandType ? { hollandType } : {})
        });
      }
    } else if (choices.length === 0) {
      choices = existing.choices || [];
    }

    const updatedQuestion: Question = {
      ...existing,
      ...updates,
      id: newId,
      testType: normalizedType as any,
      choices,
      imageUrl: updates.imageUrl !== undefined ? (updates.imageUrl || undefined) : existing.imageUrl,
      licenseCode: updates.licenseCode !== undefined ? (updates.licenseCode || undefined) : existing.licenseCode,
      applicableContexts: updates.applicableContexts !== undefined ? (updates.applicableContexts || undefined) : existing.applicableContexts
    };

    this.store.saveQuestion(updatedQuestion, skipSave);
    return true;
  }

  updateBulk(items: Array<{ id: string | number; updates: Partial<Question> & Record<string, any> }>): boolean {
    if (items.length === 0) return true;
    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      this.update(item.id, item.updates, !isLast);
    });
    return true;
  }

  delete(id: string | number): boolean {
    this.store.deleteQuestion(String(id));
    return true;
  }

  clearAll(): void {
    this.store.clearAllQuestions();
  }
}
