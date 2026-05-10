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
import SvgImage from '../shared/SvgImage';

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
  sm: { width: 130, height: 180 },
  md: { width: 160, height: 220 },
  lg: { width: screenWidth * 0.42, height: screenWidth * 0.56 },
};

export const BookCard: React.FC<BookCardProps> = memo(
  ({ cover, title, date, views, likes, isLiked, onPress, onLikePress, size = 'md' }) => {
    const { colors, radius, spacing, elevation } = useTheme();
    const dim = sizeMap[size];
    const scale = useSharedValue(1);

    const handlePressIn = () => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 320 });
    };
    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 220 });
    };

    const handleLike = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      onLikePress?.();
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
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
                borderRadius: radius.lg,
                backgroundColor: colors.surfaceMuted,
                shadowColor: colors.shadow,
              },
              elevation.md,
            ]}
          >
            <SvgImage
              source={cover ? { uri: cover } : require('../../assets/images/icon.png')}
              style={[styles.cover, { borderRadius: radius.lg }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={[styles.gradient, { borderRadius: radius.lg }]}
            />
            {onLikePress && (
              <Pressable
                onPress={handleLike}
                hitSlop={10}
                style={[styles.likeBtn, { backgroundColor: colors.bgGlass }]}
              >
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isLiked ? colors.danger : '#FFFFFF'}
                />
              </Pressable>
            )}
            {(views !== undefined || likes !== undefined) && (
              <View style={[styles.statsRow, { paddingHorizontal: spacing.sm }]}>
                {views !== undefined && (
                  <View style={styles.stat}>
                    <Ionicons name="eye-outline" size={11} color="#FFFFFF" />
                    <Text variant="caption" color="#FFFFFF" weight="medium">
                      {formatCount(views)}
                    </Text>
                  </View>
                )}
                {likes !== undefined && (
                  <View style={styles.stat}>
                    <Ionicons name="heart" size={11} color="#FFFFFF" />
                    <Text variant="caption" color="#FFFFFF" weight="medium">
                      {formatCount(likes)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={{ marginTop: spacing.sm, paddingHorizontal: 2 }}>
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
    height: '50%',
  },
  likeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
