import type { Metadata } from "next";

import { PublicCTA } from "@/components/landing/final-cta";
import { ProductModulesSection } from "@/components/landing/product-modules-section";
import { PublicPageShell } from "@/components/landing/public-page-shell";
import { buildPublicMetadata } from "@/lib/brand";

export const metadata: Metadata = buildPublicMetadata({
  title: "Producto",
  description:
    "Conoce los módulos de Agenda Viva para reservas, agenda, clientes, profesionales, servicios, lista de espera y reportes.",
  path: "/producto",
});

export default function ProductPage() {
  return (
    <PublicPageShell>
      <ProductModulesSection
        title="Un producto pensado para operar reservas de principio a fin"
        description="Módulos claros para captar, organizar y dar seguimiento sin caos operativo."
      />
      <PublicCTA
        title="Opera reservas, agenda y seguimiento desde un solo lugar."
        description="Pasa de responder mensajes a trabajar con una base más clara y más vendible."
      />
    </PublicPageShell>
  );
}
