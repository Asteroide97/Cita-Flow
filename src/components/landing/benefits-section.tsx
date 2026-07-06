import { homeBenefits } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function BenefitsSection() {
  return (
    <SectionShell className="bg-white/60">
      <SectionHeading
        eyebrow="Beneficios"
        title="Lo esencial para vender y operar mejor"
        description="Todo lo importante para recibir reservas y dar seguimiento sin saturar a tu equipo."
        align="center"
      />

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {homeBenefits.map((benefit) => (
          <article key={benefit.title} className="surface-card surface-card-hover p-7">
            <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Beneficio
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-ink">
              {benefit.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted">{benefit.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
