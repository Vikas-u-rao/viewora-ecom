import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import logoImg from "@/assets/logo.png";
import view1 from "@/assets/view1.jpg";
import campaign3 from "@/assets/IMG_0985.jpg";
import { ShieldCheck, Sparkles, Eye, Award } from "lucide-react";

export const metadata = {
  title: "About Us | Viewora Luxury Eyewear",
  description: "Discover the story, craftsmanship, and vision behind Viewora high-end fashion eyewear.",
};

export default function AboutPage() {
  const values = [
    {
      icon: Sparkles,
      title: "Timeless Elegance",
      description: "Every frame is meticulously sculpted to combine classic aesthetics with modern refinement.",
    },
    {
      icon: ShieldCheck,
      title: "Uncompromising Quality",
      description: "Crafted using premium acetate, titanium, and UV400 protective lenses engineered for durability.",
    },
    {
      icon: Eye,
      title: "Precision Vision",
      description: "Optimal optical clarity designed for everyday comfort, screen protection, and sun defense.",
    },
    {
      icon: Award,
      title: "Curated Luxury",
      description: "Exclusive small-batch designs made for individuals who express unique character through style.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 bg-black overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={view1}
            alt="Viewora Luxury Craftsmanship"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/70 to-black/90" />

        <div className="relative z-10 max-w-4xl mx-auto text-center pt-8">
          <p className="text-gold tracking-[0.4em] text-xs mb-4 font-semibold uppercase">THE VIEWORA STORY</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight text-white mb-6">
            Redefining Eyewear with <span className="text-gold font-bold italic">Gold</span> Distinction
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed font-sans max-w-2xl mx-auto font-light">
            Founded with a passion for architectural precision and haute couture aesthetics, Viewora creates luxury frames that transform how you see the world.
          </p>
        </div>
      </section>

      {/* Brand Heritage Section */}
      <section className="py-24 px-6 bg-background relative">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-gold tracking-[0.3em] text-xs uppercase font-semibold">Craftsmanship & Vision</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal leading-snug">
              Sculpted for those who demand sophistication
            </h2>
            <div className="h-[1px] w-20 bg-gold/40" />
            <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
              At Viewora, eyewear is more than an accessory—it is an emblem of identity. Our design philosophy bridges heritage craftsmanship with contemporary ergonomics, ensuring that every silhouette delivers effortless poise.
            </p>
            <p className="text-muted-foreground font-sans leading-relaxed text-sm sm:text-base">
              From our hand-polished acetate frames to lightweight metal alloys, every element undergoes rigorous quality checks to deliver unmatched clarity, sun protection, and style.
            </p>
            <div className="pt-4">
              <Link
                href="/shop"
                className="inline-block bg-gold text-background px-8 py-3.5 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-all duration-300 uppercase"
              >
                Explore Collection
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] rounded-sm overflow-hidden border border-gold/20 shadow-2xl">
            <Image
              src={campaign3}
              alt="Viewora Heritage"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-center">
              <Image
                src={logoImg}
                alt="Viewora"
                width={160}
                height={40}
                className="h-10 w-auto mx-auto filter drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-20 px-6 bg-card border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs mb-3 font-semibold uppercase">OUR PILLARS</p>
            <h2 className="text-3xl sm:text-4xl font-serif">Why Choose Viewora</h2>
            <div className="h-[1px] w-20 bg-gold/40 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v, i) => (
              <div
                key={i}
                className="p-8 border border-border/60 bg-background/50 hover:border-gold/50 transition-all duration-300 text-center group"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 text-gold mb-6 group-hover:scale-110 transition-transform">
                  <v.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-serif mb-3 text-white group-hover:text-gold transition-colors">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 bg-background text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-serif text-white">Find Your Perfect Pair</h2>
          <p className="text-muted-foreground font-sans text-sm sm:text-base">
            Explore our curated catalog of luxury sunglasses, optical frames, and limited-edition releases.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-block bg-gold text-background px-10 py-4 text-xs font-bold tracking-[0.2em] hover:bg-gold-soft transition-all duration-300 uppercase"
            >
              Shop All Eyewear
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
