import { Student, Question } from '../types';
import { ValidityResult } from './types';

/**
 * Evaluates Variable Response Inconsistency (VRIN) scale across paired questions.
 */
export function checkVRINConsistency(student: Student, questions: Question[]): { vrinScore: number; flags: string[] } {
  const flags: string[] = [];
  let vrinScore = 0;
  const answers = student.answers || {};

  // Paired item validation: check explicitly tagged validationType pairs
  const valCon1a = questions.find(q => q.validationType === 'val-con-1a');
  const valCon1b = questions.find(q => q.validationType === 'val-con-1b');
  if (valCon1a && valCon1b && answers[valCon1a.id] && answers[valCon1b.id]) {
    if (answers[valCon1a.id] !== answers[valCon1b.id]) {
      vrinScore += 1;
      flags.push('Inkonsistensi respons pada pasangan item kontrol VRIN-1');
    }
  }

  const valCon2a = questions.find(q => q.validationType === 'val-con-2a');
  const valCon2b = questions.find(q => q.validationType === 'val-con-2b');
  if (valCon2a && valCon2b && answers[valCon2a.id] && answers[valCon2b.id]) {
    if (answers[valCon2a.id] !== answers[valCon2b.id]) {
      vrinScore += 1;
      flags.push('Inkonsistensi respons pada pasangan item kontrol VRIN-2');
    }
  }

  // Check cross-module consistency (e.g. realistic preference vs Holland R score)
  const crossReal = questions.filter(q => q.validationType === 'val-cross-1' && answers[q.id]);
  if (crossReal.length > 0 && student.riasecScores) {
    const avgChoice = crossReal.reduce((acc, q) => {
      const choice = q.choices?.find(c => c.id === answers[q.id]);
      return acc + (choice?.scoreValue || 0);
    }, 0) / crossReal.length;

    const hollandR = student.riasecScores.R || 0;
    // Proper contradiction: claimed high preference (>=3) but holland R is very low (<=2)
    // or claimed low preference (<=1) but holland R is very high (>=8)
    if ((avgChoice >= 3 && hollandR <= 2) || (avgChoice <= 1 && hollandR >= 8)) {
      vrinScore += 1;
      flags.push('Terdapat kontradiksi antara minat teknik dan skor Holland Realistik');
    }
  }

  return { vrinScore, flags };
}

/**
 * Evaluates Social Desirability / Lie Scale (Faking Good).
 */
export function checkSocialDesirability(student: Student, questions: Question[]): { lieScore: number; flags: string[] } {
  const flags: string[] = [];
  let lieScore = 0;
  const answers = student.answers || {};

  // Lie scale questions tagged with validationType 'val-cross-2' or dimension 'Lie Scale' / 'Kejujuran'
  const lieQuestions = questions.filter(q => 
    q.validationType === 'val-cross-2' || 
    q.dimension?.toLowerCase().includes('lie') || 
    q.dimension?.toLowerCase().includes('kejujuran')
  );

  lieQuestions.forEach(q => {
    const selectedId = answers[q.id];
    if (selectedId) {
      const choice = q.choices?.find(c => c.id === selectedId);
      if (choice && choice.scoreValue >= 4) {
        lieScore += 1;
      }
    }
  });

  if (lieScore >= 3) {
    flags.push('Kecenderungan Faking Good / Social Desirability tinggi (Mencitrakan diri terlalu sempurna)');
  }

  return { lieScore, flags };
}

/**
 * Evaluates Speeding & Latency (Random clicking / completion speed).
 */
export function checkSpeedingLatency(student: Student, questions: Question[]): { speedingFlag: boolean; flags: string[] } {
  const flags: string[] = [];
  let speedingFlag = false;

  const answers = student.answers || {};
  const answeredCount = Object.keys(answers).length;

  // Check cheat warnings or lockout
  if (student.cheatWarnings && student.cheatWarnings >= 3) {
    flags.push('Peringatan kecurangan melebihi ambang batas (>=3 kali keluar dari aplikasi)');
    speedingFlag = true;
  }

  // Check completion time if recorded
  if (student.timeSpentSeconds && answeredCount > 10) {
    const avgTimePerItem = student.timeSpentSeconds / answeredCount;
    if (avgTimePerItem < 2.0) {
      speedingFlag = true;
      flags.push(`Waktu pengerjaan terlalu cepat (${avgTimePerItem.toFixed(1)} detik/soal, batas minimal 2.0s/soal)`);
    }
  }

  return { speedingFlag, flags };
}

/**
 * Unified Test Validity Evaluator.
 */
export function evaluateTestValidity(student: Student, questions: Question[]): ValidityResult {
  const { vrinScore, flags: vrinFlags } = checkVRINConsistency(student, questions);
  const { lieScore, flags: lieFlags } = checkSocialDesirability(student, questions);
  const { speedingFlag, flags: speedingFlags } = checkSpeedingLatency(student, questions);

  const allFlags = [...vrinFlags, ...lieFlags, ...speedingFlags];

  let status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID' = 'VALID';
  let confidenceScore = 95;

  if (speedingFlag || vrinScore >= 3) {
    status = 'INVALID';
    confidenceScore = 35;
  } else if (vrinScore > 0 || lieScore >= 2 || allFlags.length > 0) {
    status = 'NEEDS_REVIEW';
    confidenceScore = 70;
  }

  const reasoning = status === 'VALID' 
    ? 'Hasil tes konsisten, jujur, dan memenuhi standar durasi pengerjaan psikometri.'
    : status === 'NEEDS_REVIEW'
    ? `Hasil tes memerlukan perhatian khusus psikolog. Catatan: ${allFlags.join('; ')}.`
    : `Hasil tes dinilai TIDAK VALID untuk interpretasi diagnostik. Alasan: ${allFlags.join('; ')}.`;

  return {
    status,
    confidenceScore,
    flags: allFlags,
    vrinScore,
    lieScore,
    speedingFlag,
    reasoning
  };
}
