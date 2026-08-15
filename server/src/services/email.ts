import nodemailer from 'nodemailer';
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
  const subject = `Order Confirmed! - VIEWORA (Order #${order.id.slice(0, 8).toUpperCase()})`;

  const itemsList = (order.items || []).map((item: any) => {
    const name = item.variant?.product?.name || 'Eyewear';
    const sku = item.skuSnapshot || item.variant?.sku || '';
    const qty = item.quantity;
    const price = Number(item.priceAtPurchase).toLocaleString('en-IN');
    return `<li>${name} (${sku}) - Qty: ${qty} @ ₹${price}</li>`;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff; color: #333333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #d4af37; margin: 0; font-family: 'Playfair Display', Georgia, serif;">VIEWORA</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #888888; margin: 5px 0 0 0; text-transform: uppercase;">Premium Fashion Eyewear</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #333333; margin-top: 0;">Your Order has been Confirmed!</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #555555;">We are pleased to inform you that your payment was successful and your order has been received.</p>
      
      <h3>Order Details</h3>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Amount Paid:</strong> ₹${Number(order.finalPayableAmount).toLocaleString('en-IN')}</p>
      
      <h4>Items:</h4>
      <ul>
        ${itemsList}
      </ul>

      <p style="font-size: 15px; line-height: 1.5; color: #555555;">We will notify you once your order is shipped.</p>
      <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 20px 0;">
      <p style="font-size: 12px; color: #999999; text-align: center; margin: 0;">&copy; 2026 VIEWORA. All rights reserved.</p>
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
      logger.info({ msg: `Order confirmation email sent to ${email}`, orderId: order.id });
    } catch (error) {
      logger.error({ msg: `Failed to send order confirmation email to ${email}`, error, orderId: order.id });
      logOrderToConsole(email, order);
    }
  } else {
    logOrderToConsole(email, order);
  }
}

function logOrderToConsole(email: string, order: any) {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] ORDER CONFIRMATION FOR EMAIL: ${email}\nORDER ID: ${order.id}\nAMOUNT: ₹${order.finalPayableAmount}\n` + 
    '='.repeat(60) + '\n'
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
