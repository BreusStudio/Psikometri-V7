'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface DbSyncResetModalProps {
  isOpen: boolean;
  resetInput: string;
  resetError: string;
  isProcessing: boolean;
  onClose: () => void;
  onInputChange: (val: string) => void;
  onConfirmReset: () => void;
}

export function DbSyncResetModal({
  isOpen,
  resetInput,
  resetError,
  isProcessing,
  onClose,
  onInputChange,
  onConfirmReset
}: DbSyncResetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold text-base">Konfirmasi Reset Total Database</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-rose-700 text-rose-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-slate-700 text-xs">
          <p className="font-medium text-slate-800">
            Tindakan ini akan <strong className="text-rose-600">MENGHAPUS SELURUH DATA LOKAL & LOG SINKRONISASI</strong> pada browser Anda dan mengembalikan ke data awal pabrik.
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-800">
            <p className="font-bold">Ketik teks di bawah ini untuk mengonfirmasi:</p>
            <p className="font-mono text-sm font-bold tracking-wider select-all text-rose-900">RESET TOTAL</p>
          </div>

          <input
            type="text"
            value={resetInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ketik RESET TOTAL"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />

          {resetError && (
            <p className="text-rose-600 font-bold text-center">{resetError}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              onClick={onConfirmReset}
              disabled={isProcessing || resetInput !== 'RESET TOTAL'}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mereset Data...
                </>
              ) : (
                'Hapus & Reset Total'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
