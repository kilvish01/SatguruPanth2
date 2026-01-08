import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const AWS_API_URL = API_CONFIG.AWS_API_URL;

export const bookAPI = {
  getAllBooks: async () => {
    try {
      const response = await axios.get(`${AWS_API_URL}/api/books/all`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  getBook: async (id: string) => {
    try {
      const response = await axios.get(`${AWS_API_URL}/api/books/${id}`, {
        transformResponse: [(data) => {
          const parsed = JSON.parse(data);
          if (parsed.pdfUrl) {
            parsed.pdfUrl = parsed.pdfUrl.replace(/&amp;/g, '&');
          }
          parsed.pdfProxyUrl = `${AWS_API_URL}/api/books/${id}/pdf`;
          return parsed;
        }]
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  },

  getMostViewed: async (limit: number = 10) => {
    try {
      const response = await axios.get(`${AWS_API_URL}/api/books/popular/viewed?limit=${limit}`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching most viewed books:', error);
      throw error;
    }
  },

  getMostLiked: async (limit: number = 10) => {
    try {
      const response = await axios.get(`${AWS_API_URL}/api/books/popular/liked?limit=${limit}`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching most liked books:', error);
      throw error;
    }
  },

  likeBook: async (bookId: string) => {
    try {
      const response = await axios.post(`${AWS_API_URL}/api/books/${bookId}/like`);
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      return data;
    } catch (error) {
      console.error('Error liking book:', error);
      throw error;
    }
  },

  updateProgress: async (userId: string, bookId: string, currentPage: number, totalPages: number) => {
    try {
      // Progress tracking not implemented in AWS Lambda yet
      return { success: true };
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  getProgress: async (userId: string, bookId: string) => {
    try {
      // Progress tracking not implemented in AWS Lambda yet
      return { currentPage: 0, totalPages: 0 };
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  getUserProgress: async (userId: string) => {
    try {
      // Progress tracking not implemented in AWS Lambda yet
      return [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }
};
