'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Upload, Trash2, Sliders, Image as ImageIcon, Crop, FileImage } from 'lucide-react';

export interface FormFieldMetadata {
  key: string;
  label: string;
  type: 'text' | 'number' | 'password' | 'select' | 'textarea' | 'checkbox' | 'image' | 'multi-checkbox' | 'multi-select' | 'datalist-text' | 'hidden';
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
  defaultValue?: any;
  disabled?: boolean;
  validation?: (value: any) => string | null;
  rows?: number; // for textarea
  imageOptions?: {
    aspectRatio?: number; // e.g. 1 (1:1), 1.77 (16:9)
    maxWidth?: number;     // e.g. 800
    maxHeight?: number;    // e.g. 800
    quality?: number;       // e.g. 0.75
  };
  colSpan?: 'full' | 'half' | '2/3' | '1/3' | '1/4' | '3/4';
}

interface FormGeneratorProps {
  fields: FormFieldMetadata[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  errorMessage?: string;
}

// Low-level Canvas Resizer and Compressor Utility
function processImageHelper(
  file: File,
  options: {
    aspectRatio?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<{ dataUrl: string; sizeBefore: number; sizeAfter: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal mendapatkan context canvas 2D'));
          return;
        }

        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        // Auto center crop to target ratio if defined
        if (options.aspectRatio && options.aspectRatio > 0) {
          const imgRatio = img.width / img.height;
          if (imgRatio > options.aspectRatio) {
            srcW = img.height * options.aspectRatio;
            srcX = (img.width - srcW) / 2;
          } else if (imgRatio < options.aspectRatio) {
            srcH = img.width / options.aspectRatio;
            srcY = (img.height - srcH) / 2;
          }
        }

        // Apply resize scaling parameters
        let targetW = srcW;
        let targetH = srcH;
        const maxW = options.maxWidth || 800;
        const maxH = options.maxHeight || 800;

        if (targetW > maxW) {
          targetH = (maxW / targetW) * targetH;
          targetW = maxW;
        }
        if (targetH > maxH) {
          targetW = (maxH / targetH) * targetW;
          targetH = maxH;
        }

        canvas.width = targetW;
        canvas.height = targetH;

        // Perform highest quality smoothing scaling on Canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH);

        // Compress using Canvas JPEG encoder with target quality
        const quality = options.quality ?? 0.75;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Precise size calculation of encoded base64 length in bytes
        const sizeAfter = Math.round((dataUrl.split(',')[1].replace(/=/g, '').length * 3) / 4);

        resolve({
          dataUrl,
          sizeBefore: file.size,
          sizeAfter,
          width: targetW,
          height: targetH,
        });
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar. File mungkin rusak.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal memuat file gambar.'));
    reader.readAsDataURL(file);
  });
}

export function ImageFieldUpload({ 
  value, 
  onChange, 
  disabled, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  disabled?: boolean; 
  label: string;
  options?: {
    aspectRatio?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  };
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local states for interactive customization
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(options?.aspectRatio ?? 1); // default 1:1 auto crop
  const [maxWidth, setMaxWidth] = useState<number>(options?.maxWidth ?? 800);
  const [quality, setQuality] = useState<number>(options?.quality ?? 0.75);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    percentSaved: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Removed useEffect to prevent set-state-in-effect warning. Instead we reprocess directly on settings changes!
  const reprocess = async (file: File, r: number | undefined, w: number, q: number) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processImageHelper(file, {
        aspectRatio: r === 0 ? undefined : r,
        maxWidth: w,
        maxHeight: w,
        quality: q
      });
      onChange(result.dataUrl);
      setCompressionStats({
        originalSize: result.sizeBefore,
        compressedSize: result.sizeAfter,
        percentSaved: Math.max(0, parseFloat(((1 - result.sizeAfter / result.sizeBefore) * 100).toFixed(1)))
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memproses gambar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Mohon unggah file gambar yang valid (JPG, PNG, WEBP, dll).');
      return;
    }
    setOriginalFile(file);
    await reprocess(file, aspectRatio, maxWidth, quality);
  };

  const handleRatioChange = async (newRatio: number | undefined) => {
    setAspectRatio(newRatio);
    if (originalFile) {
      await reprocess(originalFile, newRatio, maxWidth, quality);
    }
  };

  const handleWidthChange = async (newWidth: number) => {
    setMaxWidth(newWidth);
    if (originalFile) {
      await reprocess(originalFile, aspectRatio, newWidth, quality);
    }
  };

  const handleQualityChange = async (newQuality: number) => {
    setQuality(newQuality);
    if (originalFile) {
      await reprocess(originalFile, aspectRatio, maxWidth, newQuality);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    onChange('');
    setOriginalFile(null);
    setCompressionStats(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3 font-sans">
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {value ? (
        <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-4">
          {/* Main Preview Container */}
          <div className="relative border border-slate-200 bg-white rounded-xl overflow-hidden h-44 flex items-center justify-center shadow-inner group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={value} 
              alt="Pratinjau Hasil Optimasi" 
              className="object-contain max-h-44 w-full transition-transform duration-300 group-hover:scale-102"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-white/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Memproses Gambar...</span>
              </div>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2.5 right-2.5 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer z-10"
                title="Hapus Gambar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real-time Image Optimization Metrics */}
          {compressionStats && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                  <FileImage className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Status Optimasi</p>
                  <p className="text-slate-600 mt-0.5">
                    {formatSize(compressionStats.originalSize)} → <span className="font-bold text-emerald-700">{formatSize(compressionStats.compressedSize)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-1 rounded-full shadow-xs">
                  Hemat {compressionStats.percentSaved}%
                </span>
              </div>
            </div>
          )}

          {/* Interactive Parameters Subpanel (Auto Crop, Resize, Compress Settings) */}
          {!disabled && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100 pb-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Opsi Image Crop, Resize & Kompresi</span>
              </div>

              {/* Crop Aspect Ratio Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRatioChange(1)}
                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    aspectRatio === 1 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Kotak (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => handleRatioChange(1.777)}
                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    Math.abs((aspectRatio ?? 0) - 1.777) < 0.05 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Lanskap (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => handleRatioChange(0)}
                  className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    aspectRatio === 0 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Bebas (Asli)
                </button>
              </div>

              {/* Advanced Resize and Compression sliders */}
              <div className="space-y-3 pt-1">
                {/* Max Width Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>LEBAR MAKSIMAL (RESIZE)</span>
                    <span className="text-indigo-650">{maxWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="1600"
                    step="100"
                    value={maxWidth}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Quality Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>KUALITAS KOMPRESI</span>
                    <span className="text-indigo-650">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.95"
                    step="0.05"
                    value={quality}
                    onChange={(e) => handleQualityChange(Number(e.target.value))}
                    className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* HTML5 Premium Drag & Drop Area */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-36 select-none bg-white ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/40 scale-99 shadow-xs' 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChange}
            accept="image/*"
            disabled={disabled}
            className="hidden"
          />
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full group-hover:scale-105 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Tarik gambar ke sini, atau klik untuk memilih</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Mendukung JPEG, PNG, WEBP (Maksimal 10MB)</p>
          </div>
          <div className="mt-1 bg-indigo-500/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-indigo-500/10 text-indigo-700 font-bold text-[9px] uppercase tracking-wide">
            <Crop className="w-3 h-3 text-indigo-600" />
            <span>Dengan Auto Crop & Resizing Instan</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormGenerator({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Simpan Data',
  cancelLabel = 'Batal',
  errorMessage = ''
}: FormGeneratorProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    // Populate form initial values, handling defaults
    const vals: Record<string, any> = {};
    fields.forEach((field) => {
      vals[field.key] = initialValues[field.key] !== undefined ? initialValues[field.key] : (field.type === 'checkbox' ? false : '');
    });
    return vals;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (key: string, val: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: val
    }));
    // Clear field-level error on change
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform validations
    const errors: Record<string, string> = {};
    fields.forEach((field) => {
      const val = formValues[field.key];
      
      // Required check
      if (field.required) {
        if (field.type === 'checkbox') {
          if (!val) errors[field.key] = `${field.label} wajib dicentang.`;
        } else {
          if (val === undefined || val === null || String(val).trim() === '') {
            errors[field.key] = `${field.label} wajib diisi.`;
          }
        }
      }

      // Custom validation logic if present
      if (field.validation && val !== undefined && val !== null && String(val).trim() !== '') {
        const customErr = field.validation(val);
        if (customErr) {
          errors[field.key] = customErr;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSubmit(formValues);
  };

  const getColSpanClass = (colSpan?: string) => {
    switch (colSpan) {
      case 'half': return 'col-span-1 md:col-span-6';
      case '2/3': return 'col-span-1 md:col-span-8';
      case '1/3': return 'col-span-1 md:col-span-4';
      case '1/4': return 'col-span-1 md:col-span-3';
      case '3/4': return 'col-span-1 md:col-span-9';
      case 'full':
      default:
        return 'col-span-1 md:col-span-12';
    }
  };

  const totalValidationErrors = Object.keys(validationErrors).length;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 text-left font-sans">
      {(errorMessage || totalValidationErrors > 0) && (
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-fade-in shrink-0">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Terjadi kesalahan pengisian form:</span>
            <span className="font-medium text-[11px] text-rose-700 block mt-0.5">
              {errorMessage || `Terdapat ${totalValidationErrors} kolom wajib yang belum diisi dengan benar. Mohon periksa kembali isian Anda (termasuk opsi jawaban & skor di bawah jika ada).`}
            </span>
          </div>
        </div>
      )}

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-3.5">
          {fields.map((field) => {
            const hasError = !!validationErrors[field.key];
            const spanClass = getColSpanClass(field.colSpan);
            
            return (
              <div key={field.key} className={`${spanClass} space-y-1.5`}>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={!!formValues[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      disabled={field.disabled}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs font-semibold text-slate-600">{field.label}</span>
                  </label>
                ) : field.type === 'multi-checkbox' || field.type === 'multi-select' ? (
                  <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {field.options?.map((opt, idx) => {
                        const rawVal = formValues[field.key];
                        const currentVals: string[] = Array.isArray(rawVal)
                          ? rawVal.map(String)
                          : typeof rawVal === 'string' && rawVal.trim() !== ''
                          ? rawVal.split(',').map((s: string) => s.trim())
                          : [];

                        const optValStr = String(opt.value);
                        const isChecked = currentVals.includes(optValStr);

                        return (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition-colors select-none text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let updated: string[];
                                if (e.target.checked) {
                                  if (optValStr === 'all') {
                                    updated = ['all', ...(field.options?.filter(o => String(o.value) !== 'all').map(o => String(o.value)) || [])];
                                  } else {
                                    updated = [...currentVals.filter((v: string) => v !== 'all'), optValStr];
                                  }
                                } else {
                                  updated = currentVals.filter((v: string) => v !== optValStr && v !== 'all');
                                }
                                handleFieldChange(field.key, updated);
                              }}
                              disabled={field.disabled}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 cursor-pointer disabled:opacity-50"
                            />
                            <span>{opt.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : field.type === 'datalist-text' ? (
                  <>
                    <input
                      type="text"
                      list={`datalist-${field.key}`}
                      value={formValues[field.key] !== undefined ? formValues[field.key] : ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      disabled={field.disabled}
                      placeholder={field.placeholder}
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:bg-slate-50 ${
                        hasError ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-slate-200 text-slate-700'
                      }`}
                    />
                    <datalist id={`datalist-${field.key}`}>
                      {field.options?.map((opt, idx) => (
                        <option key={idx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </datalist>
                  </>
                ) : field.type === 'select' ? (
                  <select
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    disabled={field.disabled}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer disabled:opacity-50 disabled:bg-slate-50 ${
                      hasError ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="" disabled>Pilih {field.label}...</option>
                    {field.options?.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    disabled={field.disabled}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:bg-slate-50 ${
                      hasError ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-slate-200 text-slate-700'
                    }`}
                  />
                ) : field.type === 'image' ? (
                  <ImageFieldUpload
                    value={formValues[field.key] || ''}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    disabled={field.disabled}
                    label={field.label}
                    options={field.imageOptions}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formValues[field.key] !== undefined ? formValues[field.key] : ''}
                    onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                    disabled={field.disabled}
                    placeholder={field.placeholder}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50 disabled:bg-slate-50 ${
                      hasError ? 'border-rose-400 focus:ring-rose-500 text-rose-900' : 'border-slate-200 text-slate-700'
                    }`}
                  />
                )}

                {hasError && (
                  <p className="text-[10px] text-rose-600 font-bold font-sans">
                    {validationErrors[field.key]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer bg-slate-900 hover:bg-slate-800 transition-all"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
