import type { Metadata } from "next";

import { FAQSection } from "@/components/landing/faq-section";
import { PublicCTA } from "@/components/landing/final-cta";
import { PublicPageShell } from "@/components/landing/public-page-shell";
import { buildPublicMetadata } from "@/lib/brand";

export const metadata: Metadata = buildPublicMetadata({
  title: "FAQ",
  description:
    "Resuelve dudas frecuentes sobre reservas, anticipos, profesionales, clientes y operación en Agenda Viva.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <PublicPageShell>
      <FAQSection />
      <PublicCTA
        title="Cuando quieras, puedes pasar de la duda a la prueba."
        description="Explora el producto, mira el demo y decide si Agenda Viva encaja con tu operación."
      />
    </PublicPageShell>
  );
}
