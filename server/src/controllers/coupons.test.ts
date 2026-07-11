import { validateCoupon, getMyCoupons } from './coupons';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';

jest.mock('../lib/prisma', () => ({
  prisma: {
    coupon: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    referral: {
      findMany: jest.fn(),
    },
  },
}));

describe('validateCoupon', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('throws validation error if coupon code is missing', async () => {
    await validateCoupon(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect(mockNext.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
  });

  it('throws not found error if coupon does not exist', async () => {
    mockReq.body.code = 'VW-INVALID';
    (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(null);

    await validateCoupon(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect(mockNext.mock.calls[0][0].code).toBe('NOT_FOUND');
  });

  it('throws validation error if coupon is inactive', async () => {
    mockReq.body.code = 'VW-CPN-INACTIVE';
    (prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'VW-CPN-INACTIVE',
      status: 'used',
      expiresAt: new Date(Date.now() + 100000),
    });

    await validateCoupon(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect(mockNext.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
  });

  it('throws validation error if coupon is expired', async () => {
    mockReq.body.code = 'VW-CPN-EXPIRED';
    (prisma.coupon.findUnique as jest.Mock).mockResolvedValue({
      code: 'VW-CPN-EXPIRED',
      status: 'active',
      expiresAt: new Date(Date.now() - 10000),
    });

    await validateCoupon(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    expect(mockNext.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
  });

  it('returns coupon details if valid', async () => {
    mockReq.body.code = 'VW-CPN-VALID';
    const expiresAt = new Date(Date.now() + 100000);
    const mockCoupon = {
      id: 'coupon-id',
      code: 'VW-CPN-VALID',
      value: 500,
      status: 'active',
      expiresAt,
    };
    (prisma.coupon.findUnique as jest.Mock).mockResolvedValue(mockCoupon);

    await validateCoupon(mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith({
      valid: true,
      coupon: {
        id: 'coupon-id',
        code: 'VW-CPN-VALID',
        value: 500,
        expiresAt,
      },
    });
  });
});
