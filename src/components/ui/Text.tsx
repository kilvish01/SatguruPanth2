import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption' | 'overline' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'light' | 'extrabold';

interface TextProps extends RNTextProps {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  muted?: boolean;
  subtle?: boolean;
  centered?: boolean;
}

const sizeMap: Record<Variant, { fontSize: number; lineHeight: number; weight: Weight }> = {
  display: { fontSize: 40, lineHeight: 48, weight: 'extrabold' },
  h1: { fontSize: 28, lineHeight: 34, weight: 'bold' },
  h2: { fontSize: 22, lineHeight: 28, weight: 'semibold' },
  h3: { fontSize: 18, lineHeight: 24, weight: 'semibold' },
  body: { fontSize: 15, lineHeight: 22, weight: 'regular' },
  bodySm: { fontSize: 13, lineHeight: 19, weight: 'regular' },
  caption: { fontSize: 12, lineHeight: 16, weight: 'regular' },
  overline: { fontSize: 11, lineHeight: 14, weight: 'semibold' },
  label: { fontSize: 13, lineHeight: 18, weight: 'medium' },
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  weight,
  color,
  muted,
  subtle,
  centered,
  style,
  children,
  ...rest
}) => {
  const { colors, fontFamily } = useTheme();
  const cfg = sizeMap[variant];
  const finalWeight = weight ?? cfg.weight;

  const textColor = color ?? (subtle ? colors.textSubtle : muted ? colors.textMuted : colors.text);

  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: cfg.fontSize,
          lineHeight: cfg.lineHeight,
          fontFamily: fontFamily[finalWeight],
          color: textColor,
          textAlign: centered ? 'center' : 'auto',
          letterSpacing: variant === 'overline' ? 1.2 : 0,
        },
        variant === 'overline' && styles.overline,
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  overline: {
    textTransform: 'uppercase',
  },
});
