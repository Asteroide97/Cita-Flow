import { ButtonLink } from "../ui/button-link";
import { SectionShell } from "../ui/section-shell";

export function FinalCTA() {
  return (
    <SectionShell id="cta" className="pt-12">
      <div className="overflow-hidden rounded-[40px] bg-brand-700 px-7 py-10 shadow-float sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              CTA final
            </p>
            <h2 className="text-balance mt-5 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              Deja de coordinar reservas por WhatsApp
            </h2>
            <p className="mt-5 text-base leading-8 text-blue-50/88 sm:text-lg">
              Convierte tu agenda en un sistema automático de reservas, pagos y
              recordatorios con una experiencia que también vende mejor tu negocio.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
            <ButtonLink href="#top" variant="inverted" className="min-w-[180px]">
              Probar gratis
            </ButtonLink>
            <ButtonLink href="#precios" variant="ghostLight" className="min-w-[180px]">
              Ver precios
            </ButtonLink>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
