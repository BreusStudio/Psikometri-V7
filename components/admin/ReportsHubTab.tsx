'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Users, 
  PieChart, 
  TrendingUp, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  BarChart3, 
  Sparkles,
  School,
  Building2,
  Search,
  Filter
} from 'lucide-react';
import { Student, Question, Dimension, Package, SchoolMajor } from '../../lib/types';
import ReportsTab from './ReportsTab';
import RekapKelasTab from './RekapKelasTab';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export type ReportsSubTabType = 'individual' | 'rombel' | 'jurusan';

interface ReportsHubTabProps {
  store: any;
  onRefresh: () => void;
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
  session: { role: string; id: string; name: string; managed_class?: string; school_origin?: string };
  setActiveTab: (tab: any) => void;
  initialSubTab?: ReportsSubTabType;
}

const RIASEC_COLORS: Record<string, string> = {
  R: '#3b82f6', // Realistic - Blue
  I: '#6366f1', // Investigative - Indigo
  A: '#ec4899', // Artistic - Pink
  S: '#10b981', // Social - Emerald
  E: '#f59e0b', // Enterprising - Amber
  C: '#8b5cf6', // Conventional - Purple
};

const RIASEC_NAMES: Record<string, string> = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional',
};

export default function ReportsHubTab({
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
  activeContextId,
  session,
  setActiveTab,
  initialSubTab = 'individual'
}: ReportsHubTabProps) {
  const [currentSubTab, setCurrentSubTab] = useState<ReportsSubTabType>(initialSubTab);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');
  const [selectedMajorSearch, setSelectedMajorSearch] = useState<string>('');

  // Extract unique school origins for multi-tenant filtering
  const availableSchools = useMemo(() => {
    const schools = new Set<string>();
    students.forEach(s => {
      const origin = (s.schoolOrigin || (s as any).school_origin || '').trim();
      if (origin) schools.add(origin);
    });
    return Array.from(schools).sort();
  }, [students]);

  // Filter students based on selected school
  const filteredStudents = useMemo(() => {
    if (selectedSchoolFilter === 'ALL') return students;
    return students.filter(s => {
      const origin = (s.schoolOrigin || (s as any).school_origin || '').trim();
      return origin === selectedSchoolFilter;
    });
  }, [students, selectedSchoolFilter]);

  // Overall Global KPI Metrics
  const metrics = useMemo(() => {
    const total = filteredStudents.length;
    const completedList = filteredStudents.filter(s => s.testCompleted);
    const completedCount = completedList.length;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    let totalIq = 0;
    let countIq = 0;
    let totalEq = 0;
    let countEq = 0;
    const riasecTotals: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    completedList.forEach(s => {
      if (s.iqScore !== null && s.iqScore !== undefined && s.iqScore > 0) {
        totalIq += s.iqScore;
        countIq++;
      }
      if (s.eqScore !== null && s.eqScore !== undefined && s.eqScore > 0) {
        totalEq += s.eqScore;
        countEq++;
      }
      if (s.riasecScores) {
        Object.entries(s.riasecScores).forEach(([k, v]) => {
          const upperKey = k.toUpperCase();
          if (riasecTotals[upperKey] !== undefined) {
            riasecTotals[upperKey] += Number(v) || 0;
          }
        });
      }
    });

    const avgIq = countIq > 0 ? Math.round(totalIq / countIq) : 0;
    const avgEq = countEq > 0 ? Math.round(totalEq / countEq) : 0;

    // Find dominant RIASEC
    let topRiasec = 'R';
    let maxRiasecVal = -1;
    Object.entries(riasecTotals).forEach(([k, v]) => {
      if (v > maxRiasecVal) {
        maxRiasecVal = v;
        topRiasec = k;
      }
    });

    return {
      total,
      completedCount,
      completionRate,
      avgIq,
      avgEq,
      topRiasec: maxRiasecVal > 0 ? `${topRiasec} (${RIASEC_NAMES[topRiasec] || topRiasec})` : '-'
    };
  }, [filteredStudents]);

  // Major / Concentration Analytics Data
  const majorAnalytics = useMemo(() => {
    const majorMap = new Map<string, {
      name: string;
      code: string;
      students: Student[];
      completedCount: number;
      totalIq: number;
      countIq: number;
      totalEq: number;
      countEq: number;
      riasecSum: Record<string, number>;
    }>();

    // Group students by major (fallback to classGroup extraction or general)
    filteredStudents.forEach(s => {
      let majorKey = (s.major || (s as any).jurusan || '').trim();
      if (!majorKey && s.classGroup) {
        // e.g. "XII RPL 1" -> "RPL", "X TKJ 2" -> "TKJ"
        const parts = s.classGroup.split(' ');
        if (parts.length >= 2) {
          majorKey = parts[1];
        } else {
          majorKey = s.classGroup;
        }
      }
      if (!majorKey) majorKey = 'Umum / Belum Ditentukan';

      if (!majorMap.has(majorKey)) {
        majorMap.set(majorKey, {
          name: majorKey,
          code: majorKey.toUpperCase(),
          students: [],
          completedCount: 0,
          totalIq: 0,
          countIq: 0,
          totalEq: 0,
          countEq: 0,
          riasecSum: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
        });
      }

      const entry = majorMap.get(majorKey)!;
      entry.students.push(s);

      if (s.testCompleted) {
        entry.completedCount++;
        if (s.iqScore && s.iqScore > 0) {
          entry.totalIq += s.iqScore;
          entry.countIq++;
        }
        if (s.eqScore && s.eqScore > 0) {
          entry.totalEq += s.eqScore;
          entry.countEq++;
        }
        if (s.riasecScores) {
          Object.entries(s.riasecScores).forEach(([k, v]) => {
            const upper = k.toUpperCase();
            if (entry.riasecSum[upper] !== undefined) {
              entry.riasecSum[upper] += Number(v) || 0;
            }
          });
        }
      }
    });

    const results = Array.from(majorMap.values()).map(m => {
      const avgIq = m.countIq > 0 ? Math.round(m.totalIq / m.countIq) : 0;
      const avgEq = m.countEq > 0 ? Math.round(m.totalEq / m.countEq) : 0;

      // Find top 2 RIASEC for this major
      const sortedRiasec = Object.entries(m.riasecSum)
        .sort((a, b) => b[1] - a[1])
        .filter(([_, val]) => val > 0);

      const dominantCode = sortedRiasec.length > 0 ? sortedRiasec.slice(0, 2).map(r => r[0]).join('-') : '-';

      return {
        ...m,
        avgIq,
        avgEq,
        dominantCode,
        completionRate: m.students.length > 0 ? Math.round((m.completedCount / m.students.length) * 100) : 0
      };
    });

    return results.sort((a, b) => b.students.length - a.students.length);
  }, [filteredStudents]);

  // Overall Holland RIASEC Chart Data for Major Tab
  const globalRiasecChartData = useMemo(() => {
    const totals: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    filteredStudents.filter(s => s.testCompleted).forEach(s => {
      if (s.riasecScores) {
        Object.entries(s.riasecScores).forEach(([k, v]) => {
          const upper = k.toUpperCase();
          if (totals[upper] !== undefined) {
            totals[upper] += Number(v) || 0;
          }
        });
      }
    });

    return Object.entries(totals).map(([key, val]) => ({
      type: key,
      name: RIASEC_NAMES[key] || key,
      score: val,
      color: RIASEC_COLORS[key] || '#6366f1'
    }));
  }, [filteredStudents]);

  const filteredMajorList = useMemo(() => {
    if (!selectedMajorSearch.trim()) return majorAnalytics;
    const term = selectedMajorSearch.toLowerCase();
    return majorAnalytics.filter(m => m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term));
  }, [majorAnalytics, selectedMajorSearch]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* HEADER & GLOBAL KPI CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Pusat Hasil & Rekapitulasi
              </span>
              {availableSchools.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {availableSchools.length} Instansi Terdaftar
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Laporan Evaluasi & Rekapitulasi Terpadu
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1 max-w-2xl">
              Satu pusat untuk analisis hasil individu, rekapitulasi rombel kelas, dan tren minat jurusan secara real-time.
            </p>
          </div>

          {/* School Tenant Filter */}
          {availableSchools.length > 0 && (
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start lg:self-auto">
              <div className="flex items-center gap-2 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <School className="w-4 h-4 text-indigo-600" />
                <span>Instansi:</span>
              </div>
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                aria-label="Filter Instansi"
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Semua Instansi (Global)</option>
                {availableSchools.map(sch => (
                  <option key={sch} value={sch}>{sch}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Peserta</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-800">{metrics.total}</span>
              <span className="text-xs font-semibold text-slate-500">siswa</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Tingkat Kelulusan</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-700">{metrics.completionRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">({metrics.completedCount} selesai)</span>
            </div>
          </div>

          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Rata-rata IQ</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-indigo-700">{metrics.avgIq || '-'}</span>
              <span className="text-xs font-semibold text-indigo-500">kognitif</span>
            </div>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Rata-rata EQ</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-purple-700">{metrics.avgEq || '-'}</span>
              <span className="text-xs font-semibold text-purple-500">emosional</span>
            </div>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Dominan Minat</span>
            <div className="flex items-baseline gap-1 mt-1 truncate">
              <span className="text-base font-black text-amber-800 truncate">{metrics.topRiasec}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENTED SUB-TAB SWITCHER */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 print:hidden">
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setCurrentSubTab('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'individual'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Hasil Individu & AI</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('rombel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'rombel'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Rekapitulasi Rombel</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentSubTab('jurusan')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentSubTab === 'jurusan'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Analisis Peminatan & Jurusan</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Data tersinkronisasi otomatis
        </div>
      </div>

      {/* SUB-TAB VIEW 1: HASIL INDIVIDU & AI */}
      {currentSubTab === 'individual' && (
        <ReportsTab
          store={store}
          onRefresh={onRefresh}
          students={filteredStudents}
          selectedStudent={selectedStudent}
          setSelectedStudent={setSelectedStudent}
          studentPage={studentPage}
          setStudentPage={setStudentPage}
          studentsPerPage={studentsPerPage}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
          loadingAi={loadingAi}
          triggerGeminiAnalysis={triggerGeminiAnalysis}
          questions={questions}
          dimensions={dimensions}
          packages={packages}
          activeContextId={activeContextId}
        />
      )}

      {/* SUB-TAB VIEW 2: REKAPITULASI ROMBEL */}
      {currentSubTab === 'rombel' && (
        <RekapKelasTab
          store={store}
          students={filteredStudents}
          onRefresh={onRefresh}
          session={session}
          setActiveTab={setActiveTab}
          setSelectedStudent={setSelectedStudent}
          activeContextId={activeContextId}
        />
      )}

      {/* SUB-TAB VIEW 3: ANALISIS PEMINATAN & KONSENTRASI JURUSAN */}
      {currentSubTab === 'jurusan' && (
        <div className="space-y-6 animate-fade-in">
          {/* Visual Distribution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global RIASEC Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Distribusi Minat RIASEC Populasi</h3>
                  <p className="text-xs text-slate-500 font-medium">Akumulasi skor minat bakat Holland dari seluruh siswa yang telah menyelesaikan tes.</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalRiasecChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} Poin`, 'Total Akumulasi']}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {globalRiasecChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
                {globalRiasecChartData.map(item => (
                  <div key={item.type} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-black text-slate-700">{item.type}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 block truncate">{item.name}</span>
                    <span className="text-xs font-bold text-slate-900 mt-0.5 block">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIASEC Insight Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold tracking-wide backdrop-blur-sm mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Insight AI Peminatan</span>
                </div>
                <h3 className="text-xl font-black tracking-tight leading-snug">
                  Profil Karir Paling Dominan: <span className="text-indigo-300">{metrics.topRiasec}</span>
                </h3>
                <p className="text-xs text-slate-300 font-normal leading-relaxed mt-2">
                  Populasi siswa yang diuji menunjukkan kecenderungan minat kuat pada ranah {metrics.topRiasec}. 
                  Disarankan untuk mengarahkan pendalaman vokasi, magang industri, dan pilihan program studi yang linier dengan klaster ini.
                </p>
              </div>

              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Sebaran per Jurusan Terdeteksi</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{majorAnalytics.length}</span>
                  <span className="text-xs font-medium text-slate-300">kelompok konsentrasi</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Semua kelompok terdaftar siap dipetakan ke Standar Kompetensi Kerja & Rekomendasi Karir.
                </p>
              </div>
            </div>
          </div>

          {/* Major Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Tabel Komparasi Konsentrasi & Jurusan</h3>
                <p className="text-xs text-slate-500 font-medium">Metrik rata-rata kemampuan kognitif, emosional, dan kode Holland per peminatan.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari jurusan..."
                  value={selectedMajorSearch}
                  onChange={(e) => setSelectedMajorSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Konsentrasi / Jurusan</th>
                    <th className="py-3.5 px-4 text-center">Total Siswa</th>
                    <th className="py-3.5 px-4 text-center">Selesai Tes</th>
                    <th className="py-3.5 px-4 text-center">Rerata IQ</th>
                    <th className="py-3.5 px-4 text-center">Rerata EQ</th>
                    <th className="py-3.5 px-4 text-center">Profil RIASEC Dominan</th>
                    <th className="py-3.5 px-4 text-right">Status Kesiapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMajorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data konsentrasi jurusan yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMajorList.map((major, idx) => (
                      <tr key={major.name} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-mono font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                              {idx + 1}
                            </span>
                            <span>{major.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                          {major.students.length}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {major.completedCount} ({major.completionRate}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {major.avgIq || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                          {major.avgEq || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {major.dominantCode !== '-' ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 text-[11px]">
                              {major.dominantCode}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {major.completionRate === 100 ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
                              Lengkap 100%
                            </span>
                          ) : major.completedCount > 0 ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full">
                              Sedang Berjalan
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                              Belum Tes
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
