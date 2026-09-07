'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App-level error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white text-center" id="error-boundary-view">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-red-400" id="error-title">Terjadi Kendala Sistem</h2>
        <p className="text-sm text-slate-300" id="error-desc">
          Sistem mendeteksi kendala pada pemrosesan antarmuka. Silakan coba muat ulang halaman.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition"
            id="reset-error-btn"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium text-sm transition"
            id="reload-page-btn"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    </div>
  );
}
