import { faqs } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function FAQSection() {
  return (
    <SectionShell id="faq">
      <SectionHeading
        eyebrow="FAQ"
        title="Preguntas frecuentes"
        description="Respuestas rápidas a las dudas más comunes sobre cómo operaría CitaFlow en un consultorio o clínica."
        align="center"
      />

      <div className="mx-auto mt-14 grid max-w-4xl gap-4">
        {faqs.map((item, index) => (
          <details
            key={item.question}
            open={index === 0}
            className="group rounded-[28px] border border-line bg-white p-6 shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold tracking-[-0.03em] text-ink">
              <span>{item.question}</span>
              <span className="rounded-full border border-line px-3 py-1 text-sm text-brand-700 transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>

            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
