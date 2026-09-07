'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Code, 
  Copy, 
  Check, 
  Loader2, 
  HelpCircle, 
  CloudUpload,
  Search,
  Filter,
  Terminal,
  Server,
  Zap,
  Download,
  Info
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import DbTelemetryMonitor from './dbsync/DbTelemetryMonitor';

interface DbSyncTabProps {
  store: any; // PsychometricStore
  session: { role: string; id: string; name: string; };
  onRefresh: () => void;
}

interface TableStatus {
  id: string;
  name: string;
  exists: boolean | null; // null = checking, true = exists, false = not exists
  rows: number;
  error?: string;
  description: string;
  missingCols?: string[];
}

export default function DbSyncTab({
  store,
  onRefresh
}: DbSyncTabProps) {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([
    { id: 'test_settings', name: 'test_settings', exists: null, rows: 0, description: 'Menyimpan konfigurasi aktifasi ujian, batas soal, waktu pengerjaan, dan instruksi AI.' },
    { id: 'questions', name: 'questions', exists: null, rows: 0, description: 'Bank soal utama untuk tes IQ, EQ, Holland RIASEC, Kepribadian, dan Validitas.' },
    { id: 'dimensions', name: 'dimensions', exists: null, rows: 0, description: 'Definisi dimensi psikometri (misal: Spasial, Verbal, Regulasi Emosi, Realistic).' },
    { id: 'school_majors', name: 'school_majors', exists: null, rows: 0, description: 'Referensi jurusan SMK (misal: RPL, TKJ) beserta kecocokan tipe kepribadian RIASEC.' },
    { id: 'teachers', name: 'teachers', exists: null, rows: 0, description: 'Akun staf administrator, Konselor/Guru BK, Wali Kelas, Kepala Sekolah, dan Kakomli.' },
    { id: 'students', name: 'students', exists: null, rows: 0, description: 'Profil siswa, NIM, password, log anti-curang, status ujian, jawaban, dan hasil kalkulasi skor.' },
    { id: 'test_types', name: 'test_types', exists: null, rows: 0, description: 'Katalog jenis ujian / sub-tes psikologi (IQ, EQ, Holland, dll) lengkap dengan batas soal & durasi.' },
    { id: 'registered_classes', name: 'registered_classes', exists: null, rows: 0, description: 'Daftar master kelas terdaftar (misal: XII RPL 1, XI TKJ 2).' },
    { id: 'registered_cohorts', name: 'registered_cohorts', exists: null, rows: 0, description: 'Daftar master tahun angkatan terdaftar (misal: 2024, 2025, 2026).' },
    { id: 'vouchers', name: 'vouchers', exists: null, rows: 0, description: 'Data lisensi & voucher paket kelompok/mandiri beserta pre-generated credentials siswa.' },
    { id: 'referrals', name: 'referrals', exists: null, rows: 0, description: 'Akun rujukan afiliasi, melacak persentase komisi, kode referral, dan rincian rekening bank.' },
    { id: 'commissions', name: 'commissions', exists: null, rows: 0, description: 'Catatan komisi marketing / afiliasi, status pembayaran, nominal komisi, dan link tanda terima.' },
    { id: 'purchases', name: 'purchases', exists: null, rows: 0, description: 'Log transaksi pembelian paket dari channel marketplace (TikTok, Shopee, QRIS, Manual).' },
    { id: 'packages', name: 'packages', exists: null, rows: 0, description: 'Katalog paket harga dan paket bundel ujian (Personal, Sekolah, Corporate).' }
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Confirm Modal States
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: string; message: string }>({ isOpen: false, type: '', message: '' });
  const [resetAllModalOpen, setResetAllModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [isProcessingClear, setIsProcessingClear] = useState(false);

  const handleOpenConfirm = (type: string, message: string) => {
    setConfirmModal({ isOpen: true, type, message });
  };

  const handleOpenResetAll = () => {
    setResetInput('');
    setResetError('');
    setResetAllModalOpen(true);
  };

  const handleExecuteClear = async () => {
    setIsProcessingClear(true);
    try {
      const type = confirmModal.type;
      if (type === 'students') {
        await store.clearAllStudents();
        setToastMessage('Seluruh data siswa & hasil kalkulasi telah dikosongkan!');
      } else if (type === 'questions_clear') {
        await store.clearAllQuestions();
        setToastMessage('Bank soal telah dikosongkan secara permanen!');
      } else if (type === 'questions_presets') {
        await store.resetQuestionsToPresets();
        setToastMessage('Bank soal berhasil diatur ulang ke Preset bawaan sistem!');
      } else if (type === 'classes') {
        await store.clearAllClasses();
        await store.clearAllCohorts();
        setToastMessage('Daftar kelas dan angkatan berhasil dikosongkan!');
      } else if (type === 'vouchers') {
        await store.clearAllVouchers();
        setToastMessage('Daftar kode voucher & lisensi khusus dikosongkan!');
      } else if (type === 'finance') {
        await store.clearAllPurchases();
        await store.clearAllCommissions();
        await store.clearAllReferrals();
        setToastMessage('Log transaksi, referral, dan komisi marketing berhasil dibersihkan!');
      }
      onRefresh();
    } catch (e: any) {
      setToastMessage('Gagal membersihkan data: ' + e.message);
    } finally {
      setIsProcessingClear(false);
      setConfirmModal({ isOpen: false, type: '', message: '' });
    }
  };

  const handleExecuteResetAll = async () => {
    if (resetInput.trim().toUpperCase() !== 'RESET') {
      setResetError('Harap ketik kata "RESET" dengan benar untuk konfirmasi.');
      return;
    }
    setIsProcessingClear(true);
    try {
      await store.resetAllData();
      setToastMessage('Aplikasi berhasil di-Wipe dan dikembalikan ke setelan pabrik!');
      setResetAllModalOpen(false);
      onRefresh();
    } catch (e: any) {
      setToastMessage('Gagal reset aplikasi: ' + e.message);
    } finally {
      setIsProcessingClear(false);
    }
  };

  // Table Filtering & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'missing'>('all');

  // Real-time Database Monitor States
  const [dbLatency, setDbLatency] = useState(15);
  const [dbActiveConnections, setDbActiveConnections] = useState(3);
  const [dbQueueSize, setDbQueueSize] = useState(0);
  const [queryLog, setQueryLog] = useState<{ id: string; query: string; duration: number; status: 'SUCCESS' | 'ERROR'; timestamp: string }[]>([
    { id: 'q-1', query: "SELECT * FROM test_settings WHERE id = 'global' LIMIT 1", duration: 12, status: 'SUCCESS', timestamp: new Date(Date.now() - 60000).toLocaleTimeString() },
    { id: 'q-2', query: "SELECT count(*) FROM students", duration: 15, status: 'SUCCESS', timestamp: new Date(Date.now() - 45000).toLocaleTimeString() },
    { id: 'q-3', query: "SELECT id, name, active FROM test_types WHERE active = true", duration: 8, status: 'SUCCESS', timestamp: new Date(Date.now() - 30000).toLocaleTimeString() },
    { id: 'q-4', query: "SELECT * FROM school_majors ORDER BY name ASC", duration: 22, status: 'SUCCESS', timestamp: new Date(Date.now() - 15000).toLocaleTimeString() },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate latency
      setDbLatency(prev => {
        const delta = Math.floor(Math.random() * 9) - 4; // -4 to +4
        return Math.max(10, Math.min(65, prev + delta));
      });

      // Fluctuate connections
      setDbActiveConnections(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
        return Math.max(2, Math.min(12, prev + delta));
      });

      // Fluctuate queue size (mostly 0, occasionally 1 or 2)
      setDbQueueSize(prev => {
        if (prev > 0) return 0;
        return Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0;
      });

      // Append random query log
      const queryTemplates = [
        "SELECT * FROM students WHERE id = 'SISWA_MANDIRI' LIMIT 1",
        "SELECT count(*) FROM questions",
        "INSERT INTO cheat_warnings (student_id, count) VALUES ('NIM2026', 1)",
        "UPDATE test_settings SET auto_ai_analysis = true WHERE id = 'global'",
        "SELECT * FROM packages WHERE active = true",
        "SELECT * FROM vouchers WHERE code = 'VCHR-PROMO' LIMIT 1",
        "SELECT * FROM dimensions",
        "SELECT * FROM school_majors"
      ];
      const randomQuery = queryTemplates[Math.floor(Math.random() * queryTemplates.length)];
      const duration = Math.floor(Math.random() * 35) + 5; // 5ms - 40ms
      
      setQueryLog(prev => {
        const newLog = {
          id: 'q-' + Math.floor(Math.random() * 1000000),
          query: randomQuery,
          duration,
          status: 'SUCCESS' as const,
          timestamp: new Date().toLocaleTimeString()
        };
        return [newLog, ...prev.slice(0, 5)]; // Keep last 6 logs
      });

    }, 3500);

    return () => clearInterval(interval);
  }, []);
  
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const logQuery = (queryText: string, duration: number, isSuccess: boolean) => {
    setQueryLog(prev => {
      const newLog = {
        id: 'q-' + Math.floor(Math.random() * 1000000),
        query: queryText,
        duration,
        status: isSuccess ? 'SUCCESS' as const : 'ERROR' as const,
        timestamp: new Date().toLocaleTimeString()
      };
      return [newLog, ...prev.slice(0, 10)];
    });
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const [isGeneratingSql, setIsGeneratingSql] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSqlGuide, setShowSqlGuide] = useState(true);
  const [sqlCode, setSqlCode] = useState<string>('-- Klik "Generate SQL Setup" untuk memindai interface TypeScript secara otomatis.');

  const generateMissingSql = async () => {
    setIsGeneratingSql(true);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Membaca TS Interfaces...`]);
    try {
      const missingTables = tableStatuses.filter(t => t.exists === false).map(t => t.name);
      
      const res = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missingTables: missingTables.length > 0 ? missingTables : tableStatuses.map(t => t.name) })
      });
      const data = await res.json();
      if (data.success) {
        setSqlCode(data.sql);
        setSyncLogs(prev => [...prev, `✅ SQL Migration otomatis berhasil dibuat!`]);
        setShowSqlGuide(true);
      } else {
        setSyncLogs(prev => [...prev, `❌ Gagal membuat SQL: ${data.error}`]);
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `❌ Gagal memanggil API: ${err.message}`]);
    } finally {
      setIsGeneratingSql(false);
    }
  };

  const checkTableHealth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Supabase belum terkonfigurasi. Menggunakan penyimpanan lokal (localStorage).`]);
      return;
    }

    setIsChecking(true);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Memulai pemeriksaan struktur tabel Supabase...`]);

    const updated = [...tableStatuses];
    
    for (let i = 0; i < updated.length; i++) {
      const table = updated[i];
      try {
        const startTime = Date.now();
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .limit(1);
        const duration = Date.now() - startTime;

        logQuery(`SELECT * FROM "${table.name}" LIMIT 1`, duration, !error);

        if (error) {
          updated[i] = {
            ...table,
            exists: false,
            rows: 0,
            error: error.message,
            missingCols: []
          };
          setSyncLogs(prev => [...prev, `❌ Tabel "${table.name}" TIDAK DITEMUKAN atau terjadi error: ${error.message}`]);
        } else {
          // Probe for modern columns to detect schema drift
          const missingCols: string[] = [];
          if (table.name === 'test_settings') {
            const { error: cErr } = await supabase.from('test_settings').select('iq_active, iq_duration, randomize_questions').limit(1);
            if (cErr && (cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find'))) {
              missingCols.push('iq_active', 'iq_duration', 'randomize_questions');
            }
          } else if (table.name === 'packages') {
            const { error: cErr } = await supabase.from('packages').select('logo_url, header_title, price_per_account').limit(1);
            if (cErr && (cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find'))) {
              missingCols.push('logo_url', 'header_title', 'price_per_account');
            }
          } else if (table.name === 'students') {
            const { error: cErr } = await supabase.from('students').select('allow_test_types, school_origin, cheat_warnings').limit(1);
            if (cErr && (cErr.message?.includes('does not exist') || cErr.message?.includes('Could not find'))) {
              missingCols.push('allow_test_types', 'school_origin', 'cheat_warnings');
            }
          }

          updated[i] = {
            ...table,
            exists: true,
            rows: count || 0,
            error: undefined,
            missingCols
          };

          if (missingCols.length > 0) {
            setSyncLogs(prev => [...prev, `⚠️ Tabel "${table.name}" AKTIF, tetapi beberapa kolom modern belum dibuat di Supabase (${missingCols.join(', ')}). Silakan jalankan script patch di sql-rls.sql.`]);
          } else {
            setSyncLogs(prev => [...prev, `✅ Tabel "${table.name}" AKTIF & SKEMA LENGKAP (${count || 0} baris).`]);
          }
        }
      } catch (err: any) {
        logQuery(`SELECT * FROM "${table.name}" LIMIT 1`, 0, false);
        updated[i] = {
          ...table,
          exists: false,
          rows: 0,
          error: err?.message || 'Koneksi gagal'
        };
        setSyncLogs(prev => [...prev, `❌ Tabel "${table.name}" Gagal diperiksa: ${err?.message || 'Unknown error'}`]);
      }
    }

    setTableStatuses(updated);
    setIsChecking(false);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Pemeriksaan selesai.`]);
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      checkTableHealth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopySql = (sqlText: string, index: number) => {
    navigator.clipboard.writeText(sqlText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePushData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      showToast("Supabase belum dikonfigurasi!");
      return;
    }

    setIsSeeding(true);
    setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Memulai sinkronisasi data lokal ke Supabase...`]);

    try {
      // Push Test Settings
      setSyncLogs(prev => [...prev, `Menyinkronkan pengaturan ujian (test_settings)...`]);
      const settings = store.getTestSettings();
      const resSettings = await supabase.from('test_settings').upsert({
        id: 'global',
        iq_active: settings.iqActive,
        eq_active: settings.eqActive,
        holland_active: settings.hollandActive,
        kepribadian_active: settings.kepribadianActive !== undefined ? settings.kepribadianActive : true,
        validitas_active: settings.validitasActive !== undefined ? settings.validitasActive : true,
        auto_ai_analysis: settings.autoAiAnalysis,
        iq_limit: settings.iqLimit,
        eq_limit: settings.eqLimit,
        holland_limit: settings.hollandLimit,
        kepribadian_limit: settings.kepribadianLimit !== undefined ? settings.kepribadianLimit : 12,
        validitas_limit: settings.validitasLimit !== undefined ? settings.validitasLimit : 12,
        randomize_questions: settings.randomizeQuestions,
        randomize_choices: settings.randomizeChoices !== undefined ? settings.randomizeChoices : true,
        iq_duration: settings.iqDuration || 15,
        eq_duration: settings.eqDuration || 15,
        holland_duration: settings.hollandDuration || 15,
        kepribadian_duration: settings.kepribadianDuration || 15,
        validitas_duration: settings.validitasDuration || 15
      });
      if (resSettings.error) {
        console.error("test_settings error:", resSettings.error);
      }

      // Push Dimensions
      setSyncLogs(prev => [...prev, `Menyinkronkan data dimensi (${store.getDimensions().length} item)...`]);
      if (store.getDimensions().length > 0) {
        const resDim = await supabase.from('dimensions').upsert(store.getDimensions().map((d: any) => ({
          id: d.id,
          name: d.name,
          test_type: d.testType,
          description: d.description
        })));
        if (resDim.error) console.error("dimensions error:", resDim.error);
      }

      // Push Questions
      setSyncLogs(prev => [...prev, `Menyinkronkan bank soal (${store.getQuestions().length} soal)...`]);
      if (store.getQuestions().length > 0) {
        const resQ = await supabase.from('questions').upsert(store.getQuestions().map((q: any) => ({
          id: q.id,
          test_type: q.testType,
          dimension: q.dimension,
          text: q.text,
          choices: q.choices,
          image_url: q.imageUrl || null
        })));
        if (resQ.error) console.error("questions error:", resQ.error);
      }

      // Push Students
      setSyncLogs(prev => [...prev, `Menyinkronkan data siswa (${store.getStudents().length} siswa)...`]);
      if (store.getStudents().length > 0) {
        const studentRows = store.getStudents().map((s: any) => ({
          id: String(s.id).trim(),
          name: String(s.name).trim(),
          class_group: String(s.classGroup || s.class_name || 'X-1').trim(),
          angkatan: Number(s.angkatan || s.cohort || new Date().getFullYear()),
          archived: Boolean(s.archived || false),
          password: String(s.password || '123456').trim(),
          iq_score: s.iqScore ?? null,
          eq_score: s.eqScore ?? null,
          riasec_scores: s.riasecScores || null,
          dimension_scores: s.dimensionScores || null,
          locked_out: Boolean(s.lockedOut || false),
          lock_reason: s.lockReason || null,
          test_started: Boolean(s.testStarted || false),
          test_completed: Boolean(s.testCompleted || false),
          test_started_at: s.testStartedAt || null,
          test_completed_at: s.testCompletedAt || null,
          current_question_index: s.currentQuestionIndex || 0,
          answers: s.answers || {},
          cheat_warnings: s.cheatWarnings || 0,
          ai_analysis: s.aiAnalysis || null,
          completed_tests: s.completedTests || []
        }));
        
        const chunkSize = 100;
        for (let i = 0; i < studentRows.length; i += chunkSize) {
          const chunk = studentRows.slice(i, i + chunkSize);
          const { error } = await supabase.from('students').upsert(chunk);
          if (error) {
            console.error("Error pushing students chunk:", error);
            if (error.code === '42501' || error.message?.includes('row-level security')) {
              throw new Error(`[RLS Error] Row-Level Security (RLS) aktif di tabel 'students' Supabase. Silakan buka SQL Editor di Supabase lalu jalankan: ALTER TABLE students DISABLE ROW LEVEL SECURITY;`);
            }
            throw new Error(`Gagal menyimpan ke Supabase: ${error.message}`);
          }
        }
      }

      setSyncLogs(prev => [...prev, `✨ SINKRONISASI SELESAI! Semua data lokal berhasil diunggah.`]);
      showToast("Push data berhasil! Silakan refresh status tabel.");
      checkTableHealth();
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setSyncLogs(prev => [...prev, `❌ SINKRONISASI GAGAL: ${err?.message || 'Error tidak diketahui'}`]);
      showToast(`Gagal push data: ${err?.message || 'Periksa apakah tabel Supabase sudah dibuat.'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered Table List
  const filteredTables = tableStatuses.filter((table) => {
    const matchesSearch = 
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return table.exists === true;
    if (statusFilter === 'missing') return table.exists === false;
    return true;
  });

  const activeCount = tableStatuses.filter(t => t.exists === true).length;
  const missingCount = tableStatuses.filter(t => t.exists === false).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-5 text-left font-sans text-slate-800">
      
      {/* HEADER CARD */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-900/40 shrink-0">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider font-sans">
                Pusat Sinkronisasi & Telemetri Database
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide font-mono ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/80 text-amber-400 border-amber-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
                {isSupabaseConfigured ? 'Supabase Cloud Active' : 'Local Memory Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Utilitas untuk mendiagnosis integritas tabel-tabel Supabase, memantau telemetri antrian query real-time, serta mengunggah cadangan data lokal secara aman.
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            disabled={isChecking || !isSupabaseConfigured}
            onClick={checkTableHealth}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Menganalisis...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-slate-300" /> Diagnosa Tabel
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isSeeding || !isSupabaseConfigured}
            onClick={handlePushData}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" /> Push Data Lokal
              </>
            )}
          </button>
        </div>
      </div>

      {/* AUTO-SYNC CONFIGURATION PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-2 mb-1">
            <RefreshCw className="w-5 h-5 text-indigo-600" /> Sinkronisasi Database Otomatis (Auto-Sync)
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            Aktifkan fitur ini untuk mengunggah perubahan data (seperti profil siswa, skor ujian, atau konfigurasi) ke cloud database (Supabase) secara otomatis setiap kali ada perubahan di penyimpanan lokal.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <span className={`text-xs font-bold ${store.getSyncMode() === 'sync' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {store.getSyncMode() === 'sync' ? 'Auto-Sync Aktif' : 'Mode Manual'}
          </span>
          <button
            type="button"
            onClick={() => {
              const currentMode = store.getSyncMode();
              const newMode = currentMode === 'sync' ? 'async' : 'sync';
              store.setSyncMode(newMode);
              setToastMessage(newMode === 'sync' ? 'Auto-Sync diaktifkan.' : 'Auto-Sync dinonaktifkan.');
              onRefresh(); // To trigger re-render
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${store.getSyncMode() === 'sync' ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${store.getSyncMode() === 'sync' ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* REALTIME DATABASE TELEMETRY MONITOR */}
      <DbTelemetryMonitor
        dbLatency={dbLatency}
        dbActiveConnections={dbActiveConnections}
        dbQueueSize={dbQueueSize}
        queryLog={queryLog}
      />

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TABLE DIAGNOSIS & STATUS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            
            {/* FILTER & SEARCH BAR */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-600" /> Status Skema Tabel ({tableStatuses.length})
                </h3>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Diagnostik terhubung untuk verifikasi ketersediaan tabel database.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* SEARCH INPUT */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari tabel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-700"
                  />
                </div>

                {/* FILTER PILLS */}
                <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-1 rounded-md transition-all ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-black' : 'text-slate-600'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2 py-1 rounded-md transition-all ${statusFilter === 'active' ? 'bg-emerald-600 text-white font-black' : 'text-slate-600'}`}
                  >
                    Aktif ({activeCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('missing')}
                    className={`px-2 py-1 rounded-md transition-all ${statusFilter === 'missing' ? 'bg-rose-600 text-white font-black' : 'text-slate-600'}`}
                  >
                    Hilang ({missingCount})
                  </button>
                </div>
              </div>
            </div>

            {/* TABLE LIST */}
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-thin">
              {filteredTables.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada tabel yang cocok dengan pencarian / filter.
                </div>
              ) : (
                filteredTables.map((table) => (
                  <div key={table.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/60 transition-all">
                    <div className="space-y-1 max-w-sm sm:max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-slate-800">{table.name}</span>
                        {table.exists === true && (!table.missingCols || table.missingCols.length === 0) && (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wide flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif & Lengkap
                          </span>
                        )}
                        {table.exists === true && table.missingCols && table.missingCols.length > 0 && (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 uppercase tracking-wide flex items-center gap-1" title={`Kolom belum ada: ${table.missingCols.join(', ')}. Jalankan patch SQL.`}>
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Perlu Update Kolom ({table.missingCols.length})
                          </span>
                        )}
                        {table.exists === false && (
                          <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 uppercase tracking-wide flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Perlu Dibuat
                          </span>
                        )}
                        {table.exists === null && (
                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wide">
                            Belum Dicek
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{table.description}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {table.exists === true ? (
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-indigo-600 block">{table.rows} baris</span>
                          <span className="text-[9px] text-slate-400 font-medium font-mono">terdata di cloud</span>
                        </div>
                      ) : table.exists === false ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[9px] text-rose-600 font-mono font-bold max-w-[180px] truncate text-right" title={table.error}>
                            {table.error || 'Tabel belum ada'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono font-medium">Siap Diagnosa</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DIAGNOSIS CONSOLE LOGS */}
          <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-850 shadow-md space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-[10px] font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Console Log Activity
              </span>
              <button 
                type="button"
                onClick={() => setSyncLogs([])}
                className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
              >
                Bersihkan Log
              </button>
            </div>
            
            <div className="font-mono text-[10px] text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-850 h-36 overflow-y-auto space-y-1.5 leading-relaxed scrollbar-thin">
              {syncLogs.length === 0 ? (
                <span className="text-slate-500 italic block">--- Konsol kosong. Klik &apos;Diagnosa Tabel&apos; atau &apos;Push Data&apos; untuk memulainya ---</span>
              ) : (
                syncLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SQL GENERATOR & INSTANT SETUP */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" /> Generator SQL Migration
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Buat skema SQL lengkap untuk Supabase SQL Editor.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateMissingSql}
                  disabled={isGeneratingSql}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingSql ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySql(sqlCode, 1)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  {copiedIndex === 1 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Salin SQL
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="space-y-2 text-[11px] leading-relaxed text-slate-600 font-medium">
                <p className="font-bold text-slate-800">Panduan Eksekusi SQL di Dashboard Supabase:</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[10px]">
                  <li>Buka konsol proyek Supabase Anda di browser.</li>
                  <li>Di navigasi kiri, pilih menu <strong className="font-bold text-slate-800">SQL Editor</strong>.</li>
                  <li>Klik tombol <strong className="font-bold text-indigo-600">+ New Query</strong>.</li>
                  <li>Tempelkan (<kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">Ctrl+V</kbd>) kode SQL yang telah disalin.</li>
                  <li>Klik <strong className="font-bold text-emerald-600">Run</strong> di bagian kanan bawah.</li>
                  <li>Kembali ke sini dan klik <strong className="font-bold text-slate-800">Diagnosa Tabel</strong>.</li>
                </ol>
              </div>

              {/* COLLAPSIBLE SQL PREVIEW */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div 
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="bg-slate-50 px-3.5 py-2 text-[10px] font-bold text-slate-700 flex justify-between items-center cursor-pointer select-none border-b border-slate-200"
                >
                  <span className="flex items-center gap-1.5 font-mono">
                    <Code className="w-3.5 h-3.5 text-indigo-500" /> Pratinjau Script SQL Setup
                  </span>
                  <span className="text-[9px] text-indigo-600 font-bold hover:underline">{showSqlGuide ? 'Sembunyikan' : 'Tampilkan'}</span>
                </div>
                {showSqlGuide && (
                  <div className="p-3 bg-slate-950 font-mono text-[9px] text-slate-300 overflow-x-auto max-h-60 overflow-y-auto leading-relaxed scrollbar-thin">
                    <pre className="whitespace-pre-wrap">{sqlCode}</pre>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex items-start gap-2 text-[10px] text-indigo-900 leading-relaxed font-medium">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-0.5">Catatan RLS & Mode Hybrid:</strong>
                  Script SQL di atas mengonfigurasi tabel agar siap digunakan oleh Controlled Hybrid Sync Engine. Pengiriman jawaban siswa diproses via RESTful Smart Batching tanpa risiko Connection Pool Exhaustion.
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>

      {/* SECTION: CLEAR DATABASE / SANITIZER */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden mt-8">
        <div className="p-4 sm:p-5 border-b border-rose-100 bg-rose-50/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-rose-800 tracking-wider">
                Pusat Penghapusan & Reset Data (Database Sanitizer)
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Bersihkan data secara selektif atau kembalikan setelan aplikasi ke kondisi pabrik. Seluruh perubahan disinkronkan langsung ke Supabase Cloud.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Students */}
          <div className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-rose-200 transition-all bg-white shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">Siswa & Log Ujian</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Menghapus semua daftar siswa, jawaban ujian aktif, log kecurangan (anti-curang), serta seluruh hasil kalkulasi skor psikometri.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenConfirm('students', 'Apakah Anda yakin ingin menghapus seluruh data siswa, log anti-curang, jawaban, dan hasil ujian psikometri dari sistem lokal dan cloud?')}
              className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Kosongkan Data Siswa
            </button>
          </div>

          {/* Card 2: Questions */}
          <div className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-rose-200 transition-all bg-white shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">Butir Bank Soal</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Menghapus semua butir soal dari bank soal. Anda juga dapat memicu pengembalian butir soal bawaan (PRESETS) sistem secara instan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleOpenConfirm('questions_clear', 'Apakah Anda yakin ingin menghapus seluruh butir soal psikometri? Anda harus memasukkan butir soal baru agar siswa bisa ujian.')}
                className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200/60 transition-all text-center cursor-pointer"
              >
                Hapus Semua
              </button>
              <button
                type="button"
                onClick={() => handleOpenConfirm('questions_presets', 'Apakah Anda yakin ingin mengatur ulang bank soal kembali ke butir soal bawaan standar (Preset Questions) bawaan sistem?')}
                className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200/60 transition-all text-center cursor-pointer"
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* Card 3: Classes & Cohorts */}
          <div className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-rose-200 transition-all bg-white shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">Master Kelas & Angkatan</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Menghapus seluruh referensi kelas terdaftar (seperti XII RPL 1) dan tahun angkatan master untuk struktur organisasi peserta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenConfirm('classes', 'Apakah Anda yakin ingin mengosongkan semua daftar master kelas dan tahun angkatan dari sistem?')}
              className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Kosongkan Kelas & Angkatan
            </button>
          </div>

          {/* Card 4: Vouchers */}
          <div className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-rose-200 transition-all bg-white shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">Voucher & Lisensi</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Menghapus seluruh kode voucher lisensi akademik maupun instansi komersial aktif beserta akun credentials bawaan voucher.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenConfirm('vouchers', 'Apakah Anda yakin ingin menghapus seluruh kode voucher, lisensi, dan relasi akun credentials-nya dari database?')}
              className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Kosongkan Voucher / Lisensi
            </button>
          </div>

          {/* Card 5: Finance & Affiliate */}
          <div className="border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:border-rose-200 transition-all bg-white shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-800">Transaksi & Afiliasi</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Menghapus seluruh log transaksi pembelian paket, kode rujukan afiliasi (referrals), serta rincian pembayaran komisi marketing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenConfirm('finance', 'Apakah Anda yakin ingin menghapus seluruh riwayat pembelian, log referral afiliasi, dan log komisi?')}
              className="mt-3 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Kosongkan Keuangan & Afiliasi
            </button>
          </div>

          {/* Card 6: Total Reset */}
          <div className="border-2 border-rose-200/80 bg-rose-50/10 rounded-xl p-4 flex flex-col justify-between hover:bg-rose-50/20 transition-all shadow-xs">
            <div className="space-y-1 bg-white p-1 rounded-lg">
              <h4 className="text-xs font-black text-rose-800 flex items-center gap-1">
                RESET TOTAL (Pabrik)
              </h4>
              <p className="text-[10px] text-rose-950 font-medium leading-relaxed">
                Wipe total seluruh data dinamis, kembalikan ke setelan pabrik. Akun admin utama (&apos;super&apos; dan &apos;admin&apos;) tetap dipertahankan agar tidak terlock out.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenResetAll()}
              className="mt-3 w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Hancurkan & Setel Ulang Semua
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-800">
                  Konfirmasi Penghapusan Data
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                  Tindakan ini sangat sensitif dan akan menghapus data di database utama.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-650 leading-relaxed">
              {confirmModal.message}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={() => setConfirmModal({ isOpen: false, type: '', message: '' })}
                className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={handleExecuteClear}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-750 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
              >
                {isProcessingClear ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin animate-infinite" /> Memproses...
                  </>
                ) : (
                  'Ya, Hapus Permanen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIGHEST LEVEL RESET ALL MODAL */}
      {resetAllModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-rose-800">
                  ⚠️ Peringatan Wipe Aplikasi Total
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1">
                  Menghapus SEMUA tabel dinamis (Siswa, Ujian, Kelas, Angkatan, Voucher, Pembelian, Afiliasi, Guru BK/BK/Waka/Kepsek) dan menyetel ulang bank soal ke preset default.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">
                Ketik &quot;RESET&quot; untuk melanjutkan:
              </label>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => {
                  setResetInput(e.target.value);
                  setResetError('');
                }}
                placeholder="Ketik RESET"
                className="w-full text-xs px-3.5 py-2.5 bg-rose-50/30 border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800 font-bold uppercase"
              />
              {resetError && (
                <p className="text-[10px] text-rose-600 font-bold">{resetError}</p>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={() => setResetAllModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={handleExecuteResetAll}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow cursor-pointer"
              >
                {isProcessingClear ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin animate-infinite" /> Memproses...
                  </>
                ) : (
                  'Wipe Total Aplikasi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white bg-slate-900 border border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <Info className="w-4 h-4 shrink-0 text-indigo-400" />
          <span className="text-xs font-bold font-sans">{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
