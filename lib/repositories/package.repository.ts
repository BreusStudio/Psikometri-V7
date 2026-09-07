import { BaseRepository } from './base.repository';
import { Package } from '../types';

export class PackageRepository extends BaseRepository<Package> {
  getAll(): Package[] {
    return this.store.getPackages();
  }

  getById(id: string): Package | undefined {
    return this.store.getPackages().find(p => p.id === id);
  }

  add(pkgData: Partial<Package>): boolean | string {
    if (!pkgData.name || pkgData.price === undefined) {
      return 'Nama Paket dan Harga wajib diisi.';
    }

    const packages = this.getAll();
    const newId = pkgData.id || `pkg-${Date.now()}`;

    const newPackage: Package = {
      id: newId,
      name: pkgData.name,
      price: Number(pkgData.price) || 0,
      testCount: pkgData.testCount || pkgData.quota || 100,
      category: pkgData.category || 'personal',
      originalPrice: pkgData.originalPrice ? Number(pkgData.originalPrice) : undefined,
      quota: pkgData.quota ? Number(pkgData.quota) : 100,
      features: pkgData.features || ['Akses Penuh Tes Psikotes', 'Sertifikat Hasil Tes'],
      popular: pkgData.popular || false,
      testTypeId: pkgData.testTypeId || 'all',
      pricePerAccount: pkgData.pricePerAccount ? Number(pkgData.pricePerAccount) : undefined,
      discountPercentage: pkgData.discountPercentage ? Number(pkgData.discountPercentage) : undefined
    };

    this.store.savePackage(newPackage);
    return true;
  }

  update(id: string, updates: Partial<Package>): boolean | string {
    const existing = this.getById(id);
    if (!existing) {
      return `Paket dengan ID ${id} tidak ditemukan.`;
    }

    const updatedPackage: Package = {
      ...existing,
      ...updates,
      id
    };

    this.store.savePackage(updatedPackage);
    return true;
  }

  delete(id: string): boolean {
    this.store.deletePackage(id);
    return true;
  }
}
