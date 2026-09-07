'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => toast('success', message, title), [toast]);
  const error = useCallback((message: string, title?: string) => toast('error', message, title), [toast]);
  const info = useCallback((message: string, title?: string) => toast('info', message, title), [toast]);
  const warning = useCallback((message: string, title?: string) => toast('warning', message, title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div 
        id="toast-container-portal"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              layout
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
                item.type === 'success'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800 shadow-emerald-100/20'
                  : item.type === 'error'
                  ? 'bg-rose-50/90 border-rose-200 text-rose-800 shadow-rose-100/20'
                  : item.type === 'warning'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-800 shadow-amber-100/20'
                  : 'bg-indigo-50/90 border-indigo-200 text-indigo-800 shadow-indigo-100/20'
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {item.type === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
                {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {item.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-0.5">
                {item.title ? (
                  <h4 className="text-xs font-bold uppercase tracking-wider">{item.title}</h4>
                ) : (
                  <h4 className="text-xs font-bold capitalize">
                    {item.type === 'success' ? 'Berhasil' : item.type === 'error' ? 'Kesalahan' : item.type}
                  </h4>
                )}
                <p className="text-[11px] leading-relaxed font-medium opacity-90">{item.message}</p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(item.id)}
                className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
