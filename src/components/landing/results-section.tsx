import { resultMetrics, testimonials } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function ResultsSection() {
  return (
    <SectionShell id="beneficios">
      <SectionHeading
        eyebrow="Resultados"
        title="Lo que cambia en los consultorios"
        description="La combinación de reservas online, recordatorios y anticipos transforma una agenda reactiva en una operación mucho más predecible."
        align="center"
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {resultMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[30px] border border-line bg-white p-6 shadow-card"
          >
            <p className="text-3xl font-semibold tracking-[-0.06em] text-ink">
              {metric.value}
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-ink">
              {metric.label}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{metric.description}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-5 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="rounded-[30px] border border-line bg-white p-6 shadow-card"
          >
            <p className="text-base leading-8 text-ink">“{testimonial.quote}”</p>
            <div className="mt-8">
              <p className="text-base font-semibold tracking-[-0.03em] text-ink">
                {testimonial.name}
              </p>
              <p className="mt-1 text-sm text-muted">{testimonial.role}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
