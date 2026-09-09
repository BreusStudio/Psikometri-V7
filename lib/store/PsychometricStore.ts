import {
  Student, Teacher, Question, Dimension, SchoolMajor, TestSettings, TestType, Voucher, Purchase, ReferralCode, Commission, Package, RegistrationRequest, LandingPageContent, ScoringCalibrationSettings
} from '../types';
import { classifyQuestionItem, batchClassifyQuestions } from '../services/itemClassifierService';
import { isSupabaseConfigured, supabase, resilientUpsert } from '../supabase';
import { saveAnswerToCache, clearExamCache, clearAllCache } from '../indexedDB';
import { PRESET_QUESTIONS, INITIAL_STUDENTS, INITIAL_TEACHERS } from '../presetQuestions';
import { PRESET_MAJORS, PRESET_DIMENSIONS, PRESET_TEST_TYPES, PRESET_PACKAGES } from '../mock/presets';
import { generateVoucherAccounts } from './voucherGenerator';
import { processDataGridImport } from './importHelpers';
import { calculateStudentScores } from './scoreCalculator';
import { generateDummyCompletedStudents as generateDummyHelper } from '../services/dummyDataGeneratorService';
import { StoreDataState, loadLocalStorageState, saveLocalStorageState } from './storageSync';
import { syncWithSupabase, setupRealtimeSubscriptions, saveToSupabaseTarget } from './supabaseSync';
import { syncManager } from '@/lib/api';
import { sanitizeQuestion, sanitizeQuestionsList, filterQuestionsForStudent } from '../core/questionSanitizer';
import { resolveEffectiveTestType } from '../core/testTypeResolver';
import { CANONICAL_DIMENSIONS, normalizeCanonicalDimension } from '../metadata/canonicalDimensions';
import { isRegistrationExpired, REGISTRATION_EXPIRY_HOURS } from '../metadata/registrationMetadata';

export class PsychometricStore {
  private state: StoreDataState;
  private listeners: Array<() => void> = [];
  private questionsIndexMap: Map<string, Question[]> = new Map();

  constructor() {
    this.state = loadLocalStorageState();
    this.sanitizeAndIndexQuestions();
    this.recalculateAllScores();

    if (typeof window !== 'undefined' && isSupabaseConfigured) {
      this.syncWithSupabase().then(success => {
        if (success) {
          console.log("Supabase synchronized successfully.");
          this.sanitizeAndIndexQuestions();
          this.recalculateAllScores();
          this.notifyListeners();
        }
      });
    }
  }

  public recalculateAllScores(): void {
    if (!this.state.students || this.state.students.length === 0) return;
    let modified = false;
    const questions = this.state.questions || PRESET_QUESTIONS;
    const dimensions = this.state.dimensions || [];
    const settings = this.state.testSettings;

    for (const student of this.state.students) {
      if (student.testCompleted || (student.answers && Object.keys(student.answers).length > 0) || student.iqScore !== null) {
        calculateStudentScores(student, questions, dimensions, settings);
        modified = true;
      }
    }
    if (modified) {
      this.saveLocalStorageOnly();
    }
  }

  private sanitizeAndIndexQuestions(): void {
    if (!this.state.questions || this.state.questions.length === 0) {
      const hasStoredQuestions = typeof window !== 'undefined' && localStorage.getItem('psychometric_questions') !== null;
      if (!hasStoredQuestions) {
        this.state.questions = sanitizeQuestionsList(PRESET_QUESTIONS);
      } else {
        this.state.questions = [];
      }
    } else {
      this.state.questions = sanitizeQuestionsList(this.state.questions);
    }
    this.rebuildQuestionsIndex();
  }

  private rebuildQuestionsIndex(): void {
    this.questionsIndexMap.clear();
    const questions = this.state.questions || [];
    
    for (const q of questions) {
      const effType = resolveEffectiveTestType(q, this.state.dimensions).toUpperCase();
      const existing = this.questionsIndexMap.get(effType) || [];
      existing.push(q);
      this.questionsIndexMap.set(effType, existing);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public notifyListeners() {
    // Schedule listener execution on the microtask queue to prevent "Cannot update during render" React warnings
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        this.listeners.forEach(l => {
          try {
            l();
          } catch (e) {
            console.error("Error in store listener:", e);
          }
        });
      });
    } else {
      setTimeout(() => {
        this.listeners.forEach(l => {
          try {
            l();
          } catch (e) {
            console.error("Error in store listener:", e);
          }
        });
      }, 0);
    }
  }

  public setupRealtime(): (() => void) | undefined {
    return setupRealtimeSubscriptions(this.state, () => this.notifyListeners());
  }

  public async syncWithSupabase(): Promise<boolean> {
    return syncWithSupabase(this.state);
  }

  public saveLocalStorageOnly() {
    this.archiveOldStudents();
    saveLocalStorageState(this.state);
  }

  public saveToStorage(target?: {
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
  }): Promise<any> | undefined {
    this.saveLocalStorageOnly();
    this.notifyListeners();
    return saveToSupabaseTarget(this.state, target);
  }

  // Auth Operations
  public authenticateStudent(nim: string, pass: string): Student | null {
    const student = this.state.students.find(s => s.id === nim && s.password === pass);
    return student || null;
  }

  public authenticateTeacher(id: string, pass: string): Teacher | null {
    const teacher = this.state.teachers.find(t => t.id === id && t.password === pass);
    return teacher || null;
  }

  // Classes & Cohorts
  public getRegisteredClasses(): string[] {
    return [...this.state.registeredClasses];
  }

  public addRegisteredClass(name: string): boolean {
    const clean = name.trim().toUpperCase();
    if (!clean || this.state.registeredClasses.includes(clean)) return false;
    this.state.registeredClasses.push(clean);
    this.state.registeredClasses.sort();
    this.saveToStorage();
    if (isSupabaseConfigured && supabase) {
      resilientUpsert(supabase, 'registered_classes', { id: clean, name: clean }).then();
    }
    return true;
  }

  public deleteRegisteredClass(name: string): boolean {
    const clean = name.trim().toUpperCase();
    const len = this.state.registeredClasses.length;
    this.state.registeredClasses = this.state.registeredClasses.filter(c => c !== clean);
    if (this.state.registeredClasses.length < len) {
      this.saveToStorage();
      if (isSupabaseConfigured && supabase) {
        supabase.from('registered_classes').delete().eq('id', clean).then();
      }
      return true;
    }
    return false;
  }

  public async clearAllClasses(): Promise<void> {
    this.state.registeredClasses = [];
    this.saveToStorage();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('registered_classes').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear all registered_classes on Supabase:", err);
      }
    }
  }

  public getRegisteredCohorts(): number[] {
    return [...this.state.registeredCohorts];
  }

  public addRegisteredCohort(cohort: number): boolean {
    if (!cohort || isNaN(cohort) || this.state.registeredCohorts.includes(cohort)) return false;
    this.state.registeredCohorts.push(cohort);
    this.state.registeredCohorts.sort((a, b) => a - b);
    this.saveToStorage();
    if (isSupabaseConfigured && supabase) {
      resilientUpsert(supabase, 'registered_cohorts', { id: String(cohort), year: cohort }).then();
    }
    return true;
  }

  public deleteRegisteredCohort(cohort: number): boolean {
    const len = this.state.registeredCohorts.length;
    this.state.registeredCohorts = this.state.registeredCohorts.filter(c => c !== cohort);
    if (this.state.registeredCohorts.length < len) {
      this.saveToStorage();
      if (isSupabaseConfigured && supabase) {
        supabase.from('registered_cohorts').delete().eq('id', String(cohort)).then();
      }
      return true;
    }
    return false;
  }

  public async clearAllCohorts(): Promise<void> {
    this.state.registeredCohorts = [];
    this.saveToStorage();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('registered_cohorts').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear all registered_cohorts on Supabase:", err);
      }
    }
  }

  // Voucher Operations
  public getVouchers(): Voucher[] {
    return this.state.vouchers || [];
  }

  public saveVoucher(voucher: Voucher): void {
    const { updatedVoucher, updatedStudents, updatedTeachers } = generateVoucherAccounts(
      voucher,
      this.state.students,
      this.state.teachers
    );
    this.state.students = updatedStudents;
    this.state.teachers = updatedTeachers;

    const idx = this.state.vouchers.findIndex(v => v.code.toUpperCase() === updatedVoucher.code.toUpperCase());
    if (idx >= 0) {
      this.state.vouchers[idx] = updatedVoucher;
    } else {
      this.state.vouchers.push(updatedVoucher);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteVoucher(code: string): void {
    this.state.vouchers = this.state.vouchers.filter(v => v.code.toUpperCase() !== code.toUpperCase());
    this.saveToStorage();
    this.notifyListeners();
  }

  // Referral Operations
  public getReferrals(): ReferralCode[] {
    return this.state.referrals || [];
  }

  public saveReferral(referral: ReferralCode): void {
    const idx = this.state.referrals.findIndex(r => r.code.toUpperCase() === referral.code.toUpperCase());
    if (idx >= 0) {
      this.state.referrals[idx] = referral;
    } else {
      this.state.referrals.push(referral);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteReferral(code: string): void {
    this.state.referrals = this.state.referrals.filter(r => r.code.toUpperCase() !== code.toUpperCase());
    this.saveToStorage();
    this.notifyListeners();
  }

  // Purchase Operations
  public getPurchases(): Purchase[] {
    return this.state.purchases || [];
  }

  public addPurchase(p: Purchase): void {
    const voucherCode = `VCHR-${p.id.replace('TX-', '').toUpperCase()}`;
    p.generatedVoucher = voucherCode;
    this.state.purchases.push(p);

    if (p.voucherUsed) {
      const v = this.state.vouchers.find(v => v.code.toUpperCase() === p.voucherUsed?.toUpperCase());
      if (v) v.usageCount++;
    }

    if (p.referralUsed && p.commissionEarned > 0) {
      const r = this.state.referrals.find(ref => ref.code.toUpperCase() === p.referralUsed?.toUpperCase());
      if (r) r.totalEarned += p.commissionEarned;

      const commissionId = 'COM-' + Math.floor(1000 + Math.random() * 9000);
      this.state.commissions.push({
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
      this.state.quotaAdded += p.quotaAdded;
      const packageTestCount = p.quotaAdded > 0 ? p.quotaAdded : 1;
      const matchedPkg = this.state.packages.find(pkg => pkg.name === p.packageName);
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

      this.saveVoucher(autoVoucher);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  public updatePurchase(p: Purchase): void {
    const idx = this.state.purchases.findIndex(x => x.id === p.id);
    if (idx >= 0) {
      this.state.purchases[idx] = p;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public deletePurchase(id: string): void {
    this.deletePurchaseCascade(id);
  }

  public archivePurchase(idOrCode: string): boolean {
    const purchase = this.state.purchases.find(x => x.id === idOrCode || x.generatedVoucher === idOrCode);
    const voucherCode = purchase?.generatedVoucher || idOrCode;
    const voucher = this.state.vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    const buyerName = purchase?.buyerName || purchase?.schoolName || '';

    if (purchase) {
      (purchase as any).status = 'Archived';
    }

    if (voucher) {
      voucher.active = false;
    }

    if (buyerName) {
      const lowerName = buyerName.toLowerCase().trim();
      this.state.students.forEach(s => {
        if ((s.schoolOrigin || s.school_origin || '').toLowerCase().trim() === lowerName || s.invoiceNumber === purchase?.invoiceNumber) {
          s.lockedOut = true;
          s.registrationStatus = 'DRAFT';
        }
      });
    }

    if (voucher && voucher.generatedAccounts) {
      const accUsernames = voucher.generatedAccounts.map(a => a.username);
      this.state.students.forEach(s => {
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

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  public deletePurchaseCascade(idOrCode: string): boolean {
    const purchase = this.state.purchases.find(x => x.id === idOrCode || x.generatedVoucher === idOrCode);
    const voucherCode = purchase?.generatedVoucher || idOrCode;
    const voucher = this.state.vouchers.find(v => v.code.toUpperCase() === voucherCode.toUpperCase());
    const buyerName = purchase?.buyerName || purchase?.schoolName || '';
    const buyerEmail = purchase?.email || (purchase as any)?.buyerEmail || '';

    let studentIdsToDelete: string[] = [];

    if (voucher && voucher.generatedAccounts) {
      studentIdsToDelete.push(...voucher.generatedAccounts.map(a => a.username));
    }

    if (buyerName) {
      const lowerName = buyerName.toLowerCase().trim();
      const matchingStudents = this.state.students.filter(s => 
        (s.schoolOrigin || s.school_origin || '').toLowerCase().trim() === lowerName ||
        (purchase && s.invoiceNumber === purchase.invoiceNumber) ||
        (buyerEmail && s.email && s.email.toLowerCase() === buyerEmail.toLowerCase())
      );
      studentIdsToDelete.push(...matchingStudents.map(s => s.id));
    }

    studentIdsToDelete = Array.from(new Set(studentIdsToDelete));

    if (studentIdsToDelete.length > 0) {
      this.state.students = this.state.students.filter(s => !studentIdsToDelete.includes(s.id));
      if (isSupabaseConfigured && supabase) {
        supabase.from('student_answers').delete().in('student_id', studentIdsToDelete).then();
        supabase.from('students').delete().in('id', studentIdsToDelete).then();
      }
    }

    if (buyerEmail || (purchase && purchase.invoiceNumber)) {
      this.state.registrations = (this.state.registrations || []).filter(r => 
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
      this.state.vouchers = this.state.vouchers.filter(v => v.code.toUpperCase() !== voucherCode.toUpperCase());
      if (isSupabaseConfigured && supabase) {
        supabase.from('vouchers').delete().eq('code', voucherCode).then();
      }
    }

    if (purchase) {
      this.state.purchases = this.state.purchases.filter(x => x.id !== purchase.id);
      if (isSupabaseConfigured && supabase) {
        supabase.from('purchases').delete().eq('id', purchase.id).then();
      }
    } else if (idOrCode) {
      this.state.purchases = this.state.purchases.filter(x => x.id !== idOrCode);
      if (isSupabaseConfigured && supabase) {
        supabase.from('purchases').delete().eq('id', idOrCode).then();
      }
    }

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // Commission Operations
  public getCommissions(): Commission[] {
    return this.state.commissions || [];
  }

  public updateCommissionStatus(id: string, status: 'Pending' | 'Paid', receipt: string | null): void {
    const c = this.state.commissions.find(x => x.id === id);
    if (c) {
      c.status = status;
      c.transferReceipt = receipt;
      c.paidDate = status === 'Paid' ? new Date().toISOString() : null;
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public payCommission(id: string, receipt: string): boolean {
    const c = this.state.commissions.find(x => x.id === id);
    if (c) {
      c.status = 'Paid';
      c.transferReceipt = receipt;
      c.paidDate = new Date().toISOString();
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Registration Operations
  public getRegistrations(): RegistrationRequest[] {
    if (!this.state.registrations) {
      this.state.registrations = [];
    }
    this.checkAndAutoExpireRegistrations();
    return this.state.registrations;
  }

  public checkAndAutoExpireRegistrations(): void {
    if (!this.state.registrations || this.state.registrations.length === 0) return;
    let mutated = false;

    this.state.registrations.forEach(r => {
      // Auto-expire unpaid/pending registrations older than 2x24h (48 Hours)
      if (r.status === 'Pending' || (r.status as string) === 'Unpaid') {
        const timeRef = r.submittedAt || r.requestedAt;
        if (timeRef && isRegistrationExpired(timeRef, REGISTRATION_EXPIRY_HOURS)) {
          r.status = 'Draft';
          r.paymentStatus = 'UNPAID';
          mutated = true;

          // If personal student exists, set lock reason
          if (r.personalStudentId && this.state.students) {
            const student = this.state.students.find(s => s.id === r.personalStudentId);
            if (student && student.paymentStatus !== 'PAID') {
              student.registrationStatus = 'PENDING';
              student.lockedOut = true;
              student.lockReason = 'Batas waktu pembayaran (2x24 Jam) telah kadaluarsa. Status pendaftaran dialihkan ke Draf.';
            }
          }
        }
      }
    });

    if (mutated) {
      this.saveToStorage();
    }
  }

  public addRegistration(req: Omit<RegistrationRequest, 'id' | 'status' | 'requestedAt'> & Partial<RegistrationRequest>): RegistrationRequest {
    const nowIso = new Date().toISOString();
    const expiryDateIso = new Date(Date.now() + REGISTRATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const newReq: RegistrationRequest = {
      ...req,
      id: req.id || 'REG-' + Math.floor(10000 + Math.random() * 90000),
      categoryType: req.categoryType || (req.registrationType === 'personal' ? 'personal' : 'sekolah'),
      schoolType: req.schoolType || 'SMK',
      selectedTestModules: req.selectedTestModules || ['IQ', 'Holland'],
      testModulesNames: req.testModulesNames || (req.selectedTestModules ? req.selectedTestModules.join(', ') : 'IQ, Holland RIASEC'),
      status: 'Pending',
      paymentStatus: req.paymentStatus || 'UNPAID',
      amount: req.amount || req.totalAmount || 0,
      totalAmount: req.totalAmount || req.amount || 0,
      requestedAt: nowIso,
      submittedAt: nowIso,
      expiresAt: expiryDateIso
    };
    if (!this.state.registrations) {
      this.state.registrations = [];
    }
    this.state.registrations.unshift(newReq);
    this.saveToStorage();
    this.notifyListeners();
    return newReq;
  }

  public updateRegistrationStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'Expired', rejectionReason?: string): void {
    if (!this.state.registrations) return;
    const reg = this.state.registrations.find(r => r.id === id);
    if (reg) {
      const oldStatus = reg.status;
      reg.status = status;
      if (rejectionReason) reg.rejectionReason = rejectionReason;
      
      // If approved and wasn't approved before, create the admin account and auto-provision students (for instansi/b2b)
      if (status === 'Approved' && oldStatus !== 'Approved' && reg.registrationType !== 'personal' && reg.categoryType !== 'personal') {
        const username = reg.adminEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.floor(100 + Math.random() * 900);
        
        let context = 'school_smk';
        if (reg.schoolType === 'SMA') context = 'school_sma';
        else if (reg.schoolType === 'SMP') context = 'school_smp';
        else if (reg.schoolType === 'SD') context = 'school_sd';
        else if (reg.schoolType === 'Instansi' || reg.schoolType === 'Perusahaan') context = 'perusahaan';
        else if (reg.schoolType === 'Lainnya') context = 'personal';

        const newAdmin: Teacher = {
          id: username,
          name: 'Admin ' + reg.schoolName,
          password: reg.adminPassword || 'password123',
          role: 'Admin',
          school_origin: reg.schoolName,
          applicableContexts: [context]
        };

        if (!this.state.teachers) {
          this.state.teachers = [];
        }
        if (!this.state.teachers.some(t => t.id === newAdmin.id || (t.email && t.email === reg.adminEmail))) {
          this.state.teachers.push(newAdmin);
        }

        // Auto-provision initial student user accounts for the institution if none exist yet
        const existingSchoolStudents = this.state.students.filter(s => 
          (s.schoolOrigin || s.school_origin || '').trim().toLowerCase() === reg.schoolName.trim().toLowerCase()
        );

        if (existingSchoolStudents.length === 0) {
          const countToCreate = reg.estimatedStudents && reg.estimatedStudents > 0 ? Math.min(reg.estimatedStudents, 100) : 20;
          const slug = reg.schoolName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'SCH';
          const selectedModules = reg.selectedTestModules && reg.selectedTestModules.length > 0 ? reg.selectedTestModules : ['IQ', 'EQ', 'Holland'];

          for (let i = 1; i <= countToCreate; i++) {
            const numStr = i.toString().padStart(2, '0');
            const studentId = `USR-${slug}-${numStr}`;
            const studentName = `Peserta ${i} (${reg.schoolName})`;

            this.addStudent({
              id: studentId,
              name: studentName,
              schoolOrigin: reg.schoolName,
              classGroup: reg.schoolType || 'Instansi',
              angkatan: new Date().getFullYear(),
              gender: i % 2 === 0 ? 'L' : 'P',
              password: reg.adminPassword || 'user123',
              paymentStatus: 'PAID',
              registrationStatus: 'APPROVED',
              allowedTests: selectedModules,
            }, true);
          }
        }
      }
    }
    this.saveToStorage({ teachers: true });
    this.notifyListeners();
  }

  public deleteRegistration(id: string): void {
    if (!this.state.registrations) return;
    this.state.registrations = this.state.registrations.filter(r => r.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  // Quota calculation
  public getQuotaInfo() {
    const activeStudents = this.state.students.filter(s => !s.archived).length;
    const baseQuota = 150;
    const totalQuota = baseQuota + this.state.quotaAdded;
    return {
      base: baseQuota,
      purchased: this.state.quotaAdded,
      total: totalQuota,
      used: activeStudents,
      remaining: Math.max(0, totalQuota - activeStudents)
    };
  }

  public updateQuotaAdded(amount: number): void {
    this.state.quotaAdded = amount;
    localStorage.setItem('psychometric_quota_added', String(amount));
    this.saveToStorage();
    this.notifyListeners();
  }

  // Sync Mode Controls
  public getSyncMode(): 'sync' | 'async' {
    return this.state.syncMode || 'async';
  }

  public setSyncMode(mode: 'sync' | 'async'): void {
    this.state.syncMode = mode;
    localStorage.setItem('psychometric_sync_mode', mode);
    this.saveToStorage();
    this.notifyListeners();
  }

  // Package Operations
  public getPackages(): Package[] {
    return this.state.packages || [];
  }

  public savePackage(pkg: Package): void {
    const idx = this.state.packages.findIndex(p => p.id === pkg.id);
    if (idx >= 0) {
      this.state.packages[idx] = pkg;
    } else {
      this.state.packages.push(pkg);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public deletePackage(id: string): void {
    this.state.packages = this.state.packages.filter(p => p.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  // Teacher/User CRUD
  public getTeachers(): Teacher[] {
    return this.state.teachers;
  }

  public addTeacher(newTeacher: Teacher): boolean {
    if (this.state.teachers.some(t => t.id.toLowerCase() === newTeacher.id.toLowerCase())) {
      return false;
    }
    this.state.teachers.push(newTeacher);
    this.saveToStorage();
    return true;
  }

  public updateTeacher(id: string, updated: Partial<Omit<Teacher, 'id'>>): boolean {
    const teacher = this.state.teachers.find(t => t.id === id);
    if (teacher) {
      if (updated.name !== undefined) teacher.name = updated.name;
      if (updated.role !== undefined) teacher.role = updated.role;
      if (updated.password !== undefined) teacher.password = updated.password;
      if (updated.managed_class !== undefined) teacher.managed_class = updated.managed_class;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public deleteTeacher(id: string): boolean {
    const index = this.state.teachers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.teachers.splice(index, 1);
      if (isSupabaseConfigured && supabase) {
        supabase.from('teachers').delete().eq('id', id).then();
      }
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Getters
  public getStudents(): Student[] {
    return this.state.students;
  }

  public archiveOldStudents() {
    const currentYear = new Date().getFullYear();
    this.state.students.forEach(s => {
      if (!s.archived && s.angkatan && (currentYear - s.angkatan) >= 3) {
        s.archived = true;
      }
    });
  }

  public getQuestions(): Question[] {
    if (!this.state.questions || this.state.questions.length === 0) {
      this.hydratePresetQuestionsIfEmpty();
    }
    return this.state.questions;
  }

  /**
   * High-performance subtest question retrieval with O(1) indexed lookup and resilient fallback hydration.
   */
  public getQuestionsBySubtest(
    subtestType: string,
    options?: {
      student?: Student | null;
      voucher?: Voucher | null;
      packageId?: string;
    }
  ): Question[] {
    if (!this.state.questions || this.state.questions.length === 0) {
      this.hydratePresetQuestionsIfEmpty();
    }

    const canonicalType = resolveEffectiveTestType({ testType: subtestType }, this.state.dimensions).toUpperCase();
    let indexed = this.questionsIndexMap.get(canonicalType) || [];

    if (indexed.length === 0) {
      // Re-index defensively if cache was cold
      this.rebuildQuestionsIndex();
      indexed = this.questionsIndexMap.get(canonicalType) || [];
    }

    // Resolve target package from options or voucher
    const packageId = options?.packageId || (options?.voucher as any)?.packageCode || (options?.voucher as any)?.packageId;

    // Run resilient student filter with tiered fallbacks
    const filtered = filterQuestionsForStudent(
      indexed.length > 0 ? indexed : this.state.questions,
      subtestType,
      {
        student: options?.student,
        voucher: options?.voucher,
        masterDimensions: this.state.dimensions,
        packageId
      }
    );

    // If still 0, provide preset fallback guaranteed (excluding archived)
    if (filtered.length === 0) {
      return PRESET_QUESTIONS.filter(q => !q.archived && resolveEffectiveTestType(q, this.state.dimensions).toUpperCase() === canonicalType);
    }

    return filtered;
  }

  public hydratePresetQuestionsIfEmpty(): void {
    if (!this.state.questions || this.state.questions.length === 0) {
      this.state.questions = sanitizeQuestionsList(PRESET_QUESTIONS);
      this.rebuildQuestionsIndex();
      this.saveToStorage({ questions: true });
      this.notifyListeners();
    }
  }

  public autoClassifyAllQuestions(): { count: number } {
    if (!this.state.questions || this.state.questions.length === 0) {
      this.hydratePresetQuestionsIfEmpty();
    }
    const { questions: updated, count } = batchClassifyQuestions(this.state.questions);
    this.state.questions = sanitizeQuestionsList(updated);
    this.rebuildQuestionsIndex();
    this.saveToStorage();
    this.notifyListeners();
    return { count };
  }

  public updateQuestionPsychometrics(questionId: string, updates: Partial<Question>): boolean {
    const idx = this.state.questions.findIndex(q => String(q.id) === String(questionId));
    if (idx !== -1) {
      const q = this.state.questions[idx];
      const updated = {
        ...q,
        ...updates,
        aiClassification: {
          ...(q.aiClassification || {
            suggestedLevel: updates.educationLevel || q.educationLevel || 'SMA',
            suggestedDifficulty: updates.difficultyLevel || q.difficultyLevel || 'sedang',
            confidence: 1.0,
            reasoning: 'Diubah dan diverifikasi secara manual oleh Psikolog/Admin.'
          }),
          reviewStatus: updates.aiClassification?.reviewStatus || 'OVERRIDDEN',
          lastAnalyzedAt: new Date().toISOString()
        }
      };
      this.state.questions[idx] = updated;
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public getDimensions(): Dimension[] {
    return this.state.dimensions;
  }

  public addDimension(newDim: Omit<Dimension, 'id'>): boolean {
    const id = "dim-" + Date.now();
    if (this.state.dimensions.some(d => d.name.toLowerCase() === newDim.name.toLowerCase() && d.testType === newDim.testType)) {
      return false;
    }
    this.state.dimensions.push({ id, ...newDim });
    this.saveToStorage();
    return true;
  }

  public updateDimension(id: string, updated: Omit<Dimension, 'id'>): boolean {
    const idx = this.state.dimensions.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.state.dimensions[idx] = { id, ...updated };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public deleteDimension(id: string): boolean {
    const initialLen = this.state.dimensions.length;
    this.state.dimensions = this.state.dimensions.filter(d => d.id !== id);
    if (isSupabaseConfigured && supabase) {
      supabase.from('dimensions').delete().eq('id', id).then();
    }
    this.saveToStorage();
    return this.state.dimensions.length < initialLen;
  }

  public getSchoolMajors(): SchoolMajor[] {
    return this.state.schoolMajors;
  }

  public addSchoolMajor(major: Omit<SchoolMajor, 'id'>): boolean {
    const id = "maj-" + Date.now();
    if (this.state.schoolMajors.some(m => m.code.toUpperCase() === major.code.toUpperCase())) {
      return false;
    }
    this.state.schoolMajors.push({ id, ...major });
    this.saveToStorage();
    return true;
  }

  public updateSchoolMajor(id: string, updated: Omit<SchoolMajor, 'id'>): boolean {
    const idx = this.state.schoolMajors.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.state.schoolMajors[idx] = { id, ...updated };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public deleteSchoolMajor(id: string): boolean {
    const initialLen = this.state.schoolMajors.length;
    this.state.schoolMajors = this.state.schoolMajors.filter(m => m.id !== id);
    if (isSupabaseConfigured && supabase) {
      supabase.from('school_majors').delete().eq('id', id).then();
    }
    this.saveToStorage();
    return this.state.schoolMajors.length < initialLen;
  }

  public getTestSettings(): TestSettings {
    return this.state.testSettings;
  }

  public updateTestSettings(settings: Partial<TestSettings>) {
    this.state.testSettings = { ...this.state.testSettings, ...settings };
    this.saveToStorage();
    syncManager.enqueue({
      type: 'settings_update',
      data: settings
    });
  }

  public updateScoringCalibration(calibration: ScoringCalibrationSettings, andRecalculate: boolean = true): { totalProcessed: number; totalUpdated: number } {
    this.state.testSettings = {
      ...this.state.testSettings,
      scoringCalibration: calibration
    };
    this.saveToStorage();
    syncManager.enqueue({
      type: 'settings_update',
      data: { scoringCalibration: calibration }
    });
    if (andRecalculate) {
      return this.recalculateAllStudentScores({ forcePurgeStaleDimensions: true });
    }
    return { totalProcessed: 0, totalUpdated: 0 };
  }

  public getTestTypes(): TestType[] {
    return this.state.testTypes;
  }

  public saveTestType(testType: TestType): boolean {
    const idx = this.state.testTypes.findIndex(t => t.id === testType.id || t.name === testType.name);
    if (idx !== -1) {
      this.state.testTypes[idx] = { ...this.state.testTypes[idx], ...testType };
    } else {
      this.state.testTypes.push(testType);
    }
    this.saveToStorage();
    return true;
  }

  public addTestType(type: Omit<TestType, 'id'>): boolean {
    const id = type.name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').trim();
    if (this.state.testTypes.some(t => t.id.toLowerCase() === id.toLowerCase() || t.name.toLowerCase() === type.name.toLowerCase())) {
      return false;
    }
    this.state.testTypes.push({ id, ...type });
    this.saveToStorage();
    return true;
  }

  public updateTestType(id: string, updated: Partial<TestType>): boolean {
    const idx = this.state.testTypes.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.state.testTypes[idx] = { ...this.state.testTypes[idx], ...updated };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public deleteTestType(id: string): boolean {
    const initialLen = this.state.testTypes.length;
    const target = this.state.testTypes.find(t => t.id === id);
    if (target && target.isSystem) {
      return false;
    }
    this.state.testTypes = this.state.testTypes.filter(t => t.id !== id);
    this.saveToStorage();
    return this.state.testTypes.length < initialLen;
  }

  // Student Actions
  public startTest(nim: string): Student | null {
    const student = this.state.students.find(s => s.id === nim);
    if (student && !student.testCompleted && !student.lockedOut) {
      student.testStarted = true;
      student.testStartedAt = new Date().toISOString();
      this.saveToStorage({ studentId: nim });
      return student;
    }
    return null;
  }

  public submitAnswer(nim: string, questionId: string, choiceId: string): Student | null {
    const student = this.state.students.find(s => s.id === nim);
    if (student && student.testStarted && !student.testCompleted && !student.lockedOut) {
      student.answers[questionId] = choiceId;
      student.currentQuestionIndex = Object.keys(student.answers).length;

      saveAnswerToCache(nim, questionId, choiceId).catch(() => {});
      this.saveToStorage({ studentId: nim, lastAnsweredQId: questionId });
      
      // Controlled Hybrid: Non-blocking background RESTful sync queue
      syncManager.enqueue({
        type: 'student_answer',
        studentId: nim,
        data: { questionId, choiceId }
      });

      return student;
    }
    return null;
  }

  public addCheatWarning(nim: string, reason: string): { student: Student | null; locked: boolean } {
    const student = this.state.students.find(s => s.id === nim);
    if (student && student.testStarted && !student.testCompleted) {
      student.cheatWarnings += 1;
      
      if (!student.cheatLogs) {
        student.cheatLogs = [];
      }
      
      const logEntry = {
        id: 'clog-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        reason: reason || "Sistem mendeteksi aktivitas mencurigakan saat ujian.",
        warningCount: student.cheatWarnings,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Browser Client'
      };
      
      student.cheatLogs.unshift(logEntry);

      let locked = false;
      if (student.cheatWarnings >= 3) {
        student.lockedOut = true;
        student.lockReason = reason || "Sistem mendeteksi pelanggaran batas maksimal (Anti-Curang aktif).";
        locked = true;
      }
      this.saveToStorage({ studentId: nim });
      return { student, locked };
    }
    return { student: null, locked: false };
  }

  public completeTest(nim: string): Student | null {
    const student = this.state.students.find(s => s.id === nim);
    if (student && student.testStarted && !student.testCompleted && !student.lockedOut) {
      student.testCompleted = true;
      student.testCompletedAt = new Date().toISOString();

      const settings = this.getTestSettings();
      student.completedTests = [];
      if (settings.iqActive) student.completedTests.push('IQ');
      if (settings.eqActive) student.completedTests.push('EQ');
      if (settings.hollandActive) student.completedTests.push('Holland');

      calculateStudentScores(student, this.state.questions, this.state.dimensions, this.state.testSettings);
      this.saveToStorage({ studentId: nim });
      return student;
    }
    return null;
  }

  public completeTestType(nim: string, testType: string, durationSeconds?: number): Student | null {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      if (!student.completedTests) {
        student.completedTests = [];
      }
      if (!student.completedTests.includes(testType)) {
        student.completedTests.push(testType);
      }

      if (typeof durationSeconds === 'number' && durationSeconds > 0) {
        student.examDurationSeconds = (student.examDurationSeconds || 0) + durationSeconds;
        student.timeSpentSeconds = student.examDurationSeconds;
      }
      
      calculateStudentScores(student, this.state.questions, this.state.dimensions, this.state.testSettings);
      this.saveToStorage({ studentId: nim });
      return student;
    }
    return null;
  }

  public completeWholeExam(nim: string, durationSeconds?: number): Student | null {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      student.testCompleted = true;
      student.testCompletedAt = new Date().toISOString();

      if (typeof durationSeconds === 'number' && durationSeconds > 0) {
        student.examDurationSeconds = (student.examDurationSeconds || 0) + durationSeconds;
        student.timeSpentSeconds = student.examDurationSeconds;
      } else if (!student.examDurationSeconds && student.testStartedAt) {
        const start = new Date(student.testStartedAt).getTime();
        const end = new Date(student.testCompletedAt).getTime();
        student.examDurationSeconds = Math.max(1, Math.round((end - start) / 1000));
        student.timeSpentSeconds = student.examDurationSeconds;
      }
      
      calculateStudentScores(student, this.state.questions, this.state.dimensions, this.state.testSettings);
      this.saveToStorage({ studentId: nim });
      clearExamCache(nim).catch(() => {});
      return student;
    }
    return null;
  }

  /**
   * Complete exam subtest or whole exam with step-by-step progress feedback and Supabase DB upload.
   */
  public async submitExamWithProgress(
    nim: string,
    options: {
      subtestType?: string | null;
      isWholeExam?: boolean;
      durationSeconds?: number;
      onProgress?: (progress: { stage: 'validating' | 'caching' | 'uploading' | 'verifying' | 'completed' | 'error'; percent: number; message: string; details?: string }) => void;
    }
  ): Promise<{ student: Student | null; success: boolean }> {
    const notify = options.onProgress || (() => {});

    // Stage 1: Validating and calculating scores (0-30%)
    notify({
      stage: 'validating',
      percent: 20,
      message: 'Memvalidasi konsistensi & kalkulasi skor psikometri...'
    });
    await new Promise(r => setTimeout(r, 200));

    let updatedStudent: Student | null = null;
    if (options.isWholeExam) {
      updatedStudent = this.completeWholeExam(nim, options.durationSeconds);
    } else if (options.subtestType) {
      updatedStudent = this.completeTestType(nim, options.subtestType, options.durationSeconds);
    }

    if (!updatedStudent) {
      updatedStudent = this.state.students.find(s => s.id === nim) || null;
    }

    notify({
      stage: 'validating',
      percent: 30,
      message: 'Kalkulasi indikator psikometri selesai.'
    });
    await new Promise(r => setTimeout(r, 150));

    // Stage 2: Save to IndexedDB & Local Cache (35-65%)
    notify({
      stage: 'caching',
      percent: 55,
      message: 'Mencadangkan snapshot jawaban ke penyimpanan aman lokal (IndexedDB)...'
    });
    if (updatedStudent) {
      this.saveToStorage({ studentId: updatedStudent.id });
    }
    await new Promise(r => setTimeout(r, 250));

    // Stage 3: Sync to Supabase Database (65-90%)
    notify({
      stage: 'uploading',
      percent: 85,
      message: 'Transmisi payload jawaban ke Database Supabase Utama...'
    });

    if (updatedStudent) {
      try {
        // Direct browser client to Supabase sync
        await saveToSupabaseTarget(this.state, { studentId: updatedStudent.id, full: false });

        // Backup server REST API request to ensure server writes to Supabase
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        }).catch((err) => {
          console.warn("Server API student backup sync notice:", err);
        });
      } catch (err) {
        console.warn("Supabase transmission notice:", err);
      }
    }
    await new Promise(r => setTimeout(r, 250));

    // Stage 4: Verifying & Completing (90-100%)
    notify({
      stage: 'verifying',
      percent: 95,
      message: 'Memverifikasi tanda terima dari server (200 OK)...'
    });
    await new Promise(r => setTimeout(r, 200));

    notify({
      stage: 'completed',
      percent: 100,
      message: 'Jawaban berhasil terkirim & tersimpan di DB Supabase!'
    });
    await new Promise(r => setTimeout(r, 200));

    return { student: updatedStudent, success: true };
  }

  public unlockStudent(nim: string): boolean {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      student.lockedOut = false;
      student.lockReason = null;
      student.cheatWarnings = 0;
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public resetStudentTest(nim: string): boolean {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      student.testStarted = false;
      student.testCompleted = false;
      student.testStartedAt = null;
      student.testCompletedAt = null;
      student.currentQuestionIndex = 0;
      student.answers = {};
      student.cheatWarnings = 0;
      student.lockedOut = false;
      student.lockReason = null;
      student.iqScore = null;
      student.eqScore = null;
      student.riasecScores = null;
      student.dimensionScores = null;
      student.aiAnalysis = null;
      student.completedTests = [];
      clearExamCache(nim).catch(() => {});
      this.saveToStorage({ studentId: nim });
      return true;
    }
    return false;
  }

  public recalculateAllStudentScores(options?: {
    classFilter?: string;
    cohortFilter?: string | number;
    onlyCompleted?: boolean;
    forcePurgeStaleDimensions?: boolean;
  }): { totalProcessed: number; totalUpdated: number } {
    let count = 0;
    const targetClass = options?.classFilter && options.classFilter !== 'All' ? options.classFilter : null;
    const targetCohort = options?.cohortFilter && options.cohortFilter !== 'All' ? String(options.cohortFilter) : null;
    const onlyCompleted = options?.onlyCompleted ?? false;
    const forcePurge = options?.forcePurgeStaleDimensions ?? true;

    const filteredStudents = this.state.students.filter(student => {
      if (targetClass && student.classGroup !== targetClass) return false;
      if (targetCohort && String(student.angkatan) !== targetCohort) return false;
      if (onlyCompleted && !student.testCompleted) return false;
      return true;
    });

    filteredStudents.forEach(student => {
      const hasAnswers = (student.answers && Object.keys(student.answers).length > 0) ||
                        (student.dimensionScores && Object.keys(student.dimensionScores).length > 0) ||
                        (student.completedTests && student.completedTests.length > 0) ||
                        Boolean(student.testCompleted) ||
                        (student.iqScore !== null && student.iqScore !== undefined);
      if (hasAnswers) {
        // If forcePurge and student has raw answers, clear out stale dimensionScores so they are completely fresh
        if (forcePurge && student.answers && Object.keys(student.answers).length > 0) {
          student.dimensionScores = {};
        } else if (student.dimensionScores) {
          // Normalize existing keys into canonical dimensions
          const cleanScores: Record<string, number> = {};
          Object.entries(student.dimensionScores).forEach(([k, v]) => {
            const canonK = normalizeCanonicalDimension(k);
            cleanScores[canonK] = Math.max(cleanScores[canonK] || 0, Number(v) || 0);
          });
          student.dimensionScores = cleanScores;
        }

        calculateStudentScores(student, this.state.questions, this.state.dimensions, this.state.testSettings);
        count++;
      }
    });

    if (count > 0) {
      this.saveToStorage();
      this.notifyListeners();
      if (isSupabaseConfigured && supabase) {
        saveToSupabaseTarget(this.state, { full: true }).catch(() => {});
      }
    }
    return { totalProcessed: filteredStudents.length, totalUpdated: count };
  }

  public saveAiAnalysis(nim: string, analysis: any) {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      student.aiAnalysis = analysis;
      this.saveToStorage({ studentId: nim });

      // Immediate background server backup sync to ensure ai_analysis is firmly written to Supabase
      if (typeof window !== 'undefined') {
        fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        }).catch((err) => {
          console.warn("Server API saveAiAnalysis sync notice:", err);
        });
      }
    }
  }

  public static formatIndonesianWhatsAppNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '628' + cleaned.slice(1);
    } else if (cleaned.startsWith('62')) {
      // already 62
    }
    return cleaned;
  }

  public registerPersonalStudent(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    gender?: 'L' | 'P';
    schoolOrigin?: string;
    packageId?: string;
    packageName?: string;
    paymentAmount?: number;
    paymentProofUrl?: string;
    selectedTestModules?: string[];
  }): Student {
    const rawIdNumber = Math.floor(100000 + Math.random() * 900000);
    const personalId = `USR-${rawIdNumber}`;
    const cleanPassword = (data.password && data.password.trim()) || `pass${rawIdNumber.toString().slice(-4)}`;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const invoiceNumber = `INV/${year}/${month}/${rawIdNumber}`;
    const assessmentFee = data.paymentAmount || 75000;
    const indonesianPhone = data.phone ? PsychometricStore.formatIndonesianWhatsAppNumber(data.phone) : '';
    const nowIso = now.toISOString();
    const expiryIso = new Date(now.getTime() + REGISTRATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    const activeTestModules = data.selectedTestModules || ['IQ', 'Holland', 'EQ', 'Kepribadian', 'Validitas'];

    const newStudent: Student = {
      id: personalId,
      name: data.name.trim(),
      classGroup: 'Personal / Mandiri',
      class_name: 'Personal / Mandiri',
      angkatan: year,
      cohort: year,
      major: 'Umum & Karir',
      gender: data.gender || 'L',
      schoolOrigin: data.schoolOrigin || 'Personal / Mandiri',
      school_origin: data.schoolOrigin || 'Personal / Mandiri',
      email: data.email.trim(),
      phone: indonesianPhone || data.phone || '',
      password: cleanPassword,
      context: 'personal',
      status: 'BELUM_TES',
      testType: data.packageName || 'Minat Bakat & Karir Personal',
      packageId: data.packageId,
      packageName: data.packageName,
      paymentProofUrl: data.paymentProofUrl,
      iqScore: null,
      eqScore: null,
      riasecScores: null,
      dimensionScores: null,
      lockedOut: true, // Terkunci hingga admin memverifikasi pembayaran
      lockReason: 'Menunggu Verifikasi Pembayaran & Aktivasi Akun oleh Admin (Draft/Pending).',
      paymentStatus: 'UNPAID',
      registrationStatus: 'PENDING',
      invoiceNumber: invoiceNumber,
      amount: assessmentFee,
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
      testStarted: false,
      testCompleted: false,
      testStartedAt: null,
      testCompletedAt: null,
      currentQuestionIndex: 0,
      answers: {},
      cheatWarnings: 0,
      aiAnalysis: null,
      completedTests: [],
      allowedTests: activeTestModules
    };

    // Add to state
    this.state.students.unshift(newStudent);

    // Record registration audit log
    if (!this.state.registrations) {
      this.state.registrations = [];
    }
    this.state.registrations.unshift({
      id: `REG-P-${rawIdNumber}`,
      schoolName: data.name.trim(),
      schoolType: 'Personal',
      categoryType: 'personal',
      adminEmail: data.email.trim(),
      adminPhone: indonesianPhone || data.phone || '-',
      address: data.schoolOrigin || 'Personal / Mandiri',
      estimatedStudents: 1,
      adminPassword: cleanPassword,
      status: 'Pending',
      submittedAt: nowIso,
      requestedAt: nowIso,
      expiresAt: expiryIso,
      invoiceNumber: invoiceNumber,
      amount: assessmentFee,
      totalAmount: assessmentFee,
      paymentStatus: 'UNPAID',
      registrationType: 'personal',
      personalStudentId: personalId,
      selectedTestModules: activeTestModules,
      testModulesNames: activeTestModules.join(', ')
    });

    this.saveToStorage({ studentId: personalId });
    this.notifyListeners();
    return newStudent;
  }

  public approveStudentRegistration(studentId: string, verifierName: string = 'Admin'): boolean {
    let student = this.state.students.find(s => s.id === studentId);
    
    // Fallback: search by email/invoice if not found by ID
    const reg = this.state.registrations?.find(r => 
      r.id === studentId || 
      r.personalStudentId === studentId || 
      r.adminEmail === studentId ||
      r.invoiceNumber === studentId
    );

    if (!student && reg) {
      student = this.state.students.find(s => s.email && s.email.toLowerCase() === reg.adminEmail.toLowerCase());
    }

    if (!student && reg) {
      // Auto-provision/create student if missing
      const rawNum = Math.floor(100000 + Math.random() * 900000);
      const generatedId = reg.personalStudentId || `USR-P-${rawNum}`;
      student = {
        id: generatedId,
        name: reg.schoolName || 'Peserta Personal',
        email: reg.adminEmail,
        phone: reg.adminPhone || '',
        password: reg.adminPassword || 'pass1234',
        classGroup: 'Personal / Mandiri',
        class_name: 'Personal / Mandiri',
        angkatan: new Date().getFullYear(),
        cohort: new Date().getFullYear(),
        major: 'Umum & Karir',
        gender: 'L',
        schoolOrigin: 'Personal / Mandiri',
        school_origin: 'Personal / Mandiri',
        context: 'personal',
        status: 'BELUM_TES',
        testType: reg.packageName || 'Minat Bakat & Karir Personal',
        invoiceNumber: reg.invoiceNumber,
        amount: reg.amount || reg.totalAmount || 75000,
        lockedOut: false,
        paymentStatus: 'PAID',
        registrationStatus: 'APPROVED',
        paymentVerifiedAt: new Date().toISOString(),
        paymentVerifiedBy: verifierName,
        testStarted: false,
        testCompleted: false,
        currentQuestionIndex: 0,
        answers: {},
        cheatWarnings: 0,
        completedTests: [],
        allowedTests: reg.selectedTestModules && reg.selectedTestModules.length > 0 ? reg.selectedTestModules : ['IQ', 'Holland', 'EQ', 'Kepribadian', 'Validitas']
      };
      this.state.students.unshift(student);
    }

    if (student) {
      student.registrationStatus = 'APPROVED';
      student.paymentStatus = 'PAID';
      student.lockedOut = false;
      student.lockReason = null;
      student.paymentVerifiedAt = new Date().toISOString();
      student.paymentVerifiedBy = verifierName;

      // Update matching audit log & guarantee personalStudentId link
      const targetReg = reg || this.state.registrations?.find(r => r.adminEmail === student.email || r.invoiceNumber === student.invoiceNumber || r.personalStudentId === student.id);
      if (targetReg) {
        targetReg.status = 'Approved';
        targetReg.paymentStatus = 'Paid';
        targetReg.personalStudentId = student.id;
        if (targetReg.selectedTestModules && targetReg.selectedTestModules.length > 0) {
          student.allowedTests = targetReg.selectedTestModules;
        }
      }

      this.saveToStorage({ studentId: student.id });
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public rejectStudentRegistration(studentId: string, reason: string = 'Bukti pembayaran tidak valid'): boolean {
    const student = this.state.students.find(s => s.id === studentId);
    if (student) {
      student.registrationStatus = 'REJECTED';
      student.paymentStatus = 'REJECTED';
      student.lockedOut = true;
      student.rejectionReason = reason;
      student.lockReason = `Pendaftaran ditolak: ${reason}`;

      const reg = this.state.registrations?.find(r => r.adminEmail === student.email || r.invoiceNumber === student.invoiceNumber);
      if (reg) {
        reg.status = 'Rejected';
        reg.paymentStatus = 'Unpaid';
      }

      this.saveToStorage({ studentId });
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public draftStudentRegistration(studentId: string): boolean {
    const student = this.state.students.find(s => s.id === studentId);
    if (student) {
      student.registrationStatus = 'PENDING';
      student.paymentStatus = 'UNPAID';
      student.lockedOut = true;
      student.lockReason = 'Menunggu Verifikasi Pembayaran & Aktivasi Akun oleh Admin (Draft/Pending).';

      const reg = this.state.registrations?.find(r => r.adminEmail === student.email || r.invoiceNumber === student.invoiceNumber);
      if (reg) {
        reg.status = 'Pending';
        reg.paymentStatus = 'Unpaid';
      }

      this.saveToStorage({ studentId });
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public verifyPersonalPayment(studentId: string, adminName: string = 'Superadmin'): boolean {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return false;

    const now = new Date().toISOString();
    student.paymentStatus = 'PAID';
    student.lockedOut = false;
    student.lockReason = null;
    student.paymentVerifiedAt = now;
    student.paymentVerifiedBy = adminName;

    // Update associated registration record
    if (this.state.registrations) {
      const reg = this.state.registrations.find(r => r.personalStudentId === studentId);
      if (reg) {
        reg.status = 'Approved';
        reg.paymentStatus = 'PAID';
        reg.paymentVerifiedAt = now;
        reg.paymentVerifiedBy = adminName;
      }
    }

    this.saveToStorage({ studentId });

    if (typeof window !== 'undefined') {
      fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      }).catch((err) => {
        console.warn("Server API verifyPersonalPayment sync notice:", err);
      });
    }

    this.notifyListeners();
    return true;
  }

  public addStudent(newStudent: Omit<Student, 'iqScore' | 'eqScore' | 'riasecScores' | 'dimensionScores' | 'lockedOut' | 'lockReason' | 'testStarted' | 'testCompleted' | 'testStartedAt' | 'testCompletedAt' | 'currentQuestionIndex' | 'answers' | 'cheatWarnings' | 'aiAnalysis' | 'validationStatus' | 'validationRecommendation'>, skipSave = false): boolean {
    if (this.state.students.some(s => s.id === newStudent.id)) {
      return false;
    }

    const student: Student = {
      ...newStudent,
      iqScore: null,
      eqScore: null,
      riasecScores: null,
      dimensionScores: null,
      lockedOut: false,
      lockReason: null,
      testStarted: false,
      testCompleted: false,
      testStartedAt: null,
      testCompletedAt: null,
      currentQuestionIndex: 0,
      answers: {},
      cheatWarnings: 0,
      aiAnalysis: null
    };

    this.state.students.push(student);
    if (!skipSave) {
      this.saveToStorage({ studentId: student.id });
    }
    return true;
  }

  public updateStudent(nim: string, updatedData: Partial<Student>): boolean {
    const student = this.state.students.find(s => s.id === nim);
    if (student) {
      if (updatedData.name !== undefined) student.name = updatedData.name;
      if (updatedData.classGroup !== undefined) student.classGroup = updatedData.classGroup;
      if (updatedData.major !== undefined) student.major = updatedData.major;
      if (updatedData.gender !== undefined) student.gender = updatedData.gender;
      if (updatedData.angkatan !== undefined) student.angkatan = updatedData.angkatan;
      if (updatedData.password !== undefined) student.password = updatedData.password;
      if (updatedData.lockedOut !== undefined) student.lockedOut = updatedData.lockedOut;
      if (updatedData.lockReason !== undefined) student.lockReason = updatedData.lockReason;
      if (updatedData.testStarted !== undefined) student.testStarted = updatedData.testStarted;
      if (updatedData.testCompleted !== undefined) student.testCompleted = updatedData.testCompleted;
      if (updatedData.currentQuestionIndex !== undefined) student.currentQuestionIndex = updatedData.currentQuestionIndex;
      if (updatedData.answers !== undefined) student.answers = updatedData.answers;
      if (updatedData.completedTests !== undefined) student.completedTests = updatedData.completedTests;
      if (updatedData.examStartedAt !== undefined) student.examStartedAt = updatedData.examStartedAt;
      this.saveToStorage({ studentId: nim });
      return true;
    }
    return false;
  }

  public saveStudent(student: Student, skipSave = false): boolean {
    const idx = this.state.students.findIndex(s => s.id === student.id);
    const newStudents = [...this.state.students];
    if (idx !== -1) {
      newStudents[idx] = { ...newStudents[idx], ...student };
    } else {
      newStudents.push(student);
    }
    this.state.students = newStudents;
    if (!skipSave) {
      this.saveToStorage({ studentId: student.id });
    }
    this.notifyListeners();
    return true;
  }

  public getClasses(): { id: string; name: string }[] {
    return this.getRegisteredClasses().map(c => ({ id: c, name: c }));
  }

  // Dummy Student Data Operations
  public generateDummyCompletedStudents(count: number = 5, classGroup?: string): number {
    const generated = generateDummyHelper({
      count,
      classGroup,
      store: this
    });

    if (generated && generated.length > 0) {
      this.state.students.push(...generated);
      this.saveToStorage();
      this.notifyListeners();
      return generated.length;
    }
    return 0;
  }

  public clearDummyStudents(): number {
    const initialCount = this.state.students.length;
    this.state.students = this.state.students.filter(
      s => !s.isDummy && !s.id.startsWith('DUMMY-') && !s.name.includes('(Dummy)')
    );
    const removedCount = initialCount - this.state.students.length;
    if (removedCount > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }
    return removedCount;
  }

  public getDummyStudentsCount(): number {
    return this.state.students.filter(
      s => s.isDummy || s.id.startsWith('DUMMY-') || s.name.includes('(Dummy)')
    ).length;
  }

  public getMajors(): SchoolMajor[] {
    return this.getSchoolMajors();
  }

  public saveMajor(major: SchoolMajor): boolean {
    const idx = this.state.schoolMajors.findIndex(m => m.id === major.id || m.code === major.code);
    const newMajors = [...this.state.schoolMajors];
    if (idx !== -1) {
      newMajors[idx] = major;
    } else {
      newMajors.push(major);
    }
    this.state.schoolMajors = newMajors;
    this.saveToStorage({ majors: true });
    return true;
  }

  public deleteMajor(id: string): boolean {
    return this.deleteSchoolMajor(id);
  }

  public saveDimension(dim: Dimension): boolean {
    const idx = this.state.dimensions.findIndex(d => d.id === dim.id || d.code === dim.code);
    const newDims = [...this.state.dimensions];
    if (idx !== -1) {
      newDims[idx] = dim;
    } else {
      newDims.push(dim);
    }
    this.state.dimensions = newDims;
    this.saveToStorage({ dimensions: true });
    return true;
  }

  public saveTeacher(t: Teacher): boolean {
    const idx = this.state.teachers.findIndex(x => x.id === t.id);
    const newTeachers = [...this.state.teachers];
    if (idx !== -1) {
      newTeachers[idx] = t;
    } else {
      newTeachers.push(t);
    }
    this.state.teachers = newTeachers;
    this.saveToStorage({ teachers: true });
    return true;
  }

  public saveQuestion(q: Question, skipSave = false): boolean {
    const sanitizedQ = sanitizeQuestion(q);
    const idx = this.state.questions.findIndex(x => String(x.id) === String(sanitizedQ.id));
    const newQuestions = [...this.state.questions];
    if (idx !== -1) {
      newQuestions[idx] = { ...newQuestions[idx], ...sanitizedQ };
    } else {
      newQuestions.push(sanitizedQ);
    }
    this.state.questions = newQuestions;
    this.rebuildQuestionsIndex();
    if (!skipSave) {
      this.saveToStorage({ questions: true });
    }
    return true;
  }

  public addQuestion(newQuestion: Question, skipSave = false): void {
    this.saveQuestion(newQuestion, skipSave);
  }

  public deleteStudent(nim: string): boolean {
    const initialLen = this.state.students.length;
    this.state.students = this.state.students.filter(s => s.id !== nim);
    clearExamCache(nim).catch(() => {});
    if (isSupabaseConfigured && supabase) {
      supabase.from('students').delete().eq('id', nim).then();
    }
    this.saveToStorage({ deleteStudentId: nim });
    return this.state.students.length < initialLen;
  }

  public async clearAllStudents(): Promise<void> {
    this.state.students = [];
    this.saveLocalStorageOnly();
    await clearAllCache();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('students').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear all students on Supabase:", err);
      }
    }
  }

  public deleteQuestion(id: number | string): boolean {
    const initialLen = this.state.questions.length;
    const strId = String(id);
    this.state.questions = this.state.questions.filter(q => String(q.id) !== strId);
    this.rebuildQuestionsIndex();

    // Persist deleted question ID to prevent resurrection
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('psychometric_deleted_question_ids');
        const set = new Set<string>(stored ? JSON.parse(stored) : []);
        set.add(strId);
        localStorage.setItem('psychometric_deleted_question_ids', JSON.stringify(Array.from(set)));
      } catch (e) {
        console.warn("Failed to update deleted question cache:", e);
      }
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('questions').delete().eq('id', id).then();
    }
    this.saveToStorage({ deleteQuestionId: strId, questions: true });
    this.notifyListeners();
    return this.state.questions.length < initialLen;
  }

  public async clearAllQuestions(): Promise<void> {
    const allIds = this.state.questions.map(q => String(q.id));
    if (typeof window !== 'undefined' && allIds.length > 0) {
      try {
        const stored = localStorage.getItem('psychometric_deleted_question_ids');
        const set = new Set<string>(stored ? JSON.parse(stored) : []);
        allIds.forEach(id => set.add(id));
        localStorage.setItem('psychometric_deleted_question_ids', JSON.stringify(Array.from(set)));
      } catch (e) {
        console.warn("Failed to update deleted question cache:", e);
      }
    }
    this.state.questions = [];
    this.rebuildQuestionsIndex();
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('questions').delete().gt('id', '');
      } catch (err) {
        console.error("Failed to clear questions on Supabase:", err);
      }
    }
  }

  public async clearAllVouchers(): Promise<void> {
    this.state.vouchers = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('vouchers').delete().neq('code', '');
      } catch (err) {
        console.error("Failed to clear vouchers on Supabase:", err);
      }
    }
  }

  public async clearAllReferrals(): Promise<void> {
    this.state.referrals = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('referrals').delete().neq('code', '');
      } catch (err) {
        console.error("Failed to clear referrals on Supabase:", err);
      }
    }
  }

  public async clearAllPurchases(): Promise<void> {
    this.state.purchases = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('purchases').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear purchases on Supabase:", err);
      }
    }
  }

  public async clearAllCommissions(): Promise<void> {
    this.state.commissions = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('commissions').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear commissions on Supabase:", err);
      }
    }
  }

  public async clearAllTeachers(): Promise<void> {
    // Keep only the primary super admin and admin so user is not locked out
    const INITIAL_TEACHERS = [
      { id: "super", name: "Super Admin", role: "Superadmin", password: "super" },
      { id: "admin", name: "Pak Eko (Administrator)", role: "Admin", password: "admin" }
    ];
    this.state.teachers = [...INITIAL_TEACHERS];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('teachers').delete().not('id', 'in', '("super","admin")');
      } catch (err) {
        console.error("Failed to clear teachers on Supabase:", err);
      }
    }
  }

  public async clearAllDimensions(): Promise<void> {
    this.state.dimensions = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('dimensions').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear dimensions on Supabase:", err);
      }
    }
  }

  /**
   * Standardizes dimensions across the entire store:
   * 1. Replaces state.dimensions with official 18 canonical dimensions.
   * 2. Relinks question dimensions to canonical names.
   * 3. Normalizes students' dimensionScores keys.
   * 4. Recalculates all student scores.
   */
  public standardizeDimensions(): { totalDimensions: number; relinkedQuestions: number } {
    this.state.dimensions = [...CANONICAL_DIMENSIONS];

    let relinkedQuestions = 0;
    if (this.state.questions && this.state.questions.length > 0) {
      this.state.questions.forEach(q => {
        if (q.dimension) {
          const canonical = normalizeCanonicalDimension(q.dimension, q.testType);
          if (q.dimension !== canonical) {
            q.dimension = canonical;
            relinkedQuestions++;
          }
        }
      });
      this.rebuildQuestionsIndex();
    }

    if (this.state.students && this.state.students.length > 0) {
      this.state.students.forEach(s => {
        if (s.dimensionScores) {
          const normalizedScores: Record<string, number> = {};
          Object.entries(s.dimensionScores).forEach(([k, v]) => {
            const canonK = normalizeCanonicalDimension(k);
            normalizedScores[canonK] = Math.max(normalizedScores[canonK] || 0, Number(v) || 0);
          });
          s.dimensionScores = normalizedScores;
        }
      });
    }

    this.recalculateAllScores();
    this.saveToStorage({ dimensions: true, questions: true, students: true });
    this.notifyListeners();

    if (isSupabaseConfigured && supabase) {
      supabase.from('dimensions').upsert(CANONICAL_DIMENSIONS.map(d => ({
        id: d.id,
        name: d.name,
        test_type: d.testType,
        description: d.description || null
      }))).then();
    }

    return {
      totalDimensions: this.state.dimensions.length,
      relinkedQuestions
    };
  }

  /**
   * 1-Click Auto-Repair & Scoring Standardization:
   * 1. Standardizes all dimensions to the 18 official CANONICAL_DIMENSIONS.
   * 2. Maps question dimensions automatically using normalizeCanonicalDimension.
   * 3. Validates and auto-repairs scoring on all choices (IQ binary 1/0, EQ Likert 1-4/1-5, Holland RIASEC tags).
   * 4. Recalculates all student scores accurately.
   */
  public autoHealAndStandardizeQuestions(): {
    totalQuestions: number;
    relinkedDimensions: number;
    healedChoices: number;
    canonicalDimensionsCount: number;
  } {
    this.state.dimensions = [...CANONICAL_DIMENSIONS];

    let relinkedDimensions = 0;
    let healedChoices = 0;

    const getHollandCode = (dim: string): 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | undefined => {
      if (!dim) return undefined;
      const upper = dim.toUpperCase();
      if (upper.includes('REALIST') || upper.startsWith('R ')) return 'R';
      if (upper.includes('INVESTIGAT') || upper.startsWith('I ')) return 'I';
      if (upper.includes('ARTIST') || upper.startsWith('A ')) return 'A';
      if (upper.includes('SOSIAL') || upper.includes('SOCIAL') || upper.startsWith('S ')) return 'S';
      if (upper.includes('ENTERPRIS') || upper.startsWith('E ')) return 'E';
      if (upper.includes('KONVENS') || upper.includes('CONVENT') || upper.startsWith('C ')) return 'C';
      return undefined;
    };

    if (this.state.questions && this.state.questions.length > 0) {
      this.state.questions = this.state.questions.map(q => {
        const canonicalDim = normalizeCanonicalDimension(q.dimension, q.testType);
        if (q.dimension !== canonicalDim) {
          q.dimension = canonicalDim;
          relinkedDimensions++;
        }

        const effType = resolveEffectiveTestType(q, this.state.dimensions).toUpperCase();

        // Ensure choices have valid scores and structures
        if (Array.isArray(q.choices) && q.choices.length > 0) {
          if (effType === 'IQ') {
            const hasPositive = q.choices.some(c => (c.scoreValue ?? 0) > 0);
            q.choices.forEach((c, idx) => {
              if (!hasPositive && idx === 0) {
                c.scoreValue = 1;
                healedChoices++;
              } else if (c.scoreValue === undefined || c.scoreValue === null || isNaN(Number(c.scoreValue))) {
                c.scoreValue = 0;
                healedChoices++;
              } else {
                c.scoreValue = Number(c.scoreValue);
              }
            });
          } else if (effType === 'HOLLAND' || effType === 'RIASEC') {
            const hollandCode = getHollandCode(q.dimension);
            q.choices.forEach((c) => {
              if (c.scoreValue === undefined || c.scoreValue === null || isNaN(Number(c.scoreValue))) {
                c.scoreValue = 1;
                healedChoices++;
              } else {
                c.scoreValue = Number(c.scoreValue);
              }
              if (!c.hollandType && hollandCode) {
                c.hollandType = hollandCode;
                healedChoices++;
              }
            });
          } else {
            // EQ or personality
            q.choices.forEach((c, idx) => {
              if (c.scoreValue === undefined || c.scoreValue === null || isNaN(Number(c.scoreValue))) {
                c.scoreValue = Math.max(1, q.choices.length - idx);
                healedChoices++;
              } else {
                c.scoreValue = Number(c.scoreValue);
              }
            });
          }
        }

        // Psychometric item calibration (calibrated p-value, discrimination index, education level, packageId)
        return classifyQuestionItem(q);
      });
      this.state.questions = sanitizeQuestionsList(this.state.questions);
      this.rebuildQuestionsIndex();
    }

    if (this.state.students && this.state.students.length > 0) {
      this.state.students.forEach(s => {
        if (s.dimensionScores) {
          const normalizedScores: Record<string, number> = {};
          Object.entries(s.dimensionScores).forEach(([k, v]) => {
            const canonK = normalizeCanonicalDimension(k);
            normalizedScores[canonK] = Math.max(normalizedScores[canonK] || 0, Number(v) || 0);
          });
          s.dimensionScores = normalizedScores;
        }
      });
    }

    this.recalculateAllScores();
    this.saveToStorage({ dimensions: true, questions: true, students: true });
    this.notifyListeners();

    if (isSupabaseConfigured && supabase) {
      supabase.from('dimensions').upsert(CANONICAL_DIMENSIONS.map(d => ({
        id: d.id,
        name: d.name,
        test_type: d.testType,
        description: d.description || null
      }))).then();
    }

    return {
      totalQuestions: this.state.questions.length,
      relinkedDimensions,
      healedChoices,
      canonicalDimensionsCount: this.state.dimensions.length
    };
  }

  public async clearAllSchoolMajors(): Promise<void> {
    this.state.schoolMajors = [];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('school_majors').delete().neq('id', '');
      } catch (err) {
        console.error("Failed to clear school_majors on Supabase:", err);
      }
    }
  }

  public async resetAllData(): Promise<void> {
    // Reset all arrays/objects to defaults/presets
    this.state.students = [];
    this.state.questions = [...PRESET_QUESTIONS];
    this.state.dimensions = [...PRESET_DIMENSIONS];
    this.state.schoolMajors = [...PRESET_MAJORS];
    this.state.testTypes = [...PRESET_TEST_TYPES];
    this.state.packages = [...PRESET_PACKAGES];
    this.state.registeredClasses = [];
    this.state.registeredCohorts = [];
    this.state.vouchers = [];
    this.state.referrals = [];
    this.state.commissions = [];
    this.state.purchases = [];
    this.state.teachers = [...INITIAL_TEACHERS];
    
    this.saveLocalStorageOnly();
    await clearAllCache();
    this.notifyListeners();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('students').delete().neq('id', '');
        await supabase.from('questions').delete().gt('id', '');
        await supabase.from('dimensions').delete().neq('id', '');
        await supabase.from('school_majors').delete().neq('id', '');
        await supabase.from('test_types').delete().neq('id', '');
        await supabase.from('packages').delete().neq('id', '');
        await supabase.from('registered_classes').delete().neq('id', '');
        await supabase.from('registered_cohorts').delete().neq('id', '');
        await supabase.from('vouchers').delete().neq('code', '');
        await supabase.from('referrals').delete().neq('code', '');
        await supabase.from('commissions').delete().neq('id', '');
        await supabase.from('purchases').delete().neq('id', '');
        await supabase.from('teachers').delete().not('id', 'in', '("super","admin")');
      } catch (err) {
        console.error("Failed to reset all data on Supabase:", err);
      }
    }
  }

  public async resetQuestionsToPresets(): Promise<void> {
    this.state.questions = [...PRESET_QUESTIONS];
    this.saveLocalStorageOnly();
    this.notifyListeners();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('questions').delete().gt('id', '');
        const rows = PRESET_QUESTIONS.map(q => ({
          id: q.id,
          test_type: q.testType,
          dimension: q.dimension,
          text: q.text,
          choices: q.choices,
          image_url: q.imageUrl || null
        }));
        await resilientUpsert(supabase, 'questions', rows);
      } catch (err) {
        console.error("Failed to reset questions on Supabase:", err);
      }
    }
  }

  public async importFromDataGrid(type: 'students' | 'questions' | 'dimensions', rows: any[]): Promise<{ successCount: number; errors: string[] }> {
    const result = processDataGridImport(type, rows, {
      addStudent: (s) => this.addStudent(s, true),
      addQuestion: (q) => this.addQuestion(q, true),
      questions: this.state.questions,
      dimensions: this.state.dimensions
    });
    await this.saveToStorage();
    return result;
  }

  public async importQuestionsWithAutoDimensions(
    questions: Question[],
    newDimensions: Array<{ name: string; testType: 'IQ' | 'EQ' | 'Holland'; description?: string }>,
    options?: { overwriteExisting?: boolean; importMode?: 'append' | 'replace' }
  ): Promise<{ successCount: number; newDimensionsCreated: number }> {
    let newDimensionsCreated = 0;
    
    // 1. Create new dimensions if any
    newDimensions.forEach(dim => {
      const exists = this.state.dimensions.some(
        d => d.name.trim().toLowerCase() === dim.name.trim().toLowerCase() && d.testType === dim.testType
      );
      if (!exists) {
        const id = `dim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.state.dimensions.push({
          id,
          name: dim.name,
          testType: dim.testType,
          description: dim.description || 'Dimensi psikometri dibuat otomatis via impor soal.'
        });
        newDimensionsCreated++;
      }
    });

    // 2. Add or update questions with smart collision protection
    let successCount = 0;
    const mode = options?.importMode || (options?.overwriteExisting ? 'replace' : 'append');
    const existingIds = new Set(this.state.questions.map(ex => String(ex.id).toLowerCase()));

    questions.forEach((q) => {
      let candidateId = String(q.id || '').trim();
      if (!candidateId) {
        candidateId = `Q-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
      }

      const isAlreadyExists = existingIds.has(candidateId.toLowerCase());

      if (mode === 'append' && isAlreadyExists) {
        // Generate a new non-colliding sequential ID
        const prefix = q.testType === 'IQ' ? 'Q-IQ' : q.testType === 'EQ' ? 'Q-EQ' : q.testType === 'Holland' ? 'Q-HOL' : 'Q';
        let maxNum = this.state.questions.length;
        const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
        this.state.questions.forEach(ex => {
          const match = String(ex.id).match(regex);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });

        let seq = maxNum + 1;
        let safeId = `${prefix}-${String(seq).padStart(3, '0')}`;
        while (existingIds.has(safeId.toLowerCase())) {
          seq++;
          safeId = `${prefix}-${String(seq).padStart(3, '0')}`;
        }
        candidateId = safeId;
      }

      if (mode === 'replace' && isAlreadyExists) {
        const idx = this.state.questions.findIndex(existing => String(existing.id).toLowerCase() === candidateId.toLowerCase());
        if (idx !== -1) {
          this.state.questions[idx] = { ...this.state.questions[idx], ...q, id: candidateId };
        }
      } else {
        const updatedChoices = (q.choices || []).map(ch => ({
          ...ch,
          id: ch.id && ch.id.includes('-') ? `${candidateId}-${ch.id.split('-').pop()}` : `${candidateId}-${ch.id || 'opt'}`
        }));
        const newQ: Question = { ...q, id: candidateId, choices: updatedChoices };
        this.state.questions.push(newQ);
        existingIds.add(candidateId.toLowerCase());
      }
      successCount++;
    });

    await this.saveToStorage({ questions: true, dimensions: newDimensionsCreated > 0, full: false });
    this.notifyListeners();
    return { successCount, newDimensionsCreated };
  }

  public getLandingPageContent(): LandingPageContent {
    if (typeof window === 'undefined') {
      return this.getDefaultLandingPageContent();
    }
    const data = localStorage.getItem('landing_page_content');
    if (data) {
      try {
        return { ...this.getDefaultLandingPageContent(), ...JSON.parse(data) };
      } catch (e) {
        return this.getDefaultLandingPageContent();
      }
    }
    return this.getDefaultLandingPageContent();
  }

  public updateLandingPageContent(content: Partial<LandingPageContent>) {
    const current = this.getLandingPageContent();
    const updated = { ...current, ...content };
    localStorage.setItem('landing_page_content', JSON.stringify(updated));
    this.notifyListeners();
  }

  private getDefaultLandingPageContent(): LandingPageContent {
    return {
      heroHeadline: 'Platform Asesmen Psikometri & Minat Bakat Karir Digital',
      heroSubheading: 'Sistem Computer-Based Test cerdas terintegrasi untuk pemetaan kecenderungan minat karir (RIASEC), potensi kecerdasan (IQ), dinamika regulasi emosional (EQ), serta rekomendasi karir cerdas berbasis AI.',
      feature1Title: 'Potensi Kognitif',
      feature1Desc: 'Tes penalaran spasial, verbal, kuantitatif, dan logika murni.',
      feature2Title: 'Regulasi Emosi',
      feature2Desc: 'Pemetaan kecerdasan emosional, motivasi diri, dan empati.',
      feature3Title: 'Minat Karir RIASEC',
      feature3Desc: 'Teori kepribadian karir Holland untuk merekomendasikan program keahlian.',
      feature4Title: 'Gaya Belajar VAK',
      feature4Desc: 'Identifikasi modalities visual, auditori, dan kinestetik.',
      contactEmail: 'support@psychometrics.id',
      contactPhone: '+62 812-3456-7890',
      contactAddress: 'Jl. Jenderal Sudirman No. 42, Jakarta Selatan, DKI Jakarta 12190',
      statSchools: 124,
      statStudents: 15420,
      statTests: 38450
    };
  }
}
