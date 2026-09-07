'use client';

import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { PsychometricStore } from '@/lib/store/PsychometricStore';

interface AuthModalProps {
  store: PsychometricStore;
  isRegister?: boolean;
  initialRole?: 'Student' | 'Teacher';
  initialTab?: 'personal' | 'instansi';
  onClose: () => void;
  onSuccessLogin: (user: any, role: 'admin' | 'counselor' | 'student') => void;
}

export function AuthModal({
  store,
  isRegister = false,
  initialRole = 'Student',
  initialTab = 'instansi',
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

  // Register State
  const [registerTab, setRegisterTab] = useState<'instansi' | 'personal'>(initialTab);
  const [regSuccessData, setRegSuccessData] = useState<any | null>(null);

  // Instansi Form State
  const [instansiForm, setInstansiForm] = useState({
    schoolName: '',
    schoolType: 'SMA' as 'SMK' | 'SMA' | 'SMP' | 'SD' | 'Instansi' | 'Lainnya',
    adminEmail: '',
    adminPhone: '',
    address: '',
    estimatedStudents: 50,
    adminPassword: ''
  });

  // Personal Form State
  const [personalForm, setPersonalForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'L' as 'L' | 'P',
    schoolOrigin: ''
  });

  const [formError, setFormError] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Silakan masukkan ID, Username, atau Email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanInput = loginIdentifier.trim();
      const cleanPass = loginPassword.trim();

      if (loginRole === 'student') {
        const students = store.getStudents();
        const found = students.find(s => 
          s.id.toLowerCase() === cleanInput.toLowerCase() ||
          (s.email && s.email.toLowerCase() === cleanInput.toLowerCase()) ||
          s.name.toLowerCase() === cleanInput.toLowerCase()
        );

        if (!found) {
          setLoginError('ID / Username Peserta tidak ditemukan dalam sistem.');
          setIsSubmitting(false);
          return;
        }

        if (found.password && cleanPass && found.password !== cleanPass) {
          setLoginError('Password / Kata Sandi salah.');
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

        const foundTeacher = teachers.find(t => 
          t.id.toLowerCase() === cleanInput.toLowerCase() ||
          t.name.toLowerCase() === cleanInput.toLowerCase()
        );

        if (!foundTeacher) {
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

  // Handle Register Instansi Submit
  const handleInstansiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!instansiForm.schoolName.trim() || !instansiForm.adminEmail.trim() || !instansiForm.adminPhone.trim()) {
      setFormError('Mohon lengkapi Nama Instansi, Email, dan No. WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reg = store.addRegistration({
        schoolName: instansiForm.schoolName.trim(),
        schoolType: instansiForm.schoolType,
        adminEmail: instansiForm.adminEmail.trim(),
        adminPhone: instansiForm.adminPhone.trim(),
        address: instansiForm.address.trim() || 'Lokasi Instansi',
        estimatedStudents: Number(instansiForm.estimatedStudents) || 50,
        adminPassword: instansiForm.adminPassword || 'pass1234',
        registrationType: 'instansi'
      });

      setRegSuccessData({
        type: 'instansi',
        id: reg.id,
        schoolName: reg.schoolName,
        email: reg.adminEmail,
        invoice: reg.invoiceNumber || 'INV/B2B/PENDING'
      });
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengajukan pendaftaran instansi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Personal Submit
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!personalForm.name.trim() || !personalForm.email.trim()) {
      setFormError('Mohon isi Nama Lengkap dan Email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newStudent = store.registerPersonalStudent({
        name: personalForm.name.trim(),
        email: personalForm.email.trim(),
        phone: personalForm.phone.trim(),
        password: personalForm.password.trim(),
        gender: personalForm.gender,
        schoolOrigin: personalForm.schoolOrigin.trim() || 'Personal / Mandiri'
      });

      setRegSuccessData({
        type: 'personal',
        studentId: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        invoice: newStudent.invoiceNumber,
        password: newStudent.password
      });
    } catch (err: any) {
      setFormError(err.message || 'Gagal melakukan pendaftaran mandiri.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {activeMode === 'login' ? 'Masuk ke Sistem CBT' : 'Pendaftaran Akses Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">Psychometrics.id Platform</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                ? 'border-indigo-600 text-indigo-600 bg-white'
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
                ? 'border-indigo-600 text-indigo-600 bg-white'
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
                    {loginRole === 'student' ? 'ID Peserta / Username / Email' : 'Username / ID Pengajar'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={loginRole === 'student' ? 'Contoh: USR-123456 atau nama' : 'Contoh: admin atau nama guru'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi / Password (Opsional)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan kata sandi akun"
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
                <p className="font-semibold text-slate-700">Petunjuk Login:</p>
                <p>&bull; Superadmin: <span className="font-mono text-slate-800">admin / admin123</span></p>
                <p>&bull; Siswa Uji Coba: Gunakan ID Peserta dari daftar siswa terdaftar.</p>
              </div>
            </form>
          ) : (
            /* REGISTER MODE */
            regSuccessData ? (
              /* Success Screen */
              <div className="py-4 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">
                  {regSuccessData.type === 'instansi' ? 'Pengajuan Instansi Berhasil!' : 'Pendaftaran Peserta Berhasil!'}
                </h4>
                
                {regSuccessData.type === 'instansi' ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
                    <p><strong className="text-slate-800">Nama Instansi:</strong> {regSuccessData.schoolName}</p>
                    <p><strong className="text-slate-800">Email Admin:</strong> {regSuccessData.email}</p>
                    <p><strong className="text-slate-800">No. Invoice:</strong> {regSuccessData.invoice}</p>
                    <p className="text-indigo-700 font-medium pt-2 border-t border-slate-200">
                      Pengajuan Anda sedang diproses oleh Tim Admin. Silakan periksa email atau hubungi administrator untuk verifikasi.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
                    <p><strong className="text-slate-800">ID Peserta:</strong> <span className="font-mono text-indigo-600 font-bold">{regSuccessData.studentId}</span></p>
                    <p><strong className="text-slate-800">Nama:</strong> {regSuccessData.name}</p>
                    <p><strong className="text-slate-800">Password:</strong> <span className="font-mono text-slate-800">{regSuccessData.password}</span></p>
                    <p><strong className="text-slate-800">No. Invoice:</strong> {regSuccessData.invoice}</p>
                    <p className="text-indigo-700 font-medium pt-2 border-t border-slate-200">
                      Simpan ID Peserta di atas untuk login ke sesi asesmen mandiri.
                    </p>
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
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Lanjut ke Halaman Login
                </button>
              </div>
            ) : (
              /* Registration Form */
              <div className="space-y-4">
                {/* Sub Tab: Instansi vs Personal */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setRegisterTab('instansi')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      registerTab === 'instansi'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    Kemitraan Instansi
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterTab('personal')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      registerTab === 'personal'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Peserta Mandiri
                  </button>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {registerTab === 'instansi' ? (
                  /* Form Instansi */
                  <form onSubmit={handleInstansiSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Instansi / Sekolah</label>
                      <input
                        type="text"
                        value={instansiForm.schoolName}
                        onChange={e => setInstansiForm({ ...instansiForm, schoolName: e.target.value })}
                        placeholder="Contoh: SMA Negeri 1 Jakarta / SMK 2 Surabaya"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Instansi</label>
                        <select
                          value={instansiForm.schoolType}
                          onChange={e => setInstansiForm({ ...instansiForm, schoolType: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        >
                          <option value="SMA">SMA / MA</option>
                          <option value="SMK">SMK (Vokasi)</option>
                          <option value="SMP">SMP / MTs</option>
                          <option value="SD">SD / MI</option>
                          <option value="Instansi">Perusahaan / Korporat</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimasi Siswa</label>
                        <input
                          type="number"
                          value={instansiForm.estimatedStudents}
                          onChange={e => setInstansiForm({ ...instansiForm, estimatedStudents: parseInt(e.target.value) || 10 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Penanggung Jawab</label>
                        <input
                          type="email"
                          value={instansiForm.adminEmail}
                          onChange={e => setInstansiForm({ ...instansiForm, adminEmail: e.target.value })}
                          placeholder="admin@sekolah.sch.id"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">No. WhatsApp</label>
                        <input
                          type="text"
                          value={instansiForm.adminPhone}
                          onChange={e => setInstansiForm({ ...instansiForm, adminPhone: e.target.value })}
                          placeholder="08123456789"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <School className="w-4 h-4" />}
                      Kirim Pengajuan Instansi
                    </button>
                  </form>
                ) : (
                  /* Form Personal */
                  <form onSubmit={handlePersonalSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap Peserta</label>
                      <input
                        type="text"
                        value={personalForm.name}
                        onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })}
                        placeholder="Contoh: Ahmad Rizky"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={personalForm.email}
                          onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                          placeholder="peserta@gmail.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">No. WhatsApp</label>
                        <input
                          type="text"
                          value={personalForm.phone}
                          onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                          placeholder="08123456789"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Password Baru</label>
                        <input
                          type="password"
                          value={personalForm.password}
                          onChange={e => setPersonalForm({ ...personalForm, password: e.target.value })}
                          placeholder="Kata sandi unik"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                        <select
                          value={personalForm.gender}
                          onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value as 'L' | 'P' })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                      Daftar Peserta Mandiri
                    </button>
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
