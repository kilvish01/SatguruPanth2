/**
 * Create unique artistic icons for each book - NO TEXT inside SVG
 * Text was causing encoding issues - titles are shown below icons in app
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

// Unique icon designs - artwork only, NO text
const bookDesigns = {
    // आत्मबोध - Meditating figure with aura
    'आत्मबोध': {
        bg: '#1a237e',
        svg: `<circle cx="100" cy="110" r="60" fill="#3949ab" opacity="0.3"/>
              <circle cx="100" cy="110" r="45" fill="#5c6bc0" opacity="0.4"/>
              <circle cx="100" cy="80" r="18" fill="#ffd700"/>
              <path d="M82,100 L82,150 M118,100 L118,150" stroke="#ffd700" stroke-width="4"/>
              <path d="M65,160 Q100,140 135,160" fill="#7986cb"/>`
    },

    // आत्मबोध माला - Prayer beads mala
    'आत्मबोध माला': {
        bg: '#4a148c',
        svg: `<circle cx="100" cy="130" r="50" fill="none" stroke="#ce93d8" stroke-width="10" stroke-dasharray="15 10"/>
              <circle cx="100" cy="80" r="12" fill="#ffd700"/>
              <circle cx="100" cy="180" r="15" fill="#e1bee7"/>
              <path d="M100,195 L100,220" stroke="#e1bee7" stroke-width="4"/>
              <circle cx="100" cy="230" r="8" fill="#ffd700"/>`
    },

    // अध्यात्म का खेल - Chess/game board
    'अध्यात्म का खेल': {
        bg: '#0d47a1',
        svg: `<rect x="40" y="70" width="120" height="120" fill="none" stroke="#90caf9" stroke-width="3" rx="5"/>
              <line x1="70" y1="70" x2="70" y2="190" stroke="#64b5f6" stroke-width="1"/>
              <line x1="100" y1="70" x2="100" y2="190" stroke="#64b5f6" stroke-width="1"/>
              <line x1="130" y1="70" x2="130" y2="190" stroke="#64b5f6" stroke-width="1"/>
              <line x1="40" y1="100" x2="160" y2="100" stroke="#64b5f6" stroke-width="1"/>
              <line x1="40" y1="130" x2="160" y2="130" stroke="#64b5f6" stroke-width="1"/>
              <line x1="40" y1="160" x2="160" y2="160" stroke="#64b5f6" stroke-width="1"/>
              <circle cx="70" cy="115" r="12" fill="#ffd700"/>
              <circle cx="130" cy="145" r="12" fill="#fff"/>`
    },

    // अद्वैत भक्ति - Two circles merging (non-duality)
    'अद्वैत भक्ति': {
        bg: '#b71c1c',
        svg: `<circle cx="75" cy="130" r="40" fill="#ef9a9a" opacity="0.6"/>
              <circle cx="125" cy="130" r="40" fill="#ef9a9a" opacity="0.6"/>
              <circle cx="100" cy="130" r="20" fill="#ffd700"/>
              <path d="M60,180 Q100,210 140,180" fill="none" stroke="#ffcdd2" stroke-width="3"/>`
    },

    // अज्ञानी जीव - Figure in darkness with light
    'अज्ञानी - जीव': {
        bg: '#212121',
        svg: `<rect x="50" y="70" width="100" height="130" fill="#424242" rx="10"/>
              <circle cx="100" cy="110" r="25" fill="#616161"/>
              <rect x="85" y="140" width="30" height="50" fill="#757575" rx="5"/>
              <circle cx="150" cy="90" r="20" fill="#ffd700"/>
              <path d="M150,70 L150,50 M165,80 L180,70 M165,100 L180,110" stroke="#ffd700" stroke-width="2"/>`
    },

    // अंदर से धोये - Water purification
    'अन्दर से धोय डारौ तो जानी': {
        bg: '#006064',
        svg: `<ellipse cx="100" cy="190" rx="70" ry="25" fill="#4dd0e1" opacity="0.4"/>
              <path d="M30,140 Q55,115 80,140 Q105,165 130,140 Q155,115 180,140" fill="none" stroke="#4dd0e1" stroke-width="4"/>
              <path d="M30,170 Q55,145 80,170 Q105,195 130,170 Q155,145 180,170" fill="none" stroke="#80deea" stroke-width="3"/>
              <path d="M100,70 Q85,100 100,130 Q115,100 100,70" fill="#4dd0e1"/>`
    },

    // अप्रोक्ष भक्ति - Divine ray from above
    'अपरोक्ष भक्ति': {
        bg: '#7b1fa2',
        svg: `<path d="M100,40 L100,120" stroke="#ffd700" stroke-width="6"/>
              <polygon points="80,40 100,15 120,40" fill="#ffd700"/>
              <circle cx="100" cy="160" r="35" fill="#e1bee7" opacity="0.6"/>
              <circle cx="100" cy="160" r="20" fill="#ce93d8"/>
              <path d="M65,160 L45,160 M135,160 L155,160" stroke="#ffd700" stroke-width="3"/>`
    },

    // धार कैसी है - Flowing river
    'धार कैसी है': {
        bg: '#00695c',
        svg: `<path d="M20,100 Q50,75 80,100 Q110,125 140,100 Q170,75 200,100" fill="none" stroke="#80cbc4" stroke-width="5"/>
              <path d="M20,140 Q50,115 80,140 Q110,165 140,140 Q170,115 200,140" fill="none" stroke="#4db6ac" stroke-width="4"/>
              <path d="M20,180 Q50,155 80,180 Q110,205 140,180 Q170,155 200,180" fill="none" stroke="#26a69a" stroke-width="3"/>`
    },

    // फकीर - Ascetic figure
    'फकीर': {
        bg: '#3e2723',
        svg: `<circle cx="100" cy="80" r="25" fill="#d7ccc8"/>
              <path d="M75,105 L60,190 L140,190 L125,105" fill="#8d6e63"/>
              <line x1="100" y1="190" x2="100" y2="230" stroke="#5d4037" stroke-width="10"/>
              <circle cx="55" cy="130" r="20" fill="#a1887f" opacity="0.6"/>
              <path d="M55,150 L55,200" stroke="#795548" stroke-width="4"/>`
    },

    // गीता सार - Open book with divine light
    'गीता-सार': {
        bg: '#e65100',
        svg: `<path d="M40,100 L100,75 L160,100 L160,200 L100,175 L40,200 Z" fill="#fff3e0"/>
              <line x1="100" y1="75" x2="100" y2="175" stroke="#bf360c" stroke-width="3"/>
              <circle cx="100" cy="50" r="25" fill="#ffd700"/>
              <path d="M100,25 L100,10 M80,40 L65,25 M120,40 L135,25" stroke="#ffd700" stroke-width="3"/>`
    },

    // जीव का धर्म युद्ध - Warrior with bow
    'जीव का धर्म युद्ध': {
        bg: '#c62828',
        svg: `<circle cx="100" cy="70" r="22" fill="#ffcdd2"/>
              <path d="M78,95 L70,170 M122,95 L130,170" stroke="#ef9a9a" stroke-width="8"/>
              <path d="M50,110 Q100,80 150,110" fill="none" stroke="#ffd700" stroke-width="4"/>
              <line x1="100" y1="95" x2="100" y2="55" stroke="#ffd700" stroke-width="3"/>
              <polygon points="100,50 92,65 108,65" fill="#ffd700"/>`
    },

    // कलयुग का नीलकलंक - Kalki avatar
    'कलयुग का निःकलंक अवतार': {
        bg: '#1565c0',
        svg: `<ellipse cx="100" cy="170" rx="50" ry="20" fill="#64b5f6"/>
              <path d="M65,170 Q50,130 80,110 L120,110 Q150,130 135,170" fill="#90caf9"/>
              <circle cx="100" cy="85" r="25" fill="#bbdefb"/>
              <path d="M100,60 L100,35" stroke="#ffd700" stroke-width="4"/>
              <polygon points="100,30 88,45 112,45" fill="#ffd700"/>`
    },

    // मन की धारा पलटो - Mind waves transformation
    'मन की धार पलटो': {
        bg: '#00838f',
        svg: `<path d="M30,110 Q55,85 80,110 Q105,135 130,110 Q155,85 180,110" fill="none" stroke="#80deea" stroke-width="4"/>
              <path d="M180,160 Q155,185 130,160 Q105,135 80,160 Q55,185 30,160" fill="none" stroke="#4dd0e1" stroke-width="4"/>
              <circle cx="100" cy="135" r="25" fill="#e0f7fa"/>
              <path d="M88,130 L100,145 L112,130" stroke="#006064" stroke-width="3" fill="none"/>`
    },

    // मूल ज्ञान ही सार - Tree with roots
    'मूल ज्ञान ही सार है': {
        bg: '#33691e',
        svg: `<path d="M100,200 L100,130" stroke="#8d6e63" stroke-width="12"/>
              <circle cx="100" cy="90" r="45" fill="#aed581"/>
              <circle cx="100" cy="90" r="30" fill="#9ccc65"/>
              <path d="M100,200 Q70,230 40,215" stroke="#6d4c41" stroke-width="4" fill="none"/>
              <path d="M100,200 Q130,230 160,215" stroke="#6d4c41" stroke-width="4" fill="none"/>
              <circle cx="100" cy="90" r="12" fill="#ffd700"/>`
    },

    // मुक्ति पथ - Gate to liberation
    'मुक्ति - पथ': {
        bg: '#4527a0',
        svg: `<rect x="55" y="80" width="90" height="120" fill="none" stroke="#d1c4e9" stroke-width="4" rx="5"/>
              <path d="M55,80 L100,45 L145,80" fill="none" stroke="#d1c4e9" stroke-width="4"/>
              <rect x="82" y="130" width="36" height="70" fill="#ffd700" opacity="0.7"/>
              <circle cx="100" cy="100" r="18" fill="#ffd700"/>`
    },

    // नाम दान का सार - Om symbol with circles
    'नामदान का सार': {
        bg: '#ff6f00',
        svg: `<circle cx="100" cy="120" r="50" fill="#ffe0b2" opacity="0.5"/>
              <circle cx="100" cy="120" r="35" fill="#ffcc80" opacity="0.6"/>
              <circle cx="100" cy="120" r="20" fill="#ffd700"/>
              <path d="M90,115 Q100,100 110,115 Q100,130 90,115" fill="#e65100"/>
              <circle cx="105" cy="108" r="4" fill="#e65100"/>`
    },

    // नामदान की तैयारी - Preparation items
    'नामदान की तैयारी': {
        bg: '#5d4037',
        svg: `<rect x="50" y="100" width="100" height="70" fill="#d7ccc8" rx="8"/>
              <circle cx="75" cy="135" r="15" fill="#8d6e63"/>
              <circle cx="100" cy="135" r="15" fill="#6d4c41"/>
              <circle cx="125" cy="135" r="15" fill="#5d4037"/>
              <path d="M100,70 L100,100" stroke="#ffd700" stroke-width="4"/>
              <circle cx="100" cy="55" r="15" fill="#ffd700"/>`
    },

    // प्रार्थना - Praying hands with light
    'प्रार्थना': {
        bg: '#ad1457',
        svg: `<path d="M70,150 Q100,110 130,150" fill="#f8bbd0"/>
              <path d="M80,150 Q100,120 120,150" fill="#f48fb1"/>
              <circle cx="100" cy="85" r="30" fill="#ffd700" opacity="0.6"/>
              <path d="M100,55 L100,35" stroke="#ffd700" stroke-width="3"/>
              <path d="M80,70 L60,50" stroke="#ffd700" stroke-width="2"/>
              <path d="M120,70 L140,50" stroke="#ffd700" stroke-width="2"/>`
    },

    // सद्गुरु की चेतावनी - Warning triangle
    'सद्‌गुरु की चेतावनी': {
        bg: '#f57f17',
        svg: `<polygon points="100,50 160,160 40,160" fill="#fff9c4" stroke="#f57f17" stroke-width="4"/>
              <rect x="95" y="85" width="10" height="40" fill="#f57f17" rx="2"/>
              <circle cx="100" cy="140" r="7" fill="#f57f17"/>`
    },

    // सत्य खोजो - Magnifying glass searching
    'सत्य खोजो': {
        bg: '#6a1b9a',
        svg: `<circle cx="90" cy="120" r="40" fill="#e1bee7" opacity="0.5"/>
              <circle cx="90" cy="120" r="30" fill="#ce93d8" opacity="0.6"/>
              <path d="M115,145 L150,180" stroke="#ffd700" stroke-width="8" stroke-linecap="round"/>
              <circle cx="90" cy="120" r="15" fill="#ffd700" opacity="0.5"/>`
    },

    // सतनाम - Sat symbol
    'सतनाम': {
        bg: '#1a237e',
        svg: `<circle cx="100" cy="120" r="50" fill="#3949ab" opacity="0.4"/>
              <circle cx="100" cy="120" r="35" fill="#5c6bc0" opacity="0.5"/>
              <circle cx="100" cy="120" r="20" fill="#ffd700"/>
              <path d="M55,180 Q100,210 145,180" fill="none" stroke="#9fa8da" stroke-width="4"/>`
    },

    // सतगुरु पंथ की खोज - Door/gate with light
    'सतगुरु पंथ की खोज': {
        bg: '#bf360c',
        svg: `<rect x="60" y="70" width="80" height="130" fill="#ffccbc" rx="40" ry="40"/>
              <rect x="75" y="110" width="50" height="90" fill="#ff8a65"/>
              <circle cx="115" cy="155" r="6" fill="#bf360c"/>
              <path d="M100,45 L100,70" stroke="#ffd700" stroke-width="4"/>
              <circle cx="100" cy="35" r="12" fill="#ffd700"/>`
    },

    // सतज्ञान को जानें - Wisdom eye
    'सतज्ञान को जानें': {
        bg: '#4e342e',
        svg: `<ellipse cx="100" cy="130" rx="60" ry="35" fill="#d7ccc8"/>
              <circle cx="100" cy="130" r="25" fill="#8d6e63"/>
              <circle cx="100" cy="130" r="12" fill="#3e2723"/>
              <circle cx="106" cy="124" r="5" fill="#fff"/>
              <path d="M40,130 Q100,80 160,130" fill="none" stroke="#5d4037" stroke-width="3"/>
              <path d="M40,130 Q100,180 160,130" fill="none" stroke="#5d4037" stroke-width="3"/>`
    },

    // सार वाणी - Sound waves
    'सार वाणी': {
        bg: '#0277bd',
        svg: `<circle cx="100" cy="120" r="40" fill="#b3e5fc" opacity="0.5"/>
              <circle cx="100" cy="120" r="25" fill="#81d4fa" opacity="0.6"/>
              <circle cx="100" cy="120" r="12" fill="#4fc3f7"/>
              <path d="M60,160 Q100,190 140,160" fill="none" stroke="#4fc3f7" stroke-width="3"/>
              <path d="M50,185 Q100,220 150,185" fill="none" stroke="#81d4fa" stroke-width="2"/>`
    },

    // सत्संग माला - Circle of devotees/beads
    'सत्संग माला': {
        bg: '#2e7d32',
        svg: `<circle cx="100" cy="130" r="50" fill="none" stroke="#a5d6a7" stroke-width="4"/>
              <circle cx="100" cy="80" r="12" fill="#ffd700"/>
              <circle cx="135" cy="95" r="10" fill="#c8e6c9"/>
              <circle cx="150" cy="130" r="10" fill="#c8e6c9"/>
              <circle cx="135" cy="165" r="10" fill="#c8e6c9"/>
              <circle cx="100" cy="180" r="10" fill="#c8e6c9"/>
              <circle cx="65" cy="165" r="10" fill="#c8e6c9"/>
              <circle cx="50" cy="130" r="10" fill="#c8e6c9"/>
              <circle cx="65" cy="95" r="10" fill="#c8e6c9"/>`
    },

    // परमज्ञान - Crown chakra enlightenment
    'परमज्ञान': {
        bg: '#6a1b9a',
        svg: `<circle cx="100" cy="100" r="20" fill="#e1bee7"/>
              <path d="M80,120 L80,180 M120,120 L120,180" stroke="#ce93d8" stroke-width="8"/>
              <path d="M60,190 Q100,165 140,190" fill="#ba68c8"/>
              <circle cx="100" cy="60" r="25" fill="#ffd700"/>
              <path d="M100,35 L100,15" stroke="#ffd700" stroke-width="3"/>
              <path d="M120,45 L135,30" stroke="#ffd700" stroke-width="2"/>
              <path d="M80,45 L65,30" stroke="#ffd700" stroke-width="2"/>`
    },

    // परम वाणी - Om with sound waves
    'परम वाणी': {
        bg: '#311b92',
        svg: `<circle cx="100" cy="110" r="45" fill="#5e35b1" opacity="0.4"/>
              <circle cx="100" cy="110" r="30" fill="#7e57c2" opacity="0.5"/>
              <circle cx="100" cy="110" r="18" fill="#ffd700"/>
              <path d="M50,170 Q100,200 150,170" fill="none" stroke="#b39ddb" stroke-width="4"/>
              <path d="M60,190 Q100,215 140,190" fill="none" stroke="#9575cd" stroke-width="3"/>`
    },

    // सत्य पथ - Forked path with choices
    'सत्य पथ': {
        bg: '#1b5e20',
        svg: `<path d="M100,220 L100,130 L70,70" stroke="#a5d6a7" stroke-width="5" fill="none"/>
              <path d="M100,130 L130,70" stroke="#81c784" stroke-width="5" fill="none"/>
              <circle cx="70" cy="60" r="15" fill="#ffd700"/>
              <circle cx="130" cy="60" r="15" fill="#c8e6c9"/>
              <circle cx="100" cy="150" r="10" fill="#66bb6a"/>`
    },

    // आध्यात्मिक प्रश्नोत्तरी - Question mark
    'आध्यात्मिक प्रश्नोत्तरी': {
        bg: '#f9a825',
        svg: `<circle cx="100" cy="110" r="50" fill="#fff9c4"/>
              <path d="M80,90 Q80,60 100,60 Q120,60 120,85 Q120,100 100,105 L100,125" fill="none" stroke="#f57f17" stroke-width="8" stroke-linecap="round"/>
              <circle cx="100" cy="150" r="8" fill="#f57f17"/>`
    },

    // राम कृपा - Blessing hands
    'राम कृपा': {
        bg: '#e91e63',
        svg: `<circle cx="100" cy="110" r="45" fill="#f8bbd0" opacity="0.5"/>
              <path d="M70,130 Q100,90 130,130" fill="#f48fb1"/>
              <circle cx="100" cy="80" r="20" fill="#ffd700" opacity="0.7"/>
              <path d="M100,60 L100,40" stroke="#ffd700" stroke-width="2"/>
              <path d="M85,70 L70,55" stroke="#ffd700" stroke-width="2"/>
              <path d="M115,70 L130,55" stroke="#ffd700" stroke-width="2"/>`
    },

    // सद्गुरु महिमा - Glorious guru
    'सद्‌गुरु - महिमा': {
        bg: '#00897b',
        svg: `<circle cx="100" cy="95" r="40" fill="#80cbc4" opacity="0.5"/>
              <circle cx="100" cy="95" r="25" fill="#4db6ac" opacity="0.7"/>
              <circle cx="100" cy="95" r="12" fill="#ffd700"/>
              <path d="M60,150 L60,200 M140,150 L140,200" stroke="#b2dfdb" stroke-width="6"/>
              <path d="M45,210 L155,210" stroke="#80cbc4" stroke-width="4"/>`
    },

    // पूर्ण अध्यात्मिक सफर - Journey path
    'पूर्ण अध्यात्मिक सफर': {
        bg: '#37474f',
        svg: `<path d="M30,200 Q60,160 100,170 Q140,180 170,140" fill="none" stroke="#90a4ae" stroke-width="4"/>
              <circle cx="30" cy="200" r="12" fill="#78909c"/>
              <circle cx="100" cy="170" r="10" fill="#b0bec5"/>
              <circle cx="170" cy="140" r="15" fill="#ffd700"/>
              <path d="M170,125 L170,100" stroke="#ffd700" stroke-width="3"/>
              <path d="M155,130 L140,115" stroke="#ffd700" stroke-width="2"/>
              <path d="M185,130 L200,115" stroke="#ffd700" stroke-width="2"/>`
    },

    // सहज पथ - Easy curved path
    'सहज-पथ': {
        bg: '#558b2f',
        svg: `<path d="M40,200 Q100,100 160,200" fill="none" stroke="#aed581" stroke-width="5"/>
              <circle cx="100" cy="120" r="30" fill="#c5e1a5"/>
              <path d="M88,115 L100,130 L112,115" stroke="#33691e" stroke-width="4" fill="none"/>
              <circle cx="60" cy="170" r="8" fill="#dcedc8"/>
              <circle cx="140" cy="170" r="8" fill="#dcedc8"/>`
    },

    // सतगुरु पंथ - Tower/path with golden top
    'सतगुरु पंथ': {
        bg: '#0097a7',
        svg: `<path d="M100,50 L100,150" stroke="#b2ebf2" stroke-width="6"/>
              <circle cx="100" cy="40" r="18" fill="#ffd700"/>
              <path d="M65,170 L100,150 L135,170" fill="#4dd0e1"/>
              <path d="M50,200 L100,175 L150,200" fill="#26c6da"/>
              <path d="M35,230 L100,200 L165,230" fill="#00bcd4"/>`
    },

    // कल्कि अवतरण - Avatar on horse
    'कल्कि - अवतरण': {
        bg: '#283593',
        svg: `<ellipse cx="100" cy="165" rx="45" ry="25" fill="#7986cb"/>
              <path d="M70,165 Q50,125 85,105 L115,105 Q150,125 130,165" fill="#9fa8da"/>
              <circle cx="100" cy="80" r="22" fill="#c5cae9"/>
              <path d="M100,58 L100,35" stroke="#ffd700" stroke-width="4"/>
              <polygon points="100,30 90,42 110,42" fill="#ffd700"/>`
    },

    // सार का सार - Essence circles
    'सार का सार': {
        bg: '#795548',
        svg: `<circle cx="100" cy="120" r="55" fill="#d7ccc8" opacity="0.4"/>
              <circle cx="100" cy="120" r="40" fill="#bcaaa4" opacity="0.5"/>
              <circle cx="100" cy="120" r="25" fill="#a1887f" opacity="0.7"/>
              <circle cx="100" cy="120" r="12" fill="#ffd700"/>`
    },
};

function generateSvgForBook(title) {
    let design = bookDesigns[title];

    if (!design) {
        for (const [key, value] of Object.entries(bookDesigns)) {
            if (title.includes(key) || key.includes(title) ||
                title.toLowerCase().includes(key.toLowerCase())) {
                design = value;
                break;
            }
        }
    }

    if (!design) {
        const colors = ['#1a237e', '#b71c1c', '#1b5e20', '#e65100', '#4a148c', '#006064', '#3e2723', '#c62828', '#00695c', '#6a1b9a'];
        const idx = Math.abs(title.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
        design = {
            bg: colors[idx],
            svg: `<circle cx="100" cy="120" r="50" fill="#fff" opacity="0.2"/>
                  <circle cx="100" cy="120" r="35" fill="#fff" opacity="0.3"/>
                  <circle cx="100" cy="120" r="20" fill="#ffd700"/>`
        };
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <rect width="200" height="280" fill="${design.bg}"/>
  <rect x="8" y="8" width="184" height="264" fill="none" stroke="#fff" stroke-width="1" opacity="0.15" rx="10"/>
  ${design.svg}
</svg>`;
}

function svgToBase64(svg) {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

async function updateAllBooks() {
    console.log('Creating clean icons (no text) for all books...\n');

    const result = await dynamodb.scan({
        TableName: TABLE_NAME,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BOOK' }
    }).promise();

    console.log(`Found ${result.Items.length} books\n`);

    let success = 0;
    for (const book of result.Items) {
        try {
            const svg = generateSvgForBook(book.title);
            const dataUri = svgToBase64(svg);

            await dynamodb.update({
                TableName: TABLE_NAME,
                Key: { BookID: book.BookID },
                UpdateExpression: 'SET coverImage = :icon',
                ExpressionAttributeValues: { ':icon': dataUri }
            }).promise();

            console.log(`✓ ${book.title}`);
            success++;
        } catch (error) {
            console.error(`✗ ${book.title}: ${error.message}`);
        }
    }

    console.log(`\n✓ Updated ${success}/${result.Items.length} books`);
}

updateAllBooks().catch(console.error);
