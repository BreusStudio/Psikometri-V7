'use client';

import React, { useState, useRef } from 'react';
import { TestSettings } from '@/lib/types';
import { 
  Award, 
  Upload, 
  Check, 
  Trash2, 
  Info, 
  Eye, 
  Edit3, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';

interface CertificateSettingsTabProps {
  testSettings: TestSettings;
  handleToggleSetting: (key: keyof TestSettings) => void;
  handleUpdateSetting: (key: keyof TestSettings, value: any) => void;
}

export default function CertificateSettingsTab({
  testSettings,
  handleToggleSetting,
  handleUpdateSetting
}: CertificateSettingsTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewStudent, setPreviewStudent] = useState({
    name: 'Ahmad Rafli Pratama',
    school: 'SMK Negeri 1 Surabaya',
    date: '13 Juli 2026',
    iq: '115',
    eq: '110',
    holland: 'RIA',
    recommendation: 'Teknik Komputer & Jaringan (TKJ)'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Scaling state & effect for responsive certificate preview using ResizeObserver
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const targetWidth = 760;
        if (width > 0) {
          if (width < targetWidth) {
            setScale(width / targetWidth);
          } else {
            setScale(1);
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const presets = [
    {
      id: 'elegant-navy',
      name: 'Elegant Navy',
      primary: '#0f172a', // Slate 900
      secondary: '#6366f1', // Indigo 500
      accent: '#e2e8f0',
      description: 'Garis geometris modern dengan paduan biru gelap dan abu cerah yang profesional.'
    },
    {
      id: 'modern-gold',
      name: 'Modern Gold',
      primary: '#1e1b4b', // Indigo 950
      secondary: '#eab308', // Gold / Yellow 500
      accent: '#fef08a',
      description: 'Latar krem klasik berpaut lis ganda emas mewah yang melambangkan keunggulan akademik.'
    },
    {
      id: 'warm-emerald',
      name: 'Warm Emerald',
      primary: '#064e3b', // Emerald 900
      secondary: '#10b981', // Emerald 500
      accent: '#d1fae5',
      description: 'Gaya hijau botol yang bersahaja dilengkapi ornamen sudut bercitra asri.'
    },
    {
      id: 'minimalist',
      name: 'Classic Charcoal',
      primary: '#111827', // Gray 900
      secondary: '#4b5563', // Gray 600
      accent: '#f3f4f6',
      description: 'Tipografi modern yang rapi dengan pembatas tipis yang berfokus pada hasil murni.'
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Mohon unggah file gambar (PNG, JPG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleUpdateSetting('certCustomBackground', event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCustomBackground = () => {
    handleUpdateSetting('certCustomBackground', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Replace placeholders helper for rendering preview
  const renderTextWithPlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{nama}/g, previewStudent.name)
      .replace(/{sekolah}/g, previewStudent.school)
      .replace(/{tanggal}/g, previewStudent.date)
      .replace(/{skor_iq}/g, previewStudent.iq)
      .replace(/{skor_eq}/g, previewStudent.eq)
      .replace(/{kode_holland}/g, previewStudent.holland)
      .replace(/{rekomendasi}/g, previewStudent.recommendation);
  };

  const selectedPreset = presets.find(p => p.id === (testSettings.certBackgroundPreset || 'elegant-navy')) || presets[0];

  // Certificate Preset Visual Themes
  const getPresetStyles = (presetId: string) => {
    switch (presetId) {
      case 'modern-gold':
        return {
          bgClass: 'bg-[#fafaf6]',
          borderClass: 'border-[16px] border-amber-100 outline outline-4 outline-amber-500/30 outline-offset-[-10px]',
          textPrimary: 'text-indigo-950',
          textSecondary: 'text-amber-600',
          sealColor: 'bg-amber-500 text-white',
          accentBorder: 'border-amber-200'
        };
      case 'warm-emerald':
        return {
          bgClass: 'bg-[#f4fbf7]',
          borderClass: 'border-[16px] border-emerald-950 outline outline-4 outline-emerald-500/20 outline-offset-[-10px]',
          textPrimary: 'text-emerald-950',
          textSecondary: 'text-emerald-700',
          sealColor: 'bg-emerald-700 text-white',
          accentBorder: 'border-emerald-100'
        };
      case 'minimalist':
        return {
          bgClass: 'bg-white',
          borderClass: 'border-[8px] border-slate-900',
          textPrimary: 'text-slate-900',
          textSecondary: 'text-slate-600',
          sealColor: 'bg-slate-950 text-white',
          accentBorder: 'border-slate-200'
        };
      case 'elegant-navy':
      default:
        return {
          bgClass: 'bg-[#fafbff]',
          borderClass: 'border-[16px] border-slate-900 outline outline-4 outline-indigo-500/30 outline-offset-[-10px]',
          textPrimary: 'text-slate-900',
          textSecondary: 'text-indigo-600',
          sealColor: 'bg-indigo-600 text-white',
          accentBorder: 'border-indigo-100'
        };
    }
  };

  const themeStyles = getPresetStyles(selectedPreset.id);

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="certificate-settings-tab">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-indigo-600 shrink-0" />
            <span>Pengaturan Desain Sertifikat & Legalitas</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalisasi template visual, kalimat pengantar, penandatangan Guru BK, serta pengamanan QR-Code anti-pemalsuan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: EDITING FORMS & UPLOADS */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* PRESCRIPTION LEGAL WARNING */}
          <div className="bg-blue-50/60 border border-blue-150 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Pedoman Keamanan & Legalitas Sertifikat Hasil</p>
              <p className="font-medium">
                Prita Oktavia Surya Winanti, S.Psi bertindak sebagai <strong>Guru Bimbingan Konseling (BK)</strong> di sekolah. Laporan ini dirancang sebagai instrumen bimbingan karir vokasi kependidikan.
              </p>
              <p className="text-[10px] text-blue-600 font-semibold uppercase mt-1">
                ✓ Sesuai SOP BK • Terintegrasi QR-Code Verifikator Digital • Tersegel AI Engine
              </p>
            </div>
          </div>

          {/* PRESENTS & LAYOUT */}
          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>1. Preset Tema Sertifikat</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = (testSettings.certBackgroundPreset || 'elegant-navy') === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => handleUpdateSetting('certBackgroundPreset', preset.id)}
                    className={`p-3 text-left border rounded-xl transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                      isSelected && !testSettings.certCustomBackground
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                        : 'border-slate-150 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                      {isSelected && !testSettings.certCustomBackground && (
                        <span className="bg-indigo-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    
                    {/* Visual Color Dots */}
                    <div className="flex gap-1.5 items-center mt-2">
                      <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.primary }} />
                      <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.secondary }} />
                      <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: preset.accent }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* CUSTOM BACKGROUND UPLOADER */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Atau Gunakan Desain Sendiri (Opsional)
              </label>
              
              {testSettings.certCustomBackground ? (
                <div className="p-3 border border-indigo-150 bg-indigo-50/20 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={testSettings.certCustomBackground} 
                        alt="Custom design" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-indigo-950 truncate">Desain_Sertifikat_Kustom.png</p>
                      <p className="text-[10px] text-slate-400 font-mono">Format: Base64 URI</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCustomBackground}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                    title="Hapus Desain"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    setUploadError(null);
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-indigo-600 bg-indigo-50/10' 
                      : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      setUploadError(null);
                      handleFileInput(e);
                    }}
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">Tarik gambar ke sini, atau klik untuk memilih</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mendukung PNG, JPG, WEBP (Rekomendasi rasio horizontal: A4)</p>
                  {uploadError && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1.5 animate-fade-in">{uploadError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* EDIT WORDING & PHRASES */}
          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-500" />
              <span>2. Redaksi Kalimat & Pengantar</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Judul Utama Sertifikat
                </label>
                <input
                  type="text"
                  value={testSettings.certTitle || ''}
                  onChange={(e) => handleUpdateSetting('certTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Contoh: SERTIFIKAT HASIL ASESMEN PSIKOMETRI"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Isi Kalimat Pengantar / Keterangan
                  </label>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">Placeholders Aktif</span>
                </div>
                <textarea
                  value={testSettings.certMainWording || ''}
                  onChange={(e) => handleUpdateSetting('certMainWording', e.target.value)}
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
                  placeholder="Ketik kalimat pengantar sertifikat..."
                />
                
                {/* PLACEHOLDER TAG HELPERS */}
                <div className="mt-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-[10px]">
                  <p className="font-bold text-slate-500">Klik tag ini untuk menyisipkan variabel dinamis:</p>
                  <div className="flex flex-wrap gap-1.5 font-mono">
                    {[
                      { tag: '{nama}', desc: 'Nama Siswa' },
                      { tag: '{sekolah}', desc: 'Sekolah' },
                      { tag: '{tanggal}', desc: 'Tanggal' },
                      { tag: '{skor_iq}', desc: 'Skor IQ' },
                      { tag: '{skor_eq}', desc: 'Skor EQ' },
                      { tag: '{kode_holland}', desc: 'RIASEC' },
                      { tag: '{rekomendasi}', desc: 'Rekomendasi Karir' },
                    ].map(helper => (
                      <button
                        type="button"
                        key={helper.tag}
                        onClick={() => {
                          const currentText = testSettings.certMainWording || '';
                          handleUpdateSetting('certMainWording', currentText + ' ' + helper.tag);
                        }}
                        className="bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 px-2 py-0.5 rounded-md transition-all font-medium"
                        title={helper.desc}
                      >
                        {helper.tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COUNSELOR SIGNATORY AND STAMP */}
          <div className="bg-white rounded-2xl border border-slate-150 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>3. Penandatangan & Validasi Legal</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Nama Penandatangan (Guru BK)
                </label>
                <input
                  type="text"
                  value={testSettings.certCounselorName || ''}
                  onChange={(e) => handleUpdateSetting('certCounselorName', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Contoh: Prita Oktavia Surya Winanti, S. Psi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Jabatan / Gelar
                  </label>
                  <input
                    type="text"
                    value={testSettings.certCounselorTitle || ''}
                    onChange={(e) => handleUpdateSetting('certCounselorTitle', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: Guru BK / Konselor Sekolah"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    NIP / Kode Guru BK
                  </label>
                  <input
                    type="text"
                    value={testSettings.certCounselorNip || ''}
                    onChange={(e) => handleUpdateSetting('certCounselorNip', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Contoh: NIP. - atau - "
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME GRAPHICAL PREVIEW */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-500" />
              <span>Real-Time Live Digital Preview (Rasio A4 Horizontal)</span>
            </h3>
            
            {/* TOGGLE PREVIEW DATA */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Siswa Contoh:</span>
              <select 
                value={previewStudent.name}
                onChange={(e) => {
                  const name = e.target.value;
                  if (name === 'Ahmad Rafli Pratama') {
                    setPreviewStudent({
                      name: 'Ahmad Rafli Pratama',
                      school: 'SMK Negeri 1 Surabaya',
                      date: '13 Juli 2026',
                      iq: '115',
                      eq: '110',
                      holland: 'RIA',
                      recommendation: 'Teknik Komputer & Jaringan (TKJ)'
                    });
                  } else {
                    setPreviewStudent({
                      name: 'Shabrina Fitriandari',
                      school: 'SMK Negeri 4 Bandung',
                      date: '13 Juli 2026',
                      iq: '128',
                      eq: '118',
                      holland: 'SEC',
                      recommendation: 'Akuntansi & Keuangan Lembaga (AKL)'
                    });
                  }
                }}
                className="bg-slate-100 border border-slate-200 rounded-lg text-[10px] px-2 py-1 focus:outline-none font-bold"
              >
                <option value="Ahmad Rafli Pratama">Rafli (IQ: 115 • RIA)</option>
                <option value="Shabrina Fitriandari">Shabrina (IQ: 128 • SEC)</option>
              </select>
            </div>
          </div>

          {/* REAL-TIME VISUAL GRAPHICAL CERTIFICATE CANVAS */}
          <div 
            ref={containerRef} 
            className="w-full bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-250 shadow-inner flex justify-center items-center overflow-hidden"
          >
            <div 
              style={{ 
                height: `${522 * scale}px`, 
                width: `${740 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s'
              }}
              className="shrink-0"
            >
              <div 
                className={`
                  w-[740px] h-[522px] rounded-lg shadow-xl shrink-0 transition-all duration-300 relative select-none
                  ${testSettings.certCustomBackground ? 'bg-white' : themeStyles.bgClass}
                  ${testSettings.certCustomBackground ? 'border-4 border-slate-800' : themeStyles.borderClass}
                `}
                style={{
                  backgroundImage: testSettings.certCustomBackground ? `url(${testSettings.certCustomBackground})` : 'none',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              >
              
              {/* IF NOT USING CUSTOM DESIGN, RENDER THE PRESSET ORNAMENT OVERLAYS */}
              {!testSettings.certCustomBackground && (
                <>
                  {/* Custom corner motifs */}
                  <div className={`absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 ${selectedPreset.id === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                  <div className={`absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 ${selectedPreset.id === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                  <div className={`absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 ${selectedPreset.id === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                  <div className={`absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 ${selectedPreset.id === 'modern-gold' ? 'border-amber-400' : 'border-slate-400'}`} />
                </>
              )}

              {/* WATERMARK EMBLEM ON Preset */}
              {!testSettings.certCustomBackground && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-slate-900 pointer-events-none">
                  <Award className="w-[320px] h-[320px]" />
                </div>
              )}

              {/* CERTIFICATE TEXT WRAPPER */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between items-center text-center">
                
                {/* HEADER ROW */}
                <div className="space-y-1 mt-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase font-mono tracking-widest ${themeStyles.textSecondary}`}>
                      CBT Psikometri Official Authenticity
                    </span>
                  </div>
                  <h2 className={`text-lg font-black tracking-tight font-sans uppercase ${themeStyles.textPrimary}`}>
                    {testSettings.certTitle || 'SERTIFIKAT HASIL ASESMEN PSIKOMETRI'}
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-slate-400 to-transparent mx-auto" />
                </div>

                {/* MAIN BODY TEXT */}
                <div className="max-w-lg space-y-4">
                  <p className="text-[11px] leading-relaxed text-slate-600 font-sans font-medium px-4">
                    {renderTextWithPlaceholders(testSettings.certMainWording || '')}
                  </p>

                  {/* SCORE BADGES BOX */}
                  <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto bg-white/70 backdrop-blur-xs border border-slate-150 p-2.5 rounded-xl text-center shadow-xs">
                    <div className="space-y-0.5 border-r border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Skor IQ</p>
                      <p className="text-xs font-black text-blue-700 font-mono">{previewStudent.iq} <span className="text-[8px] font-bold text-slate-400">(Tinggi)</span></p>
                    </div>
                    <div className="space-y-0.5 border-r border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Skor EQ</p>
                      <p className="text-xs font-black text-purple-700 font-mono">{previewStudent.eq} <span className="text-[8px] font-bold text-slate-400">(Baik)</span></p>
                    </div>
                    <div className="space-y-0.5 border-r border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase font-mono">RIASEC Code</p>
                      <p className="text-xs font-black text-amber-700 font-mono">{previewStudent.holland}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase font-mono">Saran Vokasi</p>
                      <p className="text-[9px] font-bold text-teal-700 truncate px-1">{previewStudent.recommendation}</p>
                    </div>
                  </div>
                </div>

                {/* SIGNATURES ROW */}
                <div className="w-full flex justify-between items-end px-6 mb-2">
                  
                  {/* LEFT: PUBLIC QR-CODE VERIFIER (PROHIBITS FORGERY!) */}
                  <div className="flex items-center gap-3 bg-white/60 p-2 rounded-xl border border-slate-150 shadow-2xs max-w-[200px]">
                    {/* SVG MOCK VALID QR CODE */}
                    <div className="w-14 h-14 bg-slate-900 rounded p-1 shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                        {/* Outer frame & anchors */}
                        <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z" />
                        <path d="M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z" />
                        <path d="M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z" />
                        {/* Randomized grid pixels to look precisely like a QR code */}
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
                      <p className="text-[7px] text-slate-400 font-mono truncate w-24">VERIFY-PSIKOMETRI-173011</p>
                    </div>
                  </div>

                  {/* RIGHT: HANDWRITTEN COUNSELOR SIGNATURE */}
                  <div className="text-center w-48 space-y-1">
                    <p className="text-[8px] text-slate-400 font-bold uppercase font-mono">Pendidik Penanggung Jawab,</p>
                    
                    {/* Simulated hand stamp/signature style */}
                    <div className="h-10 relative flex items-center justify-center">
                      {/* AI verification seal overlay stamp */}
                      <div className="absolute left-1/2 -translate-x-1/2 -rotate-12 border-2 border-indigo-600/40 text-indigo-600/30 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md select-none pointer-events-none">
                        CBT Core Official Seal
                      </div>
                      <span className="font-serif italic text-sm text-slate-700 tracking-wide">
                        {testSettings.certCounselorName || 'Prita Oktavia S. W., S. Psi'}
                      </span>
                    </div>

                    <div className="border-t border-slate-300 pt-1">
                      <p className="text-[9px] font-bold text-slate-800">{testSettings.certCounselorName || 'Prita Oktavia S. W., S. Psi'}</p>
                      <p className="text-[7px] font-bold text-slate-400 uppercase">{testSettings.certCounselorTitle || 'Guru Bimbingan Konseling'}</p>
                      <p className="text-[7px] font-bold text-slate-400 font-mono">{testSettings.certCounselorNip ? `NIP/ID: ${testSettings.certCounselorNip}` : ''}</p>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

          {/* HINT AND INSTRUCTIONS */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs text-slate-500 space-y-2 leading-relaxed">
            <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Petunjuk Variabel Redaksi</span>
            </h4>
            <p>
              Gunakan penulisan variabel huruf kecil seperti <code className="font-mono bg-white px-1 py-0.5 rounded border">{"{nama}"}</code>, <code className="font-mono bg-white px-1 py-0.5 rounded border">{"{sekolah}"}</code>, atau <code className="font-mono bg-white px-1 py-0.5 rounded border">{"{tanggal}"}</code> di dalam kotak teks. Sistem akan secara otomatis mengganti variabel tersebut dengan nama asli siswa, sekolah asal, dan tanggal pengerjaan ujian secara dinamis saat diunduh.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
