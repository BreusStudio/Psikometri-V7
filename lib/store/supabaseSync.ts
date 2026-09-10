import { supabase, isSupabaseConfigured, getIsSupabaseConfigured, initSupabaseClient, resilientUpsert } from '../supabase';
import { StoreDataState, saveLocalStorageState } from './storageSync';
import { mapDatabaseRowToStudent, mapDatabaseRowToQuestion, mapDatabaseRowToDimension } from './dbMappers';
import { Student, Question, Dimension, Teacher, SchoolMajor } from '../types';
import { markAnswerSynced } from '../indexedDB';
import { syncManager } from '@/lib/api';

export function mapQuestionToDbRow(q: Question) {
  const isValidated = Boolean(
    (q as any).is_validated || 
    (q as any).isValidated || 
    q.verificationStatus === 'VERIFIED'
  );

  return {
    id: String(q.id).trim(),
    test_type: q.testType,
    dimension: q.dimension,
    category: (q as any).category || q.dimension,
    text: q.text,
    choices: Array.isArray(q.choices) ? q.choices : [],
    answers: (q as any).answers || q.optionScores || null,
    rubric: (q as any).rubric || null,
    is_validated: isValidated,
    weight: (q as any).weight || 1,
    image_url: q.imageUrl || null,
    updated_at: new Date().toISOString()
  };
}

export function mapStudentToDbRow(s: Student) {
  const classGroup = s.classGroup || s.class_name || 'X-1';
  const rawAngkatan = typeof s.angkatan === 'number' ? s.angkatan : (typeof s.cohort === 'number' ? Number(s.cohort) : new Date().getFullYear());
  const angkatan = isNaN(rawAngkatan) ? new Date().getFullYear() : rawAngkatan;

  let aiAnalysisVal: string | null = null;
  if (typeof s.aiAnalysis === 'string') {
    aiAnalysisVal = s.aiAnalysis;
  } else if (s.aiAnalysis && typeof s.aiAnalysis === 'object') {
    try {
      aiAnalysisVal = JSON.stringify(s.aiAnalysis);
    } catch {
      aiAnalysisVal = null;
    }
  }

  const rawIq = typeof s.iqScore === 'number' ? s.iqScore : (s.iqScore ? Number(s.iqScore) : null);
  const iqScore = rawIq !== null && !isNaN(rawIq) ? rawIq : null;

  const rawEq = typeof s.eqScore === 'number' ? s.eqScore : (s.eqScore ? Number(s.eqScore) : null);
  const eqScore = rawEq !== null && !isNaN(rawEq) ? rawEq : null;

  return {
    id: String(s.id || '').trim(),
    name: String(s.name || '').trim(),
    class_group: String(classGroup).trim(),
    angkatan: angkatan,
    archived: Boolean(s.archived || false),
    password: String(s.password || '123456').trim(),
    iq_score: iqScore,
    eq_score: eqScore,
    riasec_scores: s.riasecScores && typeof s.riasecScores === 'object' ? s.riasecScores : null,
    dimension_scores: s.dimensionScores && typeof s.dimensionScores === 'object' ? s.dimensionScores : null,
    locked_out: Boolean(s.lockedOut || false),
    lock_reason: s.lockReason ? String(s.lockReason) : null,
    test_started: Boolean(s.testStarted || false),
    test_completed: Boolean(s.testCompleted || false),
    test_started_at: s.testStartedAt ? String(s.testStartedAt) : null,
    test_completed_at: s.testCompletedAt ? String(s.testCompletedAt) : null,
    current_question_index: typeof s.currentQuestionIndex === 'number' && !isNaN(s.currentQuestionIndex) ? s.currentQuestionIndex : 0,
    answers: s.answers && typeof s.answers === 'object' ? s.answers : {},
    cheat_warnings: typeof s.cheatWarnings === 'number' && !isNaN(s.cheatWarnings) ? s.cheatWarnings : 0,
    ai_analysis: aiAnalysisVal,
    completed_tests: Array.isArray(s.completedTests) ? s.completedTests : [],
    allow_test_types: Array.isArray(s.allowedTests) ? s.allowedTests : null,
    school_origin: s.schoolOrigin || s.school_origin ? String(s.schoolOrigin || s.school_origin) : null,
    exam_duration_seconds: s.examDurationSeconds ?? s.timeSpentSeconds ?? null,
    validation_status: s.validationStatus ? String(s.validationStatus) : null,
    validation_recommendation: s.validationRecommendation ? String(s.validationRecommendation) : null
  };
}

export function mapStudentToCoreDbRow(s: Student) {
  const classGroup = s.classGroup || s.class_name || 'X-1';
  const rawAngkatan = typeof s.angkatan === 'number' ? s.angkatan : (typeof s.cohort === 'number' ? Number(s.cohort) : new Date().getFullYear());
  const angkatan = isNaN(rawAngkatan) ? new Date().getFullYear() : rawAngkatan;

  return {
    id: String(s.id || '').trim(),
    name: String(s.name || '').trim(),
    class_group: String(classGroup).trim(),
    angkatan: angkatan,
    password: String(s.password || '123456').trim(),
    test_started: Boolean(s.testStarted || false),
    test_completed: Boolean(s.testCompleted || false),
    answers: s.answers && typeof s.answers === 'object' ? s.answers : {}
  };
}

export function setupRealtimeSubscriptions(
  state: StoreDataState,
  notify: () => void
): (() => void) | undefined {
  if (!getIsSupabaseConfigured() || !supabase) return undefined;

  const client = supabase;
  const channel = client
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedStudent = mapDatabaseRowToStudent(payload.new);
          const idx = state.students.findIndex(s => s.id === updatedStudent.id);
          if (idx >= 0) {
            state.students[idx] = updatedStudent;
          } else {
            state.students.push(updatedStudent);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            state.students = state.students.filter(s => s.id !== deletedId);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'test_settings' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          state.testSettings = {
            ...state.testSettings,
            iqActive: row.iq_active,
            eqActive: row.eq_active,
            hollandActive: row.holland_active,
            kepribadianActive: row.kepribadian_active !== undefined ? row.kepribadian_active : true,
            validitasActive: row.validitas_active !== undefined ? row.validitas_active : true,
            autoAiAnalysis: row.auto_ai_analysis,
            iqLimit: row.iq_limit,
            eqLimit: row.eq_limit,
            hollandLimit: row.holland_limit,
            kepribadianLimit: row.kepribadian_limit !== undefined ? row.kepribadian_limit : 12,
            validitasLimit: row.validitas_limit !== undefined ? row.validitas_limit : 12,
            randomizeQuestions: row.randomize_questions,
            randomizeChoices: row.randomize_choices !== undefined ? row.randomize_choices : true,
            iqDuration: row.iq_duration || 15,
            eqDuration: row.eq_duration || 15,
            hollandDuration: row.holland_duration || 15,
            kepribadianDuration: row.kepribadian_duration || 15,
            validitasDuration: row.validitas_duration || 15,
            proctoringMode: row.proctoring_mode || state.testSettings.proctoringMode || 'AUDIT_ONLY',
            enableAntiCheat: row.enable_anti_cheat !== undefined ? row.enable_anti_cheat : (row.anti_cheat_config?.enableAntiCheat ?? true),
            enableFullscreenLock: row.anti_cheat_config?.enableFullscreenLock ?? state.testSettings.enableFullscreenLock ?? true,
            enableTabSwitchDetection: row.anti_cheat_config?.enableTabSwitchDetection ?? state.testSettings.enableTabSwitchDetection ?? true,
            maxAllowedTabSwitches: row.anti_cheat_config?.maxAllowedTabSwitches ?? state.testSettings.maxAllowedTabSwitches ?? 3,
            disableCopyPaste: row.anti_cheat_config?.disableCopyPaste ?? state.testSettings.disableCopyPaste ?? true,
            enableDevToolsProtection: row.anti_cheat_config?.enableDevToolsProtection ?? state.testSettings.enableDevToolsProtection ?? true
          };
          if (Array.isArray(row.registered_classes)) state.registeredClasses = row.registered_classes;
          if (Array.isArray(row.registered_cohorts)) state.registeredCohorts = row.registered_cohorts;
          if (Array.isArray(row.vouchers)) state.vouchers = row.vouchers;
          if (Array.isArray(row.referrals)) state.referrals = row.referrals;
          if (Array.isArray(row.commissions)) state.commissions = row.commissions;
          if (Array.isArray(row.purchases)) state.purchases = row.purchases;
          if (Array.isArray(row.packages)) state.packages = row.packages;
          if (typeof row.quota_added === 'number') state.quotaAdded = row.quota_added;
          if (Array.isArray(row.test_types)) state.testTypes = row.test_types;
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registered_classes' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const name = String(payload.new?.name || payload.new?.id).trim().toUpperCase();
          if (name && !state.registeredClasses.includes(name)) {
            state.registeredClasses.push(name);
            state.registeredClasses.sort();
          }
        } else if (payload.eventType === 'DELETE') {
          const name = String(payload.old?.name || payload.old?.id).trim().toUpperCase();
          if (name) {
            state.registeredClasses = state.registeredClasses.filter(c => c !== name);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'questions' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedQ = mapDatabaseRowToQuestion(payload.new);
          const idx = state.questions.findIndex(q => q.id === updatedQ.id);
          if (idx >= 0) {
            state.questions[idx] = updatedQ;
          } else {
            state.questions.push(updatedQ);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            state.questions = state.questions.filter(q => q.id !== deletedId);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teachers' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const t = payload.new;
          const updatedT = {
            id: t.id,
            name: t.name,
            role: t.role,
            password: t.password,
            managed_class: t.managed_class || undefined
          };
          const idx = state.teachers.findIndex(x => x.id === updatedT.id);
          if (idx >= 0) {
            state.teachers[idx] = updatedT;
          } else {
            state.teachers.push(updatedT);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            state.teachers = state.teachers.filter(x => x.id !== deletedId);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registered_cohorts' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const year = Number(payload.new?.year || payload.new?.id);
          if (!isNaN(year) && !state.registeredCohorts.includes(year)) {
            state.registeredCohorts.push(year);
            state.registeredCohorts.sort((a,b) => a-b);
          }
        } else if (payload.eventType === 'DELETE') {
          const year = Number(payload.old?.year || payload.old?.id);
          if (!isNaN(year)) {
            state.registeredCohorts = state.registeredCohorts.filter(y => y !== year);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'purchases' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (row && row.id) {
            const idx = state.purchases.findIndex(p => p.id === row.id);
            if (idx >= 0) {
              state.purchases[idx] = { ...state.purchases[idx], ...row };
            } else {
              state.purchases.push(row as any);
            }
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            state.purchases = state.purchases.filter(p => p.id !== deletedId);
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vouchers' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (row && row.code) {
            const idx = state.vouchers.findIndex(v => v.code.toUpperCase() === row.code.toUpperCase());
            if (idx >= 0) {
              state.vouchers[idx] = { ...state.vouchers[idx], ...row };
            } else {
              state.vouchers.push(row as any);
            }
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedCode = payload.old?.code;
          if (deletedCode) {
            state.vouchers = state.vouchers.filter(v => v.code.toUpperCase() !== String(deletedCode).toUpperCase());
          }
        }
        notify();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'registration_requests' },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          if (row && row.id) {
            const idx = (state.registrations || []).findIndex(r => r.id === row.id);
            if (idx >= 0) {
              state.registrations[idx] = { ...state.registrations[idx], ...row };
            } else {
              if (!state.registrations) state.registrations = [];
              state.registrations.push(row as any);
            }
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId && state.registrations) {
            state.registrations = state.registrations.filter(r => r.id !== deletedId);
          }
        }
        notify();
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

export async function syncWithSupabase(state: StoreDataState): Promise<boolean> {
  // If client Supabase not configured yet, attempt loading config from server API
  if (!supabase || !getIsSupabaseConfigured()) {
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const json = await configRes.json();
        const config = json.data || json;
        if (config.supabaseUrl && config.supabaseAnonKey) {
          initSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Attempt reading students via REST API if client Supabase is not directly connected
  if (!supabase) {
    try {
      const res = await fetch('/api/students?limit=1000');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.items || json.data || json;
        if (Array.isArray(items) && items.length > 0) {
          state.students = items;
          saveLocalStorageState(state);
          return true;
        }
      }
    } catch (err) {
      console.warn("Rest sync fallback caught:", err);
    }
    return false;
  }
  try {
    // 1. Sync Settings & System State
    const { data: settingsData, error: settingsError } = await supabase
      .from('test_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (!settingsError && settingsData) {
      const ttIq = Array.isArray(settingsData.test_types) ? settingsData.test_types.find((t: any) => t.id === 'iq') : null;
      const ttEq = Array.isArray(settingsData.test_types) ? settingsData.test_types.find((t: any) => t.id === 'eq') : null;
      const ttHolland = Array.isArray(settingsData.test_types) ? settingsData.test_types.find((t: any) => t.id === 'holland' || t.id === 'minat') : null;
      const ttKepribadian = Array.isArray(settingsData.test_types) ? settingsData.test_types.find((t: any) => t.id === 'kepribadian') : null;
      const ttValiditas = Array.isArray(settingsData.test_types) ? settingsData.test_types.find((t: any) => t.id === 'validitas') : null;

      state.testSettings = {
        ...state.testSettings,
        iqActive: settingsData.iq_active !== undefined ? settingsData.iq_active : (ttIq?.active ?? true),
        eqActive: settingsData.eq_active !== undefined ? settingsData.eq_active : (ttEq?.active ?? true),
        hollandActive: settingsData.holland_active !== undefined ? settingsData.holland_active : (ttHolland?.active ?? true),
        kepribadianActive: settingsData.kepribadian_active !== undefined ? settingsData.kepribadian_active : (ttKepribadian?.active ?? true),
        validitasActive: settingsData.validitas_active !== undefined ? settingsData.validitas_active : (ttValiditas?.active ?? true),
        autoAiAnalysis: settingsData.auto_ai_analysis !== undefined ? settingsData.auto_ai_analysis : true,
        iqLimit: settingsData.iq_limit || ttIq?.limit || 12,
        eqLimit: settingsData.eq_limit || ttEq?.limit || 12,
        hollandLimit: settingsData.holland_limit || ttHolland?.limit || 12,
        kepribadianLimit: settingsData.kepribadian_limit !== undefined ? settingsData.kepribadian_limit : (ttKepribadian?.limit ?? 12),
        validitasLimit: settingsData.validitas_limit !== undefined ? settingsData.validitas_limit : (ttValiditas?.limit ?? 12),
        randomizeQuestions: settingsData.randomize_questions !== undefined ? settingsData.randomize_questions : true,
        randomizeChoices: settingsData.randomize_choices !== undefined ? settingsData.randomize_choices : true,
        iqDuration: settingsData.iq_duration || ttIq?.duration || settingsData.bakat_duration || 15,
        eqDuration: settingsData.eq_duration || ttEq?.duration || 15,
        hollandDuration: settingsData.holland_duration || ttHolland?.duration || settingsData.minat_duration || 15,
        kepribadianDuration: settingsData.kepribadian_duration || ttKepribadian?.duration || 15,
        validitasDuration: settingsData.validitas_duration || ttValiditas?.duration || 15,
        proctoringMode: settingsData.proctoring_mode || 'AUDIT_ONLY',
        enableAntiCheat: settingsData.enable_anti_cheat !== undefined ? settingsData.enable_anti_cheat : (settingsData.anti_cheat_config?.enableAntiCheat ?? true),
        enableFullscreenLock: settingsData.anti_cheat_config?.enableFullscreenLock ?? true,
        enableTabSwitchDetection: settingsData.anti_cheat_config?.enableTabSwitchDetection ?? true,
        maxAllowedTabSwitches: settingsData.anti_cheat_config?.maxAllowedTabSwitches ?? 3,
        disableCopyPaste: settingsData.anti_cheat_config?.disableCopyPaste ?? true,
        enableDevToolsProtection: settingsData.anti_cheat_config?.enableDevToolsProtection ?? true
      };

      if (Array.isArray(settingsData.registered_classes)) state.registeredClasses = settingsData.registered_classes;
      if (Array.isArray(settingsData.registered_cohorts)) state.registeredCohorts = settingsData.registered_cohorts;
      // Fallback JSONB loads
      if (Array.isArray(settingsData.vouchers)) state.vouchers = settingsData.vouchers;
      if (Array.isArray(settingsData.referrals)) state.referrals = settingsData.referrals;
      if (Array.isArray(settingsData.commissions)) state.commissions = settingsData.commissions;
      if (Array.isArray(settingsData.purchases)) state.purchases = settingsData.purchases;
      if (Array.isArray(settingsData.packages)) state.packages = settingsData.packages;
      if (typeof settingsData.quota_added === 'number') state.quotaAdded = settingsData.quota_added;
      if (Array.isArray(settingsData.test_types)) state.testTypes = settingsData.test_types;
    } else {
      await upsertTestSettings(state);
    }

    // Load all normalized entities concurrently in parallel for maximal performance
    const [
        vouchersRes,
        purchasesRes,
        referralsRes,
        commissionsRes,
        packagesRes,
        questionsRes,
        dimensionsRes,
        majorsRes,
        teachersRes,
        studentsRes,
        classesRes,
        cohortsRes
      ] = await Promise.all([
        supabase.from('vouchers').select('code, type, value, active, usage_count, school_name, max_usage, is_unlimited, expired_at, test_types, test_count, generated_accounts, admin_username, admin_password'),
        supabase.from('purchases').select('id, platform, package_name, buyer_name, buyer_email, amount, voucher_used, referral_used, commission_earned, date, status, quota_added, generated_voucher'),
        supabase.from('referral_codes').select('code, owner_name, commission_rate, total_earned, bank_info'),
        supabase.from('commissions').select('id, referral_code, buyer_name, purchase_amount, commission_amount, status, paid_date, transfer_receipt, date'),
        supabase.from('packages').select('id, name, price, test_count, category, description, test_types, active, logo_url, header_title, institution_name, institution_sub, signature_name, signature_title, signature_nip, education_levels, popular, quota, original_price, features, badge_text, test_type_id, price_per_account, discount_percentage'),
        supabase.from('questions').select('id, test_type, dimension, text, choices, image_url, rubric, option_scores, weight, is_validated, verification_status'),
        supabase.from('dimensions').select('id, name, test_type, description'),
        supabase.from('school_majors').select('id, code, name, riasec_type, description'),
        supabase.from('teachers').select('id, name, role, password, managed_class'),
        supabase.from('students').select('id, name, class_group, angkatan, archived, password, iq_score, eq_score, riasec_scores, dimension_scores, locked_out, lock_reason, test_started, test_completed, test_started_at, test_completed_at, current_question_index, answers, cheat_warnings, ai_analysis, completed_tests, allow_test_types, school_origin, exam_duration_seconds, time_spent_seconds, validation_status, validation_recommendation, validity_score, validity_flags'),
        supabase.from('registered_classes').select('id, name'),
        supabase.from('registered_cohorts').select('id, year')
      ]);

      // 1. Process Vouchers
      if (vouchersRes.data && Array.isArray(vouchersRes.data) && vouchersRes.data.length > 0) {
        state.vouchers = vouchersRes.data.map(v => ({
          code: v.code,
          type: v.type,
          value: v.value,
          active: v.active,
          usageCount: v.usage_count,
          schoolName: v.school_name,
          maxUsage: v.max_usage,
          isUnlimited: v.is_unlimited,
          expiredAt: v.expired_at,
          testTypes: v.test_types,
          testCount: v.test_count,
          generatedAccounts: v.generated_accounts,
          adminUsername: v.admin_username,
          adminPassword: v.admin_password
        }));
      }

      // 2. Process Purchases
      if (purchasesRes.data && Array.isArray(purchasesRes.data) && purchasesRes.data.length > 0) {
        state.purchases = purchasesRes.data.map(p => ({
          id: p.id,
          platform: p.platform,
          packageName: p.package_name,
          buyerName: p.buyer_name,
          buyerEmail: p.buyer_email,
          amount: p.amount,
          voucherUsed: p.voucher_used,
          referralUsed: p.referral_used,
          commissionEarned: p.commission_earned,
          date: p.date,
          status: p.status,
          quotaAdded: p.quota_added,
          generatedVoucher: p.generated_voucher
        }));
      }

      // 3. Process Referrals
      if (referralsRes.data && Array.isArray(referralsRes.data) && referralsRes.data.length > 0) {
        state.referrals = referralsRes.data.map(r => ({
          code: r.code,
          ownerName: r.owner_name,
          commissionRate: r.commission_rate,
          totalEarned: r.total_earned,
          bankInfo: r.bank_info || ''
        }));
      }

      // 4. Process Commissions
      if (commissionsRes.data && Array.isArray(commissionsRes.data) && commissionsRes.data.length > 0) {
        state.commissions = commissionsRes.data.map(c => ({
          id: c.id,
          referralCode: c.referral_code,
          buyerName: c.buyer_name,
          purchaseAmount: c.purchase_amount,
          commissionAmount: c.commission_amount,
          status: c.status,
          paidDate: c.paid_date || null,
          transferReceipt: c.transfer_receipt || null,
          date: c.date || new Date().toISOString()
        }));
      }

      // 5. Process Packages
      if (packagesRes.data && Array.isArray(packagesRes.data) && packagesRes.data.length > 0) {
        state.packages = packagesRes.data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          testCount: p.test_count,
          category: p.category,
          description: p.description,
          testTypes: p.test_types,
          active: p.active,
          logoUrl: p.logo_url,
          headerTitle: p.header_title,
          institutionName: p.institution_name,
          institutionSub: p.institution_sub,
          signatureName: p.signature_name,
          signatureTitle: p.signature_title,
          signatureNip: p.signature_nip,
          educationLevels: p.education_levels,
          popular: p.popular,
          quota: p.quota,
          originalPrice: p.original_price,
          features: p.features,
          badgeText: p.badge_text,
          testTypeId: p.test_type_id,
          pricePerAccount: p.price_per_account,
          discountPercentage: p.discount_percentage
        }));
      }

      // 6. Process Questions
      if (!questionsRes.error && questionsRes.data) {
        let localDeletedIds: Set<string> = new Set();
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('psychometric_deleted_question_ids');
            if (stored) {
              localDeletedIds = new Set(JSON.parse(stored));
            }
          } catch (err) {
            console.warn("Could not read deleted questions cache:", err);
          }
        }
        state.questions = questionsRes.data
          .filter(q => !localDeletedIds.has(String(q.id)))
          .map(q => mapDatabaseRowToQuestion(q));
      }

      // 7. Process Dimensions
      if (!dimensionsRes.error && dimensionsRes.data) {
        state.dimensions = dimensionsRes.data.map(d => mapDatabaseRowToDimension(d));
      }

      // 8. Process Majors
      if (!majorsRes.error && majorsRes.data) {
        state.schoolMajors = majorsRes.data.map(m => ({
          id: m.id,
          code: m.code,
          name: m.name,
          riasecType: m.riasec_type as 'R' | 'I' | 'A' | 'S' | 'E' | 'C',
          description: m.description || ''
        }));
      }

      // 9. Process Teachers
      if (!teachersRes.error && teachersRes.data) {
        state.teachers = teachersRes.data.map(t => {
          const localTeacher = state.teachers.find(lt => lt.id === t.id);
          return {
            id: t.id,
            name: t.name,
            role: t.role,
            password: t.password,
            managed_class: t.managed_class !== undefined ? (t.managed_class || undefined) : (localTeacher?.managed_class || undefined)
          };
        });
      }

      // 10. Process Students
      if (!studentsRes.error && Array.isArray(studentsRes.data)) {
        state.students = studentsRes.data.map(row => mapDatabaseRowToStudent(row));
      }

      // 11. Process Registered Classes
      if (!classesRes.error && Array.isArray(classesRes.data)) {
        state.registeredClasses = Array.from(new Set(classesRes.data.map(c => c.name || c.id))).sort();
      }

      // 12. Process Registered Cohorts
      if (!cohortsRes.error && Array.isArray(cohortsRes.data)) {
        state.registeredCohorts = Array.from(new Set(cohortsRes.data.map(c => Number(c.year || c.id)).filter(y => !isNaN(y)))).sort((a, b) => a - b);
      }

      // Save state to local storage once at the end of the batch
      saveLocalStorageState(state);

    return true;
  } catch (e) {
    console.error("Supabase sync failed:", e);
    return false;
  }
}

/**
 * Helper to safely upsert test settings into Supabase with automatic schema fallback
 */
async function upsertTestSettings(state: StoreDataState) {
  if (!supabase) return;

  const enrichedTestTypes = Array.isArray(state.testTypes)
    ? state.testTypes.map(tt => {
        if (tt.id === 'iq') return { ...tt, active: state.testSettings.iqActive, duration: state.testSettings.iqDuration, limit: state.testSettings.iqLimit };
        if (tt.id === 'eq') return { ...tt, active: state.testSettings.eqActive, duration: state.testSettings.eqDuration, limit: state.testSettings.eqLimit };
        if (tt.id === 'holland' || tt.id === 'minat') return { ...tt, active: state.testSettings.hollandActive, duration: state.testSettings.hollandDuration, limit: state.testSettings.hollandLimit };
        if (tt.id === 'kepribadian') return { ...tt, active: state.testSettings.kepribadianActive, duration: state.testSettings.kepribadianDuration, limit: state.testSettings.kepribadianLimit };
        if (tt.id === 'validitas') return { ...tt, active: state.testSettings.validitasActive, duration: state.testSettings.validitasDuration, limit: state.testSettings.validitasLimit };
        return tt;
      })
    : state.testTypes;

  const fullPayload = {
    id: 'global',
    iq_active: state.testSettings.iqActive,
    eq_active: state.testSettings.eqActive,
    holland_active: state.testSettings.hollandActive,
    kepribadian_active: state.testSettings.kepribadianActive,
    validitas_active: state.testSettings.validitasActive,
    auto_ai_analysis: state.testSettings.autoAiAnalysis,
    iq_limit: state.testSettings.iqLimit,
    eq_limit: state.testSettings.eqLimit,
    holland_limit: state.testSettings.hollandLimit,
    kepribadian_limit: state.testSettings.kepribadianLimit,
    validitas_limit: state.testSettings.validitasLimit,
    randomize_questions: state.testSettings.randomizeQuestions,
    randomize_choices: state.testSettings.randomizeChoices,
    iq_duration: state.testSettings.iqDuration,
    eq_duration: state.testSettings.eqDuration,
    holland_duration: state.testSettings.hollandDuration,
    kepribadian_duration: state.testSettings.kepribadianDuration,
    validitas_duration: state.testSettings.validitasDuration,
    minat_duration: state.testSettings.hollandDuration,
    bakat_duration: state.testSettings.iqDuration,
    proctoring_mode: state.testSettings.proctoringMode || 'AUDIT_ONLY',
    enable_anti_cheat: state.testSettings.enableAntiCheat !== false,
    anti_cheat_config: {
      enableAntiCheat: state.testSettings.enableAntiCheat !== false,
      enableFullscreenLock: state.testSettings.enableFullscreenLock !== false,
      enableTabSwitchDetection: state.testSettings.enableTabSwitchDetection !== false,
      maxAllowedTabSwitches: state.testSettings.maxAllowedTabSwitches || 3,
      disableCopyPaste: state.testSettings.disableCopyPaste !== false,
      enableDevToolsProtection: state.testSettings.enableDevToolsProtection !== false
    },
    registered_classes: state.registeredClasses,
    registered_cohorts: state.registeredCohorts,
    quota_added: state.quotaAdded,
    test_types: enrichedTestTypes,
    // Keep legacy JSONB for fallback
    vouchers: state.vouchers,
    referrals: state.referrals,
    commissions: state.commissions,
    purchases: state.purchases,
    packages: state.packages
  };

  const { error } = await resilientUpsert(supabase, 'test_settings', fullPayload);
  if (error) {
    console.warn("Notice: test_settings sync operating in local-memory fallback mode:", error.message || error);
  }

  // Sync to normalized tables
  if (state.vouchers.length > 0) {
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
  }

  if (state.purchases.length > 0) {
    const pRows = state.purchases.map(p => ({
      id: p.id,
      platform: p.platform,
      package_name: p.packageName,
      buyer_name: p.buyerName,
      buyer_email: p.buyerEmail,
      amount: p.amount,
      voucher_used: p.voucherUsed || null,
      referral_used: p.referralUsed || null,
      commission_earned: p.commissionEarned,
      date: p.date,
      status: p.status,
      quota_added: p.quotaAdded || 0,
      generated_voucher: p.generatedVoucher || null
    }));
    await resilientUpsert(supabase, 'purchases', pRows, { onConflict: 'id' });
  }

  if (state.packages.length > 0) {
    const pkgRows = state.packages.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      test_count: p.testCount || null,
      category: p.category || null,
      description: p.description || null,
      test_types: p.testTypes || null,
      active: p.active ?? true,
      logo_url: p.logoUrl || null,
      header_title: p.headerTitle || null,
      institution_name: p.institutionName || null,
      institution_sub: p.institutionSub || null,
      signature_name: p.signatureName || null,
      signature_title: p.signatureTitle || null,
      signature_nip: p.signatureNip || null,
      education_levels: p.educationLevels || null,
      popular: p.popular || false,
      quota: p.quota || null,
      original_price: p.originalPrice || null,
      features: p.features || null,
      badge_text: p.badgeText || null,
      test_type_id: p.testTypeId || null,
      price_per_account: p.pricePerAccount || null,
      discount_percentage: p.discountPercentage || null
    }));
    await resilientUpsert(supabase, 'packages', pkgRows, { onConflict: 'id' });
  }

  if (state.referrals && state.referrals.length > 0) {
    const rRows = state.referrals.map(r => ({
      code: r.code,
      owner_name: r.ownerName,
      commission_rate: r.commissionRate || 0,
      total_earned: r.totalEarned || 0,
      bank_info: r.bankInfo || null
    }));
    await resilientUpsert(supabase, 'referral_codes', rRows, { onConflict: 'code' });
  }

  if (state.commissions && state.commissions.length > 0) {
    const cRows = state.commissions.map(c => ({
      id: c.id,
      referral_code: c.referralCode,
      buyer_name: c.buyerName,
      purchase_amount: c.purchaseAmount || 0,
      commission_amount: c.commissionAmount || 0,
      status: c.status || 'Pending',
      paid_date: c.paidDate || null,
      transfer_receipt: c.transferReceipt || null,
      date: c.date || new Date().toISOString()
    }));
    await resilientUpsert(supabase, 'commissions', cRows, { onConflict: 'id' });
  }

}

export async function saveToSupabaseTarget(
  state: StoreDataState,
  target?: {
    studentId?: string;
    lastAnsweredQId?: string;
    settings?: boolean;
    questions?: boolean;
    teachers?: boolean;
    majors?: boolean;
    dimensions?: boolean;
    deleteStudentId?: string;
    deleteQuestionId?: string;
    deleteTeacherId?: string;
    deleteMajorId?: string;
    full?: boolean;
  }
): Promise<any> {
  const actualTarget = (target || { settings: true, full: true }) as any;

  // 1. ALWAYS dispatch REST API sync payload to server /api/sync so server writes using server credentials
  try {
    if (actualTarget.studentId) {
      const s = state.students.find(x => x.id === actualTarget.studentId);
      if (s) {
        syncManager.enqueue({ type: 'student_upsert', studentId: s.id, data: s });
      }
    } else if (actualTarget.deleteStudentId) {
      syncManager.enqueue({ type: 'student_delete', studentId: actualTarget.deleteStudentId });
    } else if (actualTarget.full || (actualTarget.students && state.students.length > 0)) {
      syncManager.enqueue({ type: 'full_students_sync', data: state.students });
    }

    if (actualTarget.questions && state.questions.length > 0) {
      syncManager.enqueue({ type: 'questions_sync', data: state.questions });
    }

    if (actualTarget.teachers && state.teachers.length > 0) {
      syncManager.enqueue({ type: 'teachers_sync', data: state.teachers });
    }
  } catch (enqueueErr) {
    console.warn("Sync enqueue caught:", enqueueErr);
  }

  // 2. Direct browser-to-Supabase call if client supabase is initialized
  if (!getIsSupabaseConfigured() || !supabase) return;
  const client = supabase;

  try {
    if (actualTarget.settings || actualTarget.full) {
      await upsertTestSettings(state);

      if (state.registeredClasses.length > 0) {
        const { error } = await resilientUpsert(client, 'registered_classes', state.registeredClasses.map(c => ({ id: c, name: c })));
        if (error) console.error("Supabase error upserting registered_classes:", error);
      }
      if (state.registeredCohorts.length > 0) {
        const { error } = await resilientUpsert(client, 'registered_cohorts', state.registeredCohorts.map(y => ({ id: String(y), year: y })));
        if (error) console.error("Supabase error upserting registered_cohorts:", error);
      }
    }

    if (actualTarget.studentId) {
      const s = state.students.find(x => x.id === actualTarget.studentId);
      if (s && s.id && String(s.id).trim() !== '' && String(s.id).trim() !== 'undefined') {
        const row = mapStudentToDbRow(s);
        const { error } = await resilientUpsert(client, 'students', row);
        
        if (error) {
          console.warn("Supabase student upsert notice:", error.message || error);
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            console.warn("[Supabase RLS Error] Row-Level Security is blocking student upserts. Run 'sql-rls.sql' in Supabase SQL Editor.");
          }
        } else if (actualTarget.lastAnsweredQId) {
          markAnswerSynced(s.id, actualTarget.lastAnsweredQId).catch(() => {});
        }
      }
    } else if (actualTarget.deleteStudentId) {
      const { error } = await client.from('students').delete().eq('id', actualTarget.deleteStudentId);
      if (error) console.warn("Supabase student delete notice:", error.message || error);
    } else if (actualTarget.full && state.students.length > 0) {
      const rows = state.students
        .map(s => mapStudentToDbRow(s))
        .filter(r => Boolean(r.id) && r.id !== 'undefined');

      const chunkSize = 50;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await resilientUpsert(client, 'students', chunk);
        if (error) {
          console.warn("Supabase batch students upsert notice:", error.message || error);
          if (error.code === '42501' || error.message?.includes('row-level security')) {
            console.warn("[Supabase RLS Error] Row-Level Security is blocking student batch upserts. Run 'sql-rls.sql' in Supabase SQL Editor.");
          }
        }
      }
    }

    if (actualTarget.deleteQuestionId) {
      const { error } = await client.from('questions').delete().eq('id', actualTarget.deleteQuestionId);
      if (error) console.error("Supabase error deleting question:", error);
    } else if (actualTarget.questions && state.questions.length > 0) {
      const { error } = await resilientUpsert(client, 'questions', state.questions.map(q => mapQuestionToDbRow(q)));
      if (error) console.error("Supabase error upserting questions:", error);
    }

    if (actualTarget.dimensions && state.dimensions.length > 0) {
      const { error } = await resilientUpsert(client, 'dimensions', state.dimensions.map(d => ({
        id: d.id,
        name: d.name,
        test_type: d.testType,
        description: d.description
      })));
      if (error) console.error("Supabase error upserting dimensions:", error);
    }

    if (actualTarget.teachers && state.teachers.length > 0) {
      const { error } = await resilientUpsert(client, 'teachers', state.teachers.map(t => ({
        id: t.id,
        name: t.name,
        role: t.role,
        password: t.password,
        managed_class: t.managed_class || null
      })));
      if (error) console.error("Supabase error upserting teachers:", error);
    }

    if (actualTarget.majors && state.schoolMajors.length > 0) {
      const { error } = await resilientUpsert(client, 'school_majors', state.schoolMajors.map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        riasec_type: m.riasecType,
        description: m.description
      })));
      if (error) console.error("Supabase error upserting school_majors:", error);
    }
  } catch (err) {
    console.error("Supabase target sync exception:", err);
  }
}
