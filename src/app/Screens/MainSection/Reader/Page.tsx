import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ReaderPage, ReaderPalette, FontStep } from './types';
import { FONT_SIZES } from './palette';

interface Props {
  page: ReaderPage;
  palette: ReaderPalette;
  fontStep: FontStep;
  width: number;
  height: number;
}

// Renders the blocks for a single reader page. Memoized because we keep
// many pages mounted in the horizontal pager and want re-renders only
// when theme / font size / dimensions change.
const Page = memo(({ page, palette, fontStep, width, height }: Props) => {
  const { body, lineHeight } = FONT_SIZES[fontStep];

  return (
    <View style={[styles.page, { width, height, backgroundColor: palette.bg }]}>
      <View style={styles.content}>
        {page.blocks.map((b, i) => {
          if (b.type === 'heading') {
            const sizeMul = b.level === 1 ? 1.7 : b.level === 2 ? 1.35 : 1.15;
            const fs = Math.round(body * sizeMul);
            const lh = Math.round(fs * 1.3);
            return (
              <Text
                key={i}
                style={{
                  fontSize: fs,
                  lineHeight: lh,
                  fontWeight: b.level === 1 ? '800' : '700',
                  color: palette.text,
                  textAlign: 'center',
                  marginTop: b.level === 1 ? 8 : 18,
                  marginBottom: b.level === 1 ? 18 : 10,
                  letterSpacing: 0.3,
                }}
              >
                {b.text}
              </Text>
            );
          }

          if (b.type === 'verse') {
            return (
              <Text
                key={i}
                style={{
                  fontSize: body,
                  lineHeight: Math.round(lineHeight * 1.18),
                  color: palette.text,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  marginVertical: 10,
                  letterSpacing: 0.15,
                }}
              >
                {b.text}
              </Text>
            );
          }

          if (b.type === 'list_item') {
            return (
              <View key={i} style={{ flexDirection: 'row', marginLeft: 8, marginVertical: 3 }}>
                <Text style={{ color: palette.accent, fontSize: body, lineHeight, marginRight: 8, marginTop: 1 }}>
                  •
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: body,
                    lineHeight,
                    color: palette.text,
                    textAlign: 'left',
                  }}
                >
                  {b.text}
                </Text>
              </View>
            );
          }

          if (b.type === 'image_caption') {
            return (
              <Text
                key={i}
                style={{
                  fontSize: Math.max(12, body - 3),
                  lineHeight: lineHeight - 4,
                  color: palette.textSubtle,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  marginVertical: 6,
                }}
              >
                {b.text}
              </Text>
            );
          }

          // paragraph + anything unhandled
          return (
            <Text
              key={i}
              style={{
                fontSize: body,
                lineHeight,
                color: palette.text,
                textAlign: 'left',
                marginVertical: 4,
              }}
            >
              {b.text}
            </Text>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 24,
    paddingTop: 64,    // room for top chrome
    paddingBottom: 64, // room for bottom chrome
  },
  content: {
    flex: 1,
  },
});

export default Page;
