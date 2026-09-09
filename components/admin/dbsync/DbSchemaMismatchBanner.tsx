'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Copy, Check, RefreshCw, Code, Activity, ShieldAlert, Terminal, Zap, CheckCircle2 } from 'lucide-react';
import { 
  getAllKnownUnsupportedColumns, 
  generateSqlMigrationPatch, 
  clearKnownUnsupportedColumns, 
  getRecentSyncErrors, 
  runSupabaseDiagnosticProbe,
  supabase,
  SupabaseSyncError 
} from '@/lib/core/supabase';

interface DbSchemaMismatchBannerProps {
  onTriggerResync?: () => void;
}

export function DbSchemaMismatchBanner({ onTriggerResync }: DbSchemaMismatchBannerProps) {
  const [missingColsMap, setMissingColsMap] = useState<Record<string, string[]>>({});
  const [recentErrors, setRecentErrors] = useState<SupabaseSyncError[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixMsg, setAutoFixMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkMismatch = () => {
    const missing = getAllKnownUnsupportedColumns();
    setMissingColsMap(missing);
    setRecentErrors(getRecentSyncErrors());
  };

  useEffect(() => {
    checkMismatch();
    const interval = setInterval(checkMismatch, 2000);
    return () => clearInterval(interval);
  }, []);

  const tables = Object.keys(missingColsMap);
  const hasErrors = recentErrors.length > 0;

  const handleAutoFix = async () => {
    setIsAutoFixing(true);
    setAutoFixMsg(null);
    try {
      const sqlPatch = generateSqlMigrationPatch();
      const res = await fetch('/api/admin/auto-migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlPatch })
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setAutoFixMsg({
          type: 'success',
          text: 'Berhasil! Skema Supabase remote telah diperbarui otomatis. Cache di-reset.'
        });
        clearKnownUnsupportedColumns();
        setMissingColsMap({});
        setRecentErrors([]);
        if (supabase) {
          await runSupabaseDiagnosticProbe(supabase);
        }
        if (onTriggerResync) {
          onTriggerResync();
        }
      } else {
        const errMsg = data?.message || data?.error?.message || 'Gagal auto-migrate.';
        if (data?.error?.code === 'RPC_NOT_INSTALLED') {
          setAutoFixMsg({
            type: 'info',
            text: 'Fungsi auto-migrate (RPC) belum ada di Supabase. Salin SQL Patch di samping dan jalankan 1x di SQL Editor Supabase untuk mengaktifkan tombol ini.'
          });
        } else {
          setAutoFixMsg({ type: 'error', text: errMsg });
        }
      }
    } catch (err: any) {
      setAutoFixMsg({ type: 'error', text: err?.message || 'Koneksi ke backend auto-migrate gagal.' });
    } finally {
      setIsAutoFixing(false);
    }
  };

  if (tables.length === 0 && !hasErrors) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Status Skema Supabase: Terverifikasi Sinkron</h4>
            <p className="text-xs text-slate-400">Tidak ada perbedaan kolom atau batasan RLS yang terdeteksi saat ini.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isAutoFixing}
            onClick={handleAutoFix}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="Terapkan migrasi DDL otomatis ke Supabase sekarang"
          >
            {isAutoFixing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
            {isAutoFixing ? 'Memperbarui...' : '⚡ Auto-Fix Skema'}
          </button>
          <button
            type="button"
            disabled={isRunningDiag}
            onClick={async () => {
              if (!supabase) return;
              setIsRunningDiag(true);
              await runSupabaseDiagnosticProbe(supabase);
              checkMismatch();
              setIsRunningDiag(false);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? 'animate-spin' : ''}`} />
            {isRunningDiag ? 'Memeriksa...' : 'Diagnostik Ulang'}
          </button>
        </div>
      </div>
    );
  }

  const handleCopySql = () => {
    const sql = generateSqlMigrationPatch();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClearAndResync = () => {
    clearKnownUnsupportedColumns();
    setMissingColsMap({});
    setRecentErrors([]);
    if (onTriggerResync) {
      onTriggerResync();
    }
  };

  const handleRunDiagnostic = async () => {
    if (!supabase) return;
    setIsRunningDiag(true);
    await runSupabaseDiagnosticProbe(supabase);
    checkMismatch();
    setIsRunningDiag(false);
  };

  const generatedSql = generateSqlMigrationPatch();

  return (
    <div className="bg-amber-950/40 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 text-amber-100 animate-in fade-in duration-200 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <span>⚠️ Perbedaan Skema / Izin RLS Supabase Terdeteksi</span>
            </h4>
            <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
              Supabase cloud Anda mengembalikan peringatan skema. Klik tombol <strong>Auto-Fix Skema</strong> atau jalankan skrip patch SQL di SQL Editor Supabase.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            disabled={isAutoFixing}
            onClick={handleAutoFix}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isAutoFixing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
            {isAutoFixing ? 'Memperbarui...' : '⚡ Auto-Fix Skema'}
          </button>
          <button
            type="button"
            onClick={handleCopySql}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin SQL Patch'}
          </button>
          <button
            type="button"
            onClick={() => setShowSql(!showSql)}
            className="px-3 py-2 bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            {showSql ? 'Sembunyikan' : 'Lihat SQL'}
          </button>
        </div>
      </div>

      {/* AUTO FIX FEEDBACK BANNER */}
      {autoFixMsg && (
        <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
          autoFixMsg.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : autoFixMsg.type === 'info'
            ? 'bg-sky-950/60 border-sky-500/40 text-sky-200'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          {autoFixMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{autoFixMsg.text}</span>
        </div>
      )}

      {/* DETECTED MISSING COLUMNS BADGES */}
      {tables.length > 0 && (
        <div className="p-3 bg-slate-900/80 rounded-xl border border-amber-500/30 space-y-2">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            <span>Kolom Belum Dikenali di Supabase Remote:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tables.map((tbl) => (
              <div key={tbl} className="flex items-center gap-1.5 bg-amber-900/40 border border-amber-500/40 px-2.5 py-1 rounded-lg text-xs font-mono">
                <span className="font-bold text-amber-300">{tbl}:</span>
                <span className="font-semibold text-amber-100">
                  {missingColsMap[tbl].join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT DIAGNOSTIC ERRORS FROM SUPABASE */}
      {hasErrors && (
        <div className="p-3 bg-slate-900/80 rounded-xl border border-rose-500/30 space-y-2">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Log Respon / Error Supabase Cloud Terakhir:</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {recentErrors.map((err, idx) => (
              <div key={idx} className="p-2 bg-rose-950/40 border border-rose-800/50 rounded-lg text-[11px] font-mono flex items-start justify-between gap-2">
                <div>
                  <span className="text-amber-400 font-bold">[{err.table}]</span>{' '}
                  <span className="text-slate-300">{err.message}</span>
                </div>
                {err.code && (
                  <span className="px-1.5 py-0.5 bg-rose-900/60 text-rose-200 text-[10px] rounded shrink-0 font-bold">
                    Code: {err.code}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPANDABLE PREVIEW OF SQL PATCH */}
      {showSql && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
            <span>Skrip Migrasi DDL + RLS + Schema Reload:</span>
            <button
              onClick={handleCopySql}
              className="text-amber-400 hover:text-amber-200 underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Tersalin' : 'Salin Semua'}
            </button>
          </div>
          <pre className="p-3.5 bg-slate-950 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto border border-amber-500/30 leading-relaxed shadow-inner">
            {generatedSql}
          </pre>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/30 text-[11px]">
        <div className="text-amber-200/80 font-medium">
          Sudah menjalankan skrip SQL & RLS di Dashboard Supabase?
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isRunningDiag}
            onClick={handleRunDiagnostic}
            className="px-2.5 py-1.5 bg-amber-900/50 hover:bg-amber-900 text-amber-200 border border-amber-500/40 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Activity className={`w-3 h-3 text-amber-400 ${isRunningDiag ? 'animate-spin' : ''}`} />
            Diagnostik Ulang
          </button>
          <button
            type="button"
            onClick={handleClearAndResync}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3 h-3 text-slate-950" />
            Reset Cache & Re-Sync
          </button>
        </div>
      </div>
    </div>
  );
}
