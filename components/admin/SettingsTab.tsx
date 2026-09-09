'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Clock, 
  AlertCircle, 
  Key, 
  Eye, 
  EyeOff, 
  Database, 
  Cpu, 
  Check, 
  Loader2, 
  Award, 
  CreditCard, 
  Settings as SettingsIcon,
  Package as PackageIcon,
  RefreshCw,
  Shield,
  Sparkles,
  Shuffle,
  ShieldCheck
} from 'lucide-react';
import { TestSettings } from '../../lib/types';
import { isSupabaseConfigured } from '../../lib/supabase';

// Reusable, Symmetrical, Space-Saving Setting Toggle Row (DRY & Ergonomic)
function SettingToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  badge,
  disabled = false
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
      checked ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'
    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="space-y-0.5 text-left flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {icon && <span className="text-indigo-600 shrink-0">{icon}</span>}
          <h4 className="text-xs font-bold text-slate-800">{title}</h4>
          {badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 font-medium leading-normal">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}




interface SettingsTabProps {
  testSettings: TestSettings;
  handleToggleSetting: (key: keyof TestSettings) => void;
  handleUpdateSetting: (key: keyof TestSettings, val: any) => void;
  session: { role: string; id: string; name: string; password?: string; };
  store: any; // PsychometricStore
  onRefresh: () => void;
}

export default function SettingsTab({
  testSettings,
  handleToggleSetting,
  handleUpdateSetting,
  session,
  store,
  onRefresh
}: SettingsTabProps) {
  // Determine allowed sub-tabs based on role
  const allowedSubTabs = React.useMemo(() => {
    return [
      { id: 'cbt', name: 'Kontrol CBT & Ujian', icon: <Sliders className="w-4 h-4" /> },
      { id: 'kredensial', name: 'Kredensial Server', icon: <Key className="w-4 h-4" /> },
      { id: 'env', name: 'Mode Lingkungan (Environment)', icon: <Cpu className="w-4 h-4" /> }
    ];
  }, []);

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // App Environment State
  const [appEnv, setAppEnv] = useState<'development' | 'production'>(() => {
    if (typeof window !== 'undefined') {
      const savedEnv = localStorage.getItem('cbt_app_env') as 'development' | 'production';
      if (savedEnv) return savedEnv;
    }
    return 'development';
  });
  
  const [validationStrategy, setValidationStrategy] = useState<'fast_dev' | 'strict_build'>(() => {
    if (typeof window !== 'undefined') {
      const savedStrat = localStorage.getItem('cbt_val_strategy') as 'fast_dev' | 'strict_build';
      if (savedStrat) return savedStrat;
    }
    return 'fast_dev';
  });

  const handleSaveEnvSettings = (newEnv: 'development' | 'production', newStrat: 'fast_dev' | 'strict_build') => {
    setAppEnv(newEnv);
    setValidationStrategy(newStrat);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cbt_app_env', newEnv);
      localStorage.setItem('cbt_val_strategy', newStrat);
      window.dispatchEvent(new Event('appEnvChanged'));
    }
    showToast(`Mode Lingkungan diperbarui ke ${newEnv.toUpperCase()}`);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya',
    isDanger: false,
    onConfirm: () => {}
  });
  const [activeSubTab, setActiveSubTab] = useState('cbt');
  const [cbtCategory, setCbtCategory] = useState<'modules' | 'anticheat' | 'ai'>('modules');
  const [showCreds, setShowCreds] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showServiceRole, setShowServiceRole] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPasswordInput, setShowAdminPasswordInput] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [quotaInput, setQuotaInput] = useState(0);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError('');
    setConfigSuccess('');
    setIsSavingConfig(true);

    const passwordToUse = adminPasswordInput || session.password || '';
    if (!passwordToUse) {
      setConfigError('Password admin diperlukan untuk mengonfirmasi perubahan ini.');
      setIsSavingConfig(false);
      return;
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl,
          supabaseAnonKey,
          geminiApiKey: geminiApiKey === '••••••••••••••••••••••••••••••••' ? undefined : geminiApiKey,
          teacherId: session.id,
          password: passwordToUse
        })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text.slice(0, 100) || res.statusText || 'Response non-JSON diterima.');
      }

      if (res.ok && data.success) {
        setConfigSuccess(data.message || 'Konfigurasi berhasil disimpan!');
        showToast('Kredensial berhasil disimpan di server');
        setAdminPasswordInput('');
        setShowAdminPasswordInput(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setConfigError(data.error || 'Gagal menyimpan konfigurasi.');
      }
    } catch (err) {
      console.error(err);
      setConfigError('Koneksi bermasalah atau gagal menghubungi server.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* COCKPIT HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="text-left">
          <span className="text-[10px] font-bold font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Kontrol Pusat CBT
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Pengaturan & Sistem</h2>
          <p className="text-slate-500 text-xs mt-1">
            Pusat konfigurasi sub-tes kognitif, durasi, template sertifikat kelulusan, voucher lisensi sekolah, harga paket, dan integrasi server database.
          </p>
        </div>

        {/* Dynamic sub-tab bar inside settings */}
        <div className="flex flex-wrap sm:flex-nowrap bg-slate-100 p-1 rounded-xl gap-1 w-full md:w-auto">
          {allowedSubTabs.map((subTab) => (
            <button
              key={subTab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(subTab.id);
                if (subTab.id === 'system-db') {
                  setQuotaInput(store.getQuotaInfo().purchased);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap min-h-[38px] ${
                activeSubTab === subTab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              {subTab.icon}
              <span className="truncate">{subTab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-xl z-50 animate-fade-in font-bold text-sm">
          {toastMessage}
        </div>
      )}
      {/* RENDER ACTIVE TAB */}
      
      {/* 1. CBT EXAM SETTINGS */}
      {activeSubTab === 'cbt' && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-5 text-left">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Kontrol CBT, Anti-Kecurangan & AI</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola parameter butir soal, proteksi smartphone, dan otomatisasi evaluasi AI.</p>
              </div>
            </div>

            {/* Sub-Category Pills (Mobile-First Ergonomic Nav) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setCbtCategory('modules')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  cbtCategory === 'modules'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Modul & Soal</span>
              </button>

              <button
                type="button"
                onClick={() => setCbtCategory('anticheat')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  cbtCategory === 'anticheat'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Anti-Kecurangan</span>
              </button>

              <button
                type="button"
                onClick={() => setCbtCategory('ai')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  cbtCategory === 'ai'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI & Konseling</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: MODUL & SOAL */}
          {cbtCategory === 'modules' && (
            <div className="space-y-4 animate-fade-in">
              {/* Randomization Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SettingToggleRow
                  icon={<Shuffle className="w-4 h-4" />}
                  title="Acak Urutan Soal Ujian"
                  description="Butir soal diacak deterministik per peserta untuk mencegah contek-mencontek."
                  checked={!!testSettings.randomizeQuestions}
                  onChange={(val) => handleUpdateSetting('randomizeQuestions', val)}
                />

                <SettingToggleRow
                  icon={<Shuffle className="w-4 h-4" />}
                  title="Acak Opsi Pilihan Jawaban"
                  description="Pilihan A, B, C, D diacak posisinya agar kunci jawaban tidak dapat dibocorkan."
                  checked={!!testSettings.randomizeChoices}
                  onChange={(val) => handleUpdateSetting('randomizeChoices', val)}
                />
              </div>

              {/* Number of Questions Limits, Duration & Pricing */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      Batas Soal, Durasi & Tarif Per-Peserta (Real-time Supabase)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Atur limit butir soal, alokasi menit pengerjaan, dan tarif dasar paket siswa per sub-tes.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {(store?.getTestTypes ? store.getTestTypes() : []).map((tt: any) => {
                    const currentLimit = tt.questionLimit ?? tt.totalQuestions ?? 0;
                    const currentDuration = tt.duration ?? tt.durationMinutes ?? 15;
                    const currentPrice = tt.pricePerUser ?? 0;
                    return (
                      <div key={tt.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-800 truncate block max-w-[140px]">
                            {tt.name}
                          </label>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase">
                            {tt.scoringEngine || 'standard'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Soal</span>
                            <input
                              type="number"
                              min="0"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                              value={currentLimit || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                store.saveTestType({
                                  ...tt,
                                  questionLimit: val,
                                  totalQuestions: val
                                });
                                if (tt.id === 'IQ') handleUpdateSetting('iqLimit', val);
                                if (tt.id === 'EQ') handleUpdateSetting('eqLimit', val);
                                if (tt.id === 'Holland') handleUpdateSetting('hollandLimit', val);
                                if (tt.id === 'Kepribadian') handleUpdateSetting('kepribadianLimit', val);
                                if (tt.id === 'Validitas') handleUpdateSetting('validitasLimit', val);
                                onRefresh();
                              }}
                              placeholder="10"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Menit</span>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                              value={currentDuration || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 15;
                                store.saveTestType({
                                  ...tt,
                                  duration: val,
                                  durationMinutes: val
                                });
                                if (tt.id === 'IQ') handleUpdateSetting('iqDuration', val);
                                if (tt.id === 'EQ') handleUpdateSetting('eqDuration', val);
                                if (tt.id === 'Holland') handleUpdateSetting('hollandDuration', val);
                                if (tt.id === 'Kepribadian') handleUpdateSetting('kepribadianDuration', val);
                                if (tt.id === 'Validitas') handleUpdateSetting('validitasDuration', val);
                                onRefresh();
                              }}
                              placeholder="15"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase block mb-0.5">Tarif (Rp)</span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              className="w-full bg-indigo-50/50 border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-mono"
                              value={currentPrice || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                store.saveTestType({
                                  ...tt,
                                  pricePerUser: val
                                });
                                onRefresh();
                              }}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ANTI-KECURANGAN MOBILE */}
          {cbtCategory === 'anticheat' && (
            <div className="space-y-4 animate-fade-in">
              <SettingToggleRow
                icon={<Shield className="w-4 h-4 text-indigo-600" />}
                title="Master Switch Pengawasan Anti-Kecurangan"
                description="Aktifkan proteksi keamanan ujian saat dikerjakan via smartphone atau laptop."
                checked={testSettings.enableAntiCheat !== false}
                onChange={(val) => handleUpdateSetting('enableAntiCheat', val)}
                badge={testSettings.enableAntiCheat !== false ? 'Aktif' : 'Nonaktif'}
              />

              {testSettings.enableAntiCheat !== false ? (
                <div className="space-y-4 pt-1">
                  {/* Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateSetting('proctoringMode', 'AUDIT_ONLY')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        (testSettings.proctoringMode || 'AUDIT_ONLY') === 'AUDIT_ONLY'
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Check className={`w-3.5 h-3.5 ${(testSettings.proctoringMode || 'AUDIT_ONLY') === 'AUDIT_ONLY' ? 'opacity-100' : 'opacity-0'}`} />
                          Mode Audit Transparan
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">Rekomendasi</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Peringatan dikirim & pelanggaran dicatat di log audit tanpa mengunci layar ujian siswa saat ada notifikasi masuk.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateSetting('proctoringMode', 'STRICT')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        testSettings.proctoringMode === 'STRICT'
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <Check className={`w-3.5 h-3.5 ${testSettings.proctoringMode === 'STRICT' ? 'opacity-100' : 'opacity-0'}`} />
                          Mode Ketat (Strict Lockout)
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">Seleksi Resmi</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Sistem mengunci ujian (Lockout) setelah melebihi batas batas toleransi pelanggaran dan mewajibkan reset proktor.
                      </p>
                    </button>
                  </div>

                  {/* Symmetrical Grid of Feature Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <SettingToggleRow
                      title="Paksa Layar Penuh (Fullscreen)"
                      description="Kunci browser ke mode layar penuh saat pengerjaan soal berlangsung."
                      checked={testSettings.enableFullscreenLock !== false}
                      onChange={(val) => handleUpdateSetting('enableFullscreenLock', val)}
                    />

                    <SettingToggleRow
                      title="Deteksi Pindah Tab & Aplikasi"
                      description="Deteksi siswa saat membuka WhatsApp, browser, atau aplikasi lain di smartphone."
                      checked={testSettings.enableTabSwitchDetection !== false}
                      onChange={(val) => handleUpdateSetting('enableTabSwitchDetection', val)}
                    />

                    <SettingToggleRow
                      title="Blokir Copy-Paste & Klik Kanan"
                      description="Kunci seleksi teks dan klik kanan/long-press untuk mencegah pembocoran soal."
                      checked={testSettings.disableCopyPaste !== false}
                      onChange={(val) => handleUpdateSetting('disableCopyPaste', val)}
                    />

                    <SettingToggleRow
                      title="Blokir Screenshot & DevTools"
                      description="Cegah tombol tangkapan layar (PrintScreen) dan akses Developer Console."
                      checked={testSettings.enableDevToolsProtection !== false}
                      onChange={(val) => handleUpdateSetting('enableDevToolsProtection', val)}
                    />
                  </div>

                  {/* Toleransi Batas Switch Layar */}
                  {testSettings.proctoringMode === 'STRICT' && (
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-amber-900">Batas Toleransi Pelanggaran Pindah Layar</p>
                        <p className="text-[10px] text-amber-700">Maksimal berapa kali siswa boleh keluar layar sebelum akun otomatis terkunci.</p>
                      </div>
                      <select
                        value={testSettings.maxAllowedTabSwitches || 3}
                        onChange={(e) => handleUpdateSetting('maxAllowedTabSwitches', Number(e.target.value))}
                        className="bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 shrink-0"
                      >
                        <option value={1}>1 Kali (Sangat Ketat)</option>
                        <option value={2}>2 Kali</option>
                        <option value={3}>3 Kali (Standar)</option>
                        <option value={5}>5 Kali (Toleransi Tinggi)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium">
                    Sistem pengawasan dinonaktifkan. Siswa dapat mengerjakan ujian tanpa batasan perpindahan tab atau penguncian layar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: AI & KONSELING */}
          {cbtCategory === 'ai' && (
            <div className="space-y-4 animate-fade-in">
              <SettingToggleRow
                icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
                title="Otomatisasi Analisis AI CBT Core"
                description="Siswa otomatis memicu model CBT Core AI saat mengakhiri ujian, sehingga laporan karir BK langsung siap saji."
                checked={!!testSettings.autoAiAnalysis}
                onChange={(val) => handleUpdateSetting('autoAiAnalysis', val)}
                badge={testSettings.autoAiAnalysis ? 'Auto-Generate' : 'Manual'}
              />

              {/* Dynamic Prompting Section */}
              <div className="p-4 sm:p-5 bg-slate-50/60 rounded-xl border border-slate-200 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    System Instruction (Instruksi Karakter & Logika AI)
                  </label>
                  <textarea
                    rows={3}
                    value={testSettings.aiSystemInstruction ?? ''}
                    onChange={(e) => handleUpdateSetting('aiSystemInstruction', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Instruksi sistem untuk model AI..."
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                      Prompt Template (Kerangka Analisis Konseling)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: 'Reset Kerangka Prompt',
                          message: 'Apakah Anda yakin ingin mengatur ulang sistem instruksi dan kerangka prompt laporan konseling ke setelan bawaan? Seluruh perubahan kustom Anda akan terhapus.',
                          onConfirm: () => {
                            handleUpdateSetting('aiPromptTemplate', undefined);
                            handleUpdateSetting('aiSystemInstruction', undefined);
                            showToast('Setelan prompt berhasil dikembalikan ke bawaan');
                          }
                        });
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                    >
                      Reset Bawaan
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={testSettings.aiPromptTemplate ?? ''}
                    onChange={(e) => handleUpdateSetting('aiPromptTemplate', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Template prompt laporan..."
                  />
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-indigo-600 block tracking-wider mb-1.5 font-sans">
                    Variabel Pengganti (Klik untuk Salin):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['{studentName}', '{iqScore}', '{iqCategory}', '{eqScore}', '{eqCategory}', '{riasecR}', '{riasecI}', '{riasecA}', '{riasecS}', '{riasecE}', '{riasecC}', '{dimensionAnswers}'].map(tag => (
                      <span
                        key={tag}
                        className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-100 transition-colors"
                        title="Klik untuk menyalin"
                        onClick={() => {
                          navigator.clipboard.writeText(tag);
                          showToast(`Disalin ke clipboard: ${tag}`);
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4.5. SYSTEM & DATABASE CONSOLE (Superadmin & Admin Only) */}
      {/* 5. SERVER DATABASE & API CREDENTIALS */}
      {activeSubTab === 'kredensial' && (
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
      )}

      {/* 3. ENVIRONMENT & BUILD MODE SETTINGS */}
      {activeSubTab === 'env' && (
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
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-slate-150 shadow-2xl flex flex-col">
            <div className="p-4 text-white flex items-center gap-2 bg-indigo-900">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-xs font-black uppercase tracking-wider font-mono">
                {confirmModal.title}
              </h3>
            </div>
            <div className="p-5 text-slate-700 text-xs leading-relaxed font-sans font-medium">
              {confirmModal.message}
            </div>
            <div className="flex justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 border border-slate-250 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 font-sans cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 text-white rounded-lg text-xs font-bold font-sans bg-indigo-950 hover:bg-indigo-900 cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-slide-in font-sans font-semibold">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
