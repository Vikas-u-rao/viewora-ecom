import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

// HTML-escape user input to prevent email HTML injection
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Reuse the shared singleton transporter from the email service
import { transporter, hasCredentials, sanitizeHeaderValue } from '../services/email';

const from = process.env.EMAIL_FROM || 'noreply@viewora.in';
const contactRecipient = process.env.CONTACT_RECIPIENT_EMAIL || 'support@viewora.in';

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

    // Escape all user-supplied values before embedding in HTML to prevent injection
    const safeName = escapeHtml(String(name).trim());
    const safeSubject = sanitizeHeaderValue(escapeHtml(String(subject).trim()));
    const safeMessage = escapeHtml(String(message).trim());

    // Try sending email if SMTP is configured
    if (hasCredentials && transporter) {
      try {
        await transporter.sendMail({
          from: `"VIEWORA Contact Form" <${from}>`,
          to: contactRecipient,
          subject: `Contact Form: ${safeSubject}`,
          text: `Name: ${name}\nEmail: ${normalizedEmail}\n\nMessage:\n${message}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${safeMessage}</p>
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
