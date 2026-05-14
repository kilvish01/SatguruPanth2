// Claude vision client for extracting structured content from a PDF page image.
//
// The prompt is the single most important piece of this entire milestone — it
// tells the model exactly what shape of JSON to return and how to handle the
// peculiarities of Devanagari spiritual texts (verses, footers, embedded
// illustrations, hand-set typography).
//
// If you tune the prompt, BUMP `PROMPT_VERSION` so we can re-extract only the
// affected books later without losing the audit trail.

const Anthropic = require('@anthropic-ai/sdk');
const sharp = require('sharp');
const { PageExtraction } = require('./contentSchema');

const MODEL = process.env.EXTRACTION_MODEL || 'claude-sonnet-4-6';
const PROMPT_VERSION = '2026-05-15.v1';

// Resize images to ~1568px max edge before sending. Claude vision processes
// images down to that size internally — sending bigger just wastes tokens.
const MAX_EDGE = 1568;

const SYSTEM_PROMPT = `You are an expert at extracting structured content from Hindi (Devanagari) spiritual book pages. You will receive ONE page image and must return strict JSON describing the content.

CRITICAL RULES:
1. Output ONLY valid JSON matching the schema below. No prose, no markdown fences.
2. Preserve Devanagari text EXACTLY as printed, including matras and conjuncts.
3. Verses (दोहा, चौपाई, साखी, श्लोक, भजन, अरिल) have type="verse". Preserve LINE BREAKS inside the text using \\n. Do NOT merge verse lines into a single paragraph.
4. Page numbers, running headers/footers, "© Copyright" lines have type="footer". The reader filters these out.
5. Image captions (text directly below or beside an illustration) have type="image_caption".
6. For standalone illustrations/photos, emit a block with type="image" and imageRef="image_N" where N is 1-based per page (image_1, image_2, ...). DO NOT include the image bytes — the driver extracts them separately.
7. A chapter beginning (new सत्संग / अध्याय / chapter title at top of page) gets the optional "chapterStart" field at the page level AND a corresponding heading block with level=1.
8. Section headings (sub-topics within a chapter) get type="heading" with level=2 or 3.
9. Block order MUST match top-to-bottom reading order on the page.
10. If the page is blank or contains only decorative ornament, return blocks: [].

SCHEMA (per-page):
{
  "pageNumber": <int, the page number printed on this image>,
  "blocks": [
    {
      "type": "heading" | "paragraph" | "verse" | "image" | "image_caption" | "footer" | "list_item",
      "text": "<Devanagari text, preserve \\n for verse line breaks>",   // omit if type=image
      "imageRef": "image_1",                                              // ONLY if type=image
      "level": 1 | 2 | 3 | 4,                                             // ONLY if type=heading
      "align": "left" | "center" | "right",                               // optional
      "emphasis": true                                                    // optional, for bold/italic text
    }
  ],
  "chapterStart": {                       // OMIT this field entirely if no new chapter starts on this page
    "title": "<chapter title text>",
    "level": 1
  }
}

ACCURACY CHECKS before you return:
- Did you transcribe EVERY Devanagari character on the page? No skipping.
- Are verse line breaks preserved with \\n?
- Are you returning JSON, not markdown?`;

const client = new Anthropic.default({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function resizeForVision(pngBuffer) {
  const image = sharp(pngBuffer);
  const meta = await image.metadata();
  const maxDim = Math.max(meta.width || 0, meta.height || 0);
  if (maxDim <= MAX_EDGE) return pngBuffer;
  return image
    .resize({
      width: meta.width >= meta.height ? MAX_EDGE : undefined,
      height: meta.height > meta.width ? MAX_EDGE : undefined,
      fit: 'inside',
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function extractPage({ pageNumber, pngBuffer, bookTitle }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY env var is required.');
  }

  const resized = await resizeForVision(pngBuffer);
  const base64 = resized.toString('base64');

  const userMessage = `This is page ${pageNumber} of "${bookTitle}". Extract its content into the JSON schema described in the system prompt. Return ONLY the JSON object.`;

  let response;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
              { type: 'text', text: userMessage },
            ],
          },
        ],
      });
      break;
    } catch (err) {
      lastErr = err;
      const retriable = err.status === 429 || (err.status >= 500 && err.status < 600);
      if (!retriable || attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  if (!response) throw lastErr;

  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock) throw new Error(`No text response for page ${pageNumber}`);

  // Strip accidental markdown fences if the model slips up.
  const raw = textBlock.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Page ${pageNumber}: invalid JSON from model: ${e.message}\nRaw: ${raw.slice(0, 200)}…`);
  }

  // Force the page number — the model occasionally hallucinates if the printed
  // page number is missing. Our driver knows the true number.
  parsed.pageNumber = pageNumber;

  const validated = PageExtraction.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Page ${pageNumber}: schema validation failed: ${validated.error.message}`
    );
  }

  return {
    page: validated.data,
    usage: response.usage, // { input_tokens, output_tokens } for cost tracking
  };
}

module.exports = {
  extractPage,
  MODEL,
  PROMPT_VERSION,
};
