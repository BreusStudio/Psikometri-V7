'use client';

import React, { useState, useMemo } from 'react';
import { 
  LayoutTemplate, Sparkles, Megaphone, CheckCircle2, 
  HelpCircle, Eye, SlidersHorizontal, Info, Mail, Phone, MapPin, Award, Building2, Users2, FileText, Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { PsychometricStore } from '../../lib/mockData';
import { LandingPageContent } from '../../lib/types';

interface LandingEditorTabProps {
  store: PsychometricStore;
  session: any;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onRefresh?: () => void;
}

export default function LandingEditorTab({
  store,
  session,
  showNotification,
  onRefresh
}: LandingEditorTabProps) {
  const initialContent = useMemo(() => store.getLandingPageContent(), [store]);
  const [content, setContent] = useState<LandingPageContent>(initialContent);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'superadmin'
  );

  const handleChange = (key: keyof LandingPageContent, value: string | number) => {
    setContent(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      showNotification?.('Anda tidak memiliki akses untuk mengubah konten landing page.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      store.updateLandingPageContent(content);
      showNotification?.('Konten Landing Page berhasil diperbarui!', 'success');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showNotification?.('Gagal menyimpan konten: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan semua konten landing page ke pengaturan default bawaan?')) {
      const defaults = (store as any).getDefaultLandingPageContent();
      setContent(defaults);
      store.updateLandingPageContent(defaults);
      showNotification?.('Konten dikembalikan ke default.', 'info');
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Header Banner */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <LayoutTemplate className="w-24 h-24 text-indigo-600" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Landing Page Editor</h2>
            <p className="text-sm text-slate-500 font-medium max-w-xl">
              Ubah tulisan, fitur unggulan, data statistik, serta kontak bantuan yang tampil di halaman beranda utama sistem.
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Editor Konten
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Pratinjau Mini
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel 1: Hero Section Branding */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Hero & Tajuk Utama</h3>
                  <p className="text-[10px] text-slate-400 font-bold">First fold copy yang menyapa pengunjung pertama kali.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Headline Utama</label>
                  <input
                    type="text"
                    required
                    value={content.heroHeadline}
                    onChange={(e) => handleChange('heroHeadline', e.target.value)}
                    placeholder="Masukkan headline utama..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Sub-Headline / Penjelasan</label>
                  <textarea
                    required
                    rows={4}
                    value={content.heroSubheading}
                    onChange={(e) => handleChange('heroSubheading', e.target.value)}
                    placeholder="Masukkan penjelasan singkat produk..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Panel 2: Stats & Social Proof */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Statistik & Kredibilitas</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Angka pencapaian platform untuk memperkuat trust seal.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    Sekolah Mitra
                  </label>
                  <input
                    type="number"
                    required
                    value={content.statSchools}
                    onChange={(e) => handleChange('statSchools', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-emerald-500" />
                    Siswa Teruji
                  </label>
                  <input
                    type="number"
                    required
                    value={content.statStudents}
                    onChange={(e) => handleChange('statStudents', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    Tes Terlaksana
                  </label>
                  <input
                    type="number"
                    required
                    value={content.statTests}
                    onChange={(e) => handleChange('statTests', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Data statistik ini disajikan di strip pencapaian untuk memberikan rasa aman kepada instansi baru yang ingin mendaftar. Gunakan angka yang kredibel.
                </p>
              </div>
            </div>

            {/* Panel 3: Core Features & Sub-tests description */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Modul & Fitur Unggulan</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Kustomisasi penamaan dan ringkasan 4 pilar layanan utama yang ditawarkan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature 1 */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                  <div className="inline-flex px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-mono font-black text-indigo-700 uppercase">Pilar 1 (IQ)</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={content.feature1Title}
                      onChange={(e) => handleChange('feature1Title', e.target.value)}
                      placeholder="Judul Fitur 1"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                      type="text"
                      required
                      value={content.feature1Desc}
                      onChange={(e) => handleChange('feature1Desc', e.target.value)}
                      placeholder="Deskripsi Fitur 1"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                  <div className="inline-flex px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-md text-[9px] font-mono font-black text-emerald-700 uppercase">Pilar 2 (EQ)</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={content.feature2Title}
                      onChange={(e) => handleChange('feature2Title', e.target.value)}
                      placeholder="Judul Fitur 2"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input
                      type="text"
                      required
                      value={content.feature2Desc}
                      onChange={(e) => handleChange('feature2Desc', e.target.value)}
                      placeholder="Deskripsi Fitur 2"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                  <div className="inline-flex px-2 py-0.5 bg-purple-50 border border-purple-100 rounded-md text-[9px] font-mono font-black text-purple-700 uppercase">Pilar 3 (RIASEC)</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={content.feature3Title}
                      onChange={(e) => handleChange('feature3Title', e.target.value)}
                      placeholder="Judul Fitur 3"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <input
                      type="text"
                      required
                      value={content.feature3Desc}
                      onChange={(e) => handleChange('feature3Desc', e.target.value)}
                      placeholder="Deskripsi Fitur 3"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                  <div className="inline-flex px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md text-[9px] font-mono font-black text-amber-700 uppercase">Pilar 4 (VAK)</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      required
                      value={content.feature4Title}
                      onChange={(e) => handleChange('feature4Title', e.target.value)}
                      placeholder="Judul Fitur 4"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <input
                      type="text"
                      required
                      value={content.feature4Desc}
                      onChange={(e) => handleChange('feature4Desc', e.target.value)}
                      placeholder="Deskripsi Fitur 4"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 4: Contact & Footer Support details */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Hubungi Kami & Informasi Footer</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Alamat email resmi, nomor telepon CS, dan alamat fisik kantor pusat bantuan.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Email Bantuan
                  </label>
                  <input
                    type="email"
                    required
                    value={content.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="Contoh: support@sekolah.id"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    No. Telepon Support
                  </label>
                  <input
                    type="text"
                    required
                    value={content.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="Contoh: +62 821..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Alamat Fisik Kantor
                  </label>
                  <input
                    type="text"
                    required
                    value={content.contactAddress}
                    onChange={(e) => handleChange('contactAddress', e.target.value)}
                    placeholder="Masukkan alamat lengkap sekretariat..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-all cursor-pointer"
            >
              Kembalikan Konten Default
            </button>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving || !canEdit}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Konten'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Preview tab renders the custom layout in a mini sandbox card simulating the actual landing page */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden animate-fade-in">
          <div className="bg-slate-900 px-6 py-3 text-[10px] font-mono font-bold text-slate-400 border-b border-slate-800 flex justify-between items-center">
            <span>🔴 SIMULATOR LANDING PAGE WEBSITE</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-400">STATUS: AKTIF</span>
          </div>

          <div className="p-8 space-y-12 bg-slate-50/40">
            {/* Simulation Hero */}
            <div className="text-center space-y-5 max-w-3xl mx-auto py-8">
              <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-wider text-indigo-600 font-mono">
                ✨ TEKNOLOGI CBT AI TERAKREDITASI
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {content.heroHeadline}
              </h1>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xl mx-auto">
                {content.heroSubheading}
              </p>
              <div className="flex justify-center gap-3">
                <span className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow">Masuk CBT</span>
                <span className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-xl shadow-sm">Daftar Instansi</span>
              </div>
            </div>

            {/* Simulation Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center border-y border-slate-200/60 py-6">
              <div>
                <span className="block text-2xl font-black text-indigo-600">{content.statSchools}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Sekolah</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-emerald-600">{content.statStudents.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Peserta Didik</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-amber-600">{content.statTests.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Tes Selesai</span>
              </div>
            </div>

            {/* Simulation Features */}
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-900">4 Pilar Instrumen Utama</h2>
                <p className="text-[11px] text-slate-400 font-medium">Asesmen modular komprehensif</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] font-mono">IQ</div>
                  <h3 className="text-xs font-black text-slate-900">{content.feature1Title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{content.feature1Desc}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] font-mono">EQ</div>
                  <h3 className="text-xs font-black text-slate-900">{content.feature2Title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{content.feature2Desc}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] font-mono">HOL</div>
                  <h3 className="text-xs font-black text-slate-900">{content.feature3Title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{content.feature3Desc}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px] font-mono">VAK</div>
                  <h3 className="text-xs font-black text-slate-900">{content.feature4Title}</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{content.feature4Desc}</p>
                </div>
              </div>
            </div>

            {/* Simulation Footer */}
            <div className="bg-slate-900 text-slate-400 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-white">Hubungi Tim Psychometrics</span>
                <span className="text-[10px] font-mono text-slate-500">© 2026 CBT Core Engine</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px] font-medium leading-relaxed">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{content.contactEmail}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{content.contactPhone}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{content.contactAddress}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
