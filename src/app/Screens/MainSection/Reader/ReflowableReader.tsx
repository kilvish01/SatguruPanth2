import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PinchGestureHandler, State as GestureState } from 'react-native-gesture-handler';

import { bookContentAPI, BookContent } from '../../../../services/bookContentService';
import { readingProgressAPI } from '../../../../services/readingProgressService';
import { sanitizeText } from '../../../../security/validation';
import { PALETTES, FONT_SIZES } from './palette';
import { paginate, pageForOffset } from './paginate';
import type { FontStep, ReaderTheme, ReaderPage } from './types';
import Page from './Page';
import ChapterDrawer from './ChapterDrawer';
import SettingsSheet from './SettingsSheet';

const SETTINGS_KEY = 'reader-settings:v1';

// The native reflowable reader for books that have extracted content.json.
// Books without extracted content fall back to the legacy pdf.js WebView
// reader at the navigation layer — this component assumes content exists.
const ReflowableReader = ({ route, navigation }: any) => {
  const { book } = route.params;
  const bookId = book._id || book.BookID || book.bookId;
  const { width: screenW, height: screenH } = useWindowDimensions();

  // --- state ---
  const [content, setContent] = useState<BookContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [fontStep, setFontStep] = useState<FontStep>(2);

  const listRef = useRef<FlatList<ReaderPage>>(null);
  const lastTapRef = useRef(0);
  const initialResumeApplied = useRef(false);

  const palette = PALETTES[theme];

  // --- load persisted settings ---
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.theme) setTheme(parsed.theme);
        if (typeof parsed.fontStep === 'number') setFontStep(parsed.fontStep);
      } catch {
        // ignored
      }
    });
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme, fontStep })).catch(() => {});
  }, [theme, fontStep]);

  // --- fetch content ---
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bookContentAPI.getContent(bookId);
        if (!active) return;
        if (!data) {
          setError('No reflowable content for this book yet.');
        } else {
          setContent(data);
        }
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load book');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [bookId]);

  // --- pagination (re-runs on font size / theme / dimensions / content) ---
  const pages = useMemo<ReaderPage[]>(() => {
    if (!content) return [];
    return paginate({
      blocks: content.blocks,
      fontStep,
      pageWidth: screenW - 48,    // matches Page paddingHorizontal*2
      pageHeight: screenH - 128,  // matches Page paddingTop + paddingBottom
    });
  }, [content, fontStep, screenW, screenH]);

  // --- resume to last-read position when pages are first computed ---
  useEffect(() => {
    if (!content || initialResumeApplied.current || pages.length === 0) return;
    initialResumeApplied.current = true;
    (async () => {
      const saved = await readingProgressAPI.get(bookId);
      if (!saved) return;
      const idx = pageForOffset(pages, saved.charOffset);
      if (idx > 0 && listRef.current) {
        // Slight delay so FlatList has laid out its viewport
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
          setPageIndex(idx);
        }, 60);
      }
    })();
  }, [content, pages, bookId]);

  // --- persist progress when page changes ---
  useEffect(() => {
    if (!content || !pages.length) return;
    const cur = pages[pageIndex] || pages[0];
    const charOffset = cur ? cur.startOffset : 0;
    const percent = Math.round(((pageIndex + 1) / pages.length) * 100);
    readingProgressAPI
      .save({
        bookId,
        bookTitle: content.title,
        bookCoverImage: book.coverImage,
        currentPage: pageIndex + 1,
        totalPages: pages.length,
        charOffset,
        totalChars: content.totalChars,
        percent,
      })
      .catch(() => {});
  }, [pageIndex, pages, content, bookId, book.coverImage]);

  // --- if pagination drops below current index (e.g. font change reduces total pages), clamp ---
  useEffect(() => {
    if (pageIndex >= pages.length && pages.length > 0) {
      setPageIndex(pages.length - 1);
      listRef.current?.scrollToIndex({ index: pages.length - 1, animated: false });
    }
  }, [pages.length, pageIndex]);

  // --- chrome show/hide ---
  const headerY = useSharedValue(0);
  const headerOp = useSharedValue(1);
  const footerY = useSharedValue(0);
  const footerOp = useSharedValue(1);

  const setUi = useCallback((visible: boolean) => {
    setUiVisible(visible);
    headerY.value = withSpring(visible ? 0 : -120, { damping: 18 });
    headerOp.value = withTiming(visible ? 1 : 0, { duration: 200 });
    footerY.value = withSpring(visible ? 0 : 100, { damping: 18 });
    footerOp.value = withTiming(visible ? 1 : 0, { duration: 200 });
    Haptics.selectionAsync().catch(() => {});
  }, [headerOp, headerY, footerOp, footerY]);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOp.value,
  }));
  const footerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: footerY.value }],
    opacity: footerOp.value,
  }));

  // --- tap zones: left third = prev, right third = next, middle = toggle UI ---
  const handlePagePress = useCallback(
    (locationX: number) => {
      const now = Date.now();
      if (now - lastTapRef.current < 250) return;
      lastTapRef.current = now;

      const third = screenW / 3;
      if (locationX < third && pageIndex > 0) {
        listRef.current?.scrollToIndex({ index: pageIndex - 1, animated: true });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else if (locationX > screenW - third && pageIndex < pages.length - 1) {
        listRef.current?.scrollToIndex({ index: pageIndex + 1, animated: true });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } else {
        setUi(!uiVisible);
      }
    },
    [pageIndex, pages.length, screenW, uiVisible, setUi]
  );

  // --- pinch-to-zoom maps to font step changes on release ---
  const pinchScale = useSharedValue(1);
  const pinchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pinchScale.value }],
  }));

  const onPinchEvent = useCallback((event: any) => {
    pinchScale.value = Math.max(0.6, Math.min(1.6, event.nativeEvent.scale));
  }, [pinchScale]);

  const onPinchStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.state === GestureState.END) {
        const s = event.nativeEvent.scale;
        pinchScale.value = withSpring(1, { damping: 14 });
        if (s > 1.2 && fontStep < 4) {
          setFontStep((fontStep + 1) as FontStep);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } else if (s < 0.85 && fontStep > 0) {
          setFontStep((fontStep - 1) as FontStep);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
      }
    },
    [fontStep, pinchScale]
  );

  // --- chapter jump ---
  const currentChapter = useMemo(() => {
    if (!content || !pages.length) return null;
    const cur = pages[pageIndex];
    if (!cur) return null;
    return content.chapters.find((c) => cur.startOffset >= c.startOffset && cur.startOffset < c.endOffset) || null;
  }, [content, pages, pageIndex]);

  const jumpToChapter = useCallback(
    (chapter: any) => {
      if (!pages.length) return;
      const idx = pageForOffset(pages, chapter.startOffset);
      listRef.current?.scrollToIndex({ index: idx, animated: false });
      setPageIndex(idx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    [pages]
  );

  // --- scroll handlers ---
  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
      if (idx !== pageIndex) {
        setPageIndex(idx);
      }
    },
    [pageIndex, screenW]
  );

  const renderItem = useCallback(
    ({ item }: { item: ReaderPage }) => (
      <Page page={item} palette={palette} fontStep={fontStep} width={screenW} height={screenH} />
    ),
    [palette, fontStep, screenW, screenH]
  );

  const keyExtractor = useCallback((p: ReaderPage) => `${p.index}-${p.startOffset}`, []);
  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: screenW, offset: screenW * index, index }),
    [screenW]
  );

  // --- render ---
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.bg} />
        <ActivityIndicator size="large" color={palette.accent} />
        <Text style={{ color: palette.textSubtle, marginTop: 14, letterSpacing: 0.6 }}>Opening the book…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg, paddingHorizontal: 32 }]}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.bg} />
        <Ionicons name="cloud-offline-outline" size={48} color={palette.textSubtle} />
        <Text style={{ color: palette.text, fontWeight: '700', fontSize: 17, marginTop: 14, textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: palette.accent }]}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const progressPct = pages.length ? ((pageIndex + 1) / pages.length) * 100 : 0;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={palette.bg} />

      {/* PINCH-ZOOM WRAPPER + TAP ZONES */}
      <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
        <Animated.View style={[styles.pagerWrap, pinchStyle]}>
          <Pressable
            onPress={(e) => handlePagePress(e.nativeEvent.locationX)}
            style={{ flex: 1 }}
          >
            <FlatList
              ref={listRef}
              data={pages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              onMomentumScrollEnd={onMomentumScrollEnd}
              initialNumToRender={3}
              windowSize={5}
              maxToRenderPerBatch={3}
              removeClippedSubviews
            />
          </Pressable>
        </Animated.View>
      </PinchGestureHandler>

      {/* PROGRESS BAR — always visible thin strip */}
      <View style={[styles.progressTrack, { backgroundColor: palette.divider }]} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: palette.accent }]} />
      </View>

      {/* TOP CHROME */}
      <Animated.View
        style={[styles.topChrome, headerStyle, { backgroundColor: palette.controlBg, borderBottomColor: palette.divider }]}
        pointerEvents={uiVisible ? 'auto' : 'none'}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color={palette.controlText} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: palette.controlText }]} numberOfLines={1}>
            {sanitizeText(content?.title || book.title || '')}
          </Text>
          {currentChapter && (
            <Text style={[styles.subtitle, { color: palette.textSubtle }]} numberOfLines={1}>
              {currentChapter.title}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          hitSlop={12}
        >
          <Ionicons name="text" size={20} color={palette.controlText} />
        </Pressable>
      </Animated.View>

      {/* BOTTOM CHROME */}
      <Animated.View
        style={[styles.bottomChrome, footerStyle, { backgroundColor: palette.controlBg, borderTopColor: palette.divider }]}
        pointerEvents={uiVisible ? 'auto' : 'none'}
      >
        <Pressable
          onPress={() => setChaptersOpen(true)}
          style={({ pressed }) => [styles.bottomBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="list-outline" size={20} color={palette.controlText} />
          <Text style={[styles.bottomBtnText, { color: palette.controlText }]}>Chapters</Text>
        </Pressable>
        <View style={styles.pageInfo}>
          <Text style={{ color: palette.controlText, fontSize: 13, fontWeight: '600' }}>
            {pageIndex + 1} <Text style={{ color: palette.textSubtle, fontWeight: '400' }}>of {pages.length}</Text>
          </Text>
          <Text style={{ color: palette.textSubtle, fontSize: 11, marginTop: 2 }}>{Math.round(progressPct)}% read</Text>
        </View>
        <Pressable
          onPress={() => setSettingsOpen(true)}
          style={({ pressed }) => [styles.bottomBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="options-outline" size={20} color={palette.controlText} />
          <Text style={[styles.bottomBtnText, { color: palette.controlText }]}>Display</Text>
        </Pressable>
      </Animated.View>

      <ChapterDrawer
        visible={chaptersOpen}
        onClose={() => setChaptersOpen(false)}
        chapters={content?.chapters || []}
        currentOffset={pages[pageIndex]?.startOffset || 0}
        onJump={jumpToChapter}
        palette={palette}
      />

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        fontStep={fontStep}
        onFontStepChange={setFontStep}
        palette={palette}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pagerWrap: { flex: 1 },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  progressFill: {
    height: '100%',
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11, marginTop: 2 },
  bottomChrome: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 10,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomBtnText: { fontSize: 12, fontWeight: '600' },
  pageInfo: { flex: 1, alignItems: 'center' },
  backBtn: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
  },
});

export default ReflowableReader;
