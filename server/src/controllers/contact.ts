import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';
import nodemailer from 'nodemailer';

// Helper to check if SMTP is configured
const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || 'noreply@viewora.in';
const contactRecipient = process.env.CONTACT_RECIPIENT_EMAIL || 'support@viewora.in';

const hasCredentials = !!(host && user && pass);

// POST /api/v1/contact
export async function submitContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      throw new AppError('VALIDATION_ERROR', 400, 'Name, email, subject, and message are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid email format');
    }

    // Log the message
    logger.info({
      msg: 'Contact form submission received',
      name,
      email: normalizedEmail,
      subject,
      message,
    });

    // Try sending email if SMTP is configured
    if (hasCredentials) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from: `"VIEWORA Contact Form" <${from}>`,
          to: contactRecipient,
          subject: `Contact Form: ${subject}`,
          text: `Name: ${name}\nEmail: ${normalizedEmail}\n\nMessage:\n${message}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
            </div>
          `,
        });
        logger.info('Contact form email sent successfully');
      } catch (error) {
        logger.error({ msg: 'Failed to send contact form email', error });
      }
    } else {
      logger.info('\n' + '='.repeat(60) + 
        `\n[DEVELOPMENT FALLBACK] CONTACT FORM SUBMISSION\nNAME: ${name}\nEMAIL: ${normalizedEmail}\nSUBJECT: ${subject}\nMESSAGE: ${message}\n` + 
        '='.repeat(60) + '\n'
      );
    }

    res.json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    next(error);
  }
}
