'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Award, 
  Database, 
  LayoutTemplate, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  Server,
  Sparkles,
  Scale
} from 'lucide-react';
import { TestSettings } from '../../lib/types';
import SettingsTab from './SettingsTab';
import CertificateSettingsTab from './CertificateSettingsTab';
import DbSyncTab from './DbSyncTab';
import LandingEditorTab from './LandingEditorTab';
import CalibrationTab from './CalibrationTab';

export type SystemSettingsSubTabType = 'settings' | 'calibration' | 'certificate' | 'dbsync' | 'landing';

interface SystemSettingsHubTabProps {
  testSettings: TestSettings;
  handleToggleSetting: (key: keyof TestSettings) => void;
  handleUpdateSetting: (key: keyof TestSettings, val: any) => void;
  session: { role: string; id: string; name: string; password?: string; };
  store: any; // PsychometricStore
  onRefresh: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialSubTab?: SystemSettingsSubTabType;
}

export default function SystemSettingsHubTab({
  testSettings,
  handleToggleSetting,
  handleUpdateSetting,
  session,
  store,
  onRefresh,
  showNotification,
  initialSubTab = 'settings'
}: SystemSettingsHubTabProps) {
  const [currentSubTab, setCurrentSubTab] = useState<SystemSettingsSubTabType>(initialSubTab);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Pusat Pengaturan Platform
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Superadmin Governance
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Pengaturan Sistem, Sertifikat & Database
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1 max-w-2xl">
              Pusat kendali operasional platform: konfigurasi parameter ujian CBT, template sertifikat kelulusan, sinkronisasi database, dan landing page publik.
            </p>
          </div>
        </div>

        {/* System Quick Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mode Acak Soal</span>
            <span className={`text-sm font-black mt-1 block ${testSettings.randomizeQuestions ? 'text-emerald-700' : 'text-slate-600'}`}>
              {testSettings.randomizeQuestions ? '✓ Acak Aktif' : 'Berurutan'}
            </span>
          </div>

          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Analisis AI Otomatis</span>
            <span className={`text-sm font-black mt-1 block ${testSettings.autoAiAnalysis ? 'text-indigo-700' : 'text-slate-600'}`}>
              {testSettings.autoAiAnalysis ? '✓ AI Otomatis Aktif' : 'Manual'}
            </span>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Sertifikat Digital</span>
            <span className="text-sm font-black text-amber-700 mt-1 block truncate">
              {testSettings.certTitle || 'Sertifikat Standar'}
            </span>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Kesehatan Sinkronisasi</span>
            <span className="text-sm font-black text-emerald-700 mt-1 block">
              ✓ Dual-Layer Aktif
            </span>
          </div>
        </div>
      </div>

      {/* SEGMENTED SUB-TAB CONTROLS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setCurrentSubTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Aturan CBT & Ujian</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('calibration')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'calibration'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Kalibrasi Norma & Skoring</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('certificate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'certificate'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Desain Sertifikat</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('dbsync')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'dbsync'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Database & Sinkronisasi</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('landing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'landing'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 text-indigo-600" />
            <span>Landing Page Editor</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Konfigurasi terisolasi Superadmin
        </div>
      </div>

      {/* VIEW RENDERER */}
      {currentSubTab === 'settings' && (
        <SettingsTab
          testSettings={testSettings}
          handleToggleSetting={handleToggleSetting}
          handleUpdateSetting={handleUpdateSetting}
          session={session}
          store={store}
          onRefresh={onRefresh}
        />
      )}

      {currentSubTab === 'calibration' && (
        <CalibrationTab
          testSettings={testSettings}
          store={store}
          onRefresh={onRefresh}
          showNotification={showNotification}
        />
      )}

      {currentSubTab === 'certificate' && (
        <CertificateSettingsTab
          testSettings={testSettings}
          handleToggleSetting={handleToggleSetting}
          handleUpdateSetting={handleUpdateSetting}
        />
      )}

      {currentSubTab === 'dbsync' && (
        <DbSyncTab
          store={store}
          session={session}
          onRefresh={onRefresh}
        />
      )}

      {currentSubTab === 'landing' && (
        <LandingEditorTab
          store={store}
          session={session}
          showNotification={showNotification}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
