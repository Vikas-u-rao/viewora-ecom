import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';

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

    // Collection Filter by slug
    if (collection) {
      whereClause.collections = {
        some: {
          collection: {
            slug: collection as string,
          },
        },
      };
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
      products,
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

    res.status(200).json(product);
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
