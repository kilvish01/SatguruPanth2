import apiClient from './apiClient';
import { API_CONFIG } from '../config/api.config';

const AWS_API_URL = API_CONFIG.AWS_API_URL;

export const bookAPI = {
  getAllBooks: async () => {
    try {
      const response = await apiClient.get('/api/books/all');
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  getBook: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/books/${id}`, {
        transformResponse: [(data) => {
          const parsed = JSON.parse(data);
          if (parsed.pdfUrl) {
            parsed.pdfUrl = parsed.pdfUrl.replace(/&amp;/g, '&');
          }
          parsed.pdfProxyUrl = `${AWS_API_URL}/api/books/${id}/pdf`;
          return parsed;
        }],
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  },

  getMostViewed: async (limit: number = 10) => {
    try {
      const response = await apiClient.get(`/api/books/popular/viewed?limit=${limit}`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching most viewed books:', error);
      throw error;
    }
  },

  getMostLiked: async (limit: number = 10) => {
    try {
      const response = await apiClient.get(`/api/books/popular/liked?limit=${limit}`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching most liked books:', error);
      throw error;
    }
  },

  likeBook: async (bookId: string, action: 'like' | 'unlike' = 'like') => {
    try {
      const response = await apiClient.post(`/api/books/${bookId}/like`, { action });
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return data;
    } catch (error) {
      console.error('Error liking/unliking book:', error);
      throw error;
    }
  },

  getMyLikedBooks: async () => {
    try {
      const response = await apiClient.get('/api/me/liked-books');
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching liked books:', error);
      throw error;
    }
  },

  updateProgress: async (_userId: string, _bookId: string, _currentPage: number, _totalPages: number) => {
    return { success: true };
  },

  getProgress: async (_userId: string, _bookId: string) => {
    return { currentPage: 0, totalPages: 0 };
  },

  getUserProgress: async (_userId: string) => {
    return [];
  },
};
