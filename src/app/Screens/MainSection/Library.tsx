import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

import { bookAPI } from '@/services/bookService';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';
import { Chip } from '../../../components/ui/Chip';
import { BookCard } from '../../../components/ui/BookCard';
import { Screen } from '../../../components/ui/Screen';

interface LibraryProps {
  navigation: any;
  allBooks: any[];
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

type SortKey = 'all' | 'newest' | 'oldest' | 'mostViewed' | 'mostLiked';

const SORT_OPTIONS: Array<{ key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'newest', label: 'Newest', icon: 'sparkles' },
  { key: 'oldest', label: 'Oldest', icon: 'time' },
  { key: 'mostViewed', label: 'Most viewed', icon: 'eye' },
  { key: 'mostLiked', label: 'Most loved', icon: 'heart' },
];

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_SPACING = 12;
const SIDE_PADDING = 20;
const ITEM_WIDTH = (width - SIDE_PADDING * 2 - GRID_SPACING) / COLUMN_COUNT;

const Library: React.FC<LibraryProps> = ({ navigation, allBooks }) => {
  const { colors, spacing } = useTheme();
  const [currentSort, setCurrentSort] = useState<SortKey>('all');
  const [likedBooks, setLikedBooks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (allBooks.length === 0) return;
    const counts: Record<string, number> = {};
    allBooks.forEach((b: Book) => {
      const id = b._id || b.BookID || b.bookId || '';
      counts[id] = b.likeCount || 0;
    });
    setLikeCounts(counts);
  }, [allBooks]);

  const sorted = useMemo(() => {
    const list = [...allBooks];
    switch (currentSort) {
      case 'newest':
        return list.sort(
          (a, b) =>
            new Date(b.uploadDate || b.uploadedAt || 0).getTime() -
            new Date(a.uploadDate || a.uploadedAt || 0).getTime()
        );
      case 'oldest':
        return list.sort(
          (a, b) =>
            new Date(a.uploadDate || a.uploadedAt || 0).getTime() -
            new Date(b.uploadDate || b.uploadedAt || 0).getTime()
        );
      case 'mostViewed':
        return list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'mostLiked':
        return list.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      default:
        return list;
    }
  }, [allBooks, currentSort]);

  const handleLike = useCallback(
    async (book: Book) => {
      const bookId = book._id || book.BookID || book.bookId || '';
      const wasLiked = likedBooks.has(bookId);
      const action = wasLiked ? 'unlike' : 'like';

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      setLikedBooks((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(bookId);
        else next.add(bookId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [bookId]: Math.max(0, (prev[bookId] || 0) + (wasLiked ? -1 : 1)),
      }));

      try {
        await bookAPI.likeBook(bookId, action);
      } catch (error) {
        if (__DEV__) console.error('Like failed:', error);
        setLikedBooks((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(bookId);
          else next.delete(bookId);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [bookId]: Math.max(0, (prev[bookId] || 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [likedBooks]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const renderBook = useCallback(
    ({ item, index }: { item: Book; index: number }) => {
      const id = item._id || item.BookID || item.bookId || '';
      const isLiked = likedBooks.has(id);
      const count = likeCounts[id] ?? item.likeCount ?? 0;
      const isLeft = index % 2 === 0;

      return (
        <Animated.View
          entering={FadeIn.delay(index * 30).duration(280)}
          layout={Layout.springify()}
          style={{
            width: ITEM_WIDTH,
            marginRight: isLeft ? GRID_SPACING : 0,
            marginBottom: GRID_SPACING + 4,
          }}
        >
          <BookCard
            cover={item.coverImage}
            title={item.title}
            date={
              item.uploadDate || item.uploadedAt
                ? new Date(item.uploadDate || item.uploadedAt!).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : undefined
            }
            views={item.viewCount}
            likes={count}
            isLiked={isLiked}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              navigation.navigate('bookReader', { book: item });
            }}
            onLikePress={() => handleLike(item)}
          />
        </Animated.View>
      );
    },
    [likedBooks, likeCounts, navigation, handleLike]
  );

  return (
    <Screen edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <Text variant="h1" weight="bold">
          Library
        </Text>
        <Text variant="bodySm" muted style={{ marginTop: 4 }}>
          {sorted.length} {sorted.length === 1 ? 'book' : 'books'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chips, { paddingHorizontal: spacing.xl, gap: spacing.sm }]}
      >
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            selected={currentSort === opt.key}
            onPress={() => setCurrentSort(opt.key)}
            icon={
              <Ionicons
                name={opt.icon}
                size={14}
                color={currentSort === opt.key ? colors.primaryFg : colors.textMuted}
              />
            }
          />
        ))}
      </ScrollView>

      {sorted.length === 0 ? (
        <View style={[styles.empty, { padding: spacing.xl }]}>
          <Ionicons name="library-outline" size={48} color={colors.textSubtle} />
          <Text variant="h3" weight="semibold" centered style={{ marginTop: spacing.md }}>
            Your library awaits
          </Text>
          <Text variant="bodySm" muted centered style={{ marginTop: spacing.sm }}>
            Books will appear here once available
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderBook}
          keyExtractor={(item, index) =>
            item._id || item.BookID || item.bookId || `library-${index}`
          }
          numColumns={COLUMN_COUNT}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SIDE_PADDING,
            paddingTop: spacing.lg,
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Library;
