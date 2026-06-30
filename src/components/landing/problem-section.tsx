import { problemCards } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function ProblemSection() {
  return (
    <SectionShell className="bg-white/60">
      <SectionHeading
        eyebrow="Problema"
        title="Para de perder tiempo y dinero en citas perdidas"
        description="Cuando la agenda depende de mensajes manuales, cada cancelacion y cada confirmacion tardia terminan costando ingresos y foco operativo."
        align="center"
      />

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {problemCards.map((problem, index) => (
          <article
            key={problem.title}
            className="surface-card surface-card-hover p-7"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
            </div>

            <h3 className="mt-7 text-xl font-semibold tracking-[-0.04em] text-ink">
              {problem.title}
            </h3>
            <p className="mt-4 text-base leading-8 text-muted">{problem.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
