import { heroMetrics } from "@/data/landing";

import { ButtonLink } from "../ui/button-link";
import { SectionShell } from "../ui/section-shell";

export function Hero() {
  return (
    <SectionShell className="pb-18 pt-8 sm:pb-24">
      <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
            SaaS médico para consultorios y clínicas
          </div>

          <h1 className="text-balance mt-8 text-5xl font-semibold tracking-[-0.08em] text-ink sm:text-6xl lg:text-[4.35rem] lg:leading-[1.02]">
            Llena tu agenda. Cobra anticipos. Reduce los no-shows.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            CitaFlow automatiza reservas, recordatorios, pagos de anticipo y gestión
            de pacientes para consultorios y clínicas.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="#cta" className="min-w-[170px]">
              Agendar demo
            </ButtonLink>
            <ButtonLink
              href="#como-funciona"
              variant="secondary"
              className="min-w-[170px]"
            >
              Ver cómo funciona
            </ButtonLink>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] border border-white/90 bg-white/92 px-4 py-4 shadow-card"
              >
                <p className="text-xl font-semibold tracking-[-0.05em] text-ink">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-muted">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-12 h-36 w-36 rounded-full bg-brand-100/80 blur-3xl" />
          <div className="absolute right-6 top-4 h-28 w-28 rounded-full bg-sky-100/70 blur-3xl" />

          <div className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white p-6 shadow-float sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600">
                  Agenda médica
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                  Semana productiva
                </h2>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Ocupación
                </p>
                <p className="mt-1 text-lg font-semibold text-ink">91%</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[28px] border border-line bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Hoy</p>
                  <p className="text-xs text-muted">12 citas</p>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    {
                      hour: "09:00",
                      title: "Valoración dental",
                      detail: "Dra. Cortés · Confirmada",
                    },
                    {
                      hour: "11:30",
                      title: "Control general",
                      detail: "Dr. Núñez · Anticipo recibido",
                    },
                    {
                      hour: "16:00",
                      title: "Terapia de seguimiento",
                      detail: "Lic. Luna · Recordatorio enviado",
                    },
                  ].map((appointment) => (
                    <div
                      key={appointment.hour}
                      className="rounded-2xl border border-white bg-white p-3 shadow-sm"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        {appointment.hour}
                      </p>
                      <p className="mt-2 font-semibold text-ink">{appointment.title}</p>
                      <p className="mt-1 text-sm text-muted">{appointment.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-line bg-white p-4">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2 text-sm">
                  {Array.from({ length: 28 }, (_, index) => {
                    const isActive = [4, 9, 10, 16, 19, 24].includes(index);
                    const isHighlight = [9, 16].includes(index);

                    return (
                      <div
                        key={index}
                        className={[
                          "flex aspect-square items-center justify-center rounded-2xl border text-sm font-semibold transition-colors",
                          isHighlight
                            ? "border-brand-200 bg-brand-600 text-white shadow-sm"
                            : isActive
                              ? "border-brand-100 bg-brand-50 text-brand-700"
                              : "border-transparent bg-slate-50 text-slate-500",
                        ].join(" ")}
                      >
                        {index + 1}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-[24px] border border-brand-100 bg-brand-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Automatización
                  </p>
                  <p className="mt-2 text-base font-semibold text-ink">
                    Recordatorios, anticipos y lista de espera activos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 top-8 rounded-[22px] border border-white/80 bg-white px-4 py-3 shadow-card sm:right-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              No-shows
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-ink">
              -67% este mes
            </p>
          </div>

          <div className="absolute -bottom-4 left-2 rounded-[22px] border border-white/80 bg-white px-4 py-3 shadow-card sm:left-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Reservas
            </p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-ink">
              24/7 disponibles
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
