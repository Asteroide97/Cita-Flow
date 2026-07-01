import { resultMetrics, testimonials } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function ResultsSection() {
  return (
    <SectionShell id="beneficios">
      <SectionHeading
        eyebrow="Resultados"
        title="Lo que cambia en los negocios con agenda"
        description="La combinación de reservas online, recordatorios y anticipos transforma una agenda reactiva en una operación mucho más predecible."
        align="center"
      />

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {resultMetrics.map((metric) => (
          <article key={metric.label} className="surface-card p-7">
            <p className="text-3xl font-semibold tracking-[-0.06em] text-brand-700">
              {metric.value}
            </p>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-ink">
              {metric.label}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{metric.description}</p>
            <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-400">
              {metric.note}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-6 lg:mt-20 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article key={testimonial.name} className="surface-card p-7">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
                {testimonial.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <p className="text-base font-semibold tracking-[-0.03em] text-ink">
                  {testimonial.name}
                </p>
                <p className="mt-1 text-sm text-muted">{testimonial.role}</p>
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-ink">“{testimonial.quote}”</p>

            <div className="mt-6 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              {testimonial.impact}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
