// IndexedDB Temporary Cache helper for CBT Student Exam
// Supabase is DB Utama (Primary Database).
// IndexedDB is strictly used for temporary local caching during exam execution,
// providing immediate latency-free caching & offline protection per question answered.

const DB_NAME = 'CBT_Exam_Cache_DB';
const DB_VERSION = 1;
const STORE_ANSWERS = 'exam_answers';

export interface CachedAnswer {
  id: string; // `${studentId}_${questionId}`
  studentId: string;
  questionId: string;
  choiceId: string;
  synced: boolean;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_ANSWERS)) {
        const store = db.createObjectStore(STORE_ANSWERS, { keyPath: 'id' });
        store.createIndex('studentId', 'studentId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save single question answer to IndexedDB cache immediately when 1 question is answered.
 */
export async function saveAnswerToCache(
  studentId: string,
  questionId: string,
  choiceId: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readwrite');
      const store = transaction.objectStore(STORE_ANSWERS);

      const entry: CachedAnswer = {
        id: `${studentId}_${questionId}`,
        studentId,
        questionId,
        choiceId,
        synced: false,
        updatedAt: Date.now()
      };

      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB cache write warning:', err);
  }
}

/**
 * Retrieve all cached answers for a given student from IndexedDB.
 */
export async function getCachedAnswers(studentId: string): Promise<Record<string, string>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readonly');
      const store = transaction.objectStore(STORE_ANSWERS);
      const index = store.index('studentId');
      const req = index.getAll(studentId);

      req.onsuccess = () => {
        const results: CachedAnswer[] = req.result || [];
        const answers: Record<string, string> = {};
        results.forEach((item) => {
          if (item.questionId && item.choiceId) {
            answers[item.questionId] = item.choiceId;
          }
        });
        resolve(answers);
      };

      req.onerror = () => {
        resolve({});
      };
    });
  } catch (err) {
    console.warn('IndexedDB cache read warning:', err);
    return {};
  }
}

/**
 * Mark a cached answer as successfully synced to Supabase (DB Utama).
 */
export async function markAnswerSynced(studentId: string, questionId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readwrite');
      const store = transaction.objectStore(STORE_ANSWERS);
      const id = `${studentId}_${questionId}`;
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const data: CachedAnswer = getReq.result;
        if (data) {
          data.synced = true;
          store.put(data);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB sync mark warning:', err);
  }
}

/**
 * Get answers that are still pending sync to Supabase (DB Utama).
 */
export async function getUnsyncedAnswers(
  studentId: string
): Promise<Array<{ questionId: string; choiceId: string }>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readonly');
      const store = transaction.objectStore(STORE_ANSWERS);
      const index = store.index('studentId');
      const req = index.getAll(studentId);

      req.onsuccess = () => {
        const results: CachedAnswer[] = req.result || [];
        const unsynced = results
          .filter((item) => !item.synced)
          .map((item) => ({ questionId: item.questionId, choiceId: item.choiceId }));
        resolve(unsynced);
      };

      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

/**
 * Clear temporary cache for a student after whole exam completion.
 */
export async function clearExamCache(studentId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readwrite');
      const store = transaction.objectStore(STORE_ANSWERS);
      const index = store.index('studentId');
      const req = index.openCursor(studentId);

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB clear cache warning:', err);
  }
}

/**
 * Clear all temporary cache from IndexedDB.
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_ANSWERS], 'readwrite');
      const store = transaction.objectStore(STORE_ANSWERS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB clear all cache warning:', err);
  }
}
