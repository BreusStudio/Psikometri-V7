'use client';

import React from 'react';
import { User, Building, Building2, AlertCircle } from 'lucide-react';
import { Package } from '../../../lib/mockData';

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
  formError: string | null;
  clientCategory: 'personal' | 'school' | 'government' | 'corporate';
  setClientCategory: (cat: 'personal' | 'school' | 'government' | 'corporate') => void;
  clientName: string;
  setClientName: (name: string) => void;
  clientContact: string;
  setClientContact: (contact: string) => void;
  selectedPackageId: string;
  packages: Package[];
  handlePackageChange: (pkgId: string) => void;
  customPrice: number;
  setCustomPrice: (price: number) => void;
  customQuota: number;
  setCustomQuota: (quota: number) => void;
  pricePerAccount: number;
  setPricePerAccount: (ppa: number) => void;
  discountPercentage: number;
  selectedTests: string[];
  handleToggleTest: (test: string) => void;
  availableTestTypes?: { id: string; label: string }[];
  paymentPlatform: 'TikTok' | 'Shopee' | 'QRIS' | 'Manual';
  setPaymentPlatform: (plat: 'TikTok' | 'Shopee' | 'QRIS' | 'Manual') => void;
  handleCreateManualSubscription: (e: React.FormEvent) => void;
  referrals: any[];
  selectedReferral: string;
  setSelectedReferral: (code: string) => void;
}

export default function AddSubscriptionModal({
  isOpen,
  onClose,
  isSuperAdmin,
  formError,
  clientCategory,
  setClientCategory,
  clientName,
  setClientName,
  clientContact,
  setClientContact,
  selectedPackageId,
  packages,
  handlePackageChange,
  customPrice,
  setCustomPrice,
  customQuota,
  setCustomQuota,
  pricePerAccount,
  setPricePerAccount,
  discountPercentage,
  selectedTests,
  handleToggleTest,
  availableTestTypes,
  paymentPlatform,
  setPaymentPlatform,
  handleCreateManualSubscription,
  referrals,
  selectedReferral,
  setSelectedReferral,
}: AddSubscriptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end items-stretch animate-fade-in">
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
        
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-mono text-indigo-300">
              {isSuperAdmin ? 'Daftarkan Klien Manual' : 'Pengajuan Tambah Kuota Ujian Sekolah'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isSuperAdmin 
                ? 'Terbitkan voucher berkuota & kredensial login tanpa sistem promo diskon.' 
                : 'Pilih paket dan kuota tambahan yang dibutuhkan oleh instansi/sekolah Anda.'}
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

        {/* FORM CONTAINER */}
        <form onSubmit={handleCreateManualSubscription} className="flex-1 p-6 space-y-5 text-xs text-slate-700">
          
          {formError && (
            <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2 text-[11px] text-rose-800 leading-normal font-semibold animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* CLIENT CATEGORY */}
          <div>
            <label className="block font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Kategori Klien</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setClientCategory('personal');
                  setCustomQuota(1);
                }}
                className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-between gap-1 cursor-pointer transition-all ${clientCategory === 'personal' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4 text-blue-500" />
                <span className="text-[10px]">Personal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientCategory('school');
                  setCustomQuota(50);
                }}
                className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-between gap-1 cursor-pointer transition-all ${clientCategory === 'school' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Building className="w-4 h-4 text-purple-500" />
                <span className="text-[10px]">Instansi</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientCategory('government');
                  setCustomQuota(150);
                }}
                className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-between gap-1 cursor-pointer transition-all ${clientCategory === 'government' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4 h-4 text-rose-500" />
                <span className="text-[10px]">Pemerintah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientCategory('corporate');
                  setCustomQuota(100);
                }}
                className={`p-2 rounded-xl border text-center font-bold flex flex-col items-center justify-between gap-1 cursor-pointer transition-all ${clientCategory === 'corporate' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4 h-4 text-amber-500" />
                <span className="text-[10px]">Perusahaan</span>
              </button>
            </div>
          </div>

          {/* BUYER / CLIENT DETAILS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider">Nama Klien / Sekolah</label>
              <input
                type="text"
                required
                placeholder="Contoh: SMA Kartika Pratama"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider">No. WhatsApp Klien</label>
              <input
                type="text"
                required
                placeholder="Contoh: 0812XXXXXXXX"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* PACKAGE CONFIGURATION SELECTION */}
          <div className="border-t border-b py-4 border-slate-100 space-y-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Pilih Basis Paket</label>
              <select
                value={selectedPackageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Harga per Akun (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={pricePerAccount}
                  onChange={(e) => setPricePerAccount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  placeholder="Contoh: 25000"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Kuota Akun / Peserta</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={customQuota}
                  onChange={(e) => setCustomQuota(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
            </div>

            {/* PROGRESSIVE CALCULATION SUMMARY BANNER */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2.5">
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span>Harga Kotor (Base):</span>
                <span className="font-mono">Rp {(pricePerAccount * customQuota).toLocaleString('id-ID')}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  Potongan Volume:
                  {discountPercentage > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                      Semakin Banyak Semakin Hemat
                    </span>
                  )}
                </span>
                <span className="font-mono text-emerald-600 font-bold">
                  -{discountPercentage}%
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Nilai Transaksi (Akhir):</span>
                <div className="text-right">
                  <div className="font-mono text-base font-black text-indigo-600">
                    Rp {customPrice.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">Terhitung Otomatis</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Custom Nilai Transaksi Manual (Optional)</label>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-semibold"
                placeholder="Overwrite nilai akhir manual jika ada negosiasi khusus"
              />
            </div>
          </div>

          {/* TESTS ASSIGNED CHECKBOXES */}
          <div>
            <label className="block font-bold text-slate-600 mb-2 uppercase tracking-wider">Sub-Tes Psikometri Yang Aktif</label>
            <div className="flex flex-wrap gap-2.5">
              {(availableTestTypes || [
                { id: 'IQ', label: 'IQ' },
                { id: 'EQ', label: 'EQ' },
                { id: 'Holland', label: 'Holland' },
                { id: 'Kepribadian', label: 'Kepribadian' },
                { id: 'Validitas', label: 'Validitas' },
              ]).map(test => {
                const isChecked = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    type="button"
                    onClick={() => handleToggleTest(test.id)}
                    className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {isChecked ? '✓' : '+'} {test.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PAYMENT CHANNEL & REFERRAL MITRA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Saluran Pembayaran</label>
              <select
                value={paymentPlatform}
                onChange={(e: any) => setPaymentPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="Manual">Manual Bank Transfer</option>
                <option value="QRIS">Scan QRIS Otomatis</option>
                <option value="TikTok">TikTok Marketplace</option>
                <option value="Shopee">Shopee Marketplace</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1 uppercase tracking-wider text-[10px]">Kode Referral (Optional)</label>
              <select
                value={selectedReferral}
                onChange={(e) => setSelectedReferral(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="">-- Tanpa Referral --</option>
                {referrals.map(ref => (
                  <option key={ref.code} value={ref.code}>
                    {ref.code} ({ref.ownerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

        </form>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-50 border text-slate-600 font-bold py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleCreateManualSubscription}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            Konfirmasi & Terbitkan
          </button>
        </div>

      </div>
    </div>
  );
}
