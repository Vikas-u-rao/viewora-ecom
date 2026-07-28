import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Viewora',
  description: 'Viewora Terms and Conditions: Read our terms of service before purchasing.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 pt-36 font-sans">
        <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">Legal</p>
        <h1 className="font-serif text-4xl text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed text-[15px]">
          <section>
            <h2 className="text-white font-serif text-xl mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using the Viewora website (viewora.in), operated by <strong>Aspire Genx Technologies Private Limited</strong>, you agree to be bound by these Terms and Conditions. Viewora is a commercial brand product of Aspire Genx Technologies Private Limited. If you do not agree with any part of these terms, please do not use our website.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">2. Products & Pricing</h2>
            <p>All prices are listed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. We reserve the right to change prices at any time. Product images are for illustrative purposes; actual products may vary slightly. We make every effort to display colours accurately, but we cannot guarantee your screen displays colours exactly as they appear in person.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">3. Orders & Payment</h2>
            <p>By placing an order, you represent that the information you provide is accurate and complete. We accept payments via UPI, credit cards, debit cards, and net banking through our payment partner PhonePe. Your order is confirmed only after successful payment. We reserve the right to cancel orders at our discretion.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">4. Shipping & Delivery</h2>
            <p>We ship across India. Standard delivery takes 3–5 business days. Delivery timelines are estimates and may vary due to courier delays or unforeseen circumstances. A shipping fee of ₹99 applies to all orders. Free shipping may be available during promotional periods.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">5. Returns & Exchanges</h2>
            <p>We accept returns within 3 days of delivery for unused, undamaged products in original packaging. To initiate a return, contact <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a> with your order number. Refunds are processed within 5–7 business days after we receive the returned item. Shipping charges are non-refundable.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">6. Intellectual Property</h2>
            <p>All content on this website — including text, images, logos, and design — is the property of Viewora and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">7. Limitation of Liability</h2>
            <p>Viewora shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount paid for the specific order in question.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">8. Governing Law</h2>
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">9. Contact</h2>
            <p>For any queries, write to us at: <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
