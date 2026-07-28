import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import campaign2 from "@/assets/IMG_0979.jpg";

export const metadata = {
  title: "Collections | Viewora Luxury Eyewear",
  description: "Browse our signature luxury eyewear collections including Sunglasses, Optical Frames, and Limited Edition pieces.",
};

const collectionsList = [
  {
    title: "Sunglasses",
    subtitle: "Sun-Ready Statement Pieces",
    desc: "Bold UV400 protected frames crafted for UV defense, beachside luxury, and urban sophistication.",
    img: colSun,
    slug: "sunglasses",
    count: "48+ Models",
  },
  {
    title: "Optical Frames",
    subtitle: "Precision & Elegance",
    desc: "Refined prescription-ready frames designed for clarity, lightweight comfort, and structural strength.",
    img: colOpt,
    slug: "optical-frames",
    count: "36+ Models",
  },
  {
    title: "Limited Edition",
    subtitle: "Small-Batch Masterpieces",
    desc: "Rare handcrafted designs reserved for collectors seeking exceptional craftsmanship and refined gold detailing.",
    img: colLtd,
    slug: "limited-edition",
    count: "12 Exclusive Pieces",
  },
];

const categorySpotlights = [
  { name: "Wayfarer", href: "/shop?shape=wayfarer", desc: "Classic trapezoidal design with modern bevels" },
  { name: "Aviator", href: "/shop?shape=aviator", desc: "Timeless teardrop silhouettes with double bridges" },
  { name: "Cat Eye", href: "/shop?shape=cat-eye", desc: "Upswept feminine profiles for vintage glamour" },
  { name: "Round", href: "/shop?shape=round", desc: "Intellectual retro frames for distinguished character" },
  { name: "Square", href: "/shop?shape=square", desc: "Architectural lines engineered for strong contours" },
  { name: "Rimless", href: "/shop?shape=rimless", desc: "Minimalist lightness for invisible sophistication" },
];

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 bg-black border-b border-border/40">
        <div className="absolute inset-0 opacity-25">
          <Image
            src={campaign2}
            alt="Viewora Collections"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/80 to-black/90" />

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-8">
          <p className="text-gold tracking-[0.4em] text-xs mb-4 font-semibold uppercase">CURATED SERIES</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight text-white mb-6">
            Viewora <span className="text-gold font-bold italic">Collections</span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed font-sans max-w-2xl mx-auto font-light">
            Explore our signature lines of high-end eyewear designed to harmonize precision optics with high fashion.
          </p>
        </div>
      </section>

      {/* Main Collections Grid */}
      <section className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">SIGNATURE LINES</p>
          <h2 className="text-3xl sm:text-4xl font-serif">Crafted for All Generations</h2>
          <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionsList.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group relative overflow-hidden aspect-[4/5] block border border-border/40 bg-black/90 hover:border-gold/60 transition-all duration-500 rounded-2xl shadow-xl"
            >
              <div className="absolute top-0 left-0 w-full h-[65%] p-6 sm:p-8 flex items-center justify-center">
                <Image
                  src={c.img}
                  alt={c.title}
                  className="w-full h-full object-contain transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:-translate-y-2.5 filter group-hover:drop-shadow-[0_15px_25px_rgba(197,160,89,0.35)]"
                  loading="lazy"
                  width={800}
                  height={900}
                />
              </div>

              <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

              <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-20 flex flex-col justify-end">
                <h3 className="text-2xl font-serif text-gold mb-2 group-hover:text-gold-soft transition-colors">{c.title}</h3>
                <p className="text-sm text-white/80 mb-4 leading-relaxed font-sans max-w-[95%]">{c.desc}</p>
                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase group-hover:text-gold transition-colors">
                  VIEW COLLECTION &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Frame Shapes Grid */}
      <section className="py-20 px-6 bg-card border-y border-border/50">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">SHOP BY SHAPE</p>
            <h2 className="text-3xl sm:text-4xl font-serif">Curated Frame Geometries</h2>
            <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorySpotlights.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="p-6 border border-border/60 bg-background hover:border-gold/50 transition-all duration-300 group block"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-serif text-white group-hover:text-gold transition-colors">{item.name}</h3>
                  <span className="text-xs text-gold tracking-widest uppercase font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
