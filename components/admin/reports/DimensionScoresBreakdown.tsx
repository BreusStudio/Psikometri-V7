'use client';

import React from 'react';
import { Brain, Heart, Users, ShieldCheck } from 'lucide-react';
import { Question, Dimension } from '@/lib/core/types';
import { evaluateDimensionScore } from '@/lib/store/scoreCalculator';
import { normalizeCanonicalDimension, CANONICAL_DIMENSIONS } from '@/lib/metadata/canonicalDimensions';

interface DimensionScoresBreakdownProps {
  scores: Record<string, number> | null;
  questions: Question[];
  dimensions: Dimension[];
  evaluatedDimensions?: Record<string, {
    normalizedScore: number;
    label: string;
    color: string;
    interpretation: string;
    rawScore: number;
  }> | null;
}

export default function DimensionScoresBreakdown({
  scores,
  questions,
  dimensions,
  evaluatedDimensions
}: DimensionScoresBreakdownProps) {
  if (!scores) return null;

  // Consolidate raw scores to canonical dimension keys
  const consolidatedScores: Record<string, number> = {};
  Object.entries(scores).forEach(([k, v]) => {
    const canonKey = normalizeCanonicalDimension(k);
    consolidatedScores[canonKey] = Math.max(consolidatedScores[canonKey] || 0, Number(v) || 0);
  });

  const getDimensionsForType = (type: string) => {
    // 1. Pull from master canonical dimension registry for this test type
    const canonForType = CANONICAL_DIMENSIONS.filter(d => d.testType === type);

    // 2. Also check if active questions or evaluated scores exist
    const qDims = Array.from(new Set(
      (questions || [])
        .filter(q => q.testType === type && q.dimension)
        .map(q => normalizeCanonicalDimension(q.dimension!, type))
    ));

    const result: Dimension[] = [];
    const seenNames = new Set<string>();

    canonForType.forEach(d => {
      const canonName = normalizeCanonicalDimension(d.name, type);
      const hasScore = consolidatedScores[canonName] !== undefined || (scores && scores[d.name] !== undefined);
      const hasQuestions = qDims.includes(canonName);
      const hasEvaluated = evaluatedDimensions && (evaluatedDimensions[canonName] !== undefined || evaluatedDimensions[d.name] !== undefined);

      if (hasScore || hasQuestions || hasEvaluated) {
        if (!seenNames.has(canonName)) {
          seenNames.add(canonName);
          result.push({
            ...d,
            name: canonName
          });
        }
      }
    });

    // Fallback: If no canonical matched but student has test questions of this type, list them normalized
    if (result.length === 0 && canonForType.length > 0) {
      return canonForType.slice(0, 4);
    }

    return result;
  };

  const getNormInfo = (d: Dimension, rawScore: number) => {
    const canonName = normalizeCanonicalDimension(d.name, d.testType);
    if (evaluatedDimensions && (evaluatedDimensions[canonName] || evaluatedDimensions[d.name])) {
      return evaluatedDimensions[canonName] || evaluatedDimensions[d.name];
    }

    const dimQuestions = (questions || []).filter(q => {
      const qCanon = normalizeCanonicalDimension(q.dimension || '', q.testType);
      return qCanon === canonName || q.dimension === d.name || q.dimension === d.code;
    });

    let maxRaw = 0;
    dimQuestions.forEach(q => {
      const scores = q.choices?.map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : (c.isCorrect ? 1 : 0))) || [];
      maxRaw += scores.length > 0 ? Math.max(...scores) : 1;
    });

    if (maxRaw === 0) {
      maxRaw = rawScore > 20 ? 100 : (rawScore > 0 ? rawScore : 20);
    }

    const safeRaw = Math.min(Math.max(0, rawScore), maxRaw);
    return evaluateDimensionScore(d, safeRaw, maxRaw);
  };

  const getBadgeColor = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rose':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'blue':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const renderDimensionRow = (d: Dimension, scoreColor: string) => {
    const canonName = normalizeCanonicalDimension(d.name, d.testType);
    const rawVal = consolidatedScores[canonName] !== undefined ? consolidatedScores[canonName] : (scores[d.name] || 0);
    const norm = getNormInfo(d, rawVal);
    const displayScore = norm?.normalizedScore !== undefined ? norm.normalizedScore : Math.min(100, Math.round(rawVal));

    return (
      <div key={d.id || canonName} className="flex justify-between items-center border-b border-slate-300/60 pb-1.5 gap-2">
        <div className="font-bold text-[11px] leading-tight flex-1 min-w-0 text-slate-800 truncate" title={canonName}>
          {canonName}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`whitespace-nowrap font-mono font-black ${scoreColor} text-[11px]`}>
            {displayScore}%
          </span>
          {norm?.label && (
            <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md border ${getBadgeColor(norm.color)}`}>
              {norm.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  const iqDimensions = getDimensionsForType('IQ');
  const eqDimensions = getDimensionsForType('EQ');
  const kepribadianDimensions = getDimensionsForType('Kepribadian');
  const validitasDimensions = getDimensionsForType('Validitas');

  return (
    <div className="space-y-2 text-left animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {iqDimensions.length > 0 && (
          <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/80 space-y-2">
            <h4 className="text-[12px] font-black text-blue-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" /> Kognitif (IQ)
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              {iqDimensions.map((d) => renderDimensionRow(d, 'text-blue-900'))}
            </div>
          </div>
        )}

        {eqDimensions.length > 0 && (
          <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/80 space-y-2">
            <h4 className="text-[12px] font-black text-purple-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" /> Emosional (EQ)
            </h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              {eqDimensions.map((d) => renderDimensionRow(d, 'text-purple-900'))}
            </div>
          </div>
        )}
      </div>

      {(kepribadianDimensions.length > 0 || validitasDimensions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {kepribadianDimensions.length > 0 && (
            <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-200/80 space-y-2">
              <h4 className="text-[12px] font-black text-sky-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Kepribadian
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                {kepribadianDimensions.map((d) => renderDimensionRow(d, 'text-sky-900'))}
              </div>
            </div>
          )}

          {validitasDimensions.length > 0 && (
            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-200/80 space-y-2">
              <h4 className="text-[12px] font-black text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Validitas
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                {validitasDimensions.map((d) => renderDimensionRow(d, 'text-rose-900'))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
