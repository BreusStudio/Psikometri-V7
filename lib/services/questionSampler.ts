import { Question, Dimension } from '../types';

/**
 * Deterministic PRNG based on seed string (e.g. studentId + testType)
 */
function seedRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates Shuffle
 */
export function seedShuffle<T>(array: T[], seed: string): T[] {
  const rng = seedRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Identify atomic validity pairs that must always be presented together.
 * For example: val-con-1a & val-con-1b, val-con-2a & val-con-2b, val-cross-1 & val-cross-2, etc.
 */
function getPairGroupId(question: Question): string | null {
  const id = String(question.id).toLowerCase();
  if (id.includes('val-con-1')) return 'pair-val-con-1';
  if (id.includes('val-con-2')) return 'pair-val-con-2';
  if (id.includes('val-cross-1') || id.includes('val-cross-2')) return 'pair-val-cross';
  if (id.includes('val-con-') || id.includes('val-cross-') || id.includes('val-rare-')) {
    const match = id.match(/(val-(?:con|cross|rare)-\d+)/);
    if (match) return `pair-${match[1]}`;
  }
  return null;
}

/**
 * Samples questions using Proportional Stratified Sampling across dimensions
 * with Atomic Validity Coupling for paired questions.
 */
export function sampleQuestionsProportionally(
  questions: Question[],
  limit: number,
  options?: {
    studentId?: string;
    testType?: string;
    masterDimensions?: Dimension[];
    packageId?: string;
  }
): Question[] {
  if (!questions || questions.length === 0) return [];

  // Filter out archived legacy questions
  let pool = questions.filter(q => !q.archived);
  if (pool.length === 0) pool = questions;

  // If specific packageId is requested (e.g. PKG-VOKASI-A or PKG-VOKASI-B)
  const reqPkg = options?.packageId?.toUpperCase();
  if (reqPkg && reqPkg !== 'PKG-VOKASI-DYNAMIC' && reqPkg !== 'ALL') {
    const pkgPool = pool.filter(q => q.packageId?.toUpperCase() === reqPkg);
    if (pkgPool.length > 0) {
      pool = pkgPool;
    }
  }

  const seed = `${options?.studentId || 'default'}_${options?.testType || 'all'}`;
  
  // If pool size is less than or equal to requested limit, return all questions deterministically shuffled
  if (pool.length <= limit) {
    return seedShuffle(pool, seed);
  }

  // Group questions by dimension
  const dimensionGroups: Record<string, Question[]> = {};
  pool.forEach(q => {
    const dim = q.dimension || 'Umum';
    if (!dimensionGroups[dim]) {
      dimensionGroups[dim] = [];
    }
    dimensionGroups[dim].push(q);
  });

  const dimensionNames = Object.keys(dimensionGroups);
  const totalPoolSize = pool.length;

  // 1. Calculate quota per dimension (ensuring at least 1 question per dimension if limit allows)
  const dimensionQuotas: Record<string, number> = {};
  let totalAllocated = 0;

  dimensionNames.forEach(dim => {
    const poolForDim = dimensionGroups[dim].length;
    let target = Math.max(1, Math.round((poolForDim / totalPoolSize) * limit));
    if (target > poolForDim) target = poolForDim;
    dimensionQuotas[dim] = target;
    totalAllocated += target;
  });

  // Adjust totalAllocated to match limit exactly
  while (totalAllocated > limit) {
    const reducibleDims = dimensionNames.filter(d => dimensionQuotas[d] > 1);
    if (reducibleDims.length === 0) break;
    reducibleDims.sort((a, b) => dimensionQuotas[b] - dimensionQuotas[a]);
    dimensionQuotas[reducibleDims[0]]--;
    totalAllocated--;
  }

  while (totalAllocated < limit) {
    const expandableDims = dimensionNames.filter(d => dimensionQuotas[d] < dimensionGroups[d].length);
    if (expandableDims.length === 0) break;
    expandableDims.sort((a, b) => (dimensionGroups[b].length - dimensionQuotas[b]) - (dimensionGroups[a].length - dimensionQuotas[a]));
    dimensionQuotas[expandableDims[0]]++;
    totalAllocated++;
  }

  // 2. Select questions per dimension based on quotas, preserving atomic validity pairs
  const selectedQuestions: Question[] = [];
  const selectedIds = new Set<string>();

  const atomicPairs: Record<string, Question[]> = {};
  pool.forEach(q => {
    const pairGroup = getPairGroupId(q);
    if (pairGroup) {
      if (!atomicPairs[pairGroup]) atomicPairs[pairGroup] = [];
      atomicPairs[pairGroup].push(q);
    }
  });

  // Prioritize atomic validity pairs for Validity / Consistency subtests
  const isValiditySubtest = options?.testType === 'Validitas' || 
                            options?.testType === 'Indikator Konsistensi' ||
                            options?.testType?.toLowerCase().includes('valid');

  if (isValiditySubtest) {
    Object.values(atomicPairs).forEach(pairList => {
      if (selectedQuestions.length + pairList.length <= limit) {
        pairList.forEach(q => {
          if (!selectedIds.has(q.id)) {
            selectedQuestions.push(q);
            selectedIds.add(q.id);
          }
        });
      }
    });
  }

  // Select proportionally per dimension
  dimensionNames.forEach(dim => {
    const dimPool = seedShuffle(dimensionGroups[dim], `${seed}_${dim}`);
    const quota = dimensionQuotas[dim];
    let addedCount = selectedQuestions.filter(q => q.dimension === dim).length;

    for (const q of dimPool) {
      if (addedCount >= quota) break;
      if (!selectedIds.has(q.id)) {
        const pairGroup = getPairGroupId(q);
        if (pairGroup && atomicPairs[pairGroup]) {
          const pairMembers = atomicPairs[pairGroup];
          const unselectedMembers = pairMembers.filter(m => !selectedIds.has(m.id));
          if (selectedQuestions.length + unselectedMembers.length <= limit) {
            unselectedMembers.forEach(m => {
              selectedQuestions.push(m);
              selectedIds.add(m.id);
              if (m.dimension === dim) addedCount++;
            });
          }
        } else {
          selectedQuestions.push(q);
          selectedIds.add(q.id);
          addedCount++;
        }
      }
    }
  });

  // Fill remaining slots up to limit if any
  if (selectedQuestions.length < limit) {
    const remainingPool = seedShuffle(
      pool.filter(q => !selectedIds.has(q.id)),
      `${seed}_fill`
    );
    for (const q of remainingPool) {
      if (selectedQuestions.length >= limit) break;
      selectedQuestions.push(q);
      selectedIds.add(q.id);
    }
  }

  return seedShuffle(selectedQuestions, `${seed}_final`);
}
