'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";

// Import local logo asset
import logoImg from "@/assets/logo.png";

// Constants from the redesign project
const GOLD = "#C9A84C";
const GOLD_FAINT = "rgba(201,168,76,0.08)";
const GOLD_SUBTLE = "rgba(201,168,76,0.15)";
const GOLD_MID = "rgba(201,168,76,0.25)";
const GOLD_STRONG = "rgba(201,168,76,0.40)";
const TEXT_MUTED = "#7A6E60";
const TEXT_FAINT = "#4A4035";
const TEXT_GHOST = "#2E2820";

const SANS = "var(--font-sans), 'Inter', sans-serif";
const CAPS = "'Montserrat', sans-serif";

function capsLabel(text: string, extraStyle?: React.CSSProperties) {
  return (
    <span
      style={{
        fontFamily: CAPS,
        fontSize: "14px",
        letterSpacing: "0.22em",
        color: GOLD,
        fontWeight: 600,
        ...extraStyle,
      }}
    >
      {text}
    </span>
  );
}

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/#about" },
    { name: "Collections", href: "/#collections" },
    { name: "Shop", href: "/shop" },
    { name: "Socials", href: "/socials" }
  ];

  const collectionLinks = [
    { name: "Sunglasses", href: "/shop?type=sunglasses" },
    { name: "Optical Frames", href: "/shop?type=optical-frames" },
    { name: "Limited Edition", href: "/shop?collection=limited-edition" },
    { name: "New Arrivals", href: "/shop?collection=new-arrivals" },
    { name: "Best Sellers", href: "/shop?collection=best-sellers" }
  ];

  const socialLinks = [
    { icon: <Instagram size={20} />, href: "https://www.instagram.com/viewora.india/" },
    { icon: <Facebook size={20} />, href: "https://facebook.com" },
    { icon: <Twitter size={20} />, href: "https://twitter.com" },
    { icon: <Youtube size={20} />, href: "https://youtube.com" }
  ];

  return (
    <footer style={{ position: "relative", overflow: "hidden", marginTop: "auto" }}>
      {/* Warm charcoal gradient — the core footer treatment */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #1A1714 0%, #13110E 45%, #0D0B09 100%)",
        }}
      />

      {/* Ambient gold glow from top-center */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "280px",
          background: `radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.065) 0%, transparent 68%)`,
          pointerEvents: "none",
        }}
      />

      {/* Thin gold hairline separator at top */}
      <div
        style={{
          position: "relative",
          height: "1px",
          background: `linear-gradient(90deg, transparent 0%, ${GOLD_MID} 30%, ${GOLD_STRONG} 50%, ${GOLD_MID} 70%, transparent 100%)`,
        }}
      />

      <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "0 40px" }}>
        {/* Main grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "48px",
            padding: "72px 0 56px",
          }}
        >
          {/* Brand column */}
          <div style={{ minWidth: "260px", flex: "1 1 260px" }}>
            <Link href="/" style={{ display: "inline-block" }}>
              <Image src={logoImg} alt="Viewora Logo" height={44} width={180} style={{ width: "auto", height: "44px" }} />
            </Link>
            <p
              style={{
                marginTop: "18px",
                fontFamily: SANS,
                fontSize: "17px",
                lineHeight: 1.75,
                color: TEXT_MUTED,
                maxWidth: "280px",
              }}
            >
              Premium fashion eyewear crafted for elegance, comfort, and bold individuality.
            </p>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              {socialLinks.map((s, index) => (
                <a
                  key={index}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${GOLD_SUBTLE}`,
                    borderRadius: "4px",
                    color: TEXT_MUTED,
                    transition: "all 0.25s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = GOLD;
                    el.style.color = GOLD;
                    el.style.backgroundColor = "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = GOLD_SUBTLE;
                    el.style.color = TEXT_MUTED;
                    el.style.backgroundColor = "transparent";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ minWidth: "160px" }}>
            <div style={{ marginBottom: "24px" }}>{capsLabel("QUICK LINKS", { color: GOLD })}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: SANS,
                      fontSize: "17px",
                      color: TEXT_MUTED,
                      textDecoration: "none",
                      transition: "color 0.2s",
                      display: "inline-block"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = TEXT_MUTED;
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div style={{ minWidth: "160px" }}>
            <div style={{ marginBottom: "24px" }}>{capsLabel("COLLECTIONS", { color: GOLD })}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
              {collectionLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: SANS,
                      fontSize: "17px",
                      color: TEXT_MUTED,
                      textDecoration: "none",
                      transition: "color 0.2s",
                      display: "inline-block"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = TEXT_MUTED;
                    }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div style={{ minWidth: "220px" }}>
            <div style={{ marginBottom: "24px" }}>{capsLabel("CONTACT", { color: GOLD })}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              {[
                { label: "EMAIL", value: "support@viewora.in" },
                { label: "PHONE", value: "+1 (800) 234 5678" },
                { label: "HOURS", value: "Mon – Sat, 10am – 7pm" },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ fontFamily: SANS, fontSize: "13px", letterSpacing: "0.18em", color: GOLD, marginBottom: "6px", fontWeight: 500 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: "17px", color: TEXT_MUTED }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gold gradient divider */}
        <div
          style={{
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${GOLD_SUBTLE}, transparent)`,
          }}
        />

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            padding: "24px 0",
          }}
        >
          <p style={{ fontFamily: SANS, fontSize: "13px", letterSpacing: "0.14em", color: TEXT_MUTED, fontWeight: 500 }}>
            © 2026 VIEWORA — FASHION ON EYEWEAR. ALL RIGHTS RESERVED.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Returns & Refunds"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontFamily: SANS,
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  color: TEXT_MUTED,
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#FFFFFF")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = TEXT_MUTED)}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
