const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://k14jep2w9e.execute-api.us-east-1.amazonaws.com/dev';
const TEST_RESULTS = [];
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

// Helper functions
function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

function addTestResult(endpoint, method, status, passed, responseTime, details = '') {
  TEST_RESULTS.push({
    endpoint,
    method,
    status,
    passed,
    responseTime,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test functions
async function testGetAllBooks() {
  log('\n📚 Testing: GET /api/books/all', COLORS.BOLD);

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/api/books/all`);
    const responseTime = Date.now() - startTime;

    // Check if response is an array or has a books property
    const books = Array.isArray(response.data) ? response.data : response.data.books;

    if (response.status === 200 && books) {
      logSuccess(`Success - Retrieved ${books.length} books in ${responseTime}ms`);
      addTestResult('/api/books/all', 'GET', 200, true, responseTime, `${books.length} books found`);
      return books; // Return books for use in other tests
    } else {
      logError('Unexpected response format');
      addTestResult('/api/books/all', 'GET', response.status, false, responseTime, 'Unexpected format');
      return [];
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult('/api/books/all', 'GET', error.response?.status || 0, false, responseTime, error.message);
    return [];
  }
}

async function testGetBookById(bookId) {
  log('\n📖 Testing: GET /api/books/{bookId}', COLORS.BOLD);

  if (!bookId) {
    logWarning('No book ID provided - skipping test');
    return null;
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/api/books/${bookId}`);
    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.BookID) {
      logSuccess(`Success - Retrieved book "${response.data.title}" in ${responseTime}ms`);
      logInfo(`  View Count: ${response.data.viewCount}`);
      logInfo(`  Like Count: ${response.data.likeCount}`);
      logInfo(`  PDF URL provided: ${response.data.pdfUrl ? 'Yes' : 'No'}`);
      addTestResult(`/api/books/${bookId}`, 'GET', 200, true, responseTime, `Book: ${response.data.title}`);
      return response.data;
    } else {
      logError('Unexpected response format');
      addTestResult(`/api/books/${bookId}`, 'GET', response.status, false, responseTime, 'Unexpected format');
      return null;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult(`/api/books/${bookId}`, 'GET', error.response?.status || 0, false, responseTime, error.message);
    return null;
  }
}

async function testGetMostViewed(limit = 10) {
  log('\n👁️  Testing: GET /api/books/popular/viewed', COLORS.BOLD);

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/api/books/popular/viewed?limit=${limit}`);
    const responseTime = Date.now() - startTime;

    const books = Array.isArray(response.data) ? response.data : response.data.books;

    if (response.status === 200 && books) {
      logSuccess(`Success - Retrieved ${books.length} most viewed books in ${responseTime}ms`);

      // Display top 3
      if (books.length > 0) {
        logInfo('  Top 3 Most Viewed:');
        books.slice(0, 3).forEach((book, idx) => {
          logInfo(`    ${idx + 1}. "${book.title}" - ${book.viewCount} views`);
        });
      }

      addTestResult('/api/books/popular/viewed', 'GET', 200, true, responseTime, `${books.length} books`);
      return books;
    } else {
      logError('Unexpected response format');
      addTestResult('/api/books/popular/viewed', 'GET', response.status, false, responseTime, 'Unexpected format');
      return [];
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult('/api/books/popular/viewed', 'GET', error.response?.status || 0, false, responseTime, error.message);
    return [];
  }
}

async function testGetMostLiked(limit = 10) {
  log('\n❤️  Testing: GET /api/books/popular/liked', COLORS.BOLD);

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/api/books/popular/liked?limit=${limit}`);
    const responseTime = Date.now() - startTime;

    const books = Array.isArray(response.data) ? response.data : response.data.books;

    if (response.status === 200 && books) {
      logSuccess(`Success - Retrieved ${books.length} most liked books in ${responseTime}ms`);

      // Display top 3
      if (books.length > 0) {
        logInfo('  Top 3 Most Liked:');
        books.slice(0, 3).forEach((book, idx) => {
          logInfo(`    ${idx + 1}. "${book.title}" - ${book.likeCount} likes`);
        });
      }

      addTestResult('/api/books/popular/liked', 'GET', 200, true, responseTime, `${books.length} books`);
      return books;
    } else {
      logError('Unexpected response format');
      addTestResult('/api/books/popular/liked', 'GET', response.status, false, responseTime, 'Unexpected format');
      return [];
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult('/api/books/popular/liked', 'GET', error.response?.status || 0, false, responseTime, error.message);
    return [];
  }
}

async function testLikeBook(bookId) {
  log('\n💖 Testing: POST /api/books/{bookId}/like', COLORS.BOLD);

  if (!bookId) {
    logWarning('No book ID provided - skipping test');
    return false;
  }

  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/api/books/${bookId}/like`);
    const responseTime = Date.now() - startTime;

    if (response.status === 200) {
      logSuccess(`Success - Liked book in ${responseTime}ms`);
      if (response.data.newLikeCount) {
        logInfo(`  New like count: ${response.data.newLikeCount}`);
      }
      addTestResult(`/api/books/${bookId}/like`, 'POST', 200, true, responseTime, 'Book liked');
      return true;
    } else {
      logError('Unexpected response');
      addTestResult(`/api/books/${bookId}/like`, 'POST', response.status, false, responseTime, 'Unexpected response');
      return false;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult(`/api/books/${bookId}/like`, 'POST', error.response?.status || 0, false, responseTime, error.message);
    return false;
  }
}

async function testGetPdf(bookId) {
  log('\n📄 Testing: GET /api/books/{bookId}/pdf', COLORS.BOLD);

  if (!bookId) {
    logWarning('No book ID provided - skipping test');
    return false;
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}/api/books/${bookId}/pdf`, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data) {
      const sizeKB = (response.data.byteLength / 1024).toFixed(2);
      logSuccess(`Success - Retrieved PDF (${sizeKB} KB) in ${responseTime}ms`);
      addTestResult(`/api/books/${bookId}/pdf`, 'GET', 200, true, responseTime, `PDF size: ${sizeKB} KB`);
      return true;
    } else {
      logError('Unexpected response');
      addTestResult(`/api/books/${bookId}/pdf`, 'GET', response.status, false, responseTime, 'Unexpected response');
      return false;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError(`Failed: ${error.message}`);
    addTestResult(`/api/books/${bookId}/pdf`, 'GET', error.response?.status || 0, false, responseTime, error.message);
    return false;
  }
}

async function testInvalidEndpoint() {
  log('\n🚫 Testing: Invalid endpoint handling', COLORS.BOLD);

  const startTime = Date.now();
  try {
    await axios.get(`${API_BASE_URL}/api/books/invalid-id-12345`);
    const responseTime = Date.now() - startTime;

    logWarning('Expected 404, but request succeeded');
    addTestResult('/api/books/invalid-id', 'GET', 200, false, responseTime, 'Should return 404');
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error.response?.status === 404) {
      logSuccess(`Correctly returns 404 for invalid book ID in ${responseTime}ms`);
      addTestResult('/api/books/invalid-id', 'GET', 404, true, responseTime, 'Correct error handling');
    } else {
      logError(`Unexpected error: ${error.message}`);
      addTestResult('/api/books/invalid-id', 'GET', error.response?.status || 0, false, responseTime, error.message);
    }
  }
}

function generateReport() {
  log('\n' + '='.repeat(80), COLORS.BOLD);
  log('📊 TEST SUMMARY REPORT', COLORS.BOLD);
  log('='.repeat(80), COLORS.BOLD);

  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  const avgResponseTime = (TEST_RESULTS.reduce((sum, t) => sum + t.responseTime, 0) / totalTests).toFixed(2);

  log(`\nTotal Tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  log(`Average Response Time: ${avgResponseTime}ms`);

  log('\nDetailed Results:', COLORS.BOLD);
  log('-'.repeat(80));

  TEST_RESULTS.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? COLORS.GREEN : COLORS.RED;
    log(`${status} | ${result.method.padEnd(6)} | ${result.endpoint.padEnd(35)} | ${result.status} | ${result.responseTime}ms`, color);
    if (result.details) {
      log(`     └─ ${result.details}`, COLORS.RESET);
    }
  });

  log('\n' + '='.repeat(80), COLORS.BOLD);

  // Overall status
  if (failedTests === 0) {
    logSuccess(`\n🎉 ALL TESTS PASSED! API is fully functional.`);
  } else {
    logError(`\n⚠️  ${failedTests} test(s) failed. Please review the errors above.`);
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    avgResponseTime,
    results: TEST_RESULTS
  };
}

async function saveReportToFile(reportData) {
  const reportContent = `# API Test Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Tests**: ${reportData.total}
- **Passed**: ${reportData.passed}
- **Failed**: ${reportData.failed}
- **Success Rate**: ${((reportData.passed / reportData.total) * 100).toFixed(2)}%
- **Average Response Time**: ${reportData.avgResponseTime}ms

## Test Results

| Status | Method | Endpoint | HTTP Status | Response Time | Details |
|--------|--------|----------|-------------|---------------|---------|
${reportData.results.map(r =>
  `| ${r.passed ? '✅' : '❌'} | ${r.method} | ${r.endpoint} | ${r.status} | ${r.responseTime}ms | ${r.details} |`
).join('\n')}

## Overall Status
${reportData.failed === 0 ? '✅ **ALL TESTS PASSED**' : `❌ **${reportData.failed} TEST(S) FAILED**`}

## API Health
${reportData.failed === 0 ?
  '🟢 The API is fully operational and all endpoints are working as expected.' :
  '🔴 Some endpoints are experiencing issues. Please review the failed tests above.'}

---
*Report generated by testAllAPIs.js*
`;

  fs.writeFileSync('TEST_REPORT.md', reportContent);
  logInfo('\n📝 Test report saved to TEST_REPORT.md');
}

// Main test runner
async function runAllTests() {
  log('='.repeat(80), COLORS.BOLD);
  log('🚀 Starting API Tests', COLORS.BOLD);
  log(`📡 Base URL: ${API_BASE_URL}`, COLORS.BLUE);
  log('='.repeat(80), COLORS.BOLD);

  let testBookId = null;

  // Test 1: Get all books
  const books = await testGetAllBooks();
  if (books.length > 0) {
    testBookId = books[0].BookID;
    logInfo(`\nUsing book ID for subsequent tests: ${testBookId}`);
  }

  // Test 2: Get book by ID
  await testGetBookById(testBookId);

  // Test 3: Get most viewed books
  await testGetMostViewed(10);

  // Test 4: Get most liked books
  await testGetMostLiked(10);

  // Test 5: Like a book
  await testLikeBook(testBookId);

  // Test 6: Get PDF
  await testGetPdf(testBookId);

  // Test 7: Invalid endpoint
  await testInvalidEndpoint();

  // Generate and display report
  const reportData = generateReport();

  // Save report to file
  await saveReportToFile(reportData);

  // Exit with appropriate code
  process.exit(reportData.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`\n❌ Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
