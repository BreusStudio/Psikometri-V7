import { Student, Question, Dimension } from '../types';
import { normalizeCanonicalDimension } from '../metadata/canonicalDimensions';

/**
 * Calculates item-level score considering binary correctness, unfavorable reverse scoring, and custom optionScores
 */
export function calculateItemScore(q: Question, selectedChoiceId: string): number {
  if (!selectedChoiceId) return 0;
  const choice = q.choices?.find(c => String(c.id) === String(selectedChoiceId));
  if (!choice) return 0;

  // 1. Custom explicit option score mapping if provided
  if (q.optionScores && q.optionScores[selectedChoiceId] !== undefined) {
    return Number(q.optionScores[selectedChoiceId]) || 0;
  }

  const testType = (q.testType || '').toUpperCase().trim();
  const scoringType = q.scoringType || (testType === 'IQ' ? 'binary' : 'likert');

  // 2. Binary scoring (Single Correct Answer / Kognitif / IQ)
  if (scoringType === 'binary' || testType === 'IQ') {
    if (q.correctChoiceId) {
      return String(q.correctChoiceId) === String(selectedChoiceId) ? (choice.scoreValue ?? 1) : 0;
    }
    if (choice.isCorrect === true) {
      return choice.scoreValue !== undefined && choice.scoreValue !== null && choice.scoreValue > 0 
        ? choice.scoreValue 
        : 1;
    }
    return choice.scoreValue && choice.scoreValue > 0 ? choice.scoreValue : 0;
  }

  // 3. Likert / Graduated scoring (EQ, Sikap, Kepribadian)
  let baseScore = choice.scoreValue;
  if (baseScore === undefined || baseScore === null) {
    // If choice scoreValue is not defined, infer 1..N based on choice index
    const choiceIdx = q.choices?.findIndex(c => String(c.id) === String(selectedChoiceId)) ?? -1;
    baseScore = choiceIdx >= 0 ? choiceIdx + 1 : 1;
  }

  // 4. Unfavorable / Reverse Scoring for Likert or Graduated scales
  if (q.isUnfavorable && q.choices && q.choices.length > 1) {
    const scores = q.choices.map((c, idx) => 
      c.scoreValue !== undefined && c.scoreValue !== null ? c.scoreValue : idx + 1
    );
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    baseScore = (max + min) - baseScore;
  }

  return Number(baseScore) || 0;
}

/**
 * Aggregates raw scores for IQ, EQ, RIASEC, and Dimensions with strict canonical normalization.
 */
export function aggregateDimensionRawScores(
  student: Student,
  questions: Question[],
  dimensions: Dimension[]
) {
  let rawIq = 0;
  let rawEq = 0;
  const hollandTotals: Record<'R' | 'I' | 'A' | 'S' | 'E' | 'C', number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const studentAnswers = student.answers || {};
  const hasAnswers = Object.keys(studentAnswers).length > 0;

  const dimensionTotals: Record<string, number> = {};

  // If student has existing dimensionScores (e.g. from preset or imported without answers), normalize the keys
  if (student.dimensionScores && typeof student.dimensionScores === 'object') {
    Object.entries(student.dimensionScores).forEach(([k, v]) => {
      const canonicalKey = normalizeCanonicalDimension(k);
      dimensionTotals[canonicalKey] = Math.max(dimensionTotals[canonicalKey] || 0, Number(v) || 0);
    });
  }

  // Initialize all canonical master dimensions with 0 if absent
  dimensions.forEach(d => {
    const canonicalKey = normalizeCanonicalDimension(d.name, d.testType);
    if (dimensionTotals[canonicalKey] === undefined) {
      dimensionTotals[canonicalKey] = 0;
    }
  });

  if (hasAnswers) {
    // Clear out to recount freshly from answers to avoid stale aggregation
    const freshTotals: Record<string, number> = {};
    dimensions.forEach(d => {
      const canonicalKey = normalizeCanonicalDimension(d.name, d.testType);
      freshTotals[canonicalKey] = 0;
    });

    questions.forEach(q => {
      const selectedChoiceId = studentAnswers[q.id];
      if (selectedChoiceId !== undefined && selectedChoiceId !== null && selectedChoiceId !== '') {
        const itemScore = calculateItemScore(q, String(selectedChoiceId));
        const choice = q.choices ? q.choices.find(c => String(c.id) === String(selectedChoiceId)) : null;

        const canonicalDim = normalizeCanonicalDimension(q.dimension || '', q.testType);
        if (freshTotals[canonicalDim] === undefined) {
          freshTotals[canonicalDim] = 0;
        }
        freshTotals[canonicalDim] += itemScore;

        const tType = (q.testType || '').toUpperCase().trim();
        if (tType === "IQ") {
          rawIq += itemScore;
        } else if (tType === "EQ") {
          rawEq += itemScore;
        } else if ((tType === "HOLLAND" || tType === "MINAT_BAKAT") && choice?.hollandType) {
          const type = choice.hollandType.toUpperCase().trim() as keyof typeof hollandTotals;
          if (hollandTotals[type] !== undefined) {
            hollandTotals[type] += itemScore > 0 ? itemScore : 1;
          }
        }
      }
    });

    return { rawIq, rawEq, hollandTotals, dimensionTotals: freshTotals };
  }

  // If no raw answers but riasecScores exists, use that
  if (student.riasecScores) {
    Object.entries(student.riasecScores).forEach(([k, v]) => {
      const code = k.toUpperCase() as keyof typeof hollandTotals;
      if (hollandTotals[code] !== undefined) {
        hollandTotals[code] = Number(v) || 0;
      }
    });
  }

  return { rawIq, rawEq, hollandTotals, dimensionTotals };
}

