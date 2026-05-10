import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { bookAPI } from '../../../services/bookService';
import { Book } from '@/utils/types';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';
import { Screen } from '../../../components/ui/Screen';
import { BookCard } from '../../../components/ui/BookCard';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const GRID_SPACING = 12;
const SIDE_PADDING = 20;
const ITEM_WIDTH = (width - SIDE_PADDING * 2 - GRID_SPACING) / COLUMN_COUNT;

const AllBooks = ({ route, navigation }: any) => {
  const { books, title } = route.params;
  const { colors, spacing, radius } = useTheme();
  const [likedBooks, setLikedBooks] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const counts: Record<string, number> = {};
    (books || []).forEach((b: Book) => {
      const id = b._id || b.BookID || b.bookId || '';
      counts[id] = b.likeCount || 0;
    });
    setLikeCounts(counts);
  }, [books]);

  const handleLike = useCallback(
    async (book: Book) => {
      const bookId = book._id || book.BookID || book.bookId || '';
      const wasLiked = likedBooks.has(bookId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      setLikedBooks((p) => {
        const next = new Set(p);
        if (wasLiked) next.delete(bookId);
        else next.add(bookId);
        return next;
      });
      setLikeCounts((p) => ({
        ...p,
        [bookId]: Math.max(0, (p[bookId] || 0) + (wasLiked ? -1 : 1)),
      }));

      try {
        await bookAPI.likeBook(bookId, wasLiked ? 'unlike' : 'like');
      } catch {
        setLikedBooks((p) => {
          const next = new Set(p);
          if (wasLiked) next.add(bookId);
          else next.delete(bookId);
          return next;
        });
        setLikeCounts((p) => ({
          ...p,
          [bookId]: Math.max(0, (p[bookId] || 0) + (wasLiked ? 1 : -1)),
        }));
      }
    },
    [likedBooks]
  );

  const renderBook = useCallback(
    ({ item, index }: { item: Book; index: number }) => {
      const id = item._id || item.BookID || item.bookId || '';
      const isLiked = likedBooks.has(id);
      const count = likeCounts[id] ?? item.likeCount ?? 0;
      const isLeft = index % 2 === 0;
      return (
        <Animated.View
          entering={FadeIn.delay(index * 30).duration(280)}
          style={{
            width: ITEM_WIDTH,
            marginRight: isLeft ? GRID_SPACING : 0,
            marginBottom: GRID_SPACING + 4,
          }}
        >
          <BookCard
            cover={item.coverImage || item.iconUrl}
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
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            navigation.goBack();
          }}
          style={[styles.iconBtn, { backgroundColor: colors.surfaceMuted }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="h2" weight="bold" numberOfLines={1}>
            {title || 'All Books'}
          </Text>
          <Text variant="caption" subtle>
            {(books || []).length} books
          </Text>
        </View>
      </View>

      {(!books || books.length === 0) ? (
        <View style={[styles.empty, { padding: spacing.xl }]}>
          <Ionicons name="book-outline" size={48} color={colors.textSubtle} />
          <Text variant="h3" weight="semibold" centered style={{ marginTop: spacing.md }}>
            No books yet
          </Text>
          <Text variant="bodySm" muted centered style={{ marginTop: spacing.sm }}>
            Check back soon
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item, index) =>
            item._id || item.BookID || item.bookId || `book-${index}`
          }
          numColumns={COLUMN_COUNT}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: SIDE_PADDING,
            paddingTop: spacing.md,
            paddingBottom: 120,
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AllBooks;
