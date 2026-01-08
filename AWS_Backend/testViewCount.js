const dynamoService = require('./services/dynamoService');

async function testViewCount() {
    try {
        console.log('Testing view count increment...');
        
        // Get current book data
        const beforeBook = await dynamoService.getMetadata('1767695680205');
        console.log('Before - viewCount:', beforeBook.viewCount);
        
        // Increment view count
        await dynamoService.incrementViewCount('1767695680205');
        console.log('View count incremented');
        
        // Get updated book data
        const afterBook = await dynamoService.getMetadata('1767695680205');
        console.log('After - viewCount:', afterBook.viewCount);
        
        if (afterBook.viewCount > beforeBook.viewCount) {
            console.log('✅ View count increment working!');
        } else {
            console.log('❌ View count not incremented');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testViewCount();