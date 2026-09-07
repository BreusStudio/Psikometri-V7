'use client';

import React from 'react';
import { Search, Lock, Unlock, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { Student } from '../../../lib/types';

interface StudentsTableProps {
  filteredStudents: Student[];
  selectedFilter: {
    type: string;
    value: string;
    label: string;
  };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onResetFilter: () => void;
  onToggleCheatLock: (studentId: string, isLocked: boolean) => void;
  onOpenDetail: (student: Student) => void;
  onBulkAction?: (ids: string[], action: 'lock' | 'unlock' | 'delete' | 'reset') => void;
}

export default function StudentsTable({
  filteredStudents,
  selectedFilter,
  searchTerm,
  onSearchChange,
  onResetFilter,
  onToggleCheatLock,
  onOpenDetail,
  onBulkAction
}: StudentsTableProps) {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: 'lock' | 'unlock' | 'delete' | 'reset') => {
    if (onBulkAction && selectedIds.length > 0) {
      onBulkAction(selectedIds, action);
      setSelectedIds([]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
      
      {/* Active Filter Info & Reset Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase font-mono tracking-wider">
              Grup Aktif
            </span>
            <h3 className="text-base font-bold text-slate-800 text-left">{selectedFilter.label}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 text-left">Ditemukan {filteredStudents.length} siswa dalam filter ini.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIM, kelas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {selectedFilter.type !== 'all' && (
            <button
              type="button"
              onClick={onResetFilter}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-600 text-white px-4 py-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-black">{selectedIds.length} terpilih</span>
            <span className="text-xs font-bold hidden sm:inline">Aksi Massal:</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkAction('lock')}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Kunci
            </button>
            <button 
              onClick={() => handleBulkAction('unlock')}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Buka
            </button>
            <button 
              onClick={() => handleBulkAction('reset')}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Reset Ujian
            </button>
            <div className="w-px h-6 bg-white/20 mx-1"></div>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-white/70 hover:text-white px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Students Table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
              <th className="p-3 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3">User / Peserta</th>
              <th className="p-3">ID / NISN</th>
              <th className="p-3">Grup & Peminatan</th>
              <th className="p-3">Skor IQ / EQ</th>
              <th className="p-3">Dominan RIASEC</th>
              <th className="p-3">Pengawasan (Keluar Tab)</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400 italic">Siswa tidak ditemukan untuk kriteria pencarian ini.</td>
              </tr>
            ) : (
              filteredStudents.map(s => {
                const sortedRiasec = s.riasecScores && s.testCompleted 
                  ? Object.entries(s.riasecScores).sort((a,b) => b[1] - a[1]) 
                  : [];
                const dominantCode = sortedRiasec[0]?.[0] || '-';
                const isSelected = selectedIds.includes(s.id);
                
                return (
                  <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-indigo-50/30' : ''}`}>
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(s.id)}
                      />
                    </td>
                    <td className="p-3 text-left">
                      <div className="font-semibold text-slate-800">{s.name}</div>
                      <div className="text-[10px] text-slate-400">Password: <span className="font-mono">{s.password}</span></div>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-600">{s.id}</td>
                    <td className="p-3 font-medium text-slate-700">{s.classGroup || '-'}</td>
                    <td className="p-3 font-mono">
                      {s.testCompleted ? (
                        <div className="space-y-0.5">
                          <span className="text-blue-600 font-bold">IQ {s.iqScore || '-'}</span>
                          <span className="text-slate-300 mx-1">|</span>
                          <span className="text-purple-600 font-bold">EQ {s.eqScore || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">
                          {s.testStarted ? 'Sedang Mengerjakan' : 'Belum Mulai'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {s.testCompleted ? (
                        <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono text-[10px]">
                          {dominantCode} ({sortedRiasec[0]?.[1]}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {s.lockedOut ? (
                        <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3 shrink-0" /> Terkunci (Cheating)
                        </span>
                      ) : s.cheatWarnings && s.cheatWarnings > 0 ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Peringatan: {s.cheatWarnings}x
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3 shrink-0" /> Aman
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        
                        {/* UNLOCK BTN IF LOCKED */}
                        {s.lockedOut && (
                          <button
                            type="button"
                            onClick={() => onToggleCheatLock(s.id, true)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-1.5 rounded transition-all border border-emerald-200 cursor-pointer"
                            title="Buka Kunci Akun Siswa"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenDetail(s)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2.5 py-1.5 rounded-lg transition-all border border-indigo-150 font-bold flex items-center gap-1 text-[10px] cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Detail & Hasil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
