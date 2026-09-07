'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Brain, 
  Heart, 
  Scale, 
  BarChart3, 
  Table, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  TestSettings, 
  ScoringCalibrationSettings, 
  DEFAULT_SCORING_CALIBRATION, 
  DEFAULT_IQ_BRACKETS,
  IqConversionBracket 
} from '../../lib/core/types';
import { 
  calculateCalibratedIq, 
  calculateCalibratedEq, 
  getWechslerIqClassification, 
  getTScoreEqClassification 
} from '../../lib/psychometrics/normCalculator';

interface CalibrationTabProps {
  testSettings: TestSettings;
  store: any;
  onRefresh?: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CalibrationTab({
  testSettings,
  store,
  onRefresh,
  showNotification
}: CalibrationTabProps) {
  const [calibration, setCalibration] = useState<ScoringCalibrationSettings>(() => {
    return testSettings?.scoringCalibration || { ...DEFAULT_SCORING_CALIBRATION };
  });

  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Sync state if testSettings updates from store
  React.useEffect(() => {
    if (testSettings?.scoringCalibration) {
      setCalibration(testSettings.scoringCalibration);
    }
  }, [testSettings?.scoringCalibration]);

  // Simulator test inputs (percentage 0 - 100)
  const [simIqPct, setSimIqPct] = useState<number>(35);
  const [simEqPct, setSimEqPct] = useState<number>(55);

  // Simulated calculations
  const simIqResult = useMemo(() => {
    // Treat raw as percentage of 100 max
    const iq = calculateCalibratedIq(simIqPct, 100, calibration);
    const classification = getWechslerIqClassification(iq);
    return { iq, ...classification };
  }, [simIqPct, calibration]);

  const simEqResult = useMemo(() => {
    // Treat raw as percentage of 100 max
    const eq = calculateCalibratedEq(simEqPct, 0, 100, calibration);
    const classification = getTScoreEqClassification(eq);
    return { eq, ...classification };
  }, [simEqPct, calibration]);

  const handleUpdateBracket = (index: number, field: keyof IqConversionBracket, value: any) => {
    const updatedBrackets = [...(calibration.iqBrackets || DEFAULT_IQ_BRACKETS)];
    updatedBrackets[index] = {
      ...updatedBrackets[index],
      [field]: Number(value) || value
    };
    setCalibration(prev => ({
      ...prev,
      iqBrackets: updatedBrackets
    }));
  };

  const handleResetToDefault = () => {
    const def = { ...DEFAULT_SCORING_CALIBRATION };
    setCalibration(def);
    if (showNotification) {
      showNotification('Pengaturan kalibrasi direset ke default baku.', 'info');
    }
  };

  const handleSaveOnly = async () => {
    if (!store) return;
    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      store.updateScoringCalibration(calibration, false);
      setSaveSuccessMsg('Konfigurasi kalibrasi berhasil disimpan.');
      if (showNotification) {
        showNotification('Kalibrasi norma berhasil disimpan ke sistem.', 'success');
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      if (showNotification) {
        showNotification('Gagal menyimpan kalibrasi: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const executeRecalculateAll = async () => {
    if (!store) return;
    setShowConfirmModal(false);
    setRecalculating(true);
    setSaveSuccessMsg(null);
    try {
      const res = store.updateScoringCalibration(calibration, true);
      const msg = `Berhasil menerapkan kalibrasi! ${res.totalUpdated} dari ${res.totalProcessed} siswa berhasil diperbarui skornya.`;
      setSaveSuccessMsg(msg);
      if (showNotification) {
        showNotification(msg, 'success');
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      if (showNotification) {
        showNotification('Gagal melakukan kalkulasi ulang siswa: ' + (err.message || 'Unknown error'), 'error');
      }
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveAndRecalculateAll = () => {
    if (!store) return;
    setShowConfirmModal(true);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in" id="calibration-management-root">
      {/* INTRO HEADER & STATUS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                Norma & Kalibrasi Penilaian Realistis
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                Berdasarkan Jawaban Riil Siswa
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Kalibrasi Norma Kognitif (IQ) & Emosi (EQ)
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              Konfigurasikan titik acuan standar dan sebaran norma psikometri. Skor akhir dihitung secara objektif dari <strong>jawaban riil masing-masing siswa</strong> (bukan rata-rata angkatan), dikonversikan ke Skala Standar Wechsler (IQ Mean: 100) dan Skala T-Score (EQ Mean: 50).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              title="Reset ke parameter baku default"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              Reset Default
            </button>
            <button
              type="button"
              disabled={saving || recalculating}
              onClick={handleSaveOnly}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-indigo-600" />
              {saving ? 'Menyimpan...' : 'Simpan Saja'}
            </button>
            <button
              type="button"
              disabled={saving || recalculating}
              onClick={handleSaveAndRecalculateAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-white" />
              {recalculating ? 'Mengkalkulasi Siswa...' : 'Terapkan & Hitung Ulang Semua'}
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* MODE SELECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Metode Konversi & Formula Penilaian
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih cara sistem memetakan persentase capaian soal ke angka IQ Skala Wechsler.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setCalibration(prev => ({ ...prev, mode: 'curve' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                calibration.mode === 'curve'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Kurva Kalibrasi Riil (Direkomendasikan)
            </button>
            <button
              type="button"
              onClick={() => setCalibration(prev => ({ ...prev, mode: 'table' }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                calibration.mode === 'table'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Tabel Rentang Skor Mutlak
            </button>
          </div>
        </div>

        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            {calibration.mode === 'curve' ? (
              <span>
                <strong>Kurva Kalibrasi Riil:</strong> Menghitung Z-Score berdasarkan persentase jawaban benar riil siswa dibanding tingkat kesulitan bank soal (baseline). Menjamin kurva penilaian adil untuk soal-soal bertaraf analitis/HOTS tanpa penalti ekstrem.
              </span>
            ) : (
              <span>
                <strong>Tabel Rentang Skor Mutlak:</strong> Memetakan secara kaku persentase jawaban benar ke angka IQ tertentu sesuai interval rentang yang Anda tetapkan pada tabel di bawah.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DUAL COLUMN: IQ & EQ CALIBRATION SETTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IQ CALIBRATION CARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Kalibrasi Kognitif (IQ)</h3>
                <p className="text-xs text-slate-500">Skala Wechsler Baku (Populasi Mean: 100, SD: 15)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Skala 65 - 145
            </span>
          </div>

          {calibration.mode === 'curve' ? (
            <div className="space-y-5">
              {/* Baseline % Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Titik Acuan Rata-rata Normal (IQ = 100)</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Berapa % jawaban benar dari total soal yang dianggap berada pada kapasitas rata-rata normal (IQ 100)" />
                  </label>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-black">
                    {calibration.iqBaselinePercentage}% Jawaban Benar
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={70}
                  step={1}
                  value={calibration.iqBaselinePercentage}
                  onChange={e => setCalibration(prev => ({ ...prev, iqBaselinePercentage: Number(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Untuk soal-soal bertaraf HOTS / penarikan kesimpulan logis, capaian <strong>{calibration.iqBaselinePercentage}%</strong> benar telah memenuhi kategori Rata-rata Normal (IQ 100).
                </p>
              </div>

              {/* Spread % Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>Sebaran Standar Deviasi (Rentang 1 SD = 15 IQ)</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Rentang persentase benar yang setara dengan kenaikan 15 poin IQ" />
                  </label>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-black">
                    ± {calibration.iqSpreadPercentage}% per SD
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={30}
                  step={1}
                  value={calibration.iqSpreadPercentage}
                  onChange={e => setCalibration(prev => ({ ...prev, iqSpreadPercentage: Number(e.target.value) }))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Tiap penambahan <strong>+{calibration.iqSpreadPercentage}%</strong> jawaban benar akan menaikkan skor IQ sebesar 15 poin (misal ke Superior).
                </p>
              </div>

              {/* Min & Max Clamping */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Skor IQ Minimum (Floor)</label>
                  <input
                    type="number"
                    min={55}
                    max={85}
                    value={calibration.minIq}
                    onChange={e => setCalibration(prev => ({ ...prev, minIq: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Batas terbawah penilaian</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Skor IQ Maksimum (Ceiling)</label>
                  <input
                    type="number"
                    min={130}
                    max={155}
                    value={calibration.maxIq}
                    onChange={e => setCalibration(prev => ({ ...prev, maxIq: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">Batas teratas penilaian</span>
                </div>
              </div>
            </div>
          ) : (
            /* Table-based conversion editor */
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                Atur angka IQ untuk masing-masing interval persentase jawaban benar:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-bold">Rentang Capaian</th>
                      <th className="px-3 py-2 font-bold">Target Skor IQ</th>
                      <th className="px-3 py-2 font-bold">Kategori Standar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(calibration.iqBrackets || DEFAULT_IQ_BRACKETS).map((bracket, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-semibold text-slate-700">
                          {bracket.minPercentage}% - {bracket.maxPercentage}%
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={bracket.iqScore}
                            onChange={e => handleUpdateBracket(idx, 'iqScore', e.target.value)}
                            className="w-16 px-2 py-1 text-xs font-black text-indigo-700 rounded-lg border border-slate-200 bg-white"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-slate-600 font-medium">{bracket.label}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* EQ CALIBRATION CARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Kalibrasi Emosional (EQ)</h3>
                <p className="text-xs text-slate-500">Skala T-Score Baku (Populasi Mean: 50, SD: 10)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
              Skala 20 - 80
            </span>
          </div>

          <div className="space-y-5">
            {/* EQ Baseline % Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Titik Acuan Rata-rata Normal (T-Score = 50)</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Persentase total poin skala likert EQ yang dianggap rata-rata cukup stabil" />
                </label>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-black">
                  {calibration.eqBaselinePercentage}% Capaian Skor
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={70}
                step={1}
                value={calibration.eqBaselinePercentage}
                onChange={e => setCalibration(prev => ({ ...prev, eqBaselinePercentage: Number(e.target.value) }))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Siswa dengan capaian skor <strong>{calibration.eqBaselinePercentage}%</strong> dari rentang poin soal EQ akan mendapatkan skor T-Score 50 (Cukup Stabil / Normal).
              </p>
            </div>

            {/* EQ Spread % Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Sebaran Standar Deviasi (Rentang 1 SD = 10 T-Score)</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Rentang persentase poin yang setara dengan kenaikan 10 poin T-Score EQ" />
                </label>
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-black">
                  ± {calibration.eqSpreadPercentage}% per SD
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={1}
                value={calibration.eqSpreadPercentage}
                onChange={e => setCalibration(prev => ({ ...prev, eqSpreadPercentage: Number(e.target.value) }))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Tiap kenaikan <strong>+{calibration.eqSpreadPercentage}%</strong> poin akan menaikkan skor T-Score sebesar 10 poin (misal ke Kategori Stabil/Tinggi).
              </p>
            </div>

            {/* EQ Min & Max Clamping */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Skor EQ Minimum (Floor)</label>
                <input
                  type="number"
                  min={10}
                  max={35}
                  value={calibration.minEq}
                  onChange={e => setCalibration(prev => ({ ...prev, minEq: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-rose-500"
                />
                <span className="text-[10px] text-slate-400">Batas terbawah penilaian EQ</span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Skor EQ Maksimum (Ceiling)</label>
                <input
                  type="number"
                  min={70}
                  max={90}
                  value={calibration.maxEq}
                  onChange={e => setCalibration(prev => ({ ...prev, maxEq: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-rose-500"
                />
                <span className="text-[10px] text-slate-400">Batas teratas penilaian EQ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE LIVE SIMULATOR */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Psychometric Simulator
              </span>
            </div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Simulator Uji Coba Kalibrasi Langsung
            </h3>
            <p className="text-xs text-slate-400">
              Geser persentase jawaban benar untuk melihat bagaimana formula kalibrasi ini menghasilkan skor riil siswa sebelum disimpan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* IQ Simulator Box */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-indigo-400" />
                Simulasi Jawaban Benar IQ
              </span>
              <span className="text-sm font-black text-white">{simIqPct}% Benar</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={simIqPct}
              onChange={e => setSimIqPct(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hasil Skor IQ</span>
                <div className="text-3xl font-black text-white">{simIqResult.iq}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Klasifikasi</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${simIqResult.color}`}>
                    {simIqResult.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EQ Simulator Box */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Simulasi Capaian Poin EQ
              </span>
              <span className="text-sm font-black text-white">{simEqPct}% Poin</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={simEqPct}
              onChange={e => setSimEqPct(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hasil T-Score EQ</span>
                <div className="text-3xl font-black text-white">{simEqResult.eq}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Klasifikasi</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${simEqResult.color}`}>
                    {simEqResult.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION RECALCULATE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Terapkan & Hitung Ulang Semua Siswa</h4>
                <p className="text-xs text-slate-500">Konfirmasi pembaruan skor psikometri</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                Sistem akan menyimpan konfigurasi kalibrasi terbaru dan melakukan kalkulasi ulang menyeluruh untuk <strong>seluruh siswa</strong> yang telah mengerjakan tes.
              </p>
              <div className="flex items-start gap-2 pt-1 text-slate-700 font-medium">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Perhitungan dilakukan murni dari respon jawaban butir soal asli masing-masing siswa dan dikonversikan ke norma standar terbaru.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeRecalculateAll}
                disabled={recalculating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{recalculating ? 'Mengkalkulasi...' : 'Ya, Hitung Ulang Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
