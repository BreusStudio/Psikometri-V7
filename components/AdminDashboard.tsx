'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  Question, 
  Dimension,
  SchoolMajor,
  TestSettings,
  Teacher,
  Package
} from '../lib/types';
import { 
  Layers, 
  X, 
  Menu, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  ShieldAlert,
  LayoutDashboard
} from 'lucide-react';

// Import modular tab components
import DashboardTab from './admin/DashboardTab';
import UsersTab from './admin/UsersTab';
import WaliKelasTab from './admin/WaliKelasTab';
import KakomliTab from './admin/KakomliTab';
import LicensesTab from './admin/LicensesTab';
import PackagesTab from './admin/PackagesTab';
import ProctoringCbtTab from './admin/ProctoringCbtTab';
import PanduanRoleTab from './admin/PanduanRoleTab';
import RegistrationsTab from './admin/RegistrationsTab';
import CbtContentTab from './admin/CbtContentTab';
import ReportsHubTab from './admin/ReportsHubTab';
import StudentsHubTab from './admin/StudentsHubTab';
import SystemSettingsHubTab from './admin/SystemSettingsHubTab';

// Import layout helper components
import Sidebar from './admin/Sidebar';
import StatModal from './admin/StatModal';
import { TenantContextType } from '../lib/metadata';

interface AdminDashboardProps {
  store: any; // PsychometricStore
  onLogout: () => void;
  onRefresh: () => void;
  refreshTrigger?: number;
  session: { role: string; id: string; name: string; managed_class?: string; school_origin?: string; };
}

export default function AdminDashboard({ store, onLogout, onRefresh, refreshTrigger, session }: AdminDashboardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [majors, setMajors] = useState<SchoolMajor[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  
  const [testSettings, setTestSettings] = useState<TestSettings>({
    iqActive: true,
    eqActive: true,
    hollandActive: true,
    kepribadianActive: true,
    validitasActive: true,
    autoAiAnalysis: true,
    iqLimit: 8,
    eqLimit: 8,
    hollandLimit: 12,
    kepribadianLimit: 12,
    validitasLimit: 12,
    randomizeQuestions: true,
    randomizeChoices: true,
    iqDuration: 15,
    eqDuration: 15,
    hollandDuration: 15,
    kepribadianDuration: 15,
    validitasDuration: 15
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
  const [activeContextId, setActiveContextId] = useState<TenantContextType>('superadmin');

  const effectiveRole = simulatedRole || session.role;

  const simulatedSession = useMemo(() => {
    return {
      ...session,
      role: effectiveRole
    };
  }, [session, effectiveRole]);

  // Get allowed tabs for the current user's role
  const allowedTabs = useMemo(() => {
    const normalized = (effectiveRole || '').toLowerCase().trim();
    
    // Level 1: Superadmin (Full Access)
    if (normalized === 'superadmin') {
      return [
        'dashboard', 'cbt-proctor', 'registrations', 
        'cbt-content', 'students-hub', 'reports-hub', 
        'licenses', 'users', 'system-settings', 'panduan-role',
        // Legacy aliases for backward-compatibility:
        'reports', 'rekap-kelas', 'rekap-jurusan', 'students', 'classes-cohorts',
        'questions', 'majors', 'dimensions', 'test-types', 'packages', 'settings',
        'certificate-settings', 'db-sync', 'landing-editor', 'wali-kelas', 'kakomli'
      ];
    }
    
    // Level 2: Admin (Operation & Management, No Licensing/Sync, No Admin Management)
    if (normalized === 'admin') {
      return [
        'dashboard', 'cbt-content', 'students-hub', 'reports-hub', 'system-settings', 'panduan-role',
        'reports', 'rekap-kelas', 'rekap-jurusan', 'students', 'majors', 'dimensions', 'wali-kelas', 'kakomli', 'classes-cohorts', 'settings', 'certificate-settings', 'test-types'
      ];
    }

    // Level 3: Proktor (CBT Technical Supervision)
    if (normalized === 'proktor') {
      return ['dashboard', 'cbt-proctor', 'students-hub', 'students', 'rekap-kelas', 'panduan-role']; // Proktor focuses on ongoing exams and technical student management
    }

    // Level 4: Kakomli (Head of Department)
    if (normalized === 'kakomli') {
      return ['dashboard', 'reports-hub', 'reports', 'rekap-jurusan', 'students', 'dimensions', 'panduan-role', 'cbt-content'];
    }

    // Level 5: Wali Kelas / Guru BK
    if (normalized === 'wali-kelas' || normalized === 'guru bk' || normalized === 'bk') {
      return ['dashboard', 'reports-hub', 'reports', 'rekap-kelas', 'students', 'dimensions', 'panduan-role', 'cbt-content'];
    }

    // Level 6: Manager / HRD (Analytics & Results Only)
    if (normalized === 'manager' || normalized === 'hrd' || normalized === 'kepala sekolah' || normalized === 'waka') {
      return ['dashboard', 'reports-hub', 'reports', 'rekap-kelas', 'rekap-jurusan', 'dimensions', 'panduan-role', 'cbt-content'];
    }

    return ['dashboard', 'reports-hub', 'reports', 'rekap-kelas', 'dimensions', 'panduan-role', 'cbt-content'];
  }, [effectiveRole]);

  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'registrations'
    | 'reports-hub'
    | 'reports'
    | 'rekap-kelas'
    | 'rekap-jurusan'
    | 'students-hub'
    | 'students'
    | 'questions'
    | 'majors'
    | 'dimensions'
    | 'users'
    | 'system-settings'
    | 'settings'
    | 'test-types'
    | 'wali-kelas'
    | 'kakomli'
    | 'classes-cohorts'
    | 'licenses'
    | 'packages'
    | 'certificate-settings'
    | 'db-sync'
    | 'cbt-proctor'
    | 'panduan-role'
    | 'landing-editor'
    | 'cbt-content'
  >(
    allowedTabs.includes('dashboard') ? 'dashboard' : (allowedTabs[0] as any || 'dashboard')
  );

  // Counselor / Report States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 50;
  const [statModal, setStatModal] = useState<{ title: string; students: Student[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load and subscribe to store changes
  useEffect(() => {
    const handleUpdate = () => {
      let s = store.getStudents();
      const roleLower = (effectiveRole || '').toLowerCase().trim();
      const userSchool = session?.school_origin?.trim().toLowerCase();

      if (roleLower !== 'superadmin' && userSchool) {
        s = s.filter((st: Student) => {
          const stSchool = (st.schoolOrigin || st.school_origin || '').trim().toLowerCase();
          return !stSchool || stSchool === userSchool;
        });
      }

      if ((roleLower === 'wali kelas' || roleLower === 'wali-kelas') && session?.managed_class) {
        const mc = session.managed_class.trim().toLowerCase();
        s = s.filter((st: Student) => (st.classGroup || '').trim().toLowerCase() === mc);
      } else if (roleLower === 'kakomli' && session?.managed_class) {
        const mj = session.managed_class.trim().toLowerCase();
        s = s.filter((st: Student) => (st.classGroup || '').trim().toLowerCase().includes(mj));
      }
      setStudents([...s]);
      setQuestions([...store.getQuestions()]);
      setDimensions([...store.getDimensions()]);
      setMajors([...store.getSchoolMajors()]);
      setTeachers([...store.getTeachers()]);
      setPackages([...store.getPackages()]);
      setTestSettings({ ...store.getTestSettings() });
    };

    handleUpdate();
    const unsubscribe = store.subscribe(handleUpdate);
    
    return () => {
      unsubscribe();
    };
  }, [store, refreshTrigger, session, effectiveRole]);

  // Trigger Gemini Analysis for a specific student
  const triggerGeminiAnalysis = async (student: Student) => {
    setLoadingAi(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          iqScore: student.iqScore || 95,
          eqScore: student.eqScore || 90,
          riasecScores: student.riasecScores || { R:0, I:0, A:0, S:0, E:0, C:0 },
          dimensionAnswers: student.dimensionScores || {},
          aiPromptTemplate: testSettings.aiPromptTemplate,
          aiSystemInstruction: testSettings.aiSystemInstruction
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
        onRefresh();
        const updated = store.getStudents().find((s: Student) => s.id === student.id);
        if (updated) {
          setSelectedStudent(updated);
        }
      } else {
        throw new Error(data.error || 'Gagal menghasilkan analisis.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Kendala teknis saat menghubungi Gemini AI: ${err.message || err}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleToggleSetting = (key: keyof TestSettings) => {
    const updated = { [key]: !testSettings[key] };
    store.updateTestSettings(updated);
    setTestSettings(prev => ({ ...prev, ...updated }));
  };

  const handleUpdateSetting = (key: keyof TestSettings, value: any) => {
    const updated = { [key]: value };
    store.updateTestSettings(updated);
    setTestSettings(prev => ({ ...prev, ...updated }));
    onRefresh();
  };

  return (
    <div className="h-screen md:h-screen flex flex-col md:flex-row bg-slate-50/50 w-full overflow-y-auto md:overflow-hidden text-slate-800 print:bg-white" id="admin-dashboard">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800 relative z-50 shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase font-mono tracking-wider">PsikoSMK Admin</span>
        </div>
        <button 
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR PANEL */}
      <div className="print:hidden">
        <Sidebar
          session={session}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          allowedTabs={allowedTabs}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          onLogout={onLogout}
          simulatedRole={simulatedRole}
          setSimulatedRole={setSimulatedRole}
          activeContextId={activeContextId}
          setActiveContextId={setActiveContextId}
        />
      </div>

      {/* MAIN DATA VIEW AREA */}
      <div className="flex-1 md:h-screen overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 relative print:p-0 print:m-0 print:overflow-visible print:bg-white">
        
        {!allowedTabs.includes(activeTab) ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-5 animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm animate-pulse mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-mono">Akses Terbatas (RBAC Restricted)</h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Maaf, akun Anda dengan peran <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono font-bold text-slate-700">{session.role}</span> tidak memiliki hak akses untuk membuka halaman <span className="font-bold text-indigo-600">{activeTab}</span>.
              </p>
            </div>
            <button
              onClick={() => setActiveTab(allowedTabs[0] as any || 'dashboard')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer mx-auto block"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardTab 
                students={students} 
                setStatModal={setStatModal} 
                session={simulatedSession}
                store={store}
              />
            )}

            {activeTab === 'registrations' && (
              <RegistrationsTab 
                store={store}
                onRefresh={onRefresh}
              />
            )}

        {/* WORKFLOW HUB 1: PUSAT HASIL & REKAPITULASI */}
        {(activeTab === 'reports-hub' || activeTab === 'reports' || activeTab === 'rekap-kelas' || activeTab === 'rekap-jurusan') && (
          <ReportsHubTab 
            store={store}
            students={students} 
            selectedStudent={selectedStudent} 
            setSelectedStudent={setSelectedStudent} 
            studentPage={studentPage}
            setStudentPage={setStudentPage}
            studentsPerPage={studentsPerPage}
            errorMsg={errorMsg} 
            setErrorMsg={setErrorMsg} 
            loadingAi={loadingAi} 
            triggerGeminiAnalysis={triggerGeminiAnalysis}
            questions={questions}
            dimensions={dimensions}
            packages={packages}
            activeContextId={activeContextId}
            onRefresh={onRefresh}
            session={simulatedSession}
            setActiveTab={setActiveTab}
            initialSubTab={
              activeTab === 'rekap-kelas' ? 'rombel' :
              activeTab === 'rekap-jurusan' ? 'jurusan' : 'individual'
            }
          />
        )}

        {/* WORKFLOW HUB 2: PUSAT PESERTA & ROMBEL */}
        {(activeTab === 'students-hub' || activeTab === 'students' || activeTab === 'classes-cohorts') && (
          <StudentsHubTab 
            store={store}
            students={students} 
            studentPage={studentPage} 
            setStudentPage={setStudentPage} 
            studentsPerPage={studentsPerPage} 
            setSelectedStudent={setSelectedStudent}
            setActiveTab={setActiveTab}
            session={simulatedSession}
            onRefresh={onRefresh}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
            initialSubTab={activeTab === 'classes-cohorts' ? 'classes' : 'students'}
          />
        )}

        {/* WORKFLOW HUB 3: PUSAT PENGATURAN PLATFORM & SISTEM */}
        {(activeTab === 'system-settings' || activeTab === 'settings' || activeTab === 'certificate-settings' || activeTab === 'db-sync' || activeTab === 'landing-editor') && (
          <SystemSettingsHubTab 
            testSettings={testSettings} 
            handleToggleSetting={handleToggleSetting} 
            handleUpdateSetting={handleUpdateSetting} 
            session={simulatedSession}
            store={store}
            onRefresh={onRefresh}
            showNotification={showNotification}
            initialSubTab={
              activeTab === 'certificate-settings' ? 'certificate' :
              activeTab === 'db-sync' ? 'dbsync' :
              activeTab === 'landing-editor' ? 'landing' : 'settings'
            }
          />
        )}

        {(activeTab === 'questions' || activeTab === 'majors' || activeTab === 'dimensions' || activeTab === 'test-types' || activeTab === 'cbt-content') && (
          <CbtContentTab 
            store={store}
            onRefresh={onRefresh}
            session={simulatedSession}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
            initialSubTab={
              activeTab === 'dimensions' ? 'dimensions' :
              activeTab === 'questions' ? 'questions' :
              activeTab === 'majors' ? 'majors' : 'test-types'
            }
          />
        )}

        {activeTab === 'users' && (
          <UsersTab 
            store={store}
            teachers={teachers} 
            onRefresh={onRefresh}
            session={simulatedSession}
          />
        )}

        {activeTab === 'wali-kelas' && (
          <WaliKelasTab 
            store={store}
            teachers={teachers} 
            onRefresh={onRefresh}
            session={simulatedSession}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
          />
        )}

        {activeTab === 'kakomli' && (
          <KakomliTab 
            store={store}
            teachers={teachers} 
            onRefresh={onRefresh}
            session={simulatedSession}
            refreshTrigger={refreshTrigger}
            showNotification={showNotification}
            activeContextId={activeContextId}
          />
        )}

        {activeTab === 'licenses' && (
          <LicensesTab 
            store={store} 
            onRefresh={onRefresh} 
            session={simulatedSession} 
          />
        )}

        {activeTab === 'packages' && (
          <PackagesTab 
            store={store} 
            packages={packages} 
            onRefresh={onRefresh} 
            session={simulatedSession} 
          />
        )}

        {activeTab === 'cbt-proctor' && (
          <ProctoringCbtTab 
            store={store} 
            students={students} 
            onRefresh={onRefresh} 
            showNotification={showNotification}
          />
        )}

        {activeTab === 'panduan-role' && (
          <PanduanRoleTab />
        )}
          </>
        )}

      </div>

      {/* RENDER STATISTICS MODAL IF REQUESTED */}
      <StatModal
        statModal={statModal}
        onClose={() => setStatModal(null)}
        onSelectStudent={(s) => {
          setSelectedStudent(s);
          setActiveTab('reports');
        }}
      />

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl text-white shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 shadow-emerald-950/20' :
          toast.type === 'error' ? 'bg-rose-600 border-rose-500 shadow-rose-950/20' :
          'bg-slate-800 border-slate-700 shadow-slate-950/20'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-bold font-sans">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
