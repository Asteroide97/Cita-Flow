import { homeSteps } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function HowItWorksSection() {
  return (
    <SectionShell>
      <SectionHeading
        eyebrow="Cómo funciona"
        title="Empieza en 3 pasos"
        description="Configura lo esencial, comparte tu página y deja que la agenda haga el resto."
        align="center"
      />

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {homeSteps.map((step, index) => (
          <article key={step.title} className="surface-card p-7">
            <span className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Paso {index + 1}
            </span>

            <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-ink">
              {step.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted">{step.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
