# M1 — AI Extraction Pipeline

Converts every PDF in the `phase2dev` library into a reflowable JSON book that
the new Phase 2 reader can consume.

## How it works

```
PDF file (S3)
   ↓
rasterize at 2× scale  ──── pdfToImages.js
   ↓
PNG buffer per page
   ↓
resize to ≤1568px      ──── aiVision.js
   ↓
Claude Sonnet 4.6 vision API (one call per page)
   ↓
per-page JSON cached to ~/.satgurupanth-extract/<bookId>/page-NNNN.json
   ↓
merge into one canonical content.json   ──── extractBook.js
   ↓
upload to s3://book-reader-content-phase2dev/books/<bookId>/content.json
   ↓
record pointer in DynamoDB table BookContent-phase2dev
```

## Prereqs

1. **Anthropic API key** — get one at https://console.anthropic.com.
   Add it to `AWS_Backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-…
   ```

2. **phase2dev backend deployed** — see `../PHASE2DEV_SETUP.md`. The script
   reads from / writes to the `*-phase2dev` resources.

3. **Books seeded into phase2dev** — `node scripts/seedDev.js --apply`.

4. **Install new deps**:
   ```
   cd AWS_Backend
   npm install
   ```

## Run it

```bash
# Extract a single book (recommended for the first one — sanity-check output)
npm run extract:book -- --book-id <BOOK_ID>

# Dry-run: rasterize but skip API calls (also prints estimated cost)
npm run extract:book -- --book-id <BOOK_ID> --dry-run

# Extract first 5 pages only (smoke test prompt quality)
npm run extract:book -- --book-id <BOOK_ID> --limit-pages 5

# Skip S3/Dynamo writes — output stays local in ~/.satgurupanth-extract
npm run extract:book -- --book-id <BOOK_ID> --no-upload

# Re-extract even cached pages (use after you tune the prompt)
npm run extract:book -- --book-id <BOOK_ID> --force

# Extract every book in BooksMetadata-phase2dev sequentially
npm run extract:all

# Resume after a partial batch — skips books already in BookContent-phase2dev
npm run extract:all -- --resume
```

## Cost expectations

- Single page: ~$0.003–$0.005
- Single book (~50 pages): ~$0.15–$0.25
- All 39 books: **~$6–$10 total**

Per-page results are cached on disk, so re-runs after a crash cost $0.

## Output schema

See `contentSchema.js`. Top-level fields:

| Field | Purpose |
|---|---|
| `blocks[]` | Ordered, flat list of headings / paragraphs / verses / images |
| `chapters[]` | Detected chapter boundaries with `startOffset` / `endOffset` |
| `totalChars` | Char count for the whole book — drives the progress % |
| `extraction.qaStatus` | `pending` initially → flipped to `ready` after human QA |

## QA workflow (manual, but fast)

After running extraction for a book:

1. Open `~/.satgurupanth-extract/<bookId>/content.json`.
2. Spot-check 5–10 random blocks against the original PDF.
3. If text is correct and chapter boundaries look right, mark the row in
   `BookContent-phase2dev` with `qaStatus=ready`:
   ```
   aws dynamodb update-item \
     --table-name BookContent-phase2dev \
     --key '{"bookId":{"S":"<BOOK_ID>"}}' \
     --update-expression "SET qaStatus = :s" \
     --expression-attribute-values '{":s":{"S":"ready"}}'
   ```
4. Only `qaStatus=ready` books will use the reflowable reader. Books left as
   `pending` automatically fall back to the legacy pdf.js reader on the client
   (M5 wires this fallback up).

## Tuning the prompt

The system prompt lives in `aiVision.js`. If the model is missing certain
patterns (e.g. specific verse types, footer formats), edit the prompt and bump
`PROMPT_VERSION`. Then re-run with `--force` on a sample book to see the
difference.

## Failure modes & how to recover

| Symptom | Cause | Fix |
|---|---|---|
| `ANTHROPIC_API_KEY env var is required` | Missing key in `.env` | Add it |
| `429 rate limit` errors | API rate cap | Lower `EXTRACTION_CONCURRENCY` (e.g. `EXTRACTION_CONCURRENCY=2 npm run extract:book …`) |
| `Page N: invalid JSON from model` | Model wrapped output in markdown | The driver auto-strips; if it persists, tune the prompt to be stricter |
| `Page N: schema validation failed` | Model invented an unknown block type | Re-run with `--force`; if it repeats, add the type to `BlockType` in `contentSchema.js` |
| Garbled Hindi text in output | Vision model couldn't read the page (rare) | Re-render at higher scale (edit `scale` arg in `pdfToImages.js`) |
