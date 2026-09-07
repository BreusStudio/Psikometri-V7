'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Layers, 
  Upload, 
  LogOut, 
  GraduationCap, 
  Sliders, 
  SlidersHorizontal,
  BookOpen,
  ChevronDown,
  CreditCard,
  Package as PackageIcon,
  Award,
  Database,
  RefreshCw,
  Cpu,
  Settings,
  Layout,
  LayoutGrid,
  Book,
  Briefcase,
  LayoutTemplate,
  Monitor,
  UserCheck
} from 'lucide-react';
import RotatingTokenSidebar from './RotatingTokenSidebar';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { MenuContexts, TenantContextType } from '../../lib/metadata';

function ConnectionStatusBadge() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'unconfigured'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = async () => {
    setIsRefreshing(true);
    if (!isSupabaseConfigured || !supabase) {
      setStatus('unconfigured');
      setLatency(null);
      setIsRefreshing(false);
      return;
    }

    try {
      const startTime = Date.now();
      const { error } = await supabase.from('test_settings').select('id').limit(1);
      const duration = Date.now() - startTime;

      if (error) {
        setStatus('offline');
        setLatency(null);
      } else {
        setStatus('online');
        setLatency(duration);
      }
    } catch (err) {
      setStatus('offline');
      setLatency(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const runCheck = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setStatus('unconfigured');
          setLatency(null);
        }
        return;
      }
      try {
        const startTime = Date.now();
        const { error } = await supabase.from('test_settings').select('id').limit(1);
        const duration = Date.now() - startTime;
        if (isMounted) {
          if (error) {
            setStatus('offline');
            setLatency(null);
          } else {
            setStatus('online');
            setLatency(duration);
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus('offline');
          setLatency(null);
        }
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 flex flex-col justify-between h-[68px]">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
          <Database className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          <span className="truncate">Database</span>
        </div>
        <button
          type="button"
          onClick={checkConnection}
          disabled={isRefreshing}
          className="p-0.5 text-slate-500 hover:text-white rounded hover:bg-slate-700/50 transition-colors cursor-pointer flex-shrink-0"
          title="Cek Ulang Koneksi"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {status === 'checking' && (
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-ping flex-shrink-0" />
          <span className="text-[10px] font-medium text-slate-400 truncate">Cek...</span>
        </div>
      )}

      {status === 'online' && (
        <div className="flex items-center justify-between gap-1 w-full min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 truncate">Online</span>
          </div>
          {latency !== null && (
            <span className="text-[8px] font-mono font-semibold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex-shrink-0">
              {latency}ms
            </span>
          )}
        </div>
      )}

      {status === 'offline' && (
        <div className="flex items-center justify-between gap-1 w-full min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            <span className="text-[10px] font-bold text-rose-400 truncate">Offline</span>
          </div>
        </div>
      )}

      {status === 'unconfigured' && (
        <div className="flex items-center justify-between gap-1 w-full min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-amber-300 truncate">Local Mock</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EnvironmentStatusBadge({ onNavigateSettings }: { onNavigateSettings?: () => void }) {
  const [appEnv, setAppEnv] = useState<'development' | 'production'>('development');

  useEffect(() => {
    const updateEnv = () => {
      if (typeof window !== 'undefined') {
        const savedEnv = localStorage.getItem('cbt_app_env') as 'development' | 'production';
        setAppEnv(savedEnv || 'development');
      }
    };

    updateEnv();
    window.addEventListener('appEnvChanged', updateEnv);
    return () => window.removeEventListener('appEnvChanged', updateEnv);
  }, []);

  return (
    <div 
      onClick={onNavigateSettings}
      className={`border rounded-xl p-2.5 flex flex-col justify-between h-[68px] cursor-pointer transition-all hover:brightness-110 select-none ${
        appEnv === 'development'
          ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
          : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
          <Cpu className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="truncate">Environment</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1 w-full min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              appEnv === 'development' ? 'bg-emerald-400' : 'bg-indigo-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              appEnv === 'development' ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}></span>
          </span>
          <span className="text-[10px] font-bold text-white truncate">
            {appEnv === 'development' ? 'Dev Mode' : 'Prod Mode'}
          </span>
        </div>
        <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase border flex-shrink-0 ${
          appEnv === 'development'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
        }`}>
          {appEnv === 'development' ? 'DEV' : 'PROD'}
        </span>
      </div>
    </div>
  );
}

interface SidebarProps {
  session: { role: string; id: string; name: string; managed_class?: string; };
  activeTab: string;
  setActiveTab: (tab: any) => void;
  allowedTabs: string[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
  simulatedRole?: string | null;
  setSimulatedRole?: (role: string | null) => void;
  activeContextId: TenantContextType;
  setActiveContextId: (context: TenantContextType) => void;
}

export default function Sidebar({
  session,
  activeTab,
  setActiveTab,
  allowedTabs,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout,
  simulatedRole,
  setSimulatedRole,
  activeContextId,
  setActiveContextId
}: SidebarProps) {

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto-expand group containing active tab
    const currentContext = MenuContexts[activeContextId];
    if (currentContext) {
      const activeGroup = currentContext.groups.find(g => g.items.some(i => i.id === activeTab));
      if (activeGroup) {
        setExpandedGroups(prev => {
          if (prev[activeGroup.id]) return prev;
          return { [activeGroup.id]: true };
        });
      }
    }
  }, [activeTab, activeContextId]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      // Accordion mode: close others when opening one
      const isCurrentlyOpen = prev[groupId];
      if (isCurrentlyOpen) {
        return { [groupId]: false };
      } else {
        return { [groupId]: true };
      }
    });
  };

  const isSuper = session.role.toLowerCase() === 'superadmin';

  // METADATA DRIVEN MENUS
  const currentContext = MenuContexts[activeContextId];
  const menuGroups = currentContext.groups;

  const getIconByStringName = (iconName: string) => {
    switch (iconName) {
      case 'dashboard': return <Layers className="w-4 h-4" />;
      case 'cpu': return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'file-text': return <FileText className="w-4 h-4" />;
      case 'users': return <Users className="w-4 h-4" />;
      case 'users-cyan': return <Users className="w-4 h-4 text-cyan-400" />;
      case 'users-blue': return <Users className="w-4 h-4 text-blue-400" />;
      case 'users-gear': return <Users className="w-4 h-4 text-indigo-400" />;
      case 'book-open': return <BookOpen className="w-4 h-4" />;
      case 'sliders': return <Sliders className="w-4 h-4" />;
      case 'sliders-horizontal': return <SlidersHorizontal className="w-4 h-4" />;
      case 'settings': return <Settings className="w-4 h-4 text-slate-400" />;
      case 'monitor': return <Monitor className="w-4 h-4 text-emerald-400" />;
      case 'user-check': return <UserCheck className="w-4 h-4 text-teal-400" />;
      case 'database': return <Database className="w-4 h-4 text-emerald-400" />;
      case 'award': return <Award className="w-4 h-4 text-amber-400" />;
      case 'graduation-cap': return <GraduationCap className="w-4 h-4 text-indigo-400" />;
      case 'credit-card': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'package': return <PackageIcon className="w-4 h-4 text-amber-400" />;
      case 'layout': return <Layout className="w-4 h-4 text-sky-400" />;
      case 'layout-grid': return <LayoutGrid className="w-4 h-4 text-indigo-400" />;
      case 'layout-template': return <LayoutTemplate className="w-4 h-4 text-pink-400" />;
      case 'book': return <Book className="w-4 h-4" />;
      case 'briefcase': return <Briefcase className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const isItemActive = (itemId: string, currentTab: string) => {
    if (currentTab === itemId) return true;
    if (itemId === 'reports-hub' && ['reports', 'rekap-kelas', 'rekap-jurusan', 'reports-hub'].includes(currentTab)) return true;
    if (itemId === 'students-hub' && ['students', 'classes-cohorts', 'students-hub'].includes(currentTab)) return true;
    if (itemId === 'system-settings' && ['settings', 'certificate-settings', 'db-sync', 'landing-editor', 'system-settings'].includes(currentTab)) return true;
    if (itemId === 'cbt-content' && ['cbt-content', 'questions', 'majors', 'dimensions', 'test-types'].includes(currentTab)) return true;
    return false;
  };

  return (
    <div className={`
      ${mobileMenuOpen ? 'fixed inset-0 top-[57px] z-40 flex flex-col' : 'hidden'} 
      md:flex md:relative md:top-auto md:w-64 bg-slate-900 text-white flex-shrink-0 flex-col justify-between border-r border-slate-800 md:h-screen overflow-y-auto z-30 text-left pb-16 md:pb-0
    `}>
      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider font-sans">
                PsikoSMK <span className="text-indigo-400">CBT</span>
              </h2>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-widest uppercase">{session.role} CONSOLE</span>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold font-mono text-slate-800">
              {session.name ? session.name.substring(0, 2).toUpperCase() : 'ST'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">{session.name || 'Staff'}</p>
              <p className="text-[10px] text-slate-450 uppercase tracking-wide font-mono font-bold text-slate-400">{session.role}</p>
            </div>
          </div>

          {/* METADATA TENANT CONTEXT SWITCHER */}
          {isSuper && (
            <div className="mb-6 pt-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Konteks Instansi</span>
                </div>
                <select 
                  value={activeContextId} 
                  onChange={(e) => setActiveContextId(e.target.value as TenantContextType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                >
                  {Object.values(MenuContexts).map(ctx => (
                    <option key={ctx.id} value={ctx.id}>{ctx.label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {currentContext.description}
                </p>
              </div>
            </div>
          )}

          {/* ROLE SIMULATION TOOL (ONLY FOR SUPER/ADMIN) */}
          {isSuper && setSimulatedRole && (
            <div className="mb-6 pt-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulasi Role</span>
                  {simulatedRole && (
                    <button 
                      onClick={() => setSimulatedRole(null)}
                      className="text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <select 
                  value={simulatedRole || ''} 
                  onChange={(e) => setSimulatedRole(e.target.value || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                >
                  <option value="">Default ({session.role})</option>
                  <option value="Superadmin">Superadmin</option>
                  <option value="Admin">Administrator</option>
                  <option value="Proktor">Proktor</option>
                  <option value="Kakomli">Kepala Jurusan</option>
                  <option value="Wali Kelas">Wali Kelas</option>
                  <option value="Guru BK">Guru BK</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="HRD">HRD / Manager</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <ConnectionStatusBadge />
            <EnvironmentStatusBadge onNavigateSettings={() => setActiveTab('settings')} />
          </div>

          <nav className="space-y-4">
            {menuGroups.map((group) => {
              const groupItems = group.items.filter(item => {
                const isCentralized = ['questions', 'test-types', 'dimensions', 'majors', 'cbt-content'].includes(item.id);
                if (isCentralized && activeContextId !== 'superadmin') {
                  return false;
                }
                return allowedTabs.includes(item.id);
              });
              if (groupItems.length === 0) return null;
              const isExpanded = expandedGroups[group.id] !== false;

              return (
                <div key={group.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <span>{group.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 pl-1 border-l border-slate-800/60 ml-2 animate-fade-in">
                      {groupItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { setActiveTab(item.id as any); setMobileMenuOpen(false); }}
                          className={`w-full flex items-center justify-start text-left gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isItemActive(item.id, activeTab)
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="flex-shrink-0">{getIconByStringName(item.icon)}</span>
                          <span className="text-left flex-1">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-4">
          <RotatingTokenSidebar />

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
