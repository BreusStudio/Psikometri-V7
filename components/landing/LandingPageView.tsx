'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Award, 
  Users, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  LogIn, 
  UserPlus, 
  School, 
  GraduationCap, 
  Compass, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { LandingPageContent } from '@/lib/core/types';

interface LandingNavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function LandingNavbar({ onOpenLogin, onOpenRegister }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
              Psychometrics<span className="text-indigo-600">.id</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
              Platform Pemetaan Potensi & Talent Analytics
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#hero" className="hover:text-indigo-600 transition-colors">Beranda</a>
          <a href="#fitur" className="hover:text-indigo-600 transition-colors">Fitur Asesmen</a>
          <a href="#statistik" className="hover:text-indigo-600 transition-colors">Statistik</a>
          <a href="#pendaftaran" className="hover:text-indigo-600 transition-colors">Layanan & Pendaftaran</a>
          <a href="#kontak" className="hover:text-indigo-600 transition-colors">Kontak</a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 transition-all border border-indigo-200/60 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Masuk / Login
          </button>
          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <School className="w-4 h-4" />
            Daftar Instansi
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <a 
            href="#hero" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-indigo-600"
          >
            Beranda
          </a>
          <a 
            href="#fitur" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-indigo-600"
          >
            Fitur Asesmen
          </a>
          <a 
            href="#statistik" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-indigo-600"
          >
            Statistik
          </a>
          <a 
            href="#pendaftaran" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-indigo-600"
          >
            Layanan & Pendaftaran
          </a>
          <a 
            href="#kontak" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 font-medium py-2 hover:text-indigo-600"
          >
            Kontak
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200"
            >
              <LogIn className="w-4 h-4" />
              Masuk / Login
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenRegister(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600"
            >
              <School className="w-4 h-4" />
              Daftar Instansi
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

interface LandingPageViewProps {
  content: LandingPageContent;
  stats: {
    schools: number;
    tests: number;
    students: number;
    majors: number;
  };
  onOpenLogin: () => void;
  onOpenPersonalRegister: () => void;
  onOpenInstansiRegister: () => void;
}

export function LandingPageView({
  content,
  stats,
  onOpenLogin,
  onOpenPersonalRegister,
  onOpenInstansiRegister
}: LandingPageViewProps) {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 py-16 lg:py-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-700 bg-indigo-100/80 border border-indigo-200/80 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Platform Asesmen Computer-Based Test (CBT) Terintegrasi
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {content.heroHeadline || 'Platform Asesmen Pemetaan Potensi, Talenta & Orientasi Karir Digital'}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {content.heroSubheading || 'Sistem Computer-Based Test terintegrasi untuk pemetaan Indeks Kemampuan Kognitif, Kecerdasan Emosional, serta Profil Gaya Kerja (RIASEC Framework) bagi Talenta, Instansi, dan Perusahaan.'}
            </p>

            {/* Hero CTA buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                Mulai Asesmen / Masuk Akun
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={onOpenInstansiRegister}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all border border-slate-300 shadow-xs cursor-pointer"
              >
                <School className="w-5 h-5 text-indigo-600" />
                Pendaftaran Instansi
              </button>

              <button
                onClick={onOpenPersonalRegister}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Peserta Mandiri
              </button>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Proctoring & Anti-Kecurangan Realtime
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Analisis Otomatis & Rekomendasi Gemini AI
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Sertifikat & Laporan Pemetaan Potensi PDF
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics */}
      <section id="statistik" className="py-12 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="inline-flex p-3 rounded-xl bg-indigo-100 text-indigo-600 mb-2">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.schools.toLocaleString('id-ID')}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Instansi Mitra</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="inline-flex p-3 rounded-xl bg-emerald-100 text-emerald-600 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.students.toLocaleString('id-ID')}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Peserta Teruji</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="inline-flex p-3 rounded-xl bg-sky-100 text-sky-600 mb-2">
                <Award className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.tests.toLocaleString('id-ID')}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sesi Asesmen</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <div className="inline-flex p-3 rounded-xl bg-purple-100 text-purple-600 mb-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {stats.majors.toLocaleString('id-ID')}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jurusan & Karir</div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Features */}
      <section id="fitur" className="py-16 bg-slate-50/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Modul Asesmen Pemetaan Potensi & Talenta Komprehensif
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Dirancang untuk mengukur Indeks Kemampuan Kognitif, Kecerdasan Emosional, dan Profil Gaya Kerja (RIASEC Framework) secara terukur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {content.feature1Title || 'Cognitive Ability Index'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {content.feature1Desc || 'Pemetaan penalaran logika, spasial, verbal, dan pemecahan masalah kompleks.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {content.feature2Title || 'Emotional & Working Resilience'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {content.feature2Desc || 'Pemetaan regulasi emosional, adaptasi stresor, dan ketahanan dinamika tim.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {content.feature3Title || 'Vocational Interest Profile'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {content.feature3Desc || 'Pemetaan orientasi gaya kerja berbasis kerangka kerja Holland RIASEC.'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {content.feature4Title || 'AI Talent Insight & Recommendations'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {content.feature4Desc || 'Sintesis narasi pemetaan dan rekomendasi pengembangan talenta berbasis Gemini AI.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Options Section */}
      <section id="pendaftaran" className="py-16 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Opsi Layanan & Pendaftaran
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Pilih jenis pendaftaran sesuai dengan kebutuhan instansi sekolah atau pengujian mandiri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1: Instansi */}
            <div className="p-8 rounded-2xl border border-slate-200 bg-gradient-to-b from-indigo-50/40 via-white to-white space-y-6 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-xs">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">
                  <School className="w-4 h-4" />
                  Kemitraan Sekolah / Instansi
                </div>
                <h3 className="text-2xl font-black text-slate-900">Pendaftaran Instansi (B2B)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Layanan kolektif untuk sekolah (SD, SMP, SMA, SMK, Perguruan Tinggi) dan korporasi. Dilengkapi Dashboard Admin, Manajemen Token CBT, Rekapitulasi Excel, dan Laporan Hasil Asesmen Kolektif.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Manajemen Kelas, Angkatan, & Rekapitulasi Wali Kelas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Proctoring & Batasan Device Anti-Kecurangan
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Custom Logo & Pengaturan Tanda Tangan Sertifikat
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenInstansiRegister}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Daftarkan Instansi Anda
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Personal */}
            <div className="p-8 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/60 via-white to-white space-y-6 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <UserPlus className="w-4 h-4" />
                  Peserta Personal / Mandiri
                </div>
                <h3 className="text-2xl font-black text-slate-900">Pendaftaran Mandiri</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bagi individu, siswa umum, atau profesional yang ingin mengukur Indeks Kemampuan Kognitif, regulasi emosi, serta keselarasan minat karir mandiri tanpa melalui sekolah.
                </p>
                <ul className="space-y-2 text-xs text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Akses Asesmen Pemetaan Potensi Mandiri
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Laporan Hasil Pemetaan Potensi & Rekomendasi Karir
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verifikasi Sertifikat Digital Resmi
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenPersonalRegister}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-300 cursor-pointer"
              >
                Daftar Peserta Mandiri
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer id="kontak" className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tight">Psychometrics.id</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform Asesmen Pemetaan Potensi & Computer-Based Test (CBT) Terintegrasi untuk Sekolah, Kampus, dan Instansi di Seluruh Indonesia.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="text-white font-bold text-sm">Informasi Kontak</h4>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{content.contactEmail || 'support@psychometrics.id'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{content.contactPhone || '+62 812-3456-7890'}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{content.contactAddress || 'Jl. Jenderal Sudirman No. 42, Jakarta Selatan, DKI Jakarta 12190'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="text-white font-bold text-sm">Akses Cepat</h4>
              <div className="flex flex-col gap-2">
                <button onClick={onOpenLogin} className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Login Sistem Asesmen / CBT
                </button>
                <button onClick={onOpenInstansiRegister} className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Pengajuan Kemitraan Sekolah
                </button>
                <button onClick={onOpenPersonalRegister} className="text-left text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Pendaftaran Peserta Mandiri
                </button>
              </div>
            </div>
          </div>

          {/* LEGAL DISCLAIMER NOTICE IN FOOTER */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed max-w-4xl mx-auto">
            <strong>Disclaimer Legalitas Platform:</strong> Psychometrics.id merupakan platform teknologi edukasi dan pemetaan potensi mandiri berbasis algoritma digital untuk bimbingan sekolah, vokasi, dan karir. Hasil laporan instrumen bersifat indikatif sebagai bahan acuan bimbingan konseling dan tidak bersifat diagnostik medis/klinis.
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Psychometrics.id — Platform Asesmen Pemetaan Potensi & Talent Analytics Digital. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
