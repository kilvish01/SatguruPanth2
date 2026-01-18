const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = "https://satgurupanth.org";
const DOWNLOAD_DIR = path.join(__dirname, 'downloaded_books');

// All books from the website
const ALL_BOOKS = [
  { title: "आत्मबोध", url: "assets/images/Aatmbodh-.pdf" },
  { title: "सत्संग माला", url: "assets/images/SathSang Mala.pdf" },
  { title: "आत्मबोध माला", url: "assets/images/AatmbodhMala.pdf" },
  { title: "सार वाणी", url: "assets/images/Saar Vani.pdf" },
  { title: "सत्य पथ", url: "assets/images/Satya Path.pdf" },
  { title: "मुक्ति - पथ", url: "assets/images/Mukti_Path.pdf" },
  { title: "सार का सार", url: "assets/images/Saar Ka Saar.pdf" },
  { title: "नामदान का सार", url: "assets/images/Naam daan ka saar.pdf" },
  { title: "सतज्ञान को जानें", url: "assets/images/satgyankojane.pdf" },
  { title: "मूल ज्ञान ही सार है", url: "assets/images/Mool gyaan hi saar.pdf" },
  { title: "पूर्ण अध्यात्मिक सफर", url: "assets/images/poorn Adhyatmik Safar.pdf" },
  { title: "मन की धार पलटो", url: "assets/images/Maan ki dhara palto.pdf" },
  { title: "परम वाणी", url: "assets/images/ParamVarhi.pdf" },
  { title: "सद्‌गुरु - महिमा", url: "assets/images/sadguru mahima.pdf" },
  { title: "परमज्ञान", url: "assets/images/Paramgyaan.pdf" },
  { title: "कल्कि - अवतरण", url: "assets/images/kalki Avtaran.pdf" },
  { title: "गीता-सार", url: "assets/images/GeetaSaar.pdf" },
  { title: "अद्वैत भक्ति", url: "assets/images/Advaita_Bhakti.pdf" },
  { title: "राम कृपा", url: "assets/images/Ram_Kripa.pdf" },
  { title: "सतनाम", url: "assets/images/Satnam.pdf" },
  { title: "सतगुरु पंथ", url: "assets/images/Satguru Panth.pdf" },
  { title: "अपरोक्ष भक्ति", url: "assets/images/Aproksh Bhakti.pdf" },
  { title: "सत्य खोजो", url: "assets/images/Satya_Khoj.pdf" },
  { title: "प्रार्थना", url: "assets/images/Prathna.pdf" },
  { title: "फकीर", url: "assets/images/Fakir.pdf" },
  { title: "धार कैसी है", url: "assets/images/Dhar_Kaise.pdf" },
  { title: "कलयुग का निःकलंक अवतार", url: "assets/images/Kalyug_Ka_Nilkalank.pdf" },
  { title: "आध्यात्मिक प्रश्नोत्तरी", url: "assets/images/adhyatmikPatori.pdf" },
  { title: "सतगुरु पंथ की खोज", url: "assets/images/Satguru_Panth_Ki_Khoj.pdf" },
  { title: "सद्‌गुरु की चेतावनी", url: "assets/images/satguruKiChetavni.pdf" },
  { title: "जीव का धर्म युद्ध", url: "assets/images/Jeev ka Dharm Yudh.pdf" },
  { title: "अज्ञानी - जीव", url: "assets/images/Agayani Jeev.pdf" },
  { title: "नामदान की तैयारी", url: "assets/images/Naamdaan ki tayiyari.pdf" },
  { title: "अन्दर से धोय डारौ तो जानी", url: "assets/images/Andar se dhoye daro tou jane.pdf" },
  { title: "सहज-पथ", url: "assets/images/Sahaj Path.pdf" },
  { title: "अध्यात्म का खेल", url: "assets/images/Adhyatma ka khel.pdf" }
];

async function downloadPDF(book, index) {
  try {
    const fullUrl = `${BASE_URL}/${book.url}`;
    const filename = path.basename(book.url);
    const filepath = path.join(DOWNLOAD_DIR, filename);

    console.log(`[${index + 1}/${ALL_BOOKS.length}] Downloading: ${book.title}`);
    console.log(`  URL: ${fullUrl}`);

    const response = await axios({
      method: 'get',
      url: fullUrl,
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    fs.writeFileSync(filepath, response.data);
    const sizeMB = (response.data.byteLength / 1024 / 1024).toFixed(2);
    console.log(`  ✅ Saved: ${filename} (${sizeMB} MB)\n`);

    return { success: true, title: book.title, filename: filename };
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}\n`);
    return { success: false, title: book.title, error: error.message };
  }
}

async function main() {
  console.log('=================================================');
  console.log('Book Download Script - satgurupanth.org');
  console.log('=================================================\n');

  // Create download directory
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`Created directory: ${DOWNLOAD_DIR}\n`);
  } else {
    console.log(`Using directory: ${DOWNLOAD_DIR}\n`);
  }

  console.log(`Total books to download: ${ALL_BOOKS.length}\n`);
  console.log('=================================================\n');

  // Download all books
  const results = [];
  for (let i = 0; i < ALL_BOOKS.length; i++) {
    const result = await downloadPDF(ALL_BOOKS[i], i);
    results.push(result);

    // Small delay between downloads
    if (i < ALL_BOOKS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('=================================================');
  console.log('DOWNLOAD SUMMARY');
  console.log('=================================================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully downloaded: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFailed books:');
    failed.forEach(f => {
      console.log(`  - ${f.title}: ${f.error}`);
    });
  }

  console.log('\n=================================================');
  console.log('Download complete!');
  console.log(`All books saved to: ${DOWNLOAD_DIR}`);
  console.log('=================================================');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
