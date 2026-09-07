'use client';

import React, { useState } from 'react';
import { Code, Copy, Check, X } from 'lucide-react';

interface DbSyncSqlScriptModalProps {
  isOpen: boolean;
  sqlScript: string;
  onClose: () => void;
}

export function DbSyncSqlScriptModal({
  isOpen,
  sqlScript,
  onClose
}: DbSyncSqlScriptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">Skrip Inisialisasi SQL Supabase Schema</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin!' : 'Salin Skrip SQL'}
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 overflow-y-auto flex-1 font-mono text-[11px] text-emerald-400 leading-relaxed select-all">
          <pre className="whitespace-pre-wrap">{sqlScript}</pre>
        </div>
      </div>
    </div>
  );
}
