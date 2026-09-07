import { Question } from '../core/types';
import { classifyQuestionItem } from '../services/itemClassifierService';

/**
 * Robust CSV line splitter that respects quoted strings containing commas.
 */
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function inferHollandCode(dimension: string): 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | undefined {
  const d = dimension.toLowerCase();
  if (d.includes('realistic') || d.includes('mekanik')) return 'R';
  if (d.includes('investigative') || d.includes('analitis') || d.includes('riset')) return 'I';
  if (d.includes('artistic') || d.includes('kreatif') || d.includes('seni')) return 'A';
  if (d.includes('social') || d.includes('edukasi') || d.includes('pelayanan')) return 'S';
  if (d.includes('enterprising') || d.includes('bisnis') || d.includes('persuasi')) return 'E';
  if (d.includes('conventional') || d.includes('terstruktur') || d.includes('detail')) return 'C';
  return undefined;
}

export function parseVocationalQuestionsCsv(csvData: string, packageId: string): Question[] {
  const lines = csvData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions: Question[] = [];

  for (const line of lines) {
    if (line.startsWith('ID,Jenis_Tes') || line.startsWith('ID,')) continue;

    const cols = splitCsvLine(line);
    if (cols.length < 15) continue;

    const [
      id,
      jenisTes,
      dimensi,
      pertanyaan,
      gambarSoal,
      opsiA, skorA,
      opsiB, skorB,
      opsiC, skorC,
      opsiD, skorD,
      opsiE, skorE,
      kunciJawaban,
      lisensiKhusus,
      konteksInstansi
    ] = cols;

    const testType = jenisTes?.trim() || 'EQ';
    const hollandCode = testType.toUpperCase() === 'HOLLAND' ? inferHollandCode(dimensi) : undefined;
    const isIq = testType.toUpperCase() === 'IQ';

    const choices = [
      { id: `${id}-A`, text: opsiA || '', scoreValue: Number(skorA) || 0, hollandType: hollandCode },
      { id: `${id}-B`, text: opsiB || '', scoreValue: Number(skorB) || 0, hollandType: hollandCode },
      { id: `${id}-C`, text: opsiC || '', scoreValue: Number(skorC) || 0, hollandType: hollandCode },
      { id: `${id}-D`, text: opsiD || '', scoreValue: Number(skorD) || 0, hollandType: hollandCode },
      { id: `${id}-E`, text: opsiE || '', scoreValue: Number(skorE) || 0, hollandType: hollandCode },
    ].filter(c => c.text.length > 0);

    const correctKey = kunciJawaban ? kunciJawaban.trim().toUpperCase() : '';
    const correctChoiceId = correctKey ? `${id}-${correctKey}` : undefined;

    const normalizedContext = (konteksInstansi?.trim() || '').toLowerCase();
    const applicableContexts = (normalizedContext && normalizedContext !== 'global' && normalizedContext !== 'semua instansi')
      ? [normalizedContext]
      : [];

    const rawQuestion: Question = {
      id: id.trim(),
      testType: testType,
      dimension: dimensi?.trim() || 'Umum',
      text: pertanyaan?.trim() || '',
      imageUrl: gambarSoal && gambarSoal.trim().length > 0 ? gambarSoal.trim() : undefined,
      choices,
      scoringType: isIq ? 'binary' : 'weighted',
      correctChoiceId,
      packageId,
      educationLevel: 'SMA',
      licenseCode: lisensiKhusus?.trim() || 'global',
      applicableContexts,
      verificationStatus: 'VERIFIED'
    };

    questions.push(classifyQuestionItem(rawQuestion));
  }

  return questions;
}
