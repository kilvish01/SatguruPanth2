import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../../components/shared/CustomText';
import { bookAPI } from '../../../services/bookService';

const BookReader = ({ route, navigation }) => {
  const { book } = route.params;
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBook();
  }, []);

  const loadBook = async () => {
    try {
      const bookId = book._id || book.BookID || book.bookId;
      const bookData = await bookAPI.getBook(bookId);
      setPdfUrl(bookData.pdfUrl);
      setLoading(false);
    } catch (error) {
      console.error('Error loading book:', error);
      setLoading(false);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/hammer.js/2.0.8/hammer.min.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        body {
          background: #f0f0f0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          touch-action: pan-y;
        }
        #pdf-container {
          width: 100%;
          height: calc(100vh - 120px);
          overflow-y: auto;
          text-align: center;
          padding: 15px;
          transition: opacity 0.3s ease;
        }
        canvas {
          max-width: 100%;
          height: auto;
          margin: 0 auto;
          display: block;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-radius: 8px;
          background: white;
        }
        .controls {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #ddd;
          padding: 15px 20px;
          padding-bottom: 60px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 120px;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        }
        .btn-group {
          display: flex;
          gap: 10px;
        }
        button {
          background: #000;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-width: 80px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        button:active:not(:disabled) {
          transform: scale(0.95);
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .page-info {
          font-size: 15px;
          font-weight: 600;
          color: #000;
          background: #f0f0f0;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #ddd;
        }
        .loading {
          color: #000;
          text-align: center;
          padding: 50px;
          font-size: 18px;
          font-weight: 500;
        }
        .swipe-hint {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          font-size: 40px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .swipe-hint.left {
          left: 30px;
        }
        .swipe-hint.right {
          right: 30px;
        }
        .swipe-hint.show {
          opacity: 0.6;
        }
        .page-transition {
          opacity: 0.5;
        }
      </style>
    </head>
    <body>
      <div id="loading" class="loading">📖 Loading PDF...</div>
      <div id="pdf-container"></div>
      <div class="swipe-hint left" id="swipe-left">◀</div>
      <div class="swipe-hint right" id="swipe-right">▶</div>
      <div class="controls">
        <button id="prev" onclick="prevPage()" disabled>◀ Previous</button>
        <span class="page-info">
          <span id="page-num">1</span> / <span id="page-count">0</span>
        </span>
        <button id="next" onclick="nextPage()" disabled>Next ▶</button>
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

          if (showTransition) {
            container.classList.add('page-transition');
          }

          pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({scale: scale});
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            container.innerHTML = '';
            container.appendChild(canvas);

            page.render({canvasContext: ctx, viewport: viewport}).promise.then(function() {
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
          window.ReactNativeWebView.postMessage(JSON.stringify({page: num, total: pdfDoc.numPages}));
        }

        function queueRenderPage(num) {
          if (pageRendering) {
            pageNumPending = num;
          } else {
            renderPage(num, true);
          }
        }

        function prevPage() {
          if (pageNum <= 1) return;
          pageNum--;
          queueRenderPage(pageNum);
        }

        function nextPage() {
          if (pageNum >= pdfDoc.numPages) return;
          pageNum++;
          queueRenderPage(pageNum);
        }

        // Initialize Hammer.js for swipe gestures
        const body = document.body;
        const hammer = new Hammer(body);

        hammer.on('swipeleft', function() {
          if (pageNum < pdfDoc.numPages) {
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

        pdfjsLib.getDocument({
          url: '${pdfUrl}',
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
          document.getElementById('loading').innerHTML = '❌ Error loading PDF<br><small>' + error.message + '</small>';
        });
      </script>
    </body>
    </html>
  `;

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setCurrentPage(data.page);
      setTotalPages(data.total);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <CustomText variant="h6" fontFamily="SemiBold" numberOfLines={1} style={styles.title}>
            {book.title}
          </CustomText>
        </View>
        {totalPages > 1 && (
          <View style={styles.pageInfo}>
            <CustomText variant="h7" style={styles.pageText}>
              {currentPage}/{totalPages}
            </CustomText>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <CustomText variant="h5" style={{ marginTop: 10, color: '#000' }}>Loading book...</CustomText>
        </View>
      ) : (
        <WebView
          source={{ html: htmlContent }}
          style={styles.webview}
          onMessage={onMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          originWhitelist={['*']}
          mixedContentMode="always"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  backButton: {
    padding: 5,
    marginRight: 5
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 10
  },
  title: {
    color: '#000'
  },
  pageInfo: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  pageText: {
    color: '#000',
    fontWeight: '600'
  },
  webview: {
    flex: 1,
    backgroundColor: '#f0f0f0'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0'
  }
});

export default BookReader;
