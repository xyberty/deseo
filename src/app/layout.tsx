import type { Metadata } from "next";
import { Open_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/app/components/Navbar";
import { Footer } from "@/app/components/Footer";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Deseo - Create and share your wishlists",
  description: "Create and share your wishlists with friends and family",
  icons: {
    icon: "/deseo-32x32.png",
    apple: "/deseo-180x180.png",
    shortcut: "/deseo-32x32.png",
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
