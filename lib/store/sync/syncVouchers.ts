import { supabase, resilientUpsert } from '../../supabase';
import { Voucher } from '../../types';
import { StoreDataState } from '../storageSync';

export async function syncVouchersData(state: StoreDataState): Promise<boolean> {
  if (!supabase || state.vouchers.length === 0) return true;
  try {
    const vRows = state.vouchers.map(v => ({
      code: v.code,
      type: v.type,
      value: v.value,
      active: v.active,
      usage_count: v.usageCount,
      school_name: v.schoolName || null,
      max_usage: v.maxUsage || null,
      is_unlimited: v.isUnlimited || false,
      expired_at: v.expiredAt || null,
      test_types: v.testTypes || null,
      test_count: v.testCount || null,
      generated_accounts: v.generatedAccounts || null,
      admin_username: v.adminUsername || null,
      admin_password: v.adminPassword || null
    }));
    await resilientUpsert(supabase, 'vouchers', vRows, { onConflict: 'code' });
    return true;
  } catch (err) {
    console.warn("Failed to sync vouchers to Supabase:", err);
    return false;
  }
}
