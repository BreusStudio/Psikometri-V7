'use client';

import React, { useState } from 'react';
import { ShoppingBag, Check, DollarSign, CheckCircle, Plus } from 'lucide-react';
import { PsychometricStore, Voucher, Purchase, ReferralCode, Commission, Package } from '../../../lib/mockData';
import { useToast } from '@/components/shared/ToastContext';

interface OverviewSubTabProps {
  store: PsychometricStore;
  packages: Package[];
  vouchers: Voucher[];
  referrals: ReferralCode[];
  commissions: Commission[];
  onRefresh: () => void;
  sendSimulatedWhatsApp: (phone: string, title: string, content: string, voucherCode?: string) => void;
  generateWhatsAppText: (v: Voucher, buyerName?: string, pkgName?: string, platform?: string) => string;
}

export default function OverviewSubTab({
  store,
  packages,
  vouchers,
  referrals,
  commissions,
  onRefresh,
  sendSimulatedWhatsApp,
  generateWhatsAppText
}: OverviewSubTabProps) {
  const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useToast();

  // Simulation form states
  const [simBuyerName, setSimBuyerName] = useState('');
  const [simBuyerEmail, setSimBuyerEmail] = useState('');
  const [simPlatform, setSimPlatform] = useState<'TikTok' | 'Shopee' | 'QRIS' | 'Manual'>('TikTok');
  const [simPackage, setSimPackage] = useState<string>(packages[0]?.id || '');
  const [simVoucher, setSimVoucher] = useState('');
  const [simReferral, setSimReferral] = useState('');
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // Manual Transfer state
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [receiptRef, setReceiptRef] = useState('');

  // Run Transaction Simulation (TikTok, Shopee, QRIS)
  const handleSimulatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simBuyerName.trim() || !simBuyerEmail.trim()) {
      showWarningToast('Nama dan No. WhatsApp pembeli harus diisi.');
      return;
    }

    const selectedPkg = packages.find(p => p.id === simPackage || p.name === simPackage);
    if (!selectedPkg) {
      showErrorToast('Paket tidak ditemukan.');
      return;
    }

    const basePrice = selectedPkg.price;
    const addedQuota = selectedPkg.testCount;
    
    // Apply discount voucher
    let finalAmount = basePrice;
    let appliedVoucher: string | null = null;
    if (simVoucher.trim()) {
      const v = vouchers.find(x => x.code.toUpperCase() === simVoucher.trim().toUpperCase() && x.active);
      if (v) {
        appliedVoucher = v.code;
        if (v.type === 'percent') {
          finalAmount = basePrice - (basePrice * (v.value / 100));
        } else {
          finalAmount = Math.max(0, basePrice - v.value);
        }
      } else {
        showWarningToast('Voucher tidak ditemukan atau tidak aktif.');
        return;
      }
    }

    // Apply Referral (flat 30% commission)
    let appliedReferral: string | null = null;
    let commEarned = 0;
    if (simReferral.trim()) {
      const r = referrals.find(x => x.code.toUpperCase() === simReferral.trim().toUpperCase());
      if (r) {
        appliedReferral = r.code;
        commEarned = Math.round(finalAmount * 0.3); // 30% commission
      } else {
        showWarningToast('Kode Referral tidak ditemukan.');
        return;
      }
    }

    const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    const newPurchase: Purchase = {
      id: txId,
      platform: simPlatform,
      packageName: selectedPkg.name,
      buyerName: simBuyerName.trim(),
      buyerEmail: simBuyerEmail.trim(),
      amount: finalAmount,
      voucherUsed: appliedVoucher,
      referralUsed: appliedReferral,
      commissionEarned: commEarned,
      date: new Date().toISOString(),
      status: 'Completed',
      quotaAdded: addedQuota || 0
    };

    store.addPurchase(newPurchase);

    // Look up the auto-generated voucher code in the updated list
    const generatedVCode = `VCHR-${txId.replace('TX-', '').toUpperCase()}`;
    const updatedVouchers = store.getVouchers();
    const autoV = updatedVouchers.find(v => v.code.toUpperCase() === generatedVCode);

    if (autoV) {
      const waContent = generateWhatsAppText(autoV, simBuyerName.trim(), selectedPkg.name, simPlatform);
      sendSimulatedWhatsApp(
        simBuyerEmail.trim(),
        `WhatsApp - Pembelian ${selectedPkg.name}`,
        waContent,
        generatedVCode
      );
    }
    
    setSimBuyerName('');
    setSimBuyerEmail('');
    setSimVoucher('');
    setSimReferral('');
    
    setSimulationStatus(`Sukses! Simulasi pembelian via ${simPlatform} berhasil dicatat. Voucher ${generatedVCode} (+${addedQuota} akun) terbuat dan rincian login dikirim ke WhatsApp simulated inbox.`);
    setTimeout(() => setSimulationStatus(null), 8000);
    onRefresh();
  };

  // Complete Manual Bank Transfer for Referral
  const handleCompleteManualTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;

    store.updateCommissionStatus(selectedCommission.id, 'Paid', receiptRef.trim() || 'Manual transfer');
    setSelectedCommission(null);
    setReceiptRef('');
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* SIMULATION FORM (TIKTOK, SHOPEE, QRIS) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
            <ShoppingBag className="w-4 h-4 text-emerald-500" /> Simulasi Integrasi Toko
          </h3>
          <p className="text-xs text-slate-500 mt-1">Simulasikan pembelian otomatis dari platform Shopee, TikTok, atau scan QRIS. Quota ujian akan ditambahkan secara instan.</p>
        </div>

        {simulationStatus && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold leading-relaxed animate-fade-in flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{simulationStatus}</span>
          </div>
        )}

        <form onSubmit={handleSimulatePurchase} className="space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Nama Pembeli / Sekolah</label>
              <input
                type="text"
                required
                placeholder="Misal: SMK Negeri 5"
                value={simBuyerName}
                onChange={(e) => setSimBuyerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">No. WhatsApp Pembeli</label>
              <input
                type="text"
                required
                placeholder="Contoh: 081234567890"
                value={simBuyerEmail}
                onChange={(e) => setSimBuyerEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Platform Penjualan</label>
              <select
                value={simPlatform}
                onChange={(e: any) => setSimPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Shopee">Shopee Toko</option>
                <option value="TikTok">TikTok Shop</option>
                <option value="QRIS">QRIS Instan</option>
                <option value="Manual">Manual Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Paket Lisensi</label>
              <select
                value={simPackage}
                onChange={(e: any) => setSimPackage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.testCount} Kuota - Rp {p.price.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Gunakan Voucher (Diskon)</label>
              <select
                value={simVoucher}
                onChange={(e) => setSimVoucher(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                <option value="">-- Tanpa Voucher --</option>
                {vouchers.filter(v => v.active).map(v => (
                  <option key={v.code} value={v.code}>
                    {v.code} ({v.type === 'percent' ? `${v.value}% Off` : `Rp ${v.value.toLocaleString()} Off`})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Gunakan Referral Code</label>
              <select
                value={simReferral}
                onChange={(e) => setSimReferral(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              >
                <option value="">-- Tanpa Referral --</option>
                {referrals.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.code} - {r.ownerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-1.5 font-mono text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Harga Normal:</span>
              <span className="font-bold text-slate-800">
                Rp {(() => {
                  const selectedPkg = packages.find(p => p.id === simPackage || p.name === simPackage);
                  return (selectedPkg ? selectedPkg.price : 0).toLocaleString('id-ID');
                })()}
              </span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Potongan Voucher:</span>
              <span>
                {(() => {
                  const selectedPkg = packages.find(p => p.id === simPackage || p.name === simPackage);
                  const base = selectedPkg ? selectedPkg.price : 0;
                  const v = vouchers.find(x => x.code.toUpperCase() === simVoucher.toUpperCase() && x.active);
                  if (!v) return 'Rp 0';
                  const disc = v.type === 'percent' ? (base * v.value) / 100 : v.value;
                  return `- Rp ${disc.toLocaleString('id-ID')}`;
                })()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-slate-800 font-bold">
              <span>Total Bayar:</span>
              <span className="text-emerald-600">
                Rp {(() => {
                  const selectedPkg = packages.find(p => p.id === simPackage || p.name === simPackage);
                  const base = selectedPkg ? selectedPkg.price : 0;
                  const v = vouchers.find(x => x.code.toUpperCase() === simVoucher.toUpperCase() && x.active);
                  const disc = v ? (v.type === 'percent' ? (base * v.value) / 100 : v.value) : 0;
                  return Math.max(0, base - disc).toLocaleString('id-ID');
                })()}
              </span>
            </div>
            <div className="flex justify-between text-amber-600 border-t border-dashed pt-1 mt-1 text-[10px]">
              <span>Estimasi Komisi Mitra (30%):</span>
              <span>
                {(() => {
                  const selectedPkg = packages.find(p => p.id === simPackage || p.name === simPackage);
                  const base = selectedPkg ? selectedPkg.price : 0;
                  const v = vouchers.find(x => x.code.toUpperCase() === simVoucher.toUpperCase() && x.active);
                  const paid = Math.max(0, base - (v ? (v.type === 'percent' ? (base * v.value) / 100 : v.value) : 0));
                  const isRef = referrals.some(r => r.code.toUpperCase() === simReferral.toUpperCase());
                  return isRef ? `Rp ${Math.round(paid * 0.3).toLocaleString('id-ID')}` : 'Rp 0';
                })()}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <Check className="w-4 h-4" /> Kirim Simulasi Instan & Tambah Kuota
          </button>
        </form>
      </div>

      {/* COMMISSIONS LIST & MANUAL AUDITING */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
            <DollarSign className="w-4 h-4 text-amber-500" /> Audit Pembayaran Komisi Manual (30%)
          </h3>
          <p className="text-xs text-slate-500 mt-1">Lakukan transfer bank/e-wallet manual senilai 30% dari omset transaksi. Kemudian catat referensi transfer di bawah ini.</p>
        </div>

        {selectedCommission ? (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 animate-fade-in space-y-3 text-xs text-slate-700">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-amber-800">Proses Transfer Komisi manual</h4>
              <button onClick={() => setSelectedCommission(null)} className="text-slate-400 hover:text-slate-600 font-bold">Batal</button>
            </div>
            <div className="space-y-1.5">
              <p><strong>Kode Referral:</strong> <span className="font-mono bg-amber-100/80 px-1.5 py-0.5 rounded text-amber-900">{selectedCommission.referralCode}</span></p>
              <p><strong>Nilai Komisi (30%):</strong> <span className="font-bold text-slate-800">Rp {selectedCommission.commissionAmount.toLocaleString('id-ID')}</span></p>
              <p><strong>Rekening Mitra:</strong> <span className="italic">{referrals.find(r => r.code === selectedCommission.referralCode)?.bankInfo || 'Tidak ditemukan'}</span></p>
            </div>
            <form onSubmit={handleCompleteManualTransfer} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">ID / Referensi Transfer (No. Resi Bank):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Misal: MANDIRI-TX98765432"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  className="flex-1 bg-white border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-[11px] cursor-pointer"
                >
                  Konfirmasi Bayar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-3">Ref Code</th>
                  <th className="p-3">Pembeli</th>
                  <th className="p-3">Nilai CBT</th>
                  <th className="p-3">Komisi (30%)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">Belum ada komisi kemitraan yang masuk.</td>
                  </tr>
                ) : (
                  commissions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-indigo-600">{c.referralCode}</td>
                      <td className="p-3 font-medium text-slate-700">{c.buyerName}</td>
                      <td className="p-3 font-mono">Rp {c.purchaseAmount.toLocaleString('id-ID')}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">Rp {c.commissionAmount.toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {c.status === 'Paid' ? 'Paid (Transfered)' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {c.status === 'Pending' ? (
                          <button
                            onClick={() => setSelectedCommission(c)}
                            className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100 font-bold text-[10px] cursor-pointer"
                          >
                            Bayar Manual
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic font-mono">{c.transferReceipt}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
