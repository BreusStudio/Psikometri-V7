'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuotaNotificationProps {
  quota: {
    remaining: number;
    total: number;
    used: number;
    purchased: number;
  };
}

export default function QuotaNotification({ quota }: QuotaNotificationProps) {
  const percentageUsed = Math.round((quota.used / quota.total) * 100) || 0;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-3xl animate-pulse"></div>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wide flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Paket Counselor Aktif
          </span>
        </div>
        <h3 className="text-sm font-bold text-indigo-200">Sisa Kuota Ujian CBT</h3>
        <p className="text-2xl font-black font-mono tracking-wide mt-1">
          {quota.remaining} / {quota.total} <span className="text-xs text-slate-400 font-medium">Akun / User Tersedia</span>
        </p>
      </div>
      <div className="flex-1 max-w-xs w-full">
        <div className="flex justify-between text-[10px] text-slate-300 mb-1">
          <span>Kuota Terpakai: {quota.used} Akun</span>
          <span>{percentageUsed}%</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
          <div 
            className="bg-indigo-400 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${percentageUsed}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
