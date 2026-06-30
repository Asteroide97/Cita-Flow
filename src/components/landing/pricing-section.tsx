import { pricingFeatures } from "@/data/landing";

import { ButtonLink } from "../ui/button-link";
import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function PricingSection() {
  return (
    <SectionShell id="precios" className="bg-white/65">
      <SectionHeading
        eyebrow="Precios"
        title="Un solo plan. Sin sorpresas."
        description="Empieza con la base que necesita un consultorio moderno para reservar, confirmar, cobrar anticipos y mantener la agenda funcionando."
        align="center"
      />

      <div className="mx-auto mt-14 max-w-4xl rounded-[36px] border border-line bg-white p-8 shadow-float sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              CitaFlow Pro
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-[-0.08em] text-ink sm:text-6xl">
                $13
              </span>
              <span className="pb-2 text-lg text-muted">USD / mes</span>
            </div>

            <p className="mt-5 text-base leading-8 text-muted">
              Ideal para consultorios y clínicas que quieren ordenar reservas sin
              agregar complejidad ni costos ocultos.
            </p>

            <ButtonLink href="#cta" className="mt-8 w-full sm:w-auto">
              Empezar ahora
            </ButtonLink>

            <p className="mt-4 text-sm text-muted">
              Puedes cambiar o cancelar cuando quieras.
            </p>
          </div>

          <div className="rounded-[28px] border border-line bg-slate-50/80 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Incluye
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {pricingFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-[22px] border border-white bg-white p-4"
                >
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-6 text-ink">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
