import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agenda Viva | Reservas para negocios de servicios",
  description:
    "Agenda Viva automatiza reservas, recordatorios y horarios liberados para negocios de servicios.",
  openGraph: {
    title: "Agenda Viva | Reservas para negocios de servicios",
    description:
      "Agenda Viva automatiza reservas, recordatorios y horarios liberados para negocios de servicios.",
    siteName: "Agenda Viva",
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
