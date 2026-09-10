import React from 'react';
import { Key, Database, Cpu, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ServerCredentialsSectionProps {
  isLoadingConfig: boolean;
  configError: string | null;
  configSuccess: string | null;
  supabaseUrl: string;
  setSupabaseUrl: (val: string) => void;
  supabaseAnonKey: string;
  setSupabaseAnonKey: (val: string) => void;
  showAnonKey: boolean;
  setShowAnonKey: (val: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  showAdminPasswordInput: boolean;
  setShowAdminPasswordInput: (val: boolean) => void;
  adminPasswordInput: string;
  setAdminPasswordInput: (val: string) => void;
  isSavingConfig: boolean;
  handleSaveCredentials: () => Promise<void>;
}

export const ServerCredentialsSection: React.FC<ServerCredentialsSectionProps> = ({
  isLoadingConfig,
  configError,
  configSuccess,
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  showAnonKey,
  setShowAnonKey,
  geminiApiKey,
  setGeminiApiKey,
  showApiKey,
  setShowApiKey,
  showAdminPasswordInput,
  setShowAdminPasswordInput,
  adminPasswordInput,
  setAdminPasswordInput,
  isSavingConfig,
  handleSaveCredentials
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6 text-left">
      <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
        <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl shrink-0">
          <Key className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Konfigurasi Kredensial Supabase & Gemini (Superadmin Only)</h2>
          <p className="text-xs text-slate-500 mt-1">Kredensial disimpan secara aman di sisi server untuk menghubungkan data bank soal ke Supabase dan mengaktifkan Gemini AI.</p>
        </div>
      </div>

      {isLoadingConfig ? (
        <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Memuat konfigurasi server...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {configError && (
            <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{configError}</span>
            </div>
          )}

          {configSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{configSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              Supabase URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="https://your-project.supabase.co"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              Supabase Anon Key
            </label>
            <div className="relative">
              <input
                type={showAnonKey ? "text" : "password"}
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="your-supabase-anon-key"
              />
              <button
                type="button"
                onClick={() => setShowAnonKey(!showAnonKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showAnonKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="AIzaSy..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {!showAdminPasswordInput ? (
            <button
              type="button"
              onClick={() => setShowAdminPasswordInput(true)}
              className="w-full text-xs font-bold py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg transition-all shadow-md active:scale-[0.99] mt-2 cursor-pointer"
            >
              Simpan Kredensial Server
            </button>
          ) : (
            <div className="p-4 bg-indigo-50 border border-indigo-150 rounded-lg space-y-3 mt-4 animate-fade-in">
              <span className="text-[10px] font-black uppercase text-indigo-950 block tracking-wider">Konfirmasi Keamanan:</span>
              <p className="text-[10px] text-indigo-900 leading-relaxed font-medium">
                Silakan masukkan password akun Superadmin/Admin Anda untuk memverifikasi penyimpanan kredensial server.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Password..."
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSavingConfig}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isSavingConfig ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Terapkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordInput(false);
                    setAdminPasswordInput('');
                  }}
                  className="px-3 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 shrink-0 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
