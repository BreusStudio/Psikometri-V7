'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Download, 
  Printer, 
  Search, 
  ShieldAlert, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Eye, 
  ChevronRight,
  Sparkles,
  BookOpen,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Student, SchoolMajor } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';
import { useToast } from '@/components/shared/ToastContext';
import { getContextLabels } from '../../lib/metadata';

interface RekapKelasTabProps {
  store: PsychometricStore;
  students: Student[];
  onRefresh: () => void;
  session: { role: string; id: string; name: string; managed_class?: string };
  setActiveTab: (tab: any) => void;
  setSelectedStudent?: (s: Student | null) => void;
  activeContextId?: string;
}

export default function RekapKelasTab({
  store,
  students,
  onRefresh,
  session,
  setActiveTab,
  setSelectedStudent,
  activeContextId
}: RekapKelasTabProps) {
  const ctx = useMemo(() => getContextLabels(activeContextId), [activeContextId]);
  const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useToast();
  const isWaliKelas = session.role.toLowerCase() === 'wali kelas';
  const isKakomli = session.role.toLowerCase() === 'kakomli';
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  // Extract all unique classes from student list based on role
  const allAvailableClasses = useMemo(() => {
    const classesSet = new Set<string>();
    const managed = (session.managed_class || '').toLowerCase().trim();
    
    students.forEach(s => {
      if (s.classGroup) {
        const cls = s.classGroup.trim();
        if (isWaliKelas) {
          if (cls.toLowerCase() === managed) classesSet.add(cls);
        } else if (isKakomli) {
          if (cls.toLowerCase().includes(managed)) classesSet.add(cls);
        } else {
          classesSet.add(cls);
        }
      }
    });
    return Array.from(classesSet).sort();
  }, [students, isWaliKelas, isKakomli, session.managed_class]);

  const allAvailableAngkatan = useMemo(() => {
    const angkatanSet = new Set<number>();
    students.forEach(s => {
       if (s.angkatan) angkatanSet.add(s.angkatan);
    });
    return Array.from(angkatanSet).sort((a,b) => b - a);
  }, [students]);

  const defaultClass = useMemo(() => {
    if (isWaliKelas && session.managed_class) {
      const match = allAvailableClasses.find(c => c.toLowerCase() === session.managed_class!.trim().toLowerCase());
      return match || session.managed_class.trim();
    }
    return isKakomli ? 'ALL_JURUSAN' : (allAvailableClasses[0] || '');
  }, [allAvailableClasses, isWaliKelas, isKakomli, session.managed_class]);

  const [selectedClass, setSelectedClass] = useState<string>('');
  const activeClass = selectedClass || defaultClass;
  const [selectedAngkatan, setSelectedAngkatan] = useState<number | 'all'>('all');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'selesai' | 'proses' | 'belum'>('all');
  const [showLockedOnly, setShowLockedOnly] = useState(false);

  // Get students for the currently selected class
  const classStudents = useMemo(() => {
    let filtered = students;
    
    // Filter by class or Jurusan
    if (activeClass === 'ALL_JURUSAN') {
      filtered = filtered.filter(s => allAvailableClasses.includes(s.classGroup?.trim() || ''));
    } else if (activeClass) {
      filtered = filtered.filter(s => s.classGroup?.toLowerCase() === activeClass.toLowerCase());
    } else {
      return [];
    }

    // Filter by Angkatan
    if (selectedAngkatan !== 'all') {
      filtered = filtered.filter(s => s.angkatan === selectedAngkatan);
    }
    
    return filtered;
  }, [students, activeClass, allAvailableClasses, selectedAngkatan]);

  // Statistics for the selected class
  const classStats = useMemo(() => {
    const total = classStudents.length;
    const completed = classStudents.filter(s => s.testCompleted).length;
    const inProgress = classStudents.filter(s => s.testStarted && !s.testCompleted).length;
    const notStarted = classStudents.filter(s => !s.testStarted).length;
    const locked = classStudents.filter(s => s.lockedOut).length;
    const cheatWarnings = classStudents.reduce((sum, s) => sum + (s.cheatWarnings || 0), 0);

    // Compute average scores
    const completedStudents = classStudents.filter(s => s.testCompleted);
    const avgIq = completedStudents.length > 0 
      ? Math.round(completedStudents.reduce((sum, s) => sum + (s.iqScore || 0), 0) / completedStudents.length)
      : null;
    const avgEq = completedStudents.length > 0
      ? Math.round(completedStudents.reduce((sum, s) => sum + (s.eqScore || 0), 0) / completedStudents.length)
      : null;

    // Compute dominant RIASEC trait for the class
    const riasecCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    completedStudents.forEach(s => {
      if (s.riasecScores) {
        const sorted = Object.entries(s.riasecScores).sort((a, b) => b[1] - a[1]);
        const primaryTrait = sorted[0]?.[0];
        if (primaryTrait && primaryTrait in riasecCounts) {
          riasecCounts[primaryTrait as keyof typeof riasecCounts]++;
        }
      }
    });

    const dominantTraitEntry = Object.entries(riasecCounts).sort((a, b) => b[1] - a[1])[0];
    const dominantTrait = dominantTraitEntry && dominantTraitEntry[1] > 0 
      ? dominantTraitEntry[0] 
      : 'N/A';

    return {
      total,
      completed,
      completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      inProgress,
      inProgressPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      notStarted,
      notStartedPercent: total > 0 ? Math.round((notStarted / total) * 100) : 0,
      locked,
      cheatWarnings,
      avgIq,
      avgEq,
      dominantTrait,
      riasecCounts
    };
  }, [classStudents]);

  // RIASEC Chart Data
  const riasecChartData = useMemo(() => {
    const keys = [
      { key: 'R', label: 'Realistic', color: '#ef4444' },
      { key: 'I', label: 'Investigative', color: '#3b82f6' },
      { key: 'A', label: 'Artistic', color: '#ec4899' },
      { key: 'S', label: 'Social', color: '#10b981' },
      { key: 'E', label: 'Enterprising', color: '#f59e0b' },
      { key: 'C', label: 'Conventional', color: '#6366f1' }
    ];

    return keys.map(item => ({
      name: item.label,
      key: item.key,
      Siswa: classStats.riasecCounts[item.key as keyof typeof classStats.riasecCounts] || 0,
      color: item.color
    }));
  }, [classStats]);

  // Filtered roster lists
  const filteredRoster = useMemo(() => {
    return classStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'selesai') matchesStatus = s.testCompleted;
      else if (statusFilter === 'proses') matchesStatus = s.testStarted && !s.testCompleted;
      else if (statusFilter === 'belum') matchesStatus = !s.testStarted;

      let matchesLock = true;
      if (showLockedOnly) matchesLock = s.lockedOut;

      return matchesSearch && matchesStatus && matchesLock;
    });
  }, [classStudents, searchTerm, statusFilter, showLockedOnly]);

  // Get IQ category label
  const getIqCategory = (iq: number | null) => {
    if (iq === null) return '-';
    if (iq >= 130) return 'Sangat Cerdas';
    if (iq >= 120) return 'Cerdas';
    if (iq >= 110) return 'Rata-rata Atas';
    if (iq >= 90) return 'Rata-rata';
    if (iq >= 80) return 'Rata-rata Bawah';
    return 'Lambat Belajar';
  };

  // Get Holland dominant three letters
  const getHollandDominant = (student: Student) => {
    if (!student.riasecScores || !student.testCompleted) return '-';
    const sorted = Object.entries(student.riasecScores).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(x => x[0]).join('');
  };

  // Mass unlock cheat lockouts in this class
  const handleMassUnlock = () => {
    const lockedSiswa = classStudents.filter(s => s.lockedOut);
    if (lockedSiswa.length === 0) {
      showWarningToast('Tidak ada siswa yang sedang terkunci di kelas ini.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin melepas kunci ujian untuk ${lockedSiswa.length} siswa di kelas ${activeClass}?`)) {
      lockedSiswa.forEach(s => {
        store.saveStudent({
          ...s,
          lockedOut: false,
          lockReason: null
        });
      });
      onRefresh();
      showSuccessToast(`Berhasil membuka kunci untuk ${lockedSiswa.length} siswa.`);
    }
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (classStudents.length === 0) {
      showWarningToast('Tidak ada data siswa untuk diekspor.');
      return;
    }

    // Define CSV columns
    const headers = [
      ctx.idLabel,
      ctx.nameLabel,
      ctx.classLabel,
      ctx.cohortLabel,
      'Status Ujian',
      'Skor IQ',
      'Kategori IQ',
      'Skor EQ',
      'Kategori EQ',
      'Tipe Holland',
      'Jumlah Pelanggaran',
      'Status Kunci'
    ];

    const rows = classStudents.map(s => {
      let status = 'Belum Mulai';
      if (s.testCompleted) status = 'Selesai';
      else if (s.testStarted) status = 'Sedang Mengerjakan';

      const iqCat = getIqCategory(s.iqScore);
      const eqCat = s.eqScore !== null 
        ? (s.eqScore >= 90 ? 'Tinggi' : s.eqScore >= 75 ? 'Sedang' : 'Rendah')
        : '-';

      return [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.classGroup}"`,
        s.angkatan,
        `"${status}"`,
        s.iqScore ?? '-',
        `"${iqCat}"`,
        s.eqScore ?? '-',
        `"${eqCat}"`,
        `"${getHollandDominant(s)}"`,
        s.cheatWarnings || 0,
        s.lockedOut ? '"TERKUNCI"' : '"AKTIF"'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Psikometri_${activeClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger browser print for class summary
  const triggerPrint = () => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe) {
      setShowPrintWarning(true);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 text-slate-800 font-sans print:bg-white print:p-0">
      
      {/* HEADER BAR (Hidden in print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="text-left">
          <span className="text-[10px] font-bold font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Laporan & Evaluasi Assessment
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Rekap Hasil per {ctx.classShortLabel}</h2>
          <p className="text-slate-500 text-xs mt-1">
            Analisis sebaran kecerdasan kognitif, kematangan emosional, kecenderungan minat karir, dan kepatuhan ujian {ctx.entitySingular.toLowerCase()} per {ctx.classShortLabel.toLowerCase()} secara kolektif.
          </p>
        </div>

        {/* Class Selection Form */}
        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 w-full xl:w-auto">
          <label className="text-xs font-bold text-slate-600">{ctx.cohortShortLabel}:</label>
          <select
            value={selectedAngkatan}
            onChange={(e) => setSelectedAngkatan(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-250 hover:border-slate-400 font-bold text-xs text-slate-800 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all flex-1 sm:flex-none"
          >
            <option value="all">Semua {ctx.cohortShortLabel}</option>
            {allAvailableAngkatan.map(a => (
              <option key={a} value={a}>{ctx.cohortShortLabel} {a}</option>
            ))}
          </select>
          <label className="text-xs font-bold text-slate-600 sm:ml-2">{ctx.classShortLabel}:</label>
          <select
            value={activeClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={isWaliKelas}
            className="bg-slate-50 border border-slate-250 hover:border-slate-400 font-bold text-xs text-slate-800 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all flex-1 sm:flex-none"
          >
            {(!isWaliKelas) && <option value="ALL_JURUSAN">Semua {ctx.classShortLabel} (Rekap Total)</option>}
            {allAvailableClasses.map(c => (
              <option key={c} value={c}>{ctx.classShortLabel} {c}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportToCSV}
            className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>

          <button
            type="button"
            onClick={triggerPrint}
            className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-semibold text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER (Strictly formatted for physical print sheets) */}
      <div className="hidden print:block text-left border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">REKAPITULASI HASIL ASESMEN PSIKOMETRI</h1>
            <p className="text-sm font-bold text-indigo-700">PsikoSMK CBT Core AI Assessment Console</p>
          </div>
          <div className="text-right text-xs font-mono">
            <p>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
            <p>Penyusun: {session.name} ({session.role})</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs font-medium text-slate-700">
          <div>
            <span className="font-bold text-slate-900">KELAS SASARAN:</span> {activeClass}
          </div>
          <div>
            <span className="font-bold text-slate-900">TOTAL SISWA:</span> {classStats.total} Siswa
          </div>
          <div>
            <span className="font-bold text-slate-900">SELESAI CBT:</span> {classStats.completed} ({classStats.completedPercent}%)
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* COMPLETION PROGRESS METER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-left relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Partisipasi CBT</span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Progress Penyelesaian Kelas</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono mt-1">
              {classStats.completed} <span className="text-xs text-slate-400 font-semibold">/ {classStats.total} Siswa</span>
            </h3>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${classStats.completedPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
              <span>{classStats.completedPercent}% Selesai</span>
              <span>{classStats.inProgress} Sedang Ujian</span>
            </div>
          </div>
        </div>

        {/* COGNITIVE POWER AVERAGE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-left flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full uppercase tracking-wider">IQ Rata-Rata</span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Potensi Kognitif Kolektif</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono mt-1">
              {classStats.avgIq !== null ? classStats.avgIq : 'N/A'}
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
            Rerata Kelas: <span className="font-bold text-cyan-600">{classStats.avgIq !== null ? getIqCategory(classStats.avgIq) : 'Belum Ada Data'}</span>
          </div>
        </div>

        {/* EMOTIONAL INTEGRATION AVERAGE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-left flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">EQ Rata-Rata</span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Regulasi Emosional Kolektif</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono mt-1">
              {classStats.avgEq !== null ? `${classStats.avgEq}/100` : 'N/A'}
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
            Kesiapan Kerja: <span className="font-bold text-emerald-600">{classStats.avgEq !== null ? (classStats.avgEq >= 75 ? 'Sangat Siap Vokasi' : 'Perlu Pendampingan') : 'Belum Ada Data'}</span>
          </div>
        </div>

        {/* DOMINANT HOLLAND TRAIT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-left flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Holland Dominan</span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Kecenderungan Karir Kelas</p>
            <h3 className="text-3xl font-black text-slate-800 font-mono mt-1 flex items-center gap-1">
              {classStats.dominantTrait === 'R' ? 'Realistic' :
               classStats.dominantTrait === 'I' ? 'Investigative' :
               classStats.dominantTrait === 'A' ? 'Artistic' :
               classStats.dominantTrait === 'S' ? 'Social' :
               classStats.dominantTrait === 'E' ? 'Enterprising' :
               classStats.dominantTrait === 'C' ? 'Conventional' : 'Belum Ada'}
            </h3>
          </div>
          <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-2">
            Orientasi Kerja: <span className="font-bold text-amber-600">
              {classStats.dominantTrait === 'R' ? 'Praktis/Teknis & Mekanik' :
               classStats.dominantTrait === 'I' ? 'Riset, IT & Analitis' :
               classStats.dominantTrait === 'A' ? 'Industri Kreatif & Seni' :
               classStats.dominantTrait === 'S' ? 'Pelayanan, HR & Sosial' :
               classStats.dominantTrait === 'E' ? 'Bisnis, Project & Sales' :
               classStats.dominantTrait === 'C' ? 'Administrasi, SOP & Arsip' : 'Menunggu Ujian Selesai'}
            </span>
          </div>
        </div>

      </div>

      {/* CHARTS GRAPHICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* RIASEC BAR DISTRIBUTION CHART */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 text-left">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Distribusi Kecenderungan Minat Holland (RIASEC)</h4>
              <p className="text-[11px] text-slate-500">Jumlah siswa teratas yang menduduki tipe kepribadian karir ini di kelas.</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          {classStats.completed > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riasecChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Siswa" radius={[6, 6, 0, 0]} maxBarSize={30}>
                    {riasecChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-400">Belum ada data RIASEC tersedia.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Siswa harus menyelesaikan ujian terlebih dahulu.</p>
            </div>
          )}
        </div>

        {/* PIE CHART FOR COMPLETION METER */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <h4 className="text-sm font-bold text-slate-800 mb-1">Status Keaktifan Ujian</h4>
          <p className="text-[11px] text-slate-500 mb-4">Grafik penyelesaian ujian siswa di ruang CBT.</p>

          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Selesai', value: classStats.completed, color: '#6366f1' },
                    { name: 'Pengerjaan', value: classStats.inProgress, color: '#3b82f6' },
                    { name: 'Belum Mulai', value: classStats.notStarted, color: '#94a3b8' }
                  ].filter(x => x.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {[
                    { name: 'Selesai', value: classStats.completed, color: '#6366f1' },
                    { name: 'Pengerjaan', value: classStats.inProgress, color: '#3b82f6' },
                    { name: 'Belum Mulai', value: classStats.notStarted, color: '#94a3b8' }
                  ].filter(x => x.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-xl font-bold text-slate-800 font-mono">{classStats.completedPercent}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Partisipasi</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full inline-block"></span>
                Selesai (Laporan Siap)
              </span>
              <span className="font-bold text-slate-800 font-mono">{classStats.completed} Siswa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block"></span>
                Sedang Mengerjakan
              </span>
              <span className="font-bold text-slate-800 font-mono">{classStats.inProgress} Siswa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block"></span>
                Belum Memulai
              </span>
              <span className="font-bold text-slate-800 font-mono">{classStats.notStarted} Siswa</span>
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED STUDENT ROSTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-left">
        
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-lg">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari NIS, nama siswa di kelas..."
                className="w-full bg-slate-50 border border-slate-250 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-250 font-bold text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="proses">Dalam Ujian</option>
              <option value="belum">Belum Mulai</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {/* Locked-only Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showLockedOnly}
                onChange={(e) => setShowLockedOnly(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Siswa Terkunci
              </span>
            </label>

            {/* Mass unlock button */}
            <button
              type="button"
              onClick={handleMassUnlock}
              className="border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[11px] rounded-xl px-3 py-2 transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Buka Semua Kunci
            </button>
          </div>
        </div>

        {/* Student list table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                <th className="px-5 py-4">Siswa</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">IQ (Kategori)</th>
                <th className="px-5 py-4 text-center">EQ Score</th>
                <th className="px-5 py-4 text-center">Dominan RIASEC</th>
                <th className="px-5 py-4 text-center">Pelanggaran</th>
                <th className="px-5 py-4 text-right print:hidden">Navigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRoster.length > 0 ? (
                filteredRoster.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/55 transition-colors">
                    
                    {/* Student Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 font-mono text-xs">
                          {s.name ? s.name.substring(0,2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-medium">NIS: {s.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      {s.lockedOut ? (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                          <AlertTriangle className="w-3 h-3" /> Terkunci
                        </span>
                      ) : s.testCompleted ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                          <CheckCircle className="w-3 h-3" /> Selesai
                        </span>
                      ) : s.testStarted ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase animate-pulse">
                          Dalam Ujian
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase">
                          Belum Mulai
                        </span>
                      )}
                    </td>

                    {/* IQ Score Column */}
                    <td className="px-5 py-3.5 text-center">
                      {s.iqScore !== null ? (
                        <div>
                          <p className="font-bold font-mono text-slate-800">{s.iqScore}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{getIqCategory(s.iqScore)}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* EQ Score Column */}
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                      {s.eqScore !== null ? s.eqScore : <span className="text-slate-400 font-mono">-</span>}
                    </td>

                    {/* Holland dominant letters */}
                    <td className="px-5 py-3.5 text-center">
                      {s.testCompleted ? (
                        <span className="font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                          {getHollandDominant(s)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Cheat warnings and lock trigger */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-mono font-bold ${s.cheatWarnings >= 2 ? 'text-rose-600' : s.cheatWarnings > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                          {s.cheatWarnings || 0} Warns
                        </span>
                        {s.lockReason && (
                          <span className="text-[9px] text-slate-400 mt-0.5 max-w-[120px] truncate block" title={s.lockReason}>
                            {s.lockReason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Navigation/Actions (Hidden in print) */}
                    <td className="px-5 py-3.5 text-right print:hidden">
                      {s.testCompleted && setSelectedStudent && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setActiveTab('reports');
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 ml-auto cursor-pointer"
                        >
                          Lihat Psikogram
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!s.testCompleted && (
                        <span className="text-[10px] text-slate-400 italic">Belum selesai</span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 font-semibold text-slate-400">
                    Tidak ada siswa yang sesuai dengan filter pencarian Anda di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer/Roster Summary (Visible in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between text-[11px] text-slate-500 font-semibold">
          <span>Menampilkan {filteredRoster.length} dari {classStudents.length} siswa kelas {activeClass}</span>
          <span className="hidden print:inline-block">Dihasilkan Secara Mandiri • CBT Core AI Engine</span>
        </div>

      </div>

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
                  window.print();
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

    </div>
  );
}
