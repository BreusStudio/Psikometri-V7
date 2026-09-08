
'use client';

import React from 'react';
import { Student, Question, Dimension, Package } from '../../../lib/types';
import RiasecChart from './RiasecChart';
import DimensionScoresBreakdown from './DimensionScoresBreakdown';
import { getWechslerIqClassification, getTScoreEqClassification } from '@/lib/psychometrics/normCalculator';

interface PrintableReportProps {
  students: Student[];
  questions: Question[];
  dimensions: Dimension[];
  logoUrl?: string | null;
  selectedPackage?: Package | null;
  isStandalone?: boolean;
}

export default function PrintableReport({
  students,
  questions,
  dimensions,
  logoUrl: propLogoUrl,
  selectedPackage,
  isStandalone = false
}: PrintableReportProps) {

  // Package Level Dynamic Branding with fallbacks
  const logoUrl = selectedPackage?.logoUrl || propLogoUrl || (typeof window !== 'undefined' ? localStorage.getItem('cbt_report_logo') : null);
  const headerTitle = selectedPackage?.headerTitle || 'LAPORAN ANALISIS PSIKOMETRI & POTENSI DIRI';
  const institutionName = selectedPackage?.institutionName || 'Dinas Pendidikan / Pengelola Program';
  const institutionSub = selectedPackage?.institutionSub || '';
  const signatureTitle = selectedPackage?.signatureTitle || 'Konselor Bimbingan Konseling';
  const signatureName = selectedPackage?.signatureName || '';
  const signatureNip = selectedPackage?.signatureNip || '';

  if (students.length === 0) return null;

  return (
    <div id="printable-report-container" className="bg-white text-black p-0 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Tampilan Layar Biasa */
        @media screen {
          #printable-report-container {
            ${isStandalone ? `
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              opacity: 1 !important;
              pointer-events: auto !important;
              height: auto !important;
            ` : `
              position: absolute !important;
              left: -99999px !important;
              top: -99999px !important;
              width: 210mm !important;
              opacity: 0 !important;
              pointer-events: none !important;
              overflow: hidden !important;
              height: 0 !important;
            `}
          }
        }

        /* Tampilan Mode Cetak (Print) */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
          }
          /* Sembunyikan seluruh UI web dashboard induk saat dicetak */
          body > *:not(#printable-report-container) {
            display: none !important;
          }
          #printable-report-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            opacity: 1 !important;
            z-index: 9999999 !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}} />
      
      {students.map((student, index) => (
        <div 
          key={student.id} 
          className={`relative w-full h-[282mm] max-h-[282mm] p-3 overflow-hidden flex flex-col justify-between bg-white box-border ${index < students.length - 1 ? 'page-break' : ''}`}
        >
          
          {/* Header Kop Laporan */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-2 gap-3 shrink-0">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt="Logo Instansi"
                  className="h-11 w-11 object-contain rounded shrink-0 border border-slate-400 p-0.5 bg-white"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-slate-950 text-white flex flex-col items-center justify-center font-black text-[10px] shrink-0 tracking-tighter leading-none shadow-xs">
                  <span>CBT</span>
                  <span className="text-[6.5px] text-slate-300 font-mono mt-0.5">PSIKO</span>
                </div>
              )}
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase leading-snug">{headerTitle}</h1>
                <p className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider leading-none mt-0.5">{institutionName}</p>
                {institutionSub && (
                  <p className="text-[8.5px] font-medium text-slate-500 uppercase tracking-wider leading-none mt-0.5">{institutionSub}</p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-black text-slate-900 tracking-tight">{student.educationLevel ? `JENJANG ${student.educationLevel}` : 'CBT-PSIKOMETRI'}</div>
              <div className="text-[9.5px] font-mono font-bold text-slate-800 mt-0.5">
                No: CBT/LPSI/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{student.id.slice(0, 6).toUpperCase()}
              </div>
              <div className="text-[8.5px] font-mono text-slate-500">
                Ref: {student.id.slice(0, 8).toUpperCase()}-{new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* Profil Peserta Mini & Paket Ujian */}
          <div className="flex items-center justify-between border-2 border-slate-400 rounded-xl p-2 mb-2 bg-white shadow-xs shrink-0">
             <div className="flex items-center gap-3 px-1">
               <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nama Peserta</div>
                 <div className="text-xs font-black text-slate-900 tracking-tight leading-none">{student.name}</div>
                 <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {student.id.slice(0, 10).toUpperCase()}</div>
               </div>
               <div className="h-6 w-px bg-slate-300"></div>
               <div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Kelas / Ujian</div>
                 <div className="text-[11px] font-black text-slate-900 tracking-tight leading-none">{student.classGroup}</div>
                 <div className="text-[10px] font-mono text-slate-400 mt-0.5">{new Date().toLocaleDateString('id-ID')}</div>
               </div>
               <div className="h-6 w-px bg-slate-300"></div>
               <div>
                 <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-0.5">Paket Ujian & Instrumen</div>
                 <div className="text-[10.5px] font-black text-slate-900 tracking-tight leading-none">
                   {selectedPackage?.name || student.packageName || 'Paket Vokasi Psikotes Lengkap'}
                 </div>
                 <div className="flex flex-wrap items-center gap-1 mt-1">
                   {selectedPackage?.testTypes && selectedPackage.testTypes.length > 0 ? (
                     selectedPackage.testTypes.map((t, idx) => (
                       <span key={idx} className="inline-block text-[8px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300 leading-none">
                         ✓ {t}
                       </span>
                     ))
                   ) : (
                     <>
                       <span className="inline-block text-[8px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.2 rounded border border-indigo-200 leading-none">✓ IQ Kognitif</span>
                       <span className="inline-block text-[8px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.2 rounded border border-indigo-200 leading-none">✓ EQ Emosional</span>
                       <span className="inline-block text-[8px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.2 rounded border border-indigo-200 leading-none">✓ Minat Holland (RIASEC)</span>
                       <span className="inline-block text-[8px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.2 rounded border border-indigo-200 leading-none">✓ Kepribadian Kerja</span>
                     </>
                   )}
                 </div>
               </div>
             </div>
             
             <div className="flex gap-1.5">
                <div className="flex items-center gap-1.5 border border-slate-400 rounded-lg px-2 py-1">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-black text-slate-800 text-[11px] border border-slate-400 shrink-0">
                    {student.iqScore}
                  </div>
                  <div>
                    <div className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Kognitif (IQ)</div>
                    <div className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider leading-none mt-0.5">
                      {student.iqScore ? getWechslerIqClassification(student.iqScore).label : 'Rata-rata Normal'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 border border-slate-400 rounded-lg px-2 py-1">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono font-black text-slate-800 text-[11px] border border-slate-400 shrink-0">
                    {student.eqScore}
                  </div>
                  <div>
                    <div className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Emosi (EQ)</div>
                    <div className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider leading-none mt-0.5">
                      {student.eqScore ? getTScoreEqClassification(student.eqScore).label : 'Rata-rata (Cukup Stabil)'}
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 border rounded-lg px-2 py-1 ${
                  student.validationStatus?.startsWith('INVALID') 
                    ? 'border-slate-400 bg-rose-50' 
                    : student.validationStatus?.startsWith('WARNING') 
                    ? 'border-slate-400 bg-amber-50' 
                    : 'border-slate-400 bg-emerald-50'
                }`}>
                  <div className="text-center">
                    <div className="text-[9.5px] font-black text-slate-600 uppercase tracking-wider">Validitas</div>
                    <div className={`text-[10px] font-extrabold uppercase tracking-wider leading-none mt-0.5 ${
                      student.validationStatus?.startsWith('INVALID') ? 'text-rose-700' : student.validationStatus?.startsWith('WARNING') ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {student.validationStatus?.startsWith('INVALID') ? 'TIDAK VALID' : student.validationStatus || 'VALID'}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-12 gap-2.5 flex-1 min-h-0 mb-2 overflow-hidden">
            {/* Left Column (Radar & Dimensi) */}
            <div className="col-span-6 flex flex-col gap-2 min-h-0">
              {/* Radar Chart */}
              <div className="p-2 bg-white border border-slate-400 rounded-xl shadow-xs shrink-0">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                  Profil RIASEC
                </h3>
                <div className="w-full">
                  {student.riasecScores && <RiasecChart scores={student.riasecScores} />}
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-slate-400 flex justify-between items-center px-1">
                  <div className="text-[10px] font-bold text-slate-500">Tipe Dominan Kepribadian:</div>
                  <div className="text-[11px] font-black text-slate-900 tracking-widest">
                    {student.riasecScores 
                       ? Object.entries(student.riasecScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]).join('-')
                       : '-'}
                  </div>
                </div>
              </div>
              
              {/* Detailed Scores */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1 flex items-center gap-1.5 shrink-0">
                  <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                  Rincian Dimensi Psikometri
                </h3>
                <div className="bg-white border border-slate-400 rounded-xl p-2 shadow-xs flex-1 min-h-0 overflow-hidden">
                  <DimensionScoresBreakdown 
                    scores={student.dimensionScores} 
                    questions={questions}
                    dimensions={dimensions}
                    evaluatedDimensions={student.evaluatedDimensions}
                  />
                </div>
              </div>
            </div>

            {/* Right Column (AI Analysis) */}
            <div className="col-span-6 flex flex-col min-h-0">
              <div className="p-2.5 border-2 border-slate-400 bg-white rounded-xl flex flex-col h-full min-h-0 overflow-hidden shadow-xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-black text-[11px] mb-1.5 border-b-2 border-slate-400 pb-1.5 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>LAPORAN ANALISIS AI CBT CORE</span>
                </div>
                
                {student.aiAnalysis ? (
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden text-[10px] leading-snug font-sans">
                    <div className="flex items-start gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-[10.5px] text-white bg-slate-900 px-1.5 py-0.5 rounded tracking-widest border border-slate-400 shrink-0">
                        {student.aiAnalysis.riasecCode}
                      </span>
                      <span className="font-medium text-slate-800 leading-tight">
                        {student.aiAnalysis.riasecSummary}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 shrink-0">
                      <div className="bg-white p-1 rounded-lg border border-slate-400">
                        <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Kognitif</h4>
                        <p className="text-slate-700 leading-tight text-[9.5px]">{student.aiAnalysis.cognitiveIqSummary}</p>
                      </div>
                      <div className="bg-white p-1 rounded-lg border border-slate-400">
                        <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Emosional</h4>
                        <p className="text-slate-700 leading-tight text-[9.5px]">{student.aiAnalysis.emotionalEqSummary}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Rekomendasi Jurusan SMK</h4>
                      <div className="flex gap-1 flex-wrap">
                        {student.aiAnalysis.recommendedMajors?.map((major: string, i: number) => (
                          <span key={i} className="border border-slate-400 text-slate-700 px-1 py-0.5 rounded font-bold text-[9px]">
                            {major}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Alternatif Karir</h4>
                      <div className="flex gap-1 flex-wrap">
                        {(student.aiAnalysis.suggestedCareers || student.aiAnalysis.potentialCareers || [])?.map((career: string, i: number) => (
                          <span key={i} className="border border-slate-400 text-slate-700 px-1 py-0.5 rounded font-bold text-[9px]">
                            {career}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-400 shrink-0">
                      <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Rencana Pengembangan Soft & Hard Skills</h4>
                      <ul className="list-disc pl-3 space-y-0.5 text-slate-700 font-medium text-[9.5px]">
                        {student.aiAnalysis.developmentPlan?.map((plan: string, i: number) => (
                          <li key={i} className="leading-tight">{plan}</li>
                        ))}
                      </ul>
                    </div>

                    {student.aiAnalysis.detailedPsychologicalAnalysis && (
                      <div className="mt-0.5 pt-1.5 border-t border-slate-400 shrink-0">
                        <h4 className="font-bold text-slate-900 uppercase mb-0.5 text-[9.5px] tracking-widest">Catatan Khusus Konselor BK</h4>
                        <div className="border border-slate-400 bg-slate-50 p-1 rounded-lg">
                          <p className="text-slate-800 text-[9.5px] leading-tight font-medium">
                            {student.aiAnalysis.detailedPsychologicalAnalysis}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center px-4 py-6 bg-slate-50 rounded-lg border border-slate-400 border-dashed">
                    <svg className="w-6 h-6 mb-2 opacity-50 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p className="text-[11px] font-bold text-slate-600 mb-1">Sistem belum menghasilkan analisis AI untuk peserta ini.</p>
                    <p className="text-[10px] text-slate-400">Gunakan tombol &quot;Dapatkan Analisis AI&quot; pada halaman aplikasi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Signature Area */}
          <div className="pt-1.5 border-t-2 border-slate-900 flex justify-between items-end shrink-0">
            <div className="flex items-center gap-2">
              {/* QR Verification Box */}
              <div className="w-12 h-12 bg-white border border-slate-900 rounded flex flex-col items-center justify-center p-0.5 text-[7px] font-mono text-center shrink-0">
                <svg className="w-8 h-8 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h1v2h-1v-2zm-3 0h2v1h-2v-1zm1 3h2v2h-2v-2zm2-1h1v3h-1v-3zm-4 2h1v2h-1v-2zm3 1h2v1h-2v-1z"/>
                </svg>
                <span className="font-bold uppercase tracking-tighter text-[6px]">VERIFIED</span>
              </div>
              <div className="text-[8.5px] text-slate-600 font-mono italic max-w-xs leading-tight">
                Dokumen ini diterbitkan sah oleh Sistem CBT Psikometri ({new Date().toLocaleDateString('id-ID')}).
                <br/><strong className="text-slate-900">Hash Autentikasi:</strong> AUTH-CBT-{student.id.slice(0, 8).toUpperCase()}-2026
              </div>
            </div>
            <div className="text-center pr-6">
              <div className="text-[10px] font-black uppercase text-slate-700 mb-7">{signatureTitle}</div>
              <div className="text-[11px] font-black text-slate-900 underline">{signatureName || '(________________________)'}</div>
              {signatureNip && <div className="text-[9px] font-mono font-bold text-slate-600 mt-0.5">{signatureNip}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
