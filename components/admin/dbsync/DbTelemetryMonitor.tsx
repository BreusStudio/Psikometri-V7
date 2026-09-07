'use client';

import React, { useState, useEffect } from 'react';
import { Database, Activity, RefreshCw, Zap, ShieldCheck, Server, ArrowUpRight } from 'lucide-react';
import { syncManager, SyncMetrics } from '@/lib/api/syncManager';

interface QueryLogItem {
  id: string;
  query: string;
  duration: number;
  status: 'SUCCESS' | 'ERROR';
  timestamp: string;
}

interface DbTelemetryMonitorProps {
  dbLatency: number;
  dbActiveConnections: number;
  dbQueueSize: number;
  queryLog: QueryLogItem[];
}

export default function DbTelemetryMonitor({
  dbLatency,
  dbActiveConnections,
  dbQueueSize,
  queryLog
}: DbTelemetryMonitorProps) {
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>(syncManager.getMetrics());
  const [logFilter, setLogFilter] = useState<'all' | 'SUCCESS' | 'ERROR'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setSyncMetrics(syncManager.getMetrics());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredLogs = queryLog.filter((log) => {
    if (logFilter === 'all') return true;
    return log.status === logFilter;
  });

  return (
    <div className="space-y-4" id="db-monitoring-panel">
      {/* TOP METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* LATENCY METRIC */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DB Latency (Ping)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl font-black text-slate-800">{dbLatency}</span>
            <span className="text-xs font-bold text-slate-400">ms</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Status Respon</span>
            <span className={`font-bold ${dbLatency < 35 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {dbLatency < 35 ? '● Sangat Cepat' : '● Normal'}
            </span>
          </div>
        </div>

        {/* CONNECTION POOL USAGE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pool Koneksi</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-slate-800">{dbActiveConnections}</span>
            <span className="text-xs font-bold text-slate-400">/ 20 Aktif</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(dbActiveConnections / 20) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* HYBRID BATCH QUEUE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Antrian Sync Client</span>
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-black text-slate-800">{syncMetrics.queueLength + dbQueueSize}</span>
            <span className="text-xs font-bold text-slate-400">Item Pending</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Batch Interval</span>
            <span className="font-mono font-bold text-indigo-600">5s (Smart Jitter)</span>
          </div>
        </div>

        {/* HYBRID HEALTH STATUS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Engine Sync Mode</span>
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-black text-slate-800">Controlled Hybrid</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">Synced: {syncMetrics.totalSynced}</span>
            <span className="text-emerald-600 font-bold font-mono">Zero Loss</span>
          </div>
        </div>

      </div>

      {/* REALTIME QUERY MONITOR PANEL */}
      <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 md:p-5 shadow-lg text-white space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-200">
              Live Database Query & Sync Monitor
            </h3>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[9px] font-mono">
              <button
                onClick={() => setLogFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors ${logFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Semua ({queryLog.length})
              </button>
              <button
                onClick={() => setLogFilter('SUCCESS')}
                className={`px-2 py-0.5 rounded transition-colors ${logFilter === 'SUCCESS' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Sukses
              </button>
              <button
                onClick={() => setLogFilter('ERROR')}
                className={`px-2 py-0.5 rounded transition-colors ${logFilter === 'ERROR' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Error
              </button>
            </div>

            <span className="text-[9px] font-mono text-slate-400 hidden sm:inline-block">
              Auto-Scroll: On
            </span>
          </div>
        </div>

        <div className="space-y-1.5 font-mono text-[10px] max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 italic">Belum ada log query tercatat...</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors gap-3"
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0">
                  <span className="text-slate-500 shrink-0 text-[9px]">[{log.timestamp}]</span>
                  <span className="text-slate-200 truncate font-mono text-[10px]">{log.query}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-bold text-[10px]">{log.duration}ms</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border font-mono ${
                    log.status === 'SUCCESS' 
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-[10px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-800/80 pt-2.5 gap-1 font-mono">
          <span className="flex items-center gap-2">
            <span className="text-slate-500">Konektor:</span>
            <span className="text-indigo-400 font-semibold">PostgreSQL REST Engine (Pooler Mode)</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-500">Terakhir Sync:</span>
            <span className="text-emerald-400 font-bold">{syncMetrics.lastSyncTime ? new Date(syncMetrics.lastSyncTime).toLocaleTimeString() : 'Realtime Active'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
