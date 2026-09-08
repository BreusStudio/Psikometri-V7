'use client';

import React, { useEffect, useState } from 'react';
import PrintableReport from '@/components/admin/reports/PrintableReport';
import { Student, Question, Dimension, Package } from '@/lib/types';
import { Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';

export default function StandalonePrintReportPage() {
  const [data, setData] = useState<{
    students: Student[];
    questions: Question[];
    dimensions: Dimension[];
    logoUrl?: string | null;
    selectedPackage?: Package | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cbt_print_payload');
      if (raw) {
        const parsed = JSON.parse(raw);
        setData(parsed);
      }
    } catch (e) {
      console.error('Failed to parse print payload:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const el = document.getElementById('standalone-print-wrapper');
    if (!el || !data) return;
    
    setIsGenerating(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = data.students.length === 1 
        ? `Laporan_Psikotes_${data.students[0].name.replace(/\s+/g, '_')}.pdf`
        : `Laporan_Psikotes_${data.students.length}_Siswa.pdf`;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(el).save();
    } catch (e) {
      console.error('PDF error', e);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          <span>Memuat data laporan...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md text-center border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Data Laporan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-600 mb-6">
            Silakan kembali ke Dashboard Admin dan pilih siswa yang ingin dicetak laporannya.
          </p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
          >
            Tutup Halaman Ini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-800 p-2 sm:p-6 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Top Floating Bar for Dedicated Window */}
      <div className="print:hidden w-full max-w-[210mm] bg-slate-900 text-white rounded-2xl p-4 mb-4 shadow-xl border border-slate-700 flex items-center justify-between gap-4">
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tutup Tab</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Unduh PDF (.pdf)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Halaman</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div 
        id="standalone-print-wrapper"
        className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-4 sm:p-8 rounded-sm"
      >
        <PrintableReport
          students={data.students}
          questions={data.questions}
          dimensions={data.dimensions}
          logoUrl={data.logoUrl}
          selectedPackage={data.selectedPackage}
          isInteractivePreview={true}
        />
      </div>

    </div>
  );
}
