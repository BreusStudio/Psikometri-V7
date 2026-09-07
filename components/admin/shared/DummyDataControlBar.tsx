'use client';

import React, { useState } from 'react';
import { Sparkles, Trash2, Database, AlertCircle, CheckCircle2, Calculator, RefreshCw } from 'lucide-react';
import { PsychometricStore } from '../../../lib/store/PsychometricStore';

interface DummyDataControlBarProps {
  store: PsychometricStore;
  onRefresh: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  className?: string;
}

export default function DummyDataControlBar({
  store,
  onRefresh,
  showNotification,
  className = ''
}: DummyDataControlBarProps) {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const dummyCount = store.getDummyStudentsCount();
  const registeredClasses = store.getRegisteredClasses();

  const handleRecalculateAll = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      try {
        const res = store.recalculateAllStudentScores();
        onRefresh();
        if (showNotification) {
          showNotification(
            `Kalkulasi Ulang Berhasil: ${res.totalUpdated} dari ${res.totalProcessed} siswa berhasil diperbarui ke norma psikometri standar terbaru.`,
            'success'
          );
        }
      } catch (err: any) {
        if (showNotification) {
          showNotification(`Gagal merekalibrasi skor: ${err?.message || 'Error'}`, 'error');
        }
      } finally {
        setIsRecalculating(false);
      }
    }, 250);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const count = store.generateDummyCompletedStudents(generateCount, selectedClass || undefined);
        onRefresh();
        if (showNotification) {
          showNotification(`Berhasil membuat ${count} data dummy siswa yang telah menyelesaikan ujian.`, 'success');
        }
        setIsOpenModal(false);
      } catch (err: any) {
        if (showNotification) {
          showNotification(`Gagal membuat data dummy: ${err?.message || 'Error'}`, 'error');
        }
      } finally {
        setIsGenerating(false);
      }
    }, 200);
  };

  const handleClear = () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus semua (${dummyCount}) data dummy siswa? Data siswa asli tidak akan terpengaruh.`)) {
      const removed = store.clearDummyStudents();
      onRefresh();
      if (showNotification) {
        showNotification(`Berhasil menghapus ${removed} data dummy siswa.`, 'info');
      }
    }
  };

  return (
    <div className={`p-3 bg-gradient-to-r from-amber-50/80 via-indigo-50/50 to-slate-50 rounded-xl border border-amber-200/60 shadow-xs flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Simulator &amp; Rekalibrasi Psikometri</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {dummyCount} Dummy Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Dihitung menggunakan Skala Baku Wechsler IQ [55 - 145] &amp; Standard T-Score EQ [Mean 50].
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isRecalculating}
          onClick={handleRecalculateAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-700 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'Memproses...' : 'Rekalkulasi Massal Skor'}
        </button>

        <button
          type="button"
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-300/80 hover:bg-amber-300 border border-amber-400/60 shadow-2xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-900" />
          + Generate Dummy
        </button>

        {dummyCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Dummy ({dummyCount})
          </button>
        )}
      </div>

      {/* Modal Dialog */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Generate Data Dummy Ujian</h3>
                <p className="text-xs text-slate-500">
                  Simulasi hasil ujian selesai untuk testing laporan &amp; grafik.
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700 mb-6">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jumlah Siswa Dummy
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGenerateCount(n)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        generateCount === n
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {n} Siswa
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Kelas (Opsional)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Acak Semua Kelas Terdaftar --</option>
                  {registeredClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Database className="w-3.5 h-3.5" />
                  Karakteristik Data Dummy:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Menggunakan bank soal &amp; dimensi yang sedang aktif saat ini.</li>
                  <li>Kalkulasi skor IQ, EQ, RIASEC &amp; Dimensi dihitung otomatis.</li>
                  <li>Status ujian diset Selesai dengan timestamp realistis.</li>
                  <li>Dapat dihapus kapan saja dengan 1 klik tanpa merusak data asli.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? 'Memproses...' : 'Generate Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
