import { BaseRepository } from './base.repository';
import { TestType } from '../types';

export class TestTypeRepository extends BaseRepository<TestType> {
  private normalizeTestType(t: TestType): TestType {
    const durationVal = Number(t.duration ?? t.durationMinutes ?? 15);
    const limitVal = Number(t.questionLimit ?? t.totalQuestions ?? 10);
    const engineVal = t.scoringEngine || (
      t.id === 'Holland' || t.name?.toLowerCase().includes('holland') || t.name?.toLowerCase().includes('riasec')
        ? 'riasec'
        : t.id === 'Gaya Belajar' || t.name?.toLowerCase().includes('gaya belajar')
        ? 'vak'
        : 'standard'
    );

    return {
      ...t,
      duration: durationVal,
      durationMinutes: durationVal,
      questionLimit: limitVal,
      totalQuestions: limitVal,
      scoringEngine: engineVal
    };
  }

  getAll(): TestType[] {
    return this.store.getTestTypes().map(t => this.normalizeTestType(t));
  }

  getById(id: string): TestType | undefined {
    const found = this.store.getTestTypes().find(t => t.id === id || t.name === id);
    return found ? this.normalizeTestType(found) : undefined;
  }

  add(testTypeData: Partial<TestType>): boolean | string {
    if (!testTypeData.name) {
      return 'Nama Jenis Tes wajib diisi.';
    }

    const existing = this.getById(testTypeData.name);
    if (existing) {
      return `Jenis Tes dengan nama ${testTypeData.name} sudah ada.`;
    }

    const durationVal = Number(testTypeData.duration || testTypeData.durationMinutes || 45);
    const limitVal = Number(testTypeData.questionLimit || testTypeData.totalQuestions || 0);

    const newTestType: TestType = {
      id: testTypeData.id || testTypeData.name.toLowerCase().replace(/\s+/g, '-'),
      name: testTypeData.name,
      description: testTypeData.description || '',
      icon: testTypeData.icon || 'BrainCircuit',
      duration: durationVal,
      durationMinutes: durationVal,
      questionLimit: limitVal,
      totalQuestions: limitVal,
      active: testTypeData.active !== undefined ? testTypeData.active : true,
      scoringEngine: testTypeData.scoringEngine || 'standard'
    };

    this.store.saveTestType(newTestType);
    return true;
  }

  update(id: string, updates: Partial<TestType>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Jenis Tes dengan ID ${id} tidak ditemukan.`;
    }

    const durationVal = Number(updates.duration ?? updates.durationMinutes ?? existing.duration ?? existing.durationMinutes ?? 45);
    const limitVal = Number(updates.questionLimit ?? updates.totalQuestions ?? existing.questionLimit ?? existing.totalQuestions ?? 0);
    const engineVal = updates.scoringEngine || existing.scoringEngine || 'standard';

    const updatedTestType: TestType = {
      ...existing,
      ...updates,
      duration: durationVal,
      durationMinutes: durationVal,
      questionLimit: limitVal,
      totalQuestions: limitVal,
      scoringEngine: engineVal,
      id: existing.id
    };

    this.store.saveTestType(updatedTestType);
    return true;
  }

  delete(id: string): boolean {
    this.store.deleteTestType(id);
    return true;
  }
}
