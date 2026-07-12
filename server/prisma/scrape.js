const fs = require('fs');
const path = require('path');
const https = require('https');

const URLS = [
  {
    url: 'https://www.jaiswalopticals.net/premium-international-brands-sunglasses.html',
    defaultCategory: 'sunglasses',
    defaultCollection: 'Premium Eyewear'
  },
  {
    url: 'https://www.jaiswalopticals.net/jaiswal-opticals-signature-eyewear.html',
    defaultCategory: 'eyeglasses',
    defaultCollection: 'Best Sellers'
  },
  {
    url: 'https://www.jaiswalopticals.net/luxury-branded-eyewear.html',
    defaultCategory: 'sunglasses',
    defaultCollection: 'Premium Eyewear'
  },
  {
    url: 'https://www.jaiswalopticals.net/premium-international-brand-eyewear.html',
    defaultCategory: 'eyeglasses',
    defaultCollection: 'New Arrivals'
  }
];

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractProducts(html) {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let products = [];
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    if (scriptContent.includes('img_id')) {
      const arrayStartIdx = scriptContent.indexOf('[{"img_id"');
      if (arrayStartIdx !== -1) {
        let bracketCount = 1;
        let i = arrayStartIdx + 1;
        while (i < scriptContent.length && bracketCount > 0) {
          if (scriptContent[i] === '[') bracketCount++;
          else if (scriptContent[i] === ']') bracketCount--;
          i++;
        }
        const jsonStr = scriptContent.substring(arrayStartIdx, i);
        try {
          // Use Function constructor to safely evaluate valid JS array (handles trailing commas, escaped single quotes, etc.)
          const parsed = new Function(`return ${jsonStr}`)();
          if (Array.isArray(parsed)) {
            products = parsed;
            break;
          }
        } catch (e) {
          console.error("Failed to parse extracted JS array: ", e.message);
        }
      }
    }
  }
  return products;
}

async function scrapeAll() {
  const allProducts = [];
  for (const item of URLS) {
    console.log(`Fetching ${item.url}...`);
    try {
      const html = await fetchHtml(item.url);
      const rawProducts = extractProducts(html);
      console.log(`Extracted ${rawProducts.length} raw products from ${item.url}`);
      
      for (const raw of rawProducts) {
        if (!raw.prd_name) continue;
        
        const nameLower = raw.prd_name.toLowerCase();
        
        // Exclude unwanted products
        if (
          nameLower.includes("jaiswal opticals brands eyeglass frame") ||
          nameLower.includes("politicians spectacles frames") ||
          nameLower.includes("silhouette spectacle frames") ||
          nameLower.includes("silhoutte / stepper/ lindberg") ||
          nameLower.includes("silhoutte/stepper/lindberg") ||
          nameLower.includes("emporio armani clip on") ||
          nameLower.includes("emporio armani clip-on")
        ) {
          console.log(`Skipping excluded product: ${raw.prd_name}`);
          continue;
        }

        let price = 1999.00;
        if (raw.prd_price) {
          const cleanPriceStr = raw.prd_price.replace(/Rs&nbsp;|\/ Piece|\/Piece|,|\s/gi, '');
          const parsedPrice = parseFloat(cleanPriceStr);
          if (!isNaN(parsedPrice) && parsedPrice > 0) {
            price = parsedPrice;
          }
        }

        // Exclude products over 10k
        if (price > 10000) {
          console.log(`Skipping product over 10k: ${raw.prd_name} (Price: ${price})`);
          continue;
        }
        
        const specs = {};
        if (Array.isArray(raw.isq_det_form)) {
          for (const spec of raw.isq_det_form) {
            const key = spec.FK_IM_SPEC_MASTER_DESC || '';
            const val = spec.SUPPLIER_RESPONSE_DETAIL || '';
            if (key && val) {
              specs[key.trim()] = val.trim();
            }
          }
        }
        
        let brand = specs['Brand Name'] || specs['Brand'] || 'Jaiswal Premium';
        if (brand === 'Jaiswal Premium' || !brand) {
          const firstWord = raw.prd_name.split(' ')[0];
          if (['Rayban', 'Ray-Ban', 'Police', 'FILA', 'Polaroid', 'Allen', 'Ferrari', 'Carrera', 'IDEE', 'Maybach', 'Mont', 'Versace', 'Cutler', 'Tommy', 'Emporio', 'Jimmy', 'Montblanc', 'Oakley', 'Vogue', 'GUESS', 'Bausch', 'Alcon', 'Zeiss', 'Hoya', 'Burberry'].includes(firstWord)) {
            brand = firstWord;
            if (brand === 'Rayban') brand = 'Ray-Ban';
          }
        }

        // Exclude brand Jaiswal Premium
        if (brand === 'Jaiswal Premium') {
          console.log(`Skipping excluded brand product: ${raw.prd_name}`);
          continue;
        }

        let category = item.defaultCategory;
        if (nameLower.includes('blue light') || nameLower.includes('computer')) {
          category = 'blue-light-glasses';
        } else if (nameLower.includes('reading') || nameLower.includes('reader')) {
          category = 'reading-glasses';
        } else if (nameLower.includes('sunglass') || nameLower.includes('sunglasses') || nameLower.includes('shades')) {
          category = 'sunglasses';
        } else if (nameLower.includes('eyeglass') || nameLower.includes('frame') || nameLower.includes('spectacle')) {
          category = 'eyeglasses';
        }

        allProducts.push({
          name: raw.prd_name,
          brand: brand,
          description: specs['Usage/Application'] || specs['Occasion'] || `${brand} premium eyewear frame. High quality and elegant design.`,
          category: category,
          collection: item.defaultCollection,
          imageUrls: [raw.img_path || raw.img_path1 || 'https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/aviator_front.jpg'],
          price: price,
          specs: specs
        });
      }
    } catch (err) {
      console.error(`Error processing ${item.url}:`, err.message);
    }
  }

  const outputPath = path.join(__dirname, 'scraped_products.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2), 'utf8');
  console.log(`Saved ${allProducts.length} mapped products to ${outputPath}`);
}

scrapeAll();
