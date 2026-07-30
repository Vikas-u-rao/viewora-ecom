import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

function parseCsv(csvText: string) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function freshStart() {
  console.log("=== BATCH FRESH START: WIPING ALL PRODUCTS & RE-SEEDING FROM LOCAL PRODUCTS.CSV ===");

  // 1. Clear existing database catalog
  console.log("1. Deleting all existing variants, products, and categories from database...");
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.stockReservation.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.productCollection.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  console.log("Successfully wiped database product catalog.");

  // 2. Create Categories
  const catSunglasses = await prisma.category.create({
    data: { name: 'Sunglasses', slug: 'sunglasses' },
  });
  const catOptical = await prisma.category.create({
    data: { name: 'Optical Frames', slug: 'optical-frames' },
  });
  const catSmart = await prisma.category.create({
    data: { name: 'Smart Eyewear', slug: 'smart-glasses' },
  });
  const catLenses = await prisma.category.create({
    data: { name: 'Lenses', slug: 'lenses' },
  });

  const categoryMap: Record<string, string> = {
    'Sunglass': catSunglasses.id,
    'Glasses': catOptical.id,
    'Frame': catOptical.id,
    'Smart Glasses': catSmart.id,
    'Lenses': catLenses.id,
  };

  // 3. Read local products.csv
  const csvPath = path.resolve(__dirname, '../../../products.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`ERROR: products.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCsv(csvContent);
  console.log(`Parsed ${rows.length} product rows from local products.csv.`);

  const slugMap = new Map<string, number>();
  const skuMap = new Map<string, number>();

  const productsToCreate: any[] = [];
  const variantsToCreate: any[] = [];

  for (const row of rows) {
    const title = row['Product Title'];
    if (!title) continue;

    const brand = row['Brand'] || 'Unbranded';
    const priceStr = row['Price'] || '0';
    const price = parseFloat(priceStr) || 0;
    const productType = row['Product Type'] || 'Glasses';
    let baseSku = row['SKU'] || `SKU-${Date.now()}`;
    const variantTitle = row['Variant Titles'] || 'Default';

    // SKU deduplication
    let uniqueSku = baseSku;
    if (skuMap.has(baseSku)) {
      const count = skuMap.get(baseSku)! + 1;
      skuMap.set(baseSku, count);
      uniqueSku = `${baseSku}-${count}`;
    } else {
      skuMap.set(baseSku, 1);
    }

    // Parse image URLs directly from CSV (NO FALLBACK IMAGES AT ALL)
    const rawAllImages = row['All Image URLs'] || row['First Image URL'] || '';
    const imageList: string[] = [];

    if (rawAllImages) {
      rawAllImages.split(',').forEach(u => {
        const trimmed = u.trim().replace(/^"|"$/g, '');
        if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          if (!imageList.includes(trimmed)) {
            imageList.push(trimmed);
          }
        }
      });
    }

    // Slug generation
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = `product-${Date.now()}`;

    let uniqueSlug = baseSlug;
    if (slugMap.has(baseSlug)) {
      const count = slugMap.get(baseSlug)! + 1;
      slugMap.set(baseSlug, count);
      uniqueSlug = `${baseSlug}-${count}`;
    } else {
      slugMap.set(baseSlug, 1);
    }

    // Product active ONLY if it has at least 1 image URL
    const hasImages = imageList.length > 0;
    const categoryId = categoryMap[productType] || catOptical.id;
    const productId = `prod_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

    productsToCreate.push({
      id: productId,
      name: title,
      slug: uniqueSlug,
      brand,
      description: `Official luxury ${title} by ${brand}. Crafted with precision optics and premium materials.`,
      defaultImageUrls: imageList,
      startingPrice: price,
      isActive: hasImages,
      categoryId: categoryId,
    });

    variantsToCreate.push({
      productId: productId,
      sku: uniqueSku,
      price,
      stock: 50,
      size: variantTitle,
      imageUrls: imageList,
      isActive: true,
    });
  }

  console.log(`Inserting ${productsToCreate.length} products into DB via batch createMany...`);
  
  // Batch insert in chunks of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < productsToCreate.length; i += BATCH_SIZE) {
    const pBatch = productsToCreate.slice(i, i + BATCH_SIZE);
    await prisma.product.createMany({ data: pBatch });
    console.log(`  Inserted products ${i + 1} to ${Math.min(i + BATCH_SIZE, productsToCreate.length)}`);
  }

  console.log(`Inserting ${variantsToCreate.length} variants into DB via batch createMany...`);
  for (let i = 0; i < variantsToCreate.length; i += BATCH_SIZE) {
    const vBatch = variantsToCreate.slice(i, i + BATCH_SIZE);
    await prisma.productVariant.createMany({ data: vBatch });
    console.log(`  Inserted variants ${i + 1} to ${Math.min(i + BATCH_SIZE, variantsToCreate.length)}`);
  }

  console.log(`\n=== BATCH FRESH START COMPLETE ===`);
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const inactiveCount = await prisma.product.count({ where: { isActive: false } });
  console.log(`Total Products in DB: ${productsToCreate.length}`);
  console.log(`Active Products with Images: ${activeCount}`);
  console.log(`Inactive Products with 0 Images: ${inactiveCount}`);

  process.exit(0);
}

freshStart().catch(err => {
  console.error(err);
  process.exit(1);
});
