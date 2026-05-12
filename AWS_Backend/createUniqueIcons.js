/**
 * Create unique artistic icons for each book
 * Each icon has artwork matching the book's title/theme
 */

const AWS = require('aws-sdk');
require('dotenv').config();

const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_TABLE || 'BooksMetadata';

// Unique icon designs for each book - completely different artwork
const bookDesigns = {
    // आत्मबोध (Self-realization) - Meditating figure with glowing aura
    'आत्मबोध': {
        bg: '#1a237e',
        svg: `<circle cx="100" cy="100" r="50" fill="#ffd700" opacity="0.2"/>
              <circle cx="100" cy="100" r="35" fill="#ffd700" opacity="0.3"/>
              <circle cx="100" cy="70" r="15" fill="#ffd700"/>
              <path d="M85,90 L85,130 M115,90 L115,130" stroke="#ffd700" stroke-width="3"/>
              <path d="M70,140 Q100,120 130,140" fill="#ffd700"/>
              <text x="100" y="180" font-size="14" fill="#fff" text-anchor="middle">आत्मबोध</text>`
    },

    // आत्मबोध माला - Prayer beads in circle
    'आत्मबोध माला': {
        bg: '#4a148c',
        svg: `<circle cx="100" cy="120" r="45" fill="none" stroke="#e1bee7" stroke-width="8" stroke-dasharray="12 8"/>
              <circle cx="100" cy="75" r="10" fill="#ffd700"/>
              <circle cx="100" cy="165" r="12" fill="#e1bee7"/>
              <path d="M100,177 L100,200" stroke="#e1bee7" stroke-width="3"/>
              <circle cx="100" cy="205" r="5" fill="#ffd700"/>
              <text x="100" y="240" font-size="12" fill="#fff" text-anchor="middle">आत्मबोध माला</text>`
    },

    // अध्यात्म का खेल - Cosmic game/chess board with spiritual pieces
    'अध्यात्म का खेल': {
        bg: '#0d47a1',
        svg: `<rect x="50" y="80" width="100" height="100" fill="none" stroke="#90caf9" stroke-width="2"/>
              <line x1="75" y1="80" x2="75" y2="180" stroke="#90caf9" stroke-width="1"/>
              <line x1="100" y1="80" x2="100" y2="180" stroke="#90caf9" stroke-width="1"/>
              <line x1="125" y1="80" x2="125" y2="180" stroke="#90caf9" stroke-width="1"/>
              <line x1="50" y1="105" x2="150" y2="105" stroke="#90caf9" stroke-width="1"/>
              <line x1="50" y1="130" x2="150" y2="130" stroke="#90caf9" stroke-width="1"/>
              <line x1="50" y1="155" x2="150" y2="155" stroke="#90caf9" stroke-width="1"/>
              <circle cx="75" cy="117" r="8" fill="#ffd700"/>
              <circle cx="125" cy="142" r="8" fill="#fff"/>
              <text x="100" y="210" font-size="11" fill="#fff" text-anchor="middle">अध्यात्म का खेल</text>`
    },

    // अद्वैत भक्ति - Two merging into one (non-duality)
    'अद्वैत भक्ति': {
        bg: '#b71c1c',
        svg: `<circle cx="80" cy="120" r="30" fill="#ffcdd2" opacity="0.7"/>
              <circle cx="120" cy="120" r="30" fill="#ffcdd2" opacity="0.7"/>
              <circle cx="100" cy="120" r="15" fill="#ffd700"/>
              <path d="M70,160 Q100,180 130,160" fill="none" stroke="#fff" stroke-width="2"/>
              <text x="100" y="200" font-size="12" fill="#fff" text-anchor="middle">अद्वैत भक्ति</text>`
    },

    // अज्ञानी जीव - Person in darkness with small light
    'अज्ञानी जीव': {
        bg: '#212121',
        svg: `<rect x="40" y="60" width="120" height="150" fill="#333" rx="5"/>
              <circle cx="100" cy="100" r="20" fill="#424242"/>
              <path d="M85,130 L85,180 M115,130 L115,180" stroke="#616161" stroke-width="8"/>
              <circle cx="140" cy="80" r="15" fill="#ffd700" opacity="0.8"/>
              <path d="M140,80 L155,65 M140,80 L155,95 M140,80 L125,80" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="230" font-size="12" fill="#fff" text-anchor="middle">अज्ञानी जीव</text>`
    },

    // अंदर से धोये - Water purification/cleansing waves
    'अन्दर से धोय डारौ तो जानी': {
        bg: '#006064',
        svg: `<ellipse cx="100" cy="180" rx="60" ry="20" fill="#4dd0e1" opacity="0.5"/>
              <path d="M40,140 Q60,120 80,140 Q100,160 120,140 Q140,120 160,140" fill="none" stroke="#4dd0e1" stroke-width="3"/>
              <path d="M40,160 Q60,140 80,160 Q100,180 120,160 Q140,140 160,160" fill="none" stroke="#80deea" stroke-width="2"/>
              <circle cx="100" cy="100" r="25" fill="#fff" opacity="0.3"/>
              <path d="M100,80 Q90,100 100,120 Q110,100 100,80" fill="#4dd0e1"/>
              <text x="100" y="220" font-size="9" fill="#fff" text-anchor="middle">अंदर से धोये</text>`
    },

    // अप्रोक्ष भक्ति - Direct divine connection (ray from above)
    'अपरोक्ष भक्ति': {
        bg: '#7b1fa2',
        svg: `<path d="M100,50 L100,130" stroke="#ffd700" stroke-width="4"/>
              <polygon points="85,50 100,30 115,50" fill="#ffd700"/>
              <circle cx="100" cy="150" r="25" fill="#e1bee7"/>
              <circle cx="100" cy="150" r="15" fill="#ce93d8"/>
              <path d="M75,150 L60,150 M125,150 L140,150" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="210" font-size="11" fill="#fff" text-anchor="middle">अप्रोक्ष भक्ति</text>`
    },

    // धार कैसे - Flowing river/stream
    'धार कैसी है': {
        bg: '#00695c',
        svg: `<path d="M30,100 Q50,80 70,100 Q90,120 110,100 Q130,80 150,100 Q170,120 190,100" fill="none" stroke="#80cbc4" stroke-width="4"/>
              <path d="M30,130 Q50,110 70,130 Q90,150 110,130 Q130,110 150,130 Q170,150 190,130" fill="none" stroke="#4db6ac" stroke-width="3"/>
              <path d="M30,160 Q50,140 70,160 Q90,180 110,160 Q130,140 150,160" fill="none" stroke="#26a69a" stroke-width="2"/>
              <text x="100" y="210" font-size="12" fill="#fff" text-anchor="middle">धार कैसी है</text>`
    },

    // फकीर - Ascetic/saint figure
    'फकीर': {
        bg: '#3e2723',
        svg: `<circle cx="100" cy="80" r="20" fill="#d7ccc8"/>
              <path d="M80,100 L70,170 L130,170 L120,100" fill="#8d6e63"/>
              <line x1="100" y1="170" x2="100" y2="200" stroke="#5d4037" stroke-width="8"/>
              <circle cx="60" cy="120" r="15" fill="#a1887f" opacity="0.5"/>
              <path d="M60,135 L60,180" stroke="#795548" stroke-width="3"/>
              <text x="100" y="230" font-size="14" fill="#fff" text-anchor="middle">फकीर</text>`
    },

    // गीता सार - Open book with divine light
    'गीता-सार': {
        bg: '#e65100',
        svg: `<path d="M50,90 L100,70 L150,90 L150,180 L100,160 L50,180 Z" fill="#fff3e0"/>
              <line x1="100" y1="70" x2="100" y2="160" stroke="#bf360c" stroke-width="2"/>
              <circle cx="100" cy="50" r="20" fill="#ffd700"/>
              <path d="M100,50 L100,30 M85,50 L75,40 M115,50 L125,40" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="210" font-size="12" fill="#fff" text-anchor="middle">गीता सार</text>`
    },

    // जीव का धर्म युद्ध - Warrior with bow/arrow
    'जीव का धर्म युद्ध': {
        bg: '#c62828',
        svg: `<circle cx="100" cy="70" r="18" fill="#ffcdd2"/>
              <path d="M80,90 L75,150 M120,90 L125,150" stroke="#ef9a9a" stroke-width="6"/>
              <path d="M60,100 Q100,80 140,100" fill="none" stroke="#ffd700" stroke-width="3"/>
              <line x1="100" y1="90" x2="100" y2="60" stroke="#ffd700" stroke-width="2"/>
              <polygon points="100,55 95,65 105,65" fill="#ffd700"/>
              <text x="100" y="190" font-size="10" fill="#fff" text-anchor="middle">जीव का धर्म युद्ध</text>`
    },

    // कलयुग का नीलकलंक - Kalki avatar on horse
    'कलयुग का निःकलंक अवतार': {
        bg: '#1565c0',
        svg: `<ellipse cx="100" cy="160" rx="40" ry="15" fill="#64b5f6"/>
              <path d="M70,160 Q60,130 80,120 L120,120 Q140,130 130,160" fill="#90caf9"/>
              <circle cx="100" cy="90" r="20" fill="#fff"/>
              <path d="M100,70 L100,50" stroke="#ffd700" stroke-width="3"/>
              <polygon points="100,45 90,55 110,55" fill="#ffd700"/>
              <text x="100" y="200" font-size="8" fill="#fff" text-anchor="middle">कलयुग का निःकलंक</text>`
    },

    // मन की धारा पलटो - Mind waves transforming
    'मन की धार पलटो': {
        bg: '#00838f',
        svg: `<path d="M40,100 Q60,80 80,100 Q100,120 120,100 Q140,80 160,100" fill="none" stroke="#80deea" stroke-width="3"/>
              <path d="M160,140 Q140,160 120,140 Q100,120 80,140 Q60,160 40,140" fill="none" stroke="#4dd0e1" stroke-width="3"/>
              <circle cx="100" cy="120" r="20" fill="#e0f7fa"/>
              <path d="M90,115 L100,125 L110,115" stroke="#006064" stroke-width="2" fill="none"/>
              <text x="100" y="200" font-size="10" fill="#fff" text-anchor="middle">मन की धारा पलटो</text>`
    },

    // मूल ज्ञान ही सार - Tree with roots and knowledge
    'मूल ज्ञान ही सार है': {
        bg: '#33691e',
        svg: `<path d="M100,180 L100,120" stroke="#8d6e63" stroke-width="8"/>
              <circle cx="100" cy="90" r="35" fill="#aed581"/>
              <path d="M100,180 Q80,200 60,190" stroke="#6d4c41" stroke-width="3" fill="none"/>
              <path d="M100,180 Q120,200 140,190" stroke="#6d4c41" stroke-width="3" fill="none"/>
              <circle cx="100" cy="90" r="10" fill="#ffd700"/>
              <text x="100" y="230" font-size="9" fill="#fff" text-anchor="middle">मूल ज्ञान ही सार</text>`
    },

    // मुक्ति पथ - Gate to liberation with light
    'मुक्ति - पथ': {
        bg: '#4527a0',
        svg: `<rect x="60" y="80" width="80" height="100" fill="none" stroke="#d1c4e9" stroke-width="3"/>
              <path d="M60,80 L100,50 L140,80" fill="none" stroke="#d1c4e9" stroke-width="3"/>
              <rect x="85" y="120" width="30" height="60" fill="#ffd700" opacity="0.6"/>
              <circle cx="100" cy="100" r="15" fill="#ffd700"/>
              <text x="100" y="210" font-size="12" fill="#fff" text-anchor="middle">मुक्ति पथ</text>`
    },

    // नाम दान का सार - Divine name giving
    'नामदान का सार': {
        bg: '#ff6f00',
        svg: `<circle cx="100" cy="100" r="40" fill="#ffe0b2" opacity="0.5"/>
              <circle cx="100" cy="100" r="25" fill="#ffcc80"/>
              <text x="100" y="108" font-size="20" fill="#e65100" text-anchor="middle">ॐ</text>
              <path d="M70,150 Q100,170 130,150" fill="none" stroke="#fff" stroke-width="2"/>
              <text x="100" y="200" font-size="11" fill="#fff" text-anchor="middle">नाम दान का सार</text>`
    },

    // नामदान की तैयारी - Preparation/readiness
    'नामदान की तैयारी': {
        bg: '#5d4037',
        svg: `<rect x="60" y="90" width="80" height="60" fill="#d7ccc8" rx="5"/>
              <circle cx="80" cy="120" r="10" fill="#8d6e63"/>
              <circle cx="100" cy="120" r="10" fill="#6d4c41"/>
              <circle cx="120" cy="120" r="10" fill="#5d4037"/>
              <path d="M100,70 L100,90" stroke="#ffd700" stroke-width="3"/>
              <circle cx="100" cy="60" r="10" fill="#ffd700"/>
              <text x="100" y="190" font-size="10" fill="#fff" text-anchor="middle">नामदान की तैयारी</text>`
    },

    // प्रभु प्रसाद - Divine blessing/prasad
    'प्रार्थना': {
        bg: '#ad1457',
        svg: `<path d="M70,130 Q100,100 130,130" fill="#f8bbd9"/>
              <path d="M80,130 Q100,110 120,130" fill="#f48fb1"/>
              <circle cx="100" cy="90" r="20" fill="#ffd700" opacity="0.7"/>
              <path d="M100,70 L100,50" stroke="#ffd700" stroke-width="2"/>
              <path d="M85,80 L70,65" stroke="#ffd700" stroke-width="2"/>
              <path d="M115,80 L130,65" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="180" font-size="12" fill="#fff" text-anchor="middle">प्रार्थना</text>`
    },

    // सद्गुरु की चेतावनी - Warning/alert symbol
    'सद्‌गुरु की चेतावनी': {
        bg: '#f57f17',
        svg: `<polygon points="100,60 150,150 50,150" fill="#fff9c4" stroke="#f57f17" stroke-width="3"/>
              <text x="100" y="130" font-size="40" fill="#f57f17" text-anchor="middle">!</text>
              <circle cx="100" cy="180" r="15" fill="#ffd700"/>
              <text x="100" y="220" font-size="9" fill="#fff" text-anchor="middle">सद्गुरु की चेतावनी</text>`
    },

    // संत की परख - Saint examination/testing
    'सत्य खोजो': {
        bg: '#6a1b9a',
        svg: `<circle cx="100" cy="110" r="35" fill="#e1bee7" opacity="0.5"/>
              <circle cx="100" cy="110" r="25" fill="#ce93d8" opacity="0.7"/>
              <path d="M120,90 L140,70" stroke="#ffd700" stroke-width="3"/>
              <circle cx="145" cy="65" r="10" fill="#ffd700"/>
              <text x="100" y="180" font-size="12" fill="#fff" text-anchor="middle">सत्य खोजो</text>`
    },

    // सतगुरु भक्ति - Devotion to Satguru
    'सतनाम': {
        bg: '#1a237e',
        svg: `<circle cx="100" cy="100" r="40" fill="#c5cae9" opacity="0.5"/>
              <text x="100" y="115" font-size="28" fill="#ffd700" text-anchor="middle">सत</text>
              <path d="M60,150 Q100,170 140,150" fill="none" stroke="#9fa8da" stroke-width="3"/>
              <text x="100" y="200" font-size="14" fill="#fff" text-anchor="middle">सतनाम</text>`
    },

    // सतगुरु का द्वार - Gate/door to Satguru
    'सतगुरु पंथ की खोज': {
        bg: '#bf360c',
        svg: `<rect x="65" y="70" width="70" height="110" fill="#ffccbc" rx="35" ry="35"/>
              <rect x="75" y="100" width="50" height="80" fill="#ffab91"/>
              <circle cx="115" cy="140" r="5" fill="#bf360c"/>
              <path d="M100,50 L100,70" stroke="#ffd700" stroke-width="3"/>
              <circle cx="100" cy="45" r="8" fill="#ffd700"/>
              <text x="100" y="210" font-size="9" fill="#fff" text-anchor="middle">सतगुरु पंथ की खोज</text>`
    },

    // सतज्ञान को जानें - Knowledge/wisdom eye
    'सतज्ञान को जानें': {
        bg: '#4e342e',
        svg: `<ellipse cx="100" cy="120" rx="50" ry="30" fill="#d7ccc8"/>
              <circle cx="100" cy="120" r="20" fill="#8d6e63"/>
              <circle cx="100" cy="120" r="10" fill="#3e2723"/>
              <circle cx="105" cy="115" r="4" fill="#fff"/>
              <path d="M50,120 Q100,80 150,120" fill="none" stroke="#5d4037" stroke-width="2"/>
              <path d="M50,120 Q100,160 150,120" fill="none" stroke="#5d4037" stroke-width="2"/>
              <text x="100" y="190" font-size="11" fill="#fff" text-anchor="middle">सतज्ञान को जानें</text>`
    },

    // सार वाणी - Divine speech/voice
    'सार वाणी': {
        bg: '#0277bd',
        svg: `<circle cx="100" cy="110" r="30" fill="#b3e5fc"/>
              <path d="M80,100 Q100,80 120,100" fill="none" stroke="#01579b" stroke-width="3"/>
              <path d="M70,130 Q100,150 130,130" fill="none" stroke="#4fc3f7" stroke-width="2"/>
              <path d="M60,150 Q100,180 140,150" fill="none" stroke="#81d4fa" stroke-width="2"/>
              <text x="100" y="200" font-size="12" fill="#fff" text-anchor="middle">सार वाणी</text>`
    },

    // सत्संग माला - Satsang gathering circle
    'सत्संग माला': {
        bg: '#2e7d32',
        svg: `<circle cx="100" cy="120" r="40" fill="none" stroke="#a5d6a7" stroke-width="3"/>
              <circle cx="100" cy="80" r="8" fill="#ffd700"/>
              <circle cx="130" cy="95" r="7" fill="#c8e6c9"/>
              <circle cx="140" cy="120" r="7" fill="#c8e6c9"/>
              <circle cx="130" cy="145" r="7" fill="#c8e6c9"/>
              <circle cx="100" cy="160" r="7" fill="#c8e6c9"/>
              <circle cx="70" cy="145" r="7" fill="#c8e6c9"/>
              <circle cx="60" cy="120" r="7" fill="#c8e6c9"/>
              <circle cx="70" cy="95" r="7" fill="#c8e6c9"/>
              <text x="100" y="200" font-size="12" fill="#fff" text-anchor="middle">सत्संग माला</text>`
    },

    // परमज्ञान - Supreme knowledge (crown chakra)
    'परमज्ञान': {
        bg: '#6a1b9a',
        svg: `<circle cx="100" cy="90" r="15" fill="#e1bee7"/>
              <path d="M85,105 L85,160 M115,105 L115,160" stroke="#ce93d8" stroke-width="6"/>
              <path d="M70,170 Q100,150 130,170" fill="#ba68c8"/>
              <circle cx="100" cy="60" r="20" fill="#ffd700" opacity="0.8"/>
              <path d="M100,40 L100,20" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="210" font-size="14" fill="#fff" text-anchor="middle">परमज्ञान</text>`
    },

    // परम वाणी - Supreme speech
    'परम वाणी': {
        bg: '#311b92',
        svg: `<circle cx="100" cy="100" r="35" fill="#d1c4e9" opacity="0.6"/>
              <text x="100" y="115" font-size="30" fill="#ffd700" text-anchor="middle">ॐ</text>
              <path d="M60,150 Q100,180 140,150" fill="none" stroke="#b39ddb" stroke-width="3"/>
              <path d="M70,165 Q100,190 130,165" fill="none" stroke="#9575cd" stroke-width="2"/>
              <text x="100" y="220" font-size="12" fill="#fff" text-anchor="middle">परम वाणी</text>`
    },

    // सत्य पथ - Path of truth
    'सत्य पथ': {
        bg: '#1b5e20',
        svg: `<path d="M100,200 L100,100 L80,60 M100,100 L120,60" stroke="#a5d6a7" stroke-width="4" fill="none"/>
              <circle cx="80" cy="55" r="10" fill="#ffd700"/>
              <circle cx="120" cy="55" r="10" fill="#c8e6c9"/>
              <circle cx="100" cy="130" r="8" fill="#81c784"/>
              <text x="100" y="230" font-size="12" fill="#fff" text-anchor="middle">सत्य पथ</text>`
    },

    // विवेक विलास - Discrimination/wisdom joy
    'आध्यात्मिक प्रश्नोत्तरी': {
        bg: '#f9a825',
        svg: `<circle cx="100" cy="100" r="40" fill="#fff9c4"/>
              <text x="100" y="115" font-size="50" fill="#f57f17" text-anchor="middle">?</text>
              <circle cx="70" cy="160" r="10" fill="#ffee58"/>
              <circle cx="100" cy="170" r="10" fill="#fdd835"/>
              <circle cx="130" cy="160" r="10" fill="#fbc02d"/>
              <text x="100" y="220" font-size="8" fill="#fff" text-anchor="middle">आध्यात्मिक प्रश्नोत्तरी</text>`
    },

    // योग प्रकाश - Yoga light
    'राम कृपा': {
        bg: '#e91e63',
        svg: `<circle cx="100" cy="100" r="35" fill="#f8bbd9" opacity="0.6"/>
              <path d="M100,70 L100,130" stroke="#ffd700" stroke-width="3"/>
              <path d="M80,90 L120,90 M80,110 L120,110" stroke="#fce4ec" stroke-width="2"/>
              <circle cx="100" cy="150" r="20" fill="#f48fb1"/>
              <text x="100" y="200" font-size="12" fill="#fff" text-anchor="middle">राम कृपा</text>`
    },

    // सद्गुरु महिमा - Glory of Sadguru
    'सद्‌गुरु - महिमा': {
        bg: '#00897b',
        svg: `<circle cx="100" cy="90" r="30" fill="#80cbc4"/>
              <circle cx="100" cy="90" r="20" fill="#4db6ac"/>
              <circle cx="100" cy="90" r="10" fill="#ffd700"/>
              <path d="M70,130 L70,170 M130,130 L130,170" stroke="#b2dfdb" stroke-width="4"/>
              <path d="M55,180 L145,180" stroke="#80cbc4" stroke-width="3"/>
              <text x="100" y="220" font-size="11" fill="#fff" text-anchor="middle">सद्गुरु महिमा</text>`
    },

    // पूर्ण अध्यात्मिक सफर - Complete spiritual journey
    'पूर्ण अध्यात्मिक सफर': {
        bg: '#37474f',
        svg: `<path d="M40,180 Q70,150 100,160 Q130,170 160,140" fill="none" stroke="#90a4ae" stroke-width="3"/>
              <circle cx="40" cy="180" r="8" fill="#78909c"/>
              <circle cx="100" cy="160" r="8" fill="#b0bec5"/>
              <circle cx="160" cy="140" r="12" fill="#ffd700"/>
              <path d="M160,128 L160,100" stroke="#ffd700" stroke-width="2"/>
              <text x="100" y="220" font-size="9" fill="#fff" text-anchor="middle">पूर्ण अध्यात्मिक सफर</text>`
    },

    // सहज पथ - Easy/natural path
    'सहज-पथ': {
        bg: '#558b2f',
        svg: `<path d="M50,180 Q100,100 150,180" fill="none" stroke="#aed581" stroke-width="4"/>
              <circle cx="100" cy="100" r="25" fill="#c5e1a5"/>
              <path d="M90,95 L100,105 L110,95" stroke="#33691e" stroke-width="3" fill="none"/>
              <circle cx="70" cy="150" r="5" fill="#dcedc8"/>
              <circle cx="130" cy="150" r="5" fill="#dcedc8"/>
              <text x="100" y="220" font-size="12" fill="#fff" text-anchor="middle">सहज पथ</text>`
    },

    // सतगुरु पंथ - Satguru sect/path
    'सतगुरु पंथ': {
        bg: '#0097a7',
        svg: `<path d="M100,60 L100,140" stroke="#b2ebf2" stroke-width="4"/>
              <circle cx="100" cy="50" r="15" fill="#ffd700"/>
              <path d="M70,160 L100,140 L130,160" fill="#4dd0e1"/>
              <path d="M60,180 L100,160 L140,180" fill="#26c6da"/>
              <text x="100" y="220" font-size="12" fill="#fff" text-anchor="middle">सतगुरु पंथ</text>`
    },

    // कल्कि अवतार
    'कल्कि - अवतरण': {
        bg: '#283593',
        svg: `<ellipse cx="100" cy="150" rx="35" ry="20" fill="#7986cb"/>
              <path d="M80,150 Q60,120 85,100 L115,100 Q140,120 120,150" fill="#9fa8da"/>
              <circle cx="100" cy="80" r="18" fill="#c5cae9"/>
              <path d="M100,62 L100,40" stroke="#ffd700" stroke-width="3"/>
              <polygon points="100,35 92,45 108,45" fill="#ffd700"/>
              <text x="100" y="200" font-size="11" fill="#fff" text-anchor="middle">कल्कि अवतरण</text>`
    },

    // सार का सार
    'सार का सार': {
        bg: '#795548',
        svg: `<circle cx="100" cy="110" r="45" fill="#d7ccc8" opacity="0.5"/>
              <circle cx="100" cy="110" r="30" fill="#bcaaa4" opacity="0.7"/>
              <circle cx="100" cy="110" r="15" fill="#ffd700"/>
              <text x="100" y="118" font-size="12" fill="#5d4037" text-anchor="middle">सार</text>
              <text x="100" y="190" font-size="12" fill="#fff" text-anchor="middle">सार का सार</text>`
    },
};

function generateSvgForBook(title) {
    // Find matching design
    let design = bookDesigns[title];

    if (!design) {
        // Try partial match
        for (const [key, value] of Object.entries(bookDesigns)) {
            if (title.includes(key) || key.includes(title)) {
                design = value;
                break;
            }
        }
    }

    // Fallback design if no match
    if (!design) {
        const colors = ['#1a237e', '#b71c1c', '#1b5e20', '#e65100', '#4a148c', '#006064', '#3e2723', '#c62828'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        design = {
            bg: randomColor,
            svg: `<circle cx="100" cy="110" r="40" fill="#ffd700" opacity="0.3"/>
                  <circle cx="100" cy="110" r="25" fill="#fff" opacity="0.5"/>
                  <text x="100" y="120" font-size="16" fill="#ffd700" text-anchor="middle">ॐ</text>
                  <text x="100" y="180" font-size="10" fill="#fff" text-anchor="middle">${title.substring(0, 15)}</text>`
        };
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <rect width="200" height="280" fill="${design.bg}"/>
  <rect x="8" y="8" width="184" height="264" fill="none" stroke="#fff" stroke-width="1" opacity="0.2" rx="8"/>
  ${design.svg}
</svg>`;
}

function svgToBase64(svg) {
    return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

async function updateAllBooks() {
    console.log('Creating unique artistic icons for all books...\n');

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

    console.log(`\n✓ Updated ${success}/${result.Items.length} books with unique icons`);
}

updateAllBooks().catch(console.error);
