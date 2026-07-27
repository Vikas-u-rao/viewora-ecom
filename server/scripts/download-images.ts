import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { prisma } from '../src/lib/prisma';

const uploadsDir = path.join(__dirname, '../public/uploads/products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      // Already downloaded
      return resolve(true);
    }

    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(destPath, () => {});
        return resolve(false);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    });

    req.on('error', () => {
      fs.unlink(destPath, () => {});
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      fs.unlink(destPath, () => {});
      resolve(false);
    });
  });
}

async function run() {
  console.log('🚀 Starting Local Image Downloader & Migration...');

  const cleanedJsonPath = path.join(__dirname, '../prisma/cleaned_products.json');
  if (!fs.existsSync(cleanedJsonPath)) {
    console.error('❌ cleaned_products.json not found!');
    process.exit(1);
  }

  const productsData = JSON.parse(fs.readFileSync(cleanedJsonPath, 'utf-8'));
  console.log(`📦 Loaded ${productsData.length} products to process.`);

  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process in batches of 20 concurrent downloads
  const batchSize = 20;

  for (let i = 0; i < productsData.length; i += batchSize) {
    const batch = productsData.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (product: any, idxInBatch: number) => {
        const productIndex = i + idxInBatch;
        const slug = product.slug || `product-${productIndex}`;

        const newImageUrls: string[] = [];

        for (let imgIdx = 0; imgIdx < (product.imageUrls || []).length; imgIdx++) {
          const remoteUrl = product.imageUrls[imgIdx];
          if (!remoteUrl || !remoteUrl.startsWith('http')) {
            continue;
          }

          const filename = `${slug}_${imgIdx}.jpg`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
          const localPath = path.join(uploadsDir, filename);
          const relativeUrl = `/uploads/products/${filename}`;

          const success = await downloadFile(remoteUrl, localPath);
          if (success) {
            newImageUrls.push(relativeUrl);
            downloadedCount++;
          } else {
            // Keep remote fallback if download failed
            newImageUrls.push(remoteUrl);
            errorCount++;
          }
        }

        if (newImageUrls.length > 0) {
          product.imageUrls = newImageUrls;
        }
      })
    );

    if ((i + batchSize) % 100 === 0 || i + batchSize >= productsData.length) {
      console.log(`⏳ Processed ${Math.min(i + batchSize, productsData.length)} / ${productsData.length} products...`);
    }
  }

  // Save updated local paths back to cleaned_products.json
  fs.writeFileSync(cleanedJsonPath, JSON.stringify(productsData, null, 2), 'utf-8');
  console.log(`\n✅ Image Migration Completed!`);
  console.log(`📸 Downloaded / Verified: ${downloadedCount}`);
  console.log(`⚠️ Errors / Fallbacks: ${errorCount}`);
  console.log(`📁 Saved images to: ${uploadsDir}`);

  // Update PostgreSQL Database
  console.log('\n🔄 Updating PostgreSQL database records with local image paths...');
  let dbUpdateCount = 0;

  for (const p of productsData) {
    if (p.imageUrls && p.imageUrls.length > 0) {
      try {
        await prisma.product.updateMany({
          where: { slug: p.slug },
          data: { defaultImageUrls: p.imageUrls },
        });
        dbUpdateCount++;
      } catch (err) {
        // Continue
      }
    }
  }

  console.log(`🎉 Successfully updated ${dbUpdateCount} products in PostgreSQL!`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Fatal error during download:', err);
  process.exit(1);
});
