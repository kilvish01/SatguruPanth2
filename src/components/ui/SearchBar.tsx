import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { sanitizeText } from '../../security/validation';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search books, gurus, topics…',
  onSubmit,
  autoFocus,
}) => {
  const { colors, radius, spacing, fontFamily } = useTheme();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderProgress = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    borderProgress.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    borderProgress.value = withTiming(0, { duration: 200 });
  };

  const handleClear = () => {
    Haptics.selectionAsync().catch(() => {});
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    onChangeText(sanitizeText(text));
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: focused ? colors.primary : colors.border,
    borderWidth: 1.5,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          paddingHorizontal: spacing.md,
        },
        containerStyle,
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          {
            color: colors.text,
            fontFamily: fontFamily.regular,
            fontSize: 15,
            marginLeft: spacing.sm,
          },
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
