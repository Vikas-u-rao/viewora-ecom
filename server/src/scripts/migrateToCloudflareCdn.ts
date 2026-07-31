import { prisma } from '../lib/prisma';

async function migrateToCloudflareCdn() {
  console.log('=== MIGRATING ALL PRODUCT IMAGES TO CLOUDFLARE CDN (cdn.viewora.in) ===');

  await prisma.$executeRawUnsafe(`
    UPDATE "products"
    SET "default_image_urls" = ARRAY(
      SELECT REPLACE(url, 'https://cdn.shopify.com/s/files/1/0694/2051/5411/files/', 'https://cdn.viewora.in/uploads/products/')
      FROM unnest("default_image_urls") AS url
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest("default_image_urls") AS u WHERE u LIKE '%shopify%'
    );
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "product_variants"
    SET "image_urls" = ARRAY(
      SELECT REPLACE(url, 'https://cdn.shopify.com/s/files/1/0694/2051/5411/files/', 'https://cdn.viewora.in/uploads/products/')
      FROM unnest("image_urls") AS url
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest("image_urls") AS u WHERE u LIKE '%shopify%'
    );
  `);

  console.log('✅ DATABASE IMAGE URLS MIGRATED TO CLOUDFLARE CDN!');

  const sample = await prisma.product.findFirst({
    where: { isActive: true },
    select: { name: true, defaultImageUrls: true },
  });

  console.log('Sample Product after migration:', JSON.stringify(sample, null, 2));
  process.exit(0);
}

migrateToCloudflareCdn();
