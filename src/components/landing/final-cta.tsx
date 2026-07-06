import { ButtonLink } from "../ui/button-link";
import { SectionShell } from "../ui/section-shell";

type PublicCTAProps = {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PublicCTA({
  title = "Deja que tu agenda venda mejor por ti.",
  description = "Convierte reservas, recordatorios y horarios liberados en un sistema más claro para tu negocio.",
  primaryHref = "/registro",
  primaryLabel = "Probar Agenda Viva",
  secondaryHref = "/precios",
  secondaryLabel = "Ver precios",
}: PublicCTAProps) {
  return (
    <SectionShell className="pt-12">
      <div className="overflow-hidden rounded-[40px] bg-brand-700 px-7 py-10 shadow-float sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              CTA final
            </p>
            <h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-5 text-base leading-8 text-blue-50/88 sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
            <ButtonLink href={primaryHref} variant="inverted" className="min-w-[180px]">
              {primaryLabel}
            </ButtonLink>
            <ButtonLink
              href={secondaryHref}
              variant="ghostLight"
              className="min-w-[180px]"
            >
              {secondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
