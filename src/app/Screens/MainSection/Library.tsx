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
import CustomText from '@/components/shared/CustomText';



interface LibraryProps {
  navigation: any;
  allBooks: any[]
}

interface Book {
  _id: string;
  title: string;
  filename: string;
  uploadDate: string;
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

      setNewestBooks(sortedByDate);
      setOldestBooks(sortedByOldest);
      setMostViewed(sortedByViews);
      setMostLiked(sortedByLikes);
      setFilteredBooks(allBooks); // Show all books by default
    }
  }, [allBooks]);


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
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.bookCover} />
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
  bookStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#666',
    marginLeft: 4,
  },
});

export default Library;