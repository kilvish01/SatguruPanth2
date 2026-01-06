import axios from 'axios';

const API_URL = 'http://10.232.58.83:3000/api';

export const bookAPI = {
  getAllBooks: async () => {
    try {
      const response = await axios.get(`${API_URL}/books`);
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  },

  getBook: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/books/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  },

  downloadBook: (id) => {
    return `${API_URL}/books/${id}/download`;
  },

  updateProgress: async (userId, bookId, currentPage, totalPages) => {
    try {
      const response = await axios.post(`${API_URL}/progress`, {
        userId,
        bookId,
        currentPage,
        totalPages
      });
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  getProgress: async (userId, bookId) => {
    try {
      const response = await axios.get(`${API_URL}/progress/${userId}/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  getUserProgress: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/progress/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }
};
