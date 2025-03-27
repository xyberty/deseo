import type { Metadata } from "next";
import { Open_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/app/components/Navbar";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSans.variable} ${montserrat.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col" data-slot="root">
          <Navbar />
          <main className="flex-1" data-slot="main">
            {children}
          </main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
