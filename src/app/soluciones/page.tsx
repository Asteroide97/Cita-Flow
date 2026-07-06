import type { Metadata } from "next";

import { BusinessTypesSection } from "@/components/landing/clinic-types";
import { PublicCTA } from "@/components/landing/final-cta";
import { PublicPageShell } from "@/components/landing/public-page-shell";
import { buildPublicMetadata } from "@/lib/brand";

export const metadata: Metadata = buildPublicMetadata({
  title: "Soluciones",
  description:
    "Agenda Viva se adapta a clínicas, salones, spas, barberías, veterinarias, clases y otros negocios de servicios.",
  path: "/soluciones",
});

export default function SolutionsPage() {
  return (
    <PublicPageShell>
      <BusinessTypesSection
        eyebrow="Soluciones"
        title="Elige el tipo de negocio que quieres ordenar mejor"
        description="Agenda Viva funciona para operaciones que dependen de disponibilidad, recordatorios y menos huecos perdidos."
      />
      <PublicCTA
        title="Tu negocio también puede reservar mejor."
        description="Si vives de tu agenda, Agenda Viva te ayuda a operar con más orden y menos seguimiento manual."
        secondaryHref="/producto"
        secondaryLabel="Ver producto"
      />
    </PublicPageShell>
  );
}
