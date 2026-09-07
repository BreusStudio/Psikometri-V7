'use client';

import React, { useState } from 'react';
import { Plus, Ticket, Copy, Users, Trash2, Sparkles, Download, Edit3, Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PsychometricStore, Voucher } from '../../../lib/mockData';
import { useToast } from '@/components/shared/ToastContext';

interface VouchersSubTabProps {
  store: PsychometricStore;
  vouchers: Voucher[];
  onRefresh: () => void;
  sendSimulatedWhatsApp: (phone: string, title: string, content: string, voucherCode?: string) => void;
  generateWhatsAppText: (v: Voucher, buyerName?: string, pkgName?: string, platform?: string) => string;
}

export default function VouchersSubTab({
  store,
  vouchers,
  onRefresh,
  sendSimulatedWhatsApp,
  generateWhatsAppText
}: VouchersSubTabProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Dynamic Test Types from DB Store
  const dynamicTestOptions = React.useMemo(() => {
    const typesFromStore = store.getTestTypes();
    if (typesFromStore && typesFromStore.length > 0) {
      return typesFromStore.map(t => ({ id: t.name || t.id, label: t.name }));
    }
    return [
      { id: 'IQ', label: 'Potensi Kognitif (IQ)' },
      { id: 'EQ', label: 'Regulasi Emosional (EQ)' },
      { id: 'Holland', label: 'Minat Karir Holland (RIASEC)' },
      { id: 'Kepribadian', label: 'Kepribadian (Big Five & Virtues)' },
      { id: 'Validitas', label: 'Validitas & Konsistensi' },
    ];
  }, [store]);

  // States for Vouchers
  const [newVCode, setNewVCode] = useState('');
  const [newVType, setNewVType] = useState<'percent' | 'fixed'>('percent');
  const [newVValue, setNewVValue] = useState(0);
  const [newVTestCount, setNewVTestCount] = useState(1);
  const [newVAllowedTests, setNewVAllowedTests] = useState<string[]>(() => dynamicTestOptions.map(t => t.id));
  const [expandedVoucherCode, setExpandedVoucherCode] = useState<string | null>(null);

  // Solusi 1: Modal Edit Sub-Tes untuk Voucher Eksisting
  const [editingVoucherCode, setEditingVoucherCode] = useState<string | null>(null);
  const [editingAllowedTests, setEditingAllowedTests] = useState<string[]>([]);

  // 1. Create Voucher (with Validation Guard Solusi 3)
  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVCode.trim()) return;
    
    // Solusi 3: Validation Guard
    if (newVAllowedTests.length === 0) {
      showErrorToast("Gagal Membuat Voucher: Minimal 1 jenis sub-tes wajib dipilih!", "Akses Ditolak");
      return;
    }

    const code = newVCode.trim().toUpperCase();
    const v: Voucher = {
      code,
      type: newVType,
      value: newVValue,
      active: true,
      usageCount: 0,
      testCount: newVTestCount,
      testTypes: newVAllowedTests
    };
    store.saveVoucher(v);

    // Save and refresh local list
    const updatedVouchers = store.getVouchers();
    const generatedVoucher = updatedVouchers.find(x => x.code.toUpperCase() === code);

    if (generatedVoucher) {
      const waContent = generateWhatsAppText(generatedVoucher, "Administrator Sekolah", "Voucher Baru Tergenerate", "Manual Admin");
      sendSimulatedWhatsApp(
        "0812-3456-7890",
        `WhatsApp - Voucher Baru Terbuat`,
        waContent,
        code
      );
    }

    setNewVCode('');
    setNewVValue(0);
    setNewVTestCount(1);
    setNewVAllowedTests(dynamicTestOptions.map(t => t.id));
    showSuccessToast(`Voucher ${code} berhasil dibuat dengan ${newVAllowedTests.length} sub-tes aktif.`);
    onRefresh();
  };

  // Solusi 1: Handle Save Edit Sub-Tes Voucher
  const handleSaveEditedSubTests = (voucher: Voucher) => {
    if (editingAllowedTests.length === 0) {
      showErrorToast("Minimal 1 sub-tes wajib dipilih untuk voucher!", "Gagal Menyimpan");
      return;
    }

    const updatedV: Voucher = {
      ...voucher,
      testTypes: editingAllowedTests
    };

    store.saveVoucher(updatedV);
    setEditingVoucherCode(null);
    showSuccessToast(`Hak akses sub-tes voucher "${voucher.code}" & seluruh akun siswa telah diperbarui!`);
    onRefresh();
  };

  // 2. Toggle / Delete Voucher
  const handleDeleteVoucher = (code: string) => {
    store.deleteVoucher(code);
    onRefresh();
  };

  const handleToggleVoucher = (v: Voucher) => {
    store.saveVoucher({ ...v, active: !v.active });
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ADD VOUCHER FORM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
          <Plus className="w-4 h-4 text-indigo-600" /> Buat Kode Voucher Baru
        </h3>
        <form onSubmit={handleAddVoucher} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Kode Voucher</label>
            <input
              type="text"
              required
              placeholder="Contoh: MERDEKA77"
              value={newVCode}
              onChange={(e) => setNewVCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Kapasitas Pengguna (Kuota Akun)</label>
            <input
              type="number"
              required
              min={1}
              placeholder="Misal: 1 untuk Personal, 50 untuk Kelas/Sekolah"
              value={newVTestCount}
              onChange={(e) => setNewVTestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">Sistem akan mengenerate akun login otomatis sebanyak kuota ini.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-slate-600">Jenis Sub-Tes (Checklist)</label>
              <div className="flex gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setNewVAllowedTests(dynamicTestOptions.map(t => t.id))}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Pilih Semua (SMK)
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setNewVAllowedTests([])}
                  className="text-rose-500 hover:text-rose-700 font-semibold underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
              {dynamicTestOptions.map(test => (
                <label key={test.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={newVAllowedTests.includes(test.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewVAllowedTests([...newVAllowedTests, test.id]);
                      } else {
                        setNewVAllowedTests(newVAllowedTests.filter(t => t !== test.id));
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                  />
                  <span>{test.label}</span>
                </label>
              ))}
            </div>

            {newVAllowedTests.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2 rounded-lg flex items-start gap-1.5 mt-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Peringatan:</strong> Mengosongkan pilihan sub-tes akan menyebabkan soal siswa bertanda <em>&quot;Luar Paket&quot;</em>.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Jenis Potongan Harga (Opsional)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewVType('percent')}
                className={`py-2 rounded-lg font-bold border transition-colors ${newVType === 'percent' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              >
                Persentase (%)
              </button>
              <button
                type="button"
                onClick={() => setNewVType('fixed')}
                className={`py-2 rounded-lg font-bold border transition-colors ${newVType === 'fixed' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              >
                Nominal (Rp)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">
              {newVType === 'percent' ? 'Nilai Persen (%)' : 'Nilai Nominal Rupiah'}
            </label>
            <input
              type="number"
              required
              placeholder={newVType === 'percent' ? 'Misal: 50 untuk 50%' : 'Misal: 50000 untuk Rp 50.000'}
              value={newVValue || ''}
              onChange={(e) => setNewVValue(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow transition-colors cursor-pointer"
          >
            Buat Kode Voucher & Akun Login
          </button>
        </form>
      </div>

      {/* VOUCHERS LIST */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
          <Ticket className="w-4 h-4 text-emerald-500" /> Daftar Kode Voucher CBT
        </h3>
        
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3">Kode Voucher</th>
                <th className="p-3">Tipe Potongan</th>
                <th className="p-3">Kapasitas</th>
                <th className="p-3">Sub-Tes Aktif</th>
                <th className="p-3">Total Dipakai</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vouchers.map(v => {
                const isExpanded = expandedVoucherCode === v.code;
                const isGroup = (v.testCount || 1) > 1;
                return (
                  <React.Fragment key={v.code}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            {v.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.code);
                              showSuccessToast(`Kode voucher "${v.code}" disalin!`);
                            }}
                            className="text-slate-400 hover:text-indigo-600"
                            title="Salin Kode Voucher"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 uppercase">
                        {v.type === 'percent' ? (
                          <span className="text-purple-600 font-semibold">Persen ({v.value}%)</span>
                        ) : v.type === 'fixed' && v.value > 0 ? (
                          <span className="text-blue-600 font-semibold">Nominal (Rp {v.value.toLocaleString('id-ID')})</span>
                        ) : (
                          <span className="text-slate-500 italic">Redeem Gratis</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-semibold">
                        {v.testCount || 1} Akun
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(v.testTypes || ['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']).map(t => (
                            <span key={t} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md text-[9px] font-medium font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono">{v.usageCount} kali</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleVoucher(v)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${v.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}
                        >
                          {v.active ? 'Aktif (On)' : 'Non-Aktif (Off)'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (editingVoucherCode === v.code) {
                                setEditingVoucherCode(null);
                              } else {
                                setEditingVoucherCode(v.code);
                                setEditingAllowedTests(v.testTypes && v.testTypes.length > 0 ? [...v.testTypes] : dynamicTestOptions.map(t => t.id));
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 font-semibold text-[10px] cursor-pointer ${
                              editingVoucherCode === v.code ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                            title="Edit Sub-Tes Voucher & Sync ke Akun Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            {editingVoucherCode === v.code ? 'Tutup' : 'Edit Sub-Tes'}
                          </button>

                          <button
                            onClick={() => setExpandedVoucherCode(isExpanded ? null : v.code)}
                            className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 font-semibold text-[10px] cursor-pointer ${
                              isExpanded ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                            }`}
                            title="Lihat Akun Login"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {isExpanded ? 'Tutup Akun' : 'Lihat Akun'}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteVoucher(v.code)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* EDIT SUB-TESTS ROW */}
                    {editingVoucherCode === v.code && (
                      <tr className="bg-amber-50/40 border-b border-amber-200">
                        <td colSpan={7} className="p-4">
                          <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3 max-w-2xl text-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                                <span>Update Hak Akses Sub-Tes: <span className="font-mono text-indigo-600">{v.code}</span></span>
                              </div>
                              <button 
                                onClick={() => setEditingVoucherCode(null)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-500">
                              Perubahan jenis sub-tes di bawah ini akan <strong>secara otomatis diperbarui ke seluruh akun siswa</strong> yang terdaftar menggunakan voucher ini.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              {dynamicTestOptions.map(test => {
                                const isChecked = editingAllowedTests.includes(test.id);
                                return (
                                  <label key={test.id} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 hover:text-slate-900">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingAllowedTests([...editingAllowedTests, test.id]);
                                        } else {
                                          setEditingAllowedTests(editingAllowedTests.filter(t => t !== test.id));
                                        }
                                      }}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 border-slate-300"
                                    />
                                    <span>{test.label}</span>
                                  </label>
                                );
                              })}
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingVoucherCode(null)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedSubTests(v)}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Simpan & Sync ke Siswa
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* EXPANDED ACCOUNTS ROW */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="p-4 border-t border-b border-slate-200">
                          <div className="space-y-4 max-w-4xl mx-auto">
                            <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
                              <div>
                                <h4 className="text-xs font-bold flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                  Kredensial Login Tergenerate Otomatis
                                </h4>
                                <p className="text-[10px] text-slate-400">Silakan gunakan akun di bawah ini untuk login langsung tanpa daftar.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    let copyText = `AKUN LOGIN VOUCHER: ${v.code}\n`;
                                    if (isGroup) {
                                      copyText += `Admin: ${v.adminUsername} | Pass: ${v.adminPassword}\n`;
                                    }
                                    (v.generatedAccounts || []).forEach(acc => {
                                      copyText += `User: ${acc.username} | Pass: ${acc.password}\n`;
                                    });
                                    navigator.clipboard.writeText(copyText);
                                    showSuccessToast("Seluruh akun disalin ke clipboard!");
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" /> Salin Semua Akun
                                </button>
                                <button
                                  onClick={() => {
                                    let text = `DAFTAR AKUN CBT PSIKOMETRIK - VOUCHER: ${v.code}\n`;
                                    text += `Kapasitas: ${v.testCount || 1} Siswa\n`;
                                    text += `Sub-Tes Aktif: ${(v.testTypes || []).join(', ')}\n\n`;
                                    
                                    if (isGroup) {
                                      text += `AKUN KOORDINATOR / GURU BK:\n`;
                                      text += `Username Admin: ${v.adminUsername}\n`;
                                      text += `Password Admin: ${v.adminPassword}\n\n`;
                                    }
                                    
                                    text += `AKUN LOGIN SISWA:\n`;
                                    (v.generatedAccounts || []).forEach((acc, index) => {
                                      text += `[Siswa #${index + 1}] Username: ${acc.username} | Password: ${acc.password}\n`;
                                    });
                                    
                                    const blob = new Blob([text], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `AKUN_CBT_${v.code}.txt`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 border border-slate-700 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" /> Download Akun (.txt)
                                </button>
                              </div>
                            </div>

                            {isGroup && (
                              <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[9px] uppercase">Akun Administrator BK</span>
                                  <span className="text-[10px] text-slate-500 font-medium">Bisa login di portal Guru BK untuk mengunduh laporan & memantau ujian kelas.</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-50 p-2 rounded-lg border flex justify-between items-center">
                                    <span className="text-slate-500 font-semibold font-mono">Username:</span>
                                    <span className="font-bold font-mono text-slate-800">{v.adminUsername}</span>
                                  </div>
                                  <div className="bg-slate-50 p-2 rounded-lg border flex justify-between items-center">
                                    <span className="text-slate-500 font-semibold font-mono">Password:</span>
                                    <span className="font-bold font-mono text-slate-800">{v.adminPassword}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                              <div className="bg-slate-50 px-3.5 py-2 border-b font-bold text-slate-700 text-[10px] uppercase flex justify-between items-center">
                                <span>Akun Login CBT ({v.generatedAccounts?.length || 0} Akun)</span>
                                <span className="text-indigo-600 font-medium lowercase">Bagikan kredensial ini kepada masing-masing peserta ujian</span>
                              </div>
                              <div className="divide-y max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700">
                                {(v.generatedAccounts || []).map((acc, idx) => (
                                  <div key={acc.username} className="p-2 px-3.5 flex justify-between items-center hover:bg-slate-50/50">
                                    <div>
                                      <span className="text-slate-400 mr-2">User #{idx+1}</span>
                                      <span>Username: <strong className="text-slate-900">{acc.username}</strong></span>
                                      <span className="mx-2">|</span>
                                      <span>Password: <strong className="text-slate-900">{acc.password}</strong></span>
                                    </div>
                                    <div>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(`Username: ${acc.username} | Password: ${acc.password}`);
                                          showSuccessToast(`Akun siswa #${idx+1} disalin!`);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                                      >
                                        Salin
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
