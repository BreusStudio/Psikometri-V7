'use client';
import { useState, useEffect, useMemo } from 'react';
import AdminDashboard from '@/components/AdminDashboard';
import StudentExam from '@/components/StudentExam';
import CertificateVerification from '@/components/CertificateVerification';
import { PsychometricStore } from '@/lib/store/PsychometricStore';
import { LandingNavbar, LandingPageView } from '@/components/landing/LandingPageView';
import { AuthModal } from '@/components/auth/AuthModal';
import { Loader2, Info } from 'lucide-react';
import { clearAllCache } from '@/lib/indexedDB';

let storeInstance: PsychometricStore | null = null;
function getStoreInstance(): PsychometricStore | null {
  if (typeof window !== 'undefined') {
    if (!storeInstance) {
      storeInstance = new PsychometricStore();
    }
    return storeInstance;
  }
  return null;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [store, setStore] = useState<PsychometricStore | null>(null);
  const [view, setView] = useState<'landing' | 'admin' | 'counselor' | 'student'>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initError, setInitError] = useState<string>('');
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalIsRegister, setAuthModalIsRegister] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<'Student' | 'Teacher'>('Student');
  const [authModalTab, setAuthModalTab] = useState<'personal' | 'instansi'>('personal');

  useEffect(() => {
    setIsMounted(true);
    
    // Safety watchdog timer: force fallback if initialization hangs on slow/restricted devices after 4 seconds
    const watchdogTimer = setTimeout(() => {
      setLoadingTimeoutReached(true);
      const inst = getStoreInstance();
      if (inst && !store) {
        setStore(inst);
      }
    }, 4000);

    // Check for certificate verification query parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vId = params.get('verify');
      if (vId) {
        setVerifyId(vId);
      }
    }

    const initAll = async () => {
      try {
        // Fast race timeout for config fetching
        const configPromise = fetch('/api/config');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500));
        
        try {
          const res: any = await Promise.race([configPromise, timeoutPromise]);
          if (res?.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const json = await res.json();
              const config = json.data || json;
              if (config.supabaseUrl && config.supabaseAnonKey) {
                const { initSupabaseClient } = await import('@/lib/supabase');
                initSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);
              }
            }
          }
        } catch {
          // Ignore network config timeout on offline/slow devices
        }
      } catch (err) {
        console.warn("Informasi: Kredensial Supabase opsional dari server tidak dimuat:", err);
      }

      try {
        const inst = getStoreInstance();
        if (inst) {
          setStore(inst);
          inst.syncWithSupabase().catch(err => console.warn("Supabase initial sync notice:", err));

          const unsubscribe = inst.subscribe(() => {
            setRefreshTrigger(prev => prev + 1);
          });
          
          try {
            inst.setupRealtime();
          } catch (e) {
            console.error("Failed to setup real-time listener:", e);
          }
          
          // Check session
          try {
            const storedUser = localStorage.getItem('currentUser');
            const storedRole = localStorage.getItem('currentRole');
            if (storedUser && storedUser !== 'undefined' && storedRole) {
              const parsedUser = JSON.parse(storedUser);
              if (storedRole === 'student') {
                const latest = inst.getStudents().find(s => s.id === parsedUser.id);
                if (latest) {
                  setCurrentUser(latest);
                  localStorage.setItem('currentUser', JSON.stringify(latest));
                } else {
                  setCurrentUser(parsedUser);
                }
              } else {
                const latest = inst.getTeachers().find(t => t.id === parsedUser.id);
                if (latest) {
                  setCurrentUser(latest);
                  localStorage.setItem('currentUser', JSON.stringify(latest));
                } else {
                  setCurrentUser(parsedUser);
                }
              }
              setView(storedRole as any);
            }
          } catch (err) {
            console.error("Failed to restore session from localStorage:", err);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentRole');
          }

          return () => {
            unsubscribe();
          };
        }
      } catch (err: any) {
        console.error("Fatal initialization error:", err);
        setInitError(err.message || 'Gagal menginisialisasi penyimpanan lokal.');
      }
    };

    initAll();

    return () => {
      clearTimeout(watchdogTimer);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
    setCurrentUser(null);
    setView('landing');
  };

  const handleClearCacheAndReset = async () => {
    try {
      localStorage.clear();
      await clearAllCache();
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear cache:", e);
      localStorage.clear();
      window.location.reload();
    }
  };

  const landingContent = useMemo(() => {
    if (!store) {
      return {
        heroHeadline: 'Platform Asesmen Psikometri & Minat Bakat Karir Digital',
        heroSubheading: 'Sistem Computer-Based Test cerdas terintegrasi untuk pemetaan kecenderungan minat karir (RIASEC), potensi kecerdasan (IQ), dinamika regulasi emosional (EQ), serta rekomendasi karir cerdas berbasis AI.',
        feature1Title: 'Potensi Kognitif',
        feature1Desc: 'Tes penalaran spasial & verbal',
        feature2Title: 'Regulasi Emosi',
        feature2Desc: 'Stabilitas emosional & stresor',
        feature3Title: 'Kecenderungan Karir',
        feature3Desc: 'Asesmen RIASEC Holland',
        feature4Title: 'Rekomendasi Cerdas',
        feature4Desc: 'Ulasan Gemini AI otomatis',
        contactEmail: 'support@psychometrics.id',
        contactPhone: '+62 812-3456-7890',
        contactAddress: 'Jl. Jenderal Sudirman No. 42, Jakarta Selatan, DKI Jakarta 12190',
        statSchools: 124,
        statStudents: 15420,
        statTests: 38450
      };
    }
    return store.getLandingPageContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, refreshTrigger]);

  const landingStats = useMemo(() => {
    return {
      schools: landingContent.statSchools,
      tests: landingContent.statTests,
      students: landingContent.statStudents,
      majors: store ? store.getSchoolMajors().length : 15
    };
  }, [store, landingContent]);

  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-white font-sans">
        <div className="bg-slate-800 rounded-2xl p-8 border border-red-500/30 max-w-md w-full shadow-2xl">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <Info className="w-8 h-8" />
            <h2 className="text-xl font-bold">Gagal Memuat Aplikasi</h2>
          </div>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">{initError}</p>
          <div className="space-y-3">
            <button
              onClick={handleClearCacheAndReset}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all shadow-lg"
            >
              Hapus Cache & Reset Aplikasi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted || !store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Memuat sistem psikometri...</p>
        {loadingTimeoutReached && (
          <div className="mt-4 flex flex-col items-center space-y-2 animate-in fade-in max-w-xs text-center">
            <p className="text-xs text-amber-400">Pemuatan memakan waktu lebih lama dari biasanya.</p>
            <button
              onClick={() => {
                const inst = getStoreInstance();
                if (inst) setStore(inst);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
            >
              Lanjutkan Masuk
            </button>
          </div>
        )}
      </div>
    );
  }

  if (verifyId) {
    return (
      <CertificateVerification 
        studentId={verifyId} 
        store={store} 
        onBackToLogin={() => {
          setVerifyId(null);
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }} 
      />
    );
  }

  if ((view === 'admin' || view === 'counselor') && currentUser) {
    return <AdminDashboard store={store} onLogout={handleLogout} onRefresh={() => setRefreshTrigger(p=>p+1)} refreshTrigger={refreshTrigger} session={currentUser} />;
  }
  if (view === 'student' && currentUser) {
    return <StudentExam store={store} studentId={currentUser.id} onLogout={handleLogout} onRefresh={() => setRefreshTrigger(p=>p+1)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans selection:bg-indigo-500/20 text-slate-800">
      <LandingNavbar 
        onOpenLogin={() => {
          setAuthModalIsRegister(false);
          setAuthModalRole('Student');
          setAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthModalIsRegister(true);
          setAuthModalTab('instansi');
          setAuthModalOpen(true);
        }}
      />

      <LandingPageView
        content={landingContent}
        stats={landingStats}
        onOpenLogin={() => {
          setAuthModalIsRegister(false);
          setAuthModalRole('Student');
          setAuthModalOpen(true);
        }}
        onOpenPersonalRegister={() => {
          setAuthModalIsRegister(true);
          setAuthModalTab('personal');
          setAuthModalOpen(true);
        }}
        onOpenInstansiRegister={() => {
          setAuthModalIsRegister(true);
          setAuthModalTab('instansi');
          setAuthModalOpen(true);
        }}
      />

      {authModalOpen && (
        <AuthModal
          store={store}
          isRegister={authModalIsRegister}
          initialRole={authModalRole}
          initialTab={authModalTab}
          onClose={() => setAuthModalOpen(false)}
          onSuccessLogin={(user, role) => {
            setCurrentUser(user);
            setView(role as any);
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('currentRole', role);
            setAuthModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
