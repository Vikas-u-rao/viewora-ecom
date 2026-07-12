const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    };
    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch: ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function normalizeBrand(brand) {
  if (!brand) return '';
  let b = brand.toLowerCase().trim();
  if (b.includes('ray-ban') || b.includes('ray ban') || b.includes('rayban')) return 'rayban';
  if (b.includes('oakley')) return 'oakley';
  if (b.includes('tommy')) return 'tommy';
  if (b.includes('police')) return 'police';
  if (b.includes('boss') || b.includes('hugo')) return 'boss';
  if (b.includes('vogue')) return 'vogue';
  if (b.includes('versace')) return 'versace';
  if (b.includes('lacoste')) return 'lacoste';
  if (b.includes('carrera')) return 'carrera';
  if (b.includes('calvin')) return 'calvin';
  if (b.includes('ferrari')) return 'ferrari';
  if (b.includes('fila')) return 'fila';
  if (b.includes('idee')) return 'idee';
  if (b.includes('polaroid')) return 'polaroid';
  if (b.includes('maybach')) return 'maybach';
  if (b.includes('allen')) return 'allen';
  if (b.includes('peter')) return 'peter';
  if (b.includes('polo')) return 'polo';
  return b;
}

async function run() {
  console.log('Fetching all Shopify products from jaiswalopticals.com...');
  const shopifyProducts = [];
  let page = 1;
  while (true) {
    console.log(`Fetching page ${page}...`);
    try {
      const result = await fetchUrl(`https://jaiswalopticals.com/products.json?limit=250&page=${page}`);
      if (!result.products || result.products.length === 0) {
        break;
      }
      shopifyProducts.push(...result.products);
      page++;
      if (page > 3) break;
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
      break;
    }
  }

  console.log(`Successfully fetched ${shopifyProducts.length} Shopify products.`);

  // Group Shopify products by normalized vendor/brand
  const shopifyByBrand = {};
  for (const sh of shopifyProducts) {
    const norm = normalizeBrand(sh.vendor || '');
    if (!norm) continue;
    if (!shopifyByBrand[norm]) {
      shopifyByBrand[norm] = [];
    }
    shopifyByBrand[norm].push(sh);
  }

  const scrapedPath = path.join(__dirname, 'scraped_products.json');
  if (!fs.existsSync(scrapedPath)) {
    console.error('scraped_products.json not found!');
    return;
  }

  const scrapedProducts = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  
  // Track image usage counters per brand to ensure variety
  const brandImageIndex = {};

  let updatedCount = 0;

  for (const product of scrapedProducts) {
    const normDbBrand = normalizeBrand(product.brand || '');
    
    // Find matching Shopify products for this brand
    const shList = shopifyByBrand[normDbBrand] || [];
    
    if (shList.length > 0) {
      // Initialize index counter
      if (brandImageIndex[normDbBrand] === undefined) {
        brandImageIndex[normDbBrand] = 0;
      }
      
      // Cycle through available products for this brand to pick an image
      const chosenProduct = shList[brandImageIndex[normDbBrand] % shList.length];
      brandImageIndex[normDbBrand]++;

      if (chosenProduct.images && chosenProduct.images.length > 0) {
        // Collect all images for the variant
        product.imageUrls = chosenProduct.images.map(img => img.src);
        console.log(`Assigned brand image: "${product.name}" (${product.brand}) -> "${chosenProduct.title}" (${chosenProduct.vendor})`);
        updatedCount++;
      }
    } else {
      // Fallback for brands not found in Shopify (e.g. Jacob Marin, Igo)
      // We can use a generic premium frame from Shopify
      const allSpecs = shopifyProducts.filter(sh => sh.images && sh.images.length > 0);
      if (allSpecs.length > 0) {
        if (brandImageIndex['generic'] === undefined) {
          brandImageIndex['generic'] = 0;
        }
        const chosenProduct = allSpecs[brandImageIndex['generic'] % allSpecs.length];
        brandImageIndex['generic']++;
        product.imageUrls = chosenProduct.images.map(img => img.src);
        console.log(`Assigned generic fallback image: "${product.name}" (${product.brand}) -> "${chosenProduct.title}"`);
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully matched and updated ${updatedCount} of ${scrapedProducts.length} products.`);

  fs.writeFileSync(scrapedPath, JSON.stringify(scrapedProducts, null, 2), 'utf8');
  console.log('Saved changes to scraped_products.json.');
}

run();
