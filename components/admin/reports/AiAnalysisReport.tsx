'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Student } from '../../../lib/types';

interface AiAnalysisReportProps {
  selectedStudent: Student;
}

export default function AiAnalysisReport({ selectedStudent }: AiAnalysisReportProps) {
  if (!selectedStudent.aiAnalysis) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col items-center text-center space-y-3.5 animate-fade-in">
        <Sparkles className="w-8 h-8 text-indigo-505 animate-pulse text-indigo-500" />
        <div>
          <h4 className="font-bold text-indigo-900 text-sm">Butuh Laporan Deskriptif & Rekomendasi Jurusan?</h4>
          <p className="text-xs text-indigo-800/80 max-w-sm mx-auto leading-relaxed mt-1 font-sans">
            Klik tombol di kanan atas untuk memanggil kecerdasan buatan CBT Core AI. Sistem akan memetakan detail dimensi hasil tes ke dalam rekomendasi program vokasi riil.
          </p>
        </div>
      </div>
    );
  }

  const { aiAnalysis } = selectedStudent;

  return (
    <div className="border-t border-slate-100 pt-6 text-left animate-fade-in">
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-32 h-32 bg-teal-500 opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute left-0 bottom-0 -translate-x-8 translate-y-8 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-2xl"></div>

        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 text-teal-400 font-bold text-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>LAPORAN ANALISIS AI CBT CORE</span>
          </div>

          {/* Validity Badge */}
          {aiAnalysis.validity && (
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border flex items-center gap-1.5 ${
              aiAnalysis.validity.status === 'VALID'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : aiAnalysis.validity.status === 'NEEDS_REVIEW'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                aiAnalysis.validity.status === 'VALID' ? 'bg-emerald-400' : aiAnalysis.validity.status === 'NEEDS_REVIEW' ? 'bg-amber-400' : 'bg-rose-400'
              }`} />
              <span>Validitas: {aiAnalysis.validity.status} ({aiAnalysis.confidenceScore || 95}% Kepercayaan)</span>
            </div>
          )}
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
          <div>
            <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-1">Holland 3-Letter Code</h4>
            <span className="font-mono font-black text-lg text-white bg-slate-800 px-2.5 py-1 rounded tracking-widest border border-slate-700">
              {aiAnalysis.riasecCode}
            </span>
            <p className="mt-2 font-medium">{aiAnalysis.riasecSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-1 font-sans">Analisis Kognitif</h4>
              <p className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">{aiAnalysis.cognitiveIqSummary}</p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-1 font-sans">Analisis Emosional</h4>
              <p className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">{aiAnalysis.emotionalEqSummary}</p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-2 font-sans">Rekomendasi Jurusan SMK Terkait</h4>
            <div className="flex gap-2 flex-wrap">
              {aiAnalysis.recommendedMajors?.map((major: string, i: number) => (
                <span key={i} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full font-semibold">
                  {major}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-2 font-sans">Alternatif Karir / Jabatan Kerja</h4>
            <div className="flex gap-2 flex-wrap">
              {aiAnalysis.suggestedCareers?.map((career: string, i: number) => (
                <span key={i} className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full font-semibold">
                  {career}
                </span>
              ))}
            </div>
          </div>

          {aiAnalysis.hasPotentialIssues !== undefined && (
            <div className={`pt-2 border-t border-slate-800/80 mt-2 ${aiAnalysis.hasPotentialIssues ? 'bg-red-500/10 border-red-500/30 rounded-lg p-3' : 'bg-green-500/10 border-green-500/30 rounded-lg p-3'}`}>
              <h4 className={`text-[11px] font-bold tracking-wider uppercase mb-2 ${aiAnalysis.hasPotentialIssues ? 'text-red-400' : 'text-green-400'}`}>
                Identifikasi Potensi Masalah
              </h4>
              <p className="text-sm font-medium font-sans">
                {aiAnalysis.hasPotentialIssues 
                  ? '⚠️ Terdapat indikasi potensi masalah kognitif atau emosional yang memerlukan perhatian khusus dari BK.'
                  : '✅ Tidak ada indikasi masalah kognitif maupun emosional yang signifikan. Siswa dalam kondisi belajar yang stabil.'}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 mt-2">
            <h4 className="text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-2 font-sans">Rencana Pengembangan Soft & Hard Skills</h4>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-300 font-sans">
              {aiAnalysis.developmentPlan?.map((plan: string, i: number) => (
                <li key={i}>{plan}</li>
              ))}
            </ul>
          </div>

          {aiAnalysis.detailedPsychologicalAnalysis && (
            <div className="pt-4 border-t border-slate-800/80 mt-2">
              <h4 className="text-[11px] font-bold text-amber-300 tracking-wider uppercase mb-2 font-sans">Analisis Mendalam untuk Konselor</h4>
              <div className="bg-amber-900/20 border border-amber-700/50 p-4 rounded-xl font-sans">
                <p className="text-amber-100 leading-relaxed text-xs">
                  {aiAnalysis.detailedPsychologicalAnalysis}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
