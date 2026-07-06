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
        description="Cada módulo está diseñado para ayudarte a captar, organizar y dar seguimiento sin depender del caos operativo."
      />
      <PublicCTA
        title="Pasa de responder mensajes a operar con un sistema claro."
        description="Agenda Viva reúne booking público, agenda, clientes y seguimiento en una sola experiencia."
        secondaryHref="/soluciones"
        secondaryLabel="Ver soluciones"
      />
    </PublicPageShell>
  );
}
