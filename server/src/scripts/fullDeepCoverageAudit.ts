import { prisma } from '../lib/prisma';
import https from 'https';
import http from 'http';

function checkUrlThrottled(url: string): Promise<{ statusCode: number; error?: string }> {
  return new Promise((resolve) => {
    try {
      if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        return resolve({ statusCode: 0, error: 'INVALID_URL' });
      }
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve({ statusCode: res.statusCode || 0 });
      });
      req.on('error', (err) => resolve({ statusCode: 0, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ statusCode: 0, error: 'TIMEOUT' }); });
      req.end();
    } catch (e: any) {
      resolve({ statusCode: 0, error: e.message });
    }
  });
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function runDeepCoverageAudit() {
  console.log("================ STEP 1: INSPECT SILHOUETTE FRAME 5515 BH 7010 ================");

  const targetProd = await prisma.product.findFirst({
    where: { name: { contains: '5515', mode: 'insensitive' } },
    select: {
      id: true,
      name: true,
      brand: true,
      slug: true,
      defaultImageUrls: true,
      variants: {
        select: {
          id: true,
          sku: true,
          imageUrls: true
        }
      }
    }
  });

  if (targetProd) {
    console.log(`Product Found: "${targetProd.name}" (ID: ${targetProd.id})`);
    console.log(`  defaultImageUrls (${targetProd.defaultImageUrls?.length}):`, JSON.stringify(targetProd.defaultImageUrls, null, 2));
    targetProd.variants.forEach((v, idx) => {
      console.log(`  variant[${idx}] SKU=${v.sku} imageUrls (${v.imageUrls?.length}):`, JSON.stringify(v.imageUrls, null, 2));
    });

    console.log('\n--- Live HTTP HEAD for Silhouette 5515 URLs ---');
    const allUrls = [
      ...((targetProd.defaultImageUrls as string[]) || []),
      ...targetProd.variants.flatMap(v => (v.imageUrls as string[]) || [])
    ];
    const uniqueTargetUrls = Array.from(new Set(allUrls));

    for (const url of uniqueTargetUrls) {
      const res = await checkUrlThrottled(url);
      console.log(`  URL: ${url}`);
      console.log(`  HTTP Status: ${res.statusCode} ${res.error ? `(${res.error})` : ''}`);
    }
  } else {
    console.log('Silhouette Frame 5515 BH 7010 NOT FOUND by "5515" search!');
  }

  console.log("\n================ STEP 2: ACTIVE PRODUCT DATABASE METRICS & COVERAGE ANALYSIS ================");

  const totalActiveProducts = await prisma.product.count({ where: { isActive: true } });
  const allActiveProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      brand: true,
      defaultImageUrls: true,
      variants: {
        select: {
          id: true,
          sku: true,
          imageUrls: true
        }
      }
    }
  });

  let activeWithImagesCount = 0;
  let activeZeroImagesCount = 0;
  const zeroImageProducts: Array<{ id: string; name: string; brand: string }> = [];

  const urlToOccurrencesMap = new Map<string, Array<{ productId: string; productName: string; brand: string; sourceField: string; index: number }>>();

  for (const p of allActiveProducts) {
    const defUrls = (p.defaultImageUrls as string[]) || [];
    const varUrls = p.variants.flatMap(v => (v.imageUrls as string[]) || []);

    const hasImages = defUrls.length > 0 || varUrls.length > 0;
    if (hasImages) {
      activeWithImagesCount++;
    } else {
      activeZeroImagesCount++;
      zeroImageProducts.push({ id: p.id, name: p.name, brand: p.brand || 'Unbranded' });
    }

    defUrls.forEach((url, idx) => {
      if (typeof url === 'string' && url.trim()) {
        const existing = urlToOccurrencesMap.get(url) || [];
        existing.push({ productId: p.id, productName: p.name, brand: p.brand || 'Unbranded', sourceField: 'defaultImageUrls', index: idx });
        urlToOccurrencesMap.set(url, existing);
      }
    });

    p.variants.forEach((v, vIdx) => {
      const vUrls = (v.imageUrls as string[]) || [];
      vUrls.forEach((url, idx) => {
        if (typeof url === 'string' && url.trim()) {
          const existing = urlToOccurrencesMap.get(url) || [];
          existing.push({ productId: p.id, productName: p.name, brand: p.brand || 'Unbranded', sourceField: `variant[${vIdx}].imageUrls`, index: idx });
          urlToOccurrencesMap.set(url, existing);
        }
      });
    });
  }

  console.log(`Total Active Products in Database: ${totalActiveProducts}`);
  console.log(`Active Products WITH at least one image URL: ${activeWithImagesCount}`);
  console.log(`Active Products WITH ZERO image URLs: ${activeZeroImagesCount}`);
  if (zeroImageProducts.length > 0) {
    console.log(`Zero Image Products (${zeroImageProducts.length}):`, JSON.stringify(zeroImageProducts, null, 2));
  }

  const allUniqueUrlsToAudit = Array.from(urlToOccurrencesMap.keys());
  console.log(`Total Unique Image URLs Across Entire Active Catalog (All Array Positions & Variants): ${allUniqueUrlsToAudit.length}`);

  console.log("\n================ STEP 3: REWRITTEN FULL-DEEP COVERAGE HTTP HEAD AUDIT ================");

  // Concurrency 40
  const auditResults = await mapConcurrent(allUniqueUrlsToAudit, 40, async (url) => {
    const res = await checkUrlThrottled(url);
    return { url, statusCode: res.statusCode, error: res.error };
  });

  const brokenUrlMap = new Map<string, { url: string; statusCode: number; error?: string; occurrences: Array<{ productId: string; productName: string; brand: string; sourceField: string; index: number }> }>();
  const brokenProductMap = new Map<string, { productId: string; productName: string; brand: string; brokenUrls: Array<{ url: string; statusCode: number; error?: string; sourceField: string; index: number }> }>();

  const statusDistribution: Record<string, number> = {};
  const brokenBrandDistribution: Record<string, number> = {};

  for (const r of auditResults) {
    const codeKey = r.statusCode > 0 ? `HTTP ${r.statusCode}` : (r.error || 'UNKNOWN_ERROR');
    statusDistribution[codeKey] = (statusDistribution[codeKey] || 0) + 1;

    if (r.statusCode !== 200) {
      const occurrences = urlToOccurrencesMap.get(r.url) || [];
      brokenUrlMap.set(r.url, { url: r.url, statusCode: r.statusCode, error: r.error, occurrences });

      for (const occ of occurrences) {
        brokenBrandDistribution[occ.brand] = (brokenBrandDistribution[occ.brand] || 0) + 1;

        const existingProd = brokenProductMap.get(occ.productId) || {
          productId: occ.productId,
          productName: occ.productName,
          brand: occ.brand,
          brokenUrls: []
        };
        existingProd.brokenUrls.push({
          url: r.url,
          statusCode: r.statusCode,
          error: r.error,
          sourceField: occ.sourceField,
          index: occ.index
        });
        brokenProductMap.set(occ.productId, existingProd);
      }
    }
  }

  const brokenProductsList = Array.from(brokenProductMap.values());

  console.log(`\n================ FULL-DEEP COVERAGE AUDIT RESULTS ================`);
  console.log(`Total Active Products Evaluated: ${allActiveProducts.length}`);
  console.log(`Total Active Products Checked (with images): ${activeWithImagesCount}`);
  console.log(`Total Unique Image URLs Checked (across default + variant arrays): ${allUniqueUrlsToAudit.length}`);
  console.log(`Status Code Distribution:`, JSON.stringify(statusDistribution, null, 2));
  console.log(`Broken Products Count by Brand:`, JSON.stringify(brokenBrandDistribution, null, 2));
  console.log(`\nTOTAL ACTIVE PRODUCTS WITH AT LEAST ONE BROKEN IMAGE: ${brokenProductsList.length}`);

  console.log(`\n================ ITEMIZATION OF ALL BROKEN PRODUCTS (${brokenProductsList.length} PRODUCTS) ================`);
  brokenProductsList.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] Product: "${p.productName}" (Brand: ${p.brand}, ID: ${p.productId})`);
    p.brokenUrls.forEach(b => {
      console.log(`    - Status: HTTP ${b.statusCode} ${b.error ? `(${b.error})` : ''} | Field: ${b.sourceField}[${b.index}]`);
      console.log(`      URL: ${b.url}`);
    });
  });

  process.exit(0);
}

runDeepCoverageAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
