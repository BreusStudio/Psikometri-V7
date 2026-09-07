'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sliders, 
  BookOpen, 
  SlidersHorizontal, 
  Award, 
  Database,
  CheckCircle
} from 'lucide-react';
import { PsychometricStore } from '../../lib/mockData';
import { TenantContextType } from '../../lib/metadata';
import TestTypesTab from './TestTypesTab';
import DimensionsTab from './DimensionsTab';
import QuestionsTab from './QuestionsTab';
import MajorsTab from './MajorsTab';

interface CbtContentTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: TenantContextType;
  initialSubTab?: 'test-types' | 'dimensions' | 'questions' | 'majors';
}

export default function CbtContentTab({
  store,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId,
  initialSubTab = 'test-types'
}: CbtContentTabProps) {
  const [prevInitialSubTab, setPrevInitialSubTab] = useState(initialSubTab);
  const [subTab, setSubTab] = useState<'test-types' | 'dimensions' | 'questions' | 'majors'>(initialSubTab);

  if (initialSubTab && initialSubTab !== prevInitialSubTab) {
    setPrevInitialSubTab(initialSubTab);
    setSubTab(initialSubTab);
  }

  // Dynamic statistics with safety checks
  const stats = useMemo(() => {
    const testTypesCount = (store.getTestTypes() || []).length;
    const dimensionsCount = (store.getDimensions() || []).length;
    const questionsCount = (store.getQuestions() || []).length;
    const majorsCount = (store.getSchoolMajors() || []).length;

    const totalQuestions = store.getQuestions() || [];
    const questionsWithDimension = totalQuestions.filter(q => q.dimension && q.dimension !== 'undefined' && q.dimension.trim() !== '').length;
    const allQuestionsCovered = totalQuestions.length > 0 && questionsWithDimension === totalQuestions.length;

    return {
      testTypesCount,
      dimensionsCount,
      questionsCount,
      majorsCount,
      questionsWithDimension,
      allQuestionsCovered
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  return (
    <div id="cbt-master-content-tab" className="space-y-6 animate-fade-in font-sans">
      {/* Upper Unified Header Section */}
      <div id="cbt-header-card" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Database className="w-24 h-24 text-indigo-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span id="cbt-context-badge" className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold tracking-wider uppercase">
                Konsolidasi Master Data & Konten
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pusat Konten & Master CBT</h2>
            <p className="text-sm text-slate-500 font-medium max-w-xl">
              Portal satu pintu untuk mengonfigurasi instrumen ujian, dimensi penilaian, materi soal, serta kategori peminatan karir secara tersinkronisasi.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Flashcard Navigation Cards */}
      <div id="cbt-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Modul Tes */}
        <div 
          id="stat-card-test-types"
          onClick={() => setSubTab('test-types')}
          className={`p-5 rounded-2xl transition-all cursor-pointer border-2 relative overflow-hidden ${
            subTab === 'test-types' 
              ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          {subTab === 'test-types' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              subTab === 'test-types' ? 'text-indigo-700' : 'text-slate-400'
            }`}>Modul Sub-Tes</span>
            <div className={`p-2 rounded-xl transition-colors ${
              subTab === 'test-types' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.testTypesCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Konfigurasi Aktif</p>
            {subTab === 'test-types' && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase">Terganti</span>
            )}
          </div>
        </div>

        {/* Dimensi Evaluasi */}
        <div 
          id="stat-card-dimensions"
          onClick={() => setSubTab('dimensions')}
          className={`p-5 rounded-2xl transition-all cursor-pointer border-2 relative overflow-hidden ${
            subTab === 'dimensions' 
              ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          {subTab === 'dimensions' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              subTab === 'dimensions' ? 'text-indigo-700' : 'text-slate-400'
            }`}>Dimensi & Indikator</span>
            <div className={`p-2 rounded-xl transition-colors ${
              subTab === 'dimensions' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.dimensionsCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Indikator Terdaftar</p>
            {subTab === 'dimensions' && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase">Terganti</span>
            )}
          </div>
        </div>

        {/* Bank Soal */}
        <div 
          id="stat-card-questions"
          onClick={() => setSubTab('questions')}
          className={`p-5 rounded-2xl transition-all cursor-pointer border-2 relative overflow-hidden ${
            subTab === 'questions' 
              ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          {subTab === 'questions' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              subTab === 'questions' ? 'text-indigo-700' : 'text-slate-400'
            }`}>Bank Soal Ujian</span>
            <div className={`p-2 rounded-xl transition-colors ${
              subTab === 'questions' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.questionsCount}</p>
          <div className="flex items-center justify-between mt-1">
            {stats.allQuestionsCovered ? (
              <span className="text-[9px] font-extrabold text-emerald-600 uppercase flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" /> 100% Terklasifikasi
              </span>
            ) : (
              <span className="text-[9px] font-extrabold text-amber-600 uppercase">
                {stats.questionsWithDimension} Soal Berdimensi
              </span>
            )}
            {subTab === 'questions' && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase">Terganti</span>
            )}
          </div>
        </div>

        {/* Peminatan Karir */}
        <div 
          id="stat-card-majors"
          onClick={() => setSubTab('majors')}
          className={`p-5 rounded-2xl transition-all cursor-pointer border-2 relative overflow-hidden ${
            subTab === 'majors' 
              ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
          }`}
        >
          {subTab === 'majors' && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
          )}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              subTab === 'majors' ? 'text-indigo-700' : 'text-slate-400'
            }`}>Kategori Peminatan</span>
            <div className={`p-2 rounded-xl transition-colors ${
              subTab === 'majors' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.majorsCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Konsentrasi Karir</p>
            {subTab === 'majors' && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white uppercase">Terganti</span>
            )}
          </div>
        </div>
      </div>

      {/* Render Selected Tab Container */}
      <div id="cbt-tab-render-container" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-1 min-h-[500px]">
        {subTab === 'test-types' && (
          <TestTypesTab 
            store={store}
            onRefresh={onRefresh}
            session={session}
            showNotification={showNotification}
          />
        )}

        {subTab === 'dimensions' && (
          <DimensionsTab 
            store={store}
            dimensions={store.getDimensions() || []}
            onRefresh={onRefresh}
            session={session}
            showNotification={showNotification}
          />
        )}

        {subTab === 'questions' && (
          <QuestionsTab 
            store={store}
            questions={store.getQuestions() || []}
            onRefresh={onRefresh}
            session={session}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
          />
        )}

        {subTab === 'majors' && (
          <MajorsTab 
            store={store}
            majors={store.getSchoolMajors() || []}
            onRefresh={onRefresh}
            session={session}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
          />
        )}
      </div>
    </div>
  );
}
