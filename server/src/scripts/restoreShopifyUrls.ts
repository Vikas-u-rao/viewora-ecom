import { prisma } from '../lib/prisma';

async function restoreShopifyUrls() {
  console.log('=== RESTORING VALID SHOPIFY CDN IMAGE URLS IN DATABASE ===');

  await prisma.$executeRawUnsafe(`
    UPDATE "products"
    SET "default_image_urls" = ARRAY(
      SELECT REPLACE(url, 'https://cdn.viewora.in/uploads/products/', 'https://cdn.shopify.com/s/files/1/0694/2051/5411/files/')
      FROM unnest("default_image_urls") AS url
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest("default_image_urls") AS u WHERE u LIKE '%viewora.in%'
    );
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "product_variants"
    SET "image_urls" = ARRAY(
      SELECT REPLACE(url, 'https://cdn.viewora.in/uploads/products/', 'https://cdn.shopify.com/s/files/1/0694/2051/5411/files/')
      FROM unnest("image_urls") AS url
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest("image_urls") AS u WHERE u LIKE '%viewora.in%'
    );
  `);

  console.log('✅ DATABASE IMAGE URLS RESTORED TO SHOPIFY CDN!');

  const sample = await prisma.product.findFirst({
    where: { isActive: true },
    select: { name: true, defaultImageUrls: true },
  });

  console.log('Sample Product after restoration:', JSON.stringify(sample, null, 2));
  process.exit(0);
}

restoreShopifyUrls();
