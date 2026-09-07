'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ExamFinishModalProps {
  showFinishModal: boolean;
  setShowFinishModal: (show: boolean) => void;
  unansweredCountState: number;
  executeFinishSubTest: () => void;
}

export default function ExamFinishModal({
  showFinishModal,
  setShowFinishModal,
  unansweredCountState,
  executeFinishSubTest
}: ExamFinishModalProps) {
  if (!showFinishModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-55 text-slate-800" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900 font-sans">
              Selesaikan Sub-Tes Ini?
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
              Apakah Anda yakin ingin menyelesaikan sub-tes ini? Anda tidak dapat mengubah jawaban Anda lagi setelah konfirmasi dikirim.
            </p>
            {unansweredCountState > 0 && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100/60 p-2.5 rounded-lg mt-2 font-sans">
                ⚠️ PERHATIAN: Masih terdapat {unansweredCountState} soal yang BELUM Anda isi!
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setShowFinishModal(false)}
            className="text-xs font-bold px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-all bg-white font-sans"
          >
            Lanjutkan Mengerjakan
          </button>
          <button
            type="button"
            onClick={executeFinishSubTest}
            className="text-xs font-bold px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-900/10 font-sans"
          >
            Ya, Selesaikan & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
