'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, Check, X, Search, Building2, Mail, Phone, Clock, Calendar, Trash2, Copy, 
  CheckCircle2, AlertCircle, Info, ShieldAlert, UserCheck, CreditCard, Receipt, 
  MessageCircle, ExternalLink, Sparkles, Filter
} from 'lucide-react';
import { RegistrationRequest } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';

interface RegistrationsTabProps {
  store: any; // PsychometricStore
  onRefresh: () => void;
}

export default function RegistrationsTab({ store, onRefresh }: RegistrationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'INSTANSI' | 'PERSONAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  
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
    const personalList = list.filter(r => r.type === 'personal');
    const instansiList = list.filter(r => r.type !== 'personal');

    return {
      total: list.length,
      instansiTotal: instansiList.length,
      personalTotal: personalList.length,
      pending: list.filter(r => r.status === 'Pending').length,
      personalUnpaid: personalList.filter(r => r.paymentStatus === 'UNPAID' || r.status === 'Pending').length,
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
        (r.personalStudentId || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = 
        categoryFilter === 'ALL' || 
        (categoryFilter === 'PERSONAL' && r.type === 'personal') ||
        (categoryFilter === 'INSTANSI' && r.type !== 'personal');

      const matchStatus = statusFilter === 'All' || r.status === statusFilter;

      const matchPayment = 
        paymentStatusFilter === 'ALL' ||
        (r.type === 'personal' && (r.paymentStatus || 'UNPAID') === paymentStatusFilter) ||
        (r.type !== 'personal');
      
      return matchSearch && matchCategory && matchStatus && matchPayment;
    });
  }, [registrations, searchTerm, categoryFilter, statusFilter, paymentStatusFilter]);

  const handleApproveInstansi = (reg: RegistrationRequest) => {
    store.updateRegistrationStatus(reg.id, 'Approved');
    
    const teachersList = store.getTeachers();
    const createdTeacher = teachersList.find((t: any) => t.email === reg.adminEmail && t.school === reg.schoolName);
    const username = createdTeacher ? createdTeacher.id : 'admin_' + reg.id.toLowerCase();
    const password = reg.adminPassword || 'password123';

    setSuccessModal({
      show: true,
      title: 'Pendaftaran Instansi Disetujui!',
      type: 'instansi',
      name: reg.schoolName,
      email: reg.adminEmail,
      phone: reg.adminPhone,
      generatedUser: username,
      pass: password,
    });
    onRefresh();
  };

  const handleVerifyPersonalPayment = (reg: RegistrationRequest) => {
    const studentId = reg.personalStudentId;
    if (studentId) {
      store.verifyPersonalPayment(studentId, 'Superadmin');
    }
    store.updateRegistrationStatus(reg.id, 'Approved');

    setSuccessModal({
      show: true,
      title: 'Pembayaran Personal Berhasil Diverifikasi & Akun Aktif!',
      type: 'personal',
      name: reg.schoolName, // contains student's full name
      email: reg.adminEmail,
      phone: reg.adminPhone,
      generatedUser: studentId || '-',
      invoiceNumber: reg.invoiceNumber || 'INV/2026/PESERTA',
      amount: reg.amount || 75000,
    });
    onRefresh();
  };

  const handleReject = (id: string) => {
    store.updateRegistrationStatus(id, 'Rejected');
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
    const message = `Halo ${name},\n\nPembayaran pendaftaran Tes Minat Bakat Psikometri Anda dengan No. Invoice *${invoice}* telah *DIVERIFIKASI LUNAS* oleh Admin.\n\nAkun Anda telah *AKTIF* dengan detail:\n• *ID Peserta / NIM:* ${id}\n• *Nama:* ${name}\n• *Status:* Lunas & Siap Ujian\n\nSilakan langsung masuk ke platform CBT untuk memulai asesmen minat bakat Anda. Semoga sukses!\n\n_Admin CBT Psikometri Indonesia_`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openWhatsAppInvoiceReminder = (reg: RegistrationRequest) => {
    const cleanPhone = PsychometricStore.formatIndonesianWhatsAppNumber(reg.adminPhone || '');
    const invoice = reg.invoiceNumber || '-';
    const name = reg.schoolName || 'Peserta';
    const id = reg.personalStudentId || '-';
    const amount = (reg.amount || 75000).toLocaleString('id-ID');
    const message = `Halo ${name},\n\nBerikut pengingat tagihan pendaftaran Tes Minat Bakat Psikometri Personal Anda:\n\n• *No. Invoice:* ${invoice}\n• *ID Peserta:* ${id}\n• *Total Tagihan:* Rp ${amount}\n\n*Pilihan Rekening Pembayaran Resmi:*\n1. Bank BCA: 8920192819 (PT Psikometri CBT)\n2. Bank Mandiri: 1310029301923 (PT Psikometri CBT)\n\nSetelah melakukan transfer, silakan kirimkan bukti transfer ke WhatsApp ini agar akun Anda segera diverifikasi dan diaktifkan. Terima kasih!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="registrations-tab">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 className="w-24 h-24 text-indigo-600" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider font-mono">Superadmin Console</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Pendaftaran & Verifikasi Pembayaran</h2>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            Tinjau pengajuan instansi sekolah dan verifikasi bukti pembayaran pendaftaran personal/mandiri untuk mengaktifkan akun tes minat bakat secara instan.
          </p>
        </div>
      </div>

      {/* STATS HIGHLIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => { setCategoryFilter('ALL'); setStatusFilter('All'); }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Semua Registrasi</span>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            <span className="text-[11px] text-slate-500 font-medium">{stats.instansiTotal} Instansi • {stats.personalTotal} Personal</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <Building2 className="w-5 h-5 text-slate-500" />
          </div>
        </div>

        <div 
          onClick={() => { setCategoryFilter('PERSONAL'); setPaymentStatusFilter('UNPAID'); }}
          className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Personal Belum Lunas</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.personalUnpaid}</p>
            <span className="text-[11px] text-amber-700 font-medium">Menunggu Verifikasi Bukti</span>
          </div>
          <div className="p-3 bg-amber-100/70 border border-amber-200 rounded-xl">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div 
          onClick={() => { setCategoryFilter('PERSONAL'); setPaymentStatusFilter('PAID'); }}
          className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Personal Lunas & Aktif</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.personalPaid}</p>
            <span className="text-[11px] text-emerald-700 font-medium">Akun Terbuka / Siap Ujian</span>
          </div>
          <div className="p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div 
          onClick={() => { setCategoryFilter('INSTANSI'); setStatusFilter('Pending'); }}
          className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200/80 shadow-sm flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-all"
        >
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">Instansi Baru</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.instansiTotal}</p>
            <span className="text-[11px] text-indigo-700 font-medium">{stats.approved} Disetujui</span>
          </div>
          <div className="p-3 bg-indigo-100/70 border border-indigo-200 rounded-xl">
            <Users className="w-5 h-5 text-indigo-600" />
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
                placeholder="Cari nama, invoice, ID, no WA..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            {/* CATEGORY TABS (ALL / INSTANSI / PERSONAL) */}
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto">
              {(['ALL', 'PERSONAL', 'INSTANSI'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCategoryFilter(tab)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    categoryFilter === tab 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'ALL' ? 'Semua Registrasi' : tab === 'PERSONAL' ? 'Peserta Personal' : 'Instansi Sekolah'}
                </button>
              ))}
            </div>
          </div>

          {/* SECONDARY FILTER: STATUS & PAYMENT */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Filter Status:</span>
            
            <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    statusFilter === tab ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'All' ? 'Semua Status' : tab === 'Pending' ? 'Menunggu' : tab === 'Approved' ? 'Disetujui' : 'Ditolak'}
                </button>
              ))}
            </div>

            {categoryFilter !== 'INSTANSI' && (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pembayaran Personal:</span>
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setPaymentStatusFilter('ALL')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      paymentStatusFilter === 'ALL' ? 'bg-slate-100 text-slate-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('UNPAID')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      paymentStatusFilter === 'UNPAID' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Belum Lunas
                  </button>
                  <button
                    onClick={() => setPaymentStatusFilter('PAID')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      paymentStatusFilter === 'PAID' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-500'
                    }`}
                  >
                    Lunas & Aktif
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* LIST CONTAINER */}
        <div className="overflow-x-auto">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">Tidak Ada Data Pendaftaran Sesuai Filter</p>
                <p className="text-xs text-slate-400">Silakan sesuaikan filter kategori, status, atau pencarian Anda.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-4 px-6">Tipe & Identitas Pendaftar</th>
                  <th className="py-4 px-6">Tagihan & Invoice</th>
                  <th className="py-4 px-6">Kontak WA / Email</th>
                  <th className="py-4 px-6">Tanggal Pengajuan</th>
                  <th className="py-4 px-6 text-center">Status Pembayaran / Akun</th>
                  <th className="py-4 px-6 text-right">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredList.map(reg => {
                  const isPersonal = reg.type === 'personal';
                  const isPaid = isPersonal ? (reg.paymentStatus === 'PAID' || reg.status === 'Approved') : (reg.status === 'Approved');

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
                            {isPersonal ? 'PERSONAL MANDIRI' : (reg.schoolType || 'INSTANSI')}
                          </span>
                        </div>
                        {isPersonal ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                            <span>ID Peserta:</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                              {reg.personalStudentId || '-'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[11px] leading-relaxed max-w-xs truncate" title={reg.address}>
                            {reg.address || 'Alamat instansi'}
                          </div>
                        )}
                      </td>

                      {/* INVOICE & AMOUNT */}
                      <td className="py-4 px-6 space-y-1">
                        {isPersonal ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono font-bold text-slate-800">{reg.invoiceNumber || 'INV/2026/PESERTA'}</span>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-600 font-mono">
                              Rp {(reg.amount || 75000).toLocaleString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold font-mono text-slate-800">{reg.estimatedStudents || '-'}</span> Siswa
                            <p className="text-[10px] text-slate-400">Skema Lembaga/Sekolah</p>
                          </div>
                        )}
                      </td>

                      {/* CONTACT */}
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{reg.adminEmail}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{PsychometricStore.formatIndonesianWhatsAppNumber(reg.adminPhone || '')}</span>
                        </div>
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(reg.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6 text-center">
                        {isPersonal ? (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              isPaid 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                            }`}>
                              {isPaid ? 'LUNAS (AKTIF)' : 'BELUM LUNAS'}
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            reg.status === 'Pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            'bg-rose-100 text-rose-800 border-rose-200'
                          }`}>
                            {reg.status === 'Pending' ? 'Menunggu' : reg.status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {isPersonal ? (
                          <>
                            {!isPaid && (
                              <button
                                onClick={() => handleVerifyPersonalPayment(reg)}
                                title="Verifikasi Pembayaran Lunas & Buka Kunci Akun"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verifikasi Lunas
                              </button>
                            )}

                            {isPaid ? (
                              <button
                                onClick={() => openWhatsAppActiveNotification(reg)}
                                title="Kirim WA Notifikasi Akun Aktif (Indonesia)"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all border border-emerald-200 cursor-pointer inline-flex items-center"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openWhatsAppInvoiceReminder(reg)}
                                title="Kirim WA Pengingat Tagihan & No. Rekening"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all border border-amber-200 cursor-pointer inline-flex items-center"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {reg.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveInstansi(reg)}
                                  title="Setujui Instansi Sekolah"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all border border-emerald-200 cursor-pointer inline-flex items-center"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(reg.id)}
                                  title="Tolak Pendaftaran"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 cursor-pointer inline-flex items-center"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(reg.id)}
                          title="Hapus Data Pendaftaran"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-all cursor-pointer inline-flex items-center"
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

      {/* POPUP MODAL SUKSES VERIFIKASI / PERSETUJUAN */}
      {successModal && successModal.show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl max-w-md w-full space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-sm animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{successModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {successModal.type === 'personal'
                  ? `Pembayaran pendaftaran mandiri untuk peserta ${successModal.name} telah diverifikasi. Akun sekarang aktif dan siap mengikuti ujian.`
                  : `Akun administrator utama untuk instansi ${successModal.name} telah berhasil dibuat di sistem.`}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              {successModal.type === 'personal' && successModal.invoiceNumber && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
                  <span className="text-slate-500 font-medium">No. Invoice:</span>
                  <span className="font-mono font-bold text-slate-800">{successModal.invoiceNumber}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {successModal.type === 'personal' ? 'ID Peserta / NIM' : 'Nama Pengguna (Username)'}
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
              {successModal.type === 'personal' && (
                <button
                  onClick={() => {
                    const cleanPhone = PsychometricStore.formatIndonesianWhatsAppNumber(successModal.phone || '');
                    const message = `Halo ${successModal.name},\n\nPembayaran pendaftaran Tes Minat Bakat Psikometri Anda dengan No. Invoice *${successModal.invoiceNumber}* telah *DIVERIFIKASI LUNAS* oleh Admin.\n\nAkun Anda telah *AKTIF*:\n• *ID Peserta:* ${successModal.generatedUser}\n• *Status:* Lunas & Siap Ujian\n\nSilakan langsung login ke platform CBT untuk memulai asesmen minat bakat Anda. Semoga sukses!\n\n_Admin CBT Psikometri Indonesia_`;
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  Kirim Notifikasi Akun Aktif via WhatsApp
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              )}

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

