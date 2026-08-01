"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import NewsletterForm from "@/components/NewsletterForm";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import view1 from "@/assets/view1.jpg";
import view2 from "@/assets/view2.jpg";
import view3 from "@/assets/view3.jpg";
import view4 from "@/assets/view4.jpg";
import view5 from "@/assets/view5.jpg";
import logo from "@/assets/logo.png";
import promoBannerImg from "@/assets/promo-banner-new.webp";

// Import style images
import wayfarerImg from "@/assets/styles/wayfarer.webp";
import aviatorImg from "@/assets/styles/aviator.webp";
import roundImg from "@/assets/styles/round.webp";

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
  { name: "Round", img: roundImg, slug: "round" },
];

export default function Home() {
  const slides = [
    { image: view1, alt: "Viewora Campaign 1", focal: "center center" },
    { image: view2, alt: "Viewora Campaign 2", focal: "50% 65%" },
    { image: view3, alt: "Viewora Campaign 3", focal: "center center" },
    { image: view4, alt: "Viewora Campaign 4", focal: "center center" },
    { image: view5, alt: "Viewora Campaign 5", focal: "center center" },
  ];

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [frameApi, setFrameApi] = useState<CarouselApi>();

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section - Full Screen Viewport */}
      <section
        id="main-content"
        className="relative w-full h-screen overflow-hidden bg-black text-white flex items-center justify-center pt-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image Carousel with Smooth Crossfade */}
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? "opacity-75 z-0" : "opacity-0 -z-10"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={idx === 0}
              className="object-cover"
              style={{ objectPosition: slide.focal }}
              sizes="100vw"
            />
          </div>
        ))}

        {/* Soft Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />

        {/* Hero Content - Lower Third positioning below sunglasses */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 pb-20 pt-auto text-center flex flex-col items-center justify-end h-full">
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-white max-w-2xl mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            See the World in <span className="text-[#c5a059] italic font-semibold drop-shadow-[0_0_20px_rgba(197,160,89,0.5)]">GOLD</span>
          </h1>

          <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed font-sans max-w-lg mx-auto font-light mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Luxury eyewear crafted with premium materials, designed for everyday comfort and timeless elegance.
          </p>

          <div>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-[#c5a059] px-9 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-black transition-all hover:bg-[#d8b46e] hover:shadow-[0_0_25px_rgba(197,160,89,0.5)]"
            >
              <span>SHOP NOW</span>
            </Link>
          </div>

          {/* Centered Slide Dots */}
          <div className="mt-8 flex items-center gap-3" role="tablist" aria-label="Carousel slides">
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
                      ? "w-8 bg-[#c5a059]"
                      : "w-3 bg-white/30 group-hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
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
              <Link
                key={c.title}
                href={`/collections/${c.slug}`}
                className="group relative overflow-hidden aspect-[4/5] block border border-border/40 bg-black/90 hover:border-gold/60 transition-all duration-500 rounded-2xl shadow-xl"
              >
                {/* Product Image - Vertically centered with Pop-Up effect */}
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

                {/* Subtle Bottom Gradient for Content Readability */}
                <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                {/* Content Container - Reserved for Bottom 30-35% */}
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
                    className="group relative block aspect-[3/4] overflow-hidden border border-border/50 hover:border-gold transition-all duration-500 bg-black rounded-2xl shadow-lg"
                  >
                    <Image
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-contain transition-all duration-500 ease-out transform group-hover:scale-110 group-hover:-translate-y-2 filter group-hover:drop-shadow-[0_12px_20px_rgba(197,160,89,0.3)]"
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
            <span className="text-gold font-semibold drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]">Redefining Eyewear</span> with <span className="italic text-gold">Gold Craftsmanship</span>
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
      <section className="w-full bg-black py-6 px-6">
        <div className="max-w-[800px] mx-auto overflow-hidden rounded-2xl border border-gold/20 shadow-2xl">
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
