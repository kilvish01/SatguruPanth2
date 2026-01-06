import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../../components/shared/CustomText';
import { bookAPI } from '../../../services/bookService';

const BookReader = ({ route, navigation }) => {
  const { book } = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const userId = 'user123';

  const pdfUrl = `http://10.232.58.83:3000/api/books/${book._id}/download`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: #525659;
          overflow-x: hidden;
          font-family: Arial, sans-serif;
        }
        #pdf-container {
          width: 100%;
          text-align: center;
          padding: 10px;
        }
        canvas {
          max-width: 100%;
          height: auto;
          margin: 10px auto;
          display: block;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .controls {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.8);
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
        }
        button {
          background: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
        }
        .page-info {
          font-size: 16px;
        }
        .loading {
          color: white;
          text-align: center;
          padding: 50px;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div id="loading" class="loading">Loading PDF...</div>
      <div id="pdf-container"></div>
      <div class="controls">
        <button id="prev" onclick="prevPage()">Previous</button>
        <span class="page-info">
          Page <span id="page-num">1</span> / <span id="page-count">0</span>
        </span>
        <button id="next" onclick="nextPage()">Next</button>
      </div>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        let pdfDoc = null;
        let pageNum = 1;
        let pageRendering = false;
        let pageNumPending = null;
        const scale = 1.5;

        function renderPage(num) {
          pageRendering = true;
          pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({scale: scale});
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };

            const container = document.getElementById('pdf-container');
            container.innerHTML = '';
            container.appendChild(canvas);

            const renderTask = page.render(renderContext);
            renderTask.promise.then(function() {
              pageRendering = false;
              if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
              }
            });
          });

          document.getElementById('page-num').textContent = num;
          window.ReactNativeWebView.postMessage(JSON.stringify({page: num, total: pdfDoc.numPages}));
        }

        function queueRenderPage(num) {
          if (pageRendering) {
            pageNumPending = num;
          } else {
            renderPage(num);
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

        pdfjsLib.getDocument('${pdfUrl}').promise.then(function(pdf) {
          pdfDoc = pdf;
          document.getElementById('page-count').textContent = pdf.numPages;
          document.getElementById('loading').style.display = 'none';
          renderPage(pageNum);
          
          document.getElementById('prev').disabled = false;
          document.getElementById('next').disabled = false;
        }).catch(function(error) {
          document.getElementById('loading').textContent = 'Error loading PDF: ' + error.message;
        });
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const progress = await bookAPI.getProgress(userId, book._id);
      if (progress.currentPage > 0) {
        setCurrentPage(progress.currentPage);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (page, total) => {
    try {
      await bookAPI.updateProgress(userId, book._id, page, total);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setCurrentPage(data.page);
      setTotalPages(data.total);
      saveProgress(data.page, data.total);
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
          <CustomText variant="h6" fontFamily="SemiBold" numberOfLines={1}>
            {book.title}
          </CustomText>
        </View>
        {totalPages > 0 && (
          <View style={styles.pageInfo}>
            <CustomText variant="h7">
              {currentPage}/{totalPages}
            </CustomText>
          </View>
        )}
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#525659'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingTop: Platform.OS === 'ios' ? 50 : 40
  },
  backButton: {
    padding: 5
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 15
  },
  pageInfo: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  webview: {
    flex: 1,
    backgroundColor: '#525659'
  }
});

export default BookReader;
