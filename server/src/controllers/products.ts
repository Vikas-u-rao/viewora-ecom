import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';

const R2_CDN = process.env.R2_CDN_URL || 'https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev';

/**
 * Rewrites a relative /uploads/products/... or localhost URL to the R2 CDN absolute URL.
 * If it's already an absolute https URL (non-localhost), returns as-is.
 */
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('https://') && !url.includes('localhost')) return url;
  const match = url.match(/\/uploads\/products\/([^?#]+)/);
  if (match) return `${R2_CDN}/uploads/products/${match[1]}`;
  return url;
}

/** Resolves all image URLs in a product object returned from Prisma */
function resolveProductImages(product: any): any {
  return {
    ...product,
    defaultImageUrls: Array.isArray(product.defaultImageUrls)
      ? product.defaultImageUrls.map((u: string) => resolveUrl(u) || u)
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((v: any) => ({
          ...v,
          imageUrls: Array.isArray(v.imageUrls)
            ? v.imageUrls.map((u: string) => resolveUrl(u) || u)
            : [],
        }))
      : [],
  };
}

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, collection, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma query filters
    const whereClause: any = {
      isActive: true,
      deletedAt: null,
    };

    // Category Filter by slug
    if (category) {
      whereClause.category = {
        slug: category as string,
      };
    }

    // Collection Filter by slug, category, or smart fallback
    if (collection) {
      const colSlug = (collection as string).toLowerCase().trim();
      
      if (colSlug === "sunglasses") {
        whereClause.OR = [
          { category: { slug: "sunglasses" } },
          { name: { contains: "sunglass", mode: "insensitive" } },
          { description: { contains: "sunglass", mode: "insensitive" } },
          { collections: { some: { collection: { slug: colSlug } } } }
        ];
      } else if (colSlug === "optical-frames" || colSlug === "optical") {
        whereClause.OR = [
          { category: { slug: { not: "sunglasses" } } },
          { name: { contains: "frame", mode: "insensitive" } },
          { name: { contains: "glasses", mode: "insensitive" } },
          { collections: { some: { collection: { slug: colSlug } } } }
        ];
      } else if (colSlug === "limited-edition") {
        whereClause.OR = [
          { name: { contains: "gold", mode: "insensitive" } },
          { name: { contains: "edition", mode: "insensitive" } },
          { name: { contains: "luxury", mode: "insensitive" } },
          { collections: { some: { collection: { slug: colSlug } } } }
        ];
      } else {
        whereClause.collections = {
          some: {
            collection: {
              slug: colSlug,
            },
          },
        };
      }
    }

    // Search Query Filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    res.status(200).json({
      products: products.map(resolveProductImages),
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
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
