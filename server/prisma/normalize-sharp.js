const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Simple CLI arg parser
const args = {};
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, val] = arg.split('=');
    const cleanedKey = key.slice(2);
    args[cleanedKey] = val === undefined ? true : val;
  }
});

const CANVAS_SIZE = parseInt(args['canvas-size'] || '800', 10);
const PADDING_PCT = parseFloat(args['padding-pct'] || '8');
const BG_COLOR = args['bg-color'] || '#F0EDE4';
const BG_THRESHOLD = parseInt(args['bg-threshold'] || '238', 10);
const SAMPLES_ONLY = args['samples-only'] === 'true' || args['samples-only'] === true;
const DEBUG_CROP = args['debug-crop'] === 'true' || args['debug-crop'] === true;

console.log('--- Configuration ---');
console.log(`Canvas Size: ${CANVAS_SIZE}px`);
console.log(`Padding Percent: ${PADDING_PCT}%`);
console.log(`Background Color: ${BG_COLOR}`);
console.log(`Background Threshold: ${BG_THRESHOLD}`);
console.log(`Samples Only Mode: ${SAMPLES_ONLY}`);
console.log(`Debug Crop Mode: ${DEBUG_CROP}`);
console.log('---------------------');

const prismaDir = __dirname;
const scrapedJsonPath = path.join(prismaDir, 'scraped_products.json');
const clientDir = path.join(prismaDir, '..', '..', 'client');
const outputDir = path.join(clientDir, 'public', 'images', 'normalized');
const tempDir = path.join(prismaDir, 'temp_raw_photos');

// Helper to convert hex to RGB object for sharp
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

async function downloadImage(url, destPath) {
  const axios = require('axios');
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  fs.writeFileSync(destPath, response.data);
}

async function findBbox(inputPath, threshold) {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let left = width, top = height, right = 0, bottom = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = channels === 4 ? data[idx + 3] : 255;

      // Ignore transparent pixels
      if (a < 50) continue;

      // Any pixel darker than threshold is considered product
      if (r < threshold || g < threshold || b < threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        found = true;
      }
    }
  }

  // Debug first few pixels
  console.log(`  [Debug Bbox] top-left pixel color: R:${data[0]}, G:${data[1]}, B:${data[2]}, A:${channels === 4 ? data[3] : 255}`);
  console.log(`  [Debug Bbox] found: ${found}, left: ${left}, top: ${top}, right: ${right}, bottom: ${bottom}`);

  if (!found) return null;
  return { left, top, right, bottom, width, height };
}

async function normalizeImage(inputPath, outputPath, options) {
  const bbox = await findBbox(inputPath, options.threshold);
  let srcWidth, srcHeight;
  let sharpImg = sharp(inputPath);
  
  const metadata = await sharpImg.metadata();
  srcWidth = metadata.width;
  srcHeight = metadata.height;

  let extractArea = null;

  if (bbox) {
    const safety = 2; // tight crop safety margin
    const left = Math.max(0, bbox.left - safety);
    const top = Math.max(0, bbox.top - safety);
    const right = Math.min(bbox.width - 1, bbox.right + safety);
    const bottom = Math.min(bbox.height - 1, bbox.bottom + safety);

    extractArea = {
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1
    };
  }

  // Crop tightly if bbox found
  let cropped = sharpImg;
  if (extractArea) {
    cropped = sharp(inputPath).extract(extractArea);
  }

  if (options.debugCropPath) {
    await cropped.png().toFile(options.debugCropPath);
  }

  const cropW = extractArea ? extractArea.width : srcWidth;
  const cropH = extractArea ? extractArea.height : srcHeight;

  // Fit inside the target region
  const paddingPx = Math.floor(options.canvasSize * (options.paddingPct / 100));
  const targetDim = options.canvasSize - 2 * paddingPx;

  const scale = Math.min(targetDim / cropW, targetDim / cropH);
  const newW = Math.max(1, Math.floor(cropW * scale));
  const newH = Math.max(1, Math.floor(cropH * scale));

  const resizedBuffer = await cropped
    .resize(newW, newH, { fit: 'inside' })
    .png()
    .toBuffer();

  const rgb = hexToRgb(options.bgColor);

  // Composite onto Canvas
  await sharp({
    create: {
      width: options.canvasSize,
      height: options.canvasSize,
      channels: 3,
      background: rgb
    }
  })
    .composite([{
      input: resizedBuffer,
      gravity: 'center'
    }])
    .png()
    .toFile(outputPath);

  return {
    original: `${srcWidth}x${srcHeight}`,
    cropped: `${cropW}x${cropH}`,
    placed: `${newW}x${newH}`
  };
}

async function main() {
  if (!fs.existsSync(scrapedJsonPath)) {
    console.error(`scraped_products.json not found in ${prismaDir}`);
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(scrapedJsonPath, 'utf8'));
  console.log(`Loaded ${products.length} products.`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Select samples if SAMPLES_ONLY mode is true
  let productsToProcess = products;
  if (SAMPLES_ONLY) {
    // Pick 3 specific samples: a dark frame (Rayban), a light rimless frame (Maybach), and a medium frame (Police)
    const samples = [];
    const findAndAdd = (keyword) => {
      const p = products.find(prod => prod.name.toLowerCase().includes(keyword));
      if (p) samples.push(p);
    };
    findAndAdd('rayban metal');
    findAndAdd('maybach');
    findAndAdd('police black');
    
    if (samples.length === 0) {
      productsToProcess = products.slice(0, 3);
    } else {
      productsToProcess = samples;
    }
    console.log(`Selected ${productsToProcess.length} sample products for verification.`);
  }

  const options = {
    canvasSize: CANVAS_SIZE,
    paddingPct: PADDING_PCT,
    bgColor: BG_COLOR,
    threshold: BG_THRESHOLD,
    debugCrop: DEBUG_CROP
  };

  const results = [];

  for (let i = 0; i < productsToProcess.length; i++) {
    const product = productsToProcess[i];
    const name = product.name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const imageUrls = product.imageUrls || [];

    if (imageUrls.length === 0) continue;
    const url = imageUrls[0];
    const rawPath = path.join(tempDir, `${slug}_raw_${i}.png`);
    const normPath = path.join(outputDir, `${slug}.png`);

    console.log(`\n[${i + 1}/${productsToProcess.length}] Processing "${name}"...`);

    try {
      // 1. Download or locate raw photo
      if (url.startsWith('http')) {
        console.log(`  Downloading raw image...`);
        await downloadImage(url, rawPath);
      } else {
        // If it is already pointing to normalized, we look for raw file in tempDir, or copy from client public
        const fallbackSrc = path.join(clientDir, 'public', url.startsWith('/') ? url.slice(1) : url);
        if (fs.existsSync(fallbackSrc)) {
          fs.copyFileSync(fallbackSrc, rawPath);
        } else {
          console.log(`  Source local path not found: ${fallbackSrc}`);
          continue;
        }
      }

      // If debugCrop mode is on, configure debug file path
      const opt = { ...options };
      if (options.debugCrop) {
        opt.debugCropPath = path.join(tempDir, `${slug}_cropped.png`);
      }

      // 2. Normalize image using sharp
      const stats = await normalizeImage(rawPath, normPath, opt);
      console.log(`  Success!`);
      console.log(`  - Original: ${stats.original}`);
      console.log(`  - Cropped Bbox: ${stats.cropped}`);
      console.log(`  - Resized and placed: ${stats.placed}`);

      results.push({ name, slug, stats });

      // Update product image reference in-place if not in samples mode
      if (!SAMPLES_ONLY) {
        product.imageUrls = [`/images/normalized/${slug}.png`];
      }
    } catch (err) {
      console.error(`  Failed to process product: ${err.message}`);
    }
  }

  // Save updated product list if not in samples mode
  if (!SAMPLES_ONLY) {
    fs.writeFileSync(scrapedJsonPath, JSON.stringify(products, null, 2), 'utf8');
    console.log(`\nUpdated scraped_products.json with new normalized image references.`);
  } else {
    console.log('\n[SAMPLES ONLY] Processed samples generated successfully. Database references have NOT been modified.');
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
