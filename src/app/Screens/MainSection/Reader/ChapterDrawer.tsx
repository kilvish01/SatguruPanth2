import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Chapter } from '../../../../services/bookContentService';
import type { ReaderPalette } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentOffset: number;
  onJump: (chapter: Chapter) => void;
  palette: ReaderPalette;
}

const ChapterDrawer = ({ visible, onClose, chapters, currentOffset, onJump, palette }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
        <View style={[styles.handle, { backgroundColor: palette.divider }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Chapters</Text>
          <Pressable onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={22} color={palette.textSubtle} />
          </Pressable>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
          {chapters.map((c, i) => {
            const isCurrent = currentOffset >= c.startOffset && currentOffset < c.endOffset;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  onJump(c);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: palette.divider, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={[styles.num, { backgroundColor: isCurrent ? palette.accent : palette.divider }]}>
                  <Text
                    style={{
                      color: isCurrent ? palette.surface : palette.textSubtle,
                      fontWeight: '600',
                      fontSize: 12,
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[styles.title2, { color: isCurrent ? palette.accent : palette.text, fontWeight: isCurrent ? '700' : '500' }]}
                  numberOfLines={2}
                >
                  {c.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
    maxHeight: '78%',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  title: { fontSize: 18, fontWeight: '700' },
  list: { marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title2: { flex: 1, fontSize: 15 },
});

export default ChapterDrawer;
