/**
 * Error reporting stub.
 *
 * The original Lovable-specific error reporter (window.__lovableEvents) has been
 * removed as it has no effect in production.
 *
 * TODO: Replace with a real error monitoring service.
 * Recommended: @sentry/nextjs (https://docs.sentry.io/platforms/javascript/guides/nextjs/)
 *
 *   npm install @sentry/nextjs
 *   npx @sentry/wizard@latest -i nextjs
 */

export function reportLovableError(_error: unknown, _context: Record<string, unknown> = {}) {
  // No-op in production until a real monitoring service is integrated.
  // In development, errors are shown in the browser console and the error.tsx boundary.
  if (process.env.NODE_ENV === 'development') {
    console.error('[reportError]', _error, _context);
  }
}
