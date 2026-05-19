import apiClient from './apiClient';

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'verse'
  | 'image'
  | 'image_caption'
  | 'footer'
  | 'list_item';

export interface ContentBlock {
  type: BlockType;
  offset: number;
  text?: string;
  imageKey?: string;
  level?: number;
  align?: 'left' | 'center' | 'right';
  emphasis?: boolean;
  sourcePage: number;
}

export interface Chapter {
  id: string;
  title: string;
  startOffset: number;
  endOffset: number;
  sourceStartPage: number;
}

export interface BookContent {
  schemaVersion: '1.0';
  bookId: string;
  title: string;
  language: 'hi';
  totalBlocks: number;
  totalChars: number;
  totalSourcePages: number;
  estimatedReadingMinutes: number;
  extraction: {
    method: string;
    model: string;
    promptVersion: string;
    extractedAt: string;
    pagesExtracted: number;
    pagesFailed: number;
    qaStatus: 'pending' | 'ready' | 'needs_review' | 'failed';
  };
  chapters: Chapter[];
  blocks: ContentBlock[];
}

export const bookContentAPI = {
  getContent: async (bookId: string): Promise<BookContent | null> => {
    try {
      const res = await apiClient.get(`/api/books/${bookId}/content`);
      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      return data as BookContent;
    } catch (err: any) {
      // 404 = no reflowable content for this book yet; caller should fall
      // back to the legacy pdf.js reader.
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
