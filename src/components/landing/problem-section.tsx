import { problemCards } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function ProblemSection() {
  return (
    <SectionShell className="bg-white/65">
      <SectionHeading
        eyebrow="Problema"
        title="Para de perder tiempo y dinero en citas perdidas"
        description="Cuando la agenda depende de mensajes manuales, cada cancelación y cada confirmación tardía terminan costando ingresos y foco operativo."
        align="center"
      />

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {problemCards.map((problem, index) => (
          <article
            key={problem.title}
            className="rounded-[28px] border border-line bg-white p-6 shadow-card transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-brand-200 to-transparent" />
            </div>

            <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-ink">
              {problem.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-muted">{problem.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
