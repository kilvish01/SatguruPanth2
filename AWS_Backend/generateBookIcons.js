/**
 * Script to generate unique spiritual book icons with Hindi names
 * Each book gets a unique icon with spiritual imagery
 */

const fs = require('fs');
const path = require('path');

// Book list with their Hindi names and spiritual themes
const bookConfigs = [
    { filename: 'Aatmbodh-.pdf', hindName: 'आत्मबोध', theme: 'om_lotus', colors: ['#FF6B35', '#F7931E'] },
    { filename: 'AatmbodhMala.pdf', hindName: 'आत्मबोध माला', theme: 'mala_beads', colors: ['#8B4513', '#D2691E'] },
    { filename: 'Adhyatma ka khel.pdf', hindName: 'अध्यात्म का खेल', theme: 'yantra', colors: ['#4A90E2', '#5CB3FF'] },
    { filename: 'Advaita_Bhakti.pdf', hindName: 'अद्वैत भक्ति', theme: 'lotus_flame', colors: ['#E91E63', '#F06292'] },
    { filename: 'Agayani Jeev.pdf', hindName: 'अज्ञानी जीव', theme: 'path_light', colors: ['#9C27B0', '#BA68C8'] },
    { filename: 'Andar se dhoye daro tou jane.pdf', hindName: 'अंदर से धोये', theme: 'water_purify', colors: ['#00BCD4', '#4DD0E1'] },
    { filename: 'Aproksh Bhakti.pdf', hindName: 'अप्रोक्ष भक्ति', theme: 'divine_hands', colors: ['#FF5722', '#FF7043'] },
    { filename: 'Dhar_Kaise.pdf', hindName: 'धार कैसे', theme: 'river_flow', colors: ['#3F51B5', '#5C6BC0'] },
    { filename: 'Fakir.pdf', hindName: 'फकीर', theme: 'sage_meditation', colors: ['#795548', '#8D6E63'] },
    { filename: 'GeetaSaar.pdf', hindName: 'गीता सार', theme: 'krishna_flute', colors: ['#2196F3', '#42A5F5'] },
    { filename: 'Jeev ka Dharm Yudh.pdf', hindName: 'जीव का धर्म युद्ध', theme: 'warrior_path', colors: ['#F44336', '#EF5350'] },
    { filename: 'Kalyug_Ka_Nilkalank.pdf', hindName: 'कलयुग का नीलकलंक', theme: 'kalki_avatar', colors: ['#1A237E', '#3949AB'] },
    { filename: 'Maan ki dhara palto.pdf', hindName: 'मन की धारा पलटो', theme: 'mind_waves', colors: ['#00897B', '#26A69A'] },
    { filename: 'Mool gyaan hi saar.pdf', hindName: 'मूल ज्ञान ही सार', theme: 'tree_roots', colors: ['#558B2F', '#7CB342'] },
    { filename: 'Mukti_Path.pdf', hindName: 'मुक्ति पथ', theme: 'liberation_gate', colors: ['#FFD700', '#FFA000'] },
    { filename: 'Naam daan ka saar.pdf', hindName: 'नाम दान का सार', theme: 'divine_name', colors: ['#D32F2F', '#F44336'] },
    { filename: 'Naamdaan ki tayiyari.pdf', hindName: 'नामदान की तैयारी', theme: 'preparation_altar', colors: ['#C2185B', '#E91E63'] },
    { filename: 'ParamVarhi.pdf', hindName: 'परम वारही', theme: 'supreme_goddess', colors: ['#7B1FA2', '#9C27B0'] },
    { filename: 'Paramgyaan.pdf', hindName: 'परम ज्ञान', theme: 'supreme_knowledge', colors: ['#512DA8', '#673AB7'] },
    { filename: 'Prathna.pdf', hindName: 'प्रार्थना', theme: 'prayer_hands', colors: ['#303F9F', '#3F51B5'] },
    { filename: 'Ram_Kripa.pdf', hindName: 'राम कृपा', theme: 'ram_blessings', colors: ['#1976D2', '#2196F3'] },
    { filename: 'Saar Ka Saar.pdf', hindName: 'सार का सार', theme: 'essence_drop', colors: ['#0288D1', '#03A9F4'] },
    { filename: 'Saar Vani.pdf', hindName: 'सार वाणी', theme: 'divine_speech', colors: ['#0097A7', '#00BCD4'] },
    { filename: 'Sahaj Path.pdf', hindName: 'सहज पथ', theme: 'simple_path', colors: ['#00796B', '#009688'] },
    { filename: 'Satguru Panth.pdf', hindName: 'सतगुरु पंथ', theme: 'guru_feet', colors: ['#388E3C', '#4CAF50'] },
    { filename: 'Satguru_Panth_Ki_Khoj.pdf', hindName: 'सतगुरु पंथ की खोज', theme: 'spiritual_search', colors: ['#689F38', '#8BC34A'] },
    { filename: 'SathSang Mala.pdf', hindName: 'सत्संग माला', theme: 'satsang_circle', colors: ['#AFB42B', '#CDDC39'] },
    { filename: 'Satnam.pdf', hindName: 'सतनाम', theme: 'true_name', colors: ['#F9A825', '#FBC02D'] },
    { filename: 'Satya Path.pdf', hindName: 'सत्य पथ', theme: 'truth_path', colors: ['#F57F17', '#FDD835'] },
    { filename: 'Satya_Khoj.pdf', hindName: 'सत्य खोज', theme: 'truth_search', colors: ['#E65100', '#FF6F00'] },
    { filename: 'adhyatmikPatori.pdf', hindName: 'आध्यात्मिक पाठशाला', theme: 'spiritual_school', colors: ['#D84315', '#FF5722'] },
    { filename: 'kalki Avtaran.pdf', hindName: 'कल्कि अवतरण', theme: 'avatar_descent', colors: ['#BF360C', '#FF5722'] },
    { filename: 'poorn Adhyatmik Safar.pdf', hindName: 'पूर्ण आध्यात्मिक सफर', theme: 'complete_journey', colors: ['#3E2723', '#5D4037'] },
    { filename: 'sadguru mahima.pdf', hindName: 'सद्गुरु महिमा', theme: 'guru_glory', colors: ['#4E342E', '#6D4C41'] },
    { filename: 'satguruKiChetavni.pdf', hindName: 'सतगुरु की चेतावनी', theme: 'divine_warning', colors: ['#FF6B35', '#FF8C42'] },
    { filename: 'satgyankojane.pdf', hindName: 'सत्य ज्ञान को जाने', theme: 'know_truth', colors: ['#00695C', '#00897B'] }
];

// SVG template for spiritual icons
function generateSVGIcon(config) {
    const { hindName, theme, colors } = config;
    const [color1, color2] = colors;

    // Create gradient background
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="400" height="600" fill="url(#grad${theme})"/>

  <!-- Decorative border -->
  <rect x="15" y="15" width="370" height="570" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="10"/>
  <rect x="25" y="25" width="350" height="550" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1" rx="8"/>

  <!-- Spiritual symbol based on theme -->
  ${getThemeSymbol(theme, color1, color2)}

  <!-- Book title in Hindi -->
  <text x="200" y="480" font-family="Arial, sans-serif" font-size="32" font-weight="bold"
        fill="white" text-anchor="middle" filter="url(#shadow)">${hindName}</text>

  <!-- Decorative element at bottom -->
  <circle cx="200" cy="540" r="3" fill="rgba(255,255,255,0.8)"/>
  <circle cx="185" cy="540" r="2" fill="rgba(255,255,255,0.6)"/>
  <circle cx="215" cy="540" r="2" fill="rgba(255,255,255,0.6)"/>
</svg>`;

    return svg;
}

// Generate theme-specific spiritual symbols
function getThemeSymbol(theme, color1, color2) {
    const symbols = {
        om_lotus: `
            <!-- Om symbol -->
            <circle cx="200" cy="200" r="80" fill="rgba(255,255,255,0.2)"/>
            <text x="200" y="230" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
                  fill="rgba(255,255,255,0.9)" text-anchor="middle">ॐ</text>
            <!-- Lotus petals -->
            <ellipse cx="150" cy="340" rx="40" ry="20" fill="rgba(255,255,255,0.3)" transform="rotate(-30 150 340)"/>
            <ellipse cx="250" cy="340" rx="40" ry="20" fill="rgba(255,255,255,0.3)" transform="rotate(30 250 340)"/>
            <ellipse cx="200" cy="350" rx="40" ry="20" fill="rgba(255,255,255,0.4)"/>
        `,
        mala_beads: `
            <!-- Mala circle -->
            <circle cx="200" cy="220" r="100" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
            ${Array.from({length: 12}, (_, i) => {
                const angle = (i * 30) * Math.PI / 180;
                const x = 200 + 100 * Math.cos(angle);
                const y = 220 + 100 * Math.sin(angle);
                return `<circle cx="${x}" cy="${y}" r="8" fill="rgba(255,255,255,0.7)"/>`;
            }).join('\n')}
            <!-- Center bead -->
            <circle cx="200" cy="220" r="15" fill="rgba(255,255,255,0.9)"/>
        `,
        yantra: `
            <!-- Sri Yantra inspired design -->
            <polygon points="200,120 280,280 120,280" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
            <polygon points="200,280 280,140 120,140" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" transform="rotate(180 200 210)"/>
            <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
            <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
            <circle cx="200" cy="200" r="10" fill="rgba(255,255,255,0.9)"/>
        `,
        lotus_flame: `
            <!-- Lotus with flame -->
            <ellipse cx="200" cy="250" rx="60" ry="30" fill="rgba(255,255,255,0.3)"/>
            <ellipse cx="200" cy="250" rx="80" ry="20" fill="rgba(255,255,255,0.2)"/>
            <path d="M 200 240 Q 190 180 200 150 Q 210 180 200 240" fill="rgba(255,255,255,0.7)"/>
            <circle cx="200" cy="160" r="20" fill="rgba(255,255,255,0.5)"/>
        `,
        default: `
            <!-- Default spiritual design -->
            <circle cx="200" cy="220" r="80" fill="rgba(255,255,255,0.2)"/>
            <circle cx="200" cy="220" r="60" fill="rgba(255,255,255,0.1)"/>
            <circle cx="200" cy="220" r="40" fill="rgba(255,255,255,0.15)"/>
            <circle cx="200" cy="220" r="20" fill="rgba(255,255,255,0.3)"/>
            <text x="200" y="240" font-family="Arial, sans-serif" font-size="50" font-weight="bold"
                  fill="rgba(255,255,255,0.8)" text-anchor="middle">✦</text>
        `
    };

    return symbols[theme] || symbols.default;
}

// Generate all book icons
function generateAllIcons() {
    const outputDir = path.join(__dirname, 'book-icons');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Generating spiritual book icons...\n');

    bookConfigs.forEach((config, index) => {
        const svg = generateSVGIcon(config);
        const outputPath = path.join(outputDir, `${config.hindName}.svg`);

        fs.writeFileSync(outputPath, svg);
        console.log(`✓ Generated: ${config.hindName}.svg (${index + 1}/${bookConfigs.length})`);
    });

    console.log(`\n✓ All ${bookConfigs.length} icons generated successfully!`);
    console.log(`Icons saved to: ${outputDir}`);

    // Generate mapping file for upload script
    const mapping = bookConfigs.map(config => ({
        pdfFilename: config.filename,
        iconFilename: `${config.hindName}.svg`,
        hindName: config.hindName,
        theme: config.theme
    }));

    fs.writeFileSync(
        path.join(outputDir, 'book-icon-mapping.json'),
        JSON.stringify(mapping, null, 2)
    );

    console.log('✓ Mapping file created: book-icon-mapping.json');
}

// Run the generator
if (require.main === module) {
    generateAllIcons();
}

module.exports = { bookConfigs, generateSVGIcon };
