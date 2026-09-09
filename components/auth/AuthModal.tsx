'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  School, 
  User, 
  KeyRound, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  CheckSquare,
  Square,
  Calculator,
  Clock,
  Receipt,
  FileCheck2,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { PsychometricStore } from '@/lib/store/PsychometricStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapDatabaseRowToStudent } from '@/lib/store/dbMappers';
import { 
  REGISTRATION_TYPE_OPTIONS, 
  AVAILABLE_TEST_MODULES, 
  getDynamicTestModules,
  RegistrationCategoryType, 
  calculateRegistrationPrice,
  REGISTRATION_EXPIRY_HOURS
} from '@/lib/metadata/registrationMetadata';

interface AuthModalProps {
  store: PsychometricStore;
  isRegister?: boolean;
  initialRole?: 'Student' | 'Teacher';
  initialTab?: RegistrationCategoryType;
  onClose: () => void;
  onSuccessLogin: (user: any, role: 'admin' | 'counselor' | 'student') => void;
}

export function AuthModal({
  store,
  isRegister = false,
  initialRole = 'Student',
  initialTab = 'personal',
  onClose,
  onSuccessLogin
}: AuthModalProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  
  // Login State
  const [loginRole, setLoginRole] = useState<'student' | 'teacher'>('student');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration 3-Step Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<RegistrationCategoryType>(initialTab || 'personal');
  const [selectedSubSchoolType, setSelectedSubSchoolType] = useState<string>('SMK');
  const [selectedTestModules, setSelectedTestModules] = useState<string[]>(['IQ', 'Holland', 'EQ']);
  const [estimatedStudentCount, setEstimatedStudentCount] = useState<number>(
    initialTab === 'personal' ? 1 : 50
  );

  // Form Details (Step 3)
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'L' as 'L' | 'P',
    schoolOrigin: '',
    address: ''
  });

  const [formError, setFormError] = useState('');
  const [regSuccessData, setRegSuccessData] = useState<any | null>(null);

  // Selected Category Info
  const activeCategoryOption = useMemo(() => {
    return REGISTRATION_TYPE_OPTIONS.find(o => o.id === selectedCategory) || REGISTRATION_TYPE_OPTIONS[0];
  }, [selectedCategory]);

  // Dynamic Test Types & Pricing from Store
  const testTypesList = useMemo(() => {
    return store?.getTestTypes ? store.getTestTypes() : [];
  }, [store]);

  const availableTestModules = useMemo(() => {
    return getDynamicTestModules(testTypesList);
  }, [testTypesList]);

  // Pricing Calculation
  const priceCalculation = useMemo(() => {
    const studentQuota = selectedCategory === 'personal' ? 1 : Math.max(1, Number(estimatedStudentCount) || 1);
    return calculateRegistrationPrice(selectedTestModules, studentQuota, testTypesList);
  }, [selectedTestModules, estimatedStudentCount, selectedCategory, testTypesList]);

  // Handle Category Select Step 1 -> Step 2
  const handleSelectCategory = (type: RegistrationCategoryType) => {
    setSelectedCategory(type);
    if (type === 'personal') {
      setEstimatedStudentCount(1);
      setSelectedSubSchoolType('Personal');
    } else if (type === 'sekolah') {
      setEstimatedStudentCount(50);
      setSelectedSubSchoolType('SMK');
    } else if (type === 'kampus') {
      setEstimatedStudentCount(100);
      setSelectedSubSchoolType('Kampus');
    } else if (type === 'instansi' || type === 'perusahaan') {
      setEstimatedStudentCount(30);
      setSelectedSubSchoolType('Perusahaan');
    }
  };

  // Toggle Test Module Selection
  const handleToggleTestModule = (moduleId: string) => {
    setFormError('');
    setSelectedTestModules(prev => {
      if (prev.includes(moduleId)) {
        if (prev.length <= 1) {
          setFormError('Pilih minimal 1 jenis tes untuk pendaftaran.');
          return prev;
        }
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Silakan masukkan ID User, Username, Email, atau No. WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanInput = loginIdentifier.trim();
      const cleanPass = loginPassword.trim();
      const inputDigits = cleanInput.replace(/\D/g, '');

      // Trigger sync with Supabase first if available
      await store.syncWithSupabase().catch(() => {});

      if (loginRole === 'student') {
        const students = store.getStudents();
        let found = students.find(s => {
          const idMatch = Boolean(s.id && s.id.toLowerCase() === cleanInput.toLowerCase());
          const emailMatch = Boolean(s.email && s.email.toLowerCase() === cleanInput.toLowerCase());
          const nameMatch = Boolean(s.name && s.name.toLowerCase() === cleanInput.toLowerCase());
          
          const sPhoneDigits = s.phone ? s.phone.replace(/\D/g, '') : '';
          const phoneMatch = Boolean(inputDigits.length >= 8 && sPhoneDigits.length >= 8 && 
            (sPhoneDigits.endsWith(inputDigits) || inputDigits.endsWith(sPhoneDigits)));
          
          const usrIdMatch = Boolean(inputDigits.length >= 8 && s.id && s.id.toLowerCase() === `usr-${inputDigits}`.toLowerCase());
          
          return idMatch || emailMatch || nameMatch || phoneMatch || usrIdMatch;
        });

        // Direct Supabase query fallback if not found in local state
        if (!found && isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase
              .from('students')
              .select('*')
              .or(`id.ilike.${cleanInput},email.ilike.${cleanInput},phone.ilike.%${cleanInput}%`)
              .maybeSingle();
            
            if (data) {
              const mapped = mapDatabaseRowToStudent(data);
              store.addOrUpdateStudent(mapped);
              found = mapped;
            }
          } catch (err) {
            console.error('Supabase direct login check error:', err);
          }
        }

        // Auto-detect role fallback: if not found in students, check if registered as Teacher/PIC
        if (!found) {
          const teachers = store.getTeachers();
          const foundTeacher = teachers.find(t => 
            Boolean(t.id && t.id.toLowerCase() === cleanInput.toLowerCase()) ||
            Boolean(t.email && t.email.toLowerCase() === cleanInput.toLowerCase()) ||
            Boolean(t.name && t.name.toLowerCase() === cleanInput.toLowerCase()) ||
            Boolean(t.phone && inputDigits.length >= 8 && t.phone.replace(/\D/g, '').endsWith(inputDigits))
          );

          if (foundTeacher) {
            setLoginError('Akun Anda terdaftar sebagai Admin/PIC Instansi. Silakan pilih tab "Guru / Admin" untuk masuk.');
            setLoginRole('teacher');
            setIsSubmitting(false);
            return;
          }

          setLoginError('ID User / Email / No. WhatsApp tidak ditemukan dalam sistem. Pastikan Anda sudah terdaftar.');
          setIsSubmitting(false);
          return;
        }

        if (found.lockedOut) {
          setLoginError(found.lockReason || 'Akun Anda dalam status belum aktif / menunggu verifikasi pembayaran oleh Admin.');
          setIsSubmitting(false);
          return;
        }

        if (found.password && cleanPass && found.password !== cleanPass) {
          setLoginError('Password / Kata Sandi salah. Silakan periksa kembali.');
          setIsSubmitting(false);
          return;
        }

        onSuccessLogin(found, 'student');
      } else {
        // Teacher / Counselor / Admin Login
        const teachers = store.getTeachers();
        
        // Superadmin fallback check
        if ((cleanInput.toLowerCase() === 'admin' || cleanInput.toLowerCase() === 'superadmin') && cleanPass === 'admin123') {
          const superadminUser = teachers.find(t => t.role === 'Superadmin') || {
            id: 'TCH-SUPERADMIN',
            name: 'Super Admin System',
            role: 'Superadmin',
            password: 'admin123'
          };
          onSuccessLogin(superadminUser, 'admin');
          return;
        }

        let foundTeacher = teachers.find(t => 
          Boolean(t.id && t.id.toLowerCase() === cleanInput.toLowerCase()) ||
          Boolean(t.email && t.email.toLowerCase() === cleanInput.toLowerCase()) ||
          Boolean(t.name && t.name.toLowerCase() === cleanInput.toLowerCase()) ||
          Boolean(t.phone && inputDigits.length >= 8 && t.phone.replace(/\D/g, '').endsWith(inputDigits))
        );

        // Auto-detect role fallback: if not found in teachers, check if registered as Student/User
        if (!foundTeacher) {
          const students = store.getStudents();
          const foundStudent = students.find(s => 
            Boolean(s.id && s.id.toLowerCase() === cleanInput.toLowerCase()) ||
            Boolean(s.email && s.email.toLowerCase() === cleanInput.toLowerCase()) ||
            Boolean(s.phone && inputDigits.length >= 8 && s.phone.replace(/\D/g, '').endsWith(inputDigits))
          );

          if (foundStudent) {
            setLoginError('Akun Anda terdaftar sebagai Peserta / User Personal. Silakan pilih tab "Peserta / User" untuk masuk.');
            setLoginRole('student');
            setIsSubmitting(false);
            return;
          }

          setLoginError('ID / Username Pengajar / Admin tidak ditemukan.');
          setIsSubmitting(false);
          return;
        }

        if (foundTeacher.password && cleanPass && foundTeacher.password !== cleanPass) {
          setLoginError('Password tidak sesuai.');
          setIsSubmitting(false);
          return;
        }

        const isCounselorRole = ['Guru', 'Konselor', 'Wali Kelas', 'Kakomli'].includes(foundTeacher.role);
        const resolvedRole = isCounselorRole ? 'counselor' : 'admin';
        onSuccessLogin(foundTeacher, resolvedRole);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Final Submission (Step 3)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = clientForm.name.trim();
    const trimmedEmail = clientForm.email.trim();
    const trimmedPhone = clientForm.phone.trim();
    const cleanedPhone = trimmedPhone.replace(/[^0-9]/g, '');

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setFormError('Mohon lengkapi Nama, Email, dan No. WhatsApp.');
      return;
    }

    if (trimmedName.length < 3) {
      setFormError('Nama lengkap / instansi minimal 3 karakter.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError('Format email tidak valid (contoh: user@domain.com).');
      return;
    }

    if (cleanedPhone.length < 10) {
      setFormError('Nomor WhatsApp harus berupa angka minimal 10 digit (contoh: 081234567890).');
      return;
    }

    if (selectedCategory === 'personal' && clientForm.password.trim() && clientForm.password.trim().length < 6) {
      setFormError('Kata sandi akun minimal 6 karakter.');
      return;
    }

    if (selectedTestModules.length === 0) {
      setFormError('Pilih minimal 1 jenis modul tes psikometri.');
      return;
    }

    const testModuleNames = availableTestModules
      .filter(m => selectedTestModules.includes(m.id))
      .map(m => m.name)
      .join(', ');

    setIsSubmitting(true);
    try {
      if (selectedCategory === 'personal') {
        // Personal Client Flow (No Token, Direct Account Created)
        const allStudents = store.getStudents();
        const existingStudent = allStudents.find((s: any) => 
          s.email && s.email.toLowerCase() === clientForm.email.trim().toLowerCase()
        );

        if (existingStudent) {
          if (existingStudent.paymentStatus === 'PAID' || existingStudent.lockedOut === false) {
            setFormError('Email ini sudah terdaftar dan akun Anda sudah Aktif. Silakan kembali ke menu Login.');
            setIsSubmitting(false);
            return;
          }
        }

        const newStudent = store.registerPersonalStudent({
          name: clientForm.name.trim(),
          email: clientForm.email.trim(),
          phone: clientForm.phone.trim(),
          password: clientForm.password.trim(),
          gender: clientForm.gender,
          schoolOrigin: clientForm.schoolOrigin.trim() || 'Personal / Mandiri',
          paymentAmount: priceCalculation.finalTotalAmount,
          packageName: `Paket Mandiri (${selectedTestModules.join('+')})`,
          selectedTestModules: selectedTestModules
        });

        setRegSuccessData({
          type: 'personal',
          studentId: newStudent.id,
          name: newStudent.name,
          email: newStudent.email,
          phone: newStudent.phone,
          invoice: newStudent.invoiceNumber,
          password: newStudent.password,
          amount: priceCalculation.finalTotalAmount,
          selectedTests: testModuleNames,
          expiryHours: REGISTRATION_EXPIRY_HOURS
        });
      } else {
        // B2B / Institution / School / Kampus Flow
        const existingReg = store.getRegistrations().find(r => 
          r.adminEmail && r.adminEmail.toLowerCase() === clientForm.email.trim().toLowerCase() && 
          r.status === 'Pending'
        );

        if (existingReg) {
          setFormError('Email PIC ini sudah memiliki pengajuan pendaftaran yang pending (Menunggu verifikasi).');
          setIsSubmitting(false);
          return;
        }

        const resolvedSchoolType = (selectedSubSchoolType || 'SMK') as any;

        const reg = store.addRegistration({
          schoolName: clientForm.name.trim(),
          categoryType: selectedCategory,
          schoolType: resolvedSchoolType,
          adminEmail: clientForm.email.trim(),
          adminPhone: clientForm.phone.trim(),
          address: clientForm.address.trim() || 'Lokasi Instansi',
          estimatedStudents: priceCalculation.finalTotalAmount > 0 ? (selectedCategory === 'personal' ? 1 : Number(estimatedStudentCount)) : 50,
          adminPassword: clientForm.password.trim() || 'pass1234',
          registrationType: 'instansi',
          selectedTestModules: selectedTestModules,
          testModulesNames: testModuleNames,
          amount: priceCalculation.finalTotalAmount,
          totalAmount: priceCalculation.finalTotalAmount,
          paymentStatus: 'UNPAID'
        });

        setRegSuccessData({
          type: 'instansi',
          id: reg.id,
          schoolName: reg.schoolName,
          categoryTitle: activeCategoryOption.title,
          email: reg.adminEmail,
          phone: reg.adminPhone,
          invoice: reg.invoiceNumber || `INV/B2B/${reg.id}`,
          amount: priceCalculation.finalTotalAmount,
          estimatedStudents: reg.estimatedStudents,
          selectedTests: testModuleNames,
          expiryHours: REGISTRATION_EXPIRY_HOURS
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal memproses pendaftaran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {activeMode === 'login' ? 'Masuk ke Sistem Asesmen' : 'Pendaftaran Akses Layanan Asesmen'}
              </h3>
              <p className="text-[11px] text-slate-400">Psychometrics.id Platform Asesmen Digital</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Toggle: Login vs Register */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => { setActiveMode('login'); setRegSuccessData(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeMode === 'login'
                ? 'border-indigo-600 text-indigo-600 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Masuk / Login
          </button>
          <button
            onClick={() => { setActiveMode('register'); setRegSuccessData(null); }}
            className={`flex-1 py-3 text-center transition-all flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeMode === 'register'
                ? 'border-indigo-600 text-indigo-600 bg-white font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Pendaftaran Baru
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-800">
          {activeMode === 'login' ? (
            /* LOGIN MODE */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Role Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setLoginRole('student')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'student'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Siswa / Peserta
                </button>
                <button
                  type="button"
                  onClick={() => setLoginRole('teacher')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginRole === 'teacher'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Guru / Admin
                </button>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {loginRole === 'student' ? 'ID User / Email / No. WhatsApp' : 'Username / ID Pengajar'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={loginRole === 'student' ? 'Contoh: USR-08123456789, email, atau No. HP' : 'Contoh: admin atau nama guru'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi / Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun Anda"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Masuk ke Halaman Utama
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Petunjuk Akses:</p>
                <p>&bull; Superadmin: <span className="font-mono text-slate-800">admin / admin123</span></p>
                <p>&bull; User / Peserta Personal: Gunakan ID User, Email, atau No. WhatsApp Anda.</p>
              </div>
            </form>
          ) : (
            /* REGISTER WIZARD MODE */
            regSuccessData ? (
              /* Success Screen */
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">
                    {regSuccessData.type === 'personal' ? 'Pendaftaran Peserta Berhasil!' : 'Pengajuan Kemitraan Berhasil!'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Tagihan pendaftaran telah diterbitkan secara otomatis.</p>
                </div>
                
                {regSuccessData.type === 'personal' ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5 text-slate-600">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-700">No. Invoice Tagihan:</span>
                      <span className="font-mono font-bold text-slate-900">{regSuccessData.invoice}</span>
                    </div>
                    
                    <p><strong className="text-slate-800">ID User:</strong> <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{regSuccessData.studentId}</span></p>
                    <p><strong className="text-slate-800">Nama:</strong> {regSuccessData.name}</p>
                    <p><strong className="text-slate-800">Email:</strong> {regSuccessData.email}</p>
                    <p><strong className="text-slate-800">Password:</strong> <span className="font-mono text-slate-800">{regSuccessData.password}</span></p>
                    <p><strong className="text-slate-800">Jenis Tes:</strong> {regSuccessData.selectedTests}</p>
                    
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-emerald-700 font-bold">
                      <span>Total Pembayaran:</span>
                      <span className="text-sm font-mono text-emerald-700">Rp {regSuccessData.amount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Batas Waktu Pembayaran: 2x24 Jam (48 Jam)</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        Silakan lakukan transfer sesuai nominal invoice di atas ke rekening resmi untuk mengaktifkan akun Anda. Pendaftaran yang belum dibayar dalam 48 jam otomatis dialihkan ke Draf.
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-700 font-mono">
                      <p className="font-bold text-slate-800 font-sans">Rekening Pembayaran Resmi:</p>
                      <p>&bull; BCA: <span className="font-bold">8920192819</span> a.n PT Psikometri CBT</p>
                      <p>&bull; Mandiri: <span className="font-bold">1310029301923</span> a.n PT Psikometri CBT</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5 text-slate-600">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="font-bold text-slate-700">No. Invoice B2B:</span>
                      <span className="font-mono font-bold text-slate-900">{regSuccessData.invoice}</span>
                    </div>

                    <p><strong className="text-slate-800">Nama Pendaftar:</strong> {regSuccessData.schoolName}</p>
                    <p><strong className="text-slate-800">Kategori:</strong> {regSuccessData.categoryTitle}</p>
                    <p><strong className="text-slate-800">Email Admin PIC:</strong> {regSuccessData.email}</p>
                    <p><strong className="text-slate-800">Estimasi Peserta:</strong> {regSuccessData.estimatedStudents} Akun</p>
                    <p><strong className="text-slate-800">Jenis Tes Dicentang:</strong> {regSuccessData.selectedTests}</p>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-indigo-700 font-bold">
                      <span>Total Biaya Estimasi:</span>
                      <span className="text-sm font-mono text-indigo-700">Rp {regSuccessData.amount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Batas Verifikasi & Tagihan: 2x24 Jam</span>
                      </div>
                      <p className="text-[10px] leading-relaxed">
                        Data pendaftaran Anda telah tercatat di Superadmin Console. Tim admin akan memverifikasi pengajuan dan menerbitkan token akses kolektif.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (regSuccessData.type === 'personal') {
                      setLoginIdentifier(regSuccessData.studentId);
                      setLoginPassword(regSuccessData.password);
                    }
                    setActiveMode('login');
                    setRegSuccessData(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Lanjut ke Halaman Login
                </button>
              </div>
            ) : (
              /* 3-STEP REGISTRATION WIZARD FORM */
              <div className="space-y-4">
                {/* WIZARD STEPPER BAR */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      wizardStep === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      1
                    </span>
                    <span className={`text-xs font-bold ${wizardStep === 1 ? 'text-indigo-600' : 'text-slate-500'}`}>Tipe</span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      wizardStep === 2 ? 'bg-indigo-600 text-white' : wizardStep > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      2
                    </span>
                    <span className={`text-xs font-bold ${wizardStep === 2 ? 'text-indigo-600' : 'text-slate-500'}`}>Jenis Tes</span>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      wizardStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      3
                    </span>
                    <span className={`text-xs font-bold ${wizardStep === 3 ? 'text-indigo-600' : 'text-slate-500'}`}>Identitas</span>
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* WIZARD STEP 1: SELECT REGISTRATION TYPE */}
                {wizardStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Pilih Tipe Pendaftaran Registrasi</h4>
                      <p className="text-xs text-slate-500">Tentukan peruntukan akun atau lembaga pendaftar di bawah ini.</p>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {REGISTRATION_TYPE_OPTIONS.map(option => {
                        const isSelected = selectedCategory === option.id;
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleSelectCategory(option.id)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {option.id === 'personal' && <User className="w-4 h-4" />}
                                {option.id === 'sekolah' && <School className="w-4 h-4" />}
                                {option.id === 'kampus' && <GraduationCap className="w-4 h-4" />}
                                {(option.id === 'instansi' || option.id === 'perusahaan') && <Building2 className="w-4 h-4" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-800">{option.title}</span>
                                  {option.badge && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                                      {option.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{option.description}</p>
                              </div>
                            </div>

                            <div className="shrink-0 mt-1">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-3 cursor-pointer"
                    >
                      Lanjut ke Pilih Jenis Tes
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* WIZARD STEP 2: CHECKLIST JENIS TES & AUTO-PRICE CALCULATOR */}
                {wizardStep === 2 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Centang Jenis Tes & Kalkulator Harga</h4>
                        <p className="text-xs text-slate-500">
                          {selectedCategory === 'personal' ? 'Kategori: Peserta Personal Mandiri' : `Kategori: ${activeCategoryOption.title}`}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg font-mono">
                        Langkah 2 dari 3
                      </span>
                    </div>

                    {/* Inclusive Notice Banner (No Certificate check) */}
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2.5">
                      <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="font-bold">Otomatis Termasuk Laporan & Sertifikat:</strong> Setiap jenis tes yang Anda centang secara otomatis sudah mendapatkan <span className="underline font-bold">Sertifikat Resmi</span> & <span className="underline font-bold">Laporan Diagnostik Psikometri</span> tanpa biaya tambahan.
                      </div>
                    </div>

                    {/* Test Module Checklist */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {availableTestModules.map(module => {
                        const isChecked = selectedTestModules.includes(module.id);
                        return (
                          <div
                            key={module.id}
                            onClick={() => handleToggleTestModule(module.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'border-indigo-500 bg-indigo-50/40'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-800">{module.name}</span>
                                  {module.badge && (
                                    <span className="px-1.5 py-0.2 text-[8px] font-bold bg-indigo-100 text-indigo-700 rounded font-mono">
                                      {module.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500">{module.description}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-indigo-700 font-mono">
                                Rp {module.pricePerUser.toLocaleString('id-ID')}
                              </span>
                              <span className="block text-[9px] text-slate-400">/ user</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* B2B Quota Input if applicable */}
                    {selectedCategory !== 'personal' && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700">Jumlah Estimasi Peserta / Kuota:</label>
                          <span className="text-[10px] text-slate-400">Diskon otomatis aktif untuk kuota kolektif</span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={estimatedStudentCount}
                          onChange={e => setEstimatedStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 font-mono text-center focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Live Price Calculator Summary Box */}
                    <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Harga Dasar / User ({selectedTestModules.length} Tes):</span>
                        <span>Rp {priceCalculation.basePricePerStudent.toLocaleString('id-ID')}</span>
                      </div>

                      {selectedCategory !== 'personal' && (
                        <div className="flex justify-between items-center text-slate-400 text-[11px]">
                          <span>Jumlah Peserta:</span>
                          <span>{estimatedStudentCount} Orang</span>
                        </div>
                      )}

                      {priceCalculation.discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 text-[11px]">
                          <span>Diskon Kuota Kolektif ({priceCalculation.discountPercentage}%):</span>
                          <span>- Rp {priceCalculation.discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold font-sans">
                        <span className="text-slate-200">Total Harga Tagihan:</span>
                        <span className="text-emerald-400 font-mono">Rp {priceCalculation.finalTotalAmount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setWizardStep(1)}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardStep(3)}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Lanjut Isi Data Identitas
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 3: CLIENT IDENTITY & FINAL SUBMISSION */}
                {wizardStep === 3 && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Isi Data Identitas Pendaftar</h4>
                        <p className="text-xs text-slate-500">
                          {selectedCategory === 'personal' ? 'Formulir Peserta Mandiri' : `Formulir PIC Admin ${activeCategoryOption.title}`}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg font-mono">
                        Langkah 3 dari 3
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {selectedCategory === 'personal' ? 'Nama Lengkap Peserta' : 'Nama Instansi / Sekolah / Perusahaan'}
                      </label>
                      <input
                        type="text"
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder={selectedCategory === 'personal' ? 'Contoh: Ahmad Rizky' : 'Contoh: SMA Negeri 1 Jakarta / PT Mitra Vokasi'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        required
                      />
                    </div>

                    {selectedCategory === 'sekolah' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenjang Sekolah</label>
                        <select
                          value={selectedSubSchoolType}
                          onChange={e => setSelectedSubSchoolType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        >
                          <option value="SMK">Sekolah Menengah Kejuruan (SMK Vokasi)</option>
                          <option value="SMA">Sekolah Menengah Atas / MA (SMA)</option>
                          <option value="SMP">Sekolah Menengah Pertama / MTs (SMP)</option>
                          <option value="SD">Sekolah Dasar / MI (SD)</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Aktif</label>
                        <input
                          type="email"
                          value={clientForm.email}
                          onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                          placeholder="email@domain.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">No. WhatsApp</label>
                        <input
                          type="text"
                          value={clientForm.phone}
                          onChange={e => setClientForm({ ...clientForm, phone: e.target.value })}
                          placeholder="08123456789"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Password Akun</label>
                        <input
                          type="password"
                          value={clientForm.password}
                          onChange={e => setClientForm({ ...clientForm, password: e.target.value })}
                          placeholder="Password untuk login"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      {selectedCategory === 'personal' ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                          <select
                            value={clientForm.gender}
                            onChange={e => setClientForm({ ...clientForm, gender: e.target.value as 'L' | 'P' })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Lokasi / Alamat Singkat</label>
                          <input
                            type="text"
                            value={clientForm.address}
                            onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                            placeholder="Kota / Kabupaten"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Order Summary & Expiry Notice */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Total Tagihan:</span>
                        <span className="font-bold font-mono text-indigo-700">Rp {priceCalculation.finalTotalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Batas Pembayaran: 2x24 Jam (Otomatis Draf jika belum dibayar)</span>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setWizardStep(2)}
                        className="py-2.5 px-4 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memproses Tagihan...
                          </>
                        ) : (
                          <>
                            <Receipt className="w-4 h-4" />
                            Kirim & Terbitkan Invoice
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
