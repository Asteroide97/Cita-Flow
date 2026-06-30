import { howItWorksSteps } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function HowItWorks() {
  return (
    <SectionShell id="como-funciona">
      <SectionHeading
        eyebrow="Cómo funciona"
        title="Funciona en 4 pasos"
        description="CitaFlow simplifica la operación desde la configuración inicial hasta el seguimiento automático de cada cita."
        align="center"
      />

      <div className="relative mt-14">
        <div className="absolute left-1/2 top-16 hidden h-px w-[74%] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />

        <div className="grid gap-5 lg:grid-cols-4">
          {howItWorksSteps.map((step) => (
            <article
              key={step.number}
              className="relative rounded-[30px] border border-line bg-white p-6 shadow-card"
            >
              <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Paso {step.number}
              </span>

              <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-ink">
                {step.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
