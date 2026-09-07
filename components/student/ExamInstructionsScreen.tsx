'use client';

import React from 'react';
import { LogOut, BookOpen, AlertTriangle, ArrowRight } from 'lucide-react';
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
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 text-slate-800">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CBT Selamat Datang</span>
          <h2 className="text-sm font-bold text-slate-950 font-sans">{currentStudent.name} ({currentStudent.classGroup})</h2>
        </div>
        <button 
          type="button"
          onClick={onLogout}
          className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
        >
          <LogOut className="w-4 h-4" /> Keluar
        </button>
      </div>

      <div className="space-y-4 text-xs text-slate-650 leading-relaxed font-medium">
        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Petunjuk Teknis Pelaksanaan Tes Psikometri SMK:
        </h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Tes psikometri ini dibagi menjadi beberapa sub-tes terpisah yang dapat dikerjakan secara modular: <strong>Tes Kognitif (IQ)</strong>, <strong>Tes Emosional (EQ)</strong>, dan <strong>Tes Karir Holland (RIASEC)</strong>.</li>
          <li>Anda dapat memilih sub-tes mana yang ingin dikerjakan terlebih dahulu pada dashboard ujian Anda.</li>
          <li>Waktu pengerjaan bersifat mandiri. Jawablah dengan jujur sesuai keadaan diri Anda sendiri tanpa paksaan (tidak ada jawaban benar/salah mutlak untuk sub-tes EQ dan RIASEC).</li>
          <li className="text-amber-800 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>PERATURAN ANTI-CURANG AKTIF:</strong> Selama pengerjaan, dilarang meninggalkan halaman browser ini, berpindah tab, membuka jendela aplikasi lain, atau mematikan layar. Sistem pengawas otomatis mencatat aktivitas luar browser Anda. Jika terdeteksi melanggar sebanyak <strong>3 kali</strong>, sesi ujian akan <strong>TERKUNCI</strong> permanen.
            </span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleStartExam}
        className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1"
      >
        Mulai Sesi Ujian & Masuk Dashboard
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
