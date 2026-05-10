import React from 'react';
import { View, StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  scroll?: boolean;
  style?: ViewStyle;
  paddingHorizontal?: number;
  bg?: 'default' | 'elevated' | 'muted';
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  edges = ['top'],
  style,
  paddingHorizontal,
  bg = 'default',
}) => {
  const { colors, isDark } = useTheme();

  const bgColor =
    bg === 'elevated' ? colors.bgElevated : bg === 'muted' ? colors.surfaceMuted : colors.bg;

  return (
    <View style={[styles.root, { backgroundColor: bgColor }, style]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView
        edges={edges}
        style={[styles.flex, paddingHorizontal !== undefined && { paddingHorizontal }]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});
