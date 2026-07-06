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
        eyebrow="Plan listo para probar"
        title="Todo el plan gira alrededor de una agenda más ordenada."
        description="Si quieres verlo en acción antes de registrarte, abre el demo público y recorre la experiencia."
      />
    </PublicPageShell>
  );
}
