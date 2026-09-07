'use client';

import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Eye, 
  Sparkles, 
  HelpCircle, 
  PlusCircle, 
  FileText,
  Search,
  Check,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { Question, Dimension } from '../../../lib/core/types';
import { QuestionImportAnalysisResult } from '../../../lib/services/questionImportParserService';
import { normalizeCanonicalDimension, CANONICAL_DIMENSIONS } from '../../../lib/metadata/canonicalDimensions';

interface QuestionImportReviewModalProps {
  isOpen: boolean;
  analysisResult: QuestionImportAnalysisResult;
  masterDimensions?: Dimension[];
  existingDimensions?: Dimension[];
  existingQuestionsCount?: number;
  onConfirm: (payload: {
    finalQuestions: Question[];
    autoCreateDimensions: Array<{ name: string; testType: 'IQ' | 'EQ' | 'Holland'; description?: string }>;
    runAiClassification: boolean;
    overwriteExisting?: boolean;
    importMode?: 'append' | 'replace';
  }) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function QuestionImportReviewModal({
  isOpen,
  analysisResult,
  masterDimensions,
  existingDimensions,
  existingQuestionsCount = 0,
  onConfirm,
  onCancel,
  onClose
}: QuestionImportReviewModalProps) {
  const handleClose = onCancel || onClose || (() => {});
  const effectiveDimensions = useMemo(() => {
    return masterDimensions || existingDimensions || [];
  }, [masterDimensions, existingDimensions]);

  const [activeTab, setActiveTab] = useState<'mapping' | 'preview' | 'simulation'>('mapping');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'valid' | 'warning' | 'error'>('ALL');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [autoCreateNewDims, setAutoCreateNewDims] = useState(true);
  const [runAiClassification, setRunAiClassification] = useState(true);
  const [protectExistingCollisions, setProtectExistingCollisions] = useState(true);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatsExpandedOnMobile, setIsStatsExpandedOnMobile] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const itemsPerPage = 25;

  // Editable mappings state: sourceDimension -> targetDimension
  const [dimensionMappings, setDimensionMappings] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (analysisResult?.dimensionMappings) {
      analysisResult.dimensionMappings.forEach(d => {
        map[d.sourceDimension] = d.targetDimension;
      });
    }
    return map;
  });

  // Editable testType mappings state: sourceDimension -> testType
  const [testTypeMappings, setTestTypeMappings] = useState<Record<string, 'IQ' | 'EQ' | 'Holland'>>(() => {
    const map: Record<string, 'IQ' | 'EQ' | 'Holland'> = {};
    if (analysisResult?.dimensionMappings) {
      analysisResult.dimensionMappings.forEach(d => {
        map[d.sourceDimension] = d.testType;
      });
    }
    return map;
  });

  const existingDimensionNames = useMemo(() => {
    return effectiveDimensions.map(d => d.name);
  }, [effectiveDimensions]);

  // Compute final mapped items
  const mappedItems = useMemo(() => {
    return (analysisResult?.items || []).map(item => {
      const targetDim = dimensionMappings[item.detectedDimension] || item.detectedDimension;
      const targetType = testTypeMappings[item.detectedDimension] || item.detectedTestType;
      
      const updatedQuestion: Question = {
        ...item.question,
        dimension: targetDim,
        testType: targetType
      };

      return {
        ...item,
        mappedDimension: targetDim,
        question: updatedQuestion
      };
    });
  }, [analysisResult?.items, dimensionMappings, testTypeMappings]);

  // Filter items for preview tab
  const filteredPreviewItems = useMemo(() => {
    return mappedItems.filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const textMatch = (item.question.text || '').toLowerCase().includes(term);
        const dimMatch = (item.mappedDimension || '').toLowerCase().includes(term);
        const idMatch = (item.rawId || '').toLowerCase().includes(term);
        if (!textMatch && !dimMatch && !idMatch) return false;
      }
      return true;
    });
  }, [mappedItems, statusFilter, searchTerm]);

  // Paginated Preview Items to ensure 60fps fast rendering on mobile
  const paginatedPreviewItems = useMemo(() => {
    const start = (previewPage - 1) * itemsPerPage;
    return filteredPreviewItems.slice(start, start + itemsPerPage);
  }, [filteredPreviewItems, previewPage]);

  const totalPreviewPages = Math.ceil(filteredPreviewItems.length / itemsPerPage) || 1;

  // Compute new dimensions to be auto-created
  const dimensionsToAutoCreate = useMemo(() => {
    if (!autoCreateNewDims) return [];
    
    const set = new Map<string, 'IQ' | 'EQ' | 'Holland'>();
    Object.entries(dimensionMappings).forEach(([source, target]) => {
      const existsInMaster = existingDimensionNames.some(
        name => name.trim().toLowerCase() === target.trim().toLowerCase()
      );
      if (!existsInMaster) {
        set.set(target, testTypeMappings[source] || 'Holland');
      }
    });

    return Array.from(set.entries()).map(([name, testType]) => ({
      name,
      testType,
      description: `Dimensi psikometri dibuat otomatis via impor soal.`
    }));
  }, [dimensionMappings, testTypeMappings, existingDimensionNames, autoCreateNewDims]);

  const validAndWarningQuestions = useMemo(() => {
    return mappedItems
      .filter(item => item.status !== 'error')
      .map(item => item.question);
  }, [mappedItems]);

  const handleDimensionChange = (source: string, target: string) => {
    setDimensionMappings(prev => ({ ...prev, [source]: target }));
  };

  const handleTestTypeChange = (source: string, type: 'IQ' | 'EQ' | 'Holland') => {
    setTestTypeMappings(prev => ({ ...prev, [source]: type }));
  };

  const handleAutoMapToCanonical = () => {
    const newMappings: Record<string, string> = {};
    const newTypes: Record<string, 'IQ' | 'EQ' | 'Holland'> = {};

    analysisResult.dimensionMappings.forEach(dim => {
      const canonical = normalizeCanonicalDimension(dim.sourceDimension, dim.testType);
      newMappings[dim.sourceDimension] = canonical;
      
      const upper = canonical.toUpperCase();
      if (['REALISTIC', 'INVESTIGATIVE', 'ARTISTIC', 'SOCIAL', 'ENTERPRISING', 'CONVENTIONAL'].some(h => upper.includes(h))) {
        newTypes[dim.sourceDimension] = 'Holland';
      } else if (['LOGIKA', 'NUMERIK', 'SPASIAL', 'VERBAL', 'PENALARAN'].some(iq => upper.includes(iq))) {
        newTypes[dim.sourceDimension] = 'IQ';
      } else {
        newTypes[dim.sourceDimension] = 'EQ';
      }
    });

    setDimensionMappings(newMappings);
    setTestTypeMappings(newTypes);
  };

  const handleCommit = async () => {
    if (isSubmitting || validAndWarningQuestions.length === 0) return;
    try {
      setIsSubmitting(true);
      await Promise.resolve(
        onConfirm({
          finalQuestions: validAndWarningQuestions,
          autoCreateDimensions: dimensionsToAutoCreate,
          runAiClassification,
          overwriteExisting: importMode === 'replace',
          importMode
        })
      );
    } catch (e) {
      console.error('Commit failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPreviewQuestion = mappedItems[selectedPreviewIndex]?.question || mappedItems[0]?.question;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header - Fixed Top */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-150 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                  Konfirmasi Impor Soal
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 uppercase tracking-wider">
                  Auto-Mapper
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate sm:whitespace-normal">
                Verifikasi pemetaan dimensi, jenis tes, dan opsi soal sebelum disimpan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-all cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Compact Mobile Stats Strip & Desktop Summary Grid */}
        <div className="bg-slate-50 border-b border-slate-150 shrink-0 px-3 py-2 sm:p-3">
          {/* Mobile Summary Row (Clickable to Expand) */}
          <div className="sm:hidden flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {analysisResult.validCount} Siap
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Total: {analysisResult.totalRows} Baris
              </span>
              {dimensionsToAutoCreate.length > 0 && (
                <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md text-[11px]">
                  +{dimensionsToAutoCreate.length} Dimensi
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsStatsExpandedOnMobile(!isStatsExpandedOnMobile)}
              className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50"
            >
              {isStatsExpandedOnMobile ? 'Sembunyikan' : 'Detail'}
              {isStatsExpandedOnMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Full Grid on Desktop OR Expanded on Mobile */}
          <div className={`${isStatsExpandedOnMobile ? 'grid' : 'hidden'} sm:grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 sm:pt-0 text-xs`}>
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Baris</span>
              <span className="text-base sm:text-lg font-black text-slate-800">{analysisResult.totalRows}</span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
              <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Siap Impor
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-700">{analysisResult.validCount}</span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-teal-100 shadow-2xs">
              <span className="text-[9px] font-extrabold text-teal-600 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> ID Otomatis
              </span>
              <span className="text-base sm:text-lg font-black text-teal-700">{analysisResult.autoIdCount || 0}</span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-2xs">
              <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Peringatan
              </span>
              <span className="text-base sm:text-lg font-black text-amber-700">{analysisResult.warningCount}</span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-2xs">
              <span className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Ditolak
              </span>
              <span className="text-base sm:text-lg font-black text-rose-700">{analysisResult.errorCount}</span>
            </div>

            <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-2xs">
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                <PlusCircle className="w-3 h-3" /> Dimensi Baru
              </span>
              <span className="text-base sm:text-lg font-black text-indigo-700">{dimensionsToAutoCreate.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Fixed Sub-Header */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 pt-2 border-b border-slate-150 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`pb-2.5 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mapping'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Pemetaan Dimensi ({analysisResult.dimensionMappings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            2. Pratinjau Butir Soal ({mappedItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`pb-2.5 px-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulation'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            3. Simulasi Siswa
          </button>
        </div>

        {/* Scrollable Tab Body Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-4">
          
          {/* TAB 1: DIMENSION & CATEGORY MAPPING */}
          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-150 rounded-2xl text-xs text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Penyesuaian Dimensi Otomatis (18 Dimensi Resmi)</p>
                    <p className="text-[11px] text-indigo-800 font-medium">
                      Setiap dimensi yang terdeteksi diselaraskan otomatis ke standar 18 dimensi resmi psikologi agar tidak ada duplikasi atau tumpang tindih.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoMapToCanonical}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1-Klik Petakan ke 18 Dimensi</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                      <th className="py-2.5 px-3">Dimensi dari File</th>
                      <th className="py-2.5 px-3">Jenis Tes</th>
                      <th className="py-2.5 px-3">Jumlah Soal</th>
                      <th className="py-2.5 px-3">Status Master</th>
                      <th className="py-2.5 px-3">Target Dimensi di Sistem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {analysisResult.dimensionMappings.map((dim, idx) => {
                      const currentTarget = dimensionMappings[dim.sourceDimension] || dim.sourceDimension;
                      const currentType = testTypeMappings[dim.sourceDimension] || dim.testType;
                      const existsInMaster = existingDimensionNames.some(
                        n => n.trim().toLowerCase() === currentTarget.trim().toLowerCase()
                      );

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {dim.sourceDimension}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={currentType}
                              onChange={(e) => handleTestTypeChange(dim.sourceDimension, e.target.value as any)}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="Holland">Holland (RIASEC)</option>
                              <option value="IQ">IQ (Kognitif)</option>
                              <option value="EQ">EQ (Emosi)</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {dim.itemCount} Soal
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {existsInMaster ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Terdaftar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <PlusCircle className="w-3 h-3" /> Dimensi Baru
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={currentTarget}
                              onChange={(e) => handleDimensionChange(dim.sourceDimension, e.target.value)}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full max-w-xs"
                            >
                              <optgroup label="Dimensi dari File">
                                <option value={dim.sourceDimension}>{dim.sourceDimension} (Gunakan Nama Ini)</option>
                              </optgroup>
                              {existingDimensionNames.length > 0 && (
                                <optgroup label="Arahkan ke Master Dimensi yang Ada">
                                  {existingDimensionNames.map(dName => (
                                    <option key={dName} value={dName}>{dName}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PREVIEW & AUDIT */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPreviewPage(1);
                    }}
                    placeholder="Cari butir soal, ID, atau dimensi..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                  {(['ALL', 'valid', 'warning', 'error'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st);
                        setPreviewPage(1);
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua' : st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider z-10">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">ID Soal</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Jenis Tes</th>
                      <th className="py-2 px-3">Dimensi Target</th>
                      <th className="py-2 px-3">Pernyataan Soal</th>
                      <th className="py-2 px-3">Opsi</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paginatedPreviewItems.map((item, idx) => (
                      <tr 
                        key={idx} 
                        className={`hover:bg-slate-50/60 transition-colors ${
                          selectedPreviewIndex === item.rawIndex ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                          {item.rawIndex + 1}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-[11px] text-slate-800">{item.question.id}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.isAutoId && (
                              <span className="text-[9px] font-extrabold text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
                                Auto ID
                              </span>
                            )}
                            {item.isCollision && (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                Bentrok
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {item.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {item.status === 'warning' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={item.warnings.join(' | ')}>
                              <AlertTriangle className="w-3 h-3" /> Warning
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={item.errors.join(' | ')}>
                              <XCircle className="w-3 h-3" /> Ditolak
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                            {item.question.testType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-indigo-700 whitespace-nowrap">
                          {item.mappedDimension}
                        </td>
                        <td className="py-2 px-3 max-w-xs truncate" title={item.question.text}>
                          {item.question.text}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {item.question.choices.length} opsi
                        </td>
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreviewIndex(item.rawIndex);
                              setActiveTab('simulation');
                            }}
                            className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          >
                            Simulasi ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls for Preview */}
              {totalPreviewPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
                  <span>
                    Menampilkan {(previewPage - 1) * itemsPerPage + 1} - {Math.min(previewPage * itemsPerPage, filteredPreviewItems.length)} dari {filteredPreviewItems.length} soal
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={previewPage <= 1}
                      onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>
                    <span className="px-2 font-bold text-slate-700">{previewPage} / {totalPreviewPages}</span>
                    <button
                      type="button"
                      disabled={previewPage >= totalPreviewPages}
                      onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDENT EXAM VIEW SIMULATION */}
          {activeTab === 'simulation' && currentPreviewQuestion && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">
                    Simulasi Pratinjau Tampilan Ujian Siswa
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Representasi visual butir soal di antarmuka peserta tes.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={selectedPreviewIndex <= 0}
                    onClick={() => setSelectedPreviewIndex(prev => Math.max(0, prev - 1))}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-1">
                    {selectedPreviewIndex + 1} / {mappedItems.length}
                  </span>
                  <button
                    type="button"
                    disabled={selectedPreviewIndex >= mappedItems.length - 1}
                    onClick={() => setSelectedPreviewIndex(prev => Math.min(mappedItems.length - 1, prev + 1))}
                    className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>

              {/* Simulated Exam Card */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 max-w-2xl mx-auto shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-700">
                      #{selectedPreviewIndex + 1} ({currentPreviewQuestion.id})
                    </span>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      {currentPreviewQuestion.testType}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Dimensi: <strong className="text-slate-800">{currentPreviewQuestion.dimension}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    {currentPreviewQuestion.text}
                  </p>

                  {currentPreviewQuestion.imageUrl && (
                    <div className="p-2 bg-white rounded-2xl border border-slate-200 overflow-hidden max-w-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={currentPreviewQuestion.imageUrl} 
                        alt="Soal" 
                        className="w-full h-auto max-h-48 object-contain rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/* Choices List */}
                <div className="space-y-2 pt-1">
                  {currentPreviewQuestion.choices.map((choice, cIdx) => {
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    const isKeyAnswer = currentPreviewQuestion.testType === 'IQ' && choice.scoreValue > 0 && currentPreviewQuestion.choices.some(c => (c.scoreValue || 0) === 0);
                    return (
                      <div 
                        key={choice.id || cIdx}
                        className={`flex items-center justify-between p-3 bg-white border rounded-xl sm:rounded-2xl transition-all text-xs ${
                          isKeyAnswer ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                            isKeyAnswer ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {letters[cIdx] || `${cIdx + 1}`}
                          </span>
                          <span className="font-semibold text-slate-800 break-words">{choice.text}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isKeyAnswer && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-extrabold text-[9px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Kunci
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold text-[10px]">
                            Skor: {choice.scoreValue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Mode Impor & Rekonsiliasi Visual Transparan (Opsi 2 Architecture) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Mode Penanganan Bank Soal:
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Tentukan bagaimana sistem memproses {validAndWarningQuestions.length} butir soal impor terhadap {existingQuestionsCount} soal di database.
                </p>
              </div>

              {/* Rekonsiliasi Visual Pill */}
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-950 shrink-0 self-start sm:self-auto">
                <span className="text-slate-600 font-medium">{existingQuestionsCount} Eksisting</span>
                <span className="text-indigo-400 font-bold">+</span>
                <span className="text-emerald-700 font-bold">{validAndWarningQuestions.length} Baru</span>
                <span className="text-indigo-400 font-bold">=</span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-extrabold text-[11px] tracking-wide">
                  {importMode === 'append' ? (existingQuestionsCount + validAndWarningQuestions.length) : Math.max(existingQuestionsCount, validAndWarningQuestions.length)} Butir Total
                </span>
              </div>
            </div>

            {/* Mode Radios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  importMode === 'append'
                    ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/10'
                    : 'bg-white/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
                />
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Mode Tambah (Append)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Direkomendasikan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Tambahkan seluruh soal baru ke bank soal tanpa menimpa data lama ({existingQuestionsCount} + {validAndWarningQuestions.length} = {existingQuestionsCount + validAndWarningQuestions.length} butir). ID &amp; nomor berlanjut otomatis.
                  </p>
                </div>
              </label>

              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  importMode === 'replace'
                    ? 'bg-white border-amber-600 shadow-xs ring-2 ring-amber-500/10'
                    : 'bg-white/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer shrink-0"
                />
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-slate-800">
                    Mode Timpa / Perbarui (Replace)
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Perbarui data soal lama jika menemukan ID yang sama persis di database.
                  </p>
                </div>
              </label>
            </div>

            {/* Opsi Tambahan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700 pt-1.5 border-t border-slate-200/60">
              <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200">
                <input
                  type="checkbox"
                  checked={autoCreateNewDims}
                  onChange={(e) => setAutoCreateNewDims(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-tight">Buat otomatis dimensi baru di master ({dimensionsToAutoCreate.length})</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200">
                <input
                  type="checkbox"
                  checked={runAiClassification}
                  onChange={(e) => setRunAiClassification(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 cursor-pointer shrink-0"
                />
                <span className="text-[11px] leading-tight">Klasifikasi psikometri AI otomatis</span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls - Clean & Minimalist Sticky Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleCommit}
            disabled={isSubmitting || validAndWarningQuestions.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan Soal...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Konfirmasi &amp; Simpan {validAndWarningQuestions.length} Soal</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

