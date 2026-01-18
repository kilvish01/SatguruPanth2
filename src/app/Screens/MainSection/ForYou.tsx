import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Dimensions,
  SafeAreaView,
  Platform,
  Text
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { GetAllBooks, GetMostViewed, GetMostLiked } from '@/components/API/BooksAPI';
import CustomText from '@/components/shared/CustomText';



interface ForYouProps {
  navigation: any;
  allBooks: any[]
}

interface Book1 {
  id: string;
  title: string;
  author: string;
  cover: any;
  rating?: number;
  lastRead?: string;
  releaseDate?: string;
}

interface Book {
  _id: string;
  title: string;
  filename: string;
  uploadDate: string;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  image: any;
}

interface ContinueReadingBook {
  id: string;
  title: string;
  author: string;
  cover: any;
  progress: number;
  chapter: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;

const ForYou: React.FC<ForYouProps> = ({ navigation,allBooks }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredBook, setFeaturedBook] = useState<ContinueReadingBook | null>(null);

  const [recentBooks, setRecentBooks] = useState<Book1[]>([]);

  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [mostViewedBooks, setMostViewedBooks] = useState<any[]>([]);
  const [mostLikedBooks, setMostLikedBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);

  useEffect(() => {
    loadPopularBooks();
  }, []);

  const loadPopularBooks = async () => {
    try {
      const [viewed, liked] = await Promise.all([
        GetMostViewed(10),
        GetMostLiked(10)
      ]);
      setMostViewedBooks(viewed);
      setMostLikedBooks(liked);
    } catch (error) {
      console.error('Error loading popular books:', error);
    }
  };

  useEffect(() => {
    if (allBooks.length > 0) {
      const sorted = [...allBooks].sort((a, b) => 
        new Date(b.uploadDate || b.uploadedAt).getTime() - new Date(a.uploadDate || a.uploadedAt).getTime()
      );
      setNewReleases(sorted.slice(0, 10));
      setRecommendedBooks(sorted);
    }
  }, [allBooks]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBooks([]);
    } else {
      const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, allBooks]);



  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const renderItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('bookReader', { book: item })}
    >
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.bookCover} />
      <View style={styles.bookInfoContainer}>
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
          {new Date(item.uploadDate || item.uploadedAt).toLocaleDateString()}
        </CustomText>
        {item.viewCount !== undefined && (
          <CustomText variant="h8" fontFamily="Regular" style={styles.bookStats}>
            👁 {item.viewCount} views
          </CustomText>
        )}
        {item.likeCount !== undefined && (
          <CustomText variant="h8" fontFamily="Regular" style={styles.bookStats}>
            ❤️ {item.likeCount} likes
          </CustomText>
        )}
      </View>
    </TouchableOpacity>
  );
  const renderBookItem = ({ item }: { item: Book1 }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate('bookDetails', { book: item })}
    >
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.bookCover} />
      <View style={styles.bookInfoContainer}>
        <CustomText
          variant="h6"
          fontFamily="Bold"
          numberOfLines={1}
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
          {item.author}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={styles.newsCard}
      onPress={() => navigation.navigate('newsDetails', { news: item })}
    >
      <Image source={item.image} style={styles.newsImage} />
      <View style={styles.newsTextContainer}>
        <CustomText
          variant="h7"
          fontFamily="Bold"
          numberOfLines={2}
          style={styles.newsTitle}
        >
          {item.title}
        </CustomText>
        <CustomText
          variant="h8"
          fontFamily="Regular"
          style={styles.newsDate}
        >
          {item.date}
        </CustomText>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <CustomText variant="h4" fontFamily="Bold" style={styles.headerTitle}>
              सतगुरु पंथ
            </CustomText>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('profile')}
          >
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Results */}
          {filteredBooks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Search Results
              </CustomText>
            </View>
            <FlatList
              data={filteredBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `search-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}

          {/* Latest News Section */}
          {latestNews.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Latest News
              </CustomText>
              <TouchableOpacity>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={latestNews}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderNewsItem}
              keyExtractor={(item, index) => item.id || `news-${index}`}
              contentContainerStyle={styles.newsListContainer}
            />
          </View>
          )}

          {/* Continue Reading Section */}
          {featuredBook && (
          <View style={styles.continueReadingContainer}>
            <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
              Continue Reading
            </CustomText>
            <TouchableOpacity
              style={styles.continueReadingCard}
              onPress={() => navigation.navigate('bookReader', { book: featuredBook })}
            >
              <Image source={featuredBook.cover} style={styles.continueReadingCover} />
              <View style={styles.continueReadingInfo}>
                <CustomText variant="h6" fontFamily="Bold" style={styles.continueReadingTitle}>
                  {featuredBook.title}
                </CustomText>
                <CustomText variant="h8" fontFamily="Regular" style={styles.continueReadingChapter}>
                  {featuredBook.chapter}
                </CustomText>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${featuredBook.progress}%` }]} />
                </View>
                <View style={styles.progressTextContainer}>
                  <CustomText variant="h8" fontFamily="Regular" style={styles.progressText}>
                    {featuredBook.progress}% completed
                  </CustomText>
                </View>
                <TouchableOpacity style={styles.continueButton}>
                  <CustomText variant="h7" fontFamily="Bold" style={styles.continueButtonText}>
                    Continue
                  </CustomText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
          )}

          {/* Recently Read Section */}
          {recentBooks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Recently Read
              </CustomText>
              <TouchableOpacity>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderBookItem}
              keyExtractor={(item, index) => item.id || `recent-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}

          {/* Recommended Books Section */}
          {recommendedBooks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Recommended for You
              </CustomText>
              <TouchableOpacity onPress={() => navigation.navigate('allBooks', { books: recommendedBooks, title: 'Recommended Books' })}>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recommendedBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `recommended-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}

          {/* New Releases Section */}
          {newReleases.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                New Releases
              </CustomText>
              <TouchableOpacity onPress={() => navigation.navigate('allBooks', { books: newReleases, title: 'New Releases' })}>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={newReleases}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `new-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}

          {/* Most Viewed Section */}
          {mostViewedBooks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Most Viewed
              </CustomText>
              <TouchableOpacity onPress={() => navigation.navigate('allBooks', { books: mostViewedBooks, title: 'Most Viewed' })}>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={mostViewedBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `viewed-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}

          {/* Most Liked Section */}
          {mostLikedBooks.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h5" fontFamily="Bold" style={styles.sectionTitle}>
                Most Liked
              </CustomText>
              <TouchableOpacity onPress={() => navigation.navigate('allBooks', { books: mostLikedBooks, title: 'Most Liked' })}>
                <CustomText variant="h7" fontFamily="Medium" style={styles.viewAllText}>
                  See All
                </CustomText>
              </TouchableOpacity>
            </View>
            <FlatList
              data={mostLikedBooks}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderItem}
              keyExtractor={(item, index) => item._id || item.BookID || item.bookId || `liked-${index}`}
              contentContainerStyle={styles.bookListContainer}
            />
          </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    color: '#000',
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchButton: {
    backgroundColor: '#000',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#000',
  },
  viewAllText: {
    color: '#000',
  },
  bookListContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  bookCard: {
    width: CARD_WIDTH,
    marginRight: 15,
    marginBottom: 5,
  },
  bookCover: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  bookInfoContainer: {
    marginTop: 8,
  },
  bookTitle: {
    color: '#000',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#666',
  },
  bookStats: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  newsListContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  newsCard: {
    width: width * 0.7,
    height: 100,
    marginRight: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  newsImage: {
    width: 100,
    height: '100%',
  },
  newsTextContainer: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  newsTitle: {
    color: '#000',
  },
  newsDate: {
    color: '#666',
  },
  continueReadingContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  continueReadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  continueReadingCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    marginRight: 15,
  },
  continueReadingInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  continueReadingTitle: {
    color: '#000',
    marginBottom: 4,
  },
  continueReadingChapter: {
    color: '#666',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
  },
  progressTextContainer: {
    marginBottom: 15,
  },
  progressText: {
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
  }
});

export default ForYou;