import { productModules } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

type ProductModulesSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function ProductModulesSection({
  eyebrow = "Producto",
  title = "Todo lo que necesita tu operación diaria",
  description = "Agenda Viva conecta reservas, agenda y seguimiento en un flujo simple para tu negocio.",
}: ProductModulesSectionProps) {
  return (
    <SectionShell>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        align="center"
      />

      <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {productModules.map((module) => (
          <article key={module.title} className="surface-card surface-card-hover p-7">
            <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Módulo
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-ink">
              {module.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-muted">{module.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
