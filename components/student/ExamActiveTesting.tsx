'use client';

import React from 'react';
import { Clock, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Student, Question } from '../../lib/types';

interface ExamActiveTestingProps {
  questions: Question[];
  currentIdx: number;
  activeTestType: string;
  timeLeft: number | null;
  currentStudent: Student;
  selectedChoices: Record<string, string>;
  handleSelectOption: (choiceId: string) => void;
  handlePrev: () => void;
  handleNext: () => void;
  handleFinishSubTest: () => void;
  cheatOverlay: boolean;
  setCheatOverlay: (val: boolean) => void;
  cheatMsg: string;
  formatTime: (sec: number) => string;
}

export default function ExamActiveTesting({
  questions,
  currentIdx,
  activeTestType,
  timeLeft,
  currentStudent,
  selectedChoices,
  handleSelectOption,
  handlePrev,
  handleNext,
  handleFinishSubTest,
  cheatOverlay,
  setCheatOverlay,
  cheatMsg,
  formatTime
}: ExamActiveTestingProps) {
  const currentQuestion = questions && questions.length > 0 ? questions[currentIdx] : null;

  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
  const [unsyncedCount, setUnsyncedCount] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and periodic refresh of unsynced count
    const checkSyncStatus = async () => {
      try {
        const { getUnsyncedAnswers } = await import('../../lib/indexedDB');
        const unsynced = await getUnsyncedAnswers(currentStudent.id);
        setUnsyncedCount(unsynced.length);
      } catch (err) {
        console.warn('Sync status check failed:', err);
      }
    };

    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [currentStudent.id]);

  if (!questions || questions.length === 0 || !currentQuestion) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-800 space-y-4 max-w-md mx-auto">
        <div className="text-rose-500 font-bold text-lg">Belum Ada Soal Tersedia</div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Sub-tes <strong className="text-indigo-600">{activeTestType}</strong> belum memiliki butir soal aktif di bank soal.
          Silakan hubungi proktor atau administrator ujian Anda untuk mengonfigurasi butir soal ini.
        </p>
        <button
          type="button"
          onClick={handleFinishSubTest}
          className="text-xs font-bold px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
        >
          Selesaikan / Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative text-slate-800" id="exam-sheets">
      
      {/* Header Progress */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              activeTestType === 'IQ' ? 'bg-blue-100 text-blue-800' : 
              activeTestType === 'EQ' ? 'bg-purple-100 text-purple-800' : 
              activeTestType === 'Holland' ? 'bg-amber-100 text-amber-800' : 
              activeTestType === 'Kepribadian' ? 'bg-sky-100 text-sky-800' : 
              'bg-rose-100 text-rose-800'
            }`}>
              Subtes {activeTestType}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              {currentQuestion.dimension}
            </span>
          </div>
          <p className="font-bold text-slate-700 font-sans">Soal {currentIdx + 1} dari {questions.length}</p>
        </div>
        
        {/* Countdown Timer & Warnings */}
        <div className="flex items-center gap-2.5">
          {/* Connectivity & Sync Status Bar */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-lg border transition-all ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
                : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
            }`} title={isOnline ? "Koneksi internet aktif" : "Koneksi offline. Menjawab menggunakan cache lokal aman."}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{isOnline ? 'Online' : 'Luring'}</span>
            </span>
            
            {unsyncedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-50 border border-rose-200 text-rose-700 px-2 py-1 rounded-lg animate-pulse" title={`${unsyncedCount} jawaban disimpan lokal dan mengantre untuk sinkronisasi.`}>
                <span>{unsyncedCount} Pending</span>
              </span>
            )}
          </div>

          {timeLeft !== null && (
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold font-mono tracking-wider ${
              timeLeft < 60 
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                : 'bg-indigo-50 border-indigo-150 text-indigo-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {currentStudent.cheatWarnings > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              Peringatan: {currentStudent.cheatWarnings}/3
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div 
          className="bg-indigo-600 h-1.5 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      {/* Question Body */}
      <div className="p-6 space-y-6 flex-1">
        {currentQuestion.imageUrl && (
          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 flex items-center justify-center bg-slate-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={currentQuestion.imageUrl} 
              alt="Gambar Soal" 
              className="object-contain max-h-72 rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <h3 className="text-sm font-bold text-slate-900 leading-relaxed font-sans">
          {currentQuestion.text}
        </h3>

        {/* Choices list */}
        <div className="space-y-3">
          {(Array.isArray(currentQuestion.choices) ? currentQuestion.choices : [])
            .filter((c): c is { id: string; text: string; scoreValue: number; hollandType?: string } => !!c && typeof c === 'object' && 'id' in c)
            .map((choice) => {
              const isSelected = selectedChoices[currentQuestion.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectOption(choice.id)}
                  className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-xs' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{choice.text}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center shrink-0">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="text-xs font-bold px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all flex items-center gap-1 bg-white text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        {currentIdx === questions.length - 1 ? (
          <button
            type="button"
            onClick={handleFinishSubTest}
            className="text-xs font-bold px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center gap-1.5"
          >
            Selesaikan Sub-Tes <CheckCircle className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1"
          >
            Selanjutnya <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Anti-Cheat Modal Warning Overlay */}
      {cheatOverlay && (
        <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center p-6 z-50 animate-fade-in text-white text-center">
          <div className="max-w-md space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
            <h3 className="text-sm font-black text-amber-400 font-sans uppercase">Peringatan Keras Pengawasan CBT!</h3>
            <p className="text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-line font-medium">
              {cheatMsg}
            </p>
            <button
              type="button"
              onClick={() => setCheatOverlay(false)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-xs tracking-wider transition-all uppercase font-sans"
            >
              Saya Mengerti & Berjanji Jujur
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
