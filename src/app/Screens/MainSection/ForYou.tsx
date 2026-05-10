import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { GetMostViewed, GetMostLiked } from '@/components/API/BooksAPI';
import { useTheme } from '../../../theme/ThemeContext';
import { useAuth } from '../../../security/AuthContext';
import { Text } from '../../../components/ui/Text';
import { SearchBar } from '../../../components/ui/SearchBar';
import { BookCard } from '../../../components/ui/BookCard';
import { Screen } from '../../../components/ui/Screen';
import { SkeletonRow } from '../../../components/ui/Skeleton';

interface ForYouProps {
  navigation: any;
  allBooks: any[];
  onRefresh?: () => Promise<void>;
}

interface Book {
  _id: string;
  BookID?: string;
  bookId?: string;
  title: string;
  filename?: string;
  uploadDate?: string;
  uploadedAt?: string;
  viewCount?: number;
  likeCount?: number;
  coverImage?: string;
}

const { width } = Dimensions.get('window');

const formatDate = (d?: string) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const ForYou: React.FC<ForYouProps> = ({ navigation, allBooks, onRefresh }) => {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [mostViewedBooks, setMostViewedBooks] = useState<Book[]>([]);
  const [mostLikedBooks, setMostLikedBooks] = useState<Book[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadPopularBooks = useCallback(async () => {
    setLoadingPopular(true);
    try {
      const [viewed, liked] = await Promise.all([GetMostViewed(10), GetMostLiked(10)]);
      setMostViewedBooks(Array.isArray(viewed) ? viewed : []);
      setMostLikedBooks(Array.isArray(liked) ? liked : []);
    } catch (error) {
      if (__DEV__) console.error('Error loading popular books:', error);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  useEffect(() => {
    loadPopularBooks();
  }, [loadPopularBooks]);

  const sortedByDate = useMemo(() => {
    return [...allBooks].sort(
      (a, b) =>
        new Date(b.uploadDate || b.uploadedAt || 0).getTime() -
        new Date(a.uploadDate || a.uploadedAt || 0).getTime()
    );
  }, [allBooks]);

  const newReleases = useMemo(() => sortedByDate.slice(0, 10), [sortedByDate]);
  const recommendedBooks = useMemo(() => sortedByDate, [sortedByDate]);

  const filteredBooks = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return allBooks.filter((b) => b.title?.toLowerCase().includes(q));
  }, [debouncedQuery, allBooks]);

  const featuredBook = useMemo(() => {
    if (!sortedByDate.length) return null;
    return sortedByDate[0];
  }, [sortedByDate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await Promise.all([onRefresh?.(), loadPopularBooks()]);
    setRefreshing(false);
  }, [onRefresh, loadPopularBooks]);

  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const renderBook = useCallback(
    ({ item }: { item: Book }) => (
      <View style={{ marginRight: spacing.md }}>
        <BookCard
          cover={item.coverImage}
          title={item.title}
          date={formatDate(item.uploadDate || item.uploadedAt)}
          views={item.viewCount}
          likes={item.likeCount}
          onPress={() => navigation.navigate('bookReader', { book: item })}
        />
      </View>
    ),
    [navigation, spacing.md]
  );

  const Section = useCallback(
    ({
      title,
      data,
      onSeeAll,
      delay = 0,
    }: {
      title: string;
      data: Book[];
      onSeeAll?: () => void;
      delay?: number;
    }) => {
      if (!data.length) return null;
      return (
        <Animated.View
          entering={FadeInDown.delay(delay).duration(500)}
          style={{ marginBottom: spacing.xl }}
        >
          <View style={[styles.sectionHeader, { paddingHorizontal: spacing.xl }]}>
            <Text variant="h2" weight="semibold">
              {title}
            </Text>
            {onSeeAll && (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSeeAll();
                }}
                hitSlop={8}
              >
                <View style={styles.seeAllRow}>
                  <Text variant="bodySm" weight="semibold" color={colors.primary}>
                    See all
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </View>
              </Pressable>
            )}
          </View>
          <FlatList
            data={data}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderBook}
            keyExtractor={(item, index) =>
              item._id || item.BookID || item.bookId || `${title}-${index}`
            }
            contentContainerStyle={{ paddingHorizontal: spacing.xl }}
          />
        </Animated.View>
      );
    },
    [colors.primary, renderBook, spacing.xl]
  );

  return (
    <Screen edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View entering={FadeIn.duration(400)} style={[styles.header, { padding: spacing.xl }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" muted>
                {greetingText}
              </Text>
              <Text variant="h1" weight="bold" style={{ marginTop: 2 }}>
                सतगुरु पंथ
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate('profile');
              }}
              style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}
            >
              <Image source={require('@/assets/images/icon.png')} style={styles.avatarImg} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xl }}
        >
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search books, gurus, topics…"
          />
        </Animated.View>

        {filteredBooks.length > 0 && debouncedQuery && (
          <Section title={`Results for "${debouncedQuery}"`} data={filteredBooks} delay={0} />
        )}

        {!debouncedQuery && featuredBook && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={[styles.featuredWrap, { paddingHorizontal: spacing.xl, marginBottom: spacing.xl }]}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate('bookReader', { book: featuredBook });
              }}
            >
              <LinearGradient
                colors={colors.gradientHero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.featured, { borderRadius: radius.xxl, padding: spacing.xl }]}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text variant="overline" color={colors.primary}>
                    FEATURED · NEW
                  </Text>
                  <Text variant="h2" weight="bold" color="#FFFFFF" numberOfLines={2}>
                    {featuredBook.title}
                  </Text>
                  <Text variant="bodySm" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
                    {formatDate(featuredBook.uploadDate || featuredBook.uploadedAt)}
                  </Text>
                  <View style={[styles.openBtn, { backgroundColor: colors.primary }]}>
                    <Text variant="bodySm" weight="semibold" color={colors.primaryFg}>
                      Begin reading
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primaryFg} />
                  </View>
                </View>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={[styles.featuredCover, { borderRadius: radius.lg }]}
                />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {!debouncedQuery && (
          <>
            <Section
              title="New releases"
              data={newReleases}
              onSeeAll={() =>
                navigation.navigate('allBooks', { books: newReleases, title: 'New Releases' })
              }
              delay={250}
            />

            {loadingPopular ? (
              <View style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.xl }}>
                <Text variant="h2" weight="semibold" style={{ marginBottom: spacing.md }}>
                  Most viewed
                </Text>
                <SkeletonRow count={3} />
              </View>
            ) : (
              <Section
                title="Most viewed"
                data={mostViewedBooks}
                onSeeAll={() =>
                  navigation.navigate('allBooks', { books: mostViewedBooks, title: 'Most Viewed' })
                }
                delay={300}
              />
            )}

            {!loadingPopular && (
              <Section
                title="Most loved"
                data={mostLikedBooks}
                onSeeAll={() =>
                  navigation.navigate('allBooks', { books: mostLikedBooks, title: 'Most Loved' })
                }
                delay={350}
              />
            )}

            <Section
              title="Recommended for you"
              data={recommendedBooks}
              onSeeAll={() =>
                navigation.navigate('allBooks', {
                  books: recommendedBooks,
                  title: 'Recommended for You',
                })
              }
              delay={400}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredWrap: {},
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 160,
    overflow: 'hidden',
  },
  featuredCover: {
    width: 90,
    height: 130,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  openBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 12,
  },
});

export default ForYou;
