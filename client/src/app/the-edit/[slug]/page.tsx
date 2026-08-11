import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductCard from "@/components/ProductCard";
import { getApiBaseUrl } from "@/lib/constants";
import { ApiProduct } from "@/services/products";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.webp";
import p4 from "@/assets/p4.webp";

interface EditorialSlugDetails {
  title: string;
  subtitle: string;
  description: string;
  editorialIntro: string[];
  img: any;
  seoTitle: string;
  seoDesc: string;
}

const staticEditorialData: Record<string, EditorialSlugDetails> = {
  "the-classics": {
    title: "The Classics",
    subtitle: "Timeless Eyewear Silhouettes",
    description: "Timeless eyewear styles that remain relevant across seasons.",
    editorialIntro: [
      "A curation of iconic silhouettes and enduring designs that transcend temporary fashion trends. From legendary teardrop aviators to classic wayfarers, these frames define timeless elegance and effortless poise.",
      "Crafted with hand-polished acetates and corrosion-resistant alloys, each piece in The Classics represents the pinnacle of heritage optical design—essential staples for every sophisticated wardrobe."
    ],
    img: "https://cdn.viewora.in/uploads/products/Rayban_New_Wayfarer_Sunglass_RB_2132_622_-_01_53118dba-7f75-4d89-8aae-0c411841736e.webp",
    seoTitle: "The Classics Eyewear Collection | Viewora Luxury",
    seoDesc: "Discover Viewora's curated selection of timeless eyewear classics including iconic aviators and wayfarers from luxury houses.",
  },
  "quiet-luxury": {
    title: "Quiet Luxury",
    subtitle: "Understated Refinement & Distinction",
    description: "Understated, refined frames with premium materials, subtle branding and sophisticated silhouettes.",
    editorialIntro: [
      "Understated excellence for the discerning connoisseur. Featuring subtle branding, hand-finished premium acetate, and whisper-quiet luxury from houses such as Persol, Tom Ford, and Prada.",
      "Stripped of overt logos, Quiet Luxury focuses strictly on flawless material execution, weighted balance, and structural nuance—making a powerful statement through subtlety."
    ],
    img: "https://cdn.viewora.in/uploads/products/Fred_Frame_FG50002F_030_image_2_93834f8e-b854-475a-93e8-f1e5fed28c9b.jpg",
    seoTitle: "Quiet Luxury Eyewear | Viewora Curated Edit",
    seoDesc: "Discover Viewora's curated selection of refined, understated eyewear from leading luxury brands like Persol, Tom Ford, and Prada.",
  },
  "statement-frames": {
    title: "Statement Frames",
    subtitle: "Architectural Proportions & Bold Edges",
    description: "Bold, oversized and fashion-forward eyewear.",
    editorialIntro: [
      "Unapologetically bold and structurally expressive. Sculpted geometric fronts, dramatic shield masks, and architectural proportions designed for those who command the room.",
      "Designed for avant-garde sensibilities, Statement Frames push the boundaries of luxury eyewear with hand-carved thick acetates, vivid gradient lenses, and striking presence."
    ],
    img: "https://cdn.viewora.in/uploads/products/Kuboraum_Maske_Sunglass_P60_LG_HB-_01_13631edd-2b2a-4da4-ad17-9127bf490af4.webp",
    seoTitle: "Statement Frames & Bold Eyewear | Viewora",
    seoDesc: "Explore bold, oversized, and fashion-forward statement frames from luxury designer collections.",
  },
  "executive-edit": {
    title: "The Executive Edit",
    subtitle: "Precision Optics for Modern Leadership",
    description: "Refined eyewear suitable for professional, formal and business settings.",
    editorialIntro: [
      "Precision engineering tailored for boardroom authority and modern executive style. Clean lines, titanium accents, and polished optical clarity for the distinguished professional.",
      "Designed for seamless transitions between high-stakes meetings and formal evening engagements, these refined frames combine lightweight ergonomics with sharp, commanding aesthetics."
    ],
    img: "https://cdn.viewora.in/uploads/products/Rayban_Clubmaster_Sunglass_RB_3016_1367_B1_-_01_00ce460e-dc20-4673-bcbe-c053c12aee03.webp",
    seoTitle: "The Executive Edit Eyewear | Viewora",
    seoDesc: "Refined, professional eyewear designed for formal, corporate, and executive settings.",
  },
  "weekend": {
    title: "Weekend / Everyday",
    subtitle: "Effortless Leisure & Casual Elegance",
    description: "Versatile frames designed for casual everyday wear.",
    editorialIntro: [
      "Effortless versatility meets relaxed sophistication. Lightweight, durable frames designed for weekend leisure, casual cafe outings, and everyday comfort.",
      "Engineered for all-day wearability, these frames pair flexible hinge mechanisms with versatile color palettes that complement any casual wardrobe."
    ],
    img: "https://cdn.viewora.in/uploads/products/RayBan_Round_Metal_Sunglass_RB_3447_004_71_-_01_85bd47f4-7dd1-414d-b4f9-d0a063a45698.webp",
    seoTitle: "Weekend & Everyday Eyewear | Viewora",
    seoDesc: "Versatile, comfortable frames designed for relaxed weekend wear and casual daily style.",
  },
  "travel": {
    title: "Travel Edit",
    subtitle: "Sun-Ready Defense for Global Journeys",
    description: "Sunglasses and eyewear suitable for travel, driving and outdoor use.",
    editorialIntro: [
      "Sun-ready companions built for horizon chasers and global travelers. Featuring polarized UV defense, anti-glare coatings, and lightweight durability for life on the move.",
      "Whether navigating coastal highways or exploring international destinations, the Travel Edit offers maximum optical protection paired with jet-set luxury."
    ],
    img: "https://cdn.viewora.in/uploads/products/Chimi_Sunglass_Aviator_Brown_01_f540f194-3148-45ad-8b4f-d28f5362ee73.jpg",
    seoTitle: "Travel Edit Sunglasses | Viewora",
    seoDesc: "Sun-ready, polarized luxury eyewear tailored for global travel, driving, and outdoor exploration.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const staticData = staticEditorialData[slug];
  if (!staticData) {
    return {
      title: "The Edit | Viewora",
    };
  }
  return {
    title: staticData.seoTitle,
    description: staticData.seoDesc,
    openGraph: {
      title: staticData.seoTitle,
      description: staticData.seoDesc,
    },
  };
}

async function fetchEditorialCollectionData(slug: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/editorial-collections/${slug}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      return data as {
        id: string;
        title: string;
        slug: string;
        description: string;
        editorialIntro: string;
        heroImage: string;
        products: ApiProduct[];
      };
    }
  } catch (err) {
    console.error("Failed to fetch editorial collection from API", err);
  }
  return null;
}

export default async function EditorialCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const staticInfo = staticEditorialData[slug];

  if (!staticInfo) {
    notFound();
  }

  const apiData = await fetchEditorialCollectionData(slug);
  const products: ApiProduct[] = apiData?.products || [];

  // Fallback if API has no products linked yet
  const displayTitle = apiData?.title || staticInfo.title;
  const displayDesc = apiData?.description || staticInfo.description;
  const displayIntro = apiData?.editorialIntro
    ? [apiData.editorialIntro]
    : staticInfo.editorialIntro;

  return (
    <div className="min-h-screen bg-[#070706] text-[#FAD6E3] font-sans antialiased selection:bg-gold selection:text-black">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[55vh] flex items-center justify-center pt-28 pb-16 px-6 overflow-hidden border-b border-[#2E2820]/60">
        <div className="absolute inset-0 z-0 opacity-35">
          <Image
            src={staticInfo.img}
            alt={displayTitle}
            fill
            className="object-cover object-center filter contrast-110"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070706] via-[#070706]/75 to-[#070706]/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-10">
          <p className="text-gold tracking-[0.35em] text-xs font-semibold uppercase mb-3">
            THE VIEWORA EDIT
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal leading-tight text-white mb-4">
            {displayTitle}
          </h1>
          <p className="text-base sm:text-lg text-[#FAD6E3]/90 leading-relaxed font-sans max-w-2xl mx-auto font-light">
            {displayDesc}
          </p>
        </div>
      </section>

      {/* Editorial Introduction */}
      <section className="py-16 px-6 bg-[#0a0908] border-b border-[#2E2820]/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gold tracking-[0.3em] text-[11px] uppercase font-semibold mb-4">STORY & ESSENCE</p>
          <div className="space-y-4 text-base sm:text-lg text-white/90 font-serif leading-relaxed font-light">
            {displayIntro.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-8" />
        </div>
      </section>

      {/* Curated Products Section */}
      <section className="py-20 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-4 border-b border-[#2E2820]">
          <div>
            <h2 className="font-serif text-2xl text-white font-normal">Curated Selection</h2>
            <p className="text-xs text-[#FAD6E3]/70 font-sans mt-0.5">
              Hand-picked luxury frames matching the {displayTitle} theme.
            </p>
          </div>
          <span className="text-xs text-gold tracking-widest uppercase font-semibold">
            {products.length} {products.length === 1 ? "Frame" : "Frames"} Selected
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#2E2820] rounded-xl p-8">
            <p className="font-serif text-xl text-white mb-2">Curating {displayTitle}</p>
            <p className="text-sm text-[#FAD6E3]/70 max-w-md mx-auto mb-6">
              Our fashion editors are assembling the latest hand-picked pieces for this collection.
            </p>
            <Link
              href="/shop"
              className="inline-block border border-gold/50 text-gold px-6 py-2.5 text-xs font-bold tracking-[0.2em] hover:bg-gold hover:text-black transition-all uppercase"
            >
              Explore Full Shop Catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Footer Navigation Back to Editorial Hub */}
      <section className="py-16 px-6 bg-[#070706] border-t border-[#2E2820] text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.25em] text-[#FAD6E3]/70 uppercase mb-3">CONTINUE EXPLORING</p>
          <Link
            href="/the-edit"
            className="inline-block border border-gold/40 text-gold hover:bg-gold hover:text-black px-8 py-3 text-xs font-bold tracking-[0.2em] transition-all uppercase"
          >
            &larr; Return to The Edit
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
