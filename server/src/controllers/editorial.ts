import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Public: Get all active editorial collections
export async function getEditorialCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await prisma.editorialCollection.findMany({
      where: { status: 'published' },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const result = collections.map((col) => ({
      id: col.id,
      title: col.title,
      slug: col.slug,
      description: col.description,
      editorialIntro: col.editorialIntro,
      heroImage: col.heroImage,
      displayOrder: col.displayOrder,
      productCount: col._count.products,
    }));

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Public: Get a single editorial collection by slug with products
export async function getEditorialCollectionBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const collection = await prisma.editorialCollection.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        status: 'published',
      },
      include: {
        products: {
          orderBy: { displayOrder: 'asc' },
          include: {
            product: {
              include: {
                variants: {
                  where: { isActive: true },
                  orderBy: { price: 'asc' },
                },
                category: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Editorial collection not found' });
    }

    const products = collection.products
      .map((item) => item.product)
      .filter((p) => p.isActive && !p.deletedAt)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        description: p.description,
        defaultImageUrls: Array.isArray(p.defaultImageUrls) ? p.defaultImageUrls : [],
        startingPrice: p.startingPrice != null ? String(p.startingPrice) : '0',
        variants: Array.isArray(p.variants)
          ? p.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              color: v.color,
              size: v.size,
              lensType: v.lensType,
              material: v.material,
              price: String(v.price),
              stock: v.stock,
              imageUrls: Array.isArray(v.imageUrls) ? v.imageUrls : [],
              isActive: v.isActive,
            }))
          : [],
      }));

    res.status(200).json({
      id: collection.id,
      title: collection.title,
      slug: collection.slug,
      description: collection.description,
      editorialIntro: collection.editorialIntro,
      heroImage: collection.heroImage,
      products,
    });
  } catch (error) {
    next(error);
  }
}

// Admin: Get all collections (including draft/unpublished)
export async function adminGetEditorialCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await prisma.editorialCollection.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, brand: true, startingPrice: true },
            },
          },
        },
      },
    });
    res.status(200).json(collections);
  } catch (error) {
    next(error);
  }
}

// Admin: Create an editorial collection
export async function adminCreateEditorialCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, slug, description, editorialIntro, heroImage, status, displayOrder, productIds } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: 'Title and slug are required' });
    }

    const collection = await prisma.editorialCollection.create({
      data: {
        title,
        slug: slug.toLowerCase().trim(),
        description: description || null,
        editorialIntro: editorialIntro || null,
        heroImage: heroImage || null,
        status: status || 'published',
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        products: Array.isArray(productIds) && productIds.length > 0
          ? {
              create: productIds.map((pid: string, idx: number) => ({
                productId: pid,
                displayOrder: idx,
              })),
            }
          : undefined,
      },
      include: {
        products: true,
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
}

// Admin: Update an editorial collection
export async function adminUpdateEditorialCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { title, slug, description, editorialIntro, heroImage, status, displayOrder, productIds } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug.toLowerCase().trim();
    if (description !== undefined) data.description = description;
    if (editorialIntro !== undefined) data.editorialIntro = editorialIntro;
    if (heroImage !== undefined) data.heroImage = heroImage;
    if (status !== undefined) data.status = status;
    if (displayOrder !== undefined) data.displayOrder = Number(displayOrder);

    if (Array.isArray(productIds)) {
      // Re-assign products
      await prisma.editorialCollectionProduct.deleteMany({ where: { collectionId: id } });
      if (productIds.length > 0) {
        await prisma.editorialCollectionProduct.createMany({
          data: productIds.map((pid: string, idx: number) => ({
            collectionId: id,
            productId: pid,
            displayOrder: idx,
          })),
        });
      }
    }

    const collection = await prisma.editorialCollection.update({
      where: { id },
      data,
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, brand: true },
            },
          },
        },
      },
    });

    res.status(200).json(collection);
  } catch (error) {
    next(error);
  }
}

// Admin: Delete an editorial collection
export async function adminDeleteEditorialCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await prisma.editorialCollection.delete({ where: { id } });
    res.status(200).json({ message: 'Editorial collection deleted successfully' });
  } catch (error) {
    next(error);
  }
}
