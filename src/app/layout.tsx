import type { Metadata } from "next";
import { Open_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";
import { GoogleAnalytics } from "@/app/components/GoogleAnalytics";
import { getServerBaseUrl } from "./lib/constants";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const baseUrl = getServerBaseUrl()

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Deseo - Create and share your wishlists",
    template: "%s | Deseo"
  },
  description: "Create and share your wishlists with friends and family. A simple, elegant way to manage your gift lists and let others know what you'd love to receive.",
  keywords: ["wishlist", "gift list", "birthday wishlist", "christmas wishlist", "gift registry", "wish list app"],
  authors: [{ name: "Discreto", url: "https://discreto.art" }],
  creator: "Discreto",
  publisher: "Discreto",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/deseo-32x32.png",
    apple: "/deseo-180x180.png",
    shortcut: "/deseo-32x32.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Deseo",
    title: "Deseo - Create and share your wishlists",
    description: "Create and share your wishlists with friends and family. A simple, elegant way to manage your gift lists.",
    images: [
      {
        url: `${baseUrl}/deseo-512x512.png`,
        width: 512,
        height: 512,
        alt: "Deseo Logo",
      },
      // Square image for WhatsApp (preferred 1:1 ratio)
      {
        url: `${baseUrl}/deseo-512x512.png`,
        width: 512,
        height: 512,
        alt: "Deseo Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deseo - Create and share your wishlists",
    description: "Create and share your wishlists with friends and family. A simple, elegant way to manage your gift lists.",
    images: [`${baseUrl}/deseo-512x512.png`],
  },
  // Additional platform-specific meta tags
  // Open Graph covers: Facebook, WhatsApp, VK.com, OK.ru, LinkedIn, Telegram, and many others
  // Twitter Cards covers: Twitter/X
  other: {
    // VK.com specific tags (optional, OG tags work but these provide additional control)
    'vk:image': `${baseUrl}/deseo-512x512.png`,
    // OK.ru specific tags (optional, OG tags work but these provide additional control)
    'ok:image': `${baseUrl}/deseo-512x512.png`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${montserrat.variable}`}>
      <body className="bg-background font-sans antialiased">
        <GoogleAnalytics />
        <div className="flex min-h-screen flex-col items-center" data-slot="root">
          <div className="container w-full flex-1 flex flex-col">
            <Navbar />
            <main className="lg:max-w-4xl max-w-full mx-auto w-full py-4 sm:py-6 lg:py-8" data-slot="main">
              {children}
            </main>
          </div>
          <Footer />
          <Toaster />
        </div>
      </body>
    </html>
  );
}
