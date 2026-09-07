'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { PsychometricStore } from '@/lib/mockData';

interface ExcelImportTabProps {
  store: PsychometricStore;
  onRefresh: () => void;
}

export default function ExcelImportTab({
  store,
  onRefresh
}: ExcelImportTabProps) {
  const [importType, setImportType] = useState<'students' | 'questions'>('students');
  const [dragActive, setDragActive] = useState(false);
  const [rawCsv, setRawCsv] = useState('');
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drag and drop Excel files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleExcelFile(e.target.files[0]);
    }
  };

  const handleExcelFile = (file: File) => {
    setErrorMsg(null);
    setImportResult(null);
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv');
    if (!isXlsx && !isCsv) {
      setErrorMsg("Harap unggah file berformat .xlsx, .xls, atau .csv");
      return;
    }

    const reader = new FileReader();
    if (isXlsx) {
      reader.onload = async (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rows = XLSX.utils.sheet_to_json<any>(ws);
          if (rows.length === 0) {
            setErrorMsg("File Excel kosong atau tidak terdeteksi data data baris.");
            return;
          }
          const result = await store.importFromDataGrid(importType, rows);
          setImportResult(result);
          onRefresh();
        } catch (err: any) {
          setErrorMsg("Gagal membaca berkas Excel: " + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          setRawCsv(text);
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length >= 2) {
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = values[i] || ''; });
              return obj;
            });
            const result = await store.importFromDataGrid(importType, rows);
            setImportResult(result);
            onRefresh();
          } else {
            setErrorMsg("CSV tidak memiliki cukup baris.");
          }
        } catch (err: any) {
          setErrorMsg("Gagal membaca berkas CSV: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setErrorMsg(null);
    setImportResult(null);
    if (!rawCsv.trim()) {
      setErrorMsg("Masukkan data CSV terlebih dahulu");
      return;
    }
    const lines = rawCsv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setErrorMsg("Format data tidak valid. Minimal baris header dan 1 baris data.");
      return;
    }
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
    const result = await store.importFromDataGrid(importType, rows);
    setImportResult(result);
    setRawCsv('');
    onRefresh();
  };

  const loadCsvTemplate = () => {
    if (importType === 'students') {
      setRawCsv(`NIM,Nama,Kelas,Password
1015,Rahmat Kartolo,XII TKRO 1,pass1015
1016,Maya Indah,XII DKV 1,pass1016
1017,Gilang Perdana,XII RPL 2,pass1017`);
    } else {
      setRawCsv(`ID,Jenis_Tes,Dimensi,Pertanyaan,Opsi_A,Skor_A,Opsi_B,Skor_B,Opsi_C,Skor_C,Opsi_D,Skor_D,Tipe_Holland,Gambar,Lisensi_Khusus,Konteks_Instansi
iq-9,IQ,Logika Matematika,Jika A + B = 10 dan A - B = 4 berapa nilai A?,7,15,3,0,5,0,8,0,,,global,sekolah_smk
iq-10,IQ,Spasial,Berapa banyak kubus pada gambar berikut?,8,10,12,0,10,0,14,0,,https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400,VCHR-SMK-2026,sekolah_smk
hol-13,Holland,Realistic (Praktis/Teknis),Seberapa suka Anda mendesain komponen sirkuit elektronik?,Sangat Suka,5,Biasa,3,Ragu,1,Benci,0,R,,global,sekolah_smk`);
    }
  };

  // Excel template downloads
  const downloadStudentTemplateExcel = () => {
    const data = [
      { NIM: "1015", Nama: "Rahmat Kartolo", Kelas: "XII TKRO 1", Password: "pass1015" },
      { NIM: "1016", Nama: "Maya Indah", Kelas: "XII DKV 1", Password: "pass1016" },
      { NIM: "1017", Nama: "Gilang Perdana", Kelas: "XII RPL 2", Password: "pass1017" }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Siswa");
    XLSX.writeFile(wb, "template_impor_siswa.xlsx");
  };

  const downloadQuestionTemplateExcel = () => {
    const data = [
      {
        ID: "iq-9",
        Jenis_Tes: "IQ",
        Dimensi: "Logika Matematika",
        Pertanyaan: "Jika A + B = 10 dan A - B = 4 berapa nilai A?",
        Opsi_A: "7",
        Skor_A: 15,
        Opsi_B: "3",
        Skor_B: 0,
        Opsi_C: "5",
        Skor_C: 0,
        Opsi_D: "8",
        Skor_D: 0,
        Tipe_Holland: "",
        Gambar: "",
        Lisensi_Khusus: "global",
        Konteks_Instansi: "sekolah_smk,sekolah_sma"
      },
      {
        ID: "iq-10",
        Jenis_Tes: "IQ",
        Dimensi: "Spasial",
        Pertanyaan: "Berapa banyak kubus pada gambar berikut?",
        Opsi_A: "8",
        Skor_A: 10,
        Opsi_B: "12",
        Skor_B: 0,
        Opsi_C: "10",
        Skor_C: 0,
        Opsi_D: "14",
        Skor_D: 0,
        Tipe_Holland: "",
        Gambar: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400",
        Lisensi_Khusus: "VCHR-SMK-2026",
        Konteks_Instansi: "sekolah_smk"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Butir Pertanyaan");
    XLSX.writeFile(wb, "template_impor_soal.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b border-slate-100 font-sans text-slate-800">
        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Sistem Impor & Ekspor Excel / CSV</h2>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Unggah berkas Microsoft Excel (.xlsx) atau CSV secara langsung untuk mendaftarkan peserta ujian (siswa) atau bank soal psikometri secara massal dengan format yang terstandar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: File Upload & Templates */}
        <div className="space-y-4 font-sans text-slate-805">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">1. Pilih Jenis Data:</label>
            <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => { setImportType('students'); setImportResult(null); setErrorMsg(null); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  importType === 'students' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daftar Siswa (NIM)
              </button>
              <button
                type="button"
                onClick={() => { setImportType('questions'); setImportResult(null); setErrorMsg(null); }}
                className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                  importType === 'questions' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Butir Pertanyaan
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 block">2. Unduh Template Excel Resmi:</label>
            <p className="text-[11px] text-slate-400 leading-normal font-medium">
              Unduh file template di bawah ini untuk memastikan kolom tabel Anda sesuai dengan format importasi PsikoSMK.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={downloadStudentTemplateExcel}
                className="text-xs text-emerald-700 hover:text-white hover:bg-emerald-600 font-bold border border-emerald-200 rounded-lg px-3 py-2 bg-emerald-50/50 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Template Siswa (.xlsx)
              </button>
              <button
                type="button"
                onClick={downloadQuestionTemplateExcel}
                className="text-xs text-indigo-700 hover:text-white hover:bg-indigo-600 font-bold border border-indigo-200 rounded-lg px-3 py-2 bg-indigo-50/50 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Template Soal (.xlsx)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-700 block">3. Unggah Berkas Excel/CSV:</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
                dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Tarik & Lepas file di sini, atau klik untuk memilih</p>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Mendukung format .xlsx, .xls, atau .csv</p>
            </div>
          </div>
        </div>

        {/* Right Column: Paste CSV Editor fallback */}
        <div className="flex flex-col justify-between border-l border-slate-100 pl-0 md:pl-6 space-y-4 font-sans text-slate-800">
          <div className="space-y-1.5 flex-1 flex flex-col">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">4. Alternatif: Salin & Tempel Baris CSV</span>
              <button
                type="button"
                onClick={loadCsvTemplate}
                className="text-[10px] text-indigo-600 hover:underline font-bold"
              >
                Muat Contoh Teks CSV
              </button>
            </div>
            <textarea
              value={rawCsv}
              onChange={(e) => setRawCsv(e.target.value)}
              placeholder={
                importType === 'students' 
                  ? "NIM,Nama,Kelas,Password\n1015,Rahmat Kartolo,XII TKRO 1,password123"
                  : "ID,Jenis_Tes,Dimensi,Pertanyaan,Opsi_A,Skor_A,Opsi_B,Skor_B,Opsi_C,Skor_C,Opsi_D,Skor_D,Tipe_Holland,Gambar,Lisensi_Khusus,Konteks_Instansi\niq-9,IQ,Logika Matematika,Pertanyaan contoh?,Opsi A,15,Opsi B,0,,,,,,global,sekolah_smk"
              }
              className="w-full flex-1 text-[11px] p-3 border border-slate-200 rounded-xl font-mono focus:outline-indigo-500 bg-slate-50 min-h-[160px] text-slate-800"
            ></textarea>
          </div>

          <button
            type="button"
            onClick={handleImport}
            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Proses Teks CSV Sekarang
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-250 bg-rose-50 text-rose-850 flex items-start gap-2.5 mt-4">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-rose-900">Gagal Melakukan Impor:</span>
            <span className="font-semibold leading-relaxed block mt-0.5">{errorMsg}</span>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`p-4 rounded-xl border mt-4 ${
          importResult.errors.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs">
            {importResult.errors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <span>Impor Selesai! Berhasil: {importResult.successCount} data.</span>
          </div>
          {importResult.errors.length > 0 && (
            <div className="mt-3 text-xs bg-white/70 p-3 rounded-lg max-h-[150px] overflow-y-auto space-y-1 font-mono text-slate-800">
              <p className="font-bold text-amber-900 border-b pb-1 mb-1">Catatan/Error Log:</p>
              {importResult.errors.map((err, i) => (
                <p key={i} className="text-amber-700 text-[11px]">• {err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
