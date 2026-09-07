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
export function checkSpeedingLatency(student: Student, questions: Question[]): { speedingFlag: boolean; flags: string[]; avgTimePerItem: number } {
  const flags: string[] = [];
  let speedingFlag = false;

  const answers = student.answers || {};
  const answeredCount = Object.keys(answers).length;

  // Check cheat warnings or lockout
  if (student.cheatWarnings && student.cheatWarnings >= 3) {
    flags.push('Peringatan kecurangan melebihi ambang batas (>=3 kali keluar dari jendela ujian)');
    speedingFlag = true;
  }

  // Derive total elapsed duration (in seconds)
  let totalDuration = student.examDurationSeconds || student.timeSpentSeconds || 0;
  
  // Fallback: derive from timestamps if not explicitly set
  if ((!totalDuration || totalDuration <= 0) && student.testStartedAt && student.testCompletedAt) {
    const startTime = new Date(student.testStartedAt).getTime();
    const endTime = new Date(student.testCompletedAt).getTime();
    if (endTime > startTime) {
      totalDuration = Math.round((endTime - startTime) / 1000);
    }
  }

  let avgTimePerItem = 0;
  if (answeredCount > 0 && totalDuration > 0) {
    avgTimePerItem = totalDuration / answeredCount;
  }

  // Speeding Thresholds:
  // 1. Average time < 2.5s per answered question for tests with >= 8 questions
  if (answeredCount >= 8 && totalDuration > 0) {
    if (avgTimePerItem < 2.5) {
      speedingFlag = true;
      flags.push(`Waktu pengerjaan terindikasi terlalu cepat (${avgTimePerItem.toFixed(1)} detik/soal, batas minimal wajar 2.5s/soal)`);
    }
  }

  // 2. Suspiciously fast total duration for large question counts
  if (answeredCount >= 20 && totalDuration > 0 && totalDuration < 90) {
    speedingFlag = true;
    flags.push(`Total durasi ujian tidak realistis (${totalDuration} detik untuk ${answeredCount} butir soal)`);
  }

  return { speedingFlag, flags, avgTimePerItem };
}

/**
 * Evaluates Straight-Lining and Monotonous Pattern Responses.
 */
export function checkStraightLiningPattern(student: Student, questions: Question[]): { straightLiningFlag: boolean; flags: string[] } {
  const flags: string[] = [];
  let straightLiningFlag = false;

  const answers = student.answers || {};
  if (Object.keys(answers).length < 10) {
    return { straightLiningFlag, flags };
  }

  // Inspect sequence of selected choices
  const choicePositions: number[] = [];
  questions.forEach(q => {
    const selectedId = answers[q.id];
    if (selectedId && q.choices) {
      const idx = q.choices.findIndex(c => c.id === selectedId);
      if (idx !== -1) {
        choicePositions.push(idx);
      }
    }
  });

  if (choicePositions.length >= 10) {
    let currentStreak = 1;
    let maxStreak = 1;
    let streakVal = choicePositions[0];

    for (let i = 1; i < choicePositions.length; i++) {
      if (choicePositions[i] === choicePositions[i - 1]) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakVal = choicePositions[i];
        }
      } else {
        currentStreak = 1;
      }
    }

    if (maxStreak >= 10) {
      straightLiningFlag = true;
      flags.push(`Terdeteksi pola respons monoton/straight-lining (${maxStreak} butir soal berurutan memilih posisi opsi yang sama persis [opsi #${streakVal + 1}])`);
    } else if (maxStreak >= 7) {
      flags.push(`Pola respons cenderung seragam (${maxStreak} butir berturut-turut memilih opsi yang sama)`);
    }
  }

  // Check Holland RIASEC Flatness / Lack of differentiation
  if (student.riasecScores && Object.keys(answers).length >= 12) {
    const rScores = Object.values(student.riasecScores).map(v => Number(v) || 0);
    const mean = rScores.reduce((a, b) => a + b, 0) / (rScores.length || 1);
    const variance = rScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (rScores.length || 1);

    if (variance === 0 && mean > 0) {
      flags.push('Profil minat Holland RIASEC tidak berdiferensiasi (semua dimensi bernilai identik/seragam)');
    }
  }

  return { straightLiningFlag, flags };
}

/**
 * Unified Test Validity Evaluator.
 */
export function evaluateTestValidity(student: Student, questions: Question[]): ValidityResult {
  const { vrinScore, flags: vrinFlags } = checkVRINConsistency(student, questions);
  const { lieScore, flags: lieFlags } = checkSocialDesirability(student, questions);
  const { speedingFlag, flags: speedingFlags, avgTimePerItem } = checkSpeedingLatency(student, questions);
  const { straightLiningFlag, flags: patternFlags } = checkStraightLiningPattern(student, questions);

  const allFlags = [...vrinFlags, ...lieFlags, ...speedingFlags, ...patternFlags];

  let status: 'VALID' | 'NEEDS_REVIEW' | 'INVALID' = 'VALID';
  let confidenceScore = 95;

  if (speedingFlag || straightLiningFlag || vrinScore >= 3) {
    status = 'INVALID';
    confidenceScore = speedingFlag && straightLiningFlag ? 20 : 35;
  } else if (vrinScore > 0 || lieScore >= 2 || allFlags.length > 0) {
    status = 'NEEDS_REVIEW';
    confidenceScore = 70;
  }

  const reasoning = status === 'VALID' 
    ? 'Hasil tes konsisten, jujur, dan memenuhi standar durasi pengerjaan psikometri.'
    : status === 'NEEDS_REVIEW'
    ? `Hasil tes memerlukan perhatian khusus konselor. Catatan: ${allFlags.join('; ')}.`
    : `Hasil tes dinilai TIDAK VALID untuk interpretasi diagnostik karena pola pengerjaan terburu-buru/acak. Catatan: ${allFlags.join('; ')}.`;

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
