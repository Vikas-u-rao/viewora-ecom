import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const FAMOUS_BRANDS = new Set([
  'Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Versace', 'Tom Ford', 'Burberry', 'Calvin Klein',
  'Persol', 'Carrera', 'Police', 'Vogue', 'D&G', 'Fendi', 'Emporio Armani', 'Miu Miu',
  'Swarovski', 'Montblanc', 'Coach', 'Michael Kors', 'Tommy Hilfiger', 'Lacoste',
  'Ralph Lauren', 'Saint Laurent', 'Off-White',
]);

const MAX_PRICE = 30000;
const TARGET_COUNT = 1000;
const MAX_PER_BRAND = 45;

const SHAPE_KEYWORDS: [string, RegExp][] = [
  ['wayfarer', /wayfarer/i],
  ['aviator', /aviator/i],
  ['round', /round/i],
  ['clubmaster', /clubmaster/i],
  ['d-frame', /d[\s-]?frame/i],
  ['mask', /mask/i],
  ['sports', /sport/i],
];

function detectShape(title: string): string | null {
  for (const [slug, re] of SHAPE_KEYWORDS) {
    if (re.test(title)) return slug;
  }
  return null;
}

const SHAPE_SENTENCE: Record<string, string> = {
  wayfarer: 'Features the iconic Wayfarer silhouette.',
  aviator: 'Features the timeless Aviator silhouette.',
  round: 'Features a classic Round silhouette.',
  clubmaster: 'Features the retro Clubmaster silhouette.',
  'd-frame': 'Features the sporty D-Frame silhouette.',
  mask: 'Features the bold Mask silhouette.',
  sports: 'Built with a Sports-inspired silhouette.',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

interface Row { title: string; brand: string; price: number; type: string; images: string[]; variantTitle: string; sku: string; shape: string | null; }

async function main() {
  const csvPath = path.resolve(__dirname, '../../../products.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCsvLine(lines[0]);
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const v = parseCsvLine(lines[i]);
    if (v.length !== headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h.trim()] = v[idx]?.trim() || ''));
    const type = row['Product Type'];
    if (!['Sunglass', 'Glasses', 'Frame', 'Smart Glasses'].includes(type)) continue;
    if (row['Brand'] === 'best-selling-products' || row['Brand'] === '') continue;
    const price = parseFloat(row['Price']) || 0;
    if (price <= 0) continue;
    const images = row['All Image URLs']
      .split(',')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));
    if (images.length === 0) continue;
    rows.push({
      title: row['Product Title'],
      brand: row['Brand'],
      price,
      type,
      images,
      variantTitle: row['Variant Titles'],
      sku: row['SKU'],
      shape: detectShape(row['Product Title']),
    });
  }

  console.log(`Valid frame rows: ${rows.length}`);
  const shapeRows = rows.filter((r) => r.shape);
  const nonShapeRows = rows.filter((r) => !r.shape);
  console.log(`Shape-titled: ${shapeRows.length} | Non-shape: ${nonShapeRows.length}`);

  const byShape: Record<string, number> = {};
  shapeRows.forEach((r) => (byShape[r.shape!] = (byShape[r.shape!] || 0) + 1));
  console.log('Shape breakdown:', JSON.stringify(byShape));

  const selected: Row[] = [...shapeRows];
  const selectedKeys = new Set(shapeRows.map((r) => r.title + '|' + r.brand));
  const selectedBrands = new Map<string, number>();
  shapeRows.forEach((r) => selectedBrands.set(r.brand, (selectedBrands.get(r.brand) || 0) + 1));

  const addRow = (r: Row) => {
    const key = r.title + '|' + r.brand;
    if (selectedKeys.has(key)) return;
    selectedKeys.add(key);
    selected.push(r);
    selectedBrands.set(r.brand, (selectedBrands.get(r.brand) || 0) + 1);
  };

  const brandPool = new Map<string, Row[]>();
  for (const r of nonShapeRows) {
    if (!brandPool.has(r.brand)) brandPool.set(r.brand, []);
    brandPool.get(r.brand)!.push(r);
  }
  for (const [brand, list] of brandPool) {
    list.sort((a, b) => b.price - a.price);
  }

  // 1) Include ALL Smart Glasses products (marquee category)
  for (const list of brandPool.values()) {
    for (const r of list) {
      if (r.type === 'Smart Glasses') addRow(r);
    }
  }
  // 2) Floor: every brand with any pool gets at least 3 products
  for (const [brand, list] of brandPool) {
    const current = selectedBrands.get(brand) || 0;
    for (const r of list) {
      if ((selectedBrands.get(brand) || 0) >= Math.max(3, current)) break;
      addRow(r);
    }
  }

  while (selected.length < TARGET_COUNT && brandPool.size > 0) {
    let bestBrand: string | null = null;
    let bestList: Row[] | null = null;
    for (const [brand, list] of brandPool) {
      if (list.length === 0) continue;
      const current = selectedBrands.get(brand) || 0;
      if (current >= MAX_PER_BRAND) continue;
      if (!bestList || list.length > bestList.length || (list.length === bestList.length && current < (bestBrand ? (selectedBrands.get(bestBrand) || 0) : 0))) {
        bestBrand = brand;
        bestList = list;
      }
    }
    if (!bestBrand || !bestList) break;
    const pick = bestList.shift()!;
    selected.push(pick);
    selectedBrands.set(bestBrand, (selectedBrands.get(bestBrand) || 0) + 1);
  }

  console.log(`\nSelected: ${selected.length}`);
  const selBrands: Record<string, number> = {};
  selected.forEach((r) => (selBrands[r.brand] = (selBrands[r.brand] || 0) + 1));
  console.log('Selected by brand:', JSON.stringify(selBrands, null, 1));

  const clampCount = selected.filter((r) => !FAMOUS_BRANDS.has(r.brand) && r.price > MAX_PRICE).length;
  console.log(`Non-famous products to clamp (>30k): ${clampCount}`);

  const typeMap = (t: string) =>
    t === 'Sunglass' ? 'sunglasses' : t === 'Smart Glasses' ? 'smart-glasses' : 'optical-frames';

  const slugCounts = new Map<string, number>();
  const skuCounts = new Map<string, number>();
  const existingVariants = await prisma.productVariant.findMany({ select: { sku: true } });
  for (const v of existingVariants) skuCounts.set(v.sku, 1);

  console.log('\n=== WRITING TO DATABASE ===');
  const allProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
  const existingBySlug = new Map(allProducts.map((p) => [p.slug, p.id]));

  let created = 0;
  let updated = 0;
  const touchedIds = new Set<string>();

  for (const r of selected) {
    const baseSlug = slugify(r.title);
    const n = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, n + 1);
    const slug = n === 0 ? baseSlug : `${baseSlug}-${n}`;

    let finalPrice = r.price;
    if (!FAMOUS_BRANDS.has(r.brand) && finalPrice > MAX_PRICE) finalPrice = MAX_PRICE;

    let description = `Official luxury ${r.title} by ${r.brand}. Crafted with precision optics and premium materials.`;
    if (r.shape) description += ` ${SHAPE_SENTENCE[r.shape]}`;

    const existingId = existingBySlug.get(slug);
    if (existingId) {
      touchedIds.add(existingId);
      await prisma.product.update({
        where: { id: existingId },
        data: {
          name: r.title,
          brand: r.brand,
          description,
          startingPrice: finalPrice,
          defaultImageUrls: r.images,
          isActive: true,
        },
      });
      const variant = await prisma.productVariant.findFirst({ where: { productId: existingId } });
      if (variant) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { price: finalPrice, size: r.variantTitle, imageUrls: r.images, isActive: true },
        });
      }
      updated++;
    } else {
      const cat = await prisma.category.findUnique({ where: { slug: typeMap(r.type) } });
      const prod = await prisma.product.create({
        data: {
          name: r.title,
          slug,
          brand: r.brand,
          description,
          categoryId: cat!.id,
          defaultImageUrls: r.images,
          startingPrice: finalPrice,
          isActive: true,
        },
      });
      touchedIds.add(prod.id);
      const baseSku = r.sku || `VW-${slug.slice(0, 24)}`;
      const sk = skuCounts.get(baseSku) || 0;
      skuCounts.set(baseSku, sk + 1);
      await prisma.productVariant.create({
        data: {
          productId: prod.id,
          sku: sk === 0 ? baseSku : `${baseSku}-${sk}`,
          color: r.variantTitle.includes('/') ? r.variantTitle.split('/')[1].trim() : r.variantTitle,
          size: r.variantTitle,
          lensType: r.type === 'Sunglass' ? 'UV400 Protected' : 'Clear Prescription',
          price: finalPrice,
          stock: 50,
          imageUrls: r.images,
          isActive: true,
        },
      });
      created++;
    }
  }

  const toDeactivate = [...existingBySlug.values()].filter((id) => !touchedIds.has(id));
  await prisma.product.updateMany({ where: { id: { in: toDeactivate } }, data: { isActive: false } });
  await prisma.productVariant.updateMany({ where: { productId: { in: toDeactivate } }, data: { isActive: false } });

  const activeTotal = await prisma.product.count({ where: { isActive: true } });
  console.log(`\nCreated: ${created} | Updated: ${updated} | Deactivated: ${toDeactivate.length}`);
  console.log(`ACTIVE PRODUCTS IN DB: ${activeTotal}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
