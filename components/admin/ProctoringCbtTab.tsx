'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, Shield, Users, RefreshCw, Key, Power, AlertTriangle, CheckCircle, Search, 
  UserX, Unlock, XCircle, Monitor, Clock, PlayCircle, ShieldCheck, Check
} from 'lucide-react';
import { Student } from '../../lib/types';
import { PsychometricStore } from '../../lib/mockData';

interface ProctoringCbtTabProps {
  store: PsychometricStore;
  students: Student[];
  onRefresh: () => void;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ProctoringCbtTab({ store, students, onRefresh, showNotification }: ProctoringCbtTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState<'Aktif' | 'Standby' | 'Maintenance'>('Aktif');
  const [selectedAuditStudent, setSelectedAuditStudent] = useState<Student | null>(null);
  
  const testSettings = store.getTestSettings();
  const currentProctoringMode = testSettings.proctoringMode || 'AUDIT_ONLY';

  const handleSetProctoringMode = (mode: 'AUDIT_ONLY' | 'STRICT') => {
    store.updateTestSettings({ proctoringMode: mode });
    if (showNotification) {
      showNotification(
        mode === 'AUDIT_ONLY'
          ? 'Mode Pengawasan diubah ke: MODE AUDIT TRANSPARAN (Rekomendasi Sekolah).'
          : 'Mode Pengawasan diubah ke: MODE KETAT (Strict Lockout 3x Pelanggaran).',
        'success'
      );
    }
    onRefresh();
  };
  
  // Filter active/online students
  const activeStudents = students.filter(s => s.testStarted && !s.testCompleted);
  const completedStudents = students.filter(s => s.testCompleted);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.classGroup && s.classGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleResetLogin = (nim: string) => {
    store.updateStudent(nim, { lockedOut: false, lockReason: null, testStarted: false });
    if (showNotification) showNotification(`Login peserta ${nim} berhasil direset.`, 'success');
    onRefresh();
  };

  const handleForceLogout = (nim: string) => {
    store.updateStudent(nim, { testStarted: false });
    if (showNotification) showNotification(`Peserta ${nim} berhasil dipaksa logout.`, 'success');
    onRefresh();
  };

  const handleResetExam = (nim: string) => {
    store.updateStudent(nim, { 
      testStarted: false, 
      testCompleted: false, 
      currentQuestionIndex: 0, 
      answers: {}, 
      completedTests: [], 
      examStartedAt: null 
    });
    if (showNotification) showNotification(`Ujian peserta ${nim} berhasil diulang (reset total).`, 'success');
    onRefresh();
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in zoom-in duration-300">
      
      {/* HEADER ANBK STYLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Monitor className="w-6 h-6 text-indigo-600" />
              CBT Server & Proctoring Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manajemen aktivitas server CBT, token ujian, dan pengawasan peserta (Referensi Standar ANBK).</p>
          </div>
          <div className="flex items-center gap-3">
             <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-xs shadow-sm ${
               serverStatus === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
               serverStatus === 'Standby' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
               'bg-rose-50 text-rose-700 border-rose-200'
             }`}>
                <div className={`w-2.5 h-2.5 rounded-full ${serverStatus === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></div>
                Status Server: {serverStatus}
             </div>
             <button onClick={onRefresh} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer shadow-sm">
                <RefreshCw className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {/* PROCTORING STRICTNESS QUICK SELECTOR BANNER */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Mode Pengawasan Ujian (Anti-Curang)</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                currentProctoringMode === 'AUDIT_ONLY'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {currentProctoringMode === 'AUDIT_ONLY' ? 'MODE AUDIT TRANSPARAN AKTIF' : 'MODE KETAT (LOCKOUT) AKTIF'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pilih perlakuan sistem saat peserta meninggalkan layar ujian (berpindah aplikasi / keluar layar penuh).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSetProctoringMode('AUDIT_ONLY')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                currentProctoringMode === 'AUDIT_ONLY'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${currentProctoringMode === 'AUDIT_ONLY' ? 'opacity-100' : 'opacity-0'}`} />
              Mode Audit Transparan (Rekomendasi Sekolah)
            </button>

            <button
              type="button"
              onClick={() => handleSetProctoringMode('STRICT')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                currentProctoringMode === 'STRICT'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md shadow-amber-600/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${currentProctoringMode === 'STRICT' ? 'opacity-100' : 'opacity-0'}`} />
              Mode Ketat (Strict Lockout)
            </button>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Terdaftar</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{students.length}</h3>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Sedang Ujian (Online)</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">{activeStudents.length}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Selesai Ujian</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{completedStudents.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Terkunci / Anomali</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{students.filter(s => s.lockedOut).length}</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: SERVER CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                 <Power className="w-4 h-4 text-indigo-600" /> Kontrol Aktivasi Server
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 Ubah status server untuk mengizinkan atau menolak akses login CBT bagi seluruh peserta ujian secara bersamaan.
              </p>
              <div className="grid grid-cols-1 gap-3">
                 <button 
                   onClick={() => setServerStatus('Aktif')}
                   className={`w-full text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border ${serverStatus === 'Aktif' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                 >
                   AKTIFKAN SERVER (START)
                 </button>
                 <button 
                   onClick={() => setServerStatus('Standby')}
                   className={`w-full text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border ${serverStatus === 'Standby' ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                 >
                   MODE STANDBY (PAUSE)
                 </button>
                 <button 
                   onClick={() => setServerStatus('Maintenance')}
                   className={`w-full text-xs font-bold py-3 rounded-xl transition-all cursor-pointer border ${serverStatus === 'Maintenance' ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                 >
                   NONAKTIFKAN (STOP)
                 </button>
              </div>
           </div>

           <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                 <Key className="w-4 h-4 text-indigo-600" /> Token Rilis Dinamis
              </h3>
              <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">
                 Token ujian CBT di-generate secara dinamis di Sidebar kiri. Peserta harus memasukkan token tersebut agar dapat memulai ujian.
              </p>
           </div>
        </div>

        {/* RIGHT COL: STUDENTS PROCTORING LIST */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500" /> Pengawasan Peserta Aktif
                 </h3>
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari NIK/NISN atau Nama..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                          <th className="p-3 border-b border-slate-200">Peserta</th>
                          <th className="p-3 border-b border-slate-200">Status</th>
                          <th className="p-3 border-b border-slate-200">Progres / Pelanggaran</th>
                          <th className="p-3 border-b border-slate-200 text-center">Aksi (Proctor)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                       {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-3">
                                <p className="font-bold text-slate-800">{student.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{student.id} &bull; {student.classGroup || '-'}</p>
                             </td>
                             <td className="p-3">
                                {student.lockedOut ? (
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                      <AlertTriangle className="w-3 h-3" /> Terkunci
                                   </span>
                                ) : student.testCompleted ? (
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                      <CheckCircle className="w-3 h-3" /> Selesai
                                   </span>
                                ) : student.testStarted ? (
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> Online
                                   </span>
                                ) : (
                                   <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                      Offline
                                   </span>
                                )}
                             </td>
                             <td className="p-3 text-[10px] text-slate-600 font-medium">
                                <div className="space-y-1">
                                  {student.completedTests && student.completedTests.length > 0 ? (
                                    <p className="text-emerald-600 font-bold">Lulus: {student.completedTests.join(', ')}</p>
                                  ) : (
                                    <p>Belum ada sub-tes selesai</p>
                                  )}
                                  {student.cheatWarnings !== undefined && student.cheatWarnings > 0 && (
                                     <p className="text-amber-600 font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {student.cheatWarnings} Peringatan (Tab Pindah)
                                     </p>
                                  )}
                                </div>
                             </td>
                             <td className="p-3 text-center space-x-1">
                                {student.testStarted && !student.testCompleted && (
                                   <button 
                                     onClick={() => handleForceLogout(student.id)}
                                     title="Paksa Keluar"
                                     className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                                   >
                                      <UserX className="w-4 h-4" />
                                   </button>
                                )}
                                {student.lockedOut && (
                                   <button 
                                     onClick={() => handleResetLogin(student.id)}
                                     title="Reset Login / Buka Kunci"
                                     className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                   >
                                      <Unlock className="w-4 h-4" />
                                   </button>
                                )}
                                {(student.testStarted || student.testCompleted) && (
                                   <button 
                                     onClick={() => {
                                       if (window.confirm(`Yakin ingin mereset total ujian ${student.name}? Semua jawaban akan dihapus.`)) {
                                          handleResetExam(student.id);
                                       }
                                     }}
                                     title="Reset Total Ujian"
                                     className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                   >
                                      <RefreshCw className="w-4 h-4" />
                                   </button>
                                )}
                             </td>
                          </tr>
                       )) : (
                          <tr>
                             <td colSpan={4} className="p-8 text-center text-slate-500">
                                Tidak ada data peserta yang cocok.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

      </div>

      {/* MODAL AUDIT LOG ANTI-CHEAT */}
      {selectedAuditStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" /> Security Audit Log CBT
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedAuditStudent.name} ({selectedAuditStudent.id}) &bull; {selectedAuditStudent.classGroup || 'Umum'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {selectedAuditStudent.cheatLogs && selectedAuditStudent.cheatLogs.length > 0 ? (
                selectedAuditStudent.cheatLogs.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                        Pelanggaran #{(selectedAuditStudent.cheatLogs?.length || 0) - idx}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')} ({new Date(log.timestamp).toLocaleDateString('id-ID')})
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 leading-snug">{log.reason}</p>
                    {log.userAgent && (
                      <p className="text-[9px] text-slate-400 font-mono truncate" title={log.userAgent}>
                        Device: {log.userAgent}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center font-semibold">
                  Tercatat {selectedAuditStudent.cheatWarnings} peringatan otomatis. Belum ada rincian riwayat perangkat.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAuditStudent(null)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Tutup Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
