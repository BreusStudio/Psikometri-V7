'use client';

import React from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TokenRotatorCardProps {
  activeToken: { token: string; secondsLeft: number };
  completedCount: number;
  totalStudents: number;
  lockedCount: number;
  troubledCount: number;
  onSelectFilter: (filter: {
    type: 'all' | 'major' | 'riasec' | 'status' | 'troubled' | 'locked';
    value: string;
    label: string;
  }) => void;
}

export default function TokenRotatorCard({
  activeToken,
  completedCount,
  totalStudents,
  lockedCount,
  troubledCount,
  onSelectFilter
}: TokenRotatorCardProps) {
  const percentageCompleted = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* ACCESS TOKEN ROTATOR */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-teal-500 opacity-10 rounded-full blur-2xl"></div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-semibold text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Keamanan CBT
            </span>
            <div className="flex items-center text-slate-400 text-xs gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Rotasi 15m</span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-300 text-left">Token Akses CBT</h3>
          <p className="text-3xl font-mono font-bold text-teal-300 tracking-widest mt-2 text-left">{activeToken.token}</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Berganti dalam:</span>
          <span className="text-teal-400 font-bold">
            {Math.floor(activeToken.secondsLeft / 60)}m {activeToken.secondsLeft % 60}s
          </span>
        </div>
      </div>

      {/* QUICK STATS: PROGRESS */}
      <button 
        type="button"
        onClick={() => onSelectFilter({ type: 'status', value: 'Selesai', label: 'Peserta Selesai Ujian' })}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between text-left hover:border-indigo-300 transition-all cursor-pointer group"
      >
        <div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Ujian Selesai
          </span>
          <h3 className="text-sm font-medium text-slate-600 mt-4">Peserta Menyelesaikan</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {completedCount} <span className="text-sm text-slate-400 font-medium">/ {totalStudents} User</span>
          </p>
        </div>
        <div className="mt-4 w-full">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${percentageCompleted}%` }}
            ></div>
          </div>
        </div>
      </button>

      {/* ANTI-CHEAT ALERT */}
      <button 
        type="button"
        onClick={() => onSelectFilter({ type: 'locked', value: 'locked', label: 'Peserta Terkunci (Cheating)' })}
        className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm flex flex-col justify-between text-left hover:bg-amber-100/50 transition-colors cursor-pointer group w-full"
      >
        <div>
          <div className="flex items-center gap-2 text-amber-800 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-100/80 px-2.5 py-1 rounded-full">
              Pengawasan CBT
            </span>
          </div>
          <h3 className="text-sm font-medium text-amber-800 font-semibold">Terkunci (Keluar Tab)</h3>
          <p className="text-3xl font-bold text-amber-700 mt-2 font-mono">
            {lockedCount} <span className="text-xs text-amber-600 font-medium">Peserta Terkunci</span>
          </p>
        </div>
        <div className="text-xs text-amber-700/80 font-mono flex items-center justify-between mt-4 w-full">
          <span>Klik untuk buka kunci peserta</span>
          <span className="font-semibold underline">Security Active</span>
        </div>
      </button>

      {/* RISIKO DETEKSI COUNSELOR */}
      <button 
        type="button"
        onClick={() => onSelectFilter({ type: 'troubled', value: 'troubled', label: 'Peserta Potensi Risiko' })}
        className="bg-rose-50 rounded-2xl p-6 border border-rose-200 shadow-sm flex flex-col justify-between text-left hover:bg-rose-100/50 transition-colors cursor-pointer group w-full"
      >
        <div>
          <div className="flex items-center gap-2 text-rose-800 mb-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider bg-rose-100/80 px-2.5 py-1 rounded-full">
              Layanan Konseling / HR
            </span>
          </div>
          <h3 className="text-sm font-medium text-rose-800 font-semibold">Peserta Potensi Risiko (IQ/EQ Rendah)</h3>
          <p className="text-3xl font-bold text-rose-700 mt-2 font-mono">
            {troubledCount} <span className="text-xs text-rose-600 font-medium">Peserta Risiko</span>
          </p>
        </div>
        <div className="text-xs text-rose-700/80 font-mono flex items-center justify-between mt-4 w-full">
          <span>Klik untuk intervensi konseling</span>
          <span className="font-semibold underline">Deteksi Risiko</span>
        </div>
      </button>
    </div>
  );
}
