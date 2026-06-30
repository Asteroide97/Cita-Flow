import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CitaFlow | Reservas médicas para consultorios y clínicas",
  description:
    "Landing pública de CitaFlow, una plataforma SaaS para reservas, recordatorios y anticipos en consultorios y clínicas.",
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
