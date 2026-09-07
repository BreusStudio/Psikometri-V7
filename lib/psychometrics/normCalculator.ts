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
