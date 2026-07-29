'use client';

import Header from "@/components/header";
import Footer from "@/components/footer";

const socialLinks = [
  {
    name: "Instagram",
    username: "@viewora.india",
    href: "https://www.instagram.com/viewora.india/",
    description: "Daily style inspiration and exclusive product reveals.",
    icon: (
      <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    name: "Facebook",
    username: "Viewora Eyewear",
    href: "https://facebook.com",
    description: "Connect with our community and read client reviews.",
    icon: (
      <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    )
  },
  {
    name: "X",
    username: "@vieworaIndia",
    href: "https://x.com/vieworaIndia",
    description: "Real-time updates, design announcements, and runway news.",
    icon: (
      <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    name: "YouTube",
    username: "@vieworaIndia",
    href: "https://www.youtube.com/@vieworaIndia",
    description: "Behind-the-scenes craftsmanship and campaign highlights.",
    icon: (
      <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="none" />
      </svg>
    )
  },
  {
    name: "WhatsApp",
    username: "+1 (555) 234-5678",
    href: "https://whatsapp.com",
    description: "Direct access to our 24/7 personal shopping assistants.",
    icon: (
      <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  }
];

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <Header />

      <main className="flex-1 py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-gold tracking-[0.35em] text-xs mb-3 sm:mb-4 font-medium uppercase">CONNECT WITH US</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal mb-4 sm:mb-6">Our Social Circle</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-sans px-2">
            Step into the luxury world of Viewora. Follow our channels for exclusive style guidelines, early releases, and behind-the-scene stories.
          </p>
          <div className="h-[1px] w-20 sm:w-24 bg-gold/40 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block p-5 sm:p-8 border border-border bg-card/45 hover:border-gold hover:shadow-[0_0_20px_rgba(197,160,89,0.15)] transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-start gap-6">
                <div className="p-3.5 bg-black border border-gold/10 group-hover:border-gold/40 transition-colors duration-300 rounded-none shrink-0">
                  {social.icon}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors duration-200">{social.name}</h3>
                    <span className="text-xs font-mono text-gold/70">{social.username}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed font-sans">{social.description}</p>
                  <span className="inline-block text-xs font-bold tracking-widest text-white/90 group-hover:text-gold uppercase transition-colors pt-2">
                    CONNECT →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
