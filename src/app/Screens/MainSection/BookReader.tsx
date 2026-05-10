import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Pressable, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useTheme } from '../../../theme/ThemeContext';
import { Text } from '../../../components/ui/Text';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Screen } from '../../../components/ui/Screen';
import { bookAPI } from '../../../services/bookService';
import { sanitizeText } from '../../../security/validation';

const BookReader = ({ route, navigation }: any) => {
  const { book } = route.params;
  const { colors, spacing, radius, isDark } = useTheme();

  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [likeCount, setLikeCount] = useState(book.likeCount || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const heartScale = useSharedValue(1);
  const headerY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const controlsY = useSharedValue(0);
  const controlsOpacity = useSharedValue(1);
  const toastOpacity = useSharedValue(0);
  const toastY = useSharedValue(20);
  const bookOpenScale = useSharedValue(0.85);
  const bookOpenOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const lastTapRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPageRef = useRef(1);

  const loadBook = useCallback(async () => {
    try {
      const bookId = book._id || book.BookID || book.bookId;
      const bookData = await bookAPI.getBook(bookId);
      const url = bookData?.pdfUrl;
      if (!url) {
        setError('PDF URL unavailable');
      } else {
        setPdfUrl(url);
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to load book');
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  useEffect(() => {
    if (!loading && !error) {
      bookOpenScale.value = withSpring(1, { damping: 14, stiffness: 130, mass: 1.1 });
      bookOpenOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    }
  }, [loading, error, bookOpenScale, bookOpenOpacity]);

  useEffect(() => {
    const target = totalPages > 0 ? currentPage / totalPages : 0;
    progressWidth.value = withTiming(target, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [currentPage, totalPages, progressWidth]);

  useEffect(() => {
    if (currentPage !== previousPageRef.current && totalPages > 1) {
      previousPageRef.current = currentPage;
      Haptics.selectionAsync().catch(() => {});
      toastOpacity.value = withSequence(
        withTiming(1, { duration: 180 }),
        withDelay(900, withTiming(0, { duration: 240 }))
      );
      toastY.value = withSequence(
        withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withDelay(900, withTiming(20, { duration: 240 }))
      );
    }
  }, [currentPage, totalPages, toastOpacity, toastY]);

  const setUiVisibleSafe = useCallback((v: boolean) => setUiVisible(v), []);

  const toggleUi = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 200) return;
    lastTapRef.current = now;

    setUiVisible((prev) => {
      const next = !prev;
      headerY.value = withSpring(next ? 0 : -120, { damping: 18, stiffness: 200 });
      headerOpacity.value = withTiming(next ? 1 : 0, { duration: 220 });
      controlsY.value = withSpring(next ? 0 : 100, { damping: 18, stiffness: 200 });
      controlsOpacity.value = withTiming(next ? 1 : 0, { duration: 220 });
      Haptics.selectionAsync().catch(() => {});
      return next;
    });
  }, [headerY, headerOpacity, controlsY, controlsOpacity]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    heartScale.value = withSequence(
      withSpring(1.5, { damping: 6, stiffness: 280 }),
      withSpring(1, { damping: 14, stiffness: 220 })
    );

    const wasLiked = isLiked;
    setLikeCount((p: number) => Math.max(0, wasLiked ? p - 1 : p + 1));
    setIsLiked(!wasLiked);

    try {
      const bookId = book._id || book.BookID || book.bookId;
      await bookAPI.likeBook(bookId, wasLiked ? 'unlike' : 'like');
    } catch {
      setLikeCount((p: number) => Math.max(0, wasLiked ? p + 1 : p - 1));
      setIsLiked(wasLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlsY.value }],
    opacity: controlsOpacity.value,
  }));

  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: toastY.value }],
  }));

  const bookOpenStyle = useAnimatedStyle(() => ({
    opacity: bookOpenOpacity.value,
    transform: [
      { scale: bookOpenScale.value },
      {
        rotateY: `${interpolate(
          bookOpenScale.value,
          [0.85, 1],
          [-8, 0],
          Extrapolation.CLAMP
        )}deg`,
      },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const htmlContent = useMemo(() => {
    if (!pdfUrl) return '';
    const safePdfUrl = pdfUrl.replace(/'/g, "\\'");
    const bgColor = isDark ? '#0E0C09' : '#FAF8F3';
    const surfaceColor = isDark ? '#181613' : '#FFFFFF';
    const textColor = isDark ? '#F5F1E8' : '#1A1814';

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { height: 100%; }
    body {
      background: ${bgColor};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      touch-action: pan-y;
      color: ${textColor};
      perspective: 1200px;
    }
    #stage {
      width: 100%;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }
    .page-layer {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      text-align: center;
      padding: 20px 10px 80px 10px;
      transform-origin: left center;
      backface-visibility: hidden;
      transition: transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease;
      will-change: transform, opacity;
    }
    .page-layer.enter-from-right {
      transform: translateX(8%);
      opacity: 0;
    }
    .page-layer.enter-from-left {
      transform: translateX(-8%);
      opacity: 0;
    }
    .page-layer.exit-to-left {
      transform: translateX(-12%);
      opacity: 0;
    }
    .page-layer.exit-to-right {
      transform: translateX(12%);
      opacity: 0;
    }
    .page-layer.center {
      transform: translateX(0);
      opacity: 1;
    }
    canvas {
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      display: block;
      box-shadow: 0 12px 40px rgba(0,0,0,${isDark ? '0.55' : '0.14'}), 0 2px 8px rgba(0,0,0,${isDark ? '0.4' : '0.06'});
      border-radius: 6px;
      background: ${surfaceColor};
    }
    .loading {
      color: ${textColor};
      text-align: center;
      padding: 80px 20px;
      font-size: 14px;
      font-weight: 500;
      opacity: 0.6;
      letter-spacing: 0.5px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2.5px solid ${textColor}30;
      border-top-color: ${textColor};
      border-radius: 50%;
      animation: spin 800ms linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .swipe-hint {
      position: fixed;
      top: 50%;
      transform: translateY(-50%) scale(0.6);
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: ${surfaceColor};
      color: ${textColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      opacity: 0;
      transition: opacity 200ms ease, transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(0,0,0,${isDark ? '0.5' : '0.12'});
    }
    .swipe-hint.left { left: 16px; }
    .swipe-hint.right { right: 16px; }
    .swipe-hint.show {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
  </style>
</head>
<body>
  <div id="stage">
    <div id="loading" class="loading"><div class="spinner"></div>Opening book…</div>
    <div id="page-a" class="page-layer center"></div>
    <div id="page-b" class="page-layer center" style="display:none"></div>
  </div>
  <div class="swipe-hint left" id="swipe-left">‹</div>
  <div class="swipe-hint right" id="swipe-right">›</div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    let activeLayer = 'a';
    const scale = 1.85;

    function getActiveEl() { return document.getElementById('page-' + activeLayer); }
    function getInactiveEl() { return document.getElementById('page-' + (activeLayer === 'a' ? 'b' : 'a')); }

    function renderPage(num, direction) {
      if (!pdfDoc) return;
      pageRendering = true;
      const incoming = getInactiveEl();
      const outgoing = getActiveEl();

      pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        incoming.innerHTML = '';
        incoming.appendChild(canvas);
        incoming.style.display = 'block';
        incoming.scrollTop = 0;

        page.render({ canvasContext: ctx, viewport }).promise.then(function() {
          if (direction === 'next') {
            incoming.classList.remove('center', 'enter-from-left', 'exit-to-left', 'exit-to-right');
            incoming.classList.add('enter-from-right');
          } else if (direction === 'prev') {
            incoming.classList.remove('center', 'enter-from-right', 'exit-to-left', 'exit-to-right');
            incoming.classList.add('enter-from-left');
          } else {
            incoming.classList.remove('enter-from-left', 'enter-from-right');
            incoming.classList.add('center');
          }

          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              incoming.classList.remove('enter-from-left', 'enter-from-right');
              incoming.classList.add('center');
              if (direction === 'next') {
                outgoing.classList.remove('center');
                outgoing.classList.add('exit-to-left');
              } else if (direction === 'prev') {
                outgoing.classList.remove('center');
                outgoing.classList.add('exit-to-right');
              }
            });
          });

          setTimeout(function() {
            outgoing.style.display = 'none';
            outgoing.classList.remove('exit-to-left', 'exit-to-right');
            activeLayer = activeLayer === 'a' ? 'b' : 'a';
            pageRendering = false;
            if (pageNumPending !== null) {
              const dir = pageNumPending > num ? 'next' : 'prev';
              const next = pageNumPending;
              pageNumPending = null;
              renderPage(next, dir);
            }
          }, 340);
        });
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ page: num, total: pdfDoc.numPages }));
      }
    }

    function queue(num, direction) {
      if (pageRendering) {
        pageNumPending = num;
      } else {
        renderPage(num, direction);
      }
    }
    function prevPage() { if (pageNum > 1) { pageNum--; queue(pageNum, 'prev'); } }
    function nextPage() { if (pdfDoc && pageNum < pdfDoc.numPages) { pageNum++; queue(pageNum, 'next'); } }

    const hammer = new Hammer(document.body);
    hammer.on('swipeleft', function() {
      if (pdfDoc && pageNum < pdfDoc.numPages) {
        const hint = document.getElementById('swipe-right');
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 300);
        nextPage();
      }
    });
    hammer.on('swiperight', function() {
      if (pageNum > 1) {
        const hint = document.getElementById('swipe-left');
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 300);
        prevPage();
      }
    });
    hammer.on('tap', function(ev) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'tap' }));
      }
    });

    pdfjsLib.getDocument({
      url: '${safePdfUrl}',
      withCredentials: false,
      isEvalSupported: false
    }).promise.then(function(pdf) {
      pdfDoc = pdf;
      document.getElementById('loading').style.display = 'none';
      renderPage(pageNum, 'none');
    }).catch(function(error) {
      document.getElementById('loading').innerHTML = 'Could not load this book.<br><small style="opacity:0.6">Please try again.</small>';
    });

    window.__nav = { next: nextPage, prev: prevPage };
  </script>
</body>
</html>`;
  }, [pdfUrl, isDark]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.event === 'tap') {
        toggleUi();
        return;
      }
      if (typeof data?.page === 'number') setCurrentPage(data.page);
      if (typeof data?.total === 'number') setTotalPages(data.total);
    } catch {
      // ignore malformed message
    }
  };

  const webviewRef = useRef<WebView>(null);

  const goPrev = () => {
    if (currentPage <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    webviewRef.current?.injectJavaScript('window.__nav && window.__nav.prev(); true;');
  };
  const goNext = () => {
    if (currentPage >= totalPages) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    webviewRef.current?.injectJavaScript('window.__nav && window.__nav.next(); true;');
  };

  return (
    <Screen edges={['top']}>
      <Animated.View style={[styles.headerWrap, headerStyle]} pointerEvents={uiVisible ? 'auto' : 'none'}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              navigation.goBack();
            }}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceMuted }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text variant="bodySm" weight="semibold" numberOfLines={1}>
              {sanitizeText(book.title || 'Untitled')}
            </Text>
            {totalPages > 1 && (
              <Text variant="caption" subtle style={{ marginTop: 1 }}>
                Page {currentPage} of {totalPages}
              </Text>
            )}
          </View>
          <Pressable
            onPress={handleLike}
            disabled={isLiking}
            style={[
              styles.likeBtn,
              {
                backgroundColor: isLiked ? colors.dangerMuted : colors.surfaceMuted,
                borderRadius: radius.pill,
              },
            ]}
          >
            <Animated.View style={heartStyle}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? colors.danger : colors.text}
              />
            </Animated.View>
            <Text
              variant="caption"
              weight="semibold"
              color={isLiked ? colors.danger : colors.text}
            >
              {likeCount}
            </Text>
          </Pressable>
        </View>

        {totalPages > 1 && (
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
            <Animated.View
              style={[
                styles.progressFill,
                progressStyle,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        )}
      </Animated.View>

      {loading ? (
        <View style={[styles.loadingWrap, { backgroundColor: colors.bg }]}>
          <Skeleton width={220} height={300} radius={12} />
          <Text variant="bodySm" muted style={{ marginTop: spacing.lg, letterSpacing: 0.6 }}>
            Opening the book…
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.errorWrap, { padding: spacing.xl }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textSubtle} />
          <Text variant="h3" weight="semibold" centered style={{ marginTop: spacing.md }}>
            Couldn't open this book
          </Text>
          <Text variant="bodySm" muted centered style={{ marginTop: spacing.xs }}>
            {error}
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              setError(null);
              loadBook();
            }}
            style={[styles.retry, { backgroundColor: colors.primary, borderRadius: radius.pill }]}
          >
            <Text variant="bodySm" weight="semibold" color={colors.primaryFg}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View style={[styles.webviewWrap, bookOpenStyle]}>
          <WebView
            ref={webviewRef}
            source={{ html: htmlContent }}
            style={{ flex: 1, backgroundColor: colors.bg }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            scrollEnabled
          />
        </Animated.View>
      )}

      {totalPages > 1 && !loading && !error && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            toastStyle,
            { bottom: 110, backgroundColor: colors.bgGlass, borderColor: colors.border },
          ]}
        >
          <Text variant="caption" weight="semibold">
            {currentPage} / {totalPages}
          </Text>
        </Animated.View>
      )}

      {totalPages > 1 && !loading && !error && (
        <Animated.View
          style={[styles.controlsWrap, controlsStyle]}
          pointerEvents={uiVisible ? 'auto' : 'none'}
        >
          <View style={[styles.controls, { backgroundColor: colors.bgGlass, borderColor: colors.border }]}>
            <Pressable
              onPress={goPrev}
              disabled={currentPage <= 1}
              style={[
                styles.navBtn,
                { opacity: currentPage <= 1 ? 0.35 : 1, backgroundColor: colors.surfaceMuted },
              ]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.pagePill}>
              <Text variant="caption" weight="semibold">
                {currentPage} <Text variant="caption" subtle>· {totalPages}</Text>
              </Text>
            </View>
            <Pressable
              onPress={goNext}
              disabled={currentPage >= totalPages}
              style={[
                styles.navBtn,
                { opacity: currentPage >= totalPages ? 0.35 : 1, backgroundColor: colors.surfaceMuted },
              ]}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retry: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  webviewWrap: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  controlsWrap: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

export default BookReader;
