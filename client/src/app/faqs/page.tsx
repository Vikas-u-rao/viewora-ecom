import type { Metadata } from 'next';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: "FAQ's — Viewora",
  description: "Frequently asked questions about Viewora eyewear — orders, shipping, returns, and more.",
};

const faqs = [
  {
    q: 'How do I track my order?',
    a: 'Once your order is dispatched, you will receive an email with a tracking link. You can also view your order status in your Account → Orders section.',
  },
  {
    q: 'Can I change or cancel my order after placing it?',
    a: 'Orders can be cancelled within 30 minutes of placement. After that, cancellation may not be possible as orders enter fulfilment. Contact us immediately at contact@viewora.in.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, credit cards (Visa, Mastercard, Amex), debit cards, and net banking via PhonePe.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 3–5 business days across India. Orders are dispatched within 1–2 business days after payment confirmation.',
  },
  {
    q: 'What is your return policy?',
    a: 'We accept returns within 7 days of delivery for unused, undamaged products in original packaging. See our full Returns & Exchange policy for details.',
  },
  {
    q: 'Are Viewora eyewear frames prescription-compatible?',
    a: 'Our optical frames are designed to be fitted with prescription lenses by your local optician. They are not pre-fitted with prescription lenses unless explicitly stated.',
  },
  {
    q: 'How do I clean and maintain my frames?',
    a: 'Use the microfibre cloth provided to clean lenses. Avoid using paper towels or clothing. Rinse with lukewarm water before wiping. Store in the protective case when not in use.',
  },
  {
    q: 'Do you offer warranty on your products?',
    a: 'All Viewora frames come with a 6-month manufacturing defect warranty. This covers frame breakage due to manufacturing defects but does not cover accidental damage or normal wear.',
  },
  {
    q: 'How do I use a coupon code?',
    a: 'Coupon codes can be entered at the checkout page before placing your order. Only one coupon can be applied per order.',
  },
  {
    q: 'I still have a question. How can I contact you?',
    a: 'Reach us at contact@viewora.in or call +91 98765 43210 (Mon-Sat, 11am-7pm IST). We typically respond within 24 hours.',
  },
];

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-20 pt-36 font-sans">
        <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">Support</p>
        <h1 className="font-serif text-4xl text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-sm mb-10">Everything you need to know about shopping with Viewora.</p>

        <div className="divide-y divide-border">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group py-5 cursor-pointer">
              <summary className="flex items-center justify-between text-white font-medium text-base list-none select-none">
                {faq.q}
                <span className="text-gold text-xl ml-4 group-open:rotate-45 transition-transform duration-200 flex-shrink-0">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed pr-8">{faq.a}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
