import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({ label, selected, onPress, icon, size = 'md' }) => {
  const { colors, radius, spacing } = useTheme();
  const scale = useSharedValue(1);
  const bgProgress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    bgProgress.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected, bgProgress]);

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const height = size === 'sm' ? 30 : 36;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => (scale.value = withSpring(0.94, { damping: 15, stiffness: 320 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 18, stiffness: 220 }))}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? colors.primary : colors.surfaceMuted,
            borderColor: selected ? colors.primary : colors.border,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.md,
            height,
          },
        ]}
      >
        <View style={styles.row}>
          {icon}
          <Text
            variant={size === 'sm' ? 'caption' : 'bodySm'}
            weight="semibold"
            color={selected ? colors.primaryFg : colors.text}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
