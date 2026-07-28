import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Shipping & Delivery — Viewora',
  description: 'Viewora shipping policy: delivery timelines, fees, and tracking information.',
};

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 pt-36 font-sans">
        <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">Support</p>
        <h1 className="font-serif text-4xl text-white mb-2">Shipping &amp; Delivery</h1>
        <p className="text-muted-foreground text-sm mb-10">Delivering luxury, right to your door.</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed text-[15px]">
          <section className="border border-border p-6 rounded-sm">
            <h2 className="text-white font-serif text-xl mb-3">Standard Delivery</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Delivery within <span className="text-white font-medium">3–5 business days</span> across India</li>
              <li>Shipping fee: <span className="text-white font-medium">₹99</span> on all orders</li>
              <li>Orders are dispatched within 1–2 business days of confirmation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Order Tracking</h2>
            <p>Once your order is shipped, you will receive an email with a tracking number. You can use this to track your shipment on our courier partner&apos;s website.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Delivery Areas</h2>
            <p>We currently ship to all major cities and towns across India. For remote areas, additional delivery time may apply. If we are unable to deliver to your location, we will contact you promptly.</p>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Important Notes</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Delivery timelines are estimates and may vary during festive seasons or due to unforeseen events</li>
              <li>Please ensure someone is available to receive the package at the delivery address</li>
              <li>Viewora is not responsible for delays caused by courier partners after dispatch</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-serif text-xl mb-3">Need Help?</h2>
            <p>Contact us at <a href="mailto:contact@viewora.in" className="text-gold hover:underline">contact@viewora.in</a> or call <a href="tel:+919876543210" className="text-gold hover:underline">+91 98765 43210</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
