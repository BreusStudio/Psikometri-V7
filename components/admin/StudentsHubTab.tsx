'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Layers, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  UserX, 
  CalendarDays,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '../../lib/types';
import StudentsTab from './StudentsTab';
import ClassesCohortsTab from './ClassesCohortsTab';

export type StudentsSubTabType = 'students' | 'classes';

interface StudentsHubTabProps {
  store: any;
  students: Student[];
  studentPage: number;
  setStudentPage: React.Dispatch<React.SetStateAction<number>>;
  studentsPerPage: number;
  setSelectedStudent: (s: Student | null) => void;
  setActiveTab: (tab: any) => void;
  session: { role: string; id: string; name: string; managed_class?: string; school_origin?: string };
  onRefresh: () => void;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: string;
  initialSubTab?: StudentsSubTabType;
}

export default function StudentsHubTab({
  store,
  students,
  studentPage,
  setStudentPage,
  studentsPerPage,
  setSelectedStudent,
  setActiveTab,
  session,
  onRefresh,
  refreshTrigger,
  showNotification,
  activeContextId,
  initialSubTab = 'students'
}: StudentsHubTabProps) {
  const [currentSubTab, setCurrentSubTab] = useState<StudentsSubTabType>(initialSubTab);

  // Stats calculation
  const stats = useMemo(() => {
    const total = students.length;
    const completed = students.filter(s => s.testCompleted).length;
    const inProgress = students.filter(s => s.testStarted && !s.testCompleted).length;
    const notStarted = students.filter(s => !s.testStarted).length;
    const locked = students.filter(s => s.lockedOut).length;

    // Unique classes
    const classes = new Set<string>();
    students.forEach(s => {
      if (s.classGroup) classes.add(s.classGroup.trim());
    });

    return {
      total,
      completed,
      inProgress,
      notStarted,
      locked,
      totalClasses: classes.size
    };
  }, [students]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER & QUICK STATS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Pusat Peserta & Rombel
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                {stats.totalClasses} Rombel Terdata
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Manajemen Peserta Didik & Rombel Kelas
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1 max-w-2xl">
              Kelola Daftar Nominasi Tetap (DNT) peserta ujian, impor data dari Excel, dan atur struktur rombongan belajar serta gelombang ujian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentSubTab(currentSubTab === 'students' ? 'classes' : 'students')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
            >
              {currentSubTab === 'students' ? (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Atur Rombel & Gelombang</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Kembali ke Data Peserta</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Terdaftar (DNT)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
              <span className="text-xs font-semibold text-slate-500">siswa</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Sudah Selesai Tes</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700">{stats.completed}</span>
              <span className="text-xs font-semibold text-emerald-600">siswa</span>
            </div>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Sedang Mengerjakan</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-blue-700">{stats.inProgress}</span>
              <span className="text-xs font-semibold text-blue-600">siswa aktif</span>
            </div>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Belum Mulai Tes</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-700">{stats.notStarted}</span>
              <span className="text-xs font-semibold text-amber-600">menunggu</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENTED SUB-TAB CONTROLS */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setCurrentSubTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'students'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Daftar Peserta Didik (DNT)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'classes'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Rombel & Gelombang Ujian</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Data terhubung langsung ke Ujian & Bank Akun
        </div>
      </div>

      {/* VIEW RENDERER */}
      {currentSubTab === 'students' ? (
        <StudentsTab
          store={store}
          students={students}
          studentPage={studentPage}
          setStudentPage={setStudentPage}
          studentsPerPage={studentsPerPage}
          setSelectedStudent={setSelectedStudent}
          setActiveTab={setActiveTab}
          session={session}
          onRefresh={onRefresh}
          refreshTrigger={refreshTrigger}
          showNotification={showNotification as any}
          activeContextId={activeContextId}
        />
      ) : (
        <ClassesCohortsTab
          store={store}
          onRefresh={onRefresh}
          session={session}
          refreshTrigger={refreshTrigger}
          showNotification={showNotification}
          activeContextId={activeContextId}
        />
      )}
    </div>
  );
}
