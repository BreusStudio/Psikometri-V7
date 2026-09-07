'use client';

import { useEffect, MutableRefObject } from 'react';
import { PsychometricStore, Student } from '../mockData';

interface UseAntiCheatOptions {
  phase: string;
  currentStudent: Student | null;
  store: PsychometricStore;
  cheatOverlayRef: MutableRefObject<boolean>;
  testingStartTimeRef: MutableRefObject<number>;
  setCurrentStudent: (student: Student) => void;
  setPhase: (phase: 'token' | 'instructions' | 'hub' | 'testing' | 'locked' | 'completed') => void;
  setCheatOverlay: (overlay: boolean) => void;
  setCheatMsg: (msg: string) => void;
  onRefresh: () => void;
  exitFullscreen: () => void;
}

export function useAntiCheat({
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
}: UseAntiCheatOptions) {
  useEffect(() => {
    if (phase !== 'testing' || !currentStudent) return;

    try {
      window.focus();
    } catch (e) {
      console.log("Failed to focus window:", e);
    }

    localStorage.setItem('last_active_exam_timestamp', String(Date.now()));

    const handleCheatTrigger = (customReason?: string) => {
      if (cheatOverlayRef.current) return;

      const settings = store.getTestSettings();
      const isAuditOnly = (settings.proctoringMode || 'AUDIT_ONLY') === 'AUDIT_ONLY';

      const reason = customReason || "Sistem mendeteksi Anda meninggalkan jendela ujian (berpindah tab / meluncurkan aplikasi lain).";
      const { student: updated, locked } = store.addCheatWarning(currentStudent.id, reason);

      if (updated) {
        setCurrentStudent({ ...updated });
        onRefresh();

        if (locked && !isAuditOnly) {
          setPhase('locked');
          setCheatOverlay(false);
          exitFullscreen();
        } else {
          const modeLabel = isAuditOnly ? 'MODE AUDIT (TRANSPARAN)' : 'MODE KETAT (STRICT)';
          const msgSuffix = isAuditOnly 
            ? 'Aktivitas ini telah dicatat secara transparan oleh sistem pengawas. Anda dapat melanjutkan pengerjaan ujian.'
            : 'Peringatan ke-' + updated.cheatWarnings + ' dari 3 batas maksimal.';
          
          setCheatMsg(
            `PERINGATAN PENGAWASAN UJIAN [${modeLabel}]\n\n${reason}\n\n${msgSuffix}`
          );
          setCheatOverlay(true);
        }
      }
    };

    const heartbeatInterval = setInterval(() => {
      const lastActiveStr = localStorage.getItem('last_active_exam_timestamp');
      const now = Date.now();

      if (lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        const diff = now - lastActive;

        if (diff > 6000) {
          handleCheatTrigger("Sistem mendeteksi Anda meminimalkan layar, membuka aplikasi lain, atau mengunci perangkat ponsel Anda.");
        }
      }

      localStorage.setItem('last_active_exam_timestamp', String(now));
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' || (document as any).hidden) {
        handleCheatTrigger("Sistem mendeteksi Anda meninggalkan jendela ujian (berpindah tab / minimasi).");
      }
    };

    const handleWindowBlur = () => {
      handleCheatTrigger("Sistem mendeteksi Anda kehilangan fokus pada layar ujian (membuka aplikasi lain / notifikasi / panel kontrol).");
    };

    const handlePageHide = () => {
      handleCheatTrigger("Sistem mendeteksi halaman ujian disembunyikan (berpindah aplikasi / mengunci layar).");
    };

    const handleFullscreenChange = () => {
      if (Date.now() - testingStartTimeRef.current < 2500) {
        return;
      }
      const doc = document as any;
      const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
      if (!isFullscreen) {
        handleCheatTrigger("Sistem mendeteksi Anda keluar dari mode layar penuh (fullscreen). Ujian wajib dikerjakan dalam mode layar penuh.");
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      handleCheatTrigger("Sistem mendeteksi aktivitas menyalin (copy/paste) yang tidak diizinkan.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen / Screenshot interception
      if (
        e.key === 'PrintScreen' || 
        e.code === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        try {
          navigator.clipboard.writeText('');
        } catch (_) {}
        handleCheatTrigger("Sistem mendeteksi upaya penangkapan layar (PrintScreen/Screenshot) yang tidak dilarang.");
        return;
      }

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'C' || e.key === 'c' || e.key === 'V' || e.key === 'v' || e.key === 'X' || e.key === 'x' || e.key === 'S' || e.key === 's')) ||
        (e.metaKey && (e.key === 'C' || e.key === 'c' || e.key === 'V' || e.key === 'v' || e.key === 'X' || e.key === 'x' || e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        handleCheatTrigger("Sistem mendeteksi penggunaan pintasan keyboard (shortcut / DevTools) yang tidak diizinkan.");
      }
    };

    // DevTools inspection detection via window size thresholds
    const handleDevToolsCheck = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        handleCheatTrigger("Sistem mendeteksi pembukaan Developer Tools / Panel Inspeksi browser.");
      }
    };
    window.addEventListener('resize', handleDevToolsCheck);

    const handleDocumentClick = () => {
      try {
        window.focus();
      } catch (e) {
        console.log("Failed to re-focus window:", e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('click', handleDocumentClick);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(heartbeatInterval);
      localStorage.removeItem('last_active_exam_timestamp');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('click', handleDocumentClick);

      window.removeEventListener('resize', handleDevToolsCheck);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
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
  ]);
}
