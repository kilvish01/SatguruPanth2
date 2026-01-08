const bookService = require('./services/bookService');

async function testGetBook() {
    try {
        console.log('Testing bookService.getBook with ID: 1767695680205');
        const result = await bookService.getBook('1767695680205');
        console.log('Success:', result);
    } catch (error) {
        console.error('Error:', error.message);
        
        // Test the underlying dynamoService directly
        const dynamoService = require('./services/dynamoService');
        try {
            console.log('\nTesting dynamoService.getMetadata directly...');
            const metadata = await dynamoService.getMetadata('1767695680205');
            console.log('DynamoDB result:', metadata ? 'Found' : 'Not found');
            if (metadata) {
                console.log('Title:', metadata.title);
            }
        } catch (dynamoError) {
            console.error('DynamoDB error:', dynamoError.message);
        }
    }
}

testGetBook();