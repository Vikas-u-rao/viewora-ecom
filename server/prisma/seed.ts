import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database catalog...');

  // 1. Clear Existing Data
  console.log('Clearing transactional, cart, and wishlist tables...');
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();

  console.log('Clearing catalog tables...');
  await prisma.productCollection.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collection.deleteMany();

  // 2. Create Categories
  const sunglasses = await prisma.category.create({
    data: { name: 'Sunglasses', slug: 'sunglasses' },
  });
  const eyeglasses = await prisma.category.create({
    data: { name: 'Eyeglasses', slug: 'eyeglasses' },
  });
  const blueLight = await prisma.category.create({
    data: { name: 'Blue Light Glasses', slug: 'blue-light-glasses' },
  });
  const reading = await prisma.category.create({
    data: { name: 'Reading Glasses', slug: 'reading-glasses' },
  });

  // 3. Create Collections
  const bestSellers = await prisma.collection.create({
    data: { name: 'Best Sellers', slug: 'best-sellers', description: 'Our most popular frames, chosen by customers.' },
  });
  const newArrivals = await prisma.collection.create({
    data: { name: 'New Arrivals', slug: 'new-arrivals', description: 'Fresh drops and contemporary seasonal styles.' },
  });
  const premium = await prisma.collection.create({
    data: { name: 'Premium Eyewear', slug: 'premium-eyewear', description: 'Handcrafted luxury acetate and titanium optical styles.' },
  });

  // 4. Create Products & Variants
  
  // Product 1: Aurelia Aviator (Sunglasses)
  const p1 = await prisma.product.create({
    data: {
      name: 'Aurelia Aviator',
      slug: 'aurelia-aviator',
      brand: 'VIEWORA Premium',
      description: 'Iconic teardrop metal frames engineered for comfort, classic style, and dynamic performance.',
      categoryId: sunglasses.id,
      defaultImageUrls: [
        'https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/aviator_front.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/aviator_side.jpg'
      ],
      startingPrice: 2450.00,
    }
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: p1.id,
        sku: 'VW-AVI-BLK-M',
        color: 'Matte Black',
        size: '58mm',
        lensType: 'Polarized Dark Grey',
        material: 'Stainless Steel',
        price: 2450.00,
        stock: 15,
        imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/aviator_front_black.jpg'],
      },
      {
        productId: p1.id,
        sku: 'VW-AVI-GLD-M',
        color: 'Brushed Gold',
        size: '58mm',
        lensType: 'Polarized Green G15',
        material: 'Stainless Steel',
        price: 2750.00, // Premium colorway
        stock: 8,
        imageUrls: ['https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/aviator_front_gold.jpg'],
      }
    ]
  });

  // Link to collections
  await prisma.productCollection.createMany({
    data: [
      { productId: p1.id, collectionId: bestSellers.id },
      { productId: p1.id, collectionId: premium.id }
    ]
  });

  // Product 2: Urban Round (Blue Light Glasses)
  const p2 = await prisma.product.create({
    data: {
      name: 'Urban Round',
      slug: 'urban-round',
      brand: 'VIEWORA Optical',
      description: 'Ultralightweight round frames with premium blue light blocking lenses designed for digital professionals.',
      categoryId: blueLight.id,
      defaultImageUrls: [
        'https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/round_front.jpg'
      ],
      startingPrice: 1499.00,
    }
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: p2.id,
        sku: 'VW-RND-CLR',
        color: 'Crystal Clear',
        size: '49mm',
        lensType: 'Blue Light Filter',
        material: 'TR90 Swiss Polycarbonate',
        price: 1499.00,
        stock: 20,
        imageUrls: [],
      },
      {
        productId: p2.id,
        sku: 'VW-RND-TOR',
        color: 'Tortoise Brown',
        size: '49mm',
        lensType: 'Blue Light Filter',
        material: 'TR90 Swiss Polycarbonate',
        price: 1499.00,
        stock: 12,
        imageUrls: [],
      }
    ]
  });

  await prisma.productCollection.createMany({
    data: [
      { productId: p2.id, collectionId: newArrivals.id }
    ]
  });

  // Product 3: Woodland Rectangle (Eyeglasses)
  const p3 = await prisma.product.create({
    data: {
      name: 'Woodland Rectangle',
      slug: 'woodland-rectangle',
      brand: 'Woodland Collection',
      description: 'Handcrafted acetate frames featuring custom organic sandalwood temples for a refined look.',
      categoryId: eyeglasses.id,
      defaultImageUrls: [
        'https://res.cloudinary.com/demo/image/upload/v1652343212/viewora/rectangle_front.jpg'
      ],
      startingPrice: 3499.00,
    }
  });

  await prisma.productVariant.createMany({
    data: [
      {
        productId: p3.id,
        sku: 'VW-REC-WOD',
        color: 'Polished Tortoise & Sandalwood',
        size: '52mm',
        lensType: 'Clear Demo Lens',
        material: 'Bio-Acetate & Wood',
        price: 3499.00,
        stock: 5,
        imageUrls: [],
      }
    ]
  });

  await prisma.productCollection.createMany({
    data: [
      { productId: p3.id, collectionId: premium.id },
      { productId: p3.id, collectionId: bestSellers.id }
    ]
  });

  // 5. Seed Scraped Products from Jaiswal Opticals
  console.log('Seeding scraped products...');
  const fs = require('fs');
  const path = require('path');
  const scrapedFilePath = path.join(__dirname, 'scraped_products.json');

  if (fs.existsSync(scrapedFilePath)) {
    const scrapedData = JSON.parse(fs.readFileSync(scrapedFilePath, 'utf8'));
    console.log(`Found ${scrapedData.length} scraped products to seed.`);
    
    let slugMap = new Set<string>();
    slugMap.add('aurelia-aviator');
    slugMap.add('urban-round');
    slugMap.add('woodland-rectangle');

    const brandImages: Record<string, string> = {
      'ray-ban': '/images/products/ray-ban.png',
      'rayban': '/images/products/ray-ban.png',
      'oakley': '/images/products/oakley.png',
      'gucci': '/images/products/gucci.png',
      'prada': '/images/products/prada.png',
      'versace': '/images/products/versace.png',
      'persol': '/images/products/persol.png',
      'tom ford': '/images/products/tom-ford.png',
      'tomford': '/images/products/tom-ford.png',
      'cartier': '/images/products/cartier.png',
      'police': '/images/products/police.png',
      'carrera': '/images/products/carrera.png',
      'burberry': '/images/products/burberry.png',
      'vogue': '/images/products/vogue-eyewear.png',
      'vogue eyewear': '/images/products/vogue-eyewear.png'
    };

    for (let i = 0; i < scrapedData.length; i++) {
      const item = scrapedData[i];
      let baseSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!baseSlug) baseSlug = 'scraped-product';
      let slug = baseSlug;
      let count = 1;
      while (slugMap.has(slug)) {
        slug = `${baseSlug}-${count}`;
        count++;
      }
      slugMap.add(slug);

      let categoryId = sunglasses.id;
      if (item.category === 'eyeglasses') {
        categoryId = eyeglasses.id;
      } else if (item.category === 'blue-light-glasses') {
        categoryId = blueLight.id;
      } else if (item.category === 'reading-glasses') {
        categoryId = reading.id;
      }

      let imageUrls = item.imageUrls;
      const brandLower = (item.brand || '').toLowerCase().trim();
      if (brandImages[brandLower]) {
        imageUrls = [brandImages[brandLower]];
      }

      const createdProduct = await prisma.product.create({
        data: {
          name: item.name,
          slug: slug,
          brand: item.brand,
          description: item.description,
          categoryId: categoryId,
          defaultImageUrls: imageUrls,
          startingPrice: item.price,
        }
      });

      const specs = item.specs || {};
      const sku = `VW-SCR-${i}-${(item.brand || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`;

      await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          sku: sku,
          color: specs['Frame Color'] || specs['Color'] || 'Standard',
          size: specs['Lens Width'] || specs['Size'] || 'Medium',
          lensType: specs['Lens Feature'] || specs['Lens Type'] || 'UV Protection',
          material: specs['Frame Material'] || specs['Material'] || 'Acetate/Metal',
          price: item.price,
          stock: 50,
          imageUrls: imageUrls,
        }
      });

      let collectionId = premium.id;
      if (item.collection === 'Best Sellers') {
        collectionId = bestSellers.id;
      } else if (item.collection === 'New Arrivals') {
        collectionId = newArrivals.id;
      }

      await prisma.productCollection.create({
        data: {
          productId: createdProduct.id,
          collectionId: collectionId
        }
      });
    }
  } else {
    console.warn(`Scraped products file not found at ${scrapedFilePath}. Skipping...`);
  }

  console.log('Database catalog seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
