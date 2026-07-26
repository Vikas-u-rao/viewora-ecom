import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed from scraped catalog...');

  // 1. Seed Default Admin and Customer Users
  const passwordHashAdmin = await bcrypt.hash('Admin123Password!', 10);
  const passwordHashUser = await bcrypt.hash('User123Password!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@viewora.in' },
    update: { role: 'admin', passwordHash: passwordHashAdmin },
    create: {
      email: 'admin@viewora.in',
      passwordHash: passwordHashAdmin,
      name: 'Admin User',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@viewora.in' },
    update: { role: 'customer', passwordHash: passwordHashUser },
    create: {
      email: 'user@viewora.in',
      passwordHash: passwordHashUser,
      name: 'Customer User',
      role: 'customer',
    },
  });

  // 2. Clear Existing Data
  console.log('Clearing old catalog & transaction tables...');
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.collection.deleteMany();

  // 3. Create Categories
  const catSunglasses = await prisma.category.create({
    data: { name: 'Sunglasses', slug: 'sunglasses' },
  });
  const catOptical = await prisma.category.create({
    data: { name: 'Optical Frames', slug: 'optical-frames' },
  });
  const catSmart = await prisma.category.create({
    data: { name: 'Smart Eyewear', slug: 'smart-glasses' },
  });
  const catReading = await prisma.category.create({
    data: { name: 'Reading Glasses', slug: 'reading-glasses' },
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

  // 4. Create Collections
  const colBestSellers = await prisma.collection.create({
    data: { name: 'Best Sellers', slug: 'best-sellers', description: 'Our most popular luxury frames.' },
  });
  const colNewArrivals = await prisma.collection.create({
    data: { name: 'New Arrivals', slug: 'new-arrivals', description: 'Fresh seasonal drops and luxury silhouettes.' },
  });
  const colLimited = await prisma.collection.create({
    data: { name: 'Limited Edition', slug: 'limited-edition', description: 'Rare small-batch designer frames.' },
  });

  // 5. Read Scraped Products JSON
  const jsonPath = path.join(__dirname, 'cleaned_products.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Error: cleaned_products.json not found!');
    return;
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const productsList = JSON.parse(rawData);
  console.log(`Inserting ${productsList.length} scraped products into PostgreSQL...`);

  let count = 0;
  for (const item of productsList) {
    const catId = categoryMap[item.productType] || catSunglasses.id;

    // Create Product
    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        brand: item.brand,
        description: `Official luxury ${item.name} by ${item.brand}. Crafted with precision optics and premium materials.`,
        categoryId: catId,
        defaultImageUrls: item.imageUrls,
        startingPrice: item.price,
      },
    });

    // Parse Variant Color / Size
    let color = 'Standard';
    let size = 'Medium';
    if (item.variantTitle && item.variantTitle.includes('/')) {
      const parts = item.variantTitle.split('/');
      size = parts[0].trim();
      color = parts[1].trim();
    } else if (item.variantTitle) {
      color = item.variantTitle.trim();
    }

    // Create Product Variant
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: item.sku,
        color: color,
        size: size,
        lensType: item.productType === 'Sunglass' ? 'UV400 Protected' : 'Clear Prescription',
        price: item.price,
        compareAtPrice: item.comparePrice || null,
        inventoryQuantity: 50,
        imageUrls: item.imageUrls,
        isActive: true,
      },
    });

    // Randomly assign to Collections
    if (count % 3 === 0) {
      await prisma.productCollection.create({
        data: { productId: product.id, collectionId: colBestSellers.id },
      });
    }
    if (count % 4 === 0) {
      await prisma.productCollection.create({
        data: { productId: product.id, collectionId: colNewArrivals.id },
      });
    }
    if (count % 10 === 0) {
      await prisma.productCollection.create({
        data: { productId: product.id, collectionId: colLimited.id },
      });
    }

    count++;
    if (count % 250 === 0) {
      console.log(`Seeded ${count} / ${productsList.length} products...`);
    }
  }

  console.log(`✅ Database seed complete! Total ${count} products inserted into PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
