"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

import { ArrowRight } from "lucide-react";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import view1 from "@/assets/view1.jpg";
import view2 from "@/assets/view2.jpg";
import view3 from "@/assets/view3.jpg";
import view4 from "@/assets/view4.jpg";
import view5 from "@/assets/view5.jpg";
import logo from "@/assets/logo.png";
import promoBannerImg from "@/assets/IMG-20260725-WA0085.jpg";

// Import style images
import wayfarerImg from "@/assets/styles/wayfarer.png";
import aviatorImg from "@/assets/styles/aviator.png";
import cateyeImg from "@/assets/styles/cateye.png";
import roundImg from "@/assets/styles/round.png";
import rectangleImg from "@/assets/styles/rectangle.png";
import squareImg from "@/assets/styles/square.png";
import rimlessImg from "@/assets/styles/rimless.png";
import semirimlessImg from "@/assets/styles/semirimless.png";
import oversizedImg from "@/assets/styles/oversized.png";
import geometricImg from "@/assets/styles/geometric.png";

const collections = [
  {
    title: "Sunglasses",
    desc: "Bold, sun-ready frames for every face and every occasion.",
    img: colSun,
    slug: "sunglasses",
  },
  {
    title: "Optical Frames",
    desc: "Refined prescription frames designed for clarity and comfort.",
    img: colOpt,
    slug: "optical-frames",
  },
  {
    title: "Limited Edition",
    desc: "Rare, small-batch pieces reserved for the true collector.",
    img: colLtd,
    slug: "limited-edition",
  },
];

const frameStyles = [
  { name: "Wayfarer", img: wayfarerImg, slug: "wayfarer" },
  { name: "Aviator", img: aviatorImg, slug: "aviator" },
  { name: "Cat Eye", img: cateyeImg, slug: "cat-eye" },
  { name: "Round", img: roundImg, slug: "round" },
  { name: "Rectangle", img: rectangleImg, slug: "rectangle" },
  { name: "Square", img: squareImg, slug: "square" },
  { name: "Rimless", img: rimlessImg, slug: "rimless" },
  { name: "Semi-Rimless", img: semirimlessImg, slug: "semi-rimless" },
  { name: "Oversized", img: oversizedImg, slug: "oversized" },
  { name: "Geometric", img: geometricImg, slug: "geometric" },
];

export default function Home() {
  const slides = [
    { image: view1, alt: "Viewora Campaign 1", focal: "50% 20%", scale: "scale-100 lg:scale-[1.08]" },
    { image: view2, alt: "Viewora Campaign 2", focal: "50% 55%", scale: "scale-[1.3] lg:scale-[1.4]" },
    { image: view3, alt: "Viewora Campaign 3", focal: "50% 20%", scale: "scale-[1.1] lg:scale-[1.18]" },
    { image: view4, alt: "Viewora Campaign 4", focal: "50% 20%", scale: "scale-[1.15] lg:scale-[1.25]" },
    { image: view5, alt: "Viewora Campaign 5", focal: "50% 25%", scale: "scale-[1.15] lg:scale-[1.25]" },
  ];
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [frameApi, setFrameApi] = useState<CarouselApi>();

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  useEffect(() => {
    if (!frameApi) return;
    const timer = setInterval(() => {
      frameApi.scrollNext();
    }, 2500);
    return () => clearInterval(timer);
  }, [frameApi]);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in duration-300">
      <Header />

      {/* Hero Section - Split Layout */}
      <section
        id="main-content"
        className="relative w-full overflow-hidden bg-black text-white"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid min-h-[560px] grid-rows-[auto_1fr] lg:min-h-screen lg:grid-cols-2 lg:grid-rows-1">
          {/* Left Column - Text Content */}
          <div className="relative z-10 flex flex-col justify-center px-6 pb-10 pt-28 sm:px-10 lg:px-16 lg:py-32 xl:px-24">
            <h1 className="max-w-xl text-balance font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-normal leading-[1.08] tracking-tight text-white">
              See the World in <span className="italic uppercase text-gold drop-shadow-[0_0_20px_rgba(197,160,89,0.65)]">GOLD</span>
            </h1>

            <p className="mt-7 max-w-md text-pretty text-sm sm:text-base leading-relaxed text-[#C8C8C8] font-sans">
              Luxury eyewear crafted with premium materials, designed for everyday comfort and timeless elegance.
            </p>

            <div className="mt-10">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-gold px-9 py-4 text-xs font-bold uppercase tracking-[0.25em] text-background transition-colors hover:bg-gold-soft hover:shadow-[0_0_30px_rgba(197,160,89,0.45)]"
              >
                <span>SHOP NOW</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </Link>
            </div>

            {/* Slide controls */}
            <div className="mt-12 flex items-center gap-3" role="tablist" aria-label="Carousel slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === activeSlide}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setActiveSlide(i)}
                  className="group py-2 cursor-pointer"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all duration-300 ${
                      i === activeSlide
                        ? "w-10 bg-gold"
                        : "w-5 bg-white/25 group-hover:bg-white/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Full Photograph with Standardized Crop & Seam Gradient */}
          <div className="relative min-h-[420px] sm:min-h-[540px] overflow-hidden lg:min-h-full h-full w-full">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 w-full h-full overflow-hidden transition-opacity duration-1000 ease-in-out ${
                  idx === activeSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  style={{ objectPosition: slide.focal }}
                  className={`object-cover w-full h-full transform ${slide.scale} transition-transform duration-700 ease-out`}
                  priority={idx === 0}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                />
              </div>
            ))}

            {/* Left seam gradient overlay - blends left edge only into black text panel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black lg:via-black/40 lg:to-transparent z-10"
            />
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section id="collections" className="py-20 px-6 bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">OUR COLLECTIONS</p>
            <h2 className="text-4xl font-normal">Crafted for All Generations</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((c) => (
              <Link key={c.title} href={`/collections/${c.slug}`} className="group relative overflow-hidden aspect-[4/5] block border border-border/40">
                <Image src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" width={800} height={900} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-2xl text-gold mb-2">{c.title}</h3>
                  <p className="text-sm text-white/80 mb-4 max-w-[85%] leading-relaxed font-sans">{c.desc}</p>
                  <span className="text-sm tracking-[0.2em] text-white">VIEW COLLECTION →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Frame Styles Section */}
      <section id="shop" className="py-20 px-6 border-t border-border bg-background">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold tracking-[0.3em] text-xs mb-4">CURATED DESIGNS</p>
            <h2 className="text-4xl font-normal">Shop by Frame</h2>
            <div className="h-[1px] w-24 bg-gold/40 mx-auto mt-4"></div>
          </div>
          <Carousel setApi={setFrameApi} opts={{ align: "start", loop: true }} className="px-4">
            <CarouselContent>
              {frameStyles.map((s) => (
                <CarouselItem key={s.name} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <Link
                    href={`/shop?shape=${s.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden border border-border/50 hover:border-gold transition-colors duration-500 bg-black"
                  >
                    <Image
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
                      <h3 className="text-xl font-serif text-white mb-2 group-hover:text-gold transition-colors">{s.name}</h3>
                      <span className="text-xs tracking-[0.2em] text-gold uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        EXPLORE →
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-background relative overflow-hidden">
        {/* Subtle radial gold glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-gold tracking-[0.35em] text-xs font-semibold uppercase mb-3">
            THE VIEWORA STORY
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif mb-8 leading-tight text-white">
            <span className="text-gold font-semibold drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]">Redefining Eyewear</span> with <span className="italic text-gold">Gold Distinction</span>
          </h2>

          <div className="mb-8 inline-block">
            <Image src={logo} alt="Viewora" className="h-24 w-auto mx-auto" style={{ width: "auto", height: "auto" }} loading="lazy" width={288} height={288} />
          </div>
          <div className="h-[1px] w-20 bg-gold/30 mx-auto mb-8" />
          <p className="text-xl font-serif leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-8">
            At <span className="text-gold font-semibold">Viewora</span>, every frame is a statement of timeless style, crafted for those who see life with clarity and class.
          </p>
          <Link href="/about" className="inline-block border border-gold/40 text-gold px-8 py-3 text-xs font-bold tracking-[0.2em] hover:bg-gold hover:text-black transition-all uppercase">
            Read Our Story &rarr;
          </Link>
        </div>
      </section>

      {/* Promotional Banner Section */}
      <section className="w-full bg-black py-10 px-6">
        <div className="max-w-[1200px] mx-auto overflow-hidden rounded-2xl border border-gold/20 shadow-2xl">
          <Image
            src={promoBannerImg}
            alt="Viewora Luxury Eyewear Collection"
            className="w-full h-auto block"
            loading="lazy"
            quality={95}
          />
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="contact" className="py-20 px-6 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl mb-4 font-serif">
            Join the <span className="text-gold font-bold drop-shadow-[0_0_15px_rgba(197,160,89,0.85)] motion-safe:animate-pulse uppercase">Viewora</span> Community
          </h2>
          <p className="text-muted-foreground mb-8 text-lg font-sans">Subscribe for exclusive offers, early access, and style updates.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
