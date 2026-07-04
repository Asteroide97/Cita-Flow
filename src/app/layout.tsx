import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { brand } from "@/lib/brand";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.appUrl),
  title: brand.metaTitle,
  description: brand.metaDescription,
  openGraph: {
    title: brand.metaTitle,
    description: brand.metaDescription,
    siteName: brand.name,
    url: brand.appUrl,
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} font-sans`}>{children}</body>
    </html>
  );
}
