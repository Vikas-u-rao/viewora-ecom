import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { Prisma } from '@prisma/client';

import { merchantId, saltKey, saltIndex, phonepeEnv, baseUrl } from '../lib/phonepe';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


// GET /api/v1/admin/orders
export async function listAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const skip = (page - 1) * limit;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
          payment: true,
          refunds: true,
        },
      }),
      prisma.order.count(),
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/v1/admin/orders/:id/fulfillment-status
export async function updateFulfillmentStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'processing' | 'shipped' | 'delivered' | 'cancelled'

    if (!['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid fulfillment status');
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    // Gated check: fulfillment status cannot advance past unfulfilled unless order is paid
    if (order.paymentStatus !== 'paid' && status !== 'cancelled') {
      throw new AppError(
        'BAD_REQUEST',
        400,
        'Cannot update fulfillment status for unpaid orders. Payment status must be paid.'
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { fulfillmentStatus: status },
    });

    res.json({ order: updatedOrder });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/admin/orders/:id/refund
export async function initiateRefund(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;

    if (!reason) {
      throw new AppError('VALIDATION_ERROR', 400, 'Refund reason is required');
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true, refunds: true },
    });

    if (!order) {
      throw new AppError('NOT_FOUND', 404, 'Order not found');
    }

    if (order.paymentStatus !== 'paid') {
      throw new AppError('BAD_REQUEST', 400, 'Only paid orders can be refunded');
    }

    if (!order.payment) {
      throw new AppError('BAD_REQUEST', 400, 'No payment transaction associated with this order');
    }

    const refundAmount = amount ? new Prisma.Decimal(amount) : order.finalPayableAmount;

    // Check that we aren't refunding more than the total paid
    const totalRefundedAlready = order.refunds
      .filter((r) => r.status === 'completed' || r.status === 'initiated' || r.status === 'processing')
      .reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

    if (totalRefundedAlready.add(refundAmount).gt(order.finalPayableAmount)) {
      throw new AppError('BAD_REQUEST', 400, 'Requested refund amount exceeds the total order value');
    }

    const merchantRefundId = `REFUND-${order.id.slice(0, 8)}-${Date.now()}`;
    const amountInPaise = Math.round(Number(refundAmount) * 100);

    const payload = {
      merchantId,
      merchantTransactionId: merchantRefundId,
      originalMerchantTransactionId: order.payment.merchantTransactionId,
      amount: amountInPaise,
      callbackUrl: '', // Optional S2S callback
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
      .createHash('sha256')
      .update(base64Payload + '/pg/v1/refund' + saltKey)
      .digest('hex') + '###' + saltIndex;

    // Write to DB that we initiated the refund
    const refund = await prisma.refund.create({
      data: {
        orderId: order.id,
        paymentId: order.payment.id,
        phonepeRefundId: null,
        amount: refundAmount,
        reason,
        status: 'initiated',
        initiatedBy: 'admin',
      },
    });

    logger.info({ msg: 'Initiating PhonePe Refund request', refundId: refund.id, merchantRefundId });

    try {
      const response = await axios.post(
        `${baseUrl}/pg/v1/refund`,
        { request: base64Payload },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': signature,
          },
        }
      );

      if (response.data && response.data.success) {
        // Complete the refund in our DB
        const updatedRefund = await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'completed',
            phonepeRefundId: response.data.data?.transactionId || null,
          },
        });

        // Update order status if fully refunded
        if (totalRefundedAlready.add(refundAmount).equals(order.finalPayableAmount)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'refunded' },
          });
        }

        return res.json({ success: true, refund: updatedRefund });
      } else {
        throw new AppError('BAD_GATEWAY', 502, 'PhonePe refund initiation failed', response.data);
      }
    } catch (err: any) {
      logger.error({ msg: 'PhonePe Refund API failed', error: err.message, response: err.response?.data });

      // In sandbox fallback, if request fails due to credential reasons, we will mock complete it
      if (phonepeEnv === 'sandbox') {
        logger.warn({ msg: 'Mocking refund success in sandbox mode due to API failure' });
        const updatedRefund = await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: 'completed',
            phonepeRefundId: `MOCK-REFUND-${Date.now()}`,
          },
        });

        if (totalRefundedAlready.add(refundAmount).equals(order.finalPayableAmount)) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'refunded' },
          });
        }

        return res.json({ success: true, refund: updatedRefund, note: 'Mocked in Sandbox' });
      }

      await prisma.refund.update({
        where: { id: refund.id },
        data: { status: 'failed' },
      });

      throw err;
    }
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/admin/products
export async function listAllProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(5000, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const search = req.query.search ? String(req.query.search).trim() : '';
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          collections: { include: { collection: true } },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/admin/products
// DELETE /api/v1/admin/products/:id
export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError('NOT_FOUND', 404, 'Product not found');
    }

    // Soft delete: set deletedAt and deactivate
    await prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        variants: {
          updateMany: {
            where: { productId: id },
            data: { isActive: false },
          },
        },
      },
    });

    logger.info({ msg: 'Product soft-deleted', productId: id, name: product.name });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      name,
      brand,
      description,
      categoryName,
      categoryId,
      imageUrl,
      imageUrls,
      image1,
      image2,
      image3,
      image4,
      startingPrice,
      sku,
      color,
      size,
      gender,
      shape,
      frameType,
      material,
      price,
      stock,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('VALIDATION_ERROR', 400, 'Product name is required');
    }

    const itemPrice = price !== undefined && price !== null ? Number(price) : (startingPrice !== undefined ? Number(startingPrice) : 0);
    const itemStock = stock !== undefined && stock !== null ? parseInt(String(stock), 10) : 0;
    const itemSku = (sku && String(sku).trim()) || `SKU-${Date.now().toString(36).toUpperCase()}`;

    // Collect all image URLs (up to 4)
    const rawImages: string[] = Array.isArray(imageUrls) ? imageUrls : [image1, image2, image3, image4, imageUrl].filter(Boolean);
    const imageArray = rawImages
      .map((img) => (typeof img === 'string' ? img.trim() : ''))
      .filter((img) => img.length > 0);

    // Find or create category
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      const catName = categoryName && String(categoryName).trim() ? String(categoryName).trim() : 'Eyewear';
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const existingCat = await prisma.category.findFirst({
        where: { OR: [{ name: { equals: catName, mode: 'insensitive' } }, { slug: catSlug }] },
      });

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: catName,
            slug: catSlug || `cat-${Date.now()}`,
          },
        });
        finalCategoryId = newCat.id;
      }
    }

    // Combine description with attributes for search matching
    const attributeDetails = [
      description ? description.trim() : '',
      gender ? `Gender: ${gender}` : '',
      shape ? `Shape: ${shape}` : '',
      frameType ? `Frame Type: ${frameType}` : '',
      material ? `Material: ${material}` : '',
    ].filter(Boolean).join(' | ');

    // Generate unique slug for product
    const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        brand: brand && String(brand).trim() ? String(brand).trim() : null,
        description: attributeDetails || null,
        categoryId: finalCategoryId,
        defaultImageUrls: imageArray,
        startingPrice: new Prisma.Decimal(itemPrice),
        variants: {
          create: {
            sku: itemSku,
            color: color && String(color).trim() ? String(color).trim() : null,
            size: size && String(size).trim() ? String(size).trim() : null,
            material: material && String(material).trim() ? String(material).trim() : null,
            price: new Prisma.Decimal(itemPrice),
            stock: itemStock,
            imageUrls: imageArray,
          },
        },
      },
      include: {
        category: true,
        variants: true,
      },
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/admin/coupons
export async function listAllCoupons(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ coupons });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/admin/coupons
export async function createCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, value, expiresAt, userEmail } = req.body;

    if (!code || !value || !expiresAt) {
      throw new AppError('VALIDATION_ERROR', 400, 'Code, value, and expiresAt are required');
    }

    let userId: string | null = null;
    if (userEmail) {
      const user = await prisma.user.findUnique({
        where: { email: String(userEmail).trim().toLowerCase() },
      });
      if (!user) {
        throw new AppError('NOT_FOUND', 404, 'User not found with this email');
      }
      userId = user.id;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: String(code).trim().toUpperCase(),
        value: new Prisma.Decimal(value),
        expiresAt: new Date(expiresAt),
        userId,
        status: 'active',
      },
    });

    res.status(201).json({ coupon });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/admin/coupons/:id
export async function deleteCoupon(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new AppError('NOT_FOUND', 404, 'Coupon not found');
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: { status: 'expired' },
    });

    res.json({ message: 'Coupon invalidated successfully', coupon: updatedCoupon });
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/admin/upload
export async function uploadProductImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('VALIDATION_ERROR', 400, 'No image file uploaded');
    }

    const file = req.file;
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}_${cleanOriginalName}`;
    const key = `uploads/products/${filename}`;

    const R2_CDN = process.env.R2_CDN_URL || 'https://pub-6bbb8cfdaf924bbbb21aaeeaed84a66e.r2.dev';
    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'e2158ae0625a060589cba0ccebcd3fee';
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '73fede634675f899d6412ddcaf59c06f';
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '680700f9a92259d0188a5450a6a77f2d1e4730780024064320b531f65a8a5ac6';
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'viewora-assets';

    // Write file locally to public/uploads/products
    const uploadDir = path.join(__dirname, '../../public/uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localPath = path.join(uploadDir, filename);
    fs.writeFileSync(localPath, file.buffer);

    // Upload directly to Cloudflare R2 bucket
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'image/jpeg',
      })
    );
    logger.info({ msg: 'Successfully uploaded image to Cloudflare R2', key });

    const cdnUrl = `${R2_CDN}/uploads/products/${filename}`;

    res.json({
      success: true,
      url: cdnUrl,
      filename,
    });
  } catch (error) {
    next(error);
  }
}
