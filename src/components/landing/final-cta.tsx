import { ButtonLink } from "../ui/button-link";
import { SectionShell } from "../ui/section-shell";

export function FinalCTA() {
  return (
    <SectionShell id="cta" className="pt-10">
      <div className="overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,_#1d4ed8_0%,_#2563eb_55%,_#0f172a_100%)] px-7 py-10 shadow-float sm:px-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
              CTA final
            </p>
            <h2 className="text-balance mt-5 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
              Deja de coordinar citas por WhatsApp
            </h2>
            <p className="mt-5 text-base leading-8 text-blue-50/86 sm:text-lg">
              Convierte tu agenda en un sistema automático de reservas, pagos y
              recordatorios.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
            <ButtonLink href="#top" variant="inverted" className="min-w-[170px]">
              Agendar demo
            </ButtonLink>
            <ButtonLink href="#precios" variant="ghostLight" className="min-w-[170px]">
              Ver precios
            </ButtonLink>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
