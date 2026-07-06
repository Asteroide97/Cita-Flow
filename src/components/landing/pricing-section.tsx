import { pricingFeatures } from "@/data/landing";
import { brand } from "@/lib/brand";

import { ButtonLink } from "../ui/button-link";
import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function PricingSection() {
  return (
    <SectionShell>
      <SectionHeading
        eyebrow="Precios"
        title="Un solo plan. Sin sorpresas."
        description="Todo lo necesario para recibir reservas y operar mejor desde un solo lugar."
        align="center"
      />

      <div className="mx-auto mt-16 max-w-5xl rounded-[38px] border border-brand-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fbff_100%)] p-3 shadow-float">
        <div className="rounded-[32px] border border-white/80 bg-white/96 p-8 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                {brand.name} Pro
              </div>

              <div className="mt-4 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Para negocios en crecimiento
              </div>

              <div className="mt-7 flex items-end gap-3">
                <span className="text-5xl font-semibold tracking-[-0.08em] text-ink sm:text-6xl">
                  $13
                </span>
                <span className="pb-2 text-lg text-muted">USD / mes</span>
              </div>

              <p className="mt-5 text-base leading-8 text-muted">
                Una base clara para ordenar reservas, agenda y seguimiento sin sumar
                complejidad.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Booking público listo para compartir.",
                  "Agenda y operación en un solo panel.",
                  "Lista de espera y notificaciones desde la misma base.",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    <p className="text-sm leading-7 text-ink">{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/registro" className="sm:min-w-[180px]">
                  Empezar ahora
                </ButtonLink>
                <ButtonLink
                  href="/booking/clinica-demo"
                  variant="secondary"
                  className="sm:min-w-[180px]"
                >
                  Ver demo
                </ButtonLink>
              </div>

              <p className="mt-4 text-sm text-muted">
                Puedes cambiar o cancelar cuando quieras.
              </p>
            </div>

            <div className="rounded-[30px] border border-line/80 bg-surface-soft p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Incluye
              </p>

              <div className="mt-6 grid gap-3">
                {pricingFeatures.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-[24px] border border-white bg-white p-4 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        ✓
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{feature.title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
