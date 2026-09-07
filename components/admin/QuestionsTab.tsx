'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Sparkles, 
  Loader2, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  SlidersHorizontal,
  ChevronRight,
  Info,
  Zap,
  CheckCircle2,
  BrainCircuit,
  UploadCloud,
  Sliders,
  Filter,
  Layers
} from 'lucide-react';
import { Question } from '@/lib/core/types';
import { PsychometricStore } from '@/lib/store/psychometricStore';
import { resolveEffectiveTestType, matchesTestTypeFilter } from '@/lib/core/utils';
import MetadataCoreEngine from './shared/MetadataCoreEngine';
import { QuestionRepository } from '@/lib/repositories';
import {
  getQuestionsColumns,
  getQuestionsFormFields,
  getQuestionsFilters,
  questionsSearchFn,
  TenantContextType
} from '@/lib/metadata';
import { analyzeAndMapQuestionRows, QuestionImportAnalysisResult } from '@/lib/services/questionImportParserService';
import QuestionImportReviewModal from './questions/QuestionImportReviewModal';
import { ItemScorerModal } from './questions/ItemScorerModal';
import ExpertVerificationModal from './questions/ExpertVerificationModal';

interface QuestionsTabProps {
  store: PsychometricStore;
  questions: Question[];
  onRefresh: () => void;
  session: any;
  refreshTrigger?: number;
  showNotification?: (message: string, type?: 'success' | 'error' | 'info') => void;
  activeContextId?: TenantContextType;
  presetTestType?: string;
}

interface AIRecommendation {
  questionId: string;
  text: string;
  suggestedContexts: string[];
  explanation: string;
}

const INSTANSI_OPTIONS = [
  { key: 'sekolah_sd', label: 'Sekolah Dasar (SD)', color: 'border-red-250 bg-red-50 text-red-700' },
  { key: 'sekolah_smp', label: 'Sekolah Menengah Pertama (SMP)', color: 'border-blue-250 bg-blue-50 text-blue-700' },
  { key: 'sekolah_sma', label: 'Sekolah Menengah Atas (SMA)', color: 'border-indigo-250 bg-indigo-50 text-indigo-700' },
  { key: 'sekolah_smk', label: 'Sekolah Menengah Kejuruan (SMK)', color: 'border-emerald-250 bg-emerald-50 text-emerald-700' },
  { key: 'personal', label: 'Personal (B2C)', color: 'border-amber-250 bg-amber-50 text-amber-700' },
  { key: 'instansi_pemerintah', label: 'Instansi Pemerintah', color: 'border-cyan-250 bg-cyan-50 text-cyan-700' },
  { key: 'perusahaan', label: 'Perusahaan (Korporat)', color: 'border-rose-250 bg-rose-50 text-rose-700' }
];

export default function QuestionsTab({
  store,
  questions,
  onRefresh,
  session,
  refreshTrigger,
  showNotification,
  activeContextId,
  presetTestType
}: QuestionsTabProps) {
  const repository = useMemo(() => new QuestionRepository(store), [store]);
  const canEdit = Boolean(
    session?.role === 'Superadmin' ||
    session?.role === 'superadmin' ||
    session?.role === 'Admin' ||
    session?.role === 'admin'
  );

  // AI Validation Panel States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [editedMappings, setEditedMappings] = useState<Record<string, string[]>>({});
  const [analysisMessage, setAnalysisMessage] = useState('');

  // Interactive Import & Auto-Mapping Review States
  const [importReviewState, setImportReviewState] = useState<{
    isOpen: boolean;
    analysis: QuestionImportAnalysisResult | null;
  }>({
    isOpen: false,
    analysis: null
  });

  // Dedicated Item-Level Scorer Modal State
  const [selectedQuestionForScorer, setSelectedQuestionForScorer] = useState<Question | null>(null);

  // Dedicated Expert Validation (Psychologist / BK) Modal State
  const [selectedQuestionForVerification, setSelectedQuestionForVerification] = useState<Question | null>(null);
  
  // Interactive Instansi / Context Preview Filter (All, Global, SMK, SMA, SMP, etc.)
  const [previewContextFilter, setPreviewContextFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');

  const [tableResetKey, setTableResetKey] = useState(0);

  const dimensions = useMemo(() => {
    return store.getDimensions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const questionMatchesContext = (q: Question, filterId: string): boolean => {
    if (!filterId || filterId === 'all') return true;
    const rawContexts = (q.applicableContexts || []).map(c => String(c).trim().toLowerCase());
    const edu = (q.educationLevel || q.aiClassification?.suggestedLevel || '').toUpperCase();
    const pkg = (q.packageId || '').toUpperCase();
    
    const isExplicitGlobal = rawContexts.includes('global') || rawContexts.includes('all') || edu === 'GLOBAL' || edu === 'ALL';
    
    if (filterId === 'global') return isExplicitGlobal;
    if (filterId === 'sekolah_sd') return rawContexts.includes('sekolah_sd') || edu === 'SD';
    if (filterId === 'sekolah_smp') return rawContexts.includes('sekolah_smp') || edu === 'SMP';
    if (filterId === 'sekolah_sma') return rawContexts.includes('sekolah_sma') || edu === 'SMA';
    if (filterId === 'sekolah_smk') return rawContexts.includes('sekolah_smk') || edu === 'SMK' || pkg.includes('VOKASI');
    if (filterId === 'perguruan_tinggi' || filterId === 'kampus') return rawContexts.includes('perguruan_tinggi') || rawContexts.includes('kampus') || edu === 'PERGURUAN_TINGGI' || edu === 'KAMPUS';
    if (filterId === 'perusahaan') return rawContexts.includes('perusahaan') || edu === 'PROFESIONAL' || edu === 'KORPORAT';

    return rawContexts.includes(filterId.toLowerCase());
  };

  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (presetTestType) {
      list = list.filter(q => matchesTestTypeFilter(q, presetTestType, dimensions));
    }

    // Parallel Package & Archive Filter
    if (packageFilter && packageFilter !== 'all') {
      if (packageFilter === 'archived') {
        list = list.filter(q => Boolean(q.archived));
      } else {
        list = list.filter(q => {
          if (q.archived) return false;
          const pkg = q.packageId || (String(q.id).startsWith('Q-B1') ? 'PKG-VOKASI-A' : String(q.id).startsWith('Q-B2') ? 'PKG-VOKASI-B' : undefined);
          return pkg?.toUpperCase() === packageFilter.toUpperCase();
        });
      }
    }

    // Interactive Admin Preview Filter
    if (previewContextFilter && previewContextFilter !== 'all') {
      list = list.filter(q => questionMatchesContext(q, previewContextFilter));
    }

    // Context filter for non-superadmin tenants: Superadmin sees everything by default
    if (!activeContextId || activeContextId === 'superadmin' || session?.role === 'Superadmin' || session?.role === 'superadmin') {
      return list;
    }

    return list.filter(q => {
      const qContexts = q.applicableContexts || [];
      if (qContexts.length > 0) {
        return qContexts.includes(activeContextId);
      }
      return true; // global questions are visible in all contexts
    });
  }, [questions, activeContextId, presetTestType, dimensions, previewContextFilter, packageFilter, session]);

  const testTypes = useMemo(() => {
    return store.getTestTypes().map(t => t.name);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const vouchers = useMemo(() => {
    return store.getVouchers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const columns = useMemo(() => getQuestionsColumns(), []);
  
  const fields = useMemo(() => {
    const baseFields = getQuestionsFormFields(dimensions, testTypes, vouchers);
    if (presetTestType) {
      return baseFields.map(field => {
        if (field.key === 'testType') {
          return {
            ...field,
            defaultValue: presetTestType,
            type: 'hidden'
          };
        }
        return field;
      });
    }
    return baseFields;
  }, [dimensions, testTypes, vouchers, presetTestType]);

  const filters = useMemo(() => {
    const baseFilters = getQuestionsFilters(dimensions, testTypes, vouchers);
    if (presetTestType) {
      // Remove test type filter if we are preset to a specific one
      return baseFilters.filter(f => f.key !== 'testTypeFilter');
    }
    return baseFilters;
  }, [dimensions, testTypes, vouchers, presetTestType]);

  const handleAdd = (values: Record<string, any>) => {
    if (presetTestType) {
      values.testType = presetTestType;
    }
    if (values.isUnfavorable !== undefined) {
      values.isUnfavorable = values.isUnfavorable === 'true' || values.isUnfavorable === true;
    }
    return repository.add(values);
  };

  const handleUpdate = (id: string, values: Record<string, any>) => {
    const parsedId = isNaN(Number(id)) ? id : Number(id);
    if (values.isUnfavorable !== undefined) {
      values.isUnfavorable = values.isUnfavorable === 'true' || values.isUnfavorable === true;
    }
    return repository.update(parsedId, values);
  };

  const handleDelete = (id: string) => {
    const parsedId = isNaN(Number(id)) ? id : Number(id);
    repository.delete(parsedId);
  };

  const handleSaveItemScorer = (updatedQuestion: Question) => {
    store.saveQuestion(updatedQuestion);
    onRefresh();
    showNotification?.(`Rubrik penilaian soal "${updatedQuestion.id}" berhasil diperbarui.`, 'success');
  };

  const handleSaveVerification = (updatedQuestion: Question) => {
    store.saveQuestion(updatedQuestion);
    onRefresh();
    showNotification?.(
      `Status validasi butir "${updatedQuestion.id}" berhasil disimpan (${updatedQuestion.verificationStatus === 'VERIFIED' ? 'Terverifikasi Sah' : 'Draft / Perlu Revisi'}).`,
      'success'
    );
  };

  const handleBatchVerifyQuestions = () => {
    if (questions.length === 0) return;
    const reviewer = session?.name || 'Tim Ahli Psikometri & BK';
    const now = new Date().toISOString();
    
    const updates = questions.map(q => ({
      id: q.id,
      updates: {
        verificationStatus: 'VERIFIED' as const,
        verifiedBy: q.verifiedBy || reviewer,
        verifiedAt: q.verifiedAt || now,
        verificationNotes: q.verificationNotes || 'Tervalidasi sah sesuai kisi-kisi dan konstruk psikometri.',
        aiClassification: q.aiClassification ? {
          ...q.aiClassification,
          reviewStatus: 'VERIFIED' as const
        } : undefined
      }
    }));

    repository.updateBulk(updates);
    onRefresh();
    showNotification?.(`Berhasil memverifikasi ${questions.length} butir instrumen soal sebagai Terverifikasi Sah oleh Psikolog/BK!`, 'success');
  };

  const mapInitialValues = (q: Question): Record<string, any> => {
    const choices = q.choices || [];
    return {
      ...q,
      scoringType: q.scoringType || (q.testType === 'IQ' ? 'binary' : 'weighted'),
      isUnfavorable: q.isUnfavorable ? 'true' : 'false',
      imageUrl: q.imageUrl || '',
      opsiA: choices[0]?.text || '',
      skorA: choices[0]?.scoreValue !== undefined ? choices[0].scoreValue : '',
      opsiB: choices[1]?.text || '',
      skorB: choices[1]?.scoreValue !== undefined ? choices[1].scoreValue : '',
      opsiC: choices[2]?.text || '',
      skorC: choices[2]?.scoreValue !== undefined ? choices[2].scoreValue : '',
      opsiD: choices[3]?.text || '',
      skorD: choices[3]?.scoreValue !== undefined ? choices[3].scoreValue : '',
    };
  };

  // Run AI analysis for questions
  const handleAiValidation = async () => {
    if (questions.length === 0) {
      showNotification?.('Tidak ada pertanyaan di Bank Soal untuk divalidasi.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setIsAiModalOpen(true);
    setAnalysisMessage('Menyiapkan daftar soal psikotes...');

    try {
      // Send simplified question payload to save tokens and avoid payload bloat
      const payload = questions.map(q => ({
        id: q.id,
        text: q.text,
        testType: q.testType,
        dimension: q.dimension
      }));

      setAnalysisMessage('Menganalisis butir instrumen via Gemini AI...');
      const res = await fetch('/api/gemini/validate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: payload })
      });

      if (!res.ok) {
        throw new Error('Gagal menghubungi endpoint validator AI.');
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const rawMappings: any[] = data.mappings || [];
      
      // Populate AI recommendations
      const recs: AIRecommendation[] = questions.map(q => {
        const aiMatch = rawMappings.find((m: any) => String(m.questionId) === String(q.id));
        return {
          questionId: q.id,
          text: q.text,
          suggestedContexts: aiMatch ? aiMatch.suggestedContexts : [],
          explanation: aiMatch ? aiMatch.explanation : 'Diatur secara global.'
        };
      });

      setRecommendations(recs);

      // Initialize edited mappings with AI suggested contexts
      const initialEdited: Record<string, string[]> = {};
      recs.forEach(r => {
        initialEdited[r.questionId] = [...r.suggestedContexts];
      });
      setEditedMappings(initialEdited);

      if (data.isMocked) {
        showNotification?.(data.message || 'Selesai menggunakan asisten klasifikasi psikometri lokal.', 'info');
      } else {
        showNotification?.('Gemini AI berhasil menganalisis seluruh instrumen soal!', 'success');
      }

    } catch (error: any) {
      console.error(error);
      showNotification?.('Gagal menjalankan validasi AI: ' + error.message, 'error');
      setIsAiModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle instansi checkbox
  const handleCheckboxToggle = (qId: string, contextKey: string) => {
    setEditedMappings(prev => {
      const current = prev[qId] || [];
      const updated = current.includes(contextKey)
        ? current.filter(k => k !== contextKey)
        : [...current, contextKey];
      return { ...prev, [qId]: updated };
    });
  };

  // Preset quick selections
  const handleBulkSelect = (type: 'all_smk' | 'all_sma' | 'clear') => {
    setEditedMappings(prev => {
      const next = { ...prev };
      questions.forEach(q => {
        if (type === 'all_smk') {
          const current = next[q.id] || [];
          if (!current.includes('sekolah_smk')) {
            next[q.id] = [...current, 'sekolah_smk'];
          }
        } else if (type === 'all_sma') {
          const current = next[q.id] || [];
          if (!current.includes('sekolah_sma')) {
            next[q.id] = [...current, 'sekolah_sma'];
          }
        } else if (type === 'clear') {
          next[q.id] = [];
        }
      });
      return next;
    });
  };

  // Save reviewed mappings back to local store
  const handleSaveMappings = () => {
    let count = 0;
    try {
      const bulkItems: Array<{ id: string; updates: Partial<Question> }> = [];
      Object.keys(editedMappings).forEach(qId => {
        const contexts = editedMappings[qId] || [];
        bulkItems.push({ id: qId, updates: { applicableContexts: contexts } });
        count++;
      });

      if (bulkItems.length > 0) {
        repository.updateBulk(bulkItems);
      }

      showNotification?.(`Berhasil menerapkan pemetaan instansi untuk ${count} butir soal!`, 'success');
      setIsAiModalOpen(false);
      onRefresh();
    } catch (e: any) {
      showNotification?.('Gagal menyimpan pemetaan: ' + e.message, 'error');
    }
  };

  const handleBatchAutoClassify = () => {
    try {
      const res = store.autoClassifyAllQuestions();
      showNotification?.(`Berhasil mengklasifikasikan ${res.count} butir soal secara psikometrik otomatis!`, 'success');
      onRefresh();
    } catch (e: any) {
      showNotification?.('Gagal menjalankan klasifikasi psikometri: ' + e.message, 'error');
    }
  };

  const handleAutoHealAndStandardize = () => {
    try {
      const res = store.autoHealAndStandardizeQuestions();
      onRefresh();
      showNotification?.(
        `Sukses! ${res.totalQuestions} butir soal berhasil diaudit & dikalibrasi (Tingkat kesulitan p-value bervariasi, skoring opsi, dan 18 dimensi resmi tervalidasi).`,
        'success'
      );
    } catch (e: any) {
      showNotification?.('Gagal standarisasi & kalibrasi psikometri: ' + e.message, 'error');
    }
  };

  const handleInitiateCustomImport = (rows: any[]) => {
    try {
      const currentDims = store.getDimensions();
      const analysis = analyzeAndMapQuestionRows(rows, currentDims, questions);
      setImportReviewState({
        isOpen: true,
        analysis
      });
    } catch (e: any) {
      showNotification?.('Gagal menganalisis file impor: ' + e.message, 'error');
    }
  };

  const handleConfirmImportReview = async (payload: {
    finalQuestions: Question[];
    autoCreateDimensions: Array<{ name: string; testType: 'IQ' | 'EQ' | 'Holland'; description?: string }>;
    runAiClassification: boolean;
    overwriteExisting?: boolean;
    importMode?: 'append' | 'replace';
  }) => {
    try {
      const mode = payload.importMode || (payload.overwriteExisting ? 'replace' : 'append');
      const res = await store.importQuestionsWithAutoDimensions(
        payload.finalQuestions,
        payload.autoCreateDimensions,
        { 
          overwriteExisting: payload.overwriteExisting,
          importMode: mode
        }
      );

      if (payload.runAiClassification) {
        store.autoClassifyAllQuestions();
      }

      const totalAfterImport = store.getQuestions().length;
      showNotification?.(
        `Berhasil mengimpor ${res.successCount} butir soal! Total instrumen bank soal kini menjadi ${totalAfterImport} butir (${res.newDimensionsCreated} dimensi baru terdaftar).`,
        'success'
      );
      setImportReviewState({ isOpen: false, analysis: null });
      setTableResetKey(k => k + 1);
      onRefresh();
    } catch (e: any) {
      showNotification?.('Gagal menyimpan hasil impor: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified AI Automation & Intelligence Card */}
      {canEdit && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-900/50 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-900/60">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 bg-indigo-600/30 rounded-2xl border border-indigo-500/30 shadow-inner flex-shrink-0">
                <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black uppercase tracking-wider font-mono text-indigo-200">
                    Mesin Audit & Inteligensi Psikometri AI (Gemini Core)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    Engine V2.4 + Context AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Sistem terpadu menganalisis tingkat kesulitan (p-value), indeks kognitif, serta menguji kesesuaian konteks lisensi instansi (SD, SMP, SMA, SMK, Korporat, B2B) secara otomatis via Gemini AI.
                </p>
              </div>
            </div>

            <div className="text-left md:text-right flex-shrink-0 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-300">Total Instrumen Soal</div>
              <div className="text-lg font-black text-white">{questions.length} <span className="text-xs font-normal text-slate-400">Butir</span></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Aksi Terpadu Validasi & Kalibrasi Instrumen:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleAutoHealAndStandardize}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-indigo-900/40 transition-all cursor-pointer"
                title="1-Klik selaraskan ke 18 dimensi resmi, kalibrasi tingkat kesulitan (p-value bervariasi), dan validasi skoring"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Audit & Kalibrasi Psikometri Lengkap</span>
              </button>

              <button
                type="button"
                onClick={handleAiValidation}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs"
                title="Buka panel audit AI Gemini untuk memetakan kecocokan instansi (SMK, SMA, SMP, Korporat)"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audit Konteks Instansi (AI Gemini)</span>
              </button>

              <button
                type="button"
                onClick={handleBatchVerifyQuestions}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs"
                title="Tandai seluruh butir instrumen sebagai terverifikasi sah oleh psikolog / BK"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verifikasi Sah Seluruh Soal (BK/Psikolog)</span>
              </button>
            </div>
          </div>

          {/* Quick Context / Target Jenjang & Sektor Filter Pills */}
          <div className="pt-2 border-t border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-bold">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter Target Jenjang & Sektor:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `Semua Soal (${questions.length})` },
                { id: 'global', label: `Global / Semua (${questions.filter(q => questionMatchesContext(q, 'global')).length})` },
                { id: 'sekolah_sd', label: `SD / MI (${questions.filter(q => questionMatchesContext(q, 'sekolah_sd')).length})` },
                { id: 'sekolah_smp', label: `SMP / MTs (${questions.filter(q => questionMatchesContext(q, 'sekolah_smp')).length})` },
                { id: 'sekolah_sma', label: `SMA / MA (${questions.filter(q => questionMatchesContext(q, 'sekolah_sma')).length})` },
                { id: 'sekolah_smk', label: `SMK / Vokasi (${questions.filter(q => questionMatchesContext(q, 'sekolah_smk')).length})` },
                { id: 'perguruan_tinggi', label: `Perguruan Tinggi (${questions.filter(q => questionMatchesContext(q, 'perguruan_tinggi')).length})` },
                { id: 'perusahaan', label: `Korporat / B2B (${questions.filter(q => questionMatchesContext(q, 'perusahaan')).length})` }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setPreviewContextFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    previewContextFilter === pill.id
                      ? 'bg-indigo-500 text-white shadow-xs'
                      : 'bg-indigo-950/80 text-indigo-300 hover:bg-indigo-900/90 border border-indigo-800/40'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parallel Package & Archive Filter Pills */}
          <div className="pt-2 border-t border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-emerald-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Filter Paket Paralel & Arsip:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `Semua Paket (${questions.length})` },
                { id: 'PKG-VOKASI-A', label: `Blok 1 (A) (${questions.filter(q => !q.archived && (q.packageId === 'PKG-VOKASI-A' || String(q.id).startsWith('Q-B1'))).length})` },
                { id: 'PKG-VOKASI-B', label: `Blok 2 (B) (${questions.filter(q => !q.archived && (q.packageId === 'PKG-VOKASI-B' || String(q.id).startsWith('Q-B2'))).length})` },
                { id: 'archived', label: `Arsip Lama (${questions.filter(q => Boolean(q.archived)).length})` }
              ].map(pill => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setPackageFilter(pill.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                    packageFilter === pill.id
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900/90 border border-emerald-800/40'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Metadata Grid */}
      <MetadataCoreEngine<Question>
        resourceName="Bank Soal Psikotes"
        resourceIcon={<FileText className="w-5 h-5 text-indigo-600" />}
        description="Kelola butir instrumen soal psikotes, pemetaan dimensi Holland/RIASEC, dan tipe tes."
        data={filteredQuestions}
        columns={columns}
        fields={fields}
        filters={filters}
        idField="id"
        canEdit={canEdit}
        searchPlaceholder="Cari pernyataan soal atau dimensi..."
        searchFn={questionsSearchFn}
        defaultSortField="id"
        defaultSortOrder="asc"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={onRefresh}
        showNotification={showNotification}
        mapInitialValues={mapInitialValues}
        modalSize="xl"
        extraRowActions={(question) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedQuestionForVerification(question)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                question.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
              title="Telaah & Verifikasi Validitas Butir Soal (Psikolog / BK)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{question.verificationStatus === 'VERIFIED' ? 'Validasi: Sah' : 'Verifikasi'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedQuestionForScorer(question)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              title="Konfigurasi Rubrik & Skema Penilai Butir Soal"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Rubrik</span>
            </button>
          </div>
        )}
        onCustomImportRows={handleInitiateCustomImport}
        onImportExcel={(rows) => store.importFromDataGrid('questions', rows)}
        excelTemplateData={[
          {
            'ID': '',
            'Jenis_Tes': 'Holland',
            'Dimensi': 'Realistic',
            'Pertanyaan': 'Saya senang merakit komponen elektronik dan merawat mesin',
            'Gambar_Soal': '',
            'Opsi_A': 'Sangat Sesuai',
            'Skor_A': 2,
            'Opsi_B': 'Sesuai',
            'Skor_B': 1,
            'Opsi_C': 'Kurang Sesuai',
            'Skor_C': 0,
            'Opsi_D': 'Tidak Sesuai',
            'Skor_D': 0,
            'Opsi_E': '',
            'Skor_E': 0,
            'Kunci_Jawaban': '',
            'Lisensi_Khusus': 'global',
            'Konteks_Instansi': 'sekolah_smk,sekolah_sma',
            'Skema_Penilaian': 'weighted',
            'Item_Unfavorable': 'Tidak'
          },
          {
            'ID': '',
            'Jenis_Tes': 'IQ',
            'Dimensi': 'Verbal Reasoning',
            'Pertanyaan': 'Pilihlah analogi paling tepat: KUCING : MAMALIA = ELANG : ...',
            'Gambar_Soal': '',
            'Opsi_A': 'UNGGAS',
            'Skor_A': 1,
            'Opsi_B': 'REPTIL',
            'Skor_B': 0,
            'Opsi_C': 'AMFIBI',
            'Skor_C': 0,
            'Opsi_D': 'IKAN',
            'Skor_D': 0,
            'Opsi_E': 'SERANGGA',
            'Skor_E': 0,
            'Kunci_Jawaban': 'A',
            'Lisensi_Khusus': 'global',
            'Konteks_Instansi': 'sekolah_sd,sekolah_smp,sekolah_sma,perusahaan',
            'Skema_Penilaian': 'binary',
            'Item_Unfavorable': 'Tidak'
          },
          {
            'ID': 'Q-EQ-001',
            'Jenis_Tes': 'EQ',
            'Dimensi': 'Self Awareness',
            'Pertanyaan': 'Ketika menghadapi tekanan tenggat waktu yang sangat ketat, respon pertama saya adalah:',
            'Gambar_Soal': '',
            'Opsi_A': 'Membuat daftar prioritas dan mengeksekusi dengan tenang',
            'Skor_A': 4,
            'Opsi_B': 'Meminta saran dari anggota tim yang lebih berpengalaman',
            'Skor_B': 3,
            'Opsi_C': 'Menghentikan pekerjaan sejenak untuk menenangkan pikiran',
            'Skor_C': 2,
            'Opsi_D': 'Mengejar semua pekerjaan sekaligus secara tergesa-gesa',
            'Skor_D': 1,
            'Opsi_E': 'Menunda pekerjaan karena merasa terbebani',
            'Skor_E': 0,
            'Kunci_Jawaban': '',
            'Lisensi_Khusus': 'global',
            'Konteks_Instansi': 'perusahaan,instansi_pemerintah',
            'Skema_Penilaian': 'likert',
            'Item_Unfavorable': 'Tidak'
          }
        ]}
        excelGuideData={[
          {
            'Nama_Kolom': 'ID',
            'Ketentuan_Pengisian': 'OPSIONAL. Kosongkan kolom ini agar sistem membuatkan ID otomatis berurutan (contoh: Q-IQ-001, Q-EQ-001, Q-HOL-001). Isi hanya jika Anda memiliki kode bank soal khusus.',
            'Contoh_Nilai': 'Q-IQ-001 atau (Kosongkan)'
          },
          {
            'Nama_Kolom': 'Jenis_Tes',
            'Ketentuan_Pengisian': 'WAJIB. Jenis instrumen psikotes. Nilai yang didukung: IQ (Kognitif/Penalaran), EQ (Kecerdasan Emosional/Sikap), Holland (Minat Karir RIASEC).',
            'Contoh_Nilai': 'IQ / EQ / Holland'
          },
          {
            'Nama_Kolom': 'Dimensi',
            'Ketentuan_Pengisian': 'WAJIB. Aspek atau dimensi yang diukur. Jika dimensi belum ada di sistem, sistem akan otomatis meregistrasikannya ke master dimensi tanpa error.',
            'Contoh_Nilai': 'Verbal Reasoning (IQ), Self Awareness (EQ), Realistic (Holland)'
          },
          {
            'Nama_Kolom': 'Pertanyaan',
            'Ketentuan_Pengisian': 'WAJIB. Kalimat butir soal atau pernyataan psikotes yang akan dijawab oleh peserta tes.',
            'Contoh_Nilai': 'Saya senang merakit komponen elektronik dan merawat mesin'
          },
          {
            'Nama_Kolom': 'Gambar_Soal',
            'Ketentuan_Pengisian': 'OPSIONAL. Tautan (URL https://...) atau path gambar visual untuk soal logika/spasial.',
            'Contoh_Nilai': 'https://example.com/images/soal-iq-01.png atau (Kosongkan)'
          },
          {
            'Nama_Kolom': 'Kunci_Jawaban',
            'Ketentuan_Pengisian': 'OPSIONAL (KHUSUS TES IQ/KOGNITIF). Masukkan huruf opsi benar (A, B, C, D, atau E). Sistem otomatis memberikan Skor=1 pada pilihan yang cocok dan Skor=0 pada pilihan lainnya. KOSONGKAN untuk tes EQ dan Holland.',
            'Contoh_Nilai': 'A atau C (Khusus IQ) / Kosongkan (EQ & Holland)'
          },
          {
            'Nama_Kolom': 'Opsi_A s/d Opsi_E',
            'Ketentuan_Pengisian': 'WAJIB (Minimal A dan B, mendukung hingga E). Teks pilihan jawaban atau skala respon yang ditampilkan kepada peserta tes.',
            'Contoh_Nilai': 'Opsi_A: Sangat Sesuai, Opsi_B: Sesuai, dst.'
          },
          {
            'Nama_Kolom': 'Skor_A s/d Skor_E',
            'Ketentuan_Pengisian': 'ATURAN BOBOT SKOR DETAIL BERDASARKAN JENIS TES:\n1. TES IQ (Dikotomi Benar/Salah): Opsi benar bernilai 1 (atau lebih), opsi salah bernilai 0. Jika kolom Kunci_Jawaban diisi, kolom skor ini dapat dikosongkan karena dihitung otomatis.\n2. TES EQ (Skala Likert Bertingkat): Berikan bobot bertingkat 1 s/d 4 atau 1 s/d 5 yang mencerminkan kematangan emosi/sikap (misal: Sangat Positif = 4/5, Positif = 3, Cukup = 2, Kurang = 1).\n3. TES HOLLAND (Skala Minat Vokasi): Berikan bobot tingkat kesesuaian minat 0 s/d 3 (misal: Sangat Sesuai = 3/2, Sesuai = 2/1, Kurang = 0, Tidak Sesuai = 0).',
            'Contoh_Nilai': 'IQ: 1 & 0 | EQ: 4, 3, 2, 1 | Holland: 3, 2, 1, 0'
          },
          {
            'Nama_Kolom': 'Lisensi_Khusus',
            'Ketentuan_Pengisian': 'OPSIONAL (Default: global). Kode lisensi instansi jika soal bersifat privat/khusus untuk instansi tertentu. Isi "global" agar dapat diakses semua sekolah.',
            'Contoh_Nilai': 'global atau KODE_LISENSI_SEKOLAH'
          },
          {
            'Nama_Kolom': 'Konteks_Instansi',
            'Ketentuan_Pengisian': 'OPSIONAL (Default: semua konteks). Target instansi dipisahkan koma: sekolah_sd, sekolah_smp, sekolah_sma, sekolah_smk, perusahaan, instansi_pemerintah, personal.',
            'Contoh_Nilai': 'sekolah_smk,sekolah_sma'
          },
          {
            'Nama_Kolom': 'Skema_Penilaian',
            'Ketentuan_Pengisian': 'OPSIONAL (Default: binary untuk IQ, weighted untuk tes lainnya). Nilai: binary (Kunci Tunggal Benar/Salah), likert (Skala Bertingkat 1-4/1-5), weighted (Bobot Kustom).',
            'Contoh_Nilai': 'binary / likert / weighted'
          },
          {
            'Nama_Kolom': 'Item_Unfavorable',
            'Ketentuan_Pengisian': 'OPSIONAL (Default: Tidak). Ketik "Ya" atau "true" jika butir merupakan pernyataan negatif yang membutuhkan pembalikan skor otomatis (Reverse Scoring).',
            'Contoh_Nilai': 'Ya / Tidak'
          }
        ]}
        excelExportFileName={presetTestType ? `data_bank_soal_${presetTestType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx` : `data_bank_soal_semua_${new Date().toISOString().split('T')[0]}.xlsx`}
        excelExportMapper={(q) => {
          let detectedKey = '';
          const letters = ['A', 'B', 'C', 'D', 'E'];
          const effectiveType = resolveEffectiveTestType(q, dimensions);
          if (effectiveType === 'IQ' && q.choices && q.choices.length > 0) {
            const correctIndex = q.choices.findIndex(c => (c.scoreValue ?? 0) > 0);
            const otherZero = q.choices.every((c, i) => i === correctIndex || (c.scoreValue ?? 0) === 0);
            if (correctIndex !== -1 && otherZero && letters[correctIndex]) {
              detectedKey = letters[correctIndex];
            }
          }

          return {
            'ID': q.id,
            'Jenis_Tes': effectiveType || q.testType || '',
            'Dimensi': q.dimension || '',
            'Pertanyaan': q.text,
            'Gambar_Soal': q.imageUrl || '',
            'Kunci_Jawaban': detectedKey,
            'Opsi_A': q.choices?.[0]?.text || '',
            'Skor_A': q.choices?.[0]?.scoreValue ?? 0,
            'Opsi_B': q.choices?.[1]?.text || '',
            'Skor_B': q.choices?.[1]?.scoreValue ?? 0,
            'Opsi_C': q.choices?.[2]?.text || '',
            'Skor_C': q.choices?.[2]?.scoreValue ?? 0,
            'Opsi_D': q.choices?.[3]?.text || '',
            'Skor_D': q.choices?.[3]?.scoreValue ?? 0,
            'Opsi_E': q.choices?.[4]?.text || '',
            'Skor_E': q.choices?.[4]?.scoreValue ?? 0,
            'Lisensi_Khusus': q.licenseCode || 'global',
            'Konteks_Instansi': q.applicableContexts?.join(',') || '',
            'Skema_Penilaian': q.scoringType || (effectiveType === 'IQ' ? 'binary' : 'weighted'),
            'Item_Unfavorable': q.isUnfavorable ? 'Ya' : 'Tidak'
          };
        }}
        onClearAll={() => store.clearAllQuestions()}
        resetKey={tableResetKey}
      />

      {/* AI Validation Overlay Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600/30 p-2 rounded-xl border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider font-mono">Tinjau Validasi & Pemetaan AI</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Validasi kecocokan butir soal psikotes dengan karakteristik target instansi</p>
                </div>
              </div>
              {!isAnalyzing && (
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-indigo-500 absolute top-3.5 left-3.5 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <p className="text-xs font-bold text-slate-800">{analysisMessage}</p>
                    <p className="text-[10px] text-slate-500 font-mono tracking-wide">Proses ini memakan waktu beberapa detik...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informational Box & Bulk Actions */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5 text-left max-w-xl">
                      <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        Grup Checkbox di bawah telah dicentang otomatis oleh kecerdasan buatan. Anda dapat menyesuaikan pilihan sesuai preferensi lokal institusi, kemudian klik <strong>Simpan Pemetaan</strong> di bawah untuk menerapkan perubahan secara permanen.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleBulkSelect('all_smk')}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-100 cursor-pointer"
                      >
                        Pilih Semua SMK
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkSelect('all_sma')}
                        className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 cursor-pointer"
                      >
                        Pilih Semua SMA
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkSelect('clear')}
                        className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 cursor-pointer"
                      >
                        Hapus Semua Pilihan
                      </button>
                    </div>
                  </div>

                  {/* List of Questions with Checkbox Group */}
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => {
                      const selectedKeys = editedMappings[rec.questionId] || [];
                      
                      return (
                        <div 
                          key={`${rec.questionId}-${idx}`}
                          className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-4.5 text-left transition-all space-y-3.5 shadow-xs"
                        >
                          {/* Question Text Info */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  Soal #{idx + 1} ({rec.questionId})
                                </span>
                                <span className="text-[9px] font-extrabold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">
                                  {questions[idx]?.testType}
                                </span>
                                <span className="text-[9px] font-extrabold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded uppercase">
                                  Dimensi: {questions[idx]?.dimension}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed pt-1">
                                &ldquo;{rec.text}&rdquo;
                              </p>
                            </div>
                          </div>

                          {/* Checkbox Group options */}
                          <div className="space-y-2 pt-1.5 border-t border-dashed border-slate-100">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Kesesuaian Target Instansi:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {INSTANSI_OPTIONS.map(opt => {
                                const isChecked = selectedKeys.includes(opt.key);
                                const isAiSuggested = rec.suggestedContexts.includes(opt.key);
                                
                                return (
                                  <label 
                                    key={opt.key}
                                    className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] font-bold cursor-pointer select-none transition-all ${
                                      isChecked 
                                        ? `${opt.color} shadow-xs` 
                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleCheckboxToggle(rec.questionId, opt.key)}
                                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 mt-0.5 cursor-pointer"
                                    />
                                    <div className="space-y-0.5">
                                      <span>{opt.label}</span>
                                      {isAiSuggested && (
                                        <span className="block text-[8px] font-extrabold text-indigo-500/80 uppercase tracking-wider">✨ AI Suggested</span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* AI Explanation Badge */}
                          <div className="bg-indigo-50/40 border border-indigo-50 rounded-xl p-2.5 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[10px] text-indigo-950 font-medium italic leading-relaxed">
                              <strong>Saran Psikolog AI:</strong> {rec.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!isAnalyzing && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleSaveMappings}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-650/15 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Terapkan Pemetaan ({Object.values(editedMappings).filter(arr => arr.length > 0).length} Soal Terpetakan)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Question Import & Auto-Mapping Review Modal */}
      {importReviewState.isOpen && importReviewState.analysis && (
        <QuestionImportReviewModal
          isOpen={importReviewState.isOpen}
          analysisResult={importReviewState.analysis}
          existingDimensions={dimensions}
          existingQuestionsCount={questions.length}
          onClose={() => setImportReviewState({ isOpen: false, analysis: null })}
          onConfirm={handleConfirmImportReview}
        />
      )}

      {/* Item-Level Scoring Scheme & Rubric Modal */}
      {selectedQuestionForScorer && (
        <ItemScorerModal
          isOpen={Boolean(selectedQuestionForScorer)}
          question={selectedQuestionForScorer}
          onClose={() => setSelectedQuestionForScorer(null)}
          onSave={handleSaveItemScorer}
        />
      )}

      {/* Expert Verification (Psychologist / BK) Modal */}
      {selectedQuestionForVerification && (
        <ExpertVerificationModal
          isOpen={Boolean(selectedQuestionForVerification)}
          question={selectedQuestionForVerification}
          onClose={() => setSelectedQuestionForVerification(null)}
          onSave={handleSaveVerification}
          currentUserName={session?.name}
          currentUserRole={session?.role}
        />
      )}
    </div>
  );
}
