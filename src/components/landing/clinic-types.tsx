import Link from "next/link";

import { businessSolutions } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

type BusinessTypesSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  limit?: number;
  showViewAllLink?: boolean;
};

export function BusinessTypesSection({
  eyebrow = "Soluciones",
  title = "Negocios que ya encajan con Agenda Viva",
  description = "Desde salud y bienestar hasta belleza, clases y atención especializada.",
  limit,
  showViewAllLink = false,
}: BusinessTypesSectionProps) {
  const items = limit ? businessSolutions.slice(0, limit) : businessSolutions;

  return (
    <SectionShell>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        {showViewAllLink ? (
          <Link
            href="/soluciones"
            className="inline-flex items-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink shadow-soft transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            Ver todas las soluciones
          </Link>
        ) : null}
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="surface-card surface-card-hover p-7">
            <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              {item.label}
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-ink">
              {item.summary}
            </h3>

            <p className="mt-4 text-sm leading-7 text-muted">{item.highlight}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
