#!/usr/bin/env node
//
// importAllManual.js — batch driver that imports all 39 manually-typed Hindi
// book texts into the phase2dev environment.
//
// Each entry below maps a manual-text/<slug>.txt file to the BookID from
// BooksMetadata-phase2dev. The importer is spawned per book in series so the
// per-book stats remain readable. On failure the run continues; a summary is
// printed at the end.
//
// Usage:
//   node scripts/extraction/importAllManual.js              # dry-run all
//   node scripts/extraction/importAllManual.js --apply      # write to S3/Dynamo
//   node scripts/extraction/importAllManual.js --only virat-bano.txt
//
// Add new books by extending MAPPING below.

const path = require('path');
const { spawn } = require('child_process');

const MAPPING = [
  // BookID                                | text file
  ['1',                                       'aatmbodh.txt'],
  ['3',                                       'aatmbodh-mala.txt'],
  ['5',                                       'satya-path.txt'],
  ['195d6afc-c101-4bce-904b-e697d8f859cb',    'adhyatma-ka-khel.txt'],
  ['e100029c-e62d-432f-90af-c6ca7e833c20',    'aadhyatmik-prashnottari.txt'],
  ['0f94c4bf-87d7-492e-bb8b-a121a5ecfc8c',    'advaita-bhakti.txt'],
  ['9a533c0b-7152-4a06-aaf3-42cda1042f67',    'agayani-jeev.txt'],
  ['0531a025-be2b-4103-afb3-6ae602fd9648',    'andar-se-dhoy-daro-to-jane.txt'],
  ['f08f7f3d-c29d-47c0-aabb-25fa5d07a336',    'aproksh-bhakti.txt'],
  ['cea34e57-256f-4b77-a714-dee210c82708',    'dhar-kaise.txt'],
  ['af79c7b4-1845-4f6e-9551-75977abf004d',    'fakir.txt'],
  ['bea6236a-9062-4b68-9cd7-0fb84e87de0d',    'geeta-saar.txt'],
  ['a183d3a1-c6b0-4391-9c98-59cc8f6b2e77',    'gyan-ganga.txt'],
  ['e9199e81-7f45-4129-bd77-7b94198a1c03',    'jeev-ka-dharm-yuddh.txt'],
  ['0b4733c0-c851-4757-8842-94d67af70ed5',    'kalki-avataran.txt'],
  ['b4758d48-1aa7-4978-8d51-3a6aee540b57',    'kalyug-ka-nishkalank-avtaar.txt'],
  ['83176531-3d28-4290-a9dd-07b12a679dc6',    'man-ki-dhaar-ko-palto.txt'],
  ['3058b003-ce72-4a65-b1d0-6820411868ae',    'mool-gyan-hi-saar-hai.txt'],
  ['c1b18218-5d31-422d-be76-23cb1e0d8e9f',    'mukti-path.txt'],
  ['1312a915-7c25-416e-94a0-be7223a315aa',    'naamdaan-ka-saar.txt'],
  ['07ae5b8c-9d33-4877-8d8f-efd891d5052c',    'naamdaan-ki-tayyari.txt'],
  ['645f900f-fccb-43dc-8441-3a37d5981228',    'param-gyan.txt'],
  ['97523a68-3730-4b10-b987-e5b5e3d3a4a4',    'param-vani.txt'],
  ['74bb4e94-f31e-45f1-8df6-f04c1bab7380',    'poorn-adhyatmik-safar.txt'],
  ['b0f631ab-96e8-4e96-bd19-3c70535543f2',    'prarthna.txt'],
  ['7a9e61e1-df4d-4bca-a0d0-eb79ed00f9ba',    'raam-kripa.txt'],
  ['8e500053-691a-48b8-9ef4-5e090b3a17d3',    'saar-ka-saar.txt'],
  ['4',                                       'saar-vani.txt'],
  ['975c4252-9d37-4d7a-ad65-9f5dab652a7d',    'satguru-mahima.txt'],
  ['60020baf-39ff-485c-9594-e0ff65c6e4c9',    'sahaj-path.txt'],
  ['37df6642-8ad8-4c15-bafe-7a6c668db3b3',    'satguru-panth.txt'],
  ['9585ad65-faa7-4a00-b81a-ee543258cdca',    'satguru-panth-ki-khoj.txt'],
  ['2cd13550-ecc6-4534-98f4-b97e5d2876a9',    'satguru-ki-chetavni.txt'],
  ['c93ccd83-2cf5-4c16-b9c7-e18283431468',    'satya-gyan-ko-jane.txt'],
  ['83822a96-9880-480e-9840-a46f6aacea30',    'satnaam.txt'],
  ['2',                                       'satsang-mala.txt'],
  ['bc9fc490-c5e1-4607-a245-d4783e9f7169',    'satya-khojo.txt'],
  ['74031926-2fd4-40de-a73b-c73951252017',    'satya-narayan-ki-katha.txt'],
  ['a8553efc-d1c1-409f-9941-d8d1de7ed520',    'virat-bano.txt'],
  ['e0e8cb47-e5a6-4dbf-8615-5f141efe8260',    'keval-nyara-hona-hai.txt'],
  ['08fba010-7e16-4617-9470-f87a3b9a45f2',    'humko-chahiye.txt'],
  ['a80e6b77-6d45-4b34-ba0a-c3b5a3074290',    'satguru-panth-21-prashn.txt'],
];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
  }
  return args;
}

function runOne(bookId, textRelPath, extraArgs) {
  return new Promise((resolve) => {
    const script = path.join(__dirname, 'importManualText.js');
    const textPath = path.join(__dirname, 'manual-text', textRelPath);
    const args = ['--book-id', bookId, '--text-file', textPath, ...extraArgs];
    let out = '';
    const child = spawn(process.execPath, [script, ...args], { env: process.env });
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { out += d.toString(); });
    child.on('exit', (code) => resolve({ code, output: out }));
  });
}

function summarize(output) {
  // Pull out the key stats lines from the importer's output.
  const wanted = ['Title from DynamoDB:', 'totalBlocks:', 'totalChars:', 'chapters:', 'blocks by type:'];
  return output
    .split('\n')
    .filter((l) => wanted.some((k) => l.includes(k)))
    .map((l) => '    ' + l.trim())
    .join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const extra = args.apply ? ['--apply'] : [];
  const only = args.only;

  let pool = MAPPING;
  if (only) pool = pool.filter(([, f]) => f === only);

  console.log(`[batch] ${pool.length} books to process. Mode: ${args.apply ? 'APPLY (uploads)' : 'DRY-RUN (local only)'}`);

  const results = [];
  for (const [bookId, file] of pool) {
    process.stdout.write(`\n[batch] === ${file} (id=${bookId.slice(0, 8)}…) ===\n`);
    const { code, output } = await runOne(bookId, file, extra);
    const stats = summarize(output);
    if (stats) console.log(stats);
    if (code !== 0) {
      console.log(`    ✖ FAILED (exit ${code}). Tail of output:`);
      console.log(output.split('\n').slice(-8).map((l) => '      ' + l).join('\n'));
    }
    results.push({ bookId, file, code });
  }

  console.log('\n[batch] ===== Summary =====');
  const ok = results.filter((r) => r.code === 0);
  const failed = results.filter((r) => r.code !== 0);
  console.log(`  ✓ Succeeded: ${ok.length}`);
  console.log(`  ✖ Failed:    ${failed.length}`);
  if (failed.length) {
    console.log('  Failed books:');
    failed.forEach((f) => console.log(`    - ${f.file} (bookId=${f.bookId})`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[batch] FATAL:', err);
  process.exit(2);
});
