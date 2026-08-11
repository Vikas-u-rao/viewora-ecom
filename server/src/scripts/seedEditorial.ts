import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const editorialData = [
  {
    title: 'The Classics',
    slug: 'the-classics',
    description: 'Timeless eyewear styles that remain relevant across seasons.',
    editorialIntro: 'A curation of iconic silhouettes and enduring designs that transcend temporary trends. From legendary teardrop aviators to classic wayfarers, these frames define timeless elegance and effortless poise.',
    heroImage: 'https://cdn.viewora.in/uploads/products/Rayban_New_Wayfarer_Sunglass_RB_2132_622_-_01_53118dba-7f75-4d89-8aae-0c411841736e.webp',
    displayOrder: 1,
    brands: ['Ray-Ban', 'Persol', 'Oakley'],
  },
  {
    title: 'Quiet Luxury',
    slug: 'quiet-luxury',
    description: 'Understated, refined frames with premium materials, subtle branding and sophisticated silhouettes.',
    editorialIntro: 'Understated excellence for the discerning connoisseur. Featuring subtle branding, hand-finished premium acetate, and whisper-quiet luxury from houses such as Persol, Tom Ford, and Prada.',
    heroImage: 'https://cdn.viewora.in/uploads/products/Fred_Frame_FG50002F_030_image_2_93834f8e-b854-475a-93e8-f1e5fed28c9b.jpg',
    displayOrder: 2,
    brands: ['Persol', 'Tom Ford', 'Prada', 'Gucci'],
  },
  {
    title: 'Statement Frames',
    slug: 'statement-frames',
    description: 'Bold, oversized and fashion-forward eyewear.',
    editorialIntro: 'Unapologetically bold and structurally expressive. Sculpted geometric fronts, dramatic shield masks, and architectural proportions designed for those who command the room.',
    heroImage: 'https://cdn.viewora.in/uploads/products/Kuboraum_Maske_Sunglass_P60_LG_HB-_01_13631edd-2b2a-4da4-ad17-9127bf490af4.webp',
    displayOrder: 3,
    brands: ['Versace', 'Gucci', 'Prada', 'Carrera'],
  },
  {
    title: 'The Executive Edit',
    slug: 'executive-edit',
    description: 'Refined eyewear suitable for professional, formal and business settings.',
    editorialIntro: 'Precision engineering tailored for boardroom authority and modern executive style. Clean lines, titanium accents, and polished optical clarity for the distinguished professional.',
    heroImage: 'https://cdn.viewora.in/uploads/products/Rayban_Clubmaster_Sunglass_RB_3016_1367_B1_-_01_00ce460e-dc20-4673-bcbe-c053c12aee03.webp',
    displayOrder: 4,
    brands: ['Tom Ford', 'Persol', 'Emporio Armani', 'Burberry'],
  },
  {
    title: 'Weekend / Everyday',
    slug: 'weekend',
    description: 'Versatile frames designed for casual everyday wear.',
    editorialIntro: 'Effortless versatility meets relaxed sophistication. Lightweight, durable frames designed for weekend leisure, casual cafe outings, and everyday comfort.',
    heroImage: 'https://cdn.viewora.in/uploads/products/RayBan_Round_Metal_Sunglass_RB_3447_004_71_-_01_85bd47f4-7dd1-414d-b4f9-d0a063a45698.webp',
    displayOrder: 5,
    brands: ['Ray-Ban', 'Vogue', 'Oakley', 'Police'],
  },
  {
    title: 'Travel Edit',
    slug: 'travel',
    description: 'Sunglasses and eyewear suitable for travel, driving and outdoor use.',
    editorialIntro: 'Sun-ready companions built for horizon chasers and global travelers. Featuring polarized UV defense, anti-glare coatings, and lightweight durability for life on the move.',
    heroImage: 'https://cdn.viewora.in/uploads/products/Chimi_Sunglass_Aviator_Brown_01_f540f194-3148-45ad-8b4f-d28f5362ee73.jpg',
    displayOrder: 6,
    brands: ['Carrera', 'Ray-Ban', 'Oakley', 'Police'],
  },
];

async function seed() {
  console.log('Seeding Editorial Collections...');
  
  const allProducts = await prisma.product.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, brand: true, name: true, defaultImageUrls: true },
  });

  console.log(`Found ${allProducts.length} active products in DB.`);

  for (const data of editorialData) {
    const { brands, ...colData } = data;
    
    // Find matching products by brand or sample
    let matched = allProducts.filter((p) => p.brand && brands.some((b) => p.brand!.toLowerCase().includes(b.toLowerCase())));
    if (matched.length < 4) {
      matched = allProducts.slice(0, 8);
    }

    const firstProductImg = matched[0]?.defaultImageUrls?.[0] as string | undefined;
    const heroImage = firstProductImg || colData.heroImage;

    // Upsert collection
    const collection = await prisma.editorialCollection.upsert({
      where: { slug: colData.slug },
      update: {
        title: colData.title,
        description: colData.description,
        editorialIntro: colData.editorialIntro,
        heroImage,
        displayOrder: colData.displayOrder,
        status: 'published',
      },
      create: {
        title: colData.title,
        slug: colData.slug,
        description: colData.description,
        editorialIntro: colData.editorialIntro,
        heroImage,
        displayOrder: colData.displayOrder,
        status: 'published',
      },
    });

    // Clear existing mapping & recreate
    await prisma.editorialCollectionProduct.deleteMany({
      where: { collectionId: collection.id },
    });

    if (matched.length > 0) {
      await prisma.editorialCollectionProduct.createMany({
        data: matched.map((p, idx) => ({
          collectionId: collection.id,
          productId: p.id,
          displayOrder: idx,
        })),
        skipDuplicates: true,
      });
    }

    console.log(`✓ Seeded ${collection.title} (${matched.length} products assigned)`);
  }

  console.log('Editorial Collections Seeding complete.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
