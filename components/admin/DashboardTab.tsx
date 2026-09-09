'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../../lib/types';
import { PsychometricStore, getRotatingToken } from '../../lib/mockData';
import { ShieldAlert, RefreshCw, CheckCircle, Clock, AlertTriangle, Terminal, History, Unlock, Users, Info } from 'lucide-react';
import { useToast } from '@/components/shared/ToastContext';

// Modular child components
import QuotaNotification from './dashboard/QuotaNotification';
import TokenRotatorCard from './dashboard/TokenRotatorCard';
import InteractiveCharts from './dashboard/InteractiveCharts';
import StudentsTable from './dashboard/StudentsTable';
import CareerGuidanceTips from './dashboard/CareerGuidanceTips';

interface DashboardTabProps {
  students: Student[];
  tokenInfo?: { token: string; secondsLeft: number };
  setStatModal: (val: { title: string; students: Student[] } | null) => void;
  session?: { role: string; name: string; managed_class?: string };
  store: PsychometricStore;
}

export default function DashboardTab({ students, tokenInfo, setStatModal, session, store }: DashboardTabProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // Local self-refreshing token info to avoid re-rendering parent components
  const [localTokenInfo, setLocalTokenInfo] = useState(() => getRotatingToken());
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTokenInfo(getRotatingToken());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeToken = tokenInfo || localTokenInfo;

  // State for interactive charts and listing
  const [selectedFilter, setSelectedFilter] = useState<{
    type: 'all' | 'major' | 'riasec' | 'status' | 'troubled' | 'locked';
    value: string;
    label: string;
  }>({ type: 'all', value: 'all', label: 'Semua Siswa Aktif' });

  const [searchTerm, setSearchTerm] = useState('');

  // Sisa Kuota Ujian info
  const quota = store.getQuotaInfo();

  // Compute troubled students
  const troubledStudents = useMemo(() => {
    return students.filter(s => {
      const isLowIq = s.iqScore !== null && s.iqScore < 90;
      const isLowEq = s.eqScore !== null && s.eqScore < 90;
      const isCheating = s.lockedOut || s.cheatWarnings >= 2;
      return s.testCompleted && (isLowIq || isLowEq || isCheating);
    });
  }, [students]);

  // Generate Live Activity Feed from real student statuses
  const liveLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      studentName: string;
      classGroup: string;
      action: string;
      time: string;
      type: 'critical' | 'warning' | 'success' | 'info';
    }> = [];

    // Add locked out students
    students.filter(s => s.lockedOut).forEach((s, idx) => {
      logs.push({
        id: `lock-${s.id}-${idx}`,
        studentName: s.name,
        classGroup: s.classGroup || 'SMK',
        action: `TERKUNCI: ${s.lockReason || 'Melanggar integritas ujian (berpindah tab browser)'}`,
        time: '3m ago',
        type: 'critical'
      });
    });

    // Add warning students
    students.filter(s => s.cheatWarnings > 0 && !s.lockedOut).forEach((s, idx) => {
      logs.push({
        id: `warn-${s.id}-${idx}`,
        studentName: s.name,
        classGroup: s.classGroup || 'SMK',
        action: `Peringatan Keamanan ke-${s.cheatWarnings}: Berpindah jendela/layar browser`,
        time: '12m ago',
        type: 'warning'
      });
    });

    // Add completed students (limit to first 3)
    students.filter(s => s.testCompleted).slice(0, 3).forEach((s, idx) => {
      logs.push({
        id: `comp-${s.id}-${idx}`,
        studentName: s.name,
        classGroup: s.classGroup || 'SMK',
        action: 'Menyelesaikan seluruh sub-tes psikometri. Laporan psikogram berhasil di-render oleh AI.',
        time: '34m ago',
        type: 'success'
      });
    });

    // Add in-progress students (limit to first 3)
    students.filter(s => s.testStarted && !s.testCompleted).slice(0, 3).forEach((s, idx) => {
      logs.push({
        id: `prog-${s.id}-${idx}`,
        studentName: s.name,
        classGroup: s.classGroup || 'SMK',
        action: 'Sedang mengerjakan Sub-Tes EQ & Holland Peminatan Karir',
        time: 'Active',
        type: 'info'
      });
    });

    // Sort or return
    return logs.slice(0, 8); // Top 8 log items
  }, [students]);

  const completedCount = useMemo(() => {
    return students.filter(s => s.testCompleted).length;
  }, [students]);

  const lockedCount = useMemo(() => {
    return students.filter(s => s.lockedOut).length;
  }, [students]);

  // Compute RIASEC stats for Recharts
  const riasecData = useMemo(() => {
    const keys = [
      { key: 'R', label: 'Realistic', color: '#ef4444', desc: 'Praktis/Teknis' },
      { key: 'I', label: 'Investigative', color: '#3b82f6', desc: 'Peneliti/Sains' },
      { key: 'A', label: 'Artistic', color: '#ec4899', desc: 'Kreatif/Seni' },
      { key: 'S', label: 'Social', color: '#10b981', desc: 'Sosial/Pelayanan' },
      { key: 'E', label: 'Enterprising', color: '#f59e0b', desc: 'Pebisnis/Pemimpin' },
      { key: 'C', label: 'Conventional', color: '#6366f1', desc: 'Struktur/Organis' }
    ];

    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    students.forEach(s => {
      if (s.riasecScores && s.testCompleted) {
        const sorted = Object.entries(s.riasecScores).sort((a,b) => b[1] - a[1]);
        const topTrait = sorted[0]?.[0] as keyof typeof counts;
        if (topTrait && counts[topTrait] !== undefined) {
          counts[topTrait]++;
        }
      }
    });

    return keys.map(item => ({
      key: item.key,
      name: item.label,
      desc: item.desc,
      value: counts[item.key as keyof typeof counts] || 0,
      color: item.color
    }));
  }, [students]);

  // Compute CBT status stats for Donut Chart
  const completionData = useMemo(() => {
    const completed = students.filter(s => s.testCompleted).length;
    const inProgress = students.filter(s => s.testStarted && !s.testCompleted).length;
    const notStarted = students.filter(s => !s.testStarted).length;

    return [
      { name: 'Selesai', value: completed, color: '#10b981' },
      { name: 'Sedang Mengerjakan', value: inProgress, color: '#3b82f6' },
      { name: 'Belum Mulai', value: notStarted, color: '#94a3b8' }
    ].filter(item => item.value > 0);
  }, [students]);

  // Filter students based on interactive selection
  const filteredStudents = useMemo(() => {
    let result = students;

    if (selectedFilter.type === 'major') {
      result = students.filter(s => (s.classGroup || '').toUpperCase().includes(selectedFilter.value.toUpperCase()));
    } else if (selectedFilter.type === 'riasec') {
      result = students.filter(s => {
        if (!s.riasecScores || !s.testCompleted) return false;
        const sorted = Object.entries(s.riasecScores).sort((a,b) => b[1] - a[1]);
        return sorted[0]?.[0] === selectedFilter.value;
      });
    } else if (selectedFilter.type === 'status') {
      if (selectedFilter.value === 'Selesai') {
        result = students.filter(s => s.testCompleted);
      } else if (selectedFilter.value === 'Sedang Mengerjakan') {
        result = students.filter(s => s.testStarted && !s.testCompleted);
      } else {
        result = students.filter(s => !s.testStarted);
      }
    } else if (selectedFilter.type === 'troubled') {
      result = troubledStudents;
    } else if (selectedFilter.type === 'locked') {
      result = students.filter(s => s.lockedOut);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.name || '').toLowerCase().includes(term) || 
        (s.id || '').toLowerCase().includes(term) ||
        (s.classGroup || '').toLowerCase().includes(term)
      );
    }

    return result;
  }, [students, selectedFilter, searchTerm, troubledStudents]);

  // Action: toggle lock cheat state
  const handleToggleCheatLock = (studentId: string, isLocked: boolean) => {
    const s = students.find(x => x.id === studentId);
    if (s) {
      store.saveStudent({
        ...s,
        lockedOut: !isLocked,
        lockReason: !isLocked ? 'Kunci dilepas oleh Guru BK' : 'Membuka tab di luar ujian'
      });
      showSuccessToast(`Status kunci siswa ${s.name} berhasil diubah.`);
    }
  };

  const handleBulkAction = (ids: string[], action: 'lock' | 'unlock' | 'delete' | 'reset') => {
    if (action === 'delete') {
      if (window.confirm(`Hapus ${ids.length} siswa terpilih secara permanen?`)) {
        ids.forEach(id => store.deleteStudent(id));
        showSuccessToast('Berhasil menghapus siswa.');
      }
    } else if (action === 'lock') {
      ids.forEach(id => {
        const s = students.find(x => x.id === id);
        if (s) {
          store.saveStudent({
            ...s,
            lockedOut: true,
            lockReason: 'Dikunci secara massal oleh admin'
          });
        }
      });
      showSuccessToast(`Berhasil mengunci ${ids.length} siswa.`);
    } else if (action === 'unlock') {
      ids.forEach(id => {
        const s = students.find(x => x.id === id);
        if (s) {
          store.saveStudent({
            ...s,
            lockedOut: false,
            lockReason: ''
          });
        }
      });
      showSuccessToast(`Berhasil membuka kunci ${ids.length} siswa.`);
    } else if (action === 'reset') {
      if (window.confirm(`Reset progress ujian untuk ${ids.length} siswa terpilih? Data jawaban akan dihapus.`)) {
        ids.forEach(id => store.resetStudentTest(id));
        showSuccessToast('Berhasil mereset progress ujian.');
      }
    }
  };

  // Sub-tab state for Dashboard
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'supervision' | 'students' | 'tips'>('overview');

  const dashboardTabs = [
    { id: 'overview', label: 'Overview & Statistik', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'supervision', label: 'Live Supervision', icon: <Terminal className="w-4 h-4" /> },
    { id: 'students', label: 'Daftar Siswa', icon: <Users className="w-4 h-4" /> },
    { id: 'tips', label: 'Panduan Karir', icon: <Info className="w-4 h-4" /> }
  ];

  const userRole = (session?.role || '').toLowerCase().trim();
  const showComparativeCharts = userRole === 'waka' || userRole === 'kepala sekolah' || userRole === 'superadmin' || userRole === 'admin' || userRole === 'guru bk' || userRole === 'bk';

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* SISA KUOTA UJIAN CBT NOTIFICATION COMPONENT */}
      <QuotaNotification quota={quota} />

      {/* DASHBOARD SUB-TABS */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs gap-2">
        {dashboardTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer w-full text-center ${
              activeSubTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* UPPER CARDS GRID: STATS & ROTATING TOKEN */}
          <TokenRotatorCard
            activeToken={activeToken}
            completedCount={completedCount}
            totalStudents={students.length}
            lockedCount={lockedCount}
            troubledCount={troubledStudents.length}
            onSelectFilter={(f) => {
              setSelectedFilter(f);
              setActiveSubTab('students'); // Auto-switch to students list
            }}
          />

          {/* MID SECTION: MODERN INTERACTIVE CHARTS */}
          {showComparativeCharts && (
            <InteractiveCharts
              riasecData={riasecData}
              completionData={completionData}
              completedCount={completedCount}
              onSelectFilter={(f) => {
                setSelectedFilter(f);
                setActiveSubTab('students'); // Auto-switch to students list
              }}
            />
          )}
        </div>
      )}

      {activeSubTab === 'supervision' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Left Panel: Real-time Monitor Stream */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl lg:col-span-2 text-left font-mono">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Konsol Live Pengawasan CBT</h4>
                <p className="text-[10px] text-slate-400">Stream aktivitas siswa di ruang ujian secara real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] text-indigo-300 uppercase font-black">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              Live Tracking
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {liveLogs.length > 0 ? (
              liveLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-[11px] hover:bg-slate-850 p-2 rounded-lg transition-colors border-l-2 border-transparent hover:border-indigo-500">
                  <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                  <div className="flex-1">
                    <span className="text-indigo-300 font-bold">{log.studentName}</span>{' '}
                    <span className="text-slate-400 font-semibold">({log.classGroup})</span>{' '}
                    <span className={
                      log.type === 'critical' ? 'text-rose-400 font-black' :
                      log.type === 'warning' ? 'text-amber-400 font-bold' :
                      log.type === 'success' ? 'text-emerald-400 font-medium' :
                      'text-sky-300'
                    }>
                      {log.action}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 font-medium text-xs">
                Tidak ada aktivitas ujian yang terdeteksi saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Shield Security / Lockout Manager */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Siswa Terkunci ({students.filter(s => s.lockedOut).length})
            </h4>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase">
              Shield Alert
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
            Siswa berikut otomatis terkunci oleh sistem karena berpindah tab browser / menutup browser selama ujian berlangsung.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {students.filter(s => s.lockedOut).length > 0 ? (
              students.filter(s => s.lockedOut).map((s) => (
                <div key={s.id} className="p-3 bg-rose-50/50 border border-rose-150 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-bold text-rose-950 truncate max-w-[150px]">{s.name}</p>
                    <p className="text-[9px] text-rose-600 font-mono font-bold">{s.classGroup} • Warns: {s.cheatWarnings}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCheatLock(s.id, true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors cursor-pointer shrink-0 uppercase"
                  >
                    <Unlock className="w-3 h-3" />
                    Buka Kunci
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-1.5" />
                <p className="text-[11px] font-bold text-slate-500">Integritas 100% Terjaga</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Tidak ada kecurangan terdeteksi.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      )}

      {activeSubTab === 'students' && (
        <div className="animate-fade-in">
          {/* DETAILED INTERACTIVE LISTING VIEW (Saringan Siswa Interaktif) */}
          <StudentsTable
            filteredStudents={filteredStudents}
            selectedFilter={selectedFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onResetFilter={() => {
              setSelectedFilter({ type: 'all', value: 'all', label: 'Semua Siswa Aktif' });
              setSearchTerm('');
            }}
            onToggleCheatLock={handleToggleCheatLock}
            onOpenDetail={(s) => setStatModal({ title: `Analisis & Jawaban Siswa: ${s.name}`, students: [s] })}
            onBulkAction={handleBulkAction}
          />
        </div>
      )}

      {activeSubTab === 'tips' && (
        <div className="animate-fade-in">
          {/* TIPS FOR CAREER GUIDANCE (RIASEC HOLLAND CODE INFO) */}
          <CareerGuidanceTips />
        </div>
      )}

    </div>
  );
}
