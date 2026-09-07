import { restClient } from './client';
import { SyncPayload } from '@/app/api/sync/route';

export interface PendingSyncItem {
  id: string;
  payload: SyncPayload;
  attempts: number;
  createdAt: number;
}

export interface SyncMetrics {
  queueLength: number;
  totalSynced: number;
  totalFailed: number;
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'backed_off' | 'offline';
}

/**
 * Controlled Hybrid Smart Batching Sync Manager
 * Buffers high-frequency student interactions locally and dispatches RESTful API requests
 * in non-blocking batches with jitter and backoff algorithms.
 */
export class SyncManager {
  private queue: PendingSyncItem[] = [];
  private isProcessing: boolean = false;
  private maxBatchSize: number = 15;
  private baseIntervalMs: number = 5000; // 5s base interval
  private currentIntervalMs: number = 5000;
  private backoffMultiplier: number = 1;
  private maxBackoffMultiplier: number = 6; // max 30s
  private intervalId: NodeJS.Timeout | null = null;
  
  // Metrics tracking
  private totalSyncedCount: number = 0;
  private totalFailedCount: number = 0;
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      this.loadQueueFromLocalStorage();
      this.startLoop();

      // Flush queue on online recovery
      window.addEventListener('online', () => {
        this.resetBackoff();
        this.flushQueue();
      });

      // Flush queue on page unload using sendBeacon or sync fetch
      const unloadHandler = () => {
        this.flushBeacon();
      };
      window.addEventListener('beforeunload', unloadHandler);
      window.addEventListener('pagehide', unloadHandler);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushQueue();
        }
      });
    }
  }

  public startLoop() {
    if (this.intervalId) return;
    if (typeof window === 'undefined') return;

    const scheduleNext = () => {
      // Apply jitter: +/- 20% random offset to avoid thundering herd problem
      const jitter = (Math.random() - 0.5) * 0.4 * this.currentIntervalMs;
      const delay = Math.max(2000, Math.round(this.currentIntervalMs + jitter));

      this.intervalId = setTimeout(async () => {
        await this.flushQueue();
        if (this.intervalId) {
          scheduleNext();
        }
      }, delay);
    };

    scheduleNext();
  }

  public stopLoop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  private resetBackoff() {
    this.backoffMultiplier = 1;
    this.currentIntervalMs = this.baseIntervalMs;
  }

  private incrementBackoff() {
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, this.maxBackoffMultiplier);
    this.currentIntervalMs = Math.round(this.baseIntervalMs * this.backoffMultiplier);
  }

  /**
   * Enqueue a background sync payload (0ms blocking, non-blocking response)
   */
  public enqueue(payload: SyncPayload) {
    // 1. Deduplicate/Coalesce student_answers in the queue to optimize performance
    if (payload.type === 'student_answer' && payload.studentId && payload.data?.questionId) {
      const existingIdx = this.queue.findIndex(
        (item) =>
          item.payload.type === 'student_answer' &&
          item.payload.studentId === payload.studentId &&
          item.payload.data?.questionId === payload.data?.questionId
      );

      if (existingIdx !== -1) {
        // Update existing item in-place with latest choice and timestamp, reset attempts
        this.queue[existingIdx].payload = {
          ...this.queue[existingIdx].payload,
          ...payload,
          timestamp: payload.timestamp || new Date().toISOString(),
        };
        this.queue[existingIdx].attempts = 0;
        
        this.saveQueueToLocalStorage();
        return;
      }
    }

    const item: PendingSyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      payload: {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      },
      attempts: 0,
      createdAt: Date.now(),
    };

    this.queue.push(item);
    this.saveQueueToLocalStorage();

    // If queue length reaches batch size, flush immediately in background
    if (this.queue.length >= this.maxBatchSize) {
      setTimeout(() => this.flushQueue(), 0);
    }
  }

  /**
   * Flush pending items in a single RESTful batch request
   */
  public async flushQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isProcessing = true;

    // Extract batch up to maxBatchSize
    const itemsToProcess = this.queue.splice(0, this.maxBatchSize);
    const payloads = itemsToProcess.map((item) => item.payload);

    this.saveQueueToLocalStorage();

    try {
      // Send single batch REST payload
      const response = await restClient.post<{ synced: boolean; count: number }>('/api/sync', {
        items: payloads,
      });

      if (response.success) {
        this.totalSyncedCount += itemsToProcess.length;
        this.lastSyncTimestamp = new Date().toISOString();
        this.resetBackoff();
      } else {
        throw new Error(response.error?.message || 'Sync failed');
      }
    } catch (err) {
      console.warn('[SyncManager] Batch REST sync failed, re-queueing items with backoff:', err);
      this.totalFailedCount += itemsToProcess.length;
      this.incrementBackoff();

      // Re-queue items with incremented attempt counter
      itemsToProcess.forEach((item) => {
        item.attempts += 1;
        if (item.attempts <= 5) {
          this.queue.push(item);
        }
      });
      this.saveQueueToLocalStorage();
    } finally {
      this.isProcessing = false;
      this.saveQueueToLocalStorage();

      // If queue is still not empty, trigger a rapid flush for the rest of the items
      if (this.queue.length > 0) {
        setTimeout(() => this.flushQueue(), 100);
      }
    }
  }

  /**
   * Send pending payload via sendBeacon on tab exit
   */
  public flushBeacon() {
    if (this.queue.length === 0 || typeof navigator === 'undefined' || !navigator.sendBeacon) return;

    const itemsToProcess = this.queue.splice(0, this.maxBatchSize);
    const payloads = itemsToProcess.map((item) => item.payload);

    try {
      const blob = new Blob([JSON.stringify({ items: payloads })], { type: 'application/json' });
      navigator.sendBeacon('/api/sync', blob);
      this.saveQueueToLocalStorage();
    } catch (err) {
      console.warn('[SyncManager] Beacon flush failed:', err);
    }
  }

  private saveQueueToLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        // Cap queue to 100 most recent items to avoid quota issues
        if (this.queue.length > 100) {
          this.queue = this.queue.slice(-100);
        }
        localStorage.setItem('CBT_Pending_Sync_Queue', JSON.stringify(this.queue));
      } catch (e) {
        // Fallback: if storage quota exceeded, prune to last 20 items and retry
        try {
          this.queue = this.queue.slice(-20);
          localStorage.setItem('CBT_Pending_Sync_Queue', JSON.stringify(this.queue));
        } catch {
          // Silent catch to prevent unhandled UI warning or lag
        }
      }
    }
  }

  private loadQueueFromLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('CBT_Pending_Sync_Queue');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.queue = parsed;
          }
        }
      } catch (e) {
        console.warn('[SyncManager] Failed to load queue from localStorage:', e);
      }
    }
  }

  /**
   * Get telemetry and health metrics
   */
  public getMetrics(): SyncMetrics {
    let status: SyncMetrics['status'] = 'idle';
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      status = 'offline';
    } else if (this.isProcessing) {
      status = 'syncing';
    } else if (this.backoffMultiplier > 1) {
      status = 'backed_off';
    }

    return {
      queueLength: this.queue.length,
      totalSynced: this.totalSyncedCount,
      totalFailed: this.totalFailedCount,
      lastSyncTime: this.lastSyncTimestamp,
      status,
    };
  }
}

/**
 * Singleton instance of SyncManager
 */
export const syncManager = new SyncManager();
