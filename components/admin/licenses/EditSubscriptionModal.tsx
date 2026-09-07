'use client';

import React, { useState, useEffect } from 'react';
import { User, Building, Building2, AlertCircle, Save, ShieldCheck, Check } from 'lucide-react';

export interface SubscriptionEditData {
  voucherCode: string;
  purchaseId?: string;
  buyerName: string;
  buyerContact: string;
  packageName: string;
  category: 'personal' | 'school' | 'government' | 'corporate';
  totalQuota: number;
  selectedTests: string[];
  pricePaid: number;
  platform: 'TikTok' | 'Shopee' | 'QRIS' | 'Manual';
  voucherActive: boolean;
}

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SubscriptionEditData | null;
  availableTestTypes?: { id: string; label: string }[];
  onSave: (updatedData: SubscriptionEditData) => void;
}

export default function EditSubscriptionModal({
  isOpen,
  onClose,
  data,
  availableTestTypes = [
    { id: 'IQ', label: 'Potensi Kognitif (IQ)' },
    { id: 'EQ', label: 'Regulasi Emosional (EQ)' },
    { id: 'Holland', label: 'Minat Karir Holland (RIASEC)' },
    { id: 'Kepribadian', label: 'Kepribadian (Big Five & Virtues)' },
    { id: 'Validitas', label: 'Validitas & Konsistensi' },
  ],
  onSave,
}: EditSubscriptionModalProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [packageName, setPackageName] = useState('');
  const [category, setCategory] = useState<'personal' | 'school' | 'government' | 'corporate'>('school');
  const [totalQuota, setTotalQuota] = useState<number>(50);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [pricePaid, setPricePaid] = useState<number>(0);
  const [platform, setPlatform] = useState<'TikTok' | 'Shopee' | 'QRIS' | 'Manual'>('Manual');
  const [voucherActive, setVoucherActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setBuyerName(data.buyerName || '');
      setBuyerContact(data.buyerContact || '');
      setPackageName(data.packageName || '');
      setCategory(data.category || 'school');
      setTotalQuota(data.totalQuota || 1);
      setSelectedTests(data.selectedTests || []);
      setPricePaid(data.pricePaid || 0);
      setPlatform(data.platform || 'Manual');
      setVoucherActive(data.voucherActive ?? true);
      setFormError(null);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const handleToggleTest = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(t => t !== testId) : [...prev, testId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buyerName.trim()) {
      setFormError('Nama Klien / Pembeli tidak boleh kosong.');
      return;
    }
    if (!buyerContact.trim()) {
      setFormError('Kontak WhatsApp / Email tidak boleh kosong.');
      return;
    }
    if (selectedTests.length === 0) {
      setFormError('Pilih minimal satu sub-tes psikometri.');
      return;
    }

    onSave({
      voucherCode: data.voucherCode,
      purchaseId: data.purchaseId,
      buyerName: buyerName.trim(),
      buyerContact: buyerContact.trim(),
      packageName: packageName.trim() || 'Paket Custom',
      category,
      totalQuota: Math.max(1, totalQuota),
      selectedTests,
      pricePaid: Math.max(0, pricePaid),
      platform,
      voucherActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end items-stretch animate-fade-in">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                Kode: {data.voucherCode}
              </span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono text-indigo-300 mt-1">
              Edit Data Klien & Lisensi Ujian
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Perbarui identitas klien, kuota peserta, status voucher, dan modul sub-tes aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 text-xs text-slate-700">
          
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* KATEGORI KLIEN */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">1. Kategori Klien</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCategory('personal')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  category === 'personal'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-[10px]">Personal</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('school')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  category === 'school'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building className="w-4 h-4 text-purple-600" />
                <span className="text-[10px]">Instansi / Sekolah</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('government')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  category === 'government'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 text-rose-600" />
                <span className="text-[10px]">Dinas / Pemda</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('corporate')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  category === 'corporate'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <span className="text-[10px]">Perusahaan</span>
              </button>
            </div>
          </div>

          {/* INFORMASI PEMBELI */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Nama Klien / Instansi</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: SMA Negeri 1 Jakarta / Dr. Ahmad"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Kontak WhatsApp / No HP</label>
              <input
                type="text"
                required
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Nama Paket / Lisensi</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="Contoh: Paket Kuota Sekolah High School"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* TOTAL KUOTA & HARGA */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Jumlah Kuota Akun</label>
              <input
                type="number"
                min={1}
                value={totalQuota}
                onChange={(e) => setTotalQuota(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-bold text-xs text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Nilai Pembayaran (Rp)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={pricePaid}
                onChange={(e) => setPricePaid(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-bold text-xs text-emerald-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* STATUS VOUCHER & PLATFORM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Platform Pembayaran</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Manual">Manual Transfer</option>
                <option value="Shopee">Shopee Store</option>
                <option value="TikTok">TikTok Shop</option>
                <option value="QRIS">QRIS Instan</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Status Voucher / Akses</label>
              <button
                type="button"
                onClick={() => setVoucherActive(!voucherActive)}
                className={`w-full py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  voucherActive
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-rose-50 border-rose-300 text-rose-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {voucherActive ? 'Voucher AKTIF' : 'Voucher NON-AKTIF'}
              </button>
            </div>
          </div>

          {/* SUB-TES AKTIF */}
          <div className="pt-2 border-t border-slate-200/80">
            <label className="block font-bold text-slate-800 mb-2">Modul Sub-Tes Psikometri Aktif</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {availableTestTypes.map((tt) => {
                const isChecked = selectedTests.includes(tt.id);
                return (
                  <label
                    key={tt.id}
                    onClick={() => handleToggleTest(tt.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tt.label}</span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] ${
                      isChecked ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-transparent'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
