'use client';

import React, { useState, useEffect } from 'react';
import { Question, Choice, ScoringType } from '@/lib/core/types';
import { 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Sliders, 
  ArrowLeftRight, 
  Award, 
  Save, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface ItemScorerModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
}

export function ItemScorerModal({
  isOpen,
  question,
  onClose,
  onSave
}: ItemScorerModalProps) {
  if (!isOpen || !question) return null;

  return (
    <ItemScorerModalContent
      key={question.id}
      question={question}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ItemScorerModalContent({
  question,
  onClose,
  onSave
}: {
  question: Question;
  onClose: () => void;
  onSave: (updatedQuestion: Question) => void;
}) {
  const [scoringType, setScoringType] = useState<ScoringType>(
    question.scoringType || (question.testType === 'IQ' ? 'binary' : 'weighted')
  );
  const [isUnfavorable, setIsUnfavorable] = useState<boolean>(!!question.isUnfavorable);
  const [correctChoiceId, setCorrectChoiceId] = useState<string>(question.correctChoiceId || '');
  const [choices, setChoices] = useState<Choice[]>(() => {
    return (question.choices || []).map(c => ({ ...c }));
  });

  const handleChoiceScoreChange = (index: number, newScore: number) => {
    setChoices(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], scoreValue: newScore };
      }
      return updated;
    });
  };

  const applyPresetLikert = (scaleMax: 4 | 5) => {
    setScoringType('likert');
    setChoices(prev => {
      return prev.map((choice, idx) => {
        let score = 0;
        if (scaleMax === 4) {
          // 4 options: 4, 3, 2, 1 (or reversed if unfavorable)
          score = 4 - idx;
          if (score < 1) score = 1;
        } else {
          // 5 options: 5, 4, 3, 2, 1
          score = 5 - idx;
          if (score < 1) score = 1;
        }
        return {
          ...choice,
          scoreValue: score
        };
      });
    });
  };

  const applyPresetBinary = (correctIdx: number) => {
    setScoringType('binary');
    if (choices[correctIdx]) {
      setCorrectChoiceId(choices[correctIdx].id);
    }
    setChoices(prev => {
      return prev.map((choice, idx) => ({
        ...choice,
        scoreValue: idx === correctIdx ? 1 : 0
      }));
    });
  };

  const handleSave = () => {
    const updatedQuestion: Question = {
      ...question,
      scoringType,
      isUnfavorable,
      correctChoiceId: scoringType === 'binary' ? correctChoiceId : undefined,
      choices
    };
    onSave(updatedQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/30 p-2.5 rounded-2xl border border-indigo-500/20">
              <Sliders className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                Konfigurasi Penilai & Rubrik Butir Soal
              </h3>
              <p className="text-[10px] text-slate-300 font-medium">
                ID Soal: <span className="font-mono text-indigo-300 font-bold">{question.id}</span> | Dimensi: <span className="text-emerald-300 font-bold">{question.dimension}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          {/* Question Text preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
              Pernyataan / Butir Instrumen:
            </span>
            <p className="text-xs font-bold text-slate-800 leading-relaxed">
              &ldquo;{question.text}&rdquo;
            </p>
          </div>

          {/* Scoring Scheme Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Pilih Skema Penilaian:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setScoringType('weighted')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringType === 'weighted'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Bobot Kustom</span>
                  {scoringType === 'weighted' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Setiap opsi memiliki skor unik sesuai indikator (Holland / Kesiapan Kerja).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScoringType('binary')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringType === 'binary'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Kunci Tunggal (IQ)</span>
                  {scoringType === 'binary' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Dikotomi Benar/Salah: Opsi benar bernilai 1 (atau skor penuh), opsi salah bernilai 0.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScoringType('likert')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringType === 'likert'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Skala Likert</span>
                  {scoringType === 'likert' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Skala bertingkat 1-4 atau 1-5 untuk tes sikap, emosi (EQ), kepribadian.
                </p>
              </button>
            </div>
          </div>

          {/* Unfavorable / Reverse Scoring Toggle */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-amber-950">
                  Item Unfavorable (Reverse Scoring Otomatis)
                </span>
                {isUnfavorable && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800 text-[9px] font-extrabold uppercase">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                Aktifkan jika butir ini adalah pernyataan negatif (misal: <em>&ldquo;Saya mudah menyerah saat gagal&rdquo;</em>). Mesin kalkulator akan otomatis membalik bobot skor jawaban saat dinilai.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
              <input
                type="checkbox"
                checked={isUnfavorable}
                onChange={(e) => setIsUnfavorable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Quick Presets for Likert/Binary */}
          {scoringType === 'likert' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => applyPresetLikert(4)}
                className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Skala 4 Tingkat (4, 3, 2, 1)
              </button>
              <button
                type="button"
                onClick={() => applyPresetLikert(5)}
                className="text-[10px] font-extrabold px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                Skala 5 Tingkat (5, 4, 3, 2, 1)
              </button>
            </div>
          )}

          {/* Option Scores Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Opsi Pilihan & Nilai Skor:
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {choices.length} Pilihan Jawaban
              </span>
            </div>

            <div className="space-y-2.5">
              {choices.map((choice, idx) => {
                const labelLetter = String.fromCharCode(65 + idx);
                const isCorrect = scoringType === 'binary' && ((correctChoiceId && choice.id === correctChoiceId) || (!correctChoiceId && choice.scoreValue > 0));

                return (
                  <div
                    key={choice.id || `choice-${idx}`}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isCorrect 
                        ? 'border-emerald-300 bg-emerald-50/50' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-xs font-black text-slate-700 flex-shrink-0">
                      {labelLetter}
                    </div>

                    <div className="flex-1 text-xs font-semibold text-slate-700">
                      {choice.text}
                    </div>

                    {scoringType === 'binary' ? (
                      <button
                        type="button"
                        onClick={() => applyPresetBinary(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Kunci Jawaban Benar (Skor: 1)
                          </>
                        ) : (
                          'Jadikan Kunci Benar'
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-400">Skor:</span>
                        <input
                          type="number"
                          value={choice.scoreValue ?? 0}
                          onChange={(e) => handleChoiceScoreChange(idx, Number(e.target.value))}
                          className="w-16 px-2.5 py-1.5 text-xs font-bold text-center font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-650/15 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Rubrik Penilai
          </button>
        </div>
      </div>
    </div>
  );
}
