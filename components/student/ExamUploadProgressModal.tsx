'use client';

import React from 'react';
import { CheckCircle2, Loader2, CloudUpload, ShieldCheck, Database, HardDrive } from 'lucide-react';

export interface UploadProgressStage {
  stage: 'validating' | 'caching' | 'uploading' | 'verifying' | 'completed' | 'error';
  percent: number;
  message: string;
  details?: string;
}

interface ExamUploadProgressModalProps {
  isOpen: boolean;
  progress: UploadProgressStage;
  title?: string;
  isWholeExam?: boolean;
}

export default function ExamUploadProgressModal({
  isOpen,
  progress,
  title = 'Menyimpan & Mengunggah Jawaban',
  isWholeExam = false
}: ExamUploadProgressModalProps) {
  if (!isOpen) return null;

  const getStepStatus = (stepIndex: number) => {
    // Step 0: Validasi (percent >= 25)
    // Step 1: Cache Lokal (percent >= 55)
    // Step 2: Cloud Sync (percent >= 88)
    // Step 3: Verified (percent >= 100)
    if (progress.stage === 'error') return 'error';
    
    if (stepIndex === 0) {
      if (progress.percent > 25 || progress.stage === 'caching' || progress.stage === 'uploading' || progress.stage === 'verifying' || progress.stage === 'completed') return 'done';
      return 'active';
    }
    if (stepIndex === 1) {
      if (progress.percent > 55 || progress.stage === 'uploading' || progress.stage === 'verifying' || progress.stage === 'completed') return 'done';
      if (progress.stage === 'caching' || progress.percent >= 25) return 'active';
      return 'waiting';
    }
    if (stepIndex === 2) {
      if (progress.percent > 88 || progress.stage === 'verifying' || progress.stage === 'completed') return 'done';
      if (progress.stage === 'uploading' || progress.percent >= 55) return 'active';
      return 'waiting';
    }
    if (stepIndex === 3) {
      if (progress.stage === 'completed' || progress.percent >= 100) return 'done';
      if (progress.stage === 'verifying' || progress.percent >= 88) return 'active';
      return 'waiting';
    }
    return 'waiting';
  };

  const steps = [
    {
      label: 'Validasi & Kalkulasi Butir Jawaban',
      desc: 'Memeriksa konsistensi dan kalkulasi skor psikometri',
      icon: ShieldCheck,
    },
    {
      label: 'Pencadangan Aman di Perangkat Lokal',
      desc: 'Mengamankan snapshot jawaban ke IndexedDB & LocalStorage',
      icon: HardDrive,
    },
    {
      label: 'Transmisi Atomic ke Cloud Gateway',
      desc: 'Mengirim 1 paket payload terenkripsi ke database pusat',
      icon: CloudUpload,
    },
    {
      label: 'Verifikasi Tanda Terima Server (200 OK)',
      desc: 'Memastikan integritas hasil ujian tersimpan permanen',
      icon: Database,
    }
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-55 text-slate-800"
      style={{ zIndex: 99999 }}
      id="exam-upload-progress-modal"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-7 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-inner">
            {progress.stage === 'completed' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />
            ) : (
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            )}
          </div>
          <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight pt-1" id="upload-modal-title">
            {progress.stage === 'completed' 
              ? (isWholeExam ? 'Ujian Berhasil Diselesaikan!' : 'Sub-Tes Berhasil Disimpan!') 
              : title}
          </h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto" id="upload-modal-subtitle">
            {progress.message || 'Mohon jangan menutup atau memuat ulang halaman selama proses transmisi.'}
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 font-sans">
            <span className="flex items-center gap-1.5 text-indigo-600">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${progress.stage === 'completed' ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${progress.stage === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`}></span>
              </span>
              {progress.stage === 'completed' ? 'Proses Tuntas' : 'Sinkronisasi Aktif...'}
            </span>
            <span className="font-mono text-slate-700 font-extrabold text-sm">{Math.min(100, Math.max(0, progress.percent))}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 p-0.5 overflow-hidden border border-slate-200/80 shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                progress.stage === 'completed' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
              id="upload-progress-fill"
            />
          </div>
        </div>

        {/* Step-by-Step Checkpoints */}
        <div className="space-y-2.5 bg-slate-50/80 border border-slate-150/70 p-4 rounded-2xl">
          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            const Icon = step.icon;

            return (
              <div 
                key={idx} 
                className={`flex items-start gap-3 p-2 rounded-xl transition-colors duration-200 ${
                  status === 'active' ? 'bg-white shadow-xs border border-indigo-100' : ''
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {status === 'done' ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : status === 'active' ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-bold font-sans ${
                      status === 'done' ? 'text-slate-800' : status === 'active' ? 'text-indigo-700' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security / Safe Indicator */}
        <div className="text-center pt-1 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Protokol Enkripsi & Local-First Resilience Aktif
          </p>
        </div>

      </div>
    </div>
  );
}
