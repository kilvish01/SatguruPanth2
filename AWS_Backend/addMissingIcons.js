const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

// SVG generation function
function generateSvgIcon(hindName, themeColor1, themeColor2, symbol) {
    const symbols = {
        mala: `<circle cx="100" cy="180" r="8" fill="${themeColor2}"/><circle cx="80" cy="165" r="6" fill="${themeColor2}"/><circle cx="120" cy="165" r="6" fill="${themeColor2}"/><circle cx="65" cy="145" r="5" fill="${themeColor2}"/><circle cx="135" cy="145" r="5" fill="${themeColor2}"/><circle cx="55" cy="120" r="4" fill="${themeColor2}"/><circle cx="145" cy="120" r="4" fill="${themeColor2}"/>`,
        path: `<path d="M100,200 Q60,150 100,100 Q140,150 100,200" stroke="${themeColor2}" stroke-width="3" fill="none"/><circle cx="100" cy="90" r="12" fill="${themeColor2}"/><path d="M90,85 L100,75 L110,85" stroke="#fff" stroke-width="2" fill="none"/>`,
        lotus: `<path d="M100,200 C100,200 70,170 100,140 C130,170 100,200 100,200" fill="${themeColor2}"/><path d="M100,180 C100,180 60,150 100,120 C140,150 100,180 100,180" fill="${themeColor2}" opacity="0.8"/><path d="M100,160 C100,160 50,130 100,100 C150,130 100,160 100,160" fill="${themeColor2}" opacity="0.6"/>`,
        voice: `<circle cx="100" cy="140" r="30" fill="${themeColor2}" opacity="0.3"/><circle cx="100" cy="140" r="20" fill="${themeColor2}" opacity="0.5"/><circle cx="100" cy="140" r="10" fill="${themeColor2}"/><path d="M70,170 Q100,200 130,170" stroke="${themeColor2}" stroke-width="3" fill="none"/>`,
    };

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${themeColor1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${themeColor1};stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="url(#bg)"/>
  <rect x="8" y="8" width="184" height="264" fill="none" stroke="${themeColor2}" stroke-width="2" opacity="0.4"/>
  <text x="100" y="50" font-family="Arial, sans-serif" font-size="18" fill="${themeColor2}" text-anchor="middle" font-weight="bold">${hindName}</text>
  ${symbols[symbol] || symbols.lotus}
</svg>`;
    return svg;
}

function svgToBase64DataUri(svgString) {
    const base64 = Buffer.from(svgString, 'utf-8').toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

// Missing books configuration
const missingBooks = [
    { title: 'सत्संग माला', filename: 'satsangMala.pdf', hindName: 'सत्संग माला', color1: '#2E7D32', color2: '#FFD700', symbol: 'mala' },
    { title: 'सत्य पथ', filename: 'AatmbodhMala.pdf', hindName: 'सत्य पथ', color1: '#5D4037', color2: '#FFA726', symbol: 'path' },
    { title: 'सार वाणी', filename: 'SaarVani.pdf', hindName: 'सार वाणी', color1: '#1565C0', color2: '#FFD54F', symbol: 'voice' },
    { title: 'आत्मबोध माला', filename: 'AatmbodhMala.pdf', hindName: 'आत्मबोध माला', color1: '#6A1B9A', color2: '#FFC107', symbol: 'lotus' },
];

async function addMissingIcons() {
    console.log('Adding icons for missing books...\n');

    // Get all books from DB
    const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BOOK' }
    }).promise();

    for (const config of missingBooks) {
        // Find the book in DB by title
        const book = result.Items.find(b => b.title === config.title);

        if (!book) {
            console.log(`Book not found: ${config.title}`);
            continue;
        }

        // Skip if already has icon
        if (book.coverImage && book.coverImage.startsWith('data:image/svg')) {
            console.log(`Book already has icon: ${config.title}`);
            continue;
        }

        // Generate and embed icon
        const svg = generateSvgIcon(config.hindName, config.color1, config.color2, config.symbol);
        const dataUri = svgToBase64DataUri(svg);

        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { BookID: book.BookID },
            UpdateExpression: 'SET coverImage = :icon',
            ExpressionAttributeValues: { ':icon': dataUri }
        }).promise();

        console.log(`✓ Added icon for: ${config.title}`);
    }

    console.log('\nDone!');
}

addMissingIcons().catch(console.error);
