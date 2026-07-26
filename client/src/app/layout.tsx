import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import InquiryModal from "@/components/InquiryModal";

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Viewora — Premium Fashion Eyewear",
  description: "Viewora crafts premium fashion eyewear — handcrafted frames where elegance meets clarity.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Viewora — Premium Fashion Eyewear",
    description: "Handcrafted frames where elegance meets clarity.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-gold focus:text-background focus:text-xs focus:font-bold focus:tracking-widest focus:uppercase focus:rounded"
        >
          Skip to main content
        </a>
        <Providers>
          {children}
          <InquiryModal />
        </Providers>
      </body>
    </html>
  );
}

