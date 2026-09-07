import { Dimension } from './types';

export type NormalizedTestType = 'IQ' | 'EQ' | 'Holland' | 'Kepribadian' | 'Kepemimpinan' | 'Validitas' | string;

/**
 * Universal TestType Resolver
 * Resolves the effective test type of a question, item, or score object
 * by analyzing explicit testType fields, fallback dimension cross-references,
 * and semantic dimension keywords.
 */
export function resolveEffectiveTestType(
  item: { testType?: string | null; dimension?: string | null },
  masterDimensions: Dimension[] = []
): string {
  if (!item) return '';

  const rawType = (item.testType || '').trim();

  // 1. Direct Normalization from testType
  if (rawType) {
    const lowerType = rawType.toLowerCase();
    if (lowerType === 'iq' || lowerType.includes('kognitif') || lowerType.includes('penalaran') || lowerType.includes('cognitive')) {
      return 'IQ';
    }
    if (lowerType === 'eq' || lowerType.includes('emosi') || lowerType.includes('emotional') || lowerType.includes('sikap')) {
      return 'EQ';
    }
    if (lowerType === 'holland' || lowerType.includes('riasec') || lowerType.includes('minat') || lowerType.includes('vokasi')) {
      return 'Holland';
    }
    if (lowerType.includes('pribadi') || lowerType.includes('personality')) {
      return 'Kepribadian';
    }
    if (lowerType.includes('pimpin') || lowerType.includes('leadership')) {
      return 'Kepemimpinan';
    }
    if (lowerType.includes('valid')) {
      return 'Validitas';
    }
    // Return formatted raw if not standard
    return rawType;
  }

  // 2. Cross-reference with Master Dimensions
  const rawDim = (item.dimension || '').trim();
  if (rawDim && masterDimensions && masterDimensions.length > 0) {
    const lowerDim = rawDim.toLowerCase();
    const matchedDim = masterDimensions.find(d => {
      const dName = (d.name || '').trim().toLowerCase();
      const dCode = (d.code || '').trim().toLowerCase();
      const dId = (d.id || '').trim().toLowerCase();
      return dName === lowerDim || dCode === lowerDim || dId === lowerDim;
    });

    if (matchedDim && matchedDim.testType) {
      return resolveEffectiveTestType({ testType: matchedDim.testType }, masterDimensions);
    }
  }

  // 3. Heuristic / Semantic Keyword Matcher on Dimension String
  if (rawDim) {
    const lowerDim = rawDim.toLowerCase();
    
    // EQ Dimensions
    if (
      lowerDim.includes('kesadaran diri') ||
      lowerDim.includes('self-awareness') ||
      lowerDim.includes('self awareness') ||
      lowerDim.includes('pengendalian emosi') ||
      lowerDim.includes('self-control') ||
      lowerDim.includes('self control') ||
      lowerDim.includes('empati') ||
      lowerDim.includes('empathy') ||
      lowerDim.includes('resiliensi') ||
      lowerDim.includes('resilience') ||
      lowerDim.includes('regulasi') ||
      lowerDim.includes('interpersonal') ||
      lowerDim.includes('motivasi')
    ) {
      return 'EQ';
    }

    // IQ Dimensions
    if (
      lowerDim.includes('verbal') ||
      lowerDim.includes('bahasa') ||
      lowerDim.includes('logika') ||
      lowerDim.includes('abstrak') ||
      lowerDim.includes('spasial') ||
      lowerDim.includes('spatial') ||
      lowerDim.includes('angka') ||
      lowerDim.includes('kuantitatif') ||
      lowerDim.includes('numerical') ||
      lowerDim.includes('analogi') ||
      lowerDim.includes('aritmatika')
    ) {
      return 'IQ';
    }

    // Holland RIASEC Dimensions
    if (
      lowerDim.includes('realistic') ||
      lowerDim.includes('investigative') ||
      lowerDim.includes('artistic') ||
      lowerDim.includes('social') ||
      lowerDim.includes('enterprising') ||
      lowerDim.includes('conventional') ||
      lowerDim.includes('riasec')
    ) {
      return 'Holland';
    }

    // Other standard dimensions
    if (lowerDim.includes('disiplin') || lowerDim.includes('kerjasama') || lowerDim.includes('adaptasi')) {
      return 'Kepribadian';
    }
  }

  return rawType || '';
}

/**
 * Checks whether an item matches a specific test type filter accurately
 */
export function matchesTestTypeFilter(
  item: { testType?: string | null; dimension?: string | null },
  filterValue: string,
  masterDimensions: Dimension[] = []
): boolean {
  if (!filterValue || filterValue === 'All' || filterValue === 'Semua') {
    return true;
  }

  const effective = resolveEffectiveTestType(item, masterDimensions);
  return effective.trim().toUpperCase() === filterValue.trim().toUpperCase();
}
