'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-xl font-bold text-red-400">Terjadi Kendala Sistem</h2>
          <p className="text-sm text-slate-300">
            Sistem mendeteksi kendala pada pemrosesan root layout.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition"
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
