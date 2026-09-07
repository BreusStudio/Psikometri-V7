'use client';

import React from 'react';
import { Users, Search, AlertTriangle, UserCheck, RotateCw, Printer, Sparkles } from 'lucide-react';
import { Student } from '../../../lib/types';
import { getContextLabels } from '../../../lib/metadata';

interface StudentSidebarProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  angkatanFilter: string;
  onAngkatanFilterChange: (value: string) => void;
  kelasFilter: string;
  onKelasFilterChange: (value: string) => void;
  showTroubledOnly: boolean;
  onShowTroubledOnlyChange: (value: boolean) => void;
  studentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  studentsPerPage: number;
  uniqueAngkatans: number[];
  uniqueClasses: string[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (ids: string[]) => void;
  onBatchPrint?: () => void;
  onBatchAiAnalysis?: () => void;
  activeContextId?: string;
}

export default function StudentSidebar({
  students,
  selectedStudent,
  onSelectStudent,
  searchTerm,
  onSearchChange,
  angkatanFilter,
  onAngkatanFilterChange,
  kelasFilter,
  onKelasFilterChange,
  showTroubledOnly,
  onShowTroubledOnlyChange,
  studentPage,
  onPageChange,
  totalPages,
  studentsPerPage,
  uniqueAngkatans,
  uniqueClasses,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onBatchPrint,
  onBatchAiAnalysis,
  activeContextId
}: StudentSidebarProps) {
  const ctx = React.useMemo(() => getContextLabels(activeContextId), [activeContextId]);

  // Filtered list of students locally in sidebar
  const filteredStudents = React.useMemo(() => {
    return students.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const angkatanMatch = angkatanFilter === 'All' || String(s.angkatan) === angkatanFilter;
      const kelasMatch = kelasFilter === 'All' || s.classGroup === kelasFilter;
      
      let troubledMatch = true;
      if (showTroubledOnly) {
        const isTroubled = s.testCompleted && (
          s.lockedOut || 
          s.cheatWarnings >= 2 || 
          (s.iqScore !== null && s.iqScore < 90) || 
          (s.eqScore !== null && s.eqScore < 90) ||
          s.aiAnalysis?.hasPotentialIssues === true
        );
        troubledMatch = isTroubled;
      }

      return nameMatch && angkatanMatch && kelasMatch && troubledMatch;
    });
  }, [students, searchTerm, angkatanFilter, kelasFilter, showTroubledOnly]);

  const startIndex = (studentPage - 1) * studentsPerPage;
  const paginatedStudents = React.useMemo(() => {
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, startIndex, studentsPerPage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit text-left animate-fade-in">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-indigo-500" />
          Pilih {ctx.entitySingular}
        </h3>
        {onToggleSelectAll && filteredStudents.length > 0 && (
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox"
              className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3 border-slate-300"
              checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
              onChange={() => onToggleSelectAll(filteredStudents.map(s => s.id))}
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Pilih Semua</span>
          </label>
        )}
      </div>

      {/* Filter Panel */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/20 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Cari nama, ID, atau ${ctx.classShortLabel.toLowerCase()}...`}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-800"
          />
        </div>

        {/* Grid for Angkatan & Kelas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{ctx.cohortShortLabel}</label>
            <select 
              value={angkatanFilter} 
              onChange={(e) => onAngkatanFilterChange(e.target.value)}
              className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700 cursor-pointer"
            >
              <option value="All">Semua</option>
              {uniqueAngkatans.map(year => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">{ctx.classShortLabel}</label>
            <select 
              value={kelasFilter} 
              onChange={(e) => onKelasFilterChange(e.target.value)}
              className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700 cursor-pointer"
            >
              <option value="All">Semua</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Potential Problems Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input 
            type="checkbox"
            checked={showTroubledOnly}
            onChange={(e) => onShowTroubledOnlyChange(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-400 h-3.5 w-3.5 border-slate-300"
          />
          <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Hanya Potensi Masalah
          </span>
        </label>
      </div>

      <div className="p-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/30">
        <button 
          type="button"
          onClick={() => onPageChange(Math.max(1, studentPage - 1))} 
          disabled={studentPage === 1} 
          className="text-[10px] px-2 py-1 bg-white border border-slate-250 hover:bg-slate-50 rounded font-medium disabled:opacity-50 cursor-pointer text-slate-600"
        >
          Prev
        </button>
        <span className="text-[10px] text-slate-500 font-medium">Hal {studentPage} / {totalPages}</span>
        <button 
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, studentPage + 1))} 
          disabled={studentPage >= totalPages} 
          className="text-[10px] px-2 py-1 bg-white border border-slate-250 hover:bg-slate-50 rounded font-medium disabled:opacity-50 cursor-pointer text-slate-600"
        >
          Next
        </button>
      </div>

      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {paginatedStudents.map((student) => (
          <div 
            key={student.id}
            className={`flex items-stretch hover:bg-slate-50 transition-colors border-b border-slate-100 ${
              selectedStudent?.id === student.id ? 'bg-indigo-50/60' : ''
            }`}
          >
            {onToggleSelect && (
              <div className="pl-4 flex items-center">
                <input 
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 border-slate-300"
                  checked={selectedIds.includes(student.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect(student.id);
                  }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => onSelectStudent(student)}
              className="w-full text-left p-4 block cursor-pointer flex-1 min-w-0"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-xs text-slate-800 block truncate">{student.name}</span>
                <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">NIM: {student.id}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                <span className="truncate">Kelas: {student.classGroup}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {student.testCompleted && student.validationStatus && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      student.validationStatus?.startsWith('INVALID')
                        ? 'bg-red-50 text-red-600 border border-red-100 font-mono'
                        : student.validationStatus?.startsWith('WARNING')
                        ? 'bg-amber-50 text-amber-600 border border-amber-100 font-mono'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono'
                    }`}>
                      {student.validationStatus?.split(' ')[0] || 'VALID'}
                    </span>
                  )}
                  {student.testCompleted ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-[10px]">
                      <UserCheck className="w-3.5 h-3.5" /> Selesai
                    </span>
                  ) : student.testStarted ? (
                    <span className="text-blue-500 font-semibold flex items-center gap-0.5 text-[10px]">
                      <RotateCw className="w-3 h-3 animate-spin" /> Pengerjaan
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Belum Mulai</span>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            Tidak ada peserta/user yang cocok dengan kriteria filter.
          </div>
        )}
      </div>

      {/* Bulk Print & AI Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50/80 border-t border-indigo-100 flex flex-col gap-2">
          <div className="text-[11px] font-bold text-indigo-900 flex justify-between items-center">
            <span>{selectedIds.length} Peserta Terpilih</span>
            <span className="text-[10px] text-indigo-600 font-normal">Aksi Massal</span>
          </div>
          <div className="flex gap-2">
            {onBatchAiAnalysis && (
              <button
                type="button"
                onClick={onBatchAiAnalysis}
                className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-300 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Generasi Analisis AI Massal untuk Peserta Terpilih"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
                <span>AI ({selectedIds.length})</span>
              </button>
            )}
            {onBatchPrint && (
              <button
                type="button"
                onClick={onBatchPrint}
                className="flex-1 py-1.5 px-2 text-[11px] font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Cetak Laporan PDF Massal untuk Peserta Terpilih"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
