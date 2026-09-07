'use client';

import React, { useState, useMemo } from 'react';
import { 
  LogOut, CheckCircle, Lock, Brain, Heart, TrendingUp, User, ShieldCheck, Award, AlertTriangle, BookOpen, Layers, Briefcase, Activity
} from 'lucide-react';
import { Student, TestSettings, TestType } from '../../lib/types';
import { resolveClientContext } from '../../lib/core/contextResolver';

interface ExamHubScreenProps {
  currentStudent: Student;
  completedList: string[];
  testSettings: TestSettings;
  handleStartSubTest: (type: string) => void;
  onLogout: () => void;
  onCompleteWholeExam?: () => void;
  testTypes?: TestType[];
}

function getTestIcon(id: string) {
  switch (id) {
    case 'IQ':
      return <Brain className="w-5 h-5" />;
    case 'EQ':
      return <Heart className="w-5 h-5" />;
    case 'Holland':
      return <TrendingUp className="w-5 h-5" />;
    case 'Kepribadian':
      return <User className="w-5 h-5" />;
    case 'Validitas':
      return <ShieldCheck className="w-5 h-5" />;
    case 'GayaBelajar':
      return <BookOpen className="w-5 h-5" />;
    case 'MultipleIntelligences':
      return <Layers className="w-5 h-5" />;
    case 'KesiapanKerja':
      return <Briefcase className="w-5 h-5" />;
    case 'PotensiAkademik':
      return <Activity className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
}

function getTestIconBg(id: string) {
  switch (id) {
    case 'IQ':
      return "bg-blue-50 text-blue-600 border-blue-100";
    case 'EQ':
      return "bg-purple-50 text-purple-600 border-purple-100";
    case 'Holland':
      return "bg-amber-50 text-amber-600 border-amber-100";
    case 'Kepribadian':
      return "bg-sky-50 text-sky-600 border-sky-100";
    case 'Validitas':
      return "bg-rose-50 text-rose-600 border-rose-100";
    case 'GayaBelajar':
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case 'MultipleIntelligences':
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case 'KesiapanKerja':
      return "bg-cyan-50 text-cyan-600 border-cyan-100";
    case 'PotensiAkademik':
      return "bg-violet-50 text-violet-600 border-violet-100";
    default:
      return "bg-slate-50 text-slate-600 border-slate-100";
  }
}

export default function ExamHubScreen({
  currentStudent,
  completedList,
  testSettings,
  handleStartSubTest,
  onLogout,
  onCompleteWholeExam,
  testTypes = []
}: ExamHubScreenProps) {
  const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
  const ctx = useMemo(() => resolveClientContext(currentStudent), [currentStudent]);

  // Check if a specific test type is active globally
  const isTestTypeActive = (id: string, active?: boolean) => {
    if (id === 'IQ') return testSettings.iqActive;
    if (id === 'EQ') return testSettings.eqActive;
    if (id === 'Holland') return testSettings.hollandActive;
    if (id === 'Kepribadian') return testSettings.kepribadianActive;
    if (id === 'Validitas') return testSettings.validitasActive;
    return active !== false;
  };

  // Resilient matcher for student's allowed tests
  const isStudentAllowedTest = (testId: string, testName: string) => {
    if (!currentStudent.allowedTests || !Array.isArray(currentStudent.allowedTests) || currentStudent.allowedTests.length === 0) {
      return true;
    }
    return currentStudent.allowedTests.some(allowed => {
      if (!allowed) return false;
      const a = String(allowed).trim().toLowerCase();
      const id = String(testId).trim().toLowerCase();
      const name = String(testName).trim().toLowerCase();
      return a === id || a === name || name.includes(a) || a.includes(id) || a.includes(name);
    });
  };

  // Calculate required active test types based on settings, own active states, and student allowedTests
  const activeTypes = testTypes.filter(t => isTestTypeActive(t.id, t.active));

  const requiredTypes = activeTypes.filter(type => isStudentAllowedTest(type.id, type.name)).map(t => t.id);

  const allDone = requiredTypes.length > 0 && requiredTypes.every(t => completedList.includes(t));

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 text-slate-800">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider font-mono">{ctx.dashboardHeader}</span>
          <h2 className="text-sm font-bold text-slate-900 font-sans">{currentStudent.name}</h2>
          <p className="text-[10px] text-slate-550 font-medium font-mono">
            {ctx.idLabel}: {currentStudent.id} | {ctx.groupLabel}: {currentStudent.classGroup || '-'}
          </p>
        </div>
        <button 
          type="button"
          onClick={onLogout}
          className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Silakan Pilih Sub-Tes yang Tersedia:</h3>
        
        <div className="space-y-3">
          {testTypes.map((t) => {
            const isCompleted = completedList.includes(t.id);
            const isAllowed = isStudentAllowedTest(t.id, t.name);
            const isActive = isTestTypeActive(t.id, t.active);

            return (
              <div 
                key={t.id}
                className="border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xs transition-all bg-slate-50/30"
              >
                <div className="flex gap-3 items-start">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${getTestIconBg(t.id)}`}>
                    {getTestIcon(t.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-550 mt-1 leading-normal max-w-sm font-medium">
                      {t.description || "Sub-tes asesmen psikometri."}
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                  {isCompleted ? (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Selesai
                    </span>
                  ) : !isAllowed ? (
                    <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-150 px-3 py-1.5 rounded-full flex items-center gap-1" title="Sub-tes ini tidak termasuk dalam paket voucher yang Anda redeem">
                      <Lock className="w-3.5 h-3.5 text-amber-500" /> Luar Paket
                    </span>
                  ) : !isActive ? (
                    <span className="text-[11px] font-semibold bg-slate-150 text-slate-500 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Dinonaktifkan
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartSubTest(t.id)}
                      className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Mulai Tes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-[11px] text-slate-500 leading-relaxed space-y-1 font-semibold">
        <span className="font-bold text-slate-700 block">Informasi Progres CBT:</span>
        <p>• Selesaikan seluruh sub-tes yang ditandai aktif oleh Admin/BK.</p>
        <p>• Setelah semua sub-tes selesai dikerjakan, Anda dapat memicu kalkulasi hasil & memproses sertifikat digital Anda.</p>
      </div>

      {allDone && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl space-y-3.5 shadow-xs">
          <div className="flex gap-3 items-start">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl border border-emerald-200">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 font-sans">Semua Sub-Tes Selesai!</h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-semibold">
                Selamat! Anda telah menyelesaikan seluruh rangkaian sub-tes yang ditugaskan. Klik tombol di bawah untuk mengonfirmasi selesai ujian, memproses hasil dengan AI, dan mengunduh sertifikat Anda.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowConfirmAllModal(true)}
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-700/10 font-sans flex items-center justify-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Konfirmasi Selesaikan Ujian & Lihat Sertifikat</span>
          </button>
        </div>
      )}

      {showConfirmAllModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[9999] text-slate-800" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-3.5 text-left">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-900 font-sans">
                  Selesaikan Seluruh Rangkaian Ujian?
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                  Apakah Anda yakin ingin menyelesaikan seluruh rangkaian ujian CBT Psikometri ini? Anda tidak akan dapat mengubah jawaban Anda lagi setelah konfirmasi dikirim.
                </p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Sistem AI CBT Core akan langsung mengalkulasi hasil potensi kognitif (IQ), kecerdasan emosional (EQ), kode minat karir (RIASEC) Anda, serta menerbitkan sertifikat digital resmi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmAllModal(false)}
                className="text-xs font-bold px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-650 transition-all bg-white font-sans cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmAllModal(false);
                  onCompleteWholeExam?.();
                }}
                className="text-xs font-bold px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-900/10 font-sans cursor-pointer"
              >
                Ya, Selesaikan & Proses Sertifikat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
