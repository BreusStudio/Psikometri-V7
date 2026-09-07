'use client';

import React, { useMemo } from 'react';
import { Lock, Info, AlertTriangle, Play } from 'lucide-react';
import { Student } from '../../lib/types';
import { resolveClientContext } from '../../lib/core/contextResolver';

interface ExamTokenScreenProps {
  currentStudent: Student;
  tokenInput: string;
  setTokenInput: (val: string) => void;
  tokenError: string;
  tokenInfo: { token: string; secondsLeft: number };
  handleTokenSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
}

export default function ExamTokenScreen({
  currentStudent,
  tokenInput,
  setTokenInput,
  tokenError,
  tokenInfo,
  handleTokenSubmit,
  onLogout
}: ExamTokenScreenProps) {
  const ctx = useMemo(() => resolveClientContext(currentStudent), [currentStudent]);

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6 text-slate-800">
      <div className="text-center space-y-2">
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl w-fit mx-auto border border-indigo-100">
          <Lock className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full">
          {ctx.entityName} Terautentikasi
        </span>
        <h2 className="text-sm font-bold text-slate-900 font-sans">Verifikasi Sesi CBT {currentStudent.name}</h2>
        <p className="text-xs text-slate-550 max-w-sm mx-auto leading-relaxed font-semibold">
          Silakan masukkan Token Keamanan Ruangan aktif yang sedang ditampilkan oleh {ctx.supervisorLabel.toLowerCase()} di proyektor untuk mengunci sesi pengerjaan Anda.
        </p>
      </div>

      <form onSubmit={handleTokenSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Token Ruangan Aktif (6 Digit)</label>
          <input 
            type="text"
            placeholder="Masukkan 6 Digit Token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-teal-500 tracking-widest font-mono text-center text-lg font-bold text-slate-800"
          />
          <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[11px] text-slate-500 flex justify-between items-center">
            <span className="flex items-center gap-1 font-semibold">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              Petunjuk {ctx.supervisorLabel} (Reviewer Mode):
            </span>
            <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
              Token: {tokenInfo.token}
            </span>
          </div>
        </div>

        {tokenError && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-rose-800 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{tokenError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl transition-all"
          >
            Kembali Login
          </button>
          <button
            type="submit"
            className="flex-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            Konfirmasi Sesi
          </button>
        </div>
      </form>
    </div>
  );
}

