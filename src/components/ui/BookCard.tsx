import React, { memo } from 'react';
import { Pressable, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';
import { IndianBookCover } from './IndianBookCover';

interface BookCardProps {
  cover?: string;
  title: string;
  date?: string;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  onPress: () => void;
  onLikePress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const { width: screenWidth } = Dimensions.get('window');

const sizeMap = {
  sm: { width: 130, height: 188 },
  md: { width: 160, height: 232 },
  lg: { width: screenWidth * 0.42, height: screenWidth * 0.61 },
};

export const BookCard: React.FC<BookCardProps> = memo(
  ({ cover, title, date, views, likes, isLiked, onPress, onLikePress, size = 'md' }) => {
    const { colors, radius, spacing, elevation } = useTheme();
    const dim = sizeMap[size];
    const scale = useSharedValue(1);
    const lift = useSharedValue(0);

    const handlePressIn = () => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 320 });
      lift.value = withSpring(-2, { damping: 15, stiffness: 320 });
    };
    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });
      lift.value = withSpring(0, { damping: 18, stiffness: 220 });
    };

    const handleLike = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onLikePress?.();
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { translateY: lift.value }],
    }));

    return (
      <Animated.View style={[{ width: dim.width }, animatedStyle]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onPress();
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={[
              styles.coverWrap,
              {
                width: dim.width,
                height: dim.height,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceMuted,
                shadowColor: colors.shadowStrong,
              },
              elevation.lg,
            ]}
          >
            <IndianBookCover
              title={title}
              width={dim.width}
              height={dim.height}
              borderRadius={radius.md}
            />

            <View
              pointerEvents="none"
              style={[
                styles.spineHighlight,
                { borderRadius: radius.md },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.15, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.pageEdge,
                {
                  borderRadius: radius.md,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                },
              ]}
            />

            {onLikePress && (
              <Pressable
                onPress={handleLike}
                hitSlop={10}
                style={[styles.likeBtn, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={14}
                  color={isLiked ? colors.danger : '#1A1814'}
                />
              </Pressable>
            )}

            {(views !== undefined || likes !== undefined) && (
              <View style={[styles.statsRow, { paddingHorizontal: spacing.sm }]}>
                {views !== undefined && (
                  <View style={[styles.statPill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                    <Ionicons name="eye-outline" size={10} color="#FFFFFF" />
                    <Text variant="caption" color="#FFFFFF" weight="medium">
                      {formatCount(views)}
                    </Text>
                  </View>
                )}
                {likes !== undefined && (
                  <View style={[styles.statPill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                    <Ionicons name="heart" size={10} color="#FF8FA0" />
                    <Text variant="caption" color="#FFFFFF" weight="medium">
                      {formatCount(likes)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={{ marginTop: spacing.sm + 2, paddingHorizontal: 2 }}>
            <Text variant="bodySm" weight="semibold" numberOfLines={2}>
              {title}
            </Text>
            {date && (
              <Text variant="caption" subtle style={{ marginTop: 2 }}>
                {date}
              </Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  }
);

BookCard.displayName = 'BookCard';

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const styles = StyleSheet.create({
  coverWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  spineHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '20%',
    overflow: 'hidden',
  },
  pageEdge: {
    position: 'absolute',
    right: 0,
    top: 1.5,
    bottom: 1.5,
    width: 2,
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
});
