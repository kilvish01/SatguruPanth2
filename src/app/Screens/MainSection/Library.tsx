import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '@/components/shared/CustomText';
import SvgImage from '@/components/shared/SvgImage';
import { bookAPI } from '@/services/bookService';



interface LibraryProps {
  navigation: any;
  allBooks: any[]
}

interface Book {
  _id: string;
  BookID?: string;
  bookId?: string;
  title: string;
  filename: string;
  uploadDate: string;
  uploadedAt?: string;
  viewCount?: number;
  likeCount?: number;
  coverImage?: string;
}

// Get screen width to calculate grid item size
const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_SPACING = 16;
const ITEM_WIDTH = (width - GRID_SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;


const Library: React.FC<LibraryProps> = ({ navigation,allBooks }) => {

  const [newestBooks , setNewestBooks] = useState<Book[]>([]);
  const [oldestBooks , setOldestBooks] = useState<Book[]>([]);
  const [mostViewed , setMostViewed] = useState<Book[]>([]);
  const [mostLiked , setMostLiked]  = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [currentStatus, setCurrentStatus] = useState('all');
  const [likedBooks, setLikedBooks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});


  useEffect(() => {
    if (allBooks.length > 0) {
      const sortedByDate = [...allBooks].sort((a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );

      const sortedByOldest = [...allBooks].sort((a, b) =>
        new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
      );

      const sortedByViews = [...allBooks].sort((a, b) =>
        (b.viewCount || 0) - (a.viewCount || 0)
      );

      const sortedByLikes = [...allBooks].sort((a, b) =>
        (b.likeCount || 0) - (a.likeCount || 0)
      );

      // Initialize like counts
      const counts: Record<string, number> = {};
      allBooks.forEach((book: Book) => {
        const id = book._id || book.BookID || book.bookId || '';
        counts[id] = book.likeCount || 0;
      });
      setLikeCounts(counts);

      setNewestBooks(sortedByDate);
      setOldestBooks(sortedByOldest);
      setMostViewed(sortedByViews);
      setMostLiked(sortedByLikes);
      setFilteredBooks(allBooks); // Show all books by default
    }
  }, [allBooks]);

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


  // Apply sorting to books
  const handleContentChange = (tag: string) => {
    setCurrentStatus(tag);
    switch (tag) {
      case 'all':
        setFilteredBooks(allBooks);
        break;
      case 'newest':
        setFilteredBooks(newestBooks);
        break;
      case 'oldest':
        setFilteredBooks(oldestBooks);
        break;
      case 'mostViewed':
        setFilteredBooks(mostViewed);
        break;
      case 'mostLiked':
        setFilteredBooks(mostLiked);
        break;
    }
  };

  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('bookReader', { book: item })}
    >
      {item.coverImage ? (
        <SvgImage
          source={{ uri: item.coverImage }}
          style={styles.bookCover}
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
          style={styles.bookAuthor}
        >
          {new Date(item.uploadDate).toLocaleDateString()}
        </CustomText>
        <View style={styles.statsRow}>
          <View style={styles.viewStat}>
            <Ionicons name="eye-outline" size={14} color="#888" />
            <CustomText variant="h8" style={styles.statText}>
              {item.viewCount || 0}
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
                styles.statText,
                likedBooks.has(item._id || item.BookID || item.bookId || '') && styles.likedText
              ]}
            >
              {likeCounts[item._id || item.BookID || item.bookId || ''] || 0}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <CustomText variant="h4" fontFamily="Bold" style={styles.headerTitle}>
            My Library
          </CustomText>
        </View>

        <View style={styles.sortContainer}>
          <CustomText variant="h6" fontFamily="Medium" style={styles.sortTitle}>
            Sort by:
          </CustomText>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[
                styles.sortOption,
                currentStatus === 'all' && styles.sortOptionActive,
              ]}
              onPress={() => handleContentChange('all')}
            >
              <CustomText
                variant="h7"
                fontFamily={currentStatus === 'all' ? 'Bold' : 'Medium'}
                style={[
                  styles.sortOptionText,
                  currentStatus === 'all' && styles.sortOptionTextActive,
                ]}
              >
                All Books
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                currentStatus === 'newest' && styles.sortOptionActive,
              ]}
              onPress={() => handleContentChange('newest')}
            >
              <CustomText
                variant="h7"
                fontFamily={currentStatus === 'newest' ? 'Bold' : 'Medium'}
                style={[
                  styles.sortOptionText,
                  currentStatus === 'newest' && styles.sortOptionTextActive,
                ]}
              >
                Newest
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                currentStatus === 'oldest' && styles.sortOptionActive,
              ]}
              onPress={() => handleContentChange('oldest')}
            >
              <CustomText
                variant="h7"
                fontFamily={currentStatus === 'oldest' ? 'Bold' : 'Medium'}
                style={[
                  styles.sortOptionText,
                  currentStatus === 'oldest' && styles.sortOptionTextActive,
                ]}
              >
                Oldest
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                currentStatus === 'mostViewed' && styles.sortOptionActive,
              ]}
              onPress={() => handleContentChange('mostViewed')}
            >
              <CustomText
                variant="h7"
                fontFamily={currentStatus === 'mostViewed' ? 'Bold' : 'Medium'}
                style={[
                  styles.sortOptionText,
                  currentStatus === 'mostViewed' && styles.sortOptionTextActive,
                ]}
              >
                Most Viewed
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                currentStatus === 'mostLiked' && styles.sortOptionActive,
              ]}
              onPress={() => handleContentChange('mostLiked')}
            >
              <CustomText
                variant="h7"
                fontFamily={currentStatus === 'mostLiked' ? 'Bold' : 'Medium'}
                style={[
                  styles.sortOptionText,
                  currentStatus === 'mostLiked' && styles.sortOptionTextActive,
                ]}
              >
                Most Liked
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredBooks}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `library-${index}`}
          numColumns={COLUMN_COUNT}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bookGrid}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 22,
    color: '#000',
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortTitle: {
    marginBottom: 8,
    color: '#000',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortOptionActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  sortOptionText: {
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  bookGrid: {
    paddingBottom: 20,
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
    elevation: 2,
  },
  bookCover: {
    width: '100%',
    height: ITEM_WIDTH * 1.4,
    resizeMode: 'cover',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    color: '#000',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#666',
    marginBottom: 8,
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
  statText: {
    color: '#888',
    fontSize: 11,
    marginLeft: 4,
  },
  likedText: {
    color: '#FF4444',
  },
});

export default Library;