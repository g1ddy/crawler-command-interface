import type { CrawlerTimelineDocument } from './types.ts';
import { validateCrawlerTimeline } from './validation.ts';

export interface TimelinePersistenceAdapter {
  readonly name: string;
  loadTimeline(): Promise<CrawlerTimelineDocument | null> | CrawlerTimelineDocument | null;
  saveTimeline(doc: CrawlerTimelineDocument): Promise<void> | void;
  clearTimeline(): Promise<void> | void;
}

export const DEFAULT_STORAGE_KEY = 'crawler_timeline_doc_v2';

export class LocalDeviceStorageAdapter implements TimelinePersistenceAdapter {
  readonly name = 'local-device-storage';
  private storageKey: string;
  private storage: Storage | null;

  constructor(storageKey: string = DEFAULT_STORAGE_KEY, customStorage?: Storage | null) {
    this.storageKey = storageKey;
    if (customStorage !== undefined) {
      this.storage = customStorage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      this.storage = null;
    }
  }

  loadTimeline(): CrawlerTimelineDocument | null {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CrawlerTimelineDocument;
      const validation = validateCrawlerTimeline(parsed);
      if (validation.valid) {
        return parsed;
      } else {
        console.warn('[LocalDeviceStorageAdapter] Persisted timeline failed validation:', validation.errors);
        return null;
      }
    } catch (err) {
      console.warn('[LocalDeviceStorageAdapter] Failed to load persisted timeline:', err);
      return null;
    }
  }

  saveTimeline(doc: CrawlerTimelineDocument): void {
    if (!this.storage) return;
    try {
      const validation = validateCrawlerTimeline(doc);
      if (!validation.valid) {
        console.warn('[LocalDeviceStorageAdapter] Refusing to save invalid timeline document:', validation.errors);
        return;
      }
      this.storage.setItem(this.storageKey, JSON.stringify(doc));
    } catch (err) {
      console.warn('[LocalDeviceStorageAdapter] Failed to save timeline document:', err);
    }
  }

  clearTimeline(): void {
    if (!this.storage) return;
    try {
      this.storage.removeItem(this.storageKey);
    } catch (err) {
      console.warn('[LocalDeviceStorageAdapter] Failed to clear timeline storage:', err);
    }
  }
}

export class InMemoryStorageAdapter implements TimelinePersistenceAdapter {
  readonly name = 'in-memory-storage';
  private doc: CrawlerTimelineDocument | null = null;

  constructor(initialDoc?: CrawlerTimelineDocument) {
    if (initialDoc) {
      const validation = validateCrawlerTimeline(initialDoc);
      if (validation.valid) {
        this.doc = initialDoc;
      }
    }
  }

  loadTimeline(): CrawlerTimelineDocument | null {
    return this.doc ? JSON.parse(JSON.stringify(this.doc)) : null;
  }

  saveTimeline(doc: CrawlerTimelineDocument): void {
    const validation = validateCrawlerTimeline(doc);
    if (validation.valid) {
      this.doc = JSON.parse(JSON.stringify(doc));
    } else {
      console.warn('[InMemoryStorageAdapter] Refusing to save invalid timeline document:', validation.errors);
    }
  }

  clearTimeline(): void {
    this.doc = null;
  }
}

export interface RemotePersistenceConfig {
  endpoint?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class OptionalRemoteStorageAdapter implements TimelinePersistenceAdapter {
  readonly name = 'optional-remote-storage';
  private localAdapter: TimelinePersistenceAdapter;
  private config: RemotePersistenceConfig;

  constructor(
    config: RemotePersistenceConfig = {},
    localAdapter: TimelinePersistenceAdapter = new LocalDeviceStorageAdapter()
  ) {
    this.config = config;
    this.localAdapter = localAdapter;
  }

  async loadTimeline(): Promise<CrawlerTimelineDocument | null> {
    if (this.config.endpoint) {
      try {
        const fetcher = this.config.fetchFn || (typeof window !== 'undefined' ? window.fetch : undefined);
        if (fetcher) {
          const res = await fetcher(this.config.endpoint, {
            method: 'GET',
            headers: this.config.headers,
          });
          if (res.ok) {
            const data = (await res.json()) as CrawlerTimelineDocument;
            const validation = validateCrawlerTimeline(data);
            if (validation.valid) {
              await this.localAdapter.saveTimeline(data);
              return data;
            }
          }
        }
      } catch (err) {
        console.warn('[OptionalRemoteStorageAdapter] Remote load failed, falling back to local storage:', err);
      }
    }
    return this.localAdapter.loadTimeline();
  }

  async saveTimeline(doc: CrawlerTimelineDocument): Promise<void> {
    await this.localAdapter.saveTimeline(doc);

    if (this.config.endpoint) {
      try {
        const fetcher = this.config.fetchFn || (typeof window !== 'undefined' ? window.fetch : undefined);
        if (fetcher) {
          await fetcher(this.config.endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...this.config.headers,
            },
            body: JSON.stringify(doc),
          });
        }
      } catch (err) {
        console.warn('[OptionalRemoteStorageAdapter] Remote save failed:', err);
      }
    }
  }

  async clearTimeline(): Promise<void> {
    await this.localAdapter.clearTimeline();

    if (this.config.endpoint) {
      try {
        const fetcher = this.config.fetchFn || (typeof window !== 'undefined' ? window.fetch : undefined);
        if (fetcher) {
          await fetcher(this.config.endpoint, {
            method: 'DELETE',
            headers: this.config.headers,
          });
        }
      } catch (err) {
        console.warn('[OptionalRemoteStorageAdapter] Remote clear failed:', err);
      }
    }
  }
}
