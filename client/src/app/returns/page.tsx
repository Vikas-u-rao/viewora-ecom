import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Returns & Exchange — Viewora',
  description: 'Viewora return and exchange policy. Easy returns within 3-4 days of delivery.',
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 pt-36 font-sans">
        <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">Support</p>
        <h1 className="font-serif text-4xl text-white mb-2">Returns &amp; Exchange</h1>
        <p className="text-muted-foreground text-sm mb-10">We stand behind every pair we sell.</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed text-[15px]">
          <section className="border border-gold/30 bg-gold/5 p-6 rounded-sm">
            <h2 className="text-white font-serif text-xl mb-3">3-4 Day Return Window</h2>
            <p>Viewora (a product of <strong>Aspire Genx Technologies Private Limited</strong>) accepts returns within <span className="text-white font-medium">3-4 days of delivery</span> for products that are unused, undamaged, and in their original packaging with all tags intact.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">How to Initiate a Return</h2>
            <ol className="space-y-3 list-decimal list-inside">
              <li>Email <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a> with your order number and reason for return</li>
              <li>Our team will respond within 24 hours with return instructions</li>
              <li>Pack the item securely in its original packaging</li>
              <li>Drop off the package with the courier as instructed</li>
              <li>Once we receive and inspect the item, your refund will be processed</li>
            </ol>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Refund Timeline</h2>
            <p>Refunds are processed within <span className="text-white font-medium">5–7 business days</span> after we receive and inspect the returned item. The refund will be credited to your original payment method.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Non-Returnable Items</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Products with visible signs of use or damage</li>
              <li>Products with missing original packaging or accessories</li>
              <li>Items purchased during final sale events</li>
              <li>Customised or personalised products</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Exchanges</h2>
            <p>For exchanges (e.g., different colour or style), please initiate a return and place a new order for the desired item. This ensures the fastest turnaround for you.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Damaged or Defective Items</h2>
            <p>If you receive a damaged or defective product, contact us within <span className="text-white font-medium">48 hours of delivery</span> at <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a> with photos of the damage. We will arrange a free replacement or full refund.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
