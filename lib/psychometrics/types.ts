export type ValidityStatus = 'VALID' | 'NEEDS_REVIEW' | 'INVALID';

export interface ValidityResult {
  status: ValidityStatus;
  confidenceScore: number; // 0 to 100
  flags: string[];
  vrinScore: number; // Variable Response Inconsistency
  lieScore: number; // Social Desirability / Faking Good score
  speedingFlag: boolean; // Fast completion / random clicking indicator
  reasoning: string;
}

export interface PsychometricNorm {
  mean: number;
  sd: number;
  sampleSize?: number;
  educationLevel?: string;
}

export interface CalculatedPsychometrics {
  iqScore: number;
  eqScore: number;
  riasecScores: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number>;
  dimensionScores: Record<string, number>;
  dimensionPercentiles?: Record<string, number>;
  validity: ValidityResult;
}
