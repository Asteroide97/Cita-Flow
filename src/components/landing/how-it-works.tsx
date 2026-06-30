import { howItWorksSteps } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function HowItWorks() {
  return (
    <SectionShell id="como-funciona">
      <SectionHeading
        eyebrow="Como funciona"
        title="Funciona en 4 pasos"
        description="CitaFlow simplifica la operacion desde la configuracion inicial hasta el seguimiento automatico de cada cita."
        align="center"
      />

      <div className="relative mt-16">
        <div className="absolute left-1/2 top-16 hidden h-px w-[74%] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />

        <div className="grid gap-6 lg:grid-cols-4">
          {howItWorksSteps.map((step) => (
            <article key={step.number} className="surface-card p-7">
              <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Paso {step.number}
              </span>

              <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-ink">
                {step.title}
              </h3>
              <p className="mt-4 text-base leading-8 text-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
