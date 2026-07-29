'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/assets/logo.png";
import {
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  PinIcon,
} from "lucide-react";

const GOLD = "#D4AF37";
const DEEP_GOLD = "#B8860B";
const SILVER = "#C8C8C8";
const GRAY = "#BFBFBF";
const PINK = "#FAD6E3";
const SERIF = "var(--font-serif), Georgia, serif";
const SANS = "var(--font-sans), Arial, sans-serif";

const quickLinks = [
  ["Home", "/"],
  ["Shop Collection", "/shop"],
  ["Collections", "/collections"],
  ["New Arrivals", "/shop?collection=new-arrivals"],
  ["Best Sellers", "/shop?collection=best-sellers"],
  ["About Us", "/about"],
];

const careLinks = [
  ["Shipping & Delivery", "/shipping"],
  ["Returns & Exchange", "/returns"],
  ["Size Guide", "/size-guide"],
  ["FAQ's", "/faqs"],
  ["Privacy Policy", "/privacy-policy"],
  ["Terms & Conditions", "/terms"],
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h3 className="viewora-footer-heading">{children}</h3>
      <div className="viewora-footer-ornament" aria-hidden="true"><span /></div>
    </>
  );
}

export default function Footer() {
  const socialLinks = [
    { label: "Instagram", icon: Instagram, href: "https://www.instagram.com/viewora.india/" },
    { label: "Facebook", icon: Facebook, href: "https://facebook.com" },
    { label: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
    { label: "Pinterest", icon: PinIcon, href: "https://pinterest.com" },
  ];

  return (
    <footer className="viewora-footer">
      <style>{`
        .viewora-footer { background: #000; color: ${SILVER}; font-family: ${SANS}; overflow: hidden; position: relative; }
        .viewora-footer::before { background: linear-gradient(90deg, ${PINK}, ${GOLD} 48%, ${PINK}); content: ""; height: 1px; left: 0; opacity: .9; position: absolute; right: 0; top: 0; }
        .viewora-footer-inner { margin: 0 auto; max-width: 1440px; padding: 68px 44px 0; position: relative; }
        .viewora-footer-grid { display: grid; grid-template-columns: 1.35fr 1fr 1.1fr 1.1fr; }
        .viewora-footer-column { min-width: 0; padding: 0 34px; }
        .viewora-footer-column:first-child { padding-left: 0; }
        .viewora-footer-column + .viewora-footer-column { border-left: 1px solid rgba(250, 214, 227, .62); }
        .viewora-footer-brand { align-items: center; display: flex; flex-direction: column; padding-right: 58px; text-align: center; }
        .viewora-mark { color: ${GOLD}; font-family: ${SERIF}; font-size: clamp(48px, 4.2vw, 71px); font-weight: 500; letter-spacing: -.16em; line-height: .75; margin-left: -.16em; }
        .viewora-brand-name { color: ${GOLD}; font-family: ${SERIF}; font-size: 28px; letter-spacing: .43em; margin: 19px 0 8px; padding-left: .43em; }
        .viewora-brand-subtitle { color: ${SILVER}; font-size: 10px; font-weight: 600; letter-spacing: .55em; padding-left: .55em; }
        .viewora-brand-rule { align-items: center; color: ${PINK}; display: flex; font-size: 18px; gap: 10px; margin: 35px 0 25px; width: 100%; }
        .viewora-brand-rule::before, .viewora-brand-rule::after { background: ${PINK}; content: ""; flex: 1; height: 1px; }
        .viewora-tagline { color: ${PINK}; font-family: ${SERIF}; font-size: 19px; line-height: 1.55; margin: 0; text-align: center; width: 100%; }
        .viewora-socials { display: flex; gap: 19px; margin-top: 28px; width: 100%; }
        .viewora-social { align-items: center; border: 1px solid rgba(250, 214, 227, .78); border-radius: 999px; color: ${PINK}; display: inline-flex; height: 43px; justify-content: center; transition: all .25s ease; width: 43px; }
        .viewora-social:hover { background: ${GOLD}; border-color: ${GOLD}; color: #000; transform: translateY(-3px); }
        .viewora-footer-heading { color: ${GOLD}; font-family: ${SERIF}; font-size: 19px; font-weight: 500; letter-spacing: .02em; margin: 14px 0 10px; white-space: nowrap; }
        .viewora-footer-ornament { align-items: center; color: ${PINK}; display: flex; font-size: 16px; gap: 7px; margin-bottom: 28px; width: 76px; }
        .viewora-footer-ornament::before, .viewora-footer-ornament::after { background: ${PINK}; content: ""; flex: 1; height: 1px; }
        .viewora-footer-ornament span::before { content: "✦"; }
        .viewora-footer-list { display: flex; flex-direction: column; gap: 17px; list-style: none; margin: 0; padding: 0; }
        .viewora-footer-link { color: ${GRAY}; font-size: 15px; line-height: 1.35; text-decoration: none; transition: color .2s ease; }
        .viewora-footer-link:hover { color: ${DEEP_GOLD}; }
        .viewora-contact-list { display: flex; flex-direction: column; gap: 20px; }
        .viewora-contact-item { align-items: center; color: ${SILVER}; display: flex; font-size: 15px; gap: 14px; line-height: 1.55; text-decoration: none; transition: color .2s ease; }
        .viewora-contact-item:hover { color: ${GOLD}; }
        .viewora-contact-icon-wrapper { align-items: center; border: 1px solid rgba(250, 214, 227, .78); border-radius: 999px; color: ${PINK}; display: inline-flex; height: 38px; width: 38px; flex: 0 0 38px; justify-content: center; transition: all .25s ease; }
        .viewora-contact-item:hover .viewora-contact-icon-wrapper { background: ${GOLD}; border-color: ${GOLD}; color: #000; }
        .viewora-footer-bottom { align-items: center; border-top: 1px solid rgba(250, 214, 227, .7); display: flex; justify-content: space-between; margin-top: 55px; min-height: 80px; padding: 20px 0; }
        .viewora-copyright { color: ${SILVER}; font-size: 14px; margin: 0; }
        .viewora-designed { align-items: center; color: ${SILVER}; display: inline-flex; font-size: 14px; gap: 6px; margin: 0; white-space: nowrap; }
        .viewora-heart { color: ${PINK}; fill: ${PINK}; height: 16px; width: 16px; flex-shrink: 0; display: inline-block; vertical-align: middle; }
        @media (max-width: 1100px) { .viewora-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 45px 0; } .viewora-footer-column { padding: 0 42px; } .viewora-footer-column:nth-child(odd) { border-left: 0; padding-left: 0; } .viewora-footer-brand { align-items: flex-start; padding-right: 42px; text-align: left; } .viewora-brand-name, .viewora-brand-subtitle { padding-left: 0; } .viewora-mark { margin-left: 0; } }
        @media (max-width: 640px) { .viewora-footer-inner { padding: 55px 25px 0; } .viewora-footer-grid { display: flex; flex-direction: column; gap: 38px; } .viewora-footer-column, .viewora-footer-column:first-child { border-left: 0; border-top: 1px solid rgba(250, 214, 227, .38); padding: 34px 0 0; } .viewora-footer-brand { align-items: center; border-top: 0 !important; padding-top: 0; text-align: center; } .viewora-brand-rule, .viewora-tagline, .viewora-socials { justify-content: center; } .viewora-tagline { text-align: center; } .viewora-footer-column:last-child { max-width: none; } .viewora-footer-heading { margin-top: 0; } .viewora-footer-bottom { flex-direction: column; gap: 12px; justify-content: center; margin-top: 40px; padding: 24px 0; text-align: center; } }
      `}</style>
      <div className="viewora-footer-inner">
        <div className="viewora-footer-grid">
          <section className="viewora-footer-column viewora-footer-brand" aria-label="Viewora">
            <Link href="/" aria-label="Viewora home" style={{ textDecoration: "none" }}>
              <Image src={logoImg} alt="Viewora" className="h-16 w-auto mx-auto mb-2 filter drop-shadow-md brightness-110" width={160} height={160} style={{ width: "auto" }} />
              <div className="viewora-brand-subtitle">FASHION EYEWEAR</div>
            </Link>
            <div className="viewora-brand-rule" aria-hidden="true">✦</div>
            <p className="viewora-tagline">Crafted for those who never<br />settle for ordinary.</p>

            <div className="viewora-socials">
              {socialLinks.map(({ label, icon: Icon, href }) => <a className="viewora-social" href={href} key={label} target="_blank" rel="noreferrer" aria-label={label}><Icon size={21} strokeWidth={2} /></a>)}
            </div>
          </section>

          <section className="viewora-footer-column"><FooterHeading>QUICK LINKS</FooterHeading><ul className="viewora-footer-list">{quickLinks.map(([label, href]) => <li key={label}><Link className="viewora-footer-link" href={href}>{label}</Link></li>)}</ul></section>
          <section className="viewora-footer-column"><FooterHeading>CUSTOMER CARE</FooterHeading><ul className="viewora-footer-list">{careLinks.map(([label, href]) => <li key={label}><Link className="viewora-footer-link" href={href}>{label}</Link></li>)}</ul></section>
          <section className="viewora-footer-column">
            <FooterHeading>CONTACT US</FooterHeading>
            <div className="viewora-contact-list">
              <a className="viewora-contact-item" href="tel:+919876543210">
                <div className="viewora-contact-icon-wrapper">
                  <Phone size={18} strokeWidth={1.8} />
                </div>
                <span>+91 98765 43210</span>
              </a>
              <a className="viewora-contact-item" href="mailto:contact@viewora.in">
                <div className="viewora-contact-icon-wrapper">
                  <Mail size={18} strokeWidth={1.8} />
                </div>
                <span>contact@viewora.in</span>
              </a>
              <div className="viewora-contact-item">
                <div className="viewora-contact-icon-wrapper">
                  <MapPin size={18} strokeWidth={1.8} />
                </div>
                <span>Bangalore, Karnataka<br />India 560001</span>
              </div>
            </div>
          </section>
        </div>
        <div className="viewora-footer-bottom">
          <p className="viewora-copyright">© 2026 Viewora. A product of <strong>Aspire Genx Technologies Private Limited</strong>. All rights reserved.</p>
          <p className="viewora-designed">
            Designed with <Heart className="viewora-heart" /> by Viewora
          </p>
        </div>
      </div>
    </footer>
  );
}
