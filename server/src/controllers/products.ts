import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';

const R2_CDN = process.env.R2_CDN_URL || 'https://cdn.viewora.in';

/**
 * Rewrites a relative /uploads/products/... or localhost URL to the R2 CDN absolute URL.
 * If it's already an absolute https URL (non-localhost), returns as-is (rewriting old R2 dev domain to cdn.viewora.in).
 */
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('https://') && !url.includes('localhost')) {
    if (url.includes('pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev')) {
      return url.replace('pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev', 'cdn.viewora.in');
    }
    return url;
  }
  const match = url.match(/\/uploads\/products\/([^?#]+)/);
  if (match) return `${R2_CDN}/uploads/products/${match[1]}`;
  return url;
}

/** Deduplicates image URLs by filtering out duplicate images generated during bulk asset import */
function dedupeProductImages(urls: (string | null | undefined)[]): string[] {
  if (!Array.isArray(urls)) return [];
  const result: string[] = [];
  for (const rawUrl of urls) {
    if (!rawUrl) continue;
    const resolved = resolveUrl(rawUrl) || rawUrl;
    if (result.includes(resolved)) continue;

    const isDuplicateSuffix = result.some((existing) => {
      const existingBase = existing.replace(/\.(jpg|jpeg|png|webp)/i, '');
      const currentBase = resolved.replace(/\.(jpg|jpeg|png|webp)/i, '');
      return currentBase === `${existingBase}_1` || existingBase === `${currentBase}_1`;
    });

    if (!isDuplicateSuffix) {
      result.push(resolved);
    }
  }
  return result;
}

/** Resolves all image URLs in a product object returned from Prisma */
function resolveProductImages(product: any): any {
  return {
    ...product,
    defaultImageUrls: Array.isArray(product.defaultImageUrls)
      ? dedupeProductImages(product.defaultImageUrls)
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((v: any) => ({
          ...v,
          imageUrls: Array.isArray(v.imageUrls)
            ? dedupeProductImages(v.imageUrls)
            : [],
        }))
      : [],
  };
}

/** Builds an alternation regex like ^(36|37|38) for size bucket prefixes */
function sizeBucketRegex(lo: number, hi: number): string {
  const nums: string[] = [];
  for (let n = lo; n <= hi; n++) nums.push(String(n));
  return `^(${nums.join('|')})`;
}

/** Maps a filter color slug to the tokens present in variant size strings */
const COLOR_TOKENS: Record<string, string[]> = {
  black: ['black', 'ink'],
  gold: ['gold'],
  silver: ['silver'],
  tortoise: ['havana', 'tortoise'],
  transparent: ['transparent', 'crystal'],
  'rose-gold': ['rose gold'],
  blue: ['blue'],
  brown: ['brown', 'havana'],
  green: ['green'],
  grey: ['grey', 'gray'],
  red: ['red'],
  pink: ['pink'],
  yellow: ['yellow'],
  violet: ['violet'],
  burgundy: ['burgundy', 'bordeaux'],
  nude: ['nude'],
};

/** Frame size buckets (mm range parsed from variant size strings like "55 / Satin Black") */
const SIZE_BUCKETS: Record<string, [number, number]> = {
  small: [36, 47],
  medium: [48, 52],
  large: [53, 57],
  wide: [58, 70],
};

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      category,
      collection,
      brand,
      search,
      type,
      shape,
      price,
      size,
      color,
      sort,
      page = '1',
      limit = '24',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 24));
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const whereClause: any = {
      isActive: true,
      deletedAt: null,
      AND: [],
    };

    // Brand Filter (token-based so hyphenated brands like Ray-Ban Meta match)
    if (brand && brand !== 'all') {
      const brandTokens = (brand as string).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      whereClause.AND.push({
        AND: brandTokens.map((tok) => ({
          OR: [
            { brand: { contains: tok, mode: 'insensitive' } },
            { name: { contains: tok, mode: 'insensitive' } },
          ],
        })),
      });
    }

    // Category Filter by slug
    if (category) {
      whereClause.category = {
        slug: category as string,
      };
    }

    // Collection Filter by slug, category, or smart fallback
    if (collection) {
      const colSlug = (collection as string).toLowerCase().trim();

      if (colSlug === 'new-arrivals' || colSlug === 'all') {
        // New arrivals = the newest products; no extra filtering (default ordering is newest first)
      } else if (colSlug === "sunglasses") {
        whereClause.AND.push({
          OR: [
            { category: { slug: "sunglasses" } },
            { name: { contains: "sunglass", mode: "insensitive" } },
            { description: { contains: "sunglass", mode: "insensitive" } },
            { collections: { some: { collection: { slug: colSlug } } } }
          ],
        });
      } else if (colSlug === "optical-frames" || colSlug === "optical") {
        whereClause.AND.push({
          AND: [
            {
              OR: [
                { category: { slug: { in: ["optical-frames", "optical", "eyeglasses", "frames"] } } },
                { name: { contains: "frame", mode: "insensitive" } },
                { name: { contains: "eyeglass", mode: "insensitive" } },
                { collections: { some: { collection: { slug: colSlug } } } }
              ],
            },
            {
              NOT: [
                { category: { slug: "sunglasses" } },
                { name: { contains: "sunglass", mode: "insensitive" } },
                { description: { contains: "sunglass", mode: "insensitive" } },
              ],
            },
          ],
        });
      } else if (colSlug === "limited-edition") {
        whereClause.AND.push({
          OR: [
            { collections: { some: { collection: { slug: colSlug } } } },
            { name: { contains: "gold", mode: "insensitive" } },
            { name: { contains: "edition", mode: "insensitive" } },
            { name: { contains: "luxury", mode: "insensitive" } },
            { name: { contains: "aviator", mode: "insensitive" } },
            { name: { contains: "titanium", mode: "insensitive" } },
            { startingPrice: { gte: 3000 } },
          ],
        });
      } else {
        whereClause.AND.push({
          collections: { some: { collection: { slug: colSlug } } },
        });
      }
    }

    // Type Filter (header menu / "filter" param): categories + smart keyword fallbacks
    if (type && type !== 'all') {
      const t = (type as string).toLowerCase().replace(/_/g, '-');
      if (t === 'sunglasses') {
        whereClause.AND.push({
          OR: [
            { category: { slug: 'sunglasses' } },
            { name: { contains: 'sunglass', mode: 'insensitive' } },
          ],
        });
      } else if (t === 'optical-frames') {
        whereClause.AND.push({
          AND: [
            {
              OR: [
                { category: { slug: 'optical-frames' } },
                { name: { contains: 'frame', mode: 'insensitive' } },
                { name: { contains: 'eyeglass', mode: 'insensitive' } },
              ],
            },
            {
              NOT: [
                { category: { slug: 'sunglasses' } },
                { name: { contains: 'sunglass', mode: 'insensitive' } },
              ],
            },
          ],
        });
      } else if (t === 'reading-glasses') {
        whereClause.AND.push({
          OR: [
            { name: { contains: 'reading', mode: 'insensitive' } },
            { description: { contains: 'reading glasses', mode: 'insensitive' } },
          ],
        });
      } else if (t === 'blue-light-glasses') {
        whereClause.AND.push({
          OR: [
            { name: { contains: 'blue light', mode: 'insensitive' } },
            { description: { contains: 'blue light', mode: 'insensitive' } },
          ],
        });
      } else if (t === 'smart-glasses') {
        whereClause.AND.push({
          OR: [
            { category: { slug: 'smart-glasses' } },
            { name: { contains: 'meta', mode: 'insensitive' } },
            { name: { contains: 'smart', mode: 'insensitive' } },
          ],
        });
      } else if (t === 'ray-ban-meta') {
        whereClause.AND.push({
          OR: [
            { brand: { contains: 'ray-ban meta', mode: 'insensitive' } },
            { name: { contains: 'rayban meta', mode: 'insensitive' } },
            { name: { contains: 'ray-ban meta', mode: 'insensitive' } },
          ],
        });
      } else if (t === 'oakley-meta') {
        whereClause.AND.push({
          OR: [
            { brand: { contains: 'oakley meta', mode: 'insensitive' } },
            { name: { contains: 'oakley meta', mode: 'insensitive' } },
          ],
        });
      } else {
        // Keyword fallback (covers shapes, features, and any other filter slug)
        const keyword = t.replace(/-/g, ' ');
        whereClause.AND.push({
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
          ],
        });
      }
    }

    // Shape Filter (shop sidebar / "shape" param)
    if (shape && shape !== 'all') {
      const s = (shape as string).toLowerCase().replace(/_/g, '-');
      const keyword = s === 'cat-eye' ? 'cat eye' : s.replace(/-/g, ' ');
      whereClause.AND.push({
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }

    // Price Filter (min variant price in range)
    if (price && price !== 'all') {
      const ranges: Record<string, { gte?: number; lt?: number; gt?: number; lte?: number }> = {
        'under-2000': { lt: 2000 },
        '2000-5000': { gte: 2000, lte: 5000 },
        '5000-10000': { gte: 5000, lte: 10000 },
        'above-10000': { gt: 10000 },
      };
      const range = ranges[price as string];
      if (range) {
        whereClause.AND.push({ variants: { some: { isActive: true, price: range } } });
      }
    }

    // Frame Size Filter (mm buckets parsed from variant size strings)
    if (size && size !== 'all') {
      const bucket = SIZE_BUCKETS[size as string];
      if (bucket) {
        const [lo, hi] = bucket;
        const rows: { product_id: string }[] = await prisma.$queryRaw`
          SELECT DISTINCT product_id
          FROM product_variants
          WHERE is_active = true
            AND size ~ ${sizeBucketRegex(lo, hi)}
        `;
        whereClause.AND.push({ id: { in: rows.map((r) => r.product_id) } });
      }
    }

    // Frame Color Filter (color tokens present in variant size strings)
    if (color && color !== 'all') {
      const tokens = COLOR_TOKENS[color as string] || [(color as string).replace(/-/g, ' ')];
      whereClause.AND.push({
        OR: [
          ...tokens.map((tok) => ({
            variants: { some: { isActive: true, size: { contains: tok, mode: 'insensitive' } } },
          })),
          { name: { contains: (color as string).replace(/-/g, ' '), mode: 'insensitive' } },
        ],
      });
    }

    // Search Query Filter
    if (search) {
      const searchStr = (search as string).trim();
      if (searchStr) {
        whereClause.AND.push({
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { brand: { contains: searchStr, mode: 'insensitive' } },
            { description: { contains: searchStr, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (whereClause.AND.length === 0) {
      delete whereClause.AND;
    }

    // Sorting (id tiebreaker keeps pagination stable for bulk-imported catalogs with identical timestamps)
    let orderBy: any = [{ createdAt: 'desc' }, { id: 'asc' }];
    if (sort === 'price-asc') orderBy = [{ startingPrice: 'asc' }, { id: 'asc' }];
    else if (sort === 'price-desc') orderBy = [{ startingPrice: 'desc' }, { id: 'asc' }];
    else if (sort === 'name-asc') orderBy = [{ name: 'asc' }, { id: 'asc' }];
    else if (sort === 'name-desc') orderBy = [{ name: 'desc' }, { id: 'asc' }];

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          defaultImageUrls: true,
          startingPrice: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              sku: true,
              color: true,
              size: true,
              lensType: true,
              material: true,
              price: true,
              stock: true,
              imageUrls: true,
              isActive: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Distinct brands for the current filtered set (drives the sidebar brand list)
    const brandRows = await prisma.product.findMany({
      where: whereClause,
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    });
    const brands = brandRows
      .map((b) => b.brand)
      .filter((b): b is string => Boolean(b));

    res.status(200).json({
      products: products.map(resolveProductImages),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      brands,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true, deletedAt: null },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
    }

    res.status(200).json(resolveProductImages(product));
  } catch (error) {
    next(error);
  }
}

export async function updateVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { sku, color, size, lensType, material, price, stock, imageUrls, isActive } = req.body;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new AppError('NOT_FOUND', 404, 'Variant not found');
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        sku,
        color,
        size,
        lensType,
        material,
        price,
        stock,
        imageUrls,
        isActive,
      },
    });

    res.status(200).json(updatedVariant);
  } catch (error) {
    next(error);
  }
}

export async function updateVariantStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new AppError('NOT_FOUND', 404, 'Variant not found');
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: { stock },
    });

    const lowStock = stock <= 5;

    res.status(200).json({
      variant: updatedVariant,
      lowStock,
      status: stock === 0 ? 'out_of_stock' : lowStock ? 'low_stock' : 'in_stock',
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new AppError('NOT_FOUND', 404, 'Variant not found');
    }

    // Soft delete variant by setting isActive = false
    const deletedVariant = await prisma.productVariant.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({ message: 'Variant deleted successfully', variant: deletedVariant });
  } catch (error) {
    next(error);
  }
}
