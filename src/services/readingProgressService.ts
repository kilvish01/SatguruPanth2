// Local-only reading progress. Backed by AsyncStorage so it survives app
// restarts without needing the network. Replace with a real /api/me/progress
// call in M4 — the public surface here was designed to match the future
// shape so callers don't need to change.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'reading-progress:';
const RECENT_KEY = 'reading-progress:recent';

export interface ReadingProgress {
  bookId: string;
  bookTitle: string;
  bookCoverImage?: string;
  currentPage: number;
  totalPages: number;
  charOffset: number;
  totalChars: number;
  percent: number;
  lastReadAt: number;
}

export const readingProgressAPI = {
  async save(progress: Omit<ReadingProgress, 'lastReadAt'>): Promise<void> {
    const full: ReadingProgress = { ...progress, lastReadAt: Date.now() };
    await AsyncStorage.setItem(KEY_PREFIX + progress.bookId, JSON.stringify(full));

    const recent = await this.recent();
    const filtered = recent.filter((p) => p.bookId !== progress.bookId);
    const next = [full, ...filtered].slice(0, 20);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  },

  async get(bookId: string): Promise<ReadingProgress | null> {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + bookId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReadingProgress;
    } catch {
      return null;
    }
  },

  async recent(): Promise<ReadingProgress[]> {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as ReadingProgress[];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  },

  async remove(bookId: string): Promise<void> {
    await AsyncStorage.removeItem(KEY_PREFIX + bookId);
    const recent = await this.recent();
    const filtered = recent.filter((p) => p.bookId !== bookId);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(filtered));
  },
};
