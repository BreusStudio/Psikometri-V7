'use client';

import React, { useState } from 'react';
import { LogOut, BookOpen, AlertTriangle, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { Student } from '../../lib/types';

interface ExamInstructionsScreenProps {
  currentStudent: Student;
  onLogout: () => void;
  handleStartExam: () => void;
}

export default function ExamInstructionsScreen({
  currentStudent,
  onLogout,
  handleStartExam
}: ExamInstructionsScreenProps) {
  const [consentAgreed, setConsentAgreed] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 text-slate-800">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CBT Asesmen & Pemetaan Potensi</span>
          <h2 className="text-sm font-bold text-slate-950 font-sans">{currentStudent.name} ({currentStudent.classGroup})</h2>
        </div>
        <button 
          type="button"
          onClick={onLogout}
          className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>

      <div className="space-y-4 text-xs text-slate-650 leading-relaxed font-medium">
        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Petunjuk Teknis Asesmen Pemetaan Potensi Digital:
        </h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Asesmen potensi ini dibagi menjadi modul terpisah yang dapat dikerjakan secara sistematis: <strong>Cognitive Ability Index</strong>, <strong>Emotional & Working Resilience</strong>, dan <strong>Vocational Interest Profile (RIASEC Framework)</strong>.</li>
          <li>Anda dapat memilih modul mana yang ingin dikerjakan terlebih dahulu pada dashboard asesmen Anda.</li>
          <li>Waktu pengerjaan bersifat mandiri. Jawablah secara jujur dan spontan sesuai dengan kecenderungan diri Anda tanpa paksaan.</li>
          <li className="text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>SISTEM PENGAWASAN DIGITAL:</strong> Selama pengerjaan, mohon tidak berpindah tab browser atau membuka aplikasi lain. Sistem otomatis mencatat aktivitas sesi. Jika terdeteksi melanggar sebanyak <strong>3 kali</strong>, sesi asesmen akan terkunci otomatis.
            </span>
          </li>
        </ul>

        {/* INFORMED CONSENT & LEGAL DISCLAIMER BOX */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-start gap-2 text-slate-700 text-[11px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-slate-600">
              <strong>Lembar Pernyataan & Persetujuan (Informed Consent):</strong> Asesmen ini merupakan sarana pemetaan potensi mandiri untuk bimbingan pendidikan, pengembangan karir, dan evaluasi profesional. Hasil laporan bersifat indikatif-komprehensif dan dipergunakan sebagai bahan acuan bimbingan & analisis talenta.
            </p>
          </div>

          <label 
            onClick={() => setConsentAgreed(!consentAgreed)}
            className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-all select-none"
          >
            <div className="text-indigo-600 shrink-0">
              {consentAgreed ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
            </div>
            <span className="text-xs font-bold text-slate-800">
              Saya membaca, memahami, dan menyetujui pernyataan persetujuan asesmen mandiri di atas.
            </span>
          </label>
        </div>
      </div>

      <button
        type="button"
        disabled={!consentAgreed}
        onClick={handleStartExam}
        className={`w-full text-xs font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 ${
          consentAgreed
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        Mulai Sesi Asesmen & Masuk Dashboard
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
