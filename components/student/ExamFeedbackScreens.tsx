'use client';

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Loader2, CheckCircle, Award, Printer, X, Download, ShieldCheck, CheckCircle2, FileText, Lock } from 'lucide-react';
import { Student, TestSettings } from '../../lib/types';
import { resolveClientContext } from '../../lib/core/contextResolver';

interface ExamFeedbackScreensProps {
  phase: 'locked' | 'completed';
  currentStudent: Student;
  loadingAi: boolean;
  aiError: string;
  onLogout: () => void;
  testSettings?: TestSettings;
}

export default function ExamFeedbackScreens({
  phase,
  currentStudent,
  loadingAi,
  aiError,
  onLogout,
  testSettings
}: ExamFeedbackScreensProps) {
  const ctx = useMemo(() => resolveClientContext(currentStudent), [currentStudent]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);

  // Responsive scale factor for student digital certificate
  const [scale, setScale] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      const containerWidth = containerRef.current?.offsetWidth || 740;
      const targetWidth = 760; // 740px + some breathing room
      if (containerWidth < targetWidth) {
        setScale(containerWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [showCertModal]);

  // Automatically direct to certificate page/modal on login or completion ONLY IF personal user allowed
  React.useEffect(() => {
    if (!loadingAi && phase === 'completed' && currentStudent.testCompleted && ctx.showResultsToUser) {
      const timer = setTimeout(() => {
        setShowCertModal(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loadingAi, phase, currentStudent.testCompleted, ctx.showResultsToUser]);
  
  if (phase === 'locked') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-6 text-slate-800 animate-in fade-in zoom-in duration-150">
        <AlertTriangle className="w-16 h-16 text-rose-600 mx-auto animate-pulse" />
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-rose-950 uppercase tracking-wider font-sans">Ujian CBT Terkunci Permanen</h2>
          <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto font-medium">
            Sistem pengawas mendeteksi bahwa {ctx.entityName.toLowerCase()} bernama <strong>{currentStudent.name}</strong> telah keluar dari jendela pengerjaan ujian sebanyak lebih dari batas toleransi.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 text-xs font-mono text-left space-y-1.5 text-rose-700 max-w-sm mx-auto shadow-xs">
          <span className="font-bold block border-b pb-1 mb-1 font-sans">Log Sistem Anti-Curang:</span>
          <p>• {ctx.idLabel}: {currentStudent.id}</p>
          <p>• Status: Terkunci (Locked Out)</p>
          <p>• Alasan: {currentStudent.lockReason || 'Melanggar SOP keluar halaman.'}</p>
        </div>

        <div className="space-y-3 pt-2 font-medium text-slate-600">
          <p className="text-xs">
            Silakan temui <strong>{ctx.supervisorLabel}</strong> atau Panitia Ujian untuk melakukan klarifikasi dan membuka kembali lembar pengerjaan Anda.
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2.5 rounded-lg transition-colors font-sans"
          >
            Kembali ke Menu Login
          </button>
        </div>
      </div>
    );
  }

  // Helper values for certificate rendering
  const getRiasecCode = () => {
    if (!currentStudent.riasecScores) return 'RIA';
    return Object.entries(currentStudent.riasecScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(item => item[0])
      .join("");
  };

  const formattedDate = currentStudent.testCompletedAt 
    ? new Date(currentStudent.testCompletedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  const formattedDateTime = currentStudent.testCompletedAt
    ? new Date(currentStudent.testCompletedAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const getAiAnalysisString = (ai: any): string => {
    if (!ai) return '';
    if (typeof ai === 'string') return ai;
    if (typeof ai === 'object') {
      if (ai.recommendedMajors && Array.isArray(ai.recommendedMajors) && ai.recommendedMajors.length > 0) {
        return String(ai.recommendedMajors[0] || '');
      }
      if (ai.detailedPsychologicalAnalysis) return String(ai.detailedPsychologicalAnalysis || '');
      if (ai.riasecSummary) return String(ai.riasecSummary || '');
    }
    return '';
  };

  const renderTextWithPlaceholders = (text: string) => {
    if (!text) return '';
    const aiStr = getAiAnalysisString(currentStudent.aiAnalysis);
    const rec = (aiStr && typeof aiStr === 'string')
      ? aiStr.split('\n')[0].replace(/[^a-zA-Z0-9\s,&()]/g, '').substring(0, 80)
      : 'Bimbingan Karir & Potensi';

    return text
      .replace(/{nama}/g, currentStudent.name)
      .replace(/{sekolah}/g, currentStudent.schoolOrigin || 'Sekolah Terdaftar')
      .replace(/{tanggal}/g, formattedDate)
      .replace(/{skor_iq}/g, String(currentStudent.iqScore || 95))
      .replace(/{skor_eq}/g, String(currentStudent.eqScore || 90))
      .replace(/{kode_holland}/g, getRiasecCode())
      .replace(/{rekomendasi}/g, rec);
  };

  const selectedPresetId = testSettings?.certBackgroundPreset || 'elegant-navy';
  
  const presets = {
    'elegant-navy': {
      bgClass: 'bg-[#fafbff]',
      borderClass: 'border-[16px] border-slate-900 outline outline-4 outline-indigo-500/30 outline-offset-[-10px]',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-indigo-600',
    },
    'modern-gold': {
      bgClass: 'bg-[#fafaf6]',
      borderClass: 'border-[16px] border-amber-100 outline outline-4 outline-amber-500/30 outline-offset-[-10px]',
      textPrimary: 'text-indigo-950',
      textSecondary: 'text-amber-600',
    },
    'warm-emerald': {
      bgClass: 'bg-[#f4fbf7]',
      borderClass: 'border-[16px] border-emerald-950 outline outline-4 outline-emerald-500/20 outline-offset-[-10px]',
      textPrimary: 'text-emerald-950',
      textSecondary: 'text-emerald-700',
    },
    'minimalist': {
      bgClass: 'bg-white',
      borderClass: 'border-[8px] border-slate-900',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
    }
  };

  const themeStyles = presets[selectedPresetId as keyof typeof presets] || presets['elegant-navy'];

  function handlePrint() {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe) {
      setShowPrintWarning(true);
    } else {
      window.print();
    }
  };

  // 1. Completion Screen for School / Corporate (Results hidden, official receipt shown)
  if (!ctx.showResultsToUser) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-6 text-slate-800 animate-in fade-in zoom-in duration-150 max-w-xl mx-auto">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-fit mx-auto border border-emerald-100 shadow-xs">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full font-mono">
            STATUS: ASESMEN SELESAI
          </span>
          <h2 className="text-lg font-bold text-slate-900 font-sans">
            Terima Kasih, {currentStudent.name}!
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Seluruh rangkaian pengerjaan asesmen Anda telah berhasil diselesaikan dan tersimpan dengan aman pada database server.
          </p>
        </div>

        {/* Official Receipt Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-3 shadow-2xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
            <span className="font-bold text-slate-700 font-sans flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tanda Terima Resmi Ujian
            </span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {formattedDateTime} WIB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-700">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Nama Lengkap</p>
              <p className="font-semibold text-slate-900 truncate">{currentStudent.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{ctx.idLabel}</p>
              <p className="font-mono font-bold text-slate-900">{currentStudent.id}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{ctx.groupLabel}</p>
              <p className="font-medium text-slate-800 truncate">{currentStudent.classGroup || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{ctx.subGroupLabel}</p>
              <p className="font-medium text-slate-800 truncate">{currentStudent.major || '-'}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-2.5 mt-2">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-normal font-medium">
              {ctx.completionNote}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm font-sans flex items-center justify-center gap-2 mx-auto"
          >
            <span>Selesai &amp; Keluar Sesi</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Completion Screen for Personal Users (Scores & PDF download enabled)
  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center space-y-6 text-slate-800 animate-in fade-in zoom-in duration-150">
      
      {/* Dynamic @media print overrides to print only the certificate block flawlessly */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-certificate-area, #printable-certificate-area * {
            visibility: visible !important;
          }
          #printable-certificate-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            z-index: 9999999 !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {loadingAi ? (
        <div className="space-y-6 py-6">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 font-sans">Menghubungkan Asisten AI CBT Core...</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
              Harap tunggu, model kecerdasan buatan sedang memproses seluruh jawaban Anda, mengalkulasi kecocokan RIASEC, dan menyusun peta karir &amp; rekomendasi mandiri Anda.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full w-fit mx-auto border border-emerald-100">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-950 font-sans">Ujian Psikometri Mandiri Berhasil!</h2>
            <p className="text-xs text-slate-550 leading-relaxed max-w-md mx-auto font-medium">
              Selamat, <strong>{currentStudent.name}</strong>. Seluruh lembar jawaban telah diproses. Anda dapat langsung mengunduh Laporan Hasil Ujian Resmi di bawah ini.
            </p>
          </div>

          {aiError && (
            <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-lg text-amber-800 text-xs text-left leading-relaxed font-medium font-sans">
              <p>{aiError}</p>
            </div>
          )}

          {currentStudent.iqScore !== null && (
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase font-sans">Tes IQ</span>
                <p className="font-mono font-black text-blue-700 text-sm">{currentStudent.iqScore}</p>
              </div>
              <div className="space-y-1 border-x border-slate-200">
                <span className="text-slate-400 font-bold text-[10px] uppercase font-sans">Tes EQ</span>
                <p className="font-mono font-black text-purple-700 text-sm">{currentStudent.eqScore}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase font-sans">Holland Code</span>
                <p className="font-mono font-black text-amber-700 text-sm">
                  {getRiasecCode()}
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
            {/* VIEW CERTIFICATE BUTTON */}
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Cetak / Unduh Laporan PDF</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs font-sans flex items-center justify-center"
            >
              Selesai &amp; Keluar Sesi
            </button>
          </div>
        </>
      )}

      {/* FULL-SCREEN DIGITAL CERTIFICATE MODAL */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in text-slate-800 no-print">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            
            {/* MODAL CONTROL HEADER */}
            <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wider font-mono">
                  Laporan &amp; Sertifikat Resmi Mandiri
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE VIEWPORT */}
            <div 
              ref={containerRef}
              className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950/60 shadow-inner w-full"
            >
              
              {/* PRINT WARNING */}
              <div className="bg-indigo-500/10 border border-indigo-500/25 px-4 py-2.5 rounded-xl text-indigo-300 text-[10px] font-semibold max-w-[740px] w-full text-center mb-6 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Tekan tombol &quot;Cetak / Simpan PDF&quot;, lalu pilih opsi &quot;Save as PDF&quot; di menu printer untuk mengunduh salinan berkas laporan resmi Anda.</span>
              </div>

              {/* RENDERED CANVAS BLOCK WRAPPER */}
              <div 
                style={{ 
                  height: `${522 * scale}px`, 
                  width: `${740 * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                className="shrink-0 relative"
              >
                <div 
                  id="printable-certificate-area"
                  className={`
                    w-[740px] h-[522px] rounded-lg shadow-2xl shrink-0 transition-all duration-300 relative select-none overflow-hidden
                    ${testSettings?.certCustomBackground ? 'bg-white' : themeStyles.bgClass}
                    ${testSettings?.certCustomBackground ? 'border-4 border-slate-800' : themeStyles.borderClass}
                  `}
                  style={{
                    backgroundImage: testSettings?.certCustomBackground ? `url(${testSettings.certCustomBackground})` : 'none',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center'
                  }}
                >
                
                {/* PRESET ORNAMENT BACKGROUND OVERLAYS */}
                {!testSettings?.certCustomBackground && (
                  <>
                    <div className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 ${selectedPresetId === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                    <div className={`absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 ${selectedPresetId === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                    <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 ${selectedPresetId === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                    <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 ${selectedPresetId === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                    
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-slate-900 pointer-events-none">
                      <Award className="w-[320px] h-[320px]" />
                    </div>
                  </>
                )}

                {/* GRAPHICAL CONTENT AREA */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between items-center text-center">
                  
                  {/* TITLE AREA */}
                  <div className="space-y-1 mt-3">
                    <span className={`text-[10px] font-black uppercase font-mono tracking-widest ${themeStyles.textSecondary}`}>
                      CBT Psikometri Official Authenticity
                    </span>
                    <h2 className={`text-lg font-black tracking-tight font-sans uppercase ${themeStyles.textPrimary}`}>
                      {testSettings?.certTitle || 'SERTIFIKAT HASIL ASESMEN PSIKOMETRI'}
                    </h2>
                    <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent mx-auto" />
                  </div>

                  {/* WORDING Keterangan */}
                  <div className="max-w-lg space-y-4">
                    <p className="text-[11px] leading-relaxed text-slate-600 font-sans font-medium px-4">
                      {renderTextWithPlaceholders(testSettings?.certMainWording || '')}
                    </p>

                    {/* GRADES AND CODES PANEL */}
                    <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto bg-white/70 backdrop-blur-xs border border-slate-150 p-2.5 rounded-xl text-center shadow-xs">
                      <div className="space-y-0.5 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Skor IQ</p>
                        <p className="text-xs font-black text-blue-700 font-mono">{currentStudent.iqScore || 95} <span className="text-[8px] font-bold text-slate-400">(Tinggi)</span></p>
                      </div>
                      <div className="space-y-0.5 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Skor EQ</p>
                        <p className="text-xs font-black text-purple-700 font-mono">{currentStudent.eqScore || 90} <span className="text-[8px] font-bold text-slate-400">(Baik)</span></p>
                      </div>
                      <div className="space-y-0.5 border-r border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase font-mono">RIASEC Code</p>
                        <p className="text-xs font-black text-amber-700 font-mono">{getRiasecCode()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Saran Karir</p>
                        <p className="text-[9px] font-bold text-teal-700 truncate px-1">
                          {currentStudent.aiAnalysis 
                            ? (getAiAnalysisString(currentStudent.aiAnalysis)?.split('\n')[0] || '').replace(/[^a-zA-Z0-9\s,&()]/g, '').substring(0, 35)
                            : 'Peta Karir Mandiri'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* DIGITAL SIGNATURES BLOCK */}
                  <div className="w-full flex justify-between items-end px-6 mb-2">
                    
                    {/* LEFT SECURE LOGO QR-CODE */}
                    <div className="flex items-center gap-3 bg-white/60 p-2 rounded-xl border border-slate-150 shadow-2xs max-w-[200px]">
                      <div className="w-14 h-14 bg-slate-900 rounded p-1 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                          <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" />
                          <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" />
                          <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" />
                          <rect x="40" y="5" width="10" height="10" />
                          <rect x="55" y="15" width="10" height="10" />
                          <rect x="45" y="40" width="15" height="15" />
                          <rect x="10" y="45" width="10" height="10" />
                          <rect x="80" y="45" width="10" height="10" />
                          <rect x="40" y="80" width="10" height="15" />
                          <rect x="55" y="70" width="15" height="10" />
                          <rect x="85" y="80" width="10" height="10" />
                          <rect x="80" y="65" width="10" height="10" />
                        </svg>
                      </div>
                      <div className="text-left font-sans shrink-1">
                        <span className="text-[7px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded uppercase block w-max">
                          Original QR Valid
                        </span>
                        <p className="text-[8px] font-black text-slate-700 mt-1">CBT SECURE HASH</p>
                        <p className="text-[7px] text-slate-400 font-mono truncate w-24">SECURE-CBT-{currentStudent.id.toUpperCase()}-2026</p>
                      </div>
                    </div>

                    {/* RIGHT COUNSELOR SIGNATURE */}
                    <div className="text-center w-48 space-y-1">
                      <p className="text-[8px] text-slate-400 font-bold uppercase font-mono">Penanggung Jawab Asesmen,</p>
                      
                      <div className="h-10 relative flex items-center justify-center">
                        <div className="absolute left-1/2 -translate-x-1/2 -rotate-12 border-2 border-indigo-600/40 text-indigo-600/30 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md select-none pointer-events-none">
                          CBT Core Official Seal
                        </div>
                        <span className="font-serif italic text-sm text-slate-700 tracking-wide">
                          {testSettings?.certCounselorName || 'Prita Oktavia S. W., S. Psi'}
                        </span>
                      </div>

                      <div className="border-t border-slate-300 pt-1">
                        <p className="text-[9px] font-bold text-slate-800">{testSettings?.certCounselorName || 'Prita Oktavia S. W., S. Psi'}</p>
                        <p className="text-[7px] font-bold text-slate-400 uppercase">{testSettings?.certCounselorTitle || 'Konselor Psikologi'}</p>
                        <p className="text-[7px] font-bold text-slate-400 font-mono">{testSettings?.certCounselorNip ? `NIP/ID: ${testSettings.certCounselorNip}` : ''}</p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            </div>
          </div>
        </div>
      )}

      {/* Print Warning Modal for Iframe */}
      {showPrintWarning && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Printer className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">Fitur Cetak Browser Terhalang Sandbox</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              Karena aplikasi ini berjalan di dalam panel pratinjau (iframe) AI Studio, browser membatasi perintah cetak langsung demi alasan keamanan.
              <br/><br/>
              Silakan klik tombol <strong>&quot;Buka di Tab Baru&quot;</strong> di bawah untuk membuka aplikasi secara mandiri, lalu klik tombol cetak kembali di sana untuk hasil laporan yang sempurna.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowPrintWarning(false)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
              >
                Batal
              </button>
              
              <a
                href={typeof window !== 'undefined' ? window.location.href : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPrintWarning(false)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-colors text-xs flex-1 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 text-center"
              >
                <span>Buka di Tab Baru</span>
              </a>
              
              <button
                onClick={() => {
                  setShowPrintWarning(false);
                  window.print();
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-xs"
                title="Coba mencetak langsung dari iframe ini"
              >
                Tetap Cetak
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
