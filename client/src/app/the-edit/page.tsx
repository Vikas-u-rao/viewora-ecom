import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.webp";
import p4 from "@/assets/p4.webp";

export const metadata = {
  title: "The Edit | Viewora Luxury Eyewear",
  description: "Curated fashion-forward eyewear selections for every style, mood, and moment. Explore Quiet Luxury, The Classics, Statement Frames, and more.",
};

const editorialCards = [
  {
    title: "The Classics",
    slug: "the-classics",
    desc: "Timeless eyewear styles that remain relevant across seasons. Iconic silhouettes and enduring designs.",
    cta: "Explore The Classics",
    img: "https://cdn.viewora.in/uploads/products/Rayban_New_Wayfarer_Sunglass_RB_2132_622_-_01_53118dba-7f75-4d89-8aae-0c411841736e.webp",
  },
  {
    title: "Quiet Luxury",
    slug: "quiet-luxury",
    desc: "Understated, refined frames with premium materials, subtle branding, and sophisticated silhouettes.",
    cta: "Explore Quiet Luxury",
    img: "https://cdn.viewora.in/uploads/products/Fred_Frame_FG50002F_030_image_2_93834f8e-b854-475a-93e8-f1e5fed28c9b.jpg",
  },
  {
    title: "Statement Frames",
    slug: "statement-frames",
    desc: "Bold, oversized and fashion-forward eyewear crafted for those who command the room.",
    cta: "Explore Statement Frames",
    img: "https://cdn.viewora.in/uploads/products/Kuboraum_Maske_Sunglass_P60_LG_HB-_01_13631edd-2b2a-4da4-ad17-9127bf490af4.webp",
  },
  {
    title: "The Executive Edit",
    slug: "executive-edit",
    desc: "Refined eyewear tailored for boardroom authority, formal occasions, and professional poise.",
    cta: "Explore Executive Edit",
    img: "https://cdn.viewora.in/uploads/products/Rayban_Clubmaster_Sunglass_RB_3016_1367_B1_-_01_00ce460e-dc20-4673-bcbe-c053c12aee03.webp",
  },
  {
    title: "Weekend / Everyday",
    slug: "weekend",
    desc: "Versatile, lightweight frames designed for casual leisure, weekend getaways, and daily wear.",
    cta: "Explore Weekend Edit",
    img: "https://cdn.viewora.in/uploads/products/RayBan_Round_Metal_Sunglass_RB_3447_004_71_-_01_85bd47f4-7dd1-414d-b4f9-d0a063a45698.webp",
  },
  {
    title: "Travel Edit",
    slug: "travel",
    desc: "Sun-ready companions with UV defense and anti-glare coatings, built for global travelers.",
    cta: "Explore Travel Edit",
    img: "https://cdn.viewora.in/uploads/products/Chimi_Sunglass_Aviator_Brown_01_f540f194-3148-45ad-8b4f-d28f5362ee73.jpg",
  },
];

export default function TheEditPage() {
  return (
    <div className="min-h-screen bg-[#070706] text-[#FAD6E3] font-sans antialiased selection:bg-gold selection:text-black">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center pt-28 pb-16 px-6 overflow-hidden border-b border-[#2E2820]/60">
        <div className="absolute inset-0 z-0 opacity-30">
          <Image
            src={p1}
            alt="Viewora Editorial"
            fill
            className="object-cover object-center filter grayscale contrast-125"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070706] via-[#070706]/70 to-[#070706]/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-12">
          <p className="text-gold tracking-[0.4em] text-xs sm:text-sm font-semibold uppercase mb-4">
            EDITORIAL SELECTIONS
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal leading-none tracking-tight text-white mb-6">
            THE VIEWORA EDIT
          </h1>
          <p className="text-base sm:text-xl text-[#FAD6E3]/90 leading-relaxed font-sans max-w-2xl mx-auto font-light mb-10">
            Curated eyewear for every style, mood and moment.
          </p>
          <a
            href="#curated-stories"
            className="inline-block border border-gold/60 text-gold hover:bg-gold hover:text-black px-10 py-4 text-xs font-bold tracking-[0.25em] transition-all duration-300 uppercase shadow-lg"
          >
            Explore the Edit &darr;
          </a>
        </div>
      </section>

      {/* Curated Editorial Collections Grid */}
      <section id="curated-stories" className="py-24 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <p className="text-gold tracking-[0.3em] text-xs font-semibold uppercase mb-3">CURATED THEMES</p>
          <h2 className="text-3xl sm:text-5xl font-serif text-white font-normal">Fashion & Lifestyle Stories</h2>
          <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {editorialCards.map((c) => (
            <Link
              key={c.slug}
              href={`/the-edit/${c.slug}`}
              className="group relative flex flex-col overflow-hidden bg-[#0e0c0a] border border-[#2E2820] hover:border-gold/60 transition-all duration-500 rounded-2xl shadow-2xl"
            >
              {/* Editorial Image Container */}
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/90 p-4 flex items-center justify-center">
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-black/30 to-transparent opacity-90" />
              </div>

              {/* Card Content */}
              <div className="p-8 flex flex-col justify-between flex-1 text-left">
                <div>
                  <h3 className="text-2xl font-serif text-gold group-hover:text-gold-soft transition-colors mb-3 font-medium">
                    {c.title}
                  </h3>
                  <p className="text-sm text-[#FAD6E3]/80 leading-relaxed font-sans mb-6 font-light">
                    {c.desc}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold tracking-[0.2em] text-white uppercase group-hover:text-gold transition-colors inline-flex items-center gap-2">
                    {c.cta} &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand Philosophy Manifesto */}
      <section className="py-20 px-6 bg-[#0a0807] border-t border-[#2E2820]/60 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-gold tracking-[0.35em] text-xs font-semibold uppercase mb-3">OUR APPROACH</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-6">Style Over Taxonomy</h2>
          <p className="text-base text-[#FAD6E3]/80 font-sans leading-relaxed font-light mb-8">
            While our Catalog lets you filter by frame geometry, lens specifications, and brand heritage, <strong className="text-gold font-normal">The Edit</strong> is curated for occasion, attitude, and personal expression. Every frame is hand-selected to elevate your individual wardrobe.
          </p>
          <Link
            href="/shop"
            className="inline-block text-xs font-bold tracking-[0.2em] text-gold border-b border-gold/40 pb-1 hover:border-gold transition-colors uppercase"
          >
            Looking for specific specs? Browse Full Shop Catalog &rarr;
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
