'use client';

import React from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDanger = false
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5 text-left font-sans">
        <div className="flex gap-4 items-start">
          <div className={`p-3 rounded-xl shrink-0 ${isDanger ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
            {isDanger ? (
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer transition-all ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-900/10' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-900/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
