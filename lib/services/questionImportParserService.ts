import { Question, Dimension } from '../core/types';
import { classifyQuestionItem } from './itemClassifierService';
import { normalizeCanonicalDimension, CANONICAL_DIMENSIONS } from '../metadata/canonicalDimensions';

export interface ParsedQuestionItem {
  rawIndex: number;
  rawId: string;
  question: Question;
  status: 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  detectedDimension: string;
  mappedDimension: string;
  detectedTestType: 'IQ' | 'EQ' | 'Holland';
  isAutoId?: boolean;
  isCollision?: boolean;
  correctAnswerKey?: string;
}

export interface DimensionMappingSummary {
  sourceDimension: string;
  targetDimension: string;
  testType: 'IQ' | 'EQ' | 'Holland';
  itemCount: number;
  existsInMaster: boolean;
  willAutoCreate: boolean;
}

export interface QuestionImportAnalysisResult {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  autoIdCount: number;
  collisionCount: number;
  items: ParsedQuestionItem[];
  dimensionMappings: DimensionMappingSummary[];
  newDimensionsCount: number;
  testTypeCounts: Record<string, number>;
}

export function generateSmartQuestionId(
  testType: 'IQ' | 'EQ' | 'Holland' | string,
  existingQuestions: Question[],
  sequenceIndex: number
): string {
  const normType = String(testType || '').toUpperCase().trim();
  let prefix = 'Q';
  if (normType.includes('IQ') || normType.includes('KOGNITIF')) {
    prefix = 'Q-IQ';
  } else if (normType.includes('EQ') || normType.includes('EMOSI')) {
    prefix = 'Q-EQ';
  } else if (normType.includes('HOLLAND') || normType.includes('RIASEC') || normType.includes('MINAT')) {
    prefix = 'Q-HOL';
  }

  // Scan existing questions with this prefix to find highest number across multiple ID formats
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
  const typeRegex = new RegExp(`^(${prefix}|IQ|EQ|HOL)-?(\\d+)$`, 'i');
  const numericRegex = /^(\d+)$/;

  existingQuestions.forEach(q => {
    const idStr = String(q.id).trim();
    const match = idStr.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
      return;
    }
    const typeMatch = idStr.match(typeRegex);
    if (typeMatch && typeMatch[2]) {
      const num = parseInt(typeMatch[2], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
      return;
    }
    const numMatch = idStr.match(numericRegex);
    if (numMatch && numMatch[1]) {
      const num = parseInt(numMatch[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  // Ensure offset exceeds existing total questions count to guarantee no overlap in append mode
  if (existingQuestions.length > maxNum) {
    maxNum = existingQuestions.length;
  }

  const nextNum = maxNum + sequenceIndex + 1;
  const padded = String(nextNum).padStart(3, '0');
  return `${prefix}-${padded}`;
}

export function analyzeAndMapQuestionRows(
  rows: any[],
  masterDimensions: Dimension[],
  existingQuestions: Question[] = []
): QuestionImportAnalysisResult {
  const items: ParsedQuestionItem[] = [];
  const dimensionMap: Record<string, { count: number; testType: 'IQ' | 'EQ' | 'Holland'; exists: boolean }> = {};
  const testTypeCounts: Record<string, number> = { IQ: 0, EQ: 0, Holland: 0 };
  const autoIdCounters: Record<string, number> = { IQ: 0, EQ: 0, Holland: 0, General: 0 };
  let autoIdCount = 0;
  let collisionCount = 0;

  const masterDimNames = new Set(masterDimensions.map(d => d.name.trim().toLowerCase()));
  const masterDimMap = new Map(masterDimensions.map(d => [d.name.trim().toLowerCase(), d]));

  rows.forEach((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Flexible extraction
    const getVal = (...keys: string[]): any => {
      const normalizedRow: Record<string, any> = {};
      for (const rawKey of Object.keys(row)) {
        normalizedRow[rawKey.trim().toUpperCase().replace(/[\s_]+/g, '')] = row[rawKey];
      }
      for (const k of keys) {
        const normK = k.trim().toUpperCase().replace(/[\s_]+/g, '');
        if (normalizedRow[normK] !== undefined && normalizedRow[normK] !== null) {
          return normalizedRow[normK];
        }
      }
      return undefined;
    };

    const rawExplicitId = getVal('ID', 'questionId', 'id_soal', 'soalId', 'KodeSoal', 'Question_ID', 'ID_SOAL');
    const rawRowNumber = getVal('NO', 'NOSOAL', 'NUM', 'No', 'Nomor', 'ItemNumber', 'No_Urut');
    const rawId = rawExplicitId || rawRowNumber;
    const rawJenisTes = getVal('Jenis_Tes', 'jenis_tes', 'JenisTes', 'testType', 'test_type', 'TipeTes', 'Tipe', 'Jenis', 'KategoriTes');
    const rawDimensi = getVal('Dimensi', 'dimension', 'aspek', 'NamaDimensi', 'AspekPsikologi', 'Kategori', 'SubTes', 'Bidang');
    const rawPertanyaan = getVal('Pertanyaan', 'question', 'text', 'soal', 'Pernyataan', 'PernyataanSoal', 'ButirSoal', 'IsiSoal', 'DeskripsiSoal');

    // Key answer for IQ / Cognitive questions
    const rawKunci = getVal(
      'Kunci_Jawaban', 'KunciJawaban', 'kunci', 'Kunci', 'JawabanBenar', 
      'Jawaban_Benar', 'CorrectAnswer', 'Key', 'Kunci_Soal', 'Jawaban'
    );
    let normKey: string | undefined = undefined;
    if (rawKunci !== undefined && rawKunci !== null && String(rawKunci).trim() !== '') {
      const cleanKey = String(rawKunci).trim().toUpperCase();
      const match = cleanKey.match(/\b([A-E])\b/) || cleanKey.match(/^([A-E])$/);
      if (match) {
        normKey = match[1];
      }
    }

    // Choices & Scores
    const Opsi_A = getVal('Opsi_A', 'Osci_A', 'OpsiA', 'a', 'opsi1', 'jawaban_a', 'pilihan_a', 'PilihanA', 'OptionA');
    const Skor_A = getVal('Skor_A', 'SkorA', 'score_a', 'nilai_a', 'skor1', 'BobotA');
    
    const Opsi_B = getVal('Opsi_B', 'OpsiB', 'b', 'opsi2', 'jawaban_b', 'pilihan_b', 'PilihanB', 'OptionB');
    const Skor_B = getVal('Skor_B', 'SkorB', 'score_b', 'nilai_b', 'skor2', 'BobotB');
    
    const Opsi_C = getVal('Opsi_C', 'OpsiC', 'c', 'opsi3', 'jawaban_c', 'pilihan_c', 'PilihanC', 'OptionC');
    const Skor_C = getVal('Skor_C', 'SkorC', 'score_c', 'nilai_c', 'skor3', 'BobotC');
    
    const Opsi_D = getVal('Opsi_D', 'OpsiD', 'd', 'opsi4', 'jawaban_d', 'pilihan_d', 'PilihanD', 'OptionD');
    const Skor_D = getVal('Skor_D', 'SkorD', 'score_d', 'nilai_d', 'skor4', 'BobotD');

    const Opsi_E = getVal('Opsi_E', 'OpsiE', 'e', 'opsi5', 'jawaban_e', 'pilihan_e', 'PilihanE', 'OptionE');
    const Skor_E = getVal('Skor_E', 'SkorE', 'score_e', 'nilai_e', 'skor5', 'BobotE');
    
    const Tipe_Holland = getVal('Tipe_Holland', 'TipeHolland', 'hollandType', 'holland_type', 'tipe', 'riasec', 'KodeHolland');
    const Gambar = getVal('Gambar', 'GambarSoal', 'GambarURL', 'ImageUrl', 'Image_Url', 'URLGambar', 'Foto');
    const Lisensi = getVal('LisensiKhusus', 'licenseCode', 'license_code', 'lisensi', 'AksesLisensi');
    const Konteks = getVal('KonteksInstansi', 'applicableContexts', 'applicable_contexts', 'konteks', 'InstansiTarget');
    const Jenjang = getVal('TingkatPendidikan', 'educationLevel', 'education_level', 'jenjang', 'TargetJenjang');
    const Kesulitan = getVal('TingkatKesulitan', 'difficultyLevel', 'difficulty_level', 'kesulitan', 'LevelKesulitan');

    if (!rawPertanyaan || String(rawPertanyaan).trim() === '') {
      errors.push('Teks pertanyaan/pernyataan kosong.');
    }

    // Auto-detect Dimension & Test Type
    let detectedDim = rawDimensi ? String(rawDimensi).trim() : 'General';
    let detectedType: 'IQ' | 'EQ' | 'Holland' = normKey ? 'IQ' : 'Holland';

    if (rawJenisTes) {
      const normType = String(rawJenisTes).toUpperCase().trim();
      if (normType.includes('IQ') || normType.includes('KOGNITIF') || normType.includes('LOGIKA')) {
        detectedType = 'IQ';
      } else if (normType.includes('EQ') || normType.includes('EMOSI') || normType.includes('KEPRIBADIAN')) {
        detectedType = 'EQ';
      } else if (normType.includes('HOLLAND') || normType.includes('RIASEC') || normType.includes('MINAT')) {
        detectedType = 'Holland';
      }
    } else {
      // Heuristic detection based on dimension, text, and presence of answer key
      const lowerDim = detectedDim.toLowerCase();
      const lowerText = String(rawPertanyaan || '').toLowerCase();
      
      if (['realistic', 'investigative', 'artistic', 'social', 'enterprising', 'conventional'].some(d => lowerDim.includes(d)) || Tipe_Holland) {
        detectedType = 'Holland';
      } else if (normKey || lowerDim.includes('spasial') || lowerDim.includes('numerik') || lowerDim.includes('deret') || lowerDim.includes('verbal') || lowerDim.includes('logika') || lowerText.includes('pola bilangan') || lowerText.includes('deret')) {
        detectedType = 'IQ';
      } else if (lowerDim.includes('emosi') || lowerDim.includes('stres') || lowerDim.includes('empati') || lowerDim.includes('interpersonal') || lowerDim.includes('resiliensi')) {
        detectedType = 'EQ';
      }
    }

    // Automatically map and standardize to official 18 canonical dimensions
    detectedDim = normalizeCanonicalDimension(detectedDim, detectedType);

    testTypeCounts[detectedType] = (testTypeCounts[detectedType] || 0) + 1;

    // Check if dimension exists in master or canonical list
    const isDimInMaster = masterDimNames.has(detectedDim.toLowerCase()) || CANONICAL_DIMENSIONS.some(d => d.name.toLowerCase() === detectedDim.toLowerCase());
    if (!isDimInMaster) {
      warnings.push(`Dimensi "${detectedDim}" belum ada di master data.`);
    }

    // Register into dimension summary
    if (!dimensionMap[detectedDim]) {
      dimensionMap[detectedDim] = {
        count: 0,
        testType: detectedType,
        exists: isDimInMaster
      };
    }
    dimensionMap[detectedDim].count++;

    // Safe ID generation: Auto vs Manual
    // If only row number (No, Nomor) is present without explicit ID, treat as auto-generated ID to prevent collision
    const isPureRowNumber = !rawExplicitId && rawRowNumber !== undefined && rawRowNumber !== null && String(rawRowNumber).trim() !== '';
    const isRawIdBlank = !rawId || ['AUTO', 'auto', '-', '?', 'N/A', 'NONE'].includes(String(rawId).trim()) || isPureRowNumber;
    let finalId = '';
    let isAutoId = false;
    let isCollision = false;

    if (isRawIdBlank) {
      isAutoId = true;
      autoIdCount++;
      const counterKey = detectedType || 'General';
      const seq = autoIdCounters[counterKey] || 0;
      autoIdCounters[counterKey] = seq + 1;
      finalId = generateSmartQuestionId(detectedType, existingQuestions, seq);
    } else {
      finalId = String(rawId).trim();
      isCollision = existingQuestions.some(q => String(q.id).toLowerCase() === finalId.toLowerCase());
      if (isCollision) {
        collisionCount++;
        warnings.push(`ID "${finalId}" sudah ada di database (bisa menimpa data lama atau diberi ID baru secara aman).`);
      }
    }

    // Build choices
    const choices: any[] = [];
    const pushChoice = (opt: any, score: any, defaultText: string, letter: string, defScore: number) => {
      const text = opt !== undefined && opt !== null && String(opt).trim() !== '' ? String(opt).trim() : defaultText;
      if (text) {
        let numScore = defScore;
        if (score !== undefined && score !== null && !isNaN(Number(score))) {
          numScore = Number(score);
        } else if (normKey) {
          // Automatic scoring if Kunci_Jawaban is used
          numScore = normKey === letter.toUpperCase() ? 1 : 0;
        }

        let hollandCode = Tipe_Holland ? String(Tipe_Holland).trim().toUpperCase() : undefined;
        if (detectedType === 'Holland' && !hollandCode) {
          // Infer Holland code from dimension if possible
          const dUpper = detectedDim.toUpperCase();
          if (dUpper.startsWith('R') || dUpper.includes('REALISTIC')) hollandCode = 'R';
          else if (dUpper.startsWith('I') || dUpper.includes('INVESTIGATIVE')) hollandCode = 'I';
          else if (dUpper.startsWith('A') || dUpper.includes('ARTISTIC')) hollandCode = 'A';
          else if (dUpper.startsWith('S') || dUpper.includes('SOCIAL')) hollandCode = 'S';
          else if (dUpper.startsWith('E') || dUpper.includes('ENTERPRISING')) hollandCode = 'E';
          else if (dUpper.startsWith('C') || dUpper.includes('CONVENTIONAL')) hollandCode = 'C';
        }

        choices.push({
          id: `${finalId}-${letter.toLowerCase()}`,
          text,
          scoreValue: numScore,
          ...(hollandCode ? { hollandType: hollandCode } : {})
        });
      }
    };

    const isLikertEQ = detectedType === 'EQ';
    const defScoreA = normKey ? (normKey === 'A' ? 1 : 0) : isLikertEQ ? 4 : 2;
    const defScoreB = normKey ? (normKey === 'B' ? 1 : 0) : isLikertEQ ? 3 : 1;
    const defScoreC = normKey ? (normKey === 'C' ? 1 : 0) : isLikertEQ ? 2 : 0;
    const defScoreD = normKey ? (normKey === 'D' ? 1 : 0) : isLikertEQ ? 1 : 0;
    const defScoreE = normKey ? (normKey === 'E' ? 1 : 0) : 0;

    pushChoice(Opsi_A, Skor_A, normKey ? 'Pilihan A' : 'Sangat Sesuai', 'a', defScoreA);
    pushChoice(Opsi_B, Skor_B, normKey ? 'Pilihan B' : 'Sesuai', 'b', defScoreB);
    if (Opsi_C !== undefined || Skor_C !== undefined || (normKey && ['C', 'D', 'E'].includes(normKey))) {
      pushChoice(Opsi_C, Skor_C, normKey ? 'Pilihan C' : 'Kurang Sesuai', 'c', defScoreC);
    }
    if (Opsi_D !== undefined || Skor_D !== undefined || (normKey && ['D', 'E'].includes(normKey))) {
      pushChoice(Opsi_D, Skor_D, normKey ? 'Pilihan D' : 'Tidak Sesuai', 'd', defScoreD);
    }
    if (Opsi_E !== undefined || Skor_E !== undefined || (normKey && normKey === 'E')) {
      pushChoice(Opsi_E, Skor_E, normKey ? 'Pilihan E' : 'Sangat Tidak Sesuai', 'e', defScoreE);
    }

    if (choices.length < 2) {
      errors.push('Soal harus memiliki minimal 2 pilihan jawaban (Opsi A dan B).');
    } else if (choices.length === 2) {
      warnings.push('Hanya terdapat 2 opsi pilihan jawaban (Opsi A dan B).');
    }

    const unclassifiedQuestion: Question = {
      id: finalId,
      testType: detectedType,
      dimension: detectedDim,
      text: String(rawPertanyaan || '').trim(),
      choices,
      ...(Gambar ? { imageUrl: String(Gambar).trim() } : {}),
      ...(Lisensi ? { licenseCode: String(Lisensi).trim() } : {}),
      ...(Konteks ? { applicableContexts: String(Konteks).split(',').map((s: string) => s.trim()).filter(Boolean) } : {}),
      ...(Jenjang ? { educationLevel: String(Jenjang).trim() } : {}),
      ...(Kesulitan ? { difficultyLevel: String(Kesulitan).trim() as any } : {})
    };

    const classifiedQuestion = classifyQuestionItem(unclassifiedQuestion);

    let status: 'valid' | 'warning' | 'error' = 'valid';
    if (errors.length > 0) {
      status = 'error';
    } else if (warnings.length > 0) {
      status = 'warning';
    }

    items.push({
      rawIndex: idx,
      rawId: String(rawId || finalId),
      question: classifiedQuestion,
      status,
      errors,
      warnings,
      detectedDimension: detectedDim,
      mappedDimension: detectedDim,
      detectedTestType: detectedType,
      isAutoId,
      isCollision,
      correctAnswerKey: normKey
    });
  });

  const dimensionMappings: DimensionMappingSummary[] = Object.entries(dimensionMap).map(([name, meta]) => ({
    sourceDimension: name,
    targetDimension: name,
    testType: meta.testType,
    itemCount: meta.count,
    existsInMaster: meta.exists,
    willAutoCreate: !meta.exists
  }));

  const validCount = items.filter(i => i.status === 'valid').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const errorCount = items.filter(i => i.status === 'error').length;
  const newDimensionsCount = dimensionMappings.filter(d => !d.existsInMaster).length;

  return {
    totalRows: items.length,
    validCount,
    warningCount,
    errorCount,
    autoIdCount,
    collisionCount,
    items,
    dimensionMappings,
    newDimensionsCount,
    testTypeCounts
  };
}

