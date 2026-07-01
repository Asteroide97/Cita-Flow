import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CitaFlow | Reservas para negocios de servicios",
  description:
    "Landing pública de CitaFlow, una plataforma SaaS para reservas, recordatorios y anticipos en negocios de servicios.",
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
