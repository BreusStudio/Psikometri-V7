import { BaseRepository } from './base.repository';
import { SchoolMajor } from '../types';

export class MajorRepository extends BaseRepository<SchoolMajor> {
  getAll(): SchoolMajor[] {
    return this.store.getMajors();
  }

  getById(id: string): SchoolMajor | undefined {
    return this.store.getMajors().find(m => m.id === id || m.code === id);
  }

  add(majorData: Partial<SchoolMajor>): boolean | string {
    if (!majorData.code || !majorData.name) {
      return 'Kode dan Nama Jurusan wajib diisi.';
    }

    const existing = this.getById(majorData.code);
    if (existing) {
      return `Jurusan dengan Kode ${majorData.code} sudah ada.`;
    }

    const newMajor: SchoolMajor = {
      id: majorData.id || majorData.code.toLowerCase().replace(/\s+/g, '-'),
      code: majorData.code,
      name: majorData.name,
      riasecType: majorData.riasecType || 'R',
      description: majorData.description || '',
      passingGrades: majorData.passingGrades || {},
      applicableContexts: Array.isArray(majorData.applicableContexts) ? majorData.applicableContexts : []
    };

    return this.store.saveMajor(newMajor);
  }

  update(id: string, updates: Partial<SchoolMajor>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Jurusan dengan ID ${id} tidak ditemukan.`;
    }

    const updatedMajor: SchoolMajor = {
      ...existing,
      ...updates,
      id: existing.id
    };

    return this.store.saveMajor(updatedMajor);
  }

  delete(id: string): boolean {
    return this.store.deleteMajor(id);
  }
}
