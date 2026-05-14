// PDF rasterization: PDF file path → array of PNG buffers, one per page.
//
// Uses pdf-to-img (pure JS, no native binary deps). Pages are rendered at
// 2x scale by default — high enough that Devanagari conjuncts stay legible
// to the vision model but small enough to keep API payload size sane.

const fs = require('fs');
const path = require('path');

async function rasterizePdf(pdfPath, { scale = 2, outputDir, onProgress } = {}) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found at ${pdfPath}`);
  }

  // pdf-to-img v4 is ESM-only; load via dynamic import so this CommonJS
  // module can still be required by the rest of the pipeline.
  const { pdf } = await import('pdf-to-img');

  const document = await pdf(pdfPath, { scale });
  const totalPages = document.length;

  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pages = [];
  let pageIdx = 0;
  for await (const buffer of document) {
    pageIdx += 1;
    if (outputDir) {
      const out = path.join(outputDir, `page-${String(pageIdx).padStart(4, '0')}.png`);
      fs.writeFileSync(out, buffer);
    }
    pages.push({ pageNumber: pageIdx, buffer });
    if (onProgress) onProgress(pageIdx, totalPages);
  }

  return { totalPages, pages };
}

module.exports = { rasterizePdf };
