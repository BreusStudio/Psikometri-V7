import { Purchase, Voucher, Commission, Student, RegistrationRequest } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { StoreDataState } from './storageSync';

/**
 * Handle addition of a new purchase record, commission calculation, and automatic voucher creation
 */
export function handleAddPurchase(
  state: StoreDataState,
  p: Purchase,
  saveVoucherFn: (voucher: Voucher) => void
): void {
  const voucherCode = `VCHR-${p.id.replace('TX-', '').toUpperCase()}`;
  p.generatedVoucher = voucherCode;
  state.purchases.push(p);

  if (p.voucherUsed) {
    const v = state.vouchers.find(v => v.code.toUpperCase() === p.voucherUsed?.toUpperCase());
    if (v) v.usageCount++;
  }

  if (p.referralUsed && p.commissionEarned > 0) {
    const r = state.referrals.find(ref => ref.code.toUpperCase() === p.referralUsed?.toUpperCase());
    if (r) r.totalEarned += p.commissionEarned;

    const commissionId = 'COM-' + Math.floor(1000 + Math.random() * 9000);
    state.commissions.push({
      id: commissionId,
      referralCode: p.referralUsed,
      buyerName: p.buyerName,
      purchaseAmount: p.amount,
      commissionAmount: p.commissionEarned,
      status: 'Pending',
      paidDate: null,
      transferReceipt: null,
      date: p.date
    });
  }

  if (p.status === 'Completed') {
    state.quotaAdded += p.quotaAdded;
    const packageTestCount = p.quotaAdded > 0 ? p.quotaAdded : 1;
    const matchedPkg = state.packages.find(pkg => pkg.name === p.packageName);
    const activeTestTypes = matchedPkg?.testTypes || ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas'];

    const autoVoucher: Voucher = {
      code: voucherCode,
      type: 'fixed',
      value: 0,
      active: true,
      usageCount: 0,
      testCount: packageTestCount,
      testTypes: activeTestTypes
    };

    saveVoucherFn(autoVoucher);
  }
}

/**
 * Archive a purchase and lock associated student accounts and vouchers
 */
export function handleArchivePurchase(state: StoreDataState, idOrCode: string): boolean {
  const purchase = state.purchases.find(x => x.id === idOrCode || x.generatedVoucher === idOrCode);
  const voucherCode = purchase?.generatedVoucher || idOrCode;
  const voucher = state.vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
  const buyerName = purchase?.buyerName || purchase?.schoolName || '';

  if (purchase) {
    (purchase as any).status = 'Archived';
  }

  if (voucher) {
    voucher.active = false;
  }

  if (buyerName) {
    const lowerName = buyerName.toLowerCase().trim();
    state.students.forEach(s => {
      if ((s.schoolOrigin || s.school_origin || '').toLowerCase().trim() === lowerName || s.invoiceNumber === purchase?.invoiceNumber) {
        s.lockedOut = true;
        s.registrationStatus = 'DRAFT';
      }
    });
  }

  if (voucher && voucher.generatedAccounts) {
    const accUsernames = voucher.generatedAccounts.map(a => a.username);
    state.students.forEach(s => {
      if (accUsernames.includes(s.id)) {
        s.lockedOut = true;
        s.registrationStatus = 'DRAFT';
      }
    });
  }

  if (isSupabaseConfigured && supabase) {
    if (purchase) {
      supabase.from('purchases').update({ status: 'Archived' }).eq('id', purchase.id).then();
    }
    if (voucher) {
      supabase.from('vouchers').update({ active: false }).eq('code', voucher.code).then();
    }
  }

  return true;
}

/**
 * Cascade deletion of purchase, voucher, linked students, answers, and registration requests
 */
export function handleDeletePurchaseCascade(state: StoreDataState, idOrCode: string): boolean {
  const purchase = state.purchases.find(x => x.id === idOrCode || x.generatedVoucher === idOrCode);
  const voucherCode = purchase?.generatedVoucher || idOrCode;
  const voucher = state.vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
  const buyerName = purchase?.buyerName || purchase?.schoolName || '';
  const buyerEmail = purchase?.email || (purchase as any)?.buyerEmail || '';

  let studentIdsToDelete: string[] = [];

  if (voucher && voucher.generatedAccounts) {
    studentIdsToDelete.push(...voucher.generatedAccounts.map(a => a.username));
  }

  if (buyerName) {
    const lowerName = buyerName.toLowerCase().trim();
    const matchingStudents = state.students.filter(s => 
      (s.schoolOrigin || s.school_origin || '').toLowerCase().trim() === lowerName ||
      (purchase && s.invoiceNumber === purchase.invoiceNumber) ||
      (buyerEmail && s.email && s.email.toLowerCase() === buyerEmail.toLowerCase())
    );
    studentIdsToDelete.push(...matchingStudents.map(s => s.id));
  }

  studentIdsToDelete = Array.from(new Set(studentIdsToDelete));

  if (studentIdsToDelete.length > 0) {
    state.students = state.students.filter(s => !studentIdsToDelete.includes(s.id));
    if (isSupabaseConfigured && supabase) {
      supabase.from('student_answers').delete().in('student_id', studentIdsToDelete).then();
      supabase.from('students').delete().in('id', studentIdsToDelete).then();
    }
  }

  if (buyerEmail || (purchase && purchase.invoiceNumber)) {
    state.registrations = (state.registrations || []).filter(r => 
      r.adminEmail !== buyerEmail && r.invoiceNumber !== purchase?.invoiceNumber
    );
    if (isSupabaseConfigured && supabase) {
      if (buyerEmail) {
        supabase.from('registration_requests').delete().eq('admin_email', buyerEmail).then();
      }
      if (purchase && purchase.invoiceNumber) {
        supabase.from('registration_requests').delete().eq('invoice_number', purchase.invoiceNumber).then();
      }
    }
  }

  if (voucherCode) {
    state.vouchers = state.vouchers.filter(v => v.code.toUpperCase() !== voucherCode.toUpperCase());
    if (isSupabaseConfigured && supabase) {
      supabase.from('vouchers').delete().eq('code', voucherCode).then();
    }
  }

  if (purchase) {
    state.purchases = state.purchases.filter(x => x.id !== purchase.id);
    if (isSupabaseConfigured && supabase) {
      supabase.from('purchases').delete().eq('id', purchase.id).then();
    }
  } else if (idOrCode) {
    state.purchases = state.purchases.filter(x => x.id !== idOrCode);
    if (isSupabaseConfigured && supabase) {
      supabase.from('purchases').delete().eq('id', idOrCode).then();
    }
  }

  return true;
}
