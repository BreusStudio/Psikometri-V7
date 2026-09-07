'use client';

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  Sparkles, 
  Briefcase,
  Layers,
  FileText,
  Upload,
  AlertCircle
} from 'lucide-react';
import { PsychometricStore, Commission, Purchase, ReferralCode } from '../../../lib/mockData';
import { useToast } from '@/components/shared/ToastContext';

interface FinancialSubTabProps {
  store: PsychometricStore;
  purchases: Purchase[];
  commissions: Commission[];
  referrals: ReferralCode[];
  onRefresh: () => void;
}

export default function FinancialSubTab({
  store,
  purchases,
  commissions,
  referrals,
  onRefresh
}: FinancialSubTabProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'payouts'>('overview');
  const [selectedCommissionId, setSelectedCommissionId] = useState<string>('');
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<string>('');
  const [payoutFormError, setPayoutFormError] = useState<string | null>(null);

  // Auto-calculated Financial metrics
  const financialMetrics = useMemo(() => {
    const grossRevenue = purchases.reduce((sum, p) => sum + p.amount, 0);
    const paidCommissions = commissions
      .filter(c => c.status === 'Paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = commissions
      .filter(c => c.status === 'Pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    
    // Calculate total discount from volume discount vs base package price
    let totalDiscountCalculated = 0;
    purchases.forEach(p => {
      // Find package to compare base pricing
      const pkg = store.getPackages().find(pack => pack.name === p.packageName || pack.id === p.packageName);
      if (pkg) {
        // If package price differs from purchase price, we saved money
        const normalPriceForQuota = Math.round((pkg.price / (pkg.testCount || pkg.quota || 100)) * p.quotaAdded);
        if (normalPriceForQuota > p.amount) {
          totalDiscountCalculated += (normalPriceForQuota - p.amount);
        }
      }
    });

    const netIncome = grossRevenue - paidCommissions - pendingCommissions;

    return {
      grossRevenue,
      paidCommissions,
      pendingCommissions,
      netIncome,
      totalDiscountCalculated
    };
  }, [purchases, commissions, store]);

  // Income Breakdown by Channel
  const channelRevenue = useMemo(() => {
    const channels = {
      Manual: 0,
      QRIS: 0,
      TikTok: 0,
      Shopee: 0
    };
    purchases.forEach(p => {
      if (p.platform in channels) {
        channels[p.platform as keyof typeof channels] += p.amount;
      } else {
        channels.Manual += p.amount;
      }
    });
    return channels;
  }, [purchases]);

  const mostProfitableChannel = useMemo(() => {
    const entries = Object.entries(channelRevenue);
    entries.sort((a, b) => b[1] - a[1]);
    return {
      name: entries[0][0],
      amount: entries[0][1]
    };
  }, [channelRevenue]);

  // Pending Commission Details
  const pendingCommissionsList = useMemo(() => {
    return commissions.filter(c => c.status === 'Pending');
  }, [commissions]);

  // Handle Mark Payout as Paid
  const handleApprovePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommissionId) {
      setPayoutFormError('Silakan pilih salah satu tagihan komisi pending.');
      return;
    }

    const receiptUrl = paymentReceiptFile.trim() || `https://picsum.photos/seed/receipt_${Math.floor(Math.random() * 1000)}/400/600`;
    
    const success = store.payCommission(selectedCommissionId, receiptUrl);
    if (success) {
      showSuccessToast('Status pembayaran komisi mitra berhasil diperbarui menjadi LUNAS!');
      setSelectedCommissionId('');
      setPaymentReceiptFile('');
      setPayoutFormError(null);
      onRefresh();
    } else {
      showErrorToast('Gagal memproses pembayaran komisi. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* INTERNAL FINANCE SELECTOR TAB */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'overview' 
              ? 'bg-white text-indigo-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Ikhtisar Keuangan & Alur Kas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'commissions' 
              ? 'bg-white text-indigo-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Distribusi Komisi Mitra ({pendingCommissionsList.length} Pending)
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* TOP LEVEL METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* GROSS INCOME */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 rounded-2xl border border-indigo-150 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-indigo-500 opacity-10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Total Pendapatan Kotor
                </span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <h4 className="text-[11px] font-medium text-slate-500">Omset Penjualan Global</h4>
              <p className="text-xl font-black text-slate-800 font-mono mt-1">
                Rp {financialMetrics.grossRevenue.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tercatat dari {purchases.length} transaksi sukses
              </span>
            </div>

            {/* TOTAL COMMISSION OUTFLOW */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Beban Komisi Affiliate
                </span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-[11px] font-medium text-slate-500">Total Komisi Mitra</h4>
              <p className="text-xl font-black text-slate-800 font-mono mt-1">
                Rp {(financialMetrics.paidCommissions + financialMetrics.pendingCommissions).toLocaleString('id-ID')}
              </p>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span className="text-amber-600 font-semibold">Pending: Rp {financialMetrics.pendingCommissions.toLocaleString('id-ID')}</span>
                <span className="text-emerald-600 font-semibold">Paid: Rp {financialMetrics.paidCommissions.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* NET BUSINESS PROFIT */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-150 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-16 h-16 bg-emerald-500 opacity-10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Pendapatan Bersih (Net)
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="text-[11px] font-medium text-slate-500">Laba Bersih CBT Core</h4>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                Rp {financialMetrics.netIncome.toLocaleString('id-ID')}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Net Margin: {financialMetrics.grossRevenue > 0 ? Math.round((financialMetrics.netIncome / financialMetrics.grossRevenue) * 100) : 100}%
              </span>
            </div>

            {/* PROGRESSIVE DISCOUNT SAVED */}
            <div className="bg-cyan-50/40 p-5 rounded-2xl border border-cyan-150 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded uppercase tracking-wider">
                  Efisiensi Diskon Vol.
                </span>
                <Layers className="w-4 h-4 text-cyan-600" />
              </div>
              <h4 className="text-[11px] font-medium text-slate-500">Submisi Diskon Klien</h4>
              <p className="text-xl font-black text-cyan-700 font-mono mt-1">
                Rp {financialMetrics.totalDiscountCalculated.toLocaleString('id-ID')}
              </p>
              <span className="text-[9px] text-slate-400 mt-1 block">
                Total potongan harga yang dinikmati sekolah
              </span>
            </div>

          </div>

          {/* INCOME CHANNELS AND VOLUME METRICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* DISTRIBUTION CHART */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                <CreditCard className="w-4 h-4 text-indigo-500" /> Distribusi Saluran Pembayaran
              </h3>
              
              <div className="space-y-3.5 pt-2">
                {Object.entries(channelRevenue).map(([channel, amount]) => {
                  const percent = financialMetrics.grossRevenue > 0 
                    ? (amount / financialMetrics.grossRevenue) * 100 
                    : 0;
                  
                  // Color assignment based on channel
                  let colorClass = 'bg-indigo-600';
                  let textColor = 'text-indigo-600';
                  if (channel === 'QRIS') { colorClass = 'bg-emerald-500'; textColor = 'text-emerald-600'; }
                  if (channel === 'Shopee') { colorClass = 'bg-amber-500'; textColor = 'text-amber-600'; }
                  if (channel === 'TikTok') { colorClass = 'bg-slate-900'; textColor = 'text-slate-900'; }

                  return (
                    <div key={channel} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                          {channel === 'Manual' ? 'Manual Transfer (Admin)' : `${channel} Gateway`}
                        </span>
                        <div className="text-right">
                          <span className="font-mono text-slate-800">Rp {amount.toLocaleString('id-ID')}</span>
                          <span className={`text-[10px] font-bold ${textColor} ml-1.5`}>{percent.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 leading-normal border border-slate-150">
                Saluran pembayaran paling dominan saat ini adalah <strong className="text-slate-700">{mostProfitableChannel.name}</strong> dengan kontribusi sebesar <strong className="text-slate-700">Rp {mostProfitableChannel.amount.toLocaleString('id-ID')}</strong>.
              </div>
            </div>

            {/* FINANCIAL ADVISORY & REVENUE INSIGHT */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Analisis Keuangan CBT Core
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-1.5">
                    <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Kesehatan Keuangan: SEHAT
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Rasio laba bersih Anda mencapai <strong>{financialMetrics.grossRevenue > 0 ? Math.round((financialMetrics.netIncome / financialMetrics.grossRevenue) * 100) : 100}%</strong>. Hal ini disebabkan biaya infrastruktur yang minimal dari model SaaS CBT Core, sehingga sebagian besar omset yang dikurangi komisi referral langsung diakui sebagai laba bersih.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/10 space-y-1.5">
                    <span className="font-bold text-indigo-800 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> Strategi Kemitraan Mitra
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Sistem komisi referral saat ini terhitung <strong>30% (Flat)</strong> untuk setiap transaksi yang diafiliasikan. Kolaborasi intensif dengan para Guru BK Sekolah sangat dianjurkan untuk mendongkrak penjualan kuota ujian.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Pencatatan Real-Time & Audit Log</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Setiap pendaftaran klien baru secara manual melalui fitur &quot;Daftarkan Klien Manual&quot; secara otomatis akan menghitung pengeluaran komisi jika menyertakan Kode Referral. Data ini terintegrasi penuh ke modul state di memori lokal serta akan diunggah ke database awan secara otomatis.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveTab('commissions')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md shadow-indigo-100 cursor-pointer transition-colors"
                >
                  Kelola Komisi Mitra Pending
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'commissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* PAYOUT APPROVAL FORM */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <Upload className="w-4 h-4 text-indigo-600" /> Proses Transfer Komisi
            </h3>
            
            <form onSubmit={handleApprovePayout} className="space-y-4 text-xs">
              
              {payoutFormError && (
                <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start gap-1.5 text-[10px] text-rose-800 leading-normal font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>{payoutFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-600 mb-1">Pilih Tagihan Komisi</label>
                <select
                  value={selectedCommissionId}
                  onChange={(e) => {
                    setSelectedCommissionId(e.target.value);
                    setPayoutFormError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium font-mono"
                >
                  <option value="">-- Pilih Tagihan Pending --</option>
                  {pendingCommissionsList.map(c => {
                    const ref = referrals.find(r => r.code === c.referralCode);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.id} - Rp {c.commissionAmount.toLocaleString('id-ID')} ({ref?.ownerName || c.referralCode})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedCommissionId && (() => {
                const selectedComm = commissions.find(c => c.id === selectedCommissionId);
                const selectedRef = referrals.find(r => r?.code === selectedComm?.referralCode);
                if (!selectedComm) return null;

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3.5 text-[11px]">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wide text-[10px] border-b pb-1">Detail Penerima & Akun Bank</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Mitra Affiliate</span>
                        <strong className="text-slate-700">{selectedRef?.ownerName || selectedComm.referralCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Nilai Komisi (30%)</span>
                        <strong className="text-emerald-600 font-mono">Rp {selectedComm.commissionAmount.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Rekening Bank Tujuan</span>
                      <strong className="text-indigo-600 font-mono text-[11px] bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                        {selectedRef?.bankInfo || 'Data bank tidak terdaftar'}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg leading-relaxed text-[10px] border border-amber-200/50">
                      Silakan lakukan transfer manual ke rekening bank di atas dengan nominal persis. Setelah sukses, klik tombol di bawah untuk mengonfirmasi kelunasan otomatis.
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-600 mb-1">Bukti Transfer Sukses (Receipt URL)</label>
                <input
                  type="text"
                  placeholder="https://picsum.photos/... (Akan digenerate otomatis jika kosong)"
                  value={paymentReceiptFile}
                  onChange={(e) => setPaymentReceiptFile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedCommissionId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Konfirmasi Pembayaran Lunas
              </button>

            </form>
          </div>

          {/* COMMISSIONS MASTER LIST */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <FileText className="w-4 h-4 text-emerald-500" /> Log Transaksi Komisi & Pembayaran Affiliate
            </h3>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                    <th className="p-3">ID Komisi</th>
                    <th className="p-3">Kode / Pemilik</th>
                    <th className="p-3">Nilai Transaksi</th>
                    <th className="p-3">Kewajiban Komisi</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Tanggal Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                        Belum ada pencatatan komisi referral mitra saat ini.
                      </td>
                    </tr>
                  ) : (
                    commissions.map(c => {
                      const ref = referrals.find(r => r.code === c.referralCode);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700">{c.id}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold block text-indigo-600">{c.referralCode}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">{ref?.ownerName || 'Mitra Umum'}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">Rp {c.purchaseAmount.toLocaleString('id-ID')}</td>
                          <td className="p-3 font-mono font-bold text-slate-850">Rp {c.commissionAmount.toLocaleString('id-ID')}</td>
                          <td className="p-3">
                            {c.status === 'Paid' ? (
                              <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Lunas / Paid
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {new Date(c.date).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
