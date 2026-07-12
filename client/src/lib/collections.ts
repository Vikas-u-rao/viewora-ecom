import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.png";
import p4 from "@/assets/p4.png";
import colSun from "@/assets/col-sunglasses.jpg";
import colOpt from "@/assets/col-optical.jpg";
import colLtd from "@/assets/col-limited.jpg";
import cateyeImg from "@/assets/styles/cateye.png";

import { StaticImageData } from "next/image";

const imgs = [p1, p2, p3, p4, colSun, colOpt, colLtd];

export type Product = { name: string; price: string; img: string | StaticImageData };
export type Collection = {
  slug: string;
  title: string;
  tagline: string;
  hero: string | StaticImageData;
  products: Product[];
};

const build = (names: string[], basePrice: number): Product[] =>
  names.map((name, i) => ({
    name,
    price: `₹${(basePrice + i * 220).toLocaleString("en-IN")}`,
    img: name === "Golden Cat-Eye" ? cateyeImg : imgs[i % imgs.length],
  }));

export const collections: Collection[] = [
  {
    slug: "sunglasses",
    title: "Sunglasses",
    tagline: "Bold shades for sun-drenched days",
    hero: colSun,
    products: build(
      [
        "Aurelia Aviator",
        "Noir Round",
        "Golden Cat-Eye",
        "Classic Wayfarer",
        "Havana Pilot",
        "Onyx Shield",
        "Sunset Oversize",
        "Midnight Square",
      ],
      1590
    ),
  },
  {
    slug: "optical-frames",
    title: "Optical Frames",
    tagline: "Everyday elegance for perfect vision",
    hero: colOpt,
    products: build(
      [
        "Milano Rectangle",
        "Rimless Titan",
        "Ivory Round",
        "Studio Cat-Eye",
        "Boston Classic",
        "Slate Metal",
        "Vienna Oval",
        "Modernist Square",
      ],
      1290
    ),
  },
  {
    slug: "limited-edition",
    title: "Limited Edition",
    tagline: "Rare pieces crafted in small batches",
    hero: colLtd,
    products: build(
      [
        "24K Gold Aviator",
        "Ebony & Brass",
        "Pearl Cat-Eye",
        "Ruby Rimless",
        "Obsidian Oversize",
        "Champagne Round",
        "Ivory Signature",
        "Nocturne Edition",
      ],
      3490
    ),
  },
  {
    slug: "premium-sunglasses",
    title: "Premium International Brands Sunglasses",
    tagline: "Icons from the world's top eyewear houses",
    hero: colSun,
    products: build(
      [
        "Rayban Metal Sunglasses",
        "Police Black Sunglass",
        "FILA Fancy Sunglasses",
        "Polaroid Unisex Sunglasses",
        "Allen Solly Wayfarer",
        "Rayban Aviator Classic",
        "Police Sport Shades",
        "Polaroid Polarized Round",
      ],
      2190
    ),
  },
  {
    slug: "signature-eyewear",
    title: "Viewora Signature Eyewear",
    tagline: "Our house label — designed in-studio",
    hero: colOpt,
    products: build(
      [
        "Viewora Signature Frame",
        "Jacob Marin Ladies Frame",
        "German Phillipe Wooden",
        "IGO Titanium Rimless",
        "Jacob Marin Polarized",
        "Viewora Heritage Oval",
        "Jacob Marin Cat-Eye",
        "IGO Ultralight Square",
      ],
      1890
    ),
  },
  {
    slug: "luxury-eyewear",
    title: "Luxury Branded Eyewear",
    tagline: "Statement pieces from the world's finest ateliers",
    hero: colLtd,
    products: build(
      [
        "Maybach Premium Eyewear",
        "Mont Blanc Rimless",
        "Silhouette 23K Golden",
        "Versace Premium Sunglass",
        "Cutler Gross Sunglass",
        "Maybach Diamond Series",
        "Mont Blanc Meisterstück",
        "Silhouette Titan Minimal",
      ],
      5990
    ),
  },
  {
    slug: "premium-eyewear",
    title: "Premium International Brand Eyewear",
    tagline: "Designer frames for daily wear",
    hero: colOpt,
    products: build(
      [
        "Tommy Hilfiger Eyeglasses",
        "Emporio Armani Clip-On",
        "Rayban Unisex Eyewear",
        "Jimmy Choo Sunglasses",
        "Montblanc Eyewear",
        "Tommy Hilfiger Round",
        "Armani Classic Square",
        "Jimmy Choo Glam Cat-Eye",
      ],
      2490
    ),
  },
];

export const getCollection = (slug: string) =>
  collections.find((c) => c.slug === slug);
