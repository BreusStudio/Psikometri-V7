'use client';

import React, { useState } from 'react';
import { Plus, Users, Copy, Trash2 } from 'lucide-react';
import { PsychometricStore, ReferralCode } from '../../../lib/mockData';
import { useToast } from '@/components/shared/ToastContext';

interface ReferralsSubTabProps {
  store: PsychometricStore;
  referrals: ReferralCode[];
  onRefresh: () => void;
}

export default function ReferralsSubTab({
  store,
  referrals,
  onRefresh
}: ReferralsSubTabProps) {
  const { success: showSuccessToast } = useToast();
  const [newRCode, setNewRCode] = useState('');
  const [newROwner, setNewROwner] = useState('');
  const [newRBank, setNewRBank] = useState('');

  // Create Referral
  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRCode.trim() || !newROwner.trim() || !newRBank.trim()) return;

    const code = newRCode.trim().toUpperCase();
    const r: ReferralCode = {
      code,
      ownerName: newROwner.trim(),
      commissionRate: 0.3, // 30% flat
      totalEarned: 0,
      bankInfo: newRBank.trim()
    };
    store.saveReferral(r);
    showSuccessToast(`Berhasil membuat Kode Referral ${code}!`);
    setNewRCode('');
    setNewROwner('');
    setNewRBank('');
    onRefresh();
  };

  // Delete Referral
  const handleDeleteReferral = (code: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Kode Referral ${code}?`)) {
      store.deleteReferral(code);
      showSuccessToast(`Kode Referral ${code} berhasil dihapus.`);
      onRefresh();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccessToast(`Kode Referral "${code}" berhasil disalin ke clipboard.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ADD REFERRAL FORM */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
          <Plus className="w-4 h-4 text-indigo-600" /> Buat Kode Referral Mitra
        </h3>
        <form onSubmit={handleAddReferral} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">Kode Referral</label>
            <input
              type="text"
              required
              placeholder="Contoh: REF-BUDI30"
              value={newRCode}
              onChange={(e) => setNewRCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Nama Pemilik / Mitra</label>
            <input
              type="text"
              required
              placeholder="Nama lengkap, jabatan, instansi"
              value={newROwner}
              onChange={(e) => setNewROwner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Rekening Bank / E-Wallet Pembayaran</label>
            <textarea
              required
              placeholder="Nama Bank, No Rekening, Atas Nama"
              value={newRBank}
              onChange={(e) => setNewRBank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20"
            />
          </div>

          <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-[10px] leading-relaxed border border-amber-200">
            Setiap transaksi yang menggunakan kode referral ini akan menghasilkan <strong>komisi 30%</strong> untuk pemilik kode ini secara otomatis.
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow transition-colors cursor-pointer"
          >
            Buat Kode Referral
          </button>
        </form>
      </div>

      {/* REFERRALS LIST */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
          <Users className="w-4 h-4 text-emerald-500" /> Daftar Mitra Referral (30% Komisi)
        </h3>
        
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Mitra</th>
                <th className="p-3">Bank Transfer</th>
                <th className="p-3">Komisi Flat</th>
                <th className="p-3">Total Diperoleh</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map(r => (
                <tr key={r.code} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-bold text-slate-800">
                    <span className="flex items-center gap-1">
                      {r.code}
                      <button onClick={() => handleCopyCode(r.code)} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-700">{r.ownerName}</td>
                  <td className="p-3 text-slate-500">{r.bankInfo}</td>
                  <td className="p-3 font-mono text-emerald-600 font-bold">{(r.commissionRate * 100)}%</td>
                  <td className="p-3 font-mono font-bold text-slate-800">Rp {r.totalEarned.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteReferral(r.code)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="Hapus Mitra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
