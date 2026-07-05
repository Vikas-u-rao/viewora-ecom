import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database catalog...');

  // 1. Clear Existing Data
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
