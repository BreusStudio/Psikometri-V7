'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, RotateCw, AlertCircle, HelpCircle, ShieldCheck, Printer, X, Image as ImageIcon, Upload, Trash2, Scale, Settings } from 'lucide-react';
import { Student, Question, Dimension, Package } from '@/lib/core/types';
import { useReportFilter } from '@/lib/hooks/useReportFilter';

// Import modular subcomponents
import StudentSidebar from './reports/StudentSidebar';
import RiasecChart from './reports/RiasecChart';
import DimensionScoresBreakdown from './reports/DimensionScoresBreakdown';
import AiAnalysisReport from './reports/AiAnalysisReport';
import PrintableReport from './reports/PrintableReport';
import ReportPrintModal from './reports/ReportPrintModal';
import CalibrationTab from './CalibrationTab';

interface ReportsTabProps {
  store?: any;
  onRefresh?: () => void;
  students: Student[];
  selectedStudent: Student | null;
  setSelectedStudent: (s: Student | null) => void;
  studentPage: number;
  setStudentPage: React.Dispatch<React.SetStateAction<number>>;
  studentsPerPage: number;
  errorMsg: string;
  setErrorMsg: (msg: string) => void;
  loadingAi: boolean;
  triggerGeminiAnalysis: (student: Student) => void;
  questions?: Question[];
  dimensions?: Dimension[];
  packages?: Package[];
  activeContextId?: string;
}

export default function ReportsTab({
  store,
  onRefresh,
  students,
  selectedStudent,
  setSelectedStudent,
  studentPage,
  setStudentPage,
  studentsPerPage,
  errorMsg,
  setErrorMsg,
  loadingAi,
  triggerGeminiAnalysis,
  questions = [],
  dimensions = [],
  packages = [],
  activeContextId
}: ReportsTabProps) {

  const {
    searchTerm,
    setSearchTerm,
    angkatanFilter,
    setAngkatanFilter,
    kelasFilter,
    setKelasFilter,
    showTroubledOnly,
    setShowTroubledOnly,
    selectedIds,
    setSelectedIds,
    printTrigger,
    setPrintTrigger,
    selectedPackageId,
    setSelectedPackageId,
    selectedPackage,
    filteredStudents: filteredStudentsRaw
  } = useReportFilter(students, packages);

  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [loadingBatchAi, setLoadingBatchAi] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentStudentName: string } | null>(null);

  // Mass Recalculation Modal State
  const [showMassRecalcModal, setShowMassRecalcModal] = useState(false);
  const [recalcClassFilter, setRecalcClassFilter] = useState('All');
  const [recalcCohortFilter, setRecalcCohortFilter] = useState('All');
  const [recalcOnlyCompleted, setRecalcOnlyCompleted] = useState(true);
  const [recalcForcePurge, setRecalcForcePurge] = useState(true);
  const [recalcResult, setRecalcResult] = useState<{ processed: number; updated: number } | null>(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const handleRecalculateScores = () => {
    setRecalcResult(null);
    setShowMassRecalcModal(true);
  };

  const handleExecuteMassRecalculate = () => {
    if (!store) return;
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = store.recalculateAllStudentScores({
        classFilter: recalcClassFilter,
        cohortFilter: recalcCohortFilter,
        onlyCompleted: recalcOnlyCompleted,
        forcePurgeStaleDimensions: recalcForcePurge
      });
      setRecalcResult({ processed: res.totalProcessed, updated: res.totalUpdated });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal melakukan kalkulasi ulang skor: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setRecalculating(false);
    }
  };

  const handleBatchAiAnalysis = async (targetIds?: string[]) => {
    const idsToProcess = targetIds && targetIds.length > 0 
      ? targetIds 
      : selectedIds.length > 0 
      ? selectedIds 
      : filteredStudentsRaw.filter(s => s.testCompleted).map(s => s.id);

    if (idsToProcess.length === 0) {
      setErrorMsg('Tidak ada siswa selesai tes yang dipilih untuk analisis AI massal.');
      return;
    }

    const targetStudents = students.filter(s => idsToProcess.includes(s.id) && s.testCompleted);
    if (targetStudents.length === 0) {
      setErrorMsg('Siswa yang dipilih belum menyelesaikan tes.');
      return;
    }

    setLoadingBatchAi(true);
    setErrorMsg('');

    for (let i = 0; i < targetStudents.length; i++) {
      const student = targetStudents[i];
      setBatchProgress({
        current: i + 1,
        total: targetStudents.length,
        currentStudentName: student.name
      });

      try {
        await triggerGeminiAnalysis(student);
      } catch (err) {
        console.warn(`Error generating AI for ${student.name}:`, err);
      }
      await new Promise(r => setTimeout(r, 200));
    }

    setLoadingBatchAi(false);
    setBatchProgress(null);
  };

  // Logo settings state
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('cbt_report_logo') : null;
  });
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('cbt_report_logo') || '' : '';
  });

  const handleSaveLogo = (urlToSave: string | null) => {
    if (urlToSave) {
      localStorage.setItem('cbt_report_logo', urlToSave);
      setLogoUrl(urlToSave);
      setLogoInputUrl(urlToSave);
    } else {
      localStorage.removeItem('cbt_report_logo');
      setLogoUrl(null);
      setLogoInputUrl('');
    }
    setShowLogoModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoInputUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredCount = filteredStudentsRaw.length;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (idsOnCurrentPage: string[]) => {
    const allSelected = idsOnCurrentPage.length > 0 && idsOnCurrentPage.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(x => !idsOnCurrentPage.includes(x)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...idsOnCurrentPage])));
    }
  };

  function handlePrint(targetIds?: string[]) {
    const idsToPrint = targetIds && targetIds.length > 0 ? targetIds : selectedIds;
    let finalIds = idsToPrint;
    if (idsToPrint.length === 0) {
      if (selectedStudent) {
        finalIds = [selectedStudent.id];
        setSelectedIds([selectedStudent.id]);
      } else if (students.length > 0) {
        finalIds = [students[0].id];
        setSelectedIds([students[0].id]);
      } else {
        return;
      }
    } else {
      setSelectedIds(idsToPrint);
    }

    // Direct Native Print: panggil window.print() langsung tanpa popup
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Extract unique classes and cohorts from students list
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.classGroup))).filter(Boolean).sort() as string[];
  }, [students]);

  const uniqueAngkatans = useMemo(() => {
    return Array.from(new Set(students.map(s => s.angkatan))).filter(Boolean).sort() as number[];
  }, [students]);

  // Reset pagination to first page when any filters change
  useEffect(() => {
    setStudentPage(1);
  }, [searchTerm, angkatanFilter, kelasFilter, showTroubledOnly, setStudentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / studentsPerPage));

  return (
    <div className="w-full">
      <div className="print:hidden">
        {/* Top Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-2xl p-4 mb-6 border border-slate-200 shadow-xs gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Laporan & Rekap Psikogram</h3>
            <p className="text-xs text-slate-500">Kelola sertifikat, analisis AI, dan kalkulasi ulang skor peserta secara terpusat.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {store && (
              <button
                type="button"
                onClick={() => {
                  setRecalcResult(null);
                  setShowMassRecalcModal(true);
                }}
                className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Buka Menu Rekalkulasi Skor Massal Berdasarkan Kunci/Norma Terbaru"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                <span>Hitung Ulang Skor Massal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setLogoInputUrl(logoUrl || '');
                setShowLogoModal(true);
              }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Atur Logo Header Laporan PDF"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Logo PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-slate-800">
      
      {/* 1. Student list filter sidebar panel */}
      <StudentSidebar
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={(student) => {
          setSelectedStudent(student);
          setErrorMsg('');
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        angkatanFilter={angkatanFilter}
        onAngkatanFilterChange={setAngkatanFilter}
        kelasFilter={kelasFilter}
        onKelasFilterChange={setKelasFilter}
        showTroubledOnly={showTroubledOnly}
        onShowTroubledOnlyChange={setShowTroubledOnly}
        studentPage={studentPage}
        onPageChange={setStudentPage}
        totalPages={totalPages}
        studentsPerPage={studentsPerPage}
        uniqueAngkatans={uniqueAngkatans}
        uniqueClasses={uniqueClasses}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onBatchPrint={() => handlePrint()}
        onBatchAiAnalysis={() => handleBatchAiAnalysis()}
        activeContextId={activeContextId}
      />

      {/* 2. Selected student profile psychogram & visualizers */}
      <div className="lg:col-span-2 space-y-6">
        {selectedStudent ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6 text-left">
            
            {/* Header Profil */}
            <div className="border-b border-slate-100 pb-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">
                    Profil Psikogram Hasil Asesmen
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">{selectedStudent.name}</h2>
                  <p className="text-xs text-slate-500">Kelas / Grup: {selectedStudent.classGroup} • ID / NIS: {selectedStudent.id}</p>
                </div>

                {/* Dropdown Menu untuk Alat Tambahan (Logo, Rekalkulasi, Kalibrasi) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                    title="Menu Opsi Alat Tambahan"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>⚙️ Alat & Norma</span>
                  </button>

                  {showToolsDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowToolsDropdown(false);
                          setLogoInputUrl(logoUrl || '');
                          setShowLogoModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>Atur Logo PDF</span>
                      </button>

                      {store && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowToolsDropdown(false);
                            handleRecalculateScores();
                          }}
                          disabled={recalculating}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                        >
                          <RotateCw className={`w-4 h-4 text-amber-600 ${recalculating ? 'animate-spin' : ''}`} />
                          <span>Hitung Ulang Skor</span>
                        </button>
                      )}

                      {store && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowToolsDropdown(false);
                            setShowCalibrationModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                        >
                          <Scale className="w-4 h-4 text-indigo-600" />
                          <span>Kalibrasi Norma</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dua Tombol Utama Simetris (Cetak & AI) */}
              {selectedStudent.testCompleted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIds.length > 1) {
                        handlePrint();
                      } else {
                        handlePrint([selectedStudent.id]);
                      }
                    }}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{selectedIds.length > 1 ? `Cetak PDF (${selectedIds.length} Siswa)` : 'Cetak PDF Laporan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIds.length > 1) {
                        handleBatchAiAnalysis(selectedIds);
                      } else {
                        triggerGeminiAnalysis(selectedStudent);
                      }
                    }}
                    disabled={loadingAi || loadingBatchAi}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingAi || loadingBatchAi ? (
                      <RotateCw className="w-4 h-4 animate-spin text-teal-350" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
                    )}
                    <span>{selectedIds.length > 1 ? `Analisis AI (${selectedIds.length} Siswa)` : (selectedStudent.aiAnalysis ? 'Perbarui Analisis AI' : 'Generasi Analisis AI')}</span>
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!selectedStudent.testCompleted ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Siswa Belum Menyelesaikan Ujian CBT</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">
                  Laporan analisis lengkap, visualisasi radar Holland, dan pengelompokan dimensi kognitif akan tampil otomatis setelah siswa menyelesaikan ujian di modul CBT.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Score Summary Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center font-mono font-black text-blue-700 text-xl border-2 border-blue-200 shrink-0">
                      {selectedStudent.iqScore}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500">Skor Kognitif (IQ)</h4>
                      <p className="text-sm font-extrabold text-blue-900 mt-0.5 leading-snug">
                        {selectedStudent.iqScore && selectedStudent.iqScore >= 115 
                          ? 'Superior' 
                          : selectedStudent.iqScore && selectedStudent.iqScore >= 105 
                          ? 'Diatas Rata' 
                          : 'Rata-rata'}
                      </p>
                      <span className="text-[10px] text-slate-450 font-mono font-semibold">Max: 120 points</span>
                    </div>
                  </div>

                  <div className="bg-purple-50/40 border border-purple-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center font-mono font-black text-purple-700 text-xl border-2 border-purple-200 shrink-0">
                      {selectedStudent.eqScore}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-500">Skor Emosi (EQ)</h4>
                      <p className="text-sm font-extrabold text-purple-900 mt-0.5 leading-snug">
                        {selectedStudent.eqScore && selectedStudent.eqScore >= 85 
                          ? 'Sangat Stabil' 
                          : selectedStudent.eqScore && selectedStudent.eqScore >= 70 
                          ? 'Cukup Stabil' 
                          : 'Perlu Latihan'}
                      </p>
                      <span className="text-[10px] text-slate-450 font-mono font-semibold">Max: 100 points</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-3 ${
                    selectedStudent.validationStatus?.startsWith('INVALID')
                      ? 'bg-rose-50/40 border-rose-100'
                      : selectedStudent.validationStatus?.startsWith('WARNING')
                      ? 'bg-amber-50/40 border-amber-100'
                      : 'bg-emerald-50/40 border-emerald-100'
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      selectedStudent.validationStatus?.startsWith('INVALID')
                        ? 'bg-rose-100 border-rose-200 text-rose-700'
                        : selectedStudent.validationStatus?.startsWith('WARNING')
                        ? 'bg-amber-100 border-amber-200 text-amber-700'
                        : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                    }`}>
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-500 truncate">Status Validitas</h4>
                      <p className={`text-sm font-extrabold mt-0.5 ${
                        selectedStudent.validationStatus?.startsWith('INVALID')
                          ? 'text-rose-900 font-mono'
                          : selectedStudent.validationStatus?.startsWith('WARNING')
                          ? 'text-amber-900 font-mono'
                          : 'text-emerald-900 font-mono'
                      }`}>
                        {selectedStudent.validationStatus || 'VALID'}
                      </p>
                      <span className="text-[10px] text-slate-450 font-semibold block truncate" title={selectedStudent.validationRecommendation || 'Interpretasi hasil normal'}>
                        {selectedStudent.validationRecommendation || 'Interpretasi normal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Radar / Holland RIASEC Kepribadian bars */}
                {selectedStudent.riasecScores && <RiasecChart scores={selectedStudent.riasecScores} />}

                {/* Cognitive, Emotional, Kepribadian dimension details scores list */}
                <DimensionScoresBreakdown 
                  scores={selectedStudent.dimensionScores} 
                  questions={questions}
                  dimensions={dimensions}
                  evaluatedDimensions={selectedStudent.evaluatedDimensions}
                />

                {/* AI Counselling and Career mapping report */}
                <AiAnalysisReport selectedStudent={selectedStudent} />

              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-450 text-xs font-medium">
            Pilih siswa di daftar sebelah kiri untuk meninjau psikogram dan laporan konseling BK.
          </div>
        )}
      </div>

      {/* Floating Print Action Bar - Hanya Tampil untuk Aksi Massal (>1 Siswa) */}
      {selectedIds.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-8 print:hidden">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terpilih Massal</span>
            <span className="text-sm font-black">{selectedIds.length} Peserta</span>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setLogoInputUrl(logoUrl || '');
                setShowLogoModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Atur Logo Header Laporan"
            >
              <ImageIcon className="w-4 h-4 text-indigo-400" />
              <span>Atur Logo</span>
            </button>
            <button 
              onClick={() => handlePrint()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF ({selectedIds.length})</span>
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-2xl transition-all cursor-pointer"
              title="Batal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Logo PDF */}
      {showLogoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">Pengaturan Logo Laporan</h3>
                  <p className="text-[11px] font-medium text-slate-500">Tampil pada header kiri atas PDF A4</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLogoModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Logo */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pratinjau Header PDF</span>
              <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  {logoInputUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={logoInputUrl} 
                      alt="Preview Logo" 
                      className="h-10 w-10 object-contain rounded border border-slate-300 p-0.5" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center font-black text-[10px] shrink-0">
                      <span>CBT</span>
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-black text-slate-900">LAPORAN ANALISIS PSIKOMETRI</div>
                    <div className="text-[9px] text-slate-500 font-bold">SMK / INSTANSI SEKOLAH</div>
                  </div>
                </div>
                <div className="text-right text-[9px] font-mono font-bold text-slate-600">
                  CBT-SMK
                </div>
              </div>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">Unggah File Logo (PNG/JPG/SVG)</label>
              <label className="flex items-center justify-center gap-2 p-3 bg-indigo-50/60 hover:bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Pilih Gambar dari Perangkat</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>
            </div>

            {/* Option 2: URL input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">Atau Gunakan URL Gambar</label>
              <input
                type="text"
                placeholder="https://domain.com/logo.png"
                value={logoInputUrl}
                onChange={(e) => setLogoInputUrl(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => handleSaveLogo(null)}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 text-xs font-bold flex items-center gap-1"
                  title="Hapus logo khusus"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowLogoModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveLogo(logoInputUrl)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Simpan Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch AI Analysis Progress Modal */}
      {batchProgress && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="bg-slate-900 text-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-800 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-slate-800 text-teal-300 rounded-full flex items-center justify-center mx-auto border border-slate-700">
              <Sparkles className="w-8 h-8 animate-pulse text-teal-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Memproses Analisis AI Massal</h3>
              <p className="text-xs text-slate-400 mt-1">
                Siswa {batchProgress.current} dari {batchProgress.total}: <span className="text-teal-300 font-bold">{batchProgress.currentStudentName}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold px-1">
                <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}% Selesai</span>
                <span>{batchProgress.current} / {batchProgress.total} Siswa</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Mohon tunggu, Gemini AI sedang menganalisis instrumen psikometri secara mendalam...
            </p>
          </div>
        </div>
      )}

      {/* Mass Recalculation Modal */}
      {showMassRecalcModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-800 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 text-left">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <RotateCw className={`w-5 h-5 ${recalculating ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rekalkulasi Skor Massal</h3>
                  <p className="text-xs text-slate-500">Hitung ulang nilai IQ, EQ, RIASEC & Dimensi berdasarkan kunci/norma terbaru</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowMassRecalcModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filter Rombel / Kelas</label>
                  <select
                    value={recalcClassFilter}
                    onChange={(e) => setRecalcClassFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                  >
                    <option value="All">Semua Kelas ({uniqueClasses.length})</option>
                    {uniqueClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Filter Angkatan / Cohort</label>
                  <select
                    value={recalcCohortFilter}
                    onChange={(e) => setRecalcCohortFilter(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-800"
                  >
                    <option value="All">Semua Angkatan ({uniqueAngkatans.length})</option>
                    {uniqueAngkatans.map(a => (
                      <option key={a} value={a}>Angkatan {a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <input
                  type="checkbox"
                  checked={recalcOnlyCompleted}
                  onChange={(e) => setRecalcOnlyCompleted(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 border-slate-300"
                />
                <span className="text-xs font-semibold text-amber-900">
                  Hanya hitung siswa yang telah menyelesaikan tes
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  checked={recalcForcePurge}
                  onChange={(e) => setRecalcForcePurge(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                />
                <span className="text-xs font-semibold text-indigo-900">
                  Bersihkan skor dimensi usang/legacy & hitung murni dari respon jawaban butir soal
                </span>
              </label>
            </div>

            {/* Feedback result */}
            {recalcResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Rekalkulasi Massal Berhasil!</span>
                </div>
                <p>
                  Berhasil memproses <strong>{recalcResult.processed} siswa</strong>. Sebanyak <strong>{recalcResult.updated} siswa</strong> telah diperbarui skor psikometrinya di database.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMassRecalcModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {recalcResult ? 'Tutup' : 'Batal'}
              </button>

              <button
                type="button"
                onClick={handleExecuteMassRecalculate}
                disabled={recalculating}
                className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                <span>{recalculating ? 'Memproses Rekalkulasi...' : 'Mulai Rekalkulasi Massal'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-slate-50 rounded-3xl p-6 md:p-8 max-w-5xl w-full shadow-2xl animate-in zoom-in-95 border border-slate-200 my-8 max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setShowCalibrationModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer z-20"
              title="Tutup Kalibrasi"
            >
              <X className="w-5 h-5" />
            </button>

            <CalibrationTab
              testSettings={store?.getTestSettings() || {}}
              store={store}
              onRefresh={() => {
                if (onRefresh) onRefresh();
                if (selectedStudent && store) {
                  const fresh = store.getStudents().find((s: any) => s.id === selectedStudent.id);
                  if (fresh) setSelectedStudent(fresh);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Print Warning Modal for Iframe */}
      {showPrintWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Printer className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Fitur Cetak Browser Terhalang Sandbox</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Karena aplikasi ini berjalan di dalam panel pratinjau (iframe) AI Studio, browser membatasi perintah cetak langsung demi alasan keamanan.
              <br/><br/>
              Silakan klik tombol <strong>&quot;Buka di Tab Baru&quot;</strong> di bawah untuk membuka aplikasi secara mandiri, lalu klik tombol cetak kembali di sana untuk hasil yang sempurna.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowPrintWarning(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
              >
                Batal
              </button>
              
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrintWarning(false)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-colors text-xs flex-1 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 text-center"
              >
                <span>Buka di Tab Baru</span>
              </a>
              
              <button
                onClick={() => {
                  setShowPrintWarning(false);
                  setPrintTrigger(prev => prev + 1); // Queue browser print directly
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-xs"
                title="Coba mencetak langsung dari iframe ini"
              >
                Tetap Cetak
              </button>
            </div>
          </div>
        </div>
      )}
        </div> {/* Close inner grid */}
      </div> {/* Close print:hidden wrapper */}

      {/* Hidden Printable Component */}
      <PrintableReport 
        students={selectedIds.length > 0 ? students.filter(s => selectedIds.includes(s.id)) : (selectedStudent ? [selectedStudent] : (students.length > 0 ? [students[0]] : []))}
        questions={questions}
        dimensions={dimensions}
        logoUrl={logoUrl}
        selectedPackage={selectedPackage}
      />
    </div>
  );
}
