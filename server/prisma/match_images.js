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

function cleanName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(sunglasses|sunglass|eyewear|frame|glasses|glass|kids|ladies|unisex|men|women|male|female)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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

  const scrapedPath = path.join(__dirname, 'scraped_products.json');
  if (!fs.existsSync(scrapedPath)) {
    console.error('scraped_products.json not found!');
    return;
  }

  const scrapedProducts = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  let matchCount = 0;

  for (const product of scrapedProducts) {
    const dbCleanName = cleanName(product.name);
    const dbBrand = (product.brand || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Look for a match in Shopify products
    let bestMatch = null;
    let highestScore = 0;

    for (const sh of shopifyProducts) {
      const shCleanName = cleanName(sh.title);
      const shBrand = (sh.vendor || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check if brand matches (if both have brands)
      const brandMatch = !dbBrand || !shBrand || dbBrand.includes(shBrand) || shBrand.includes(dbBrand);
      if (!brandMatch) continue;

      // Check for overlap of words
      const dbWords = dbCleanName.split(' ').filter(Boolean);
      const shWords = shCleanName.split(' ').filter(Boolean);
      
      if (dbWords.length === 0 || shWords.length === 0) continue;

      // Count overlapping words
      const commonWords = dbWords.filter(w => shWords.includes(w));
      const score = commonWords.length / Math.max(dbWords.length, shWords.length);

      if (score > highestScore && score >= 0.4) {
        highestScore = score;
        bestMatch = sh;
      }
    }

    if (bestMatch && bestMatch.images && bestMatch.images.length > 0) {
      const newImages = bestMatch.images.map(img => img.src);
      console.log(`Matched: "${product.name}" (${product.brand}) -> "${bestMatch.title}" (${bestMatch.vendor}) | Score: ${highestScore.toFixed(2)}`);
      product.imageUrls = newImages;
      matchCount++;
    }
  }

  console.log(`\nUpdated ${matchCount} out of ${scrapedProducts.length} products with high-quality Shopify images.`);

  fs.writeFileSync(scrapedPath, JSON.stringify(scrapedProducts, null, 2), 'utf8');
  console.log('Saved changes to scraped_products.json.');
}

run();
