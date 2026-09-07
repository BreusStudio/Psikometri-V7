import { Student, Question, Dimension, TestSettings } from '../types';
import { CalculatedPsychometrics } from './types';
import { aggregateDimensionRawScores } from './itemScoreEngine';
import { calculateZScore, zToWechslerIQ, zToTScore, zToPercentileRank } from './normCalculator';
import { evaluateTestValidity } from './validityEngine';

/**
 * Unified Psychometric Evaluation Facade
 * Applies Standardized Norms (Wechsler IQ, T-Scores, Percentiles) and Triple-Check Validity
 */
export function evaluateStudentPsychometrics(
  student: Student,
  questions: Question[],
  dimensions: Dimension[],
  settings?: TestSettings
): CalculatedPsychometrics {
  // 1. Aggregate Raw Scores
  const { rawIq, rawEq, hollandTotals, dimensionTotals } = aggregateDimensionRawScores(student, questions, dimensions);

  const studentAnswers = student.answers || {};

  // 2. Identify questions actually answered or tested for this student
  const answeredIqQuestions = questions.filter(q => (q.testType || '').toUpperCase().trim() === "IQ" && studentAnswers[q.id] !== undefined);
  const answeredEqQuestions = questions.filter(q => (q.testType || '').toUpperCase().trim() === "EQ" && studentAnswers[q.id] !== undefined);

  // Fallback to all filtered questions if student hasn't answered yet but evaluation is triggered
  const baselineIqQuestions = answeredIqQuestions.length > 0 
    ? answeredIqQuestions 
    : questions.filter(q => (q.testType || '').toUpperCase().trim() === "IQ");

  const baselineEqQuestions = answeredEqQuestions.length > 0 
    ? answeredEqQuestions 
    : questions.filter(q => (q.testType || '').toUpperCase().trim() === "EQ");

  // Max possible raw scores based on active test items
  const maxIqRaw = baselineIqQuestions.reduce((acc, q) => {
    const maxVal = q.choices ? Math.max(...q.choices.map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : (c.isCorrect ? 1 : 0))), 1) : 1;
    return acc + maxVal;
  }, 0) || Math.max(baselineIqQuestions.length, 1);

  const minEqRaw = baselineEqQuestions.reduce((acc, q) => {
    const minVal = q.choices ? Math.min(...q.choices.map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : 1)), 1) : 1;
    return acc + minVal;
  }, 0) || baselineEqQuestions.length;

  const maxEqRaw = baselineEqQuestions.reduce((acc, q) => {
    const maxVal = q.choices ? Math.max(...q.choices.map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : 5)), 5) : 5;
    return acc + maxVal;
  }, 0) || (Math.max(baselineEqQuestions.length, 1) * 5);

  // Population Mean and Standard Deviation benchmarks
  // IQ Population Norm Mean = 50% of max raw, SD = 20% of max raw
  const iqMean = maxIqRaw * 0.5;
  const iqSd = Math.max(maxIqRaw * 0.2, 1);

  // EQ Population Norm Mean = 60% of score range, SD = 18% of score range
  const eqRange = Math.max(maxEqRaw - minEqRaw, 1);
  const eqMean = minEqRaw + (eqRange * 0.60);
  const eqSd = Math.max(eqRange * 0.18, 1);

  // 3. Compute Standardized IQ and EQ Scores
  let finalIqScore: number;
  if (answeredIqQuestions.length > 0) {
    const iqZ = calculateZScore(rawIq, iqMean, iqSd);
    finalIqScore = zToWechslerIQ(iqZ);
  } else if (student.iqScore !== null && student.iqScore !== undefined && student.iqScore > 0) {
    finalIqScore = student.iqScore;
  } else {
    finalIqScore = 100; // Wechsler Mean default
  }

  let finalEqScore: number;
  if (answeredEqQuestions.length > 0) {
    const eqZ = calculateZScore(rawEq, eqMean, eqSd);
    finalEqScore = zToTScore(eqZ);
  } else if (student.eqScore !== null && student.eqScore !== undefined && student.eqScore > 0) {
    finalEqScore = student.eqScore;
  } else {
    finalEqScore = 50; // T-Score Mean default
  }

  // 4. Compute Normalized Dimension Scores and Percentiles
  const dimensionPercentiles: Record<string, number> = {};
  const normalizedDimensionScores: Record<string, number> = {};

  dimensions.forEach(d => {
    const raw = dimensionTotals[d.name] !== undefined ? dimensionTotals[d.name] : (student.dimensionScores ? student.dimensionScores[d.name] || 0 : 0);
    const dimQuestions = questions.filter(q => q.dimension === d.name || q.dimension === d.code);
    const answeredDimQuestions = dimQuestions.filter(q => studentAnswers[q.id] !== undefined);
    const activeQuestions = answeredDimQuestions.length > 0 ? answeredDimQuestions : dimQuestions;

    let maxDimRaw = activeQuestions.reduce((acc, q) => {
      const maxVal = q.choices ? Math.max(...q.choices.map(c => (c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : (c.isCorrect ? 1 : 0))), 1) : 1;
      return acc + maxVal;
    }, 0);

    if (maxDimRaw === 0) {
      maxDimRaw = raw > 20 ? 100 : (raw > 0 ? raw : 20);
    }

    // Standardized Normalized Score (0 - 100%)
    const percentage = Math.min(100, Math.max(0, Math.round((raw / maxDimRaw) * 100)));
    normalizedDimensionScores[d.name] = percentage;
    
    // Percentile ranking relative to population curve
    const dimZ = calculateZScore(percentage, 50, 20);
    dimensionPercentiles[d.name] = zToPercentileRank(dimZ);
  });

  // 5. Evaluate Validity & Response Bias
  const validity = evaluateTestValidity(student, questions);

  // 6. Update Student Object directly for backward compatibility
  student.iqScore = finalIqScore;
  student.eqScore = finalEqScore;
  student.riasecScores = hollandTotals;
  student.dimensionScores = dimensionTotals;

  // Store validity result inside student.aiAnalysis safely (handling string, object, or null)
  if (!student.aiAnalysis || typeof student.aiAnalysis !== 'object') {
    student.aiAnalysis = { narrativeSummary: typeof student.aiAnalysis === 'string' ? student.aiAnalysis : undefined };
  }
  student.aiAnalysis.validity = validity;
  student.aiAnalysis.confidenceScore = validity.confidenceScore;
  student.aiAnalysis.validityStatus = validity.status;
  student.aiAnalysis.hasPotentialIssues = validity.status !== 'VALID' || finalEqScore < 40 || finalIqScore < 90;

  return {
    iqScore: finalIqScore,
    eqScore: finalEqScore,
    riasecScores: hollandTotals,
    dimensionScores: dimensionTotals,
    dimensionPercentiles,
    validity
  };
}
