'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle, AlertTriangle, UserCheck, FileEdit } from 'lucide-react';
import { Question } from '@/lib/core/types';

interface ExpertVerificationModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export default function ExpertVerificationModal({
  isOpen,
  question,
  onClose,
  onSave,
  currentUserName,
  currentUserRole
}: ExpertVerificationModalProps) {
  const [status, setStatus] = useState<'VERIFIED' | 'DRAFT' | 'NEEDS_REVISION'>('VERIFIED');
  const [reviewerName, setReviewerName] = useState('Psikolog / Konselor BK');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (question) {
      setStatus(question.verificationStatus || 'VERIFIED');
      setReviewerName(question.verifiedBy || currentUserName || 'Psikolog / Konselor BK');
      setNotes(question.verificationNotes || '');
    }
  }, [question, currentUserName]);

  if (!isOpen || !question) return null;

  const handleSave = () => {
    const updated: Question = {
      ...question,
      verificationStatus: status,
      verifiedBy: status === 'VERIFIED' ? reviewerName.trim() : undefined,
      verifiedAt: status === 'VERIFIED' ? (question.verifiedAt || new Date().toISOString()) : undefined,
      verificationNotes: notes.trim() || undefined
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Validasi Ahli / Psikolog</h3>
              <p className="text-xs text-indigo-200 font-medium">Verifikasi validitas butir instrumen soal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
          {/* Question Preview Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="font-mono text-slate-700">ID: {question.id}</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-extrabold text-[10px]">
                {question.testType} • {question.dimension}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-relaxed">
              &quot;{question.text}&quot;
            </p>
          </div>

          {/* Verification Status Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Status Kelayakan Butir:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('VERIFIED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  status === 'VERIFIED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${status === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Terverifikasi Sah</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('NEEDS_REVISION')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
                  status !== 'VERIFIED'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${status !== 'VERIFIED' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Perlu Revisi / Draft</span>
              </button>
            </div>
          </div>

          {/* Reviewer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Nama Penilai / Psikolog / Guru BK:
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="Contoh: Dra. Sri Wahyuni, M.Psi., Psikolog"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Reviewer Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
              Catatan Telaah Konstruk & Validitas Isi:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Butir soal memenuhi kaidah validitas isi (content validity), tidak ambigu, dan sesuai dengan konstruk psikologis yang diukur..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Simpan Status Verifikasi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
