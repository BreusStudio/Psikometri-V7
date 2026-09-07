import { ScoringCalibrationSettings, DEFAULT_SCORING_CALIBRATION } from '../core/types';

/**
 * Statistical Normal Distribution Utilities for Standardized Psychometric Scoring
 */

export function calculateZScore(rawScore: number, mean: number, sd: number): number {
  if (sd <= 0) return 0;
  return (rawScore - mean) / sd;
}

/**
 * Converts Z-score to Wechsler Adult/Child Intelligence Scale (IQ)
 * Mean = 100, SD = 15. Standard psychometric range [55, 145].
 */
export function zToWechslerIQ(zScore: number): number {
  const iq = Math.round(100 + zScore * 15);
  return Math.min(145, Math.max(55, iq));
}

/**
 * Converts Z-score to Standard T-Score
 * Mean = 50, SD = 10. Clamped to standard psychometric range [20, 80].
 */
export function zToTScore(zScore: number): number {
  const t = Math.round(50 + zScore * 10);
  return Math.min(80, Math.max(20, t));
}

/**
 * Standard Wechsler Intelligence Classification (WAIS/WISC)
 */
export function getWechslerIqClassification(iq: number): { label: string; code: string; color: string } {
  if (iq >= 130) return { label: 'Sangat Superior', code: 'VERY_SUPERIOR', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  if (iq >= 120) return { label: 'Superior', code: 'SUPERIOR', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (iq >= 110) return { label: 'Di Atas Rata-rata', code: 'HIGH_AVERAGE', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  if (iq >= 90) return { label: 'Rata-rata Normal', code: 'AVERAGE', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (iq >= 80) return { label: 'Di Bawah Rata-rata', code: 'LOW_AVERAGE', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (iq >= 70) return { label: 'Batas Rendah (Borderline)', code: 'BORDERLINE', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { label: 'Perlu Bimbingan Khusus', code: 'EXTREMELY_LOW', color: 'text-rose-700 bg-rose-50 border-rose-200' };
}

/**
 * Standard T-Score Emotional Intelligence Classification (Mean: 50, SD: 10)
 */
export function getTScoreEqClassification(tScore: number): { label: string; code: string; color: string } {
  if (tScore >= 65) return { label: 'Sangat Stabil', code: 'VERY_HIGH', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
  if (tScore >= 55) return { label: 'Stabil / Baik', code: 'HIGH', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (tScore >= 45) return { label: 'Rata-rata (Cukup Stabil)', code: 'AVERAGE', color: 'text-teal-700 bg-teal-50 border-teal-200' };
  if (tScore >= 35) return { label: 'Sedang (Perlu Perhatian)', code: 'LOW_AVERAGE', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Perlu Pendampingan Khusus', code: 'LOW', color: 'text-rose-700 bg-rose-50 border-rose-200' };
}

/**
 * Calculates Calibrated Real IQ score for student based on test calibration settings
 */
export function calculateCalibratedIq(
  rawIq: number,
  maxIqRaw: number,
  calibration?: ScoringCalibrationSettings
): number {
  const calib = calibration || DEFAULT_SCORING_CALIBRATION;
  const pct = maxIqRaw > 0 ? (rawIq / maxIqRaw) * 100 : 0;

  // 1. Table-based conversion if configured and active
  if (calib.mode === 'table' && calib.iqBrackets && calib.iqBrackets.length > 0) {
    const sorted = [...calib.iqBrackets].sort((a, b) => b.minPercentage - a.minPercentage);
    for (const bracket of sorted) {
      if (pct >= bracket.minPercentage) {
        return bracket.iqScore;
      }
    }
    return sorted[sorted.length - 1]?.iqScore || 70;
  }

  // 2. Calibrated Psychometric Curve (Norm-referenced to realistic baseline)
  const baselinePct = calib.iqBaselinePercentage ?? 35;
  const spreadPct = Math.max(calib.iqSpreadPercentage ?? 15, 1);
  const zScore = (pct - baselinePct) / spreadPct;
  const rawIqScore = Math.round(100 + zScore * 15);
  
  const minIq = calib.minIq ?? 65;
  const maxIq = calib.maxIq ?? 145;
  return Math.min(maxIq, Math.max(minIq, rawIqScore));
}

/**
 * Calculates Calibrated Real EQ score for student based on test calibration settings
 */
export function calculateCalibratedEq(
  rawEq: number,
  minEqRaw: number,
  maxEqRaw: number,
  calibration?: ScoringCalibrationSettings
): number {
  const calib = calibration || DEFAULT_SCORING_CALIBRATION;
  const range = Math.max(maxEqRaw - minEqRaw, 1);
  const eqPct = Math.max(0, Math.min(100, ((rawEq - minEqRaw) / range) * 100));

  const baselinePct = calib.eqBaselinePercentage ?? 50;
  const spreadPct = Math.max(calib.eqSpreadPercentage ?? 18, 1);
  const zScore = (eqPct - baselinePct) / spreadPct;
  const rawEqScore = Math.round(50 + zScore * 10);

  const minEq = calib.minEq ?? 20;
  const maxEq = calib.maxEq ?? 80;
  return Math.min(maxEq, Math.max(minEq, rawEqScore));
}

/**
 * Calculates Cumulative Normal Percentile Rank (PR %) from Z-score
 * Uses error function approximation (Abramowitz and Stegun).
 */
export function zToPercentileRank(zScore: number): number {
  const absZ = Math.abs(zScore);
  const t = 1 / (1 + 0.2316419 * absZ);
  const poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * absZ * absZ) * poly;
  const percentile = zScore >= 0 ? 1 - phi : phi;
  return Math.min(99, Math.max(1, Math.round(percentile * 100)));
}
