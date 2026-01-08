const dynamoService = require('./services/dynamoService');

async function testService() {
    try {
        console.log('Testing dynamoService.getMetadata...');
        const result = await dynamoService.getMetadata('1767695680205');
        console.log('Result:', result ? 'Found' : 'Not found');
        if (result) {
            console.log('Book title:', result.title);
        }
    } catch (error) {
        console.error('Service error:', error.message);
    }
}

testService();