import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../../components/shared/CustomText';
import SvgImage from '../../../components/shared/SvgImage';
import { bookAPI } from '../../../services/bookService';
import { Book } from '@/utils/types';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_SPACING = 16;
const ITEM_WIDTH = (width - GRID_SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

const AllBooks = ({ route, navigation }: any) => {
  const { books, title } = route.params;
  const [likedBooks, setLikedBooks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Initialize like counts from books data
  useEffect(() => {
    const counts: Record<string, number> = {};
    books.forEach((book: Book) => {
      const id = book._id || book.BookID || book.bookId || '';
      counts[id] = book.likeCount || 0;
    });
    setLikeCounts(counts);
  }, [books]);

  const handleLike = async (book: Book, e: any) => {
    e.stopPropagation();
    const bookId = book._id || book.BookID || book.bookId || '';
    const isCurrentlyLiked = likedBooks.has(bookId);
    const action = isCurrentlyLiked ? 'unlike' : 'like';

    // Optimistic update
    if (isCurrentlyLiked) {
      setLikedBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
      setLikeCounts(prev => ({ ...prev, [bookId]: Math.max(0, (prev[bookId] || 1) - 1) }));
    } else {
      setLikedBooks(prev => new Set(prev).add(bookId));
      setLikeCounts(prev => ({ ...prev, [bookId]: (prev[bookId] || 0) + 1 }));
    }

    try {
      await bookAPI.likeBook(bookId, action);
    } catch (error) {
      // Revert on error
      if (isCurrentlyLiked) {
        setLikedBooks(prev => new Set(prev).add(bookId));
        setLikeCounts(prev => ({ ...prev, [bookId]: (prev[bookId] || 0) + 1 }));
      } else {
        setLikedBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
        setLikeCounts(prev => ({ ...prev, [bookId]: Math.max(0, (prev[bookId] || 1) - 1) }));
      }
      console.error('Error liking/unliking book:', error);
    }
  };

  const renderBook = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('bookReader', { book: item })}
    >
      {item.coverImage || item.iconUrl ? (
        <SvgImage
          source={{ uri: item.coverImage || item.iconUrl }}
          style={styles.bookCover}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={require('../../../assets/images/icon.png')}
          style={styles.bookCover}
        />
      )}
      <View style={styles.bookInfo}>
        <CustomText
          variant="h6"
          fontFamily="Bold"
          numberOfLines={2}
          style={styles.bookTitle}
        >
          {item.title}
        </CustomText>
        <CustomText
          variant="h8"
          fontFamily="Regular"
          numberOfLines={1}
          style={styles.bookDate}
        >
          {new Date(item.uploadDate || item.uploadedAt || '').toLocaleDateString()}
        </CustomText>
        {item.viewCount !== undefined && (
          <View style={styles.statsRow}>
            <View style={styles.viewStat}>
              <Ionicons name="eye-outline" size={14} color="#888" />
              <CustomText variant="h8" style={styles.bookStats}>
                {item.viewCount}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={(e) => handleLike(item, e)}
              style={[
                styles.likeStat,
                likedBooks.has(item._id || item.BookID || item.bookId || '') && styles.likeStatActive
              ]}
            >
              <Ionicons
                name={likedBooks.has(item._id || item.BookID || item.bookId || '') ? "heart" : "heart-outline"}
                size={14}
                color={likedBooks.has(item._id || item.BookID || item.bookId || '') ? "#FF4444" : "#888"}
              />
              <CustomText
                variant="h8"
                style={[
                  styles.bookStats,
                  likedBooks.has(item._id || item.BookID || item.bookId || '') && styles.likedText
                ]}
              >
                {likeCounts[item._id || item.BookID || item.bookId || ''] || 0}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CustomText variant="h4" fontFamily="Bold">
            {title || 'All Books'}
          </CustomText>
        </View>
      </View>

      {books.length === 0 ? (
        <View style={styles.centered}>
          <CustomText variant="h5">No books available</CustomText>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `book-${index}`}
          numColumns={COLUMN_COUNT}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bookGrid}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    paddingTop: Platform.OS === 'ios' ? 50 : 40
  },
  backButton: {
    padding: 5
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  bookGrid: {
    paddingBottom: 20,
    paddingHorizontal: 8
  },
  bookCard: {
    width: ITEM_WIDTH,
    marginHorizontal: GRID_SPACING / 2,
    marginBottom: GRID_SPACING,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  bookCover: {
    width: '100%',
    height: ITEM_WIDTH * 1.4,
    resizeMode: 'cover'
  },
  bookInfo: {
    padding: 12
  },
  bookTitle: {
    color: '#000',
    marginBottom: 4
  },
  bookDate: {
    color: '#666'
  },
  bookStats: {
    color: '#888',
    fontSize: 11,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  viewStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  likeStatActive: {
    backgroundColor: '#FFE8E8',
  },
  likedText: {
    color: '#FF4444',
  }
});

export default AllBooks;
