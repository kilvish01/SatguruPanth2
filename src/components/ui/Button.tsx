import React from 'react';
import { Pressable, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: any;
}

const sizeStyle: Record<Size, { height: number; px: number; fontVariant: 'body' | 'bodySm' | 'h3' }> = {
  sm: { height: 38, px: 14, fontVariant: 'bodySm' },
  md: { height: 48, px: 18, fontVariant: 'body' },
  lg: { height: 56, px: 24, fontVariant: 'h3' },
};

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  haptic = true,
  style,
}) => {
  const { colors, radius, motion } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const cfg = sizeStyle[size];
  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    scale.value = withSpring(0.96, motion.springSnappy);
    opacity.value = withTiming(0.85, { duration: motion.fast });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, motion.spring);
    opacity.value = withTiming(1, { duration: motion.fast });
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.5 : opacity.value,
  }));

  const getColors = (): { bg: string; fg: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primary, fg: colors.primaryFg };
      case 'secondary':
        return { bg: colors.surfaceMuted, fg: colors.text, border: colors.border };
      case 'ghost':
        return { bg: 'transparent', fg: colors.text };
      case 'danger':
        return { bg: colors.danger, fg: '#FFF' };
      case 'glass':
        return { bg: colors.bgGlass, fg: colors.text, border: colors.border };
    }
  };

  const c = getColors();

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={c.fg} size="small" />
      ) : (
        <>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
          <Text variant={cfg.fontVariant} weight="semibold" color={c.fg}>
            {title}
          </Text>
          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </>
      )}
    </View>
  );

  if (variant === 'primary' && !isDisabled) {
    return (
      <Animated.View style={[fullWidth && styles.fullWidth, animatedStyle, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.base,
              {
                height: cfg.height,
                paddingHorizontal: cfg.px,
                borderRadius: radius.lg,
              },
            ]}
          >
            {inner}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.base,
          {
            height: cfg.height,
            paddingHorizontal: cfg.px,
            borderRadius: radius.lg,
            backgroundColor: c.bg,
            borderWidth: c.border ? StyleSheet.hairlineWidth : 0,
            borderColor: c.border,
          },
        ]}
      >
        {inner}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginHorizontal: 2,
  },
  fullWidth: {
    width: '100%',
  },
});
