import { patientBookingSummary, patientFlowSteps } from "@/data/landing";

import { ButtonLink } from "../ui/button-link";
import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function PatientFlow() {
  return (
    <SectionShell className="bg-white/60">
      <div className="grid gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Experiencia del cliente"
            title="Así lo vive tu cliente"
            description="La reserva se siente clara, rápida y confiable. Menos fricción para el cliente significa más reservas confirmadas para tu negocio."
          />

          <div className="mt-10 space-y-4">
            {patientFlowSteps.map((item) => (
              <div key={item.step} className="surface-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute left-1/2 top-6 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-100/80 blur-3xl" />

          <div className="relative rounded-[36px] bg-slate-950 p-3 shadow-float">
            <div className="rounded-[30px] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Reserva en línea
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-ink">
                    Studio Central
                  </h3>
                </div>
                <div className="rounded-2xl bg-brand-50 px-3 py-2 text-right">
                  <p className="text-xs font-semibold text-brand-700">Paso 5 de 5</p>
                  <p className="text-sm font-semibold text-ink">Confirmación</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="space-y-4">
                  <div className="surface-panel p-4">
                    <p className="text-sm font-semibold text-ink">Servicio</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {patientBookingSummary.service}
                    </p>
                  </div>

                  <div className="surface-panel p-4">
                    <p className="text-sm font-semibold text-ink">Profesional</p>
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                        SH
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {patientBookingSummary.doctor}
                        </p>
                        <p className="text-xs text-muted">Atención especializada</p>
                      </div>
                    </div>
                  </div>

                  <div className="surface-panel p-4">
                    <p className="text-sm font-semibold text-ink">Horarios disponibles</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {["10:00", "10:30", "12:00", "16:00", "16:30", "18:00"].map(
                        (slot, index) => (
                          <div
                            key={slot}
                            className={[
                              "rounded-2xl border px-3 py-2 text-center text-sm font-semibold",
                              index === 3
                                ? "border-brand-200 bg-brand-600 text-white"
                                : "border-line/80 bg-white text-ink",
                            ].join(" ")}
                          >
                            {slot}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-line/80 bg-surface-soft p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Resumen de reserva
                  </p>

                  <div className="mt-4 space-y-3 rounded-[24px] border border-white bg-white p-5 shadow-soft">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Servicio</span>
                      <span className="text-sm font-semibold text-ink">
                        {patientBookingSummary.service}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Profesional</span>
                      <span className="text-sm font-semibold text-ink">
                        {patientBookingSummary.doctor}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Fecha</span>
                      <span className="text-sm font-semibold text-ink">
                        {patientBookingSummary.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-muted">Anticipo</span>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                        {patientBookingSummary.advance}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[24px] border border-brand-100 bg-brand-50 p-4">
                    <p className="text-sm leading-6 text-ink">
                      Tu lugar queda apartado y el negocio envía un recordatorio
                      automático antes de la reserva.
                    </p>
                  </div>

                  <ButtonLink href="#cta" className="mt-5 w-full">
                    {patientBookingSummary.buttonLabel}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
