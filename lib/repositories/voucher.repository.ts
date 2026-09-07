import { BaseRepository } from './base.repository';
import { Voucher } from '../types';

export class VoucherRepository extends BaseRepository<Voucher> {
  getAll(): Voucher[] {
    return this.store.getVouchers();
  }

  getByCode(code: string): Voucher | undefined {
    return this.store.getVouchers().find(v => v.code.toUpperCase() === code.toUpperCase());
  }

  save(voucher: Voucher): void {
    this.store.saveVoucher(voucher);
  }

  delete(code: string): void {
    this.store.deleteVoucher(code);
  }
}
