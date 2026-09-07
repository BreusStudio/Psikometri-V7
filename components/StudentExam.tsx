'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { 
  PsychometricStore, 
  Student, 
  Question, 
  getRotatingToken,
  PRESET_QUESTIONS
} from '@/lib/mockData';
import { getCachedAnswers, getUnsyncedAnswers } from '@/lib/indexedDB';

// Import subcomponents
import ExamTokenScreen from './student/ExamTokenScreen';
import ExamInstructionsScreen from './student/ExamInstructionsScreen';
import ExamHubScreen from './student/ExamHubScreen';
import ExamActiveTesting from './student/ExamActiveTesting';
import ExamFinishModal from './student/ExamFinishModal';
import ExamUploadProgressModal, { UploadProgressStage } from './student/ExamUploadProgressModal';
import ExamFeedbackScreens from './student/ExamFeedbackScreens';
import ExamProfileCompletionScreen from './student/ExamProfileCompletionScreen';
import { useAntiCheat } from '@/lib/hooks/useAntiCheat';
import { sampleQuestionsProportionally } from '@/lib/services/questionSampler';

interface StudentExamProps {
  store: PsychometricStore;
  studentId: string;
  onLogout: () => void;
  onRefresh: () => void;
}

class ExamErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ExamErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xl p-8 max-w-md mx-auto text-center space-y-6 text-slate-800 my-12 animate-in fade-in duration-200">
          <div className="mx-auto bg-rose-50 text-rose-600 p-4 rounded-full w-16 h-16 flex items-center justify-center animate-bounce">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider font-sans text-rose-600">
              Terjadi Kendala Teknis Ujian
            </h3>
            <p className="text-slate-650 text-xs font-sans leading-relaxed font-medium">
              Sistem mendeteksi adanya kegagalan render komponen aktif. Jangan khawatir, jawaban Anda yang sudah terisi telah tersimpan dengan aman di database.
            </p>
          </div>
          {this.state.error && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-left text-[10px] font-mono text-slate-500 overflow-x-auto max-h-32">
              Error: {this.state.error.message}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="w-full text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-xs"
          >
            Muat Ulang Halaman Ujian
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Deterministic seed-based shuffle helper to ensure consistent questions order per student session
function seedShuffle<T>(array: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const lcg = () => {
    h = Math.imul(48271, h) | 0;
    return (h & 0x7fffffff) / 0x80000000;
  };
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

export default function StudentExam({ store, studentId, onLogout, onRefresh }: StudentExamProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  // Real-time rotating token for verification
  const [tokenInfo, setTokenInfo] = useState(getRotatingToken());

  // Exam phase: 'token' | 'instructions' | 'hub' | 'testing' | 'locked' | 'completed'
  const [phase, setPhase] = useState<'token' | 'instructions' | 'hub' | 'testing' | 'locked' | 'completed'>('token');

  // Keep phaseRef.current perfectly sync'd with phase state
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Keep currentStudentRef sync'd with currentStudent state to avoid rebuilding interval every second
  const currentStudentRef = useRef(currentStudent);
  useEffect(() => {
    currentStudentRef.current = currentStudent;
  }, [currentStudent]);

  const enterFullscreen = () => {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err: any) => console.log("Fullscreen request failed:", err));
      } else if (elem.webkitRequestFullscreen) { /* Safari / iOS */
        elem.webkitRequestFullscreen().catch((err: any) => console.log("WebKit Fullscreen request failed:", err));
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen().catch((err: any) => console.log("MS Fullscreen request failed:", err));
      } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen().catch((err: any) => console.log("Moz Fullscreen request failed:", err));
      }
    } catch (e) {
      console.error("Error attempting fullscreen:", e);
    }
  };

  const exitFullscreen = () => {
    try {
      const doc = document as any;
      const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
      if (isFullscreen) {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch((err: any) => console.log("Exit fullscreen failed:", err));
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen().catch((err: any) => console.log("WebKit Exit fullscreen failed:", err));
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen().catch((err: any) => console.log("MS Exit fullscreen failed:", err));
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen().catch((err: any) => console.log("Moz Exit fullscreen failed:", err));
        }
      }
    } catch (e) {
      console.error("Error exiting fullscreen:", e);
    }
  };

  // Exam taking state
  const [activeTestType, setActiveTestType] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  // Auto AI calculation progress
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  // Cheat Warning Overlay
  const [cheatOverlay, setCheatOverlay] = useState(false);
  const [cheatMsg, setCheatMsg] = useState('');

  const cheatOverlayRef = useRef(cheatOverlay);
  useEffect(() => {
    cheatOverlayRef.current = cheatOverlay;
  }, [cheatOverlay]);

  const testingStartTimeRef = useRef<number>(0);
  const subtestStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase === 'testing') {
      testingStartTimeRef.current = Date.now();
      if (!subtestStartTimeRef.current) {
        subtestStartTimeRef.current = Date.now();
      }
    }
  }, [phase]);

  // Custom Confirmation Modal state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [unansweredCountState, setUnansweredCountState] = useState(0);

  // Upload Progress Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressStage>({
    stage: 'validating',
    percent: 0,
    message: 'Mempersiapkan penyimpanan jawaban...'
  });
  const [uploadTitle, setUploadTitle] = useState('Menyimpan Jawaban');
  const [isWholeExamProgress, setIsWholeExamProgress] = useState(false);

  // Timer State (in seconds)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initial student loading & IndexedDB cache merge
  useEffect(() => {
    let isMounted = true;
    const loadStudent = async () => {
      // If we are actively testing or in instructions, we don't want to load from store
      // as it can cause unexpected phase jumps or answer resets
      if (phaseRef.current === 'testing' || phaseRef.current === 'instructions') {
        return;
      }

      const student = store.getStudents().find(s => s.id === studentId);
      if (student) {
        // Retrieve IndexedDB local cached answers if any
        const cached = await getCachedAnswers(studentId);
        const mergedAnswers = { ...(student.answers || {}), ...cached };

        // Check for any unsynced answers in IndexedDB and sync to Supabase (DB Utama)
        const unsynced = await getUnsyncedAnswers(studentId);
        if (unsynced.length > 0) {
          unsynced.forEach(u => {
            store.submitAnswer(studentId, u.questionId, u.choiceId);
          });
        }

        if (!isMounted) return;

        setCurrentStudent({ ...student, answers: mergedAnswers });
        setSelectedChoices(mergedAnswers);
        
        setPhase(prevPhase => {
          if (student.testCompleted) return 'completed';
          if (student.lockedOut) return 'locked';
          if (student.testStarted) return 'hub';
          return 'token';
        });
      }
    };

    loadStudent();

    // Subscribe to store updates (e.g., when Supabase finishes syncing)
    const unsubscribe = store.subscribe(() => {
      loadStudent();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [studentId, store]);

  // Auto-refresh token info and verify if student got unlocked/updated in admin background
  useEffect(() => {
    const interval = setInterval(() => {
      if (phaseRef.current === 'token') {
        setTokenInfo(getRotatingToken());
      }
      
      const curr = currentStudentRef.current;
      if (curr) {
        const latest = store.getStudents().find(s => s.id === curr.id);
        if (latest) {
          const changed = 
            latest.lockedOut !== curr.lockedOut ||
            latest.cheatWarnings !== curr.cheatWarnings ||
            latest.testStarted !== curr.testStarted ||
            latest.testCompleted !== curr.testCompleted ||
            latest.currentQuestionIndex !== curr.currentQuestionIndex ||
            JSON.stringify(latest.answers) !== JSON.stringify(curr.answers) ||
            JSON.stringify(latest.completedTests) !== JSON.stringify(curr.completedTests);
            
          if (changed) {
            setCurrentStudent({ ...latest });
          }
          
          if (latest.lockedOut && phaseRef.current !== 'locked') {
            setPhase('locked');
          } else if (!latest.lockedOut && phaseRef.current === 'locked') {
            setPhase(latest.testStarted ? 'hub' : 'token');
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [store]);

  // Anti-Cheat Engine (Listen to window blur, visibility changes, pagehide, and fullscreen exit)
  useAntiCheat({
    phase,
    currentStudent,
    store,
    cheatOverlayRef,
    testingStartTimeRef,
    setCurrentStudent,
    setPhase,
    setCheatOverlay,
    setCheatMsg,
    onRefresh,
    exitFullscreen
  });

  // Token Verification
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError('');

    if (!tokenInput) {
      setTokenError('Token Keamanan wajib diisi.');
      return;
    }

    if (tokenInput.trim() !== tokenInfo.token) {
      setTokenError('Token CBT tidak valid atau sudah kedaluwarsa. Periksa token aktif di monitor ruangan.');
      return;
    }

    if (!currentStudent) return;

    if (currentStudent.testStarted) {
      setPhase('hub');
    } else {
      setPhase('instructions');
    }
  };



  // Fullscreen Management based on Phase
  useEffect(() => {
    if (phase === 'testing') {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
    return () => {
      exitFullscreen();
    };
  }, [phase]);

  const handleStartExam = () => {
    if (!currentStudent) return;
    phaseRef.current = 'hub';
    setPhase('hub');
    try {
      store.startTest(currentStudent.id);
    } catch (err) {
      console.warn("Notice: startTest execution error caught:", err);
    }
    enterFullscreen();
    onRefresh();
  };

  // Start specific active subtest
  const handleStartSubTest = (type: string) => {
    enterFullscreen();
    setActiveTestType(type);
    subtestStartTimeRef.current = Date.now();
    
    const studentVoucher = store.getVouchers().find(v => 
      v.generatedAccounts?.some(acc => acc.username.toUpperCase() === studentId.toUpperCase())
    );

    const assignedPackageId = (studentVoucher as any)?.packageCode || (studentVoucher as any)?.packageId || (currentStudent as any)?.packageId;

    // Retrieve sanitized, subtest-indexed questions via store
    let subQuestions = store.getQuestionsBySubtest(type, {
      student: currentStudent,
      voucher: studentVoucher,
      packageId: assignedPackageId
    });
    
    const settings = store.getTestSettings() || {};
    if (settings.randomizeQuestions) {
      subQuestions = seedShuffle(subQuestions, `${studentId}_${type}`);
    }

    const testTypeRecord = store.getTestTypes().find(t => 
      t.id === type || 
      t.name === type || 
      t.id.toLowerCase() === type.toLowerCase() || 
      t.name.toLowerCase() === type.toLowerCase()
    );

    let limit = subQuestions.length;
    if (testTypeRecord && typeof testTypeRecord.questionLimit === 'number' && testTypeRecord.questionLimit > 0) {
      limit = testTypeRecord.questionLimit;
    } else if (testTypeRecord && typeof testTypeRecord.totalQuestions === 'number' && testTypeRecord.totalQuestions > 0) {
      limit = testTypeRecord.totalQuestions;
    } else {
      if (type === 'IQ') {
        limit = typeof settings.iqLimit === 'number' && settings.iqLimit > 0 ? settings.iqLimit : 8;
      } else if (type === 'EQ') {
        limit = typeof settings.eqLimit === 'number' && settings.eqLimit > 0 ? settings.eqLimit : 8;
      } else if (type === 'Holland') {
        limit = typeof settings.hollandLimit === 'number' && settings.hollandLimit > 0 ? settings.hollandLimit : 12;
      } else if (type === 'Kepribadian') {
        limit = typeof settings.kepribadianLimit === 'number' && settings.kepribadianLimit > 0 ? settings.kepribadianLimit : 12;
      } else if (type === 'Validitas') {
        limit = typeof settings.validitasLimit === 'number' && settings.validitasLimit > 0 ? settings.validitasLimit : 12;
      }
    }

    if (!limit || isNaN(limit) || limit <= 0) {
      limit = subQuestions.length > 0 ? subQuestions.length : 12;
    }

    // Apply Proportional Stratified Sampling across dimensions with Atomic Validity Coupling
    subQuestions = sampleQuestionsProportionally(subQuestions, limit, {
      studentId,
      testType: type,
      masterDimensions: store.getDimensions(),
      packageId: assignedPackageId
    });

    if (settings.randomizeChoices) {
      subQuestions = subQuestions.map(q => ({
        ...q,
        choices: seedShuffle([...(q.choices || [])], `${studentId}_${q.id}`)
      }));
    }
    
    let durationMinutes = 15;
    if (testTypeRecord && typeof testTypeRecord.durationMinutes === 'number' && testTypeRecord.durationMinutes > 0) {
      durationMinutes = testTypeRecord.durationMinutes;
    } else if (testTypeRecord && typeof testTypeRecord.duration === 'number' && testTypeRecord.duration > 0) {
      durationMinutes = testTypeRecord.duration;
    } else {
      if (type === 'IQ') durationMinutes = settings.iqDuration ?? 15;
      else if (type === 'EQ') durationMinutes = settings.eqDuration ?? 15;
      else if (type === 'Holland') durationMinutes = settings.hollandDuration ?? 15;
      else if (type === 'Kepribadian') durationMinutes = settings.kepribadianDuration ?? 15;
      else if (type === 'Validitas') durationMinutes = settings.validitasDuration ?? 15;
    }
    
    if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) {
      durationMinutes = 15;
    }
    
    setTimeLeft(durationMinutes * 60);
    setQuestions(subQuestions);
    setCurrentIdx(0);
    setPhase('testing');
  };

  const handleSelectOption = (choiceId: string) => {
    if (!currentStudent || phase !== 'testing' || !activeTestType) return;
    const q = questions[currentIdx];
    
    const updatedAnswers = { ...selectedChoices, [q.id]: choiceId };
    setSelectedChoices(updatedAnswers);

    store.submitAnswer(currentStudent.id, q.id, choiceId);
    onRefresh();
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleFinishSubTest = () => {
    if (!currentStudent || !activeTestType) return;
    const answeredCount = questions.filter(q => selectedChoices[q.id]).length;
    const unansweredCount = questions.length - answeredCount;
    setUnansweredCountState(unansweredCount);
    setShowFinishModal(true);
  };

  const triggerAutoGeminiAnalysis = useCallback(async (student: Student) => {
    setLoadingAi(true);
    setPhase('completed');
    setAiError('');
    try {
      const settings = store.getTestSettings();
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          iqScore: student.iqScore || 95,
          eqScore: student.eqScore || 90,
          riasecScores: student.riasecScores || { R:0, I:0, A:0, S:0, E:0, C:0 },
          dimensionAnswers: student.dimensionScores || {},
          validityStatus: student.validationStatus || student.aiAnalysis?.validity?.status,
          confidenceScore: student.validityScore || student.aiAnalysis?.validity?.confidenceScore || student.aiAnalysis?.confidenceScore,
          validityFlags: student.validityFlags || student.aiAnalysis?.validity?.flags || [],
          examDurationSeconds: student.examDurationSeconds || student.timeSpentSeconds,
          aiPromptTemplate: settings.aiPromptTemplate,
          aiSystemInstruction: settings.aiSystemInstruction
        })
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.slice(0, 100) || response.statusText || 'Response non-JSON diterima.');
      }

      if (response.ok && data.success && data.analysis) {
        store.saveAiAnalysis(student.id, data.analysis);
        const latest = store.getStudents().find(s => s.id === student.id);
        if (latest) {
          setCurrentStudent({ ...latest });
        }
      } else {
        throw new Error(data.error || 'Auto-analisis AI tidak merespon.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError('Auto-analisis AI mengalami kendala teknis, namun jawaban Anda telah tersimpan dengan aman. Konselor BK dapat memicu analisis ulang nanti.');
    } finally {
      setLoadingAi(false);
      onRefresh();
    }
  }, [store, onRefresh]);

  const executeFinishSubTest = useCallback(async () => {
    setShowFinishModal(false);
    if (!currentStudent || !activeTestType) return;

    const elapsedSeconds = subtestStartTimeRef.current 
      ? Math.max(1, Math.round((Date.now() - subtestStartTimeRef.current) / 1000))
      : 0;

    setUploadTitle(`Menyimpan Sub-Tes ${activeTestType}`);
    setIsWholeExamProgress(false);
    setUploadModalOpen(true);

    const res = await store.submitExamWithProgress(currentStudent.id, {
      subtestType: activeTestType,
      isWholeExam: false,
      durationSeconds: elapsedSeconds,
      onProgress: (p) => setUploadProgress(p)
    });

    if (res.student) {
      setCurrentStudent({ ...res.student });
    }

    setTimeout(() => {
      setUploadModalOpen(false);
      setPhase('hub');
      setActiveTestType(null);
      subtestStartTimeRef.current = null;
      onRefresh();
    }, 600);
  }, [currentStudent, activeTestType, store, onRefresh]);

  const handleCompleteWholeExam = useCallback(async () => {
    if (!currentStudent) return;
    
    const elapsedSeconds = subtestStartTimeRef.current 
      ? Math.max(1, Math.round((Date.now() - subtestStartTimeRef.current) / 1000))
      : 0;

    setUploadTitle('Finalisasi & Pengiriman Seluruh Ujian');
    setIsWholeExamProgress(true);
    setUploadModalOpen(true);

    const res = await store.submitExamWithProgress(currentStudent.id, {
      isWholeExam: true,
      durationSeconds: elapsedSeconds,
      onProgress: (p) => setUploadProgress(p)
    });

    if (res.student) {
      setCurrentStudent({ ...res.student });
    }

    setTimeout(async () => {
      setUploadModalOpen(false);
      await triggerAutoGeminiAnalysis(res.student || currentStudent);
    }, 600);
  }, [currentStudent, store, triggerAutoGeminiAnalysis]);

  // Countdown effect
  useEffect(() => {
    if (phase !== 'testing' || timeLeft === null || showTimeUpModal) return;

    if (timeLeft <= 0) {
      const modalShowTimer = setTimeout(() => {
        setShowTimeUpModal(true);
      }, 0);
      
      const timerId = setTimeout(() => {
        setShowTimeUpModal(false);
        executeFinishSubTest();
      }, 3500);
      
      return () => {
        clearTimeout(modalShowTimer);
        clearTimeout(timerId);
      };
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, timeLeft, showTimeUpModal, executeFinishSubTest]);

  if (!currentStudent) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Memuat data ujian...</p>
      </div>
    );
  }

  const isProfileComplete = Boolean(
    currentStudent.classGroup &&
    currentStudent.major &&
    currentStudent.angkatan &&
    currentStudent.gender
  );

  if (!isProfileComplete) {
    return (
      <ExamProfileCompletionScreen
        student={currentStudent}
        store={store}
        onProfileComplete={(updatedStudent) => {
          setCurrentStudent({ ...updatedStudent });
          setPhase(updatedStudent.testCompleted ? 'completed' : 'hub');
          onRefresh();
        }}
        onLogout={onLogout}
      />
    );
  }

  const testSettings = store.getTestSettings();
  const completedList = currentStudent.completedTests || [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-slate-800 select-none" id="student-exam">
      <div className="max-w-2xl mx-auto">
      
      {phase === 'token' && currentStudent && (
        <ExamTokenScreen 
          currentStudent={currentStudent} 
          tokenInput={tokenInput} 
          setTokenInput={setTokenInput} 
          tokenError={tokenError} 
          tokenInfo={tokenInfo} 
          handleTokenSubmit={handleTokenSubmit} 
          onLogout={onLogout} 
        />
      )}

      {phase === 'instructions' && currentStudent && (
        <ExamInstructionsScreen 
          currentStudent={currentStudent} 
          onLogout={onLogout} 
          handleStartExam={handleStartExam} 
        />
      )}

      {phase === 'hub' && currentStudent && (
        <ExamHubScreen 
          currentStudent={currentStudent} 
          completedList={completedList} 
          testSettings={testSettings} 
          handleStartSubTest={handleStartSubTest} 
          onLogout={onLogout} 
          onCompleteWholeExam={handleCompleteWholeExam}
          testTypes={store.getTestTypes()}
        />
      )}

      {phase === 'testing' && currentStudent && activeTestType && (
        <ExamErrorBoundary>
          <ExamActiveTesting 
            questions={questions} 
            currentIdx={currentIdx} 
            activeTestType={activeTestType} 
            timeLeft={timeLeft} 
            currentStudent={currentStudent} 
            selectedChoices={selectedChoices} 
            handleSelectOption={handleSelectOption} 
            handlePrev={handlePrev} 
            handleNext={handleNext} 
            handleFinishSubTest={handleFinishSubTest} 
            cheatOverlay={cheatOverlay} 
            setCheatOverlay={setCheatOverlay} 
            cheatMsg={cheatMsg} 
            formatTime={formatTime} 
          />
        </ExamErrorBoundary>
      )}

      {(phase === 'locked' || phase === 'completed') && currentStudent && (
        <ExamFeedbackScreens 
          phase={phase} 
          currentStudent={currentStudent} 
          loadingAi={loadingAi} 
          aiError={aiError} 
          onLogout={onLogout} 
          testSettings={testSettings}
        />
      )}

      <ExamFinishModal 
        showFinishModal={showFinishModal} 
        setShowFinishModal={setShowFinishModal} 
        unansweredCountState={unansweredCountState} 
        executeFinishSubTest={executeFinishSubTest} 
      />

      <ExamUploadProgressModal
        isOpen={uploadModalOpen}
        progress={uploadProgress}
        title={uploadTitle}
        isWholeExam={isWholeExamProgress}
      />

      {/* Time Up Custom Overlay */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-rose-150 shadow-2xl flex flex-col text-center p-6 space-y-4">
            <div className="mx-auto bg-rose-50 text-rose-600 p-4 rounded-full w-16 h-16 flex items-center justify-center animate-bounce">
              <AlertCircle className="w-8 h-8 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider font-sans text-rose-600 mb-1">
                Waktu Telah Habis
              </h3>
              <p className="text-slate-600 text-xs font-sans leading-relaxed font-semibold">
                Durasi pengerjaan untuk sub-tes ini telah berakhir. Jawaban Anda disimpan secara otomatis dan aman ke sistem.
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Mengalihkan kembali ke beranda ujian...
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
