'use client';

import React, { useRef, useState } from 'react';
import { Student, Question, Dimension, Package } from '../../../lib/types';
import PrintableReport from './PrintableReport';
import { Printer, Download, ExternalLink, X, FileText, Loader2 } from 'lucide-react';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  questions: Question[];
  dimensions: Dimension[];
  logoUrl?: string | null;
  selectedPackage?: Package | null;
}

export default function ReportPrintModal({
  isOpen,
  onClose,
  students,
  questions,
  dimensions,
  logoUrl,
  selectedPackage
}: ReportPrintModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || students.length === 0) return null;

  const handleNativePrint = () => {
    window.print();
  };

  const handleOpenNewTab = () => {
    // Save current print data to localStorage so new tab can read it
    try {
      const payload = {
        students,
        questions,
        dimensions,
        logoUrl,
        selectedPackage
      };
      localStorage.setItem('cbt_print_payload', JSON.stringify(payload));
      
      const newWin = window.open('/print/report', '_blank');
      if (!newWin) {
        alert('Pop-up terblokir oleh browser. Silakan izinkan pop-up atau gunakan tombol Unduh PDF.');
      }
    } catch (err) {
      console.error('Failed to prepare print payload', err);
      alert('Gagal membuka tab baru. Gunakan tombol Unduh PDF.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!printContentRef.current) return;
    setIsGeneratingPdf(true);

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      const element = printContentRef.current;

      const filename = students.length === 1 
        ? `Laporan_Psikotes_${students[0].name.replace(/\s+/g, '_')}.pdf`
        : `Rekap_Laporan_Psikotes_${students.length}_Siswa.pdf`;

      const opt = {
        margin:       [5, 5, 5, 5],
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Terjadi kesalahan saat membuat file PDF. Mencoba metode cetak browser...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Top Floating Control Bar */}
      <div className="sticky top-2 z-50 w-full max-w-4xl bg-slate-800 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 my-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Pratinjau Cetak Laporan
              <span className="text-xs bg-indigo-500/30 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-400/20">
                {students.length} Siswa
              </span>
            </h3>
            <p className="text-xs text-slate-400 hidden sm:block">
              Siap dicetak atau diunduh langsung sebagai file PDF
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Unduh PDF
              </>
            )}
          </button>

          <button
            onClick={handleNativePrint}
            className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            title="Cetak via browser"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Cetak</span>
          </button>

          <button
            onClick={handleOpenNewTab}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5"
            title="Buka di tab baru untuk hasil cetak murni"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">Tab Baru</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition ml-1"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Report Paper Container (Visible in Modal & Printer Ready) */}
      <div className="w-full flex justify-center py-4 print:p-0">
        <div 
          ref={printContentRef}
          className="bg-white text-black shadow-2xl rounded-sm print:shadow-none print:rounded-none w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-8"
        >
          <PrintableReport
            students={students}
            questions={questions}
            dimensions={dimensions}
            logoUrl={logoUrl}
            selectedPackage={selectedPackage}
            isInteractivePreview={true}
          />
        </div>
      </div>

    </div>
  );
}
