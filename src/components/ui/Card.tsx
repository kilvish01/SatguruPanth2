import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps extends ViewProps {
  variant?: 'flat' | 'elevated' | 'outlined' | 'glass';
  padded?: boolean;
  radius?: 'md' | 'lg' | 'xl' | 'xxl';
}

export const Card: React.FC<CardProps> = ({
  variant = 'flat',
  padded = true,
  radius = 'lg',
  style,
  children,
  ...rest
}) => {
  const { colors, radius: r, spacing, elevation } = useTheme();

  const variantStyle = (() => {
    switch (variant) {
      case 'elevated':
        return [
          { backgroundColor: colors.surface, shadowColor: colors.shadow },
          elevation.md,
        ];
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        };
      case 'glass':
        return {
          backgroundColor: colors.bgGlass,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        };
      default:
        return { backgroundColor: colors.surfaceMuted };
    }
  })();

  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: r[radius],
          padding: padded ? spacing.lg : 0,
        },
        variantStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};
