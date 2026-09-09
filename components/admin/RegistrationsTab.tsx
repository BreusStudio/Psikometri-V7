'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, Check, X, Search, Building2, Mail, Phone, Clock, Calendar, Trash2, Copy, 
  CheckCircle2, AlertCircle, Info, ShieldAlert, UserCheck, CreditCard, Receipt, 
  MessageCircle, ExternalLink, Sparkles, Filter, School, GraduationCap, FileText,
  RefreshCw, Award, CheckSquare, ChevronRight
} from 'lucide-react';
import { RegistrationRequest } from '../../lib/types';
import { PsychometricStore } from '../../lib/store/PsychometricStore';
import { getRegistrationExpiryTimeLeft } from '@/lib/metadata/registrationMetadata';

interface RegistrationsTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
}

export default function RegistrationsTab({ store, onRefresh }: RegistrationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PERSONAL' | 'SEKOLAH' | 'KAMPUS' | 'INSTANSI' | 'PERUSAHAAN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'Expired'>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  
  const [rejectingRegId, setRejectingRegId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    title: string;
    type: 'instansi' | 'personal';
    name: string;
    email: string;
    phone: string;
    generatedUser: string;
    pass?: string;
    invoiceNumber?: string;
    amount?: number;
  } | null>(null);

  const registrations = useMemo(() => {
    return (store.getRegistrations() || []) as RegistrationRequest[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, successModal]);

  const stats = useMemo(() => {
    const list = registrations;
    const personalList = list.filter(r => r.registrationType === 'personal' || r.categoryType === 'personal');
    const b2bList = list.filter(r => r.registrationType !== 'personal' && r.categoryType !== 'personal');

    return {
      total: list.length,
      b2bTotal: b2bList.length,
      personalTotal: personalList.length,
      pending: list.filter(r => r.status === 'Pending').length,
      draftOrExpired: list.filter(r => r.status === 'Draft' || r.status === 'Expired').length,
      personalUnpaid: personalList.filter(r => r.paymentStatus === 'UNPAID' || r.status === 'Pending' || r.status === 'Draft').length,
      personalPaid: personalList.filter(r => r.paymentStatus === 'PAID' || r.status === 'Approved').length,
      approved: list.filter(r => r.status === 'Approved').length,
      rejected: list.filter(r => r.status === 'Rejected').length,
    };
  }, [registrations]);

  const filteredList = useMemo(() => {
    return registrations.filter(r => {
      const matchSearch = 
        (r.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.adminEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.adminPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.personalStudentId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.testModulesNames || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const rCat = (r.categoryType || (r.registrationType === 'personal' ? 'personal' : 'sekolah')).toUpperCase();
      
      const matchCategory = 
        categoryFilter === 'ALL' || 
        (categoryFilter === 'PERSONAL' && (r.registrationType === 'personal' || r.categoryType === 'personal')) ||
        (categoryFilter === 'SEKOLAH' && rCat === 'SEKOLAH') ||
        (categoryFilter === 'KAMPUS' && rCat === 'KAMPUS') ||
        (categoryFilter === 'INSTANSI' && (rCat === 'INSTANSI' || rCat === 'PERUSAHAAN'));

      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      const matchPayment = 
        paymentStatusFilter === 'ALL' ||
        (r.paymentStatus || 'UNPAID') === paymentStatusFilter;
      
      return matchSearch && matchCategory && matchStatus && matchPayment;
    });
  }, [registrations, searchTerm, categoryFilter, statusFilter, paymentStatusFilter]);

  const handleApproveInstansi = (reg: RegistrationRequest) => {
    store.updateRegistrationStatus(reg.id, 'Approved');
    
    const teachersList = store.getTeachers();
    const createdTeacher = teachersList.find((t: any) => t.email === reg.adminEmail || t.school_origin === reg.schoolName);
    const username = createdTeacher ? createdTeacher.id : 'admin_' + reg.id.toLowerCase();
    const password = reg.adminPassword || 'password123';

    setSuccessModal({
      show: true,
      title: 'Pendaftaran Kemitraan Disetujui & Token/Admin Aktif!',
      type: 'instansi',
      name: reg.schoolName,
      email: reg.adminEmail,
      phone: reg.adminPhone,
      generatedUser: username,
      pass: password,
      invoiceNumber: reg.invoiceNumber,
      amount: reg.amount || reg.totalAmount
    });
    onRefresh();
  };

  const handleVerifyPersonalPayment = (reg: RegistrationRequest) => {
    const targetKey = reg.personalStudentId || reg.id;
    store.approveStudentRegistration(targetKey, 'Superadmin');
    store.updateRegistrationStatus(reg.id, 'Approved');

    const updatedReg = store.getRegistrations().find(r => r.id === reg.id);
    const activeStudent = store.getStudents().find(s => (s.email && s.email.toLowerCase() === reg.adminEmail.toLowerCase()) || s.id === reg.personalStudentId);

    setSuccessModal({
      show: true,
      title: 'Pembayaran Personal Diverifikasi & Akun Langsung Aktif!',
      type: 'personal',
      name: reg.schoolName,
      email: reg.adminEmail,
      phone: reg.adminPhone,
      generatedUser: (activeStudent && activeStudent.id) || (updatedReg && updatedReg.personalStudentId) || targetKey,
      invoiceNumber: reg.invoiceNumber || 'INV/2026/PESERTA',
      amount: reg.amount || reg.totalAmount || 75000,
    });
    onRefresh();
  };

  const handleRejectConfirm = (id: string) => {
    store.updateRegistrationStatus(id, 'Rejected', rejectReasonInput.trim() || 'Verifikasi tidak memenuhi syarat.');
    setRejectingRegId(null);
    setRejectReasonInput('');
    onRefresh();
  };

  const handleRestoreToPending = (id: string) => {
    store.updateRegistrationStatus(id, 'Pending');
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pendaftaran ini?')) {
      store.deleteRegistration(id);
      onRefresh();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Teks berhasil disalin!');
  };

  const openWhatsAppActiveNotification = (reg: RegistrationRequest) => {
    const cleanPhone = PsychometricStore.formatIndonesianWhatsAppNumber(reg.adminPhone || '');
    const invoice = reg.invoiceNumber || '-';
    const name = reg.schoolName || 'Peserta';
    const id = reg.personalStudentId || '-';
    const tests = reg.testModulesNames || 'Tes Psikometri';
    const message = `Halo ${name},\n\nPembayaran pendaftaran *${tests}* dengan Invoice *${invoice}* telah *DIVERIFIKASI LUNAS* oleh Superadmin.\n\nAkun Anda telah *AKTIF*:\n• *ID User:* ${id}\n• *Sertifikat & Laporan:* Otomatis Tersedia setelah Selesai\n\nSilakan langsung masuk ke platform CBT untuk memulai ujian. Terima kasih!\n\n_Admin Psikometri Indonesia_`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openWhatsAppInvoiceReminder = (reg: RegistrationRequest) => {
    const cleanPhone = PsychometricStore.formatIndonesianWhatsAppNumber(reg.adminPhone || '');
    const invoice = reg.invoiceNumber || '-';
    const name = reg.schoolName || 'Peserta';
    const amount = (reg.amount || reg.totalAmount || 75000).toLocaleString('id-ID');
    const tests = reg.testModulesNames || 'Tes Psikometri';
    const message = `Halo ${name},\n\nBerikut pengingat tagihan pendaftaran *${tests}* Anda:\n\n• *No. Invoice:* ${invoice}\n• *Total Tagihan:* Rp ${amount}\n• *Batas Waktu Transfer:* 2x24 Jam (48 Jam)\n\n*Rekening Pembayaran Resmi:*\n1. Bank BCA: 8920192819 (PT Psikometri CBT)\n2. Bank Mandiri: 1310029301923 (PT Psikometri CBT)\n\nHarap kirimkan bukti pembayaran setelah transfer agar akun langsung diaktifkan. Terima kasih!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="registrations-tab">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 className="w-32 h-32 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-indigo-300 uppercase tracking-wider font-mono">Superadmin Control Center</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Pendaftaran Self-Service & Verifikasi Otomatis</h2>
          <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
            Kelola pendaftaran Personal (tanpa token) dan Instansi Sekolah/Kampus/Perusahaan (dengan token B2B). Batas pembayaran 2x24 jam otomatis mengalihkan status belum bayar ke Draf.
          </p>
        </div>
      </div>

      {/* STATS HIGHLIGHT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setCategoryFilter('ALL'); setStatusFilter('All'); }}
          className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Pendaftar</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            <span className="text-[10px] text-slate-500 font-medium">{stats.b2bTotal} B2B • {stats.personalTotal} Personal</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Pending'); }}
          className="bg-amber-50/80 p-4.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Menunggu Verifikasi</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats.pending}</p>
            <span className="text-[10px] text-amber-800 font-medium">Batas Pembayaran 2x24 Jam</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Approved'); }}
          className="bg-emerald-50/80 p-4.5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Lunas & Disetujui</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.approved}</p>
            <span className="text-[10px] text-emerald-800 font-medium">Akun Aktif / Token Siap</span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter('Draft'); }}
          className="bg-slate-100/80 p-4.5 rounded-2xl border border-slate-300 shadow-xs flex items-center justify-between cursor-pointer hover:border-slate-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Draf / Kadaluarsa</span>
            <p className="text-2xl font-black text-slate-700 mt-1">{stats.draftOrExpired}</p>
            <span className="text-[10px] text-slate-500 font-medium">Lewat 2x24 Jam Tanpa Bayar</span>
          </div>
          <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & TABLE SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* SEARCH BAR */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Cari nama, email, invoice, jenis tes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>

            {/* CATEGORY TABS */}
            <div className="flex flex-wrap gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
              {(['ALL', 'PERSONAL', 'SEKOLAH', 'KAMPUS', 'INSTANSI'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCategoryFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    categoryFilter === tab 
                      ? 'bg-white text-slate-800 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'ALL' ? 'Semua' : tab === 'PERSONAL' ? 'Personal' : tab === 'SEKOLAH' ? 'Sekolah' : tab === 'KAMPUS' ? 'Kampus' : 'Instansi/Perusahaan'}
                </button>
              ))}
            </div>
          </div>

          {/* SECONDARY STATUS FILTER */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Status Pendaftaran:</span>
            
            <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {(['All', 'Pending', 'Approved', 'Rejected', 'Draft', 'Expired'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    statusFilter === tab 
                      ? tab === 'Pending' ? 'bg-amber-100 text-amber-800 font-bold'
                        : tab === 'Approved' ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : tab === 'Rejected' ? 'bg-rose-100 text-rose-800 font-bold'
                        : tab === 'Draft' || tab === 'Expired' ? 'bg-slate-200 text-slate-800 font-bold'
                        : 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'All' ? 'Semua' : tab === 'Pending' ? 'Pending' : tab === 'Approved' ? 'Disetujui' : tab === 'Rejected' ? 'Ditolak' : tab === 'Draft' ? 'Draf (Unpaid)' : 'Kadaluarsa'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* LIST TABLE */}
        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Tidak Ada Data Pendaftaran Sesuai Filter</p>
                <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau tab filter di atas.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Identitas & Tipe Pendaftar</th>
                  <th className="py-4 px-6">Jenis Tes Dicentang</th>
                  <th className="py-4 px-6">Invoice & Total Biaya</th>
                  <th className="py-4 px-6">Batas Pembayaran (2x24 Jam)</th>
                  <th className="py-4 px-6 text-center">Status Pendaftaran</th>
                  <th className="py-4 px-6 text-right">Verifikasi Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredList.map(reg => {
                  const isPersonal = reg.registrationType === 'personal' || reg.categoryType === 'personal';
                  const isPaid = reg.paymentStatus === 'PAID' || reg.status === 'Approved';
                  const isPending = reg.status === 'Pending';
                  const isDraftOrExpired = reg.status === 'Draft' || reg.status === 'Expired';
                  const expiryInfo = getRegistrationExpiryTimeLeft(reg.submittedAt || reg.requestedAt, 48);

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* IDENTITY */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{reg.schoolName}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                            isPersonal 
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {(reg.categoryType || reg.schoolType || 'INSTANSI').toUpperCase()}
                          </span>
                        </div>

                        {isPersonal ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                            <span>ID User:</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {reg.personalStudentId || '-'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-[11px]">
                            <span>PIC Email: <strong className="text-slate-700">{reg.adminEmail}</strong></span>
                            <span className="ml-2 font-mono">({reg.estimatedStudents || 50} Peserta)</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">WA: {reg.adminPhone || '-'}</div>
                      </td>

                      {/* TEST MODULES */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-800 block">
                            {reg.testModulesNames || (reg.selectedTestModules ? reg.selectedTestModules.join(', ') : 'IQ, Holland')}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <Award className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>Sertifikat & Laporan Otomatis Ada</span>
                          </div>
                        </div>
                      </td>

                      {/* INVOICE & AMOUNT */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {reg.invoiceNumber || `INV/B2B/${reg.id}`}
                        </div>
                        <div className="text-xs font-bold text-indigo-700 font-mono">
                          Rp {(reg.amount || reg.totalAmount || 75000).toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* EXPIRY COUNTDOWN (2x24h) */}
                      <td className="py-4 px-6 text-xs">
                        {isPending ? (
                          <div className={`p-2 rounded-xl border space-y-0.5 ${
                            expiryInfo.isExpired 
                              ? 'bg-rose-50 border-rose-200 text-rose-800' 
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>
                            <div className="flex items-center gap-1 font-bold text-[11px]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{expiryInfo.timeLeftFormatted}</span>
                            </div>
                            <p className="text-[9px] text-slate-500">2x24 Jam dari {new Date(reg.submittedAt || reg.requestedAt).toLocaleDateString('id-ID')}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            {new Date(reg.submittedAt || reg.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          reg.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse' :
                          reg.status === 'Draft' || reg.status === 'Expired' ? 'bg-slate-200 text-slate-800 border-slate-300' :
                          'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {reg.status === 'Approved' ? 'LUNAS & AKTIF' :
                           reg.status === 'Pending' ? 'MENUNGGU BAYAR' :
                           reg.status === 'Draft' ? 'DRAF (EXPIRED)' :
                           reg.status === 'Expired' ? 'KADALUARSA' : 'DITOLAK'}
                        </span>
                        {reg.rejectionReason && (
                          <p className="text-[9px] text-rose-600 mt-1 max-w-xs italic">{reg.rejectionReason}</p>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                        {isPending && (
                          <>
                            {isPersonal ? (
                              <button
                                onClick={() => handleVerifyPersonalPayment(reg)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verifikasi Pembayaran
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApproveInstansi(reg)}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Setujui & Terbit Token
                              </button>
                            )}

                            <button
                              onClick={() => { setRejectingRegId(reg.id); setRejectReasonInput(''); }}
                              title="Tolak Pendaftaran"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 cursor-pointer inline-flex items-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {isDraftOrExpired && (
                          <button
                            onClick={() => handleRestoreToPending(reg.id)}
                            title="Aktifkan Kembali ke Menunggu"
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Pulihkan Ke Pending
                          </button>
                        )}

                        {reg.status === 'Approved' && (
                          <button
                            onClick={() => openWhatsAppActiveNotification(reg)}
                            title="Kirim Notifikasi WA"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all border border-emerald-200 cursor-pointer inline-flex items-center"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        {!isPaid && (
                          <button
                            onClick={() => openWhatsAppInvoiceReminder(reg)}
                            title="Kirim Pengingat Invoice WA"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all border border-amber-200 cursor-pointer inline-flex items-center"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(reg.id)}
                          title="Hapus Data"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL REJECT REASON */}
      {rejectingRegId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-sm w-full space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Alasan Penolakan Pendaftaran</h4>
            <p className="text-xs text-slate-500">Berikan catatan mengapa pendaftaran ini ditolak (opsional):</p>
            <textarea
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              placeholder="Contoh: Bukti transfer tidak valid / Data instansi tidak sesuai"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingRegId(null)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={() => handleRejectConfirm(rejectingRegId)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL SUKSES VERIFIKASI / PERSETUJUAN */}
      {successModal && successModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl max-w-md w-full space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{successModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {successModal.type === 'personal'
                  ? `Pembayaran pendaftaran mandiri untuk peserta ${successModal.name} telah diverifikasi. Akun sekarang aktif dan siap mengikuti ujian.`
                  : `Akun administrator utama untuk instansi ${successModal.name} telah berhasil disetujui.`}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              {successModal.invoiceNumber && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="text-slate-500 font-medium">No. Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{successModal.invoiceNumber}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {successModal.type === 'personal' ? 'ID User' : 'Username Administrator'}
                </span>
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold font-mono text-slate-700">
                  <span>{successModal.generatedUser}</span>
                  <button 
                    onClick={() => copyToClipboard(successModal.generatedUser)}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {successModal.pass && (
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Kata Sandi (Password)</span>
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold font-mono text-slate-700">
                    <span>{successModal.pass}</span>
                    <button 
                      onClick={() => copyToClipboard(successModal.pass)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  const cleanPhone = PsychometricStore.formatIndonesianWhatsAppNumber(successModal.phone || '');
                  const message = `Halo ${successModal.name},\n\nPendaftaran & Pembayaran Anda (${successModal.invoiceNumber || '-'}) telah *DIVERIFIKASI LUNAS & AKTIF*.\n\nDetail Login:\n• *Username/ID:* ${successModal.generatedUser}\n• *Password:* ${successModal.pass || '-'}\n\nSilakan langsung login ke platform CBT. Terima kasih!\n\n_Admin Psikometri CBT_`;
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                Kirim Notifikasi WA Akun Aktif
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                onClick={() => setSuccessModal(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all cursor-pointer text-xs"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
