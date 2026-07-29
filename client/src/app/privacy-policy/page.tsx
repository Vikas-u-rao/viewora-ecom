import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Viewora',
  description: 'Viewora Privacy Policy: How we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 pt-36 font-sans">
        <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">Legal</p>
        <h1 className="font-serif text-4xl text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed text-[15px]">
          <section>
            <h2 className="text-white font-serif text-xl mb-3">1. Information We Collect</h2>
            <p>Viewora is owned and operated by <strong>Aspire Genx Technologies Private Limited</strong>. We collect information you provide directly to us, such as your name, email address, phone number, shipping address, and payment information when you register or make a purchase. We also collect information about your browsing behaviour on our website to improve your experience.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to: process your orders and payments; send you order confirmations and updates; respond to your inquiries; send promotional communications (with your consent); improve our products and services; and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">3. Information Sharing</h2>
            <p>We do not sell or rent your personal information to third parties. We share your information only with: payment processors (PhonePe) to complete transactions; shipping partners to deliver your orders; and service providers who help us operate our website (e.g., email service providers).</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information. Passwords are hashed and never stored in plain text. Payment information is handled by PCI-compliant payment processors and is not stored on our servers.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time by clicking &quot;Unsubscribe&quot; in any email or by contacting us directly.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">6. Cookies</h2>
            <p>We use cookies to keep you signed in, remember your cart, and understand how you use our website. You can control cookie settings through your browser. Disabling cookies may affect certain features of the site.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at: <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
