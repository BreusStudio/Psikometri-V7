'use client';

import React, { useEffect, useState } from 'react';
import PrintableReport from '@/components/admin/reports/PrintableReport';
import { Student, Question, Dimension, Package } from '@/lib/types';
import { Printer, ArrowLeft, Download, CheckCircle } from 'lucide-react';

export default function StandalonePrintPage() {
  const [data, setData] = useState<{
    students: Student[];
    questions: Question[];
    dimensions: Dimension[];
    logoUrl?: string | null;
    selectedPackage?: Package | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const rawData = sessionStorage.getItem('cbt_print_payload');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        setData(parsed);
      }
    } catch (e) {
      console.error('Failed to parse print payload:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTriggerPrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">Siapkan dokumen laporan...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-lg font-bold mb-2">Data Laporan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mb-6">Silakan kembali ke dashboard admin dan pilih siswa yang ingin dicetak laporan psikogramnya.</p>
          <button
            onClick={() => window.close()}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-500"
          >
            Tutup Halaman Ini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="print:hidden sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              title="Tutup"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                Dokumen Laporan Psikogram
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                  {data.students.length} Siswa
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Siap untuk dicetak atau disimpan sebagai PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleTriggerPrint}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visible Printable Area */}
      <div className="p-4 sm:p-8 flex justify-center">
        <div className="bg-white shadow-2xl rounded-xl overflow-hidden max-w-[210mm] w-full print:shadow-none print:rounded-none">
          <PrintableReport
            students={data.students}
            questions={data.questions || []}
            dimensions={data.dimensions || []}
            logoUrl={data.logoUrl}
            selectedPackage={data.selectedPackage}
            isStandalone
          />
        </div>
      </div>
    </div>
  );
}
