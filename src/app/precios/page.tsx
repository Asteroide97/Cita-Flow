import type { Metadata } from "next";

import { PublicCTA } from "@/components/landing/final-cta";
import { PricingSection } from "@/components/landing/pricing-section";
import { PublicPageShell } from "@/components/landing/public-page-shell";
import { buildPublicMetadata } from "@/lib/brand";

export const metadata: Metadata = buildPublicMetadata({
  title: "Precios",
  description:
    "Agenda Viva Pro cuesta $13 USD al mes e incluye reservas online, agenda, clientes, profesionales, servicios, lista de espera y reportes básicos.",
  path: "/precios",
});

export default function PricingPage() {
  return (
    <PublicPageShell>
      <PricingSection />
      <PublicCTA
        title="Empieza con una base simple y comercial."
        description="Agenda Viva Pro reúne lo esencial para vender mejor y operar con menos fricción."
        secondaryHref="/faq"
        secondaryLabel="Ver FAQ"
      />
    </PublicPageShell>
  );
}
