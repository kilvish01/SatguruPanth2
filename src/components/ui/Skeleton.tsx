import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius,
  style,
}) => {
  const { colors, radius: r } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.5, 1]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius ?? r.sm,
          backgroundColor: colors.surfaceMuted,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonBookCard: React.FC = () => {
  const { spacing, radius } = useTheme();
  return (
    <View style={{ width: 160, marginRight: spacing.md }}>
      <Skeleton width={160} height={220} radius={radius.lg} />
      <View style={{ height: spacing.sm }} />
      <Skeleton width="80%" height={14} />
      <View style={{ height: spacing.xs }} />
      <Skeleton width="60%" height={11} />
    </View>
  );
};

export const SkeletonRow: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.md }]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBookCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
