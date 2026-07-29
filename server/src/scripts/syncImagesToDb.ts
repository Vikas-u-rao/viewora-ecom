import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const R2_CDN_URL = process.env.R2_CDN_URL || "https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev";

export async function syncImagesToDb() {
  console.log("Starting DB image URL synchronization...");

  const imagesDir = path.resolve(__dirname, "../../../images");
  if (!fs.existsSync(imagesDir)) {
    console.warn("Images folder not found (skipping local dir sync):", imagesDir);
    return;
  }

  const files = fs.readdirSync(imagesDir);
  console.log(`Found ${files.length} local image files.`);

  // Build a map of slug/sku -> list of R2 image URLs
  // Filename format examples:
  // - 8056597721325_rayban-4416-sunglass.jpg
  // - 8056597721325_rayban-4416-sunglass_1.jpg
  // - FRBOS109280PFAKJ_boss-frame-1092-807.jpg
  // - FRBOS109280PFAKJ_boss-frame-1092-807_1.jpg

  const imageMap = new Map<string, string[]>();

  for (const file of files) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;

    // Extract the slug or SKU part
    // e.g. 8056597721325_rayban-4416-sunglass_1.jpg -> rayban-4416-sunglass
    // e.g. FRBOS109280PFAKJ_boss-frame-1092-807_1.jpg -> boss-frame-1092-807
    const r2Url = `${R2_CDN_URL}/uploads/products/${file}`;

    // Extract clean slug without suffix _1, _2
    const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
    const cleanName = nameWithoutExt.replace(/^[A-Z0-9;,_-]+?_/, ""); // remove SKU prefix
    const baseSlug = cleanName.replace(/_\d+$/, ""); // remove _1, _2 suffix

    if (!imageMap.has(baseSlug)) {
      imageMap.set(baseSlug, []);
    }
    imageMap.get(baseSlug)!.push(r2Url);

    // Also map by full cleanName if different
    if (cleanName !== baseSlug) {
      if (!imageMap.has(cleanName)) imageMap.set(cleanName, []);
      imageMap.get(cleanName)!.push(r2Url);
    }
  }

  console.log(`Mapped ${imageMap.size} distinct product slugs.`);

  // Get all products from DB
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  console.log(`Found ${products.length} products in DB.`);

  let updatedCount = 0;

  for (const product of products) {
    const slugKey = product.slug;

    // Find matching images
    let matchedImages = imageMap.get(slugKey);

    // Try fallback fuzzy match on slug keywords if exact match fails
    if (!matchedImages || matchedImages.length === 0) {
      for (const [key, urls] of imageMap.entries()) {
        if (slugKey.includes(key) || key.includes(slugKey)) {
          matchedImages = urls;
          break;
        }
      }
    }

    if (matchedImages && matchedImages.length > 0) {
      // Deduplicate
      const uniqueUrls = Array.from(new Set(matchedImages));

      await prisma.product.update({
        where: { id: product.id },
        data: {
          defaultImageUrls: uniqueUrls,
        },
      });

      // Update variants
      for (const variant of product.variants) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            imageUrls: uniqueUrls,
          },
        });
      }

      updatedCount++;
      if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount} products with real R2 images.`);
    }
  }

  console.log(`\n🎉 Success! Updated ${updatedCount} of ${products.length} products with real Cloudflare R2 image URLs.`);
}

if (require.main === module) {
  syncImagesToDb()
    .catch((err: any) => {
      console.error("Sync failed:", err);
    })
    .finally(() => prisma.$disconnect());
}
