import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
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

  const heartScale = useSharedValue(1);

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

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    heartScale.value = withSpring(1.4, { damping: 8, stiffness: 240 }, () => {
      heartScale.value = withSpring(1);
    });

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

  const progress = totalPages > 0 ? currentPage / totalPages : 0;

  const htmlContent = useMemo(() => {
    if (!pdfUrl) return '';
    const safePdfUrl = pdfUrl.replace(/'/g, "\\'");
    const bgColor = isDark ? '#0E0C09' : '#FAF8F3';
    const surfaceColor = isDark ? '#181613' : '#FFFFFF';
    const textColor = isDark ? '#F5F1E8' : '#1A1814';
    const accentColor = isDark ? '#E5B53E' : '#C8932B';
    const borderColor = isDark ? '#2C2925' : '#E8E2D5';

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      background: ${bgColor};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      touch-action: pan-y;
      color: ${textColor};
    }
    #pdf-container {
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      text-align: center;
      padding: 20px 12px 100px 12px;
      transition: opacity 0.25s ease;
    }
    canvas {
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      display: block;
      box-shadow: 0 8px 32px rgba(0,0,0,${isDark ? '0.5' : '0.12'});
      border-radius: 12px;
      background: ${surfaceColor};
    }
    .loading {
      color: ${textColor};
      text-align: center;
      padding: 80px 20px;
      font-size: 15px;
      font-weight: 500;
      opacity: 0.7;
    }
    .swipe-hint {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 22px;
      background: rgba(0,0,0,0.5);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    .swipe-hint.left { left: 16px; }
    .swipe-hint.right { right: 16px; }
    .swipe-hint.show { opacity: 0.85; }
    .page-transition { opacity: 0.4; }
    .floating-controls {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${surfaceColor};
      border: 1px solid ${borderColor};
      box-shadow: 0 12px 32px rgba(0,0,0,${isDark ? '0.4' : '0.10'});
      padding: 10px 16px;
      border-radius: 999px;
    }
    .nav-btn {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      background: transparent;
      color: ${textColor};
      border: none;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:disabled { opacity: 0.3; }
    .nav-btn:active:not(:disabled) { background: ${bgColor}; }
    .page-pill {
      font-size: 13px;
      font-weight: 600;
      color: ${textColor};
      padding: 6px 14px;
      border-radius: 999px;
      background: ${bgColor};
      min-width: 60px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">Loading…</div>
  <div id="pdf-container"></div>
  <div class="swipe-hint left" id="swipe-left">‹</div>
  <div class="swipe-hint right" id="swipe-right">›</div>
  <div class="floating-controls">
    <button id="prev" class="nav-btn" onclick="prevPage()" disabled>‹</button>
    <span class="page-pill"><span id="page-num">1</span> / <span id="page-count">…</span></span>
    <button id="next" class="nav-btn" onclick="nextPage()" disabled>›</button>
  </div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const scale = 1.8;

    function renderPage(num, showTransition = false) {
      pageRendering = true;
      const container = document.getElementById('pdf-container');
      if (showTransition) container.classList.add('page-transition');

      pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        container.innerHTML = '';
        container.appendChild(canvas);
        page.render({ canvasContext: ctx, viewport }).promise.then(function() {
          pageRendering = false;
          container.classList.remove('page-transition');
          if (pageNumPending !== null) {
            renderPage(pageNumPending, true);
            pageNumPending = null;
          }
        });
      });

      document.getElementById('page-num').textContent = num;
      document.getElementById('prev').disabled = (num <= 1);
      document.getElementById('next').disabled = (num >= pdfDoc.numPages);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({page: num, total: pdfDoc.numPages}));
      }
    }

    function queueRenderPage(num) {
      if (pageRendering) pageNumPending = num;
      else renderPage(num, true);
    }
    function prevPage() { if (pageNum > 1) { pageNum--; queueRenderPage(pageNum); } }
    function nextPage() { if (pdfDoc && pageNum < pdfDoc.numPages) { pageNum++; queueRenderPage(pageNum); } }

    const hammer = new Hammer(document.body);
    hammer.on('swipeleft', function() {
      if (pdfDoc && pageNum < pdfDoc.numPages) {
        const hint = document.getElementById('swipe-right');
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 250);
        nextPage();
      }
    });
    hammer.on('swiperight', function() {
      if (pageNum > 1) {
        const hint = document.getElementById('swipe-left');
        hint.classList.add('show');
        setTimeout(() => hint.classList.remove('show'), 250);
        prevPage();
      }
    });

    pdfjsLib.getDocument({
      url: '${safePdfUrl}',
      withCredentials: false,
      isEvalSupported: false
    }).promise.then(function(pdf) {
      pdfDoc = pdf;
      document.getElementById('page-count').textContent = pdf.numPages;
      document.getElementById('loading').style.display = 'none';
      renderPage(pageNum);
      document.getElementById('prev').disabled = false;
      document.getElementById('next').disabled = false;
    }).catch(function(error) {
      document.getElementById('loading').innerHTML = 'Could not load this book. Please try again.';
    });
  </script>
</body>
</html>`;
  }, [pdfUrl, isDark]);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data?.page === 'number') setCurrentPage(data.page);
      if (typeof data?.total === 'number') setTotalPages(data.total);
    } catch {
      // ignore malformed message
    }
  };

  return (
    <Screen edges={['top']}>
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
              {
                width: `${progress * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      )}

      {loading ? (
        <View style={[styles.loadingWrap, { backgroundColor: colors.bg }]}>
          <Skeleton width="80%" height={400} radius={16} />
          <Text variant="bodySm" muted style={{ marginTop: spacing.lg }}>
            Preparing your reading…
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
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
          <WebView
            source={{ html: htmlContent }}
            style={{ flex: 1, backgroundColor: colors.bg }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        </Animated.View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
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
});

export default BookReader;
