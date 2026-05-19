import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ReaderPalette, ReaderTheme, FontStep } from './types';
import { PALETTES } from './palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: ReaderTheme;
  onThemeChange: (t: ReaderTheme) => void;
  fontStep: FontStep;
  onFontStepChange: (s: FontStep) => void;
  palette: ReaderPalette;
}

const FONT_LABELS: Record<FontStep, string> = { 0: 'XS', 1: 'S', 2: 'M', 3: 'L', 4: 'XL' };
const THEMES: ReaderTheme[] = ['light', 'sepia', 'dark'];

const SettingsSheet = ({
  visible,
  onClose,
  theme,
  onThemeChange,
  fontStep,
  onFontStepChange,
  palette,
}: Props) => {
  const buzz = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
        <View style={[styles.handle, { backgroundColor: palette.divider }]} />

        <Text style={[styles.section, { color: palette.textSubtle }]}>FONT SIZE</Text>
        <View style={[styles.row, { backgroundColor: palette.bg, borderColor: palette.divider }]}>
          <Pressable
            onPress={() => {
              if (fontStep > 0) {
                buzz();
                onFontStepChange((fontStep - 1) as FontStep);
              }
            }}
            style={({ pressed }) => [styles.stepBtn, { opacity: fontStep === 0 ? 0.3 : pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>A−</Text>
          </Pressable>
          <View style={styles.steps}>
            {([0, 1, 2, 3, 4] as FontStep[]).map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: s <= fontStep ? palette.accent : palette.divider,
                    width: s === fontStep ? 14 : 6,
                  },
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={() => {
              if (fontStep < 4) {
                buzz();
                onFontStepChange((fontStep + 1) as FontStep);
              }
            }}
            style={({ pressed }) => [styles.stepBtn, { opacity: fontStep === 4 ? 0.3 : pressed ? 0.6 : 1 }]}
            hitSlop={8}
          >
            <Text style={{ color: palette.text, fontSize: 22, fontWeight: '700' }}>A+</Text>
          </Pressable>
        </View>
        <Text style={[styles.label, { color: palette.textMuted }]}>
          {FONT_LABELS[fontStep]} · pinch to zoom while reading
        </Text>

        <Text style={[styles.section, { color: palette.textSubtle, marginTop: 22 }]}>THEME</Text>
        <View style={[styles.themes, { backgroundColor: palette.bg, borderColor: palette.divider }]}>
          {THEMES.map((t) => {
            const p = PALETTES[t];
            const active = t === theme;
            return (
              <Pressable
                key={t}
                onPress={() => {
                  buzz();
                  onThemeChange(t);
                }}
                style={({ pressed }) => [
                  styles.themeBtn,
                  {
                    backgroundColor: p.bg,
                    borderColor: active ? palette.accent : 'transparent',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ color: p.text, fontWeight: '700', fontSize: 18 }}>Aa</Text>
                <Text style={{ color: p.textSubtle, fontSize: 11, marginTop: 4, textTransform: 'capitalize' }}>
                  {t}
                </Text>
                {active && (
                  <View style={[styles.check, { backgroundColor: palette.accent }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  section: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepBtn: {
    width: 56,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: { height: 6, borderRadius: 3 },
  label: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  themes: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeBtn: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SettingsSheet;
