/**
 * verify-images.js
 *
 * Independent, local verification script — run this yourself on your own machine
 * against the exported all-product-image-urls.csv file. Does not trust or depend
 * on any previous audit's claims.
 *
 * Usage:
 *   1. Place this file in the same folder as all-product-image-urls.csv
 *   2. Run: node verify-images.js
 *   3. Wait for it to finish (throttled to avoid false 429s / overwhelming R2)
 *   4. Check the generated broken-images-report.csv for the real, independently-verified results
 *
 * Requires only Node.js (no npm install needed) — uses built-in https/fs modules.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'all-product-image-urls.csv');
const OUTPUT_FILE = path.join(__dirname, 'broken-images-report.csv');
const CONCURRENCY = 8;        // max simultaneous requests — keep modest to avoid false 429s
const DELAY_MS = 50;          // small delay between batches
const TIMEOUT_MS = 10000;     // 10s timeout per request

function parseCsvLine(line) {
  // Simple CSV parser assuming no embedded commas in URLs (should hold true for standard URLs)
  return line.split(',');
}

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.request(url, { method: 'HEAD', timeout: TIMEOUT_MS }, (res) => {
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300 });
        res.resume();
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ url, status: 'TIMEOUT', ok: false });
      });
      req.on('error', (err) => {
        resolve({ url, status: `ERROR: ${err.code || err.message}`, ok: false });
      });
      req.end();
    } catch (err) {
      resolve({ url, status: `EXCEPTION: ${err.message}`, ok: false });
    }
  });
}

async function processBatch(rows, startIdx) {
  const batch = rows.slice(startIdx, startIdx + CONCURRENCY);
  const results = await Promise.all(
    batch.map(async (row) => {
      const result = await checkUrl(row.url);
      return { ...row, ...result };
    })
  );
  return results;
}

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: ${INPUT_FILE} not found. Place all-product-image-urls.csv in the same folder as this script.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1); // skip header

  const rows = dataLines.map(line => {
    const parts = parseCsvLine(line);
    return {
      product_id: parts[0],
      product_name: parts[1],
      brand: parts[2],
      source_field: parts[3],
      array_index: parts[4],
      url: parts.slice(5).join(','), // in case URL itself contains a comma-like artifact
    };
  }).filter(r => r.url && r.url.startsWith('http'));

  console.log(`Loaded ${rows.length} URLs from ${INPUT_FILE}`);
  console.log(`Checking with concurrency=${CONCURRENCY}, this will take a while for large catalogs...\n`);

  const allResults = [];
  let checked = 0;

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batchResults = await processBatch(rows, i);
    allResults.push(...batchResults);
    checked += batchResults.length;

    if (checked % 100 === 0 || checked === rows.length) {
      console.log(`Checked ${checked}/${rows.length}...`);
    }

    if (DELAY_MS > 0) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  const broken = allResults.filter(r => !r.ok);
  const working = allResults.filter(r => r.ok);

  // Write full report (broken only, for review)
  const csvHeader = 'product_id,product_name,brand,source_field,array_index,status,url\n';
  const csvRows = broken.map(r =>
    `"${r.product_id}","${r.product_name}","${r.brand}","${r.source_field}","${r.array_index}","${r.status}","${r.url}"`
  ).join('\n');
  fs.writeFileSync(OUTPUT_FILE, csvHeader + csvRows);

  console.log('\n=== SUMMARY (independently verified, right now, on your machine) ===');
  console.log(`Total URLs checked: ${allResults.length}`);
  console.log(`Working (200 OK): ${working.length}`);
  console.log(`Broken: ${broken.length}`);
  console.log(`\nFull broken list written to: ${OUTPUT_FILE}`);

  if (broken.length > 0) {
    const uniqueBrokenProducts = new Set(broken.map(r => r.product_id));
    console.log(`Unique products affected: ${uniqueBrokenProducts.size}`);

    const byBrand = {};
    broken.forEach(r => {
      byBrand[r.brand] = (byBrand[r.brand] || 0) + 1;
    });
    console.log('\nBroken URLs by brand:');
    Object.entries(byBrand)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => console.log(`  ${brand}: ${count}`));
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
