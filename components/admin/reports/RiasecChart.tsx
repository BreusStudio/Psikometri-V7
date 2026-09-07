'use client';

import React from 'react';

interface RiasecChartProps {
  scores: Record<string, number>;
}

export default function RiasecChart({ scores }: RiasecChartProps) {
  const maxVal = 10;
  const categories = [
    { key: 'R', label: 'Realistic (R)', color: '#ef4444' },
    { key: 'I', label: 'Investigative (I)', color: '#3b82f6' },
    { key: 'A', label: 'Artistic (A)', color: '#ec4899' },
    { key: 'S', label: 'Social (S)', color: '#10b981' },
    { key: 'E', label: 'Enterprising (E)', color: '#f59e0b' },
    { key: 'C', label: 'Conventional (C)', color: '#6366f1' }
  ];

  return (
    <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-300/80 text-left animate-fade-in w-full overflow-hidden">
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const val = scores[cat.key] || 0;
          const pct = Math.max(5, (val / maxVal) * 100);
          return (
            <div key={cat.key} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wide gap-1">
                <span className="truncate max-w-[180px] sm:max-w-none">{cat.label}</span>
                <span className="font-mono text-slate-800 shrink-0">{val} / 10</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full transition-all duration-700" 
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
