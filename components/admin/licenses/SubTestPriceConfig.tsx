'use client';

import React, { useState, useMemo } from 'react';
import { PsychometricStore, TestType, Package } from '../../../lib/mockData';
import { DollarSign, CheckCircle2, ShieldCheck, Sparkles, Sliders, Calculator, ArrowRight, Info, Percent } from 'lucide-react';

interface SubTestPriceConfigProps {
  store: PsychometricStore;
  packages: Package[];
  onRefresh: () => void;
  onSelectForSubscription?: (selectedTests: string[], userCount: number, calculatedNetPricePerUser: number, totalAmount: number) => void;
  canEdit?: boolean;
}

export default function SubTestPriceConfig({
  store,
  packages,
  onRefresh,
  onSelectForSubscription,
  canEdit = true,
}: SubTestPriceConfigProps) {
  const [testTypes, setTestTypes] = useState<TestType[]>(() => store.getTestTypes());
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const types = store.getTestTypes();
    types.forEach(t => {
      map[t.id] = t.pricePerUser || (t.id === 'IQ' ? 10000 : t.id === 'EQ' ? 8000 : t.id === 'Holland' ? 7000 : t.id === 'Kepribadian' ? 8000 : 5000);
    });
    return map;
  });

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Live Simulator State
  const [simSelectedTests, setSimSelectedTests] = useState<string[]>(['IQ', 'EQ', 'Holland', 'Kepribadian', 'Validitas']);
  const [simUserCount, setSimUserCount] = useState<number>(100);

  // Helper to save sub-test price changes
  const handleSavePrices = () => {
    const updated = store.getTestTypes().map(t => {
      const newPrice = editingPrices[t.id] !== undefined ? editingPrices[t.id] : (t.pricePerUser || 5000);
      return { ...t, pricePerUser: newPrice };
    });

    updated.forEach(t => store.saveTestType(t));
    setTestTypes(store.getTestTypes());
    onRefresh();

    setSavedSuccess('Tarif dasar per Sub-Tes Psikometri berhasil disimpan!');
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  // Helper for toggle simulator tests
  const handleToggleSimTest = (id: string) => {
    setSimSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Live Calculator Logic
  const simBasePricePerUser = useMemo(() => {
    return simSelectedTests.reduce((acc, tId) => {
      const price = editingPrices[tId] !== undefined ? editingPrices[tId] : 5000;
      return acc + price;
    }, 0);
  }, [simSelectedTests, editingPrices]);

  // Quota Volume Tier Discount (0% - 25% max cap)
  const simDiscountPercentage = useMemo(() => {
    if (simUserCount >= 501) return 25; // Max 25% cap
    if (simUserCount >= 251) return 20;
    if (simUserCount >= 101) return 15;
    if (simUserCount >= 51) return 10;
    if (simUserCount >= 26) return 5;
    return 0;
  }, [simUserCount]);

  const simNettPricePerUser = useMemo(() => {
    return Math.round(simBasePricePerUser * (1 - simDiscountPercentage / 100));
  }, [simBasePricePerUser, simDiscountPercentage]);

  const simTotalAmount = useMemo(() => {
    return simNettPricePerUser * simUserCount;
  }, [simNettPricePerUser, simUserCount]);

  const simSavingsTotal = useMemo(() => {
    return (simBasePricePerUser * simUserCount) - simTotalAmount;
  }, [simBasePricePerUser, simUserCount, simTotalAmount]);

  return (
    <div className="space-y-8">
      {/* SUCCESS TOAST NOTIFICATION */}
      {savedSuccess && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between font-bold text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            <span>{savedSuccess}</span>
          </div>
          <button onClick={() => setSavedSuccess(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* SECTION 1: SETTING HARGA PER SUB-TES PSIKOMETRI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Konfigurasi Modul Kognitif & Minat
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-left mt-1">
              Pengaturan Tarif Dasar per Sub-Tes Psikometri
            </h3>
            <p className="text-slate-500 text-xs text-left">
              Tentukan harga satuan per user untuk setiap modul ujian yang diaktifkan. Total tarif dasar per user dihitung otomatis berdasarkan akumulasi modul yang dipilih.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={handleSavePrices}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" /> Simpan Perubahan Tarif
            </button>
          )}
        </div>

        {/* SUB-TEST PRICING GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testTypes.map(tt => {
            const currentPrice = editingPrices[tt.id] !== undefined ? editingPrices[tt.id] : (tt.pricePerUser || 5000);
            return (
              <div
                key={tt.id}
                className="bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-xl p-4 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-800 text-sm text-left">{tt.name}</span>
                    <span className="bg-white border text-slate-600 font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0">
                      ID: {tt.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 text-left mt-1 line-clamp-2">
                    {tt.description || 'Modul asesmen instrumen tes psikologi.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-600">Harga / User:</span>
                  <div className="relative flex-1 max-w-[150px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      disabled={!canEdit}
                      value={currentPrice}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setEditingPrices(prev => ({ ...prev, [tt.id]: val }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 font-mono font-bold text-xs text-indigo-900 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LIVE INTERACTIVE AUTOMATIC PRICING SIMULATOR */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/60 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" /> Kalkulator Simulasi Otomatis
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                Diskon Kuota Max 25%
              </span>
            </div>
            <h3 className="text-xl font-bold mt-1 text-left">
              Simulasi Tagihan & Paket Berdasarkan Sub-Tes + Kuota User
            </h3>
            <p className="text-slate-300 text-xs mt-0.5 text-left">
              Pilih modul Sub-Tes yang aktif dan masukkan Jumlah User. Sistem secara otomatis menghitung akumulasi harga dasar, potongan volume kuota, serta total tagihan bersih.
            </p>
          </div>
        </div>

        {/* INPUT CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: SUB-TESTS SELECTOR */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                1. Centang Sub-Tes Psikometri Yang Diaktifkan ({simSelectedTests.length} Modul Terpilih)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {testTypes.map(tt => {
                  const isChecked = simSelectedTests.includes(tt.id);
                  const price = editingPrices[tt.id] !== undefined ? editingPrices[tt.id] : (tt.pricePerUser || 5000);
                  return (
                    <button
                      key={tt.id}
                      type="button"
                      onClick={() => handleToggleSimTest(tt.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-inner'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] ${
                          isChecked ? 'bg-indigo-500 text-white' : 'border border-slate-500 text-transparent'
                        }`}>
                          ✓
                        </div>
                        <span className="text-xs font-semibold">{tt.name}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        Rp {price.toLocaleString('id-ID')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* USER COUNT INPUT */}
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  2. Masukkan Kuota Akun (Jumlah User / Peserta)
                </label>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {simUserCount} User
                </span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={simUserCount}
                  onChange={(e) => setSimUserCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-900 border border-indigo-500/40 rounded-xl px-4 py-2.5 font-mono text-base font-bold text-emerald-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Contoh: 100"
                />
              </div>

              {/* TIER DISCOUNT PRESET BUTTONS */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[
                  { count: 1, label: '1 User (0%)' },
                  { count: 30, label: '30 User (5%)' },
                  { count: 100, label: '100 User (10%)' },
                  { count: 250, label: '250 User (15%)' },
                  { count: 500, label: '500 User (20%)' },
                  { count: 1000, label: '1000 User (Max 25%)' },
                ].map(item => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setSimUserCount(item.count)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      simUserCount === item.count
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE OUTPUT CALCULATOR BREAKDOWN */}
          <div className="lg:col-span-5 bg-gradient-to-b from-indigo-900/60 to-slate-900 border border-indigo-500/30 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold uppercase tracking-wide text-indigo-200">
                  Rincian Hasil Kalkulasi
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Modul Sub-Tes Aktif:</span>
                  <span className="font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {simSelectedTests.length} Modul
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Harga Dasar per User (Kotor):</span>
                  <span className="font-mono text-white font-bold">
                    Rp {simBasePricePerUser.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Jumlah User / Akun:</span>
                  <span className="font-mono text-white font-bold">
                    {simUserCount} Siswa
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1">
                    Diskon Kuota Akun:
                    {simDiscountPercentage > 0 && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Tier Diskon
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-emerald-400 font-extrabold text-sm">
                    -{simDiscountPercentage}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-white/10">
                  <span>Harga Nett per User (Bersih):</span>
                  <span className="font-mono text-indigo-300 font-extrabold text-sm">
                    Rp {simNettPricePerUser.toLocaleString('id-ID')}
                  </span>
                </div>

                {simSavingsTotal > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex justify-between items-center text-[11px] text-emerald-300 font-semibold">
                    <span>Hemat Pembelian Kuota:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      Rp {simSavingsTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* GRAND TOTAL PRICE & ACTION BUTTON */}
            <div className="pt-4 border-t border-white/15 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-300">Total Tagihan Lisensi:</span>
                <div className="text-right">
                  <div className="font-mono text-2xl font-black text-amber-300 tracking-tight">
                    Rp {simTotalAmount.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[9px] text-slate-400">Terhitung Otomatis</span>
                </div>
              </div>

              {onSelectForSubscription && (
                <button
                  type="button"
                  onClick={() => onSelectForSubscription(simSelectedTests, simUserCount, simNettPricePerUser, simTotalAmount)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  Gunakan Hasil Kalkulasi Ini <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </div>

        {/* TIERING INFO BANNER */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-left">
            <span className="font-bold text-white">Aturan Potongan Otomatis Berdasarkan Kuota Akun (Max. 25%):</span>
            <p className="text-[11px] text-slate-400">
              • <strong>1–25 User:</strong> 0% | • <strong>26–50 User:</strong> 5% | • <strong>51–100 User:</strong> 10% | • <strong>101–250 User:</strong> 15% | • <strong>251–500 User:</strong> 20% | • <strong>&gt;500 User:</strong> 25% (Maksimal).
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
