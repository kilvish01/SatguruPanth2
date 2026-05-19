import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { readingProgressAPI, ReadingProgress } from '../../services/readingProgressService';

// Netflix-style horizontal rail of in-progress books. Auto-refreshes when
// the screen regains focus so newly-opened books appear without app reload.
const ContinueReadingRail = () => {
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<ReadingProgress[]>([]);

  const reload = useCallback(async () => {
    const recent = await readingProgressAPI.recent();
    setItems(recent.filter((r) => r.percent < 100));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  useEffect(() => {
    reload();
  }, [reload]);

  if (items.length === 0) return null;

  const openBook = (item: ReadingProgress) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate('bookReader', {
      book: {
        BookID: item.bookId,
        _id: item.bookId,
        title: item.bookTitle,
        coverImage: item.bookCoverImage,
      },
    });
  };

  const removeBook = (item: ReadingProgress) => {
    Alert.alert(
      'Remove from Continue Reading?',
      `"${item.bookTitle}" will no longer appear here. Your other progress is unaffected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await readingProgressAPI.remove(item.bookId);
            reload();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Continue Reading</Text>
        <Ionicons name="bookmark" size={16} color={colors.primary} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.bookId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 14 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openBook(item)}
            onLongPress={() => removeBook(item)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.cover,
                { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
              ]}
            >
              {item.bookCoverImage ? (
                <Image
                  source={{ uri: item.bookCoverImage }}
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="book" size={32} color={colors.textSubtle} />
              )}
            </View>
            <Text
              style={[styles.cardTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.bookTitle}
            </Text>
            <View style={[styles.bar, { backgroundColor: colors.surfaceMuted }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${item.percent}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.meta, { color: colors.textSubtle }]}>
              Page {item.currentPage} · {item.percent}%
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '700' },
  card: {
    width: 140,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: {
    width: '100%',
    aspectRatio: 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    minHeight: 32,
  },
  bar: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  meta: {
    fontSize: 11,
    marginTop: 5,
    fontWeight: '500',
  },
});

export default ContinueReadingRail;
