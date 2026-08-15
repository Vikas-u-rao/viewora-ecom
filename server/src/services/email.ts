import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

// Create a mail transporter using environment variables
const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || 'contact@viewora.in';

// Infer secure connection (true for SSL port 465, false for STARTTLS port 587) unless explicitly overridden
const isSecure = process.env.EMAIL_SECURE !== undefined
  ? process.env.EMAIL_SECURE === 'true'
  : port === 465;

export const hasCredentials = !!(host && user && pass);

export let transporter: nodemailer.Transporter | null = null;

/** Strips carriage returns and newlines from input to prevent header injection */
export function sanitizeHeaderValue(val: string): string {
  return String(val || '').replace(/[\r\n]/g, '').trim();
}

if (hasCredentials) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      // Prevent TLS cert validation bypass in production
      rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== undefined
        ? process.env.EMAIL_REJECT_UNAUTHORIZED === 'true'
        : process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  // Verify SMTP connection on startup
  transporter.verify((error) => {
    if (error) {
      logger.error({ msg: `SMTP connection verification failed (${host}:${port})`, error: error.message || error });
    } else {
      logger.info({ msg: `SMTP email service connected successfully (${host}:${port})` });
    }
  });
} else {
  logger.warn('SMTP email credentials not configured. Emails will be logged to console in development mode.');
}

/**
 * Sends an OTP to the user's email address.
 * Falls back to logging to console in development environment if credentials are not configured.
 */
export async function sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'forgot_password' | 'email_change') {
  const subject = purpose === 'signup'
    ? 'Verify Your Account - VIEWORA'
    : purpose === 'forgot_password'
    ? 'Reset Your Password - VIEWORA'
    : 'Verify Email Change - VIEWORA';

  const actionText = purpose === 'signup'
    ? 'verify your account'
    : purpose === 'forgot_password'
    ? 'reset your password'
    : 'verify your new email address';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d4af37; margin: 0; font-family: 'Playfair Display', Georgia, serif;">VIEWORA</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Premium Fashion Eyewear</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #333333; margin-top: 0;">${subject}</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Thank you for choosing VIEWORA. Please use the following one-time password (OTP) to ${actionText}. This OTP is valid for 5 minutes.</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #fafafa; border-radius: 6px; border: 1px dashed #d4af37;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d4af37; font-family: monospace;">${otp}</span>
      </div>
      
      <p style="font-size: 13px; line-height: 1.5; color: #888888;">If you did not make this request, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; 2026 VIEWORA. All rights reserved.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"VIEWORA Support" <${from}>`,
        to: sanitizeHeaderValue(email),
        subject,
        html: htmlContent,
      });
      logger.info({ msg: `OTP email sent to ${email}`, purpose });
    } catch (error) {
      logger.error({ msg: `Failed to send OTP email to ${email}`, error });
      // Fallback in case of SMTP failure
      logOtpToConsole(email, otp, purpose);
    }
  } else {
    logOtpToConsole(email, otp, purpose);
  }
}

function logOtpToConsole(email: string, otp: string, purpose: 'signup' | 'forgot_password' | 'email_change') {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] OTP FOR EMAIL: ${email}\nPURPOSE: ${purpose}\nOTP CODE: ${otp}\n` + 
    '='.repeat(60) + '\n'
  );
}

export async function sendOrderConfirmationEmail(email: string, order: any) {
  const orderShortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'VIEWORA';
  const subject = `Order Confirmed! - VIEWORA (Order #${orderShortId})`;

  // Resolve applied coupon code
  let appliedCouponCode = order.appliedCoupon?.code || null;
  if (!appliedCouponCode && order.appliedCouponId) {
    try {
      const cpn = await prisma.coupon.findUnique({ where: { id: order.appliedCouponId } });
      appliedCouponCode = cpn?.code || null;
    } catch {
      // ignore
    }
  }

  // Resolve any post-payment reward coupon earned on this order
  let earnedCoupon = order.earnedCoupon || null;
  if (!earnedCoupon && order.id) {
    try {
      earnedCoupon = await prisma.coupon.findFirst({
        where: { sourceOrderId: order.id, status: 'active' },
      });
    } catch {
      // ignore
    }
  }

  const itemsRows = (order.items || []).map((item: any) => {
    const name = item.variant?.product?.name || item.skuSnapshot || 'Eyewear Frame';
    const sku = item.skuSnapshot || item.variant?.sku || '';
    const color = item.variant?.color ? ` (${item.variant.color})` : '';
    const qty = item.quantity || 1;
    const price = Number(item.priceAtPurchase || 0).toLocaleString('en-IN');
    const total = (Number(item.priceAtPurchase || 0) * qty).toLocaleString('en-IN');
    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #333333;">
          <strong>${name}</strong>${color}
          ${sku ? `<br><span style="font-size: 12px; color: #888888; font-family: monospace;">SKU: ${sku}</span>` : ''}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: center; color: #555555;">${qty}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: right; color: #333333; font-family: monospace;">₹${price}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; text-align: right; color: #333333; font-weight: bold; font-family: monospace;">₹${total}</td>
      </tr>
    `;
  }).join('');

  const discountVal = Number(order.discountAmount || 0);
  const subtotalVal = Number(order.subtotal || 0);
  const shippingVal = Number(order.shippingFee || 0);
  const finalVal = Number(order.finalPayableAmount || 0);

  const couponRow = discountVal > 0 ? `
    <tr>
      <td colspan="3" style="padding: 6px 0; text-align: right; color: #d4af37; font-size: 14px;">
        <strong>Coupon Discount ${appliedCouponCode ? `(${appliedCouponCode})` : ''}:</strong>
      </td>
      <td style="padding: 6px 0; text-align: right; color: #d4af37; font-size: 14px; font-weight: bold; font-family: monospace;">-₹${discountVal.toLocaleString('en-IN')}</td>
    </tr>
  ` : '';

  const rewardCouponBanner = earnedCoupon ? `
    <div style="margin: 25px 0; padding: 18px; background-color: #faf6eb; border: 1px dashed #d4af37; border-radius: 6px; text-align: center;">
      <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #b8860b; font-weight: bold; display: block; margin-bottom: 4px;">Exclusive Reward Earned</span>
      <h3 style="margin: 0 0 8px 0; color: #222222; font-family: 'Playfair Display', Georgia, serif; font-size: 18px;">You've unlocked a 10% Discount Coupon!</h3>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #666666;">Use this coupon code on your next luxury purchase at Viewora:</p>
      <div style="display: inline-block; background-color: #ffffff; border: 1px solid #d4af37; padding: 8px 20px; font-family: monospace; font-size: 18px; font-weight: bold; color: #d4af37; letter-spacing: 2px;">
        ${earnedCoupon.code}
      </div>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #999999;">Valid for 90 days from today.</p>
    </div>
  ` : '';

  const shippingAddressText = [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
    order.shippingCity,
    order.shippingState ? `${order.shippingState} - ${order.shippingPincode || ''}` : order.shippingPincode
  ].filter(Boolean).join(', ');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #d4af37; margin: 0; font-family: 'Playfair Display', Georgia, serif; letter-spacing: 3px; font-size: 28px;">VIEWORA</h1>
        <p style="font-size: 11px; letter-spacing: 2.5px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Luxury & Designer Eyewear</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #eeeeee; margin-bottom: 20px;">

      <h2 style="font-size: 20px; color: #1a1a1a; margin-top: 0; font-family: 'Playfair Display', Georgia, serif;">Thank You for Your Order!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #555555;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #555555;">Your payment has been successfully processed and your order <strong>#${orderShortId}</strong> is confirmed. We are carefully preparing your eyewear for dispatch.</p>

      ${rewardCouponBanner}

      <div style="margin: 20px 0; padding: 15px; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 4px;">
        <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Order ID:</strong> <span style="font-family: monospace; color: #555555;">${order.id}</span></p>
        <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Payment Status:</strong> <span style="color: #2e7d32; font-weight: bold; text-transform: uppercase;">PAID</span></p>
        ${shippingAddressText ? `<p style="margin: 0; font-size: 13px;"><strong>Delivery Address:</strong> <span style="color: #555555;">${shippingAddressText}</span></p>` : ''}
      </div>

      <h3 style="font-size: 16px; color: #222222; margin: 25px 0 10px 0; border-bottom: 2px solid #d4af37; padding-bottom: 6px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <thead>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <th style="text-align: left; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #888888;">Item</th>
            <th style="text-align: center; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #888888;">Qty</th>
            <th style="text-align: right; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #888888;">Price</th>
            <th style="text-align: right; padding: 8px 0; font-size: 12px; text-transform: uppercase; color: #888888;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 8px 0 4px 0; text-align: right; color: #666666; font-size: 14px;">Subtotal:</td>
            <td style="padding: 8px 0 4px 0; text-align: right; color: #333333; font-size: 14px; font-family: monospace;">₹${subtotalVal.toLocaleString('en-IN')}</td>
          </tr>
          ${couponRow}
          <tr>
            <td colspan="3" style="padding: 4px 0; text-align: right; color: #666666; font-size: 14px;">Shipping Fee:</td>
            <td style="padding: 4px 0; text-align: right; color: #333333; font-size: 14px; font-family: monospace;">${shippingVal === 0 ? 'FREE' : `₹${shippingVal.toLocaleString('en-IN')}`}</td>
          </tr>
          <tr style="border-top: 2px solid #222222;">
            <td colspan="3" style="padding: 10px 0; text-align: right; color: #111111; font-size: 16px; font-weight: bold;">Total Amount Paid:</td>
            <td style="padding: 10px 0; text-align: right; color: #d4af37; font-size: 18px; font-weight: bold; font-family: monospace;">₹${finalVal.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size: 13px; line-height: 1.6; color: #666666; margin-top: 20px;">
        We will notify you via email with tracking details as soon as your parcel is handed over to our courier partner.
      </p>

      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 25px 0 15px 0;">
      <p style="font-size: 11px; color: #aaaaaa; text-align: center; margin: 0;">
        &copy; 2026 VIEWORA Luxury Eyewear. All rights reserved. &bull; <a href="https://viewora.in" style="color: #d4af37; text-decoration: none;">viewora.in</a>
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"VIEWORA Orders" <${from}>`,
        to: sanitizeHeaderValue(email),
        subject,
        html: htmlContent,
      });
      logger.info({ msg: `Order confirmation email sent to ${email}`, orderId: order.id, appliedCoupon: appliedCouponCode, earnedCoupon: earnedCoupon?.code });
    } catch (error) {
      logger.error({ msg: `Failed to send order confirmation email to ${email}`, error, orderId: order.id });
      logOrderToConsole(email, order, appliedCouponCode, earnedCoupon);
    }
  } else {
    logOrderToConsole(email, order, appliedCouponCode, earnedCoupon);
  }
}

function logOrderToConsole(email: string, order: any, appliedCouponCode?: string | null, earnedCoupon?: any) {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] ORDER CONFIRMATION FOR EMAIL: ${email}\nORDER ID: ${order.id}\nAMOUNT: ₹${order.finalPayableAmount}` +
    (appliedCouponCode ? `\nAPPLIED COUPON: ${appliedCouponCode} (Discount: ₹${order.discountAmount})` : '') +
    (earnedCoupon ? `\nEARNED REWARD COUPON: ${earnedCoupon.code}` : '') +
    '\n' + '='.repeat(60) + '\n'
  );
}

export async function sendCouponExpiryReminder(email: string, couponCode: string, value: number, expiresAt: Date) {
  const subject = `Your Coupon is Expiring Soon! - VIEWORA`;
  const formattedExpiry = expiresAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d4af37; margin: 0; font-family: 'Playfair Display', Georgia, serif;">VIEWORA</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Premium Fashion Eyewear</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #333333; margin-top: 0;">Don't let your coupon go to waste!</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Your coupon worth <strong>₹${value.toLocaleString('en-IN')}</strong> is expiring soon on <strong>${formattedExpiry}</strong>.</p>
      
      <div style="text-align: center; margin: 30px 0; padding: 15px; background-color: #fafafa; border-radius: 6px; border: 1px dashed #d4af37;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #d4af37; font-family: monospace;">${couponCode}</span>
      </div>
      
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Apply this coupon code at checkout to claim your discount. Browse our collection today!</p>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; 2026 VIEWORA. All rights reserved.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"VIEWORA Coupons" <${from}>`,
        to: sanitizeHeaderValue(email),
        subject,
        html: htmlContent,
      });
      logger.info({ msg: `Coupon expiry email sent to ${email}`, couponCode });
    } catch (error) {
      logger.error({ msg: `Failed to send coupon expiry email to ${email}`, error, couponCode });
      logCouponToConsole(email, couponCode, value, expiresAt);
    }
  } else {
    logCouponToConsole(email, couponCode, value, expiresAt);
  }
}

function logCouponToConsole(email: string, couponCode: string, value: number, expiresAt: Date) {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] COUPON EXPIRY REMINDER FOR EMAIL: ${email}\nCODE: ${couponCode}\nVALUE: ₹${value}\nEXPIRES AT: ${expiresAt.toISOString()}\n` + 
    '='.repeat(60) + '\n'
  );
}

export async function sendSubscriptionConfirmationEmail(email: string) {
  const subject = "Welcome to Viewora Community";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d4af37; margin: 0; font-family: 'Playfair Display', Georgia, serif;">VIEWORA</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Premium Fashion Eyewear</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #333333; margin-top: 0;">${subject}</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Thank you for subscribing to the Viewora community!</p>
      
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">You will now receive:</p>
      <ul style="font-size: 15px; line-height: 1.5; color: #555555; list-style-type: none; padding-left: 0;">
        <li>✓ Latest new arrivals</li>
        <li>✓ Exclusive eyewear collections</li>
        <li>✓ Premium brand updates</li>
        <li>✓ Special offers and discounts</li>
      </ul>

      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Join our exclusive Viewora Community and unlock the best benefits.</p>

      <p style="font-size: 15px; line-height: 1.5; color: #555555;">For just ₹99, become a community member and get access to:</p>
      <ul style="font-size: 15px; line-height: 1.5; color: #555555; list-style-type: none; padding-left: 0;">
        <li>✓ Special member-only discounts</li>
        <li>✓ Early access to new collections</li>
        <li>✓ Exclusive deals and offers</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://viewora.in/community/join" style="display: inline-block; padding: 15px 30px; background-color: #000000; color: #d4af37; text-decoration: none; font-size: 16px; font-weight: bold; border: 1px solid #d4af37; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Join Community for ₹99</a>
      </div>

      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Thank you for being part of Viewora.</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Enjoy premium eyewear experiences.</p>
      
      <p style="font-size: 15px; line-height: 1.5; color: #555555; margin-top: 30px;">Regards,<br>Viewora Team</p>

      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; 2026 VIEWORA. All rights reserved.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"VIEWORA Community" <${from}>`,
        to: sanitizeHeaderValue(email),
        subject,
        html: htmlContent,
      });
      logger.info({ msg: `Subscription email sent to ${email}` });
    } catch (error) {
      logger.error({ msg: `Failed to send subscription email to ${email}`, error });
      logSubscriptionToConsole(email);
    }
  } else {
    logSubscriptionToConsole(email);
  }
}

function logSubscriptionToConsole(email: string) {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] SUBSCRIPTION CONFIRMATION FOR EMAIL: ${email}\n` + 
    '='.repeat(60) + '\n'
  );
}

export async function sendStockConflictAlertEmail(
  adminEmail: string,
  orderId: string,
  amount: number,
  contactInfo: string
) {
  const subject = `CRITICAL ALERT: Stock Conflict on Paid Order #${orderId.slice(0, 8).toUpperCase()}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ff4d4f; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #ff4d4f; margin: 0; font-family: 'Playfair Display', Georgia, serif;">VIEWORA ALERT</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Stock Conflict Detected</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #d32f2f; margin-top: 0;">CRITICAL: Late Payment Stock Conflict</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">An order has been paid but the inventory reservation was already released and stock is unavailable.</p>
      
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Amount Captured:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
      <p><strong>Customer Contact:</strong> ${contactInfo}</p>
      
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Please process a manual refund or contact the customer to resolve the stock shortage immediately.</p>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; 2026 VIEWORA. Admin Alert System.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"VIEWORA Alerts" <${from}>`,
        to: sanitizeHeaderValue(adminEmail),
        subject,
        html: htmlContent,
      });
      logger.info({ msg: `Stock conflict alert email sent to ${adminEmail}`, orderId });
    } catch (error) {
      logger.error({ msg: `Failed to send stock conflict alert email to ${adminEmail}`, error, orderId });
      logStockConflictToConsole(adminEmail, orderId, amount, contactInfo);
    }
  } else {
    logStockConflictToConsole(adminEmail, orderId, amount, contactInfo);
  }
}

function logStockConflictToConsole(adminEmail: string, orderId: string, amount: number, contactInfo: string) {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] STOCK CONFLICT ALERT FOR ADMIN: ${adminEmail}\nORDER ID: ${orderId}\nAMOUNT: ₹${amount}\nCONTACT: ${contactInfo}\n` + 
    '='.repeat(60) + '\n'
  );
}
