import { patientFlowSteps } from "@/data/landing";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function PatientFlow() {
  return (
    <SectionShell className="bg-white/65">
      <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Experiencia del paciente"
            title="Así lo vive tu paciente"
            description="La reserva se siente clara, rápida y confiable. Menos fricción para el paciente significa más citas confirmadas para el consultorio."
          />

          <div className="mt-10 space-y-4">
            {patientFlowSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-[26px] border border-line bg-white p-5 shadow-card"
              >
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

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute left-1/2 top-5 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-100/80 blur-3xl" />

          <div className="relative rounded-[36px] border border-line bg-slate-900 p-3 shadow-float">
            <div className="rounded-[30px] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Reserva en línea
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-ink">
                    Clínica San Pedro
                  </h3>
                </div>
                <div className="rounded-2xl bg-brand-50 px-3 py-2 text-right">
                  <p className="text-xs font-semibold text-brand-700">Paso 3 de 5</p>
                  <p className="text-sm font-semibold text-ink">Horario</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border border-line bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-ink">Servicio</p>
                  <p className="mt-2 text-sm text-muted">Primera consulta de valoración</p>
                </div>

                <div className="rounded-[24px] border border-line bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-ink">Doctor</p>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                      DR
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">Dr. José Núñez</p>
                      <p className="text-xs text-muted">Medicina general</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-line bg-slate-50/80 p-4">
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
                              : "border-line bg-white text-ink",
                          ].join(" ")}
                        >
                          {slot}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-brand-100 bg-brand-50 p-4">
                  <p className="text-sm font-semibold text-brand-700">Anticipo opcional</p>
                  <p className="mt-2 text-sm leading-6 text-ink">
                    Confirma tu horario con un pago rápido y evita perder la cita.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
