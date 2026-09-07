import { BaseRepository } from './base.repository';
import { Dimension } from '../types';

export class DimensionRepository extends BaseRepository<Dimension> {
  getAll(): Dimension[] {
    return this.store.getDimensions();
  }

  getById(id: string): Dimension | undefined {
    return this.store.getDimensions().find(d => d.id === id || d.code === id);
  }

  add(dimData: Partial<Dimension>): boolean | string {
    if (!dimData.code || !dimData.name) {
      return 'Kode dan Nama Dimensi wajib diisi.';
    }

    const existing = this.getById(dimData.code);
    if (existing) {
      return `Dimensi dengan Kode ${dimData.code} sudah ada.`;
    }

    const newDimension: Dimension = {
      id: dimData.id || dimData.code?.toLowerCase() || dimData.name.toLowerCase(),
      code: dimData.code,
      name: dimData.name,
      testType: dimData.testType || 'General',
      description: dimData.description || '',
      weight: dimData.weight !== undefined ? Number(dimData.weight) : 1
    };

    return this.store.saveDimension(newDimension);
  }

  update(id: string, updates: Partial<Dimension>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Dimensi dengan ID ${id} tidak ditemukan.`;
    }

    const updatedDimension: Dimension = {
      ...existing,
      ...updates,
      id: existing.id
    };

    return this.store.saveDimension(updatedDimension);
  }

  delete(id: string): boolean {
    return this.store.deleteDimension(id);
  }
}
