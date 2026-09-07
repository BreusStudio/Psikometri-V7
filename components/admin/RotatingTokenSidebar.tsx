'use client';

import React, { useState, useEffect } from 'react';
import { getRotatingToken } from '../../lib/mockData';

export default function RotatingTokenSidebar() {
  const [tokenInfo, setTokenInfo] = useState(() => getRotatingToken());

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenInfo(getRotatingToken());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/35 p-3 rounded-xl border border-slate-800/50 space-y-1.5 text-center animate-fade-in">
      <span className="text-[9px] font-bold text-indigo-400 font-mono tracking-wider block uppercase">Token Rotasi Ujian</span>
      <span className="text-sm font-black tracking-widest text-white font-mono block bg-slate-900 py-1.5 rounded-lg border border-slate-800">{tokenInfo.token}</span>
      <span className="text-[9px] font-bold text-slate-500 block font-mono">Segarkan: {tokenInfo.secondsLeft}s</span>
    </div>
  );
}
