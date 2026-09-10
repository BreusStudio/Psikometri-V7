import React from 'react';
import { Cpu, Check, AlertCircle } from 'lucide-react';

interface EnvironmentSectionProps {
  appEnv: 'development' | 'production';
  validationStrategy: 'fast_dev' | 'strict_build';
  handleSaveEnvSettings: (env: 'development' | 'production', strategy: 'fast_dev' | 'strict_build') => void;
}

export const EnvironmentSection: React.FC<EnvironmentSectionProps> = ({
  appEnv,
  validationStrategy,
  handleSaveEnvSettings
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6 text-left">
      <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl shrink-0">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Mode Lingkungan (Environment) & Strategi Dev</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              appEnv === 'development' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}>
              {appEnv.toUpperCase()} MODE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur mode operasional sistem untuk mengomunikasikan status pengkodean, validasi instan, dan optimasi siklus iterasi.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mode Switcher Card */}
        <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Status Operasional Aplikasi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSaveEnvSettings('development', validationStrategy)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                appEnv === 'development'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Development Mode
                </span>
                {appEnv === 'development' && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Fokus pada kecepatan iterasi & AI Assistant. Perubahan kode divalidasi dengan linter instan tanpa overhead static build.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSaveEnvSettings('production', validationStrategy)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                appEnv === 'production'
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Production Mode
                </span>
                {appEnv === 'production' && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Stabil & siap rilis. Semua aset diproduksi secara teroptimasi untuk end-user, guru, dan peserta ujian CBT.
              </p>
            </button>
          </div>
        </div>

        {/* Validation Strategy Card */}
        <div className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Strategi Validasi AI & Build Code
          </h3>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="radio"
                name="valStrategy"
                checked={validationStrategy === 'fast_dev'}
                onChange={() => handleSaveEnvSettings(appEnv, 'fast_dev')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Dynamic Linter & Instant Validation (Direkomendasikan)</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Memvalidasi syntax & tipe data secara instan via lint_applet (1-3 detik), menghindari penundaan build container yang memakan waktu lama.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="radio"
                name="valStrategy"
                checked={validationStrategy === 'strict_build'}
                onChange={() => handleSaveEnvSettings(appEnv, 'strict_build')}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-800">Full Production Static Compilation</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Melakukan compile_applet lengkap. Gunakan opsi ini saat mendekati rilis akhir aplikasi.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Information Banner */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed font-medium">
            <span className="font-bold block mb-0.5">Panduan AI Studio Development Mode:</span>
            Next.js App Router di Cloud Run container menyajikan perubahan kode secara otomatis melalui dev server internal. Saat melakukan diskusi atau iterasi fitur, pastikan mode berada di <strong className="font-bold">Development Mode</strong> agar respon dan validasi kode berlangsung super cepat.
          </div>
        </div>
      </div>
    </div>
  );
};
