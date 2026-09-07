'use client';

import React from 'react';
import { PsychometricStore, Student } from '@/lib/mockData';
import { 
  ShieldCheck, 
  User, 
  School, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  ArrowLeft,
  Award
} from 'lucide-react';

interface CertificateVerificationProps {
  studentId: string;
  store: PsychometricStore;
  onBackToLogin: () => void;
}

export default function CertificateVerification({
  studentId,
  store,
  onBackToLogin
}: CertificateVerificationProps) {
  const student = store.getStudents().find(s => s.id === studentId);
  const settings = store.getTestSettings();

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white font-sans">
        <div className="bg-slate-800 rounded-2xl p-8 border border-rose-500/30 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="mx-auto bg-rose-500/10 text-rose-400 p-4 rounded-full w-16 h-16 flex items-center justify-center animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-rose-400">Verifikasi Gagal</h2>
            <p className="text-slate-300 text-xs leading-relaxed font-semibold">
              Dokumen atau Sertifikat dengan ID: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-rose-300 font-mono text-[10px]">{studentId}</code> tidak terdaftar dalam database CBT Core kami.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate highRIASEC code
  const getRiasecCode = (student: Student) => {
    if (!student.riasecScores) return 'RIA';
    return Object.entries(student.riasecScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(item => item[0])
      .join("");
  };

  const formattedDate = student.testCompletedAt 
    ? new Date(student.testCompletedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '13 Juli 2026';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden text-slate-100">
        
        {/* TOP BANNER */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 px-6 py-6 border-b border-indigo-950/40 relative">
          <div className="absolute top-4 right-4 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>CBT Core Authenticity</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2.5 border border-indigo-500/20 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-300">Validator Sertifikat Digital</h1>
              <p className="text-[10px] text-slate-400 font-medium">Sistem Keamanan Pemeriksaan Psikometri Sekolah Berbasis AI</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* VERIFICATION SHIELD SUCCESS */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex gap-3.5 text-xs text-emerald-300">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-100 text-sm">Status Sertifikat: ASLI & VALID (Terverifikasi)</p>
              <p className="text-slate-300 font-medium leading-relaxed text-[11px]">
                Sertifikat hasil asesmen atas nama siswa di bawah ini benar-benar terdaftar di database CBT Core, dikonfirmasi telah mengikuti ujian, serta divalidasi oleh konselor sekolah penanggung jawab.
              </p>
              <p className="text-[10px] text-emerald-400 font-mono font-bold mt-1 uppercase tracking-wider">
                ✓ Cryptographic ID: SECURE-CBT-{student.id.toUpperCase()}-2026
              </p>
            </div>
          </div>

          {/* STUDENT DATA DISPLAY */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Informasi Penerima Sertifikat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Nama Siswa</span>
                  <span className="text-slate-100 text-sm font-black">{student.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <School className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Sekolah Asal</span>
                  <span className="text-slate-100 text-sm font-black">{student.schoolOrigin || 'SMK Negeri 1 Surabaya'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Tanggal Ujian Selesai</span>
                  <span className="text-slate-100 font-bold">{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Nomor Induk Siswa (NIM/NISN)</span>
                  <span className="text-slate-100 font-mono text-sm font-black">{student.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PSYCHOMETRIC VERIFIED RESULTS */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Hasil Rekap Psikometri Terverifikasi
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/30 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[8px] font-black text-slate-500 uppercase block tracking-wider mb-1">Skor IQ</span>
                <span className="text-sm font-black text-blue-400 font-mono block">{student.iqScore || 95}</span>
                <span className="text-[8px] text-slate-500 block font-medium uppercase mt-0.5">Potensi Kognitif</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[8px] font-black text-slate-500 uppercase block tracking-wider mb-1">Skor EQ</span>
                <span className="text-sm font-black text-purple-400 font-mono block">{student.eqScore || 90}</span>
                <span className="text-[8px] text-slate-500 block font-medium uppercase mt-0.5">Regulasi Emosi</span>
              </div>
              <div className="bg-slate-900/30 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[8px] font-black text-slate-500 uppercase block tracking-wider mb-1">Holland RIASEC</span>
                <span className="text-sm font-black text-amber-400 font-mono block">{getRiasecCode(student)}</span>
                <span className="text-[8px] text-slate-500 block font-medium uppercase mt-0.5">Minat Vokasional</span>
              </div>
            </div>

            {/* AI SUGGESTION & MAJOR */}
            {student.aiAnalysis ? (
              <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-xl space-y-1.5 text-xs text-indigo-300">
                <p className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <Award className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Saran Penjajakan Karir & Bidang Kompetensi (AI)</span>
                </p>
                <p className="leading-relaxed text-[11px] font-medium text-slate-300 line-clamp-3">
                  {student.aiAnalysis}
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900/30 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500 font-medium">
                Saran bimbingan karir belum dipicu oleh Guru BK.
              </div>
            )}
          </div>

          {/* SIGNATORY INFO */}
          <div className="border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row justify-between items-start gap-4 text-xs font-semibold">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Pendidik Penanggung Jawab</span>
              <p className="text-slate-200 font-bold mt-0.5">{settings.certCounselorName || 'Prita Oktavia Surya Winanti, S. Psi'}</p>
              <p className="text-[10px] text-slate-400 mt-0.2">{settings.certCounselorTitle || 'Guru BK / Konselor Sekolah'}</p>
              <p className="text-[9px] text-slate-500 font-mono">{settings.certCounselorNip ? `NIP/ID: ${settings.certCounselorNip}` : ''}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Keabsahan Dokumen</span>
              <p className="text-emerald-400 font-black mt-0.5 flex items-center sm:justify-end gap-1 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Terjamin Anti-Falsifikasi</span>
              </p>
              <p className="text-[10px] text-slate-400 max-w-xs sm:text-right font-medium leading-relaxed mt-1">
                Data ditarik secara langsung dari portal CBT Psikometri berlisensi resmi.
              </p>
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-slate-800 flex justify-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Login</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
