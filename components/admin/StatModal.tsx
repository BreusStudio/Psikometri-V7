'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Student } from '../../lib/types';

interface StatModalProps {
  statModal: { title: string; students: Student[] } | null;
  onClose: () => void;
  onSelectStudent: (student: Student) => void;
}

export default function StatModal({
  statModal,
  onClose,
  onSelectStudent
}: StatModalProps) {
  if (!statModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800 text-left">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-150 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider font-mono">
            {statModal.title} ({statModal.students.length} Siswa)
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          {statModal.students.map(s => (
            <div 
              key={s.id} 
              onClick={() => {
                onSelectStudent(s);
                onClose();
              }}
              className="p-3 border border-slate-100 hover:border-indigo-250 hover:bg-indigo-50/30 rounded-xl flex justify-between items-center cursor-pointer transition-all"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">{s.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">NIM: {s.id} • Kelas: {s.classGroup}</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                IQ: {s.iqScore || '-'}
              </span>
            </div>
          ))}
          {statModal.students.length === 0 && (
            <p className="text-xs text-center text-slate-400 py-6">Tidak ada peserta dalam kelompok ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
