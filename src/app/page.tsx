import type { Metadata } from "next";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { BusinessTypesSection } from "@/components/landing/clinic-types";
import { PublicCTA } from "@/components/landing/final-cta";
import { PublicHero } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { PublicPageShell } from "@/components/landing/public-page-shell";
import { buildPublicMetadata } from "@/lib/brand";

export const metadata: Metadata = buildPublicMetadata({
  description:
    "Agenda Viva ayuda a negocios de servicios a recibir reservas, reducir ausencias y recuperar horarios liberados.",
  path: "/",
});

export default function HomePage() {
  return (
    <PublicPageShell>
      <PublicHero />
      <BenefitsSection />
      <HowItWorksSection />
      <BusinessTypesSection
        eyebrow="Tipos de negocio"
        title="Una plataforma para negocios que viven de su agenda"
        description="Conoce algunos de los modelos de negocio que Agenda Viva puede ayudar a ordenar."
        limit={6}
        showViewAllLink
      />
      <PublicCTA
        title="Haz que reservar sea más simple para tu negocio y para tus clientes."
        description="Empieza con una página clara, una agenda ordenada y una operación más comercial."
      />
    </PublicPageShell>
  );
}
