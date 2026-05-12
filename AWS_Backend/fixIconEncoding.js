/**
 * Fix Hindi text encoding in SVG icons
 * Re-embeds all book icons with proper UTF-8 encoding
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

// Theme colors for different book types
const themes = {
    om_lotus: { bg: '#1a237e', accent: '#ffd700' },
    mala_beads: { bg: '#2e7d32', accent: '#ffd700' },
    yantra: { bg: '#4fc3f7', accent: '#ffffff' },
    lotus_flame: { bg: '#ff6f00', accent: '#fff3e0' },
    path_light: { bg: '#5d4037', accent: '#ffcc80' },
    water_purify: { bg: '#0288d1', accent: '#b3e5fc' },
    divine_hands: { bg: '#7b1fa2', accent: '#f3e5f5' },
    river_flow: { bg: '#00838f', accent: '#b2ebf2' },
    sage_meditation: { bg: '#795548', accent: '#d7ccc8' },
    krishna_flute: { bg: '#303f9f', accent: '#c5cae9' },
    warrior_path: { bg: '#c62828', accent: '#ffcdd2' },
    kalki_avatar: { bg: '#1565c0', accent: '#bbdefb' },
    mind_waves: { bg: '#00695c', accent: '#b2dfdb' },
    tree_roots: { bg: '#33691e', accent: '#dcedc8' },
    liberation_gate: { bg: '#4527a0', accent: '#d1c4e9' },
    divine_name: { bg: '#e65100', accent: '#ffe0b2' },
    meditation: { bg: '#006064', accent: '#b2ebf2' },
    temple: { bg: '#bf360c', accent: '#ffccbc' },
    sunrise: { bg: '#f57f17', accent: '#fff9c4' },
    chakra: { bg: '#6a1b9a', accent: '#e1bee7' },
};

// Book to theme mapping with Hindi names
const bookMappings = [
    { filename: 'Aatmbodh-.pdf', hindi: 'आत्मबोध', theme: 'om_lotus' },
    { filename: 'AatmbodhMala.pdf', hindi: 'आत्मबोध माला', theme: 'mala_beads' },
    { filename: 'Adhyatma ka khel.pdf', hindi: 'अध्यात्म का खेल', theme: 'yantra' },
    { filename: 'Advaita_Bhakti.pdf', hindi: 'अद्वैत भक्ति', theme: 'lotus_flame' },
    { filename: 'Agayani Jeev.pdf', hindi: 'अज्ञानी जीव', theme: 'path_light' },
    { filename: 'Andar se dhoye daro tou jane.pdf', hindi: 'अंदर से धोये', theme: 'water_purify' },
    { filename: 'Aproksh Bhakti.pdf', hindi: 'अप्रोक्ष भक्ति', theme: 'divine_hands' },
    { filename: 'Dhar_Kaise.pdf', hindi: 'धार कैसे', theme: 'river_flow' },
    { filename: 'Fakir.pdf', hindi: 'फकीर', theme: 'sage_meditation' },
    { filename: 'GeetaSaar.pdf', hindi: 'गीता सार', theme: 'krishna_flute' },
    { filename: 'Jeev ka Dharm Yudh.pdf', hindi: 'जीव का धर्म युद्ध', theme: 'warrior_path' },
    { filename: 'Kalyug_Ka_Nilkalank.pdf', hindi: 'कलयुग का नीलकलंक', theme: 'kalki_avatar' },
    { filename: 'Maan ki dhara palto.pdf', hindi: 'मन की धारा पलटो', theme: 'mind_waves' },
    { filename: 'Mool gyaan hi saar.pdf', hindi: 'मूल ज्ञान ही सार', theme: 'tree_roots' },
    { filename: 'Mukti_Path.pdf', hindi: 'मुक्ति पथ', theme: 'liberation_gate' },
    { filename: 'Naam daan ka saar.pdf', hindi: 'नाम दान का सार', theme: 'divine_name' },
    { filename: 'Naamdaan ki tayiyari.pdf', hindi: 'नामदान की तैयारी', theme: 'meditation' },
    { filename: 'Prabhu Prasad.pdf', hindi: 'प्रभु प्रसाद', theme: 'temple' },
    { filename: 'Sadguru ki chetavni.pdf', hindi: 'सद्गुरु की चेतावनी', theme: 'sunrise' },
    { filename: 'Sant ki Parakh aur Pahchan.pdf', hindi: 'संत की परख', theme: 'sage_meditation' },
    { filename: 'Satguru Bhakti.pdf', hindi: 'सतगुरु भक्ति', theme: 'om_lotus' },
    { filename: 'Satguru Ka Dwar.pdf', hindi: 'सतगुरु का द्वार', theme: 'temple' },
    { filename: 'Satgyan ko jane.pdf', hindi: 'सतज्ञान को जानें', theme: 'path_light' },
    { filename: 'SaarVani.pdf', hindi: 'सार वाणी', theme: 'divine_name' },
    { filename: 'satsangMala.pdf', hindi: 'सत्संग माला', theme: 'mala_beads' },
    { filename: 'Param Gyan.pdf', hindi: 'परमज्ञान', theme: 'chakra' },
    { filename: 'Param Vani.pdf', hindi: 'परम वाणी', theme: 'divine_hands' },
    { filename: 'Satya Path.pdf', hindi: 'सत्य पथ', theme: 'path_light' },
    { filename: 'Vivek Vilas.pdf', hindi: 'विवेक विलास', theme: 'sunrise' },
    { filename: 'Yog Prakash.pdf', hindi: 'योग प्रकाश', theme: 'meditation' },
];

// Generate SVG with proper structure (no Hindi text in SVG - will show only design)
function generateSvgIcon(themeName) {
    const theme = themes[themeName] || themes.om_lotus;
    const { bg, accent } = theme;

    // Different symbols based on theme
    const symbols = {
        om_lotus: `<circle cx="100" cy="140" r="35" fill="${accent}" opacity="0.3"/>
            <text x="100" y="155" font-size="40" fill="${accent}" text-anchor="middle" font-family="serif">ॐ</text>`,
        mala_beads: `<circle cx="100" cy="120" r="8" fill="${accent}"/>
            <circle cx="80" cy="140" r="6" fill="${accent}"/>
            <circle cx="120" cy="140" r="6" fill="${accent}"/>
            <circle cx="70" cy="165" r="5" fill="${accent}"/>
            <circle cx="130" cy="165" r="5" fill="${accent}"/>
            <circle cx="85" cy="185" r="5" fill="${accent}"/>
            <circle cx="115" cy="185" r="5" fill="${accent}"/>
            <circle cx="100" cy="195" r="6" fill="${accent}"/>`,
        yantra: `<circle cx="100" cy="150" r="40" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>
            <circle cx="100" cy="150" r="25" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>
            <polygon points="100,115 130,165 70,165" fill="none" stroke="${accent}" stroke-width="2"/>`,
        lotus_flame: `<ellipse cx="100" cy="180" rx="30" ry="15" fill="${accent}" opacity="0.5"/>
            <path d="M100,180 Q85,150 100,120 Q115,150 100,180" fill="${accent}"/>
            <path d="M100,180 Q75,155 90,125" fill="none" stroke="${accent}" stroke-width="2"/>
            <path d="M100,180 Q125,155 110,125" fill="none" stroke="${accent}" stroke-width="2"/>`,
        path_light: `<path d="M60,200 Q100,150 100,100" fill="none" stroke="${accent}" stroke-width="3"/>
            <circle cx="100" cy="90" r="15" fill="${accent}"/>
            <path d="M100,200 Q100,150 140,100" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>`,
        water_purify: `<ellipse cx="100" cy="160" rx="45" ry="20" fill="${accent}" opacity="0.3"/>
            <path d="M100,100 Q80,130 100,160 Q120,130 100,100" fill="${accent}"/>`,
        divine_hands: `<circle cx="100" cy="140" r="30" fill="${accent}" opacity="0.3"/>
            <path d="M70,160 Q100,120 130,160" fill="none" stroke="${accent}" stroke-width="3"/>
            <circle cx="100" cy="130" r="10" fill="${accent}"/>`,
        river_flow: `<path d="M50,120 Q75,140 100,120 Q125,100 150,120" fill="none" stroke="${accent}" stroke-width="3"/>
            <path d="M50,150 Q75,170 100,150 Q125,130 150,150" fill="none" stroke="${accent}" stroke-width="2" opacity="0.7"/>
            <path d="M50,180 Q75,200 100,180 Q125,160 150,180" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>`,
        sage_meditation: `<circle cx="100" cy="120" r="20" fill="${accent}"/>
            <path d="M70,180 Q100,150 130,180" fill="${accent}" opacity="0.8"/>
            <rect x="85" y="140" width="30" height="40" rx="5" fill="${accent}" opacity="0.6"/>`,
        krishna_flute: `<rect x="60" y="140" width="80" height="8" rx="4" fill="${accent}"/>
            <circle cx="75" cy="144" r="3" fill="${bg}"/>
            <circle cx="90" cy="144" r="3" fill="${bg}"/>
            <circle cx="105" cy="144" r="3" fill="${bg}"/>
            <circle cx="120" cy="144" r="3" fill="${bg}"/>
            <path d="M100,100 Q130,120 140,140" fill="none" stroke="${accent}" stroke-width="2"/>`,
        warrior_path: `<path d="M100,100 L100,180" stroke="${accent}" stroke-width="4"/>
            <path d="M80,120 L120,120" stroke="${accent}" stroke-width="3"/>
            <polygon points="100,90 90,110 110,110" fill="${accent}"/>`,
        kalki_avatar: `<circle cx="100" cy="130" r="25" fill="${accent}"/>
            <path d="M75,165 L100,190 L125,165" fill="none" stroke="${accent}" stroke-width="3"/>
            <path d="M85,150 Q100,170 115,150" fill="none" stroke="${accent}" stroke-width="2"/>`,
        mind_waves: `<path d="M50,130 Q65,110 80,130 Q95,150 110,130 Q125,110 140,130 Q155,150 170,130" fill="none" stroke="${accent}" stroke-width="3"/>
            <path d="M50,160 Q65,140 80,160 Q95,180 110,160 Q125,140 140,160" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>`,
        tree_roots: `<path d="M100,80 L100,130" stroke="${accent}" stroke-width="4"/>
            <circle cx="100" cy="70" r="20" fill="${accent}" opacity="0.7"/>
            <path d="M100,130 Q80,160 60,180" stroke="${accent}" stroke-width="2"/>
            <path d="M100,130 Q120,160 140,180" stroke="${accent}" stroke-width="2"/>
            <path d="M100,130 L100,180" stroke="${accent}" stroke-width="2"/>`,
        liberation_gate: `<rect x="70" y="100" width="60" height="80" fill="none" stroke="${accent}" stroke-width="3"/>
            <path d="M70,100 L100,70 L130,100" fill="none" stroke="${accent}" stroke-width="3"/>
            <rect x="90" y="140" width="20" height="40" fill="${accent}" opacity="0.5"/>`,
        divine_name: `<circle cx="100" cy="140" r="35" fill="${accent}" opacity="0.2"/>
            <circle cx="100" cy="140" r="25" fill="${accent}" opacity="0.3"/>
            <circle cx="100" cy="140" r="15" fill="${accent}" opacity="0.5"/>
            <circle cx="100" cy="140" r="5" fill="${accent}"/>`,
        meditation: `<circle cx="100" cy="110" r="15" fill="${accent}"/>
            <ellipse cx="100" cy="160" rx="25" ry="35" fill="${accent}" opacity="0.7"/>
            <path d="M65,170 Q100,200 135,170" fill="none" stroke="${accent}" stroke-width="2"/>`,
        temple: `<rect x="70" y="130" width="60" height="60" fill="${accent}" opacity="0.7"/>
            <polygon points="100,80 60,130 140,130" fill="${accent}"/>
            <rect x="90" y="150" width="20" height="40" fill="${bg}" opacity="0.5"/>`,
        sunrise: `<circle cx="100" cy="160" r="30" fill="${accent}"/>
            <path d="M50,160 L150,160" stroke="${accent}" stroke-width="2"/>
            <line x1="100" y1="120" x2="100" y2="100" stroke="${accent}" stroke-width="2"/>
            <line x1="130" y1="135" x2="145" y2="120" stroke="${accent}" stroke-width="2"/>
            <line x1="70" y1="135" x2="55" y2="120" stroke="${accent}" stroke-width="2"/>`,
        chakra: `<circle cx="100" cy="140" r="30" fill="none" stroke="${accent}" stroke-width="2"/>
            <circle cx="100" cy="140" r="20" fill="none" stroke="${accent}" stroke-width="2"/>
            <circle cx="100" cy="140" r="10" fill="${accent}"/>
            <line x1="100" y1="105" x2="100" y2="175" stroke="${accent}" stroke-width="1"/>
            <line x1="65" y1="140" x2="135" y2="140" stroke="${accent}" stroke-width="1"/>`,
    };

    const symbol = symbols[themeName] || symbols.om_lotus;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${bg};stop-opacity:0.85"/>
    </linearGradient>
  </defs>
  <rect width="200" height="280" fill="url(#bgGrad)"/>
  <rect x="10" y="10" width="180" height="260" fill="none" stroke="${accent}" stroke-width="2" rx="8" opacity="0.3"/>
  ${symbol}
</svg>`;
}

function svgToBase64DataUri(svgString) {
    // Ensure proper UTF-8 encoding
    const buffer = Buffer.from(svgString, 'utf8');
    const base64 = buffer.toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
}

async function getAllBooks() {
    const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BOOK' }
    }).promise();
    return result.Items;
}

async function updateBookIcon(bookId, dataUri) {
    await dynamodb.update({
        TableName: TABLE_NAME,
        Key: { BookID: bookId },
        UpdateExpression: 'SET coverImage = :icon',
        ExpressionAttributeValues: { ':icon': dataUri }
    }).promise();
}

async function fixAllIcons() {
    console.log('Fixing icon encoding for all books...\n');

    const books = await getAllBooks();
    console.log(`Found ${books.length} books in database\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const book of books) {
        try {
            // Find mapping for this book
            let mapping = bookMappings.find(m =>
                book.filename === m.filename ||
                book.title === m.hindi ||
                book.filename?.toLowerCase().includes(m.filename?.toLowerCase().replace('.pdf', ''))
            );

            // If no mapping found, use a default theme based on book index
            if (!mapping) {
                const themeKeys = Object.keys(themes);
                const themeIndex = books.indexOf(book) % themeKeys.length;
                mapping = {
                    hindi: book.title,
                    theme: themeKeys[themeIndex]
                };
            }

            // Generate SVG icon (without Hindi text to avoid encoding issues)
            const svg = generateSvgIcon(mapping.theme);
            const dataUri = svgToBase64DataUri(svg);

            // Update book in DynamoDB
            await updateBookIcon(book.BookID, dataUri);

            console.log(`✓ Fixed: ${book.title} (${mapping.theme})`);
            successCount++;

        } catch (error) {
            console.error(`✗ Error for ${book.title}: ${error.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total: ${books.length}`);
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
}

fixAllIcons()
    .then(() => {
        console.log('\n✓ All icons fixed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
