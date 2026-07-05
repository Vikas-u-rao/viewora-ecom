import nodemailer from 'nodemailer';
import { logger } from '../lib/logger';

// Create a mail transporter using environment variables
const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || 'noreply@viewora.com';

const hasCredentials = !!(host && user && pass);

let transporter: nodemailer.Transporter | null = null;

if (hasCredentials) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports like 587
    auth: {
      user,
      pass,
    },
  });
} else {
  logger.warn('SMTP Email credentials not configured. Emails will be logged to console in development mode.');
}

/**
 * Sends an OTP to the user's email address.
 * Falls back to logging to console in development environment if credentials are not configured.
 */
export async function sendOtpEmail(email: string, otp: string, purpose: 'signup' | 'forgot_password') {
  const subject = purpose === 'signup'
    ? 'Verify Your Account - VIEWORA'
    : 'Reset Your Password - VIEWORA';

  const actionText = purpose === 'signup' ? 'verify your account' : 'reset your password';

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
        to: email,
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

function logOtpToConsole(email: string, otp: string, purpose: 'signup' | 'forgot_password') {
  logger.info('\n' + '='.repeat(60) + 
    `\n[DEVELOPMENT FALLBACK] OTP FOR EMAIL: ${email}\nPURPOSE: ${purpose}\nOTP CODE: ${otp}\n` + 
    '='.repeat(60) + '\n'
  );
}
