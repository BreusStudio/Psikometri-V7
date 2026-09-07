'use client';

import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

interface InteractiveChartsProps {
  riasecData: any[];
  completionData: any[];
  completedCount: number;
  onSelectFilter: (filter: {
    type: 'all' | 'major' | 'riasec' | 'status' | 'troubled' | 'locked';
    value: string;
    label: string;
  }) => void;
}

export default function InteractiveCharts({
  riasecData,
  completionData,
  completedCount,
  onSelectFilter
}: InteractiveChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* 1. SEBARAN MINAT KARIR RIASEC (INTERACTIVE BAR/PIE) */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[400px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono text-left">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Grafik Interaktif Sebaran Minat Karir Dominan (RIASEC)
          </h3>
          <p className="text-xs text-slate-400 mt-1 text-left">Sangat informatif. Tekan salah satu batang atau warna di grafik untuk melihat detail siswa yang memiliki minat dominan tersebut.</p>
        </div>

        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riasecData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs font-mono space-y-1 text-left">
                        <p className="font-bold">{data.name} ({data.key})</p>
                        <p className="text-[10px] text-indigo-300">{data.desc}</p>
                        <p className="font-bold text-emerald-400">{data.value} Peserta</p>
                        <p className="text-[9px] text-slate-400 italic">Klik batang untuk menyaring peserta</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                onClick={(data: any) => {
                  if (data) {
                    onSelectFilter({
                      type: 'riasec',
                      value: data.key,
                      label: `Peserta Berbakat Dominan ${data.name} (${data.key})`
                    });
                  }
                }}
                className="cursor-pointer"
              >
                {riasecData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RIASEC Legend indicators */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 justify-center">
          {riasecData.map(entry => (
            <button
              type="button"
              key={entry.key}
              onClick={() => onSelectFilter({ type: 'riasec', value: entry.key, label: `Peserta Berbakat Dominan ${entry.name} (${entry.key})` })}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 bg-slate-50 border hover:bg-slate-100 px-2.5 py-1 rounded-full cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.key}: {entry.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. CBT PROGRESS DONUT CHART (INTERACTIVE) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[400px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide font-mono text-left">
            <Activity className="w-4 h-4 text-indigo-600" /> Rasio Kehadiran CBT
          </h3>
          <p className="text-xs text-slate-400 mt-1 text-left">Rasio penyelesaian lembar kerja.</p>
        </div>

        <div className="h-48 w-full relative flex items-center justify-center mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(data: any) => {
                  if (data) {
                    onSelectFilter({
                      type: 'status',
                      value: data.name,
                      label: `Peserta CBT Berstatus: ${data.name}`
                    });
                  }
                }}
                className="cursor-pointer"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded shadow text-xs font-mono text-left">
                        <span className="font-bold">{payload[0].name}: {payload[0].value} Peserta</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-800">{completedCount}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Selesai</span>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
          {completionData.map(item => (
            <button
              type="button"
              key={item.name}
              onClick={() => onSelectFilter({ type: 'status', value: item.name, label: `Peserta CBT Berstatus: ${item.name}` })}
              className="flex justify-between items-center w-full px-2 py-1 hover:bg-slate-50 rounded cursor-pointer"
            >
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="font-bold text-slate-800 font-mono">{item.value} Peserta</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
