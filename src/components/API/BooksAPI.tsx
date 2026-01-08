import { bookAPI } from '../../services/bookService';

export const GetAllBooks = async (): Promise<any[]> => {
  try {
    const books = await bookAPI.getAllBooks();
    return books;
  } catch (error) {
    console.error('Error fetching all books:', error);
    return [];
  }
};

export const GetMostViewed = async (limit: number = 10): Promise<any[]> => {
  try {
    const books = await bookAPI.getMostViewed(limit);
    return books;
  } catch (error) {
    console.error('Error fetching most viewed books:', error);
    return [];
  }
};

export const GetMostLiked = async (limit: number = 10): Promise<any[]> => {
  try {
    const books = await bookAPI.getMostLiked(limit);
    return books;
  } catch (error) {
    console.error('Error fetching most liked books:', error);
    return [];
  }
};

export const GetBookById = async (bookId: string): Promise<any> => {
  try {
    const book = await bookAPI.getBook(bookId);
    return book;
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
};

export const LikeBook = async (bookId: string): Promise<boolean> => {
  try {
    await bookAPI.likeBook(bookId);
    return true;
  } catch (error) {
    console.error('Error liking book:', error);
    return false;
  }
};
