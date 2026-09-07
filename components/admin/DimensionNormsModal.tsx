'use client';

import React, { useState, useEffect } from 'react';
import { Dimension, DimensionNormRange } from '@/lib/core/types';
import { 
  Sliders, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  Target 
} from 'lucide-react';

interface DimensionNormsModalProps {
  isOpen: boolean;
  dimension: Dimension | null;
  onClose: () => void;
  onSave: (updatedDimension: Dimension) => void;
}

const DEFAULT_3_RANGES: DimensionNormRange[] = [
  {
    minScore: 0,
    maxScore: 40,
    label: 'Rendah',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    description: 'Tingkat penguasaan atau kecenderungan masih di bawah rata-rata populasi.'
  },
  {
    minScore: 41,
    maxScore: 70,
    label: 'Sedang / Rata-rata',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    description: 'Menunjukkan kesiapan dan potensi yang seimbang dan adaptif.'
  },
  {
    minScore: 71,
    maxScore: 100,
    label: 'Tinggi / Unggul',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    description: 'Memiliki dominasi bakat, minat, atau kompetensi kognitif yang sangat kuat.'
  }
];

const DEFAULT_5_RANGES: DimensionNormRange[] = [
  { minScore: 0, maxScore: 20, label: 'Sangat Rendah', color: 'text-rose-700 bg-rose-50 border-rose-200', description: 'Perlu bimbingan intensif dan stimulus terarah.' },
  { minScore: 21, maxScore: 40, label: 'Rendah', color: 'text-orange-700 bg-orange-50 border-orange-200', description: 'Cenderung kurang menonjol pada domain ini.' },
  { minScore: 41, maxScore: 60, label: 'Cukup / Rata-rata', color: 'text-amber-700 bg-amber-50 border-amber-200', description: 'Memenuhi standar dasar populasi umum.' },
  { minScore: 61, maxScore: 80, label: 'Tinggi', color: 'text-blue-700 bg-blue-50 border-blue-200', description: 'Menunjukkan potensi kuat yang layak dikembangkan.' },
  { minScore: 81, maxScore: 100, label: 'Sangat Tinggi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', description: 'Domain bakat prima/unggul (Top Talent).' }
];

export function DimensionNormsModal({
  isOpen,
  dimension,
  onClose,
  onSave
}: DimensionNormsModalProps) {
  if (!isOpen || !dimension) return null;

  return (
    <DimensionNormsModalContent
      key={dimension.id}
      dimension={dimension}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function DimensionNormsModalContent({
  dimension,
  onClose,
  onSave
}: {
  dimension: Dimension;
  onClose: () => void;
  onSave: (updatedDimension: Dimension) => void;
}) {
  const [scoringMethod, setScoringMethod] = useState<'sum_raw' | 'percentage' | 'sten' | 'mean'>(
    dimension.scoringMethod || 'percentage'
  );
  const [passingGrade, setPassingGrade] = useState<number | ''>(
    dimension.passingGrade !== undefined ? dimension.passingGrade : ''
  );
  const [normRanges, setNormRanges] = useState<DimensionNormRange[]>(() => {
    return dimension.normRanges && dimension.normRanges.length > 0
      ? dimension.normRanges.map(r => ({ ...r }))
      : DEFAULT_3_RANGES;
  });

  const handleAddRange = () => {
    const lastRange = normRanges[normRanges.length - 1];
    const newMin = lastRange ? lastRange.maxScore + 1 : 0;
    const newMax = Math.min(newMin + 20, 100);

    setNormRanges(prev => [
      ...prev,
      {
        minScore: newMin,
        maxScore: newMax,
        label: `Tingkat ${prev.length + 1}`,
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        description: ''
      }
    ]);
  };

  const handleRemoveRange = (idx: number) => {
    setNormRanges(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateRange = (idx: number, field: keyof DimensionNormRange, val: any) => {
    setNormRanges(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = () => {
    const updated: Dimension = {
      ...dimension,
      scoringMethod,
      passingGrade: passingGrade === '' ? undefined : Number(passingGrade),
      normRanges
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/30 p-2.5 rounded-2xl border border-indigo-500/20">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Standarisasi Norma & Rubrik Dimensi
              </h3>
              <p className="text-[10px] text-slate-300 font-medium">
                Dimensi: <span className="font-bold text-white">{dimension.name}</span> | Kode: <span className="font-mono text-indigo-300 font-bold">{dimension.code || dimension.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Scoring Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Metode Kalkulasi Skor Dimensi:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setScoringMethod('percentage')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMethod === 'percentage'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Persentase</span>
                  {scoringMethod === 'percentage' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Skala 0 - 100% dari skor maks butir.</p>
              </button>

              <button
                type="button"
                onClick={() => setScoringMethod('sum_raw')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMethod === 'sum_raw'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Skor Mentah</span>
                  {scoringMethod === 'sum_raw' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Akumulasi total poin butir (Raw Score).</p>
              </button>

              <button
                type="button"
                onClick={() => setScoringMethod('sten')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMethod === 'sten'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Sten (1 - 10)</span>
                  {scoringMethod === 'sten' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Standard Ten untuk norma psikodiagnostik.</p>
              </button>

              <button
                type="button"
                onClick={() => setScoringMethod('mean')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMethod === 'mean'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Rata-rata</span>
                  {scoringMethod === 'mean' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Rata-rata respons (Mean Likert).</p>
              </button>
            </div>
          </div>

          {/* Passing Grade Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-800">Batas Nilai Lulus / Passing Grade (Opsional)</span>
                <p className="text-[11px] text-slate-500 font-medium">Batas minimum kelulusan standar untuk laporan atau seleksi.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Contoh: 65"
                value={passingGrade}
                onChange={(e) => setPassingGrade(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-24 px-3 py-2 text-xs font-bold text-center font-mono bg-white border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-400">Poin</span>
            </div>
          </div>

          {/* Norm Ranges Header & Presets */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Tabel Interval Norma & Kategori Nilai:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNormRanges(DEFAULT_3_RANGES)}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Preset 3 Kategori (R/S/T)
                </button>
                <button
                  type="button"
                  onClick={() => setNormRanges(DEFAULT_5_RANGES)}
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  Preset 5 Kategori (SR s.d. ST)
                </button>
              </div>
            </div>

            {/* Norm Ranges Items */}
            <div className="space-y-3">
              {normRanges.map((range, idx) => (
                <div
                  key={`range-${idx}`}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg">
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                        <span>Rentang:</span>
                        <input
                          type="number"
                          value={range.minScore}
                          onChange={(e) => handleUpdateRange(idx, 'minScore', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-bold text-center font-mono bg-slate-50 border border-slate-300 rounded-lg"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={range.maxScore}
                          onChange={(e) => handleUpdateRange(idx, 'maxScore', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-bold text-center font-mono bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 sm:justify-end">
                      <input
                        type="text"
                        placeholder="Label Kategori (misal: Sangat Unggul)"
                        value={range.label}
                        onChange={(e) => handleUpdateRange(idx, 'label', e.target.value)}
                        className="px-3 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg flex-1 sm:max-w-xs focus:bg-white"
                      />
                      {normRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRange(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Interpretasi naratif & rekomendasi psikologis untuk kategori ini..."
                      value={range.description || ''}
                      onChange={(e) => handleUpdateRange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRange}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-indigo-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Tingkat Norma Kategori Baru
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-650/15 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Norma & Rubrik Dimensi
          </button>
        </div>
      </div>
    </div>
  );
}
