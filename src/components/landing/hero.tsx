import { heroAlerts, heroAppointments, heroMetrics } from "@/data/landing";

import { ButtonLink } from "../ui/button-link";
import { SectionShell } from "../ui/section-shell";

export function Hero() {
  return (
    <SectionShell className="pb-20 pt-10 sm:pb-28">
      <div className="grid gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="eyebrow-chip">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
            Plataforma de reservas para negocios de servicios
          </div>

          <h1 className="text-balance mt-8 text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.09em] text-ink sm:text-6xl lg:text-[4.85rem] lg:leading-[0.96]">
            Llena tu agenda.
            <span className="block text-brand-700 sm:inline"> Automatiza tus</span>
            <span className="block text-brand-700 sm:inline"> reservas.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-[1.18rem]">
            Agenda Viva ayuda a clínicas, salones, spas, barberías y negocios de
            servicios a recibir reservas, enviar recordatorios, cobrar anticipos y
            recuperar horarios liberados.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink href="#cta" className="min-w-[176px]">
              Probar gratis
            </ButtonLink>
            <ButtonLink
              href="#como-funciona"
              variant="secondary"
              className="min-w-[176px]"
            >
              Ver cómo funciona
            </ButtonLink>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {heroMetrics.map((metric) => (
              <div key={metric.label} className="surface-card px-5 py-5">
                <p className="text-lg font-semibold tracking-[-0.05em] text-brand-700">
                  {metric.value}
                </p>
                <p className="mt-2 text-base font-semibold text-ink">{metric.label}</p>
                <p className="mt-1 text-sm text-muted">{metric.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-16 h-40 w-40 rounded-full bg-brand-100/80 blur-3xl" />
          <div className="absolute right-4 top-6 h-32 w-32 rounded-full bg-sky-100/75 blur-3xl" />

          <div className="relative overflow-hidden rounded-[36px] border border-white/85 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94)_0%,_rgba(244,248,255,0.94)_100%)] p-4 shadow-float sm:p-5">
            <div className="rounded-[30px] border border-line/70 bg-white/96 p-5 shadow-soft sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
                    Agenda de reservas
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink sm:text-[1.85rem]">
                    Studio Central
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Reservas, anticipos y confirmaciones en un solo lugar
                  </p>
                </div>

                <div className="surface-panel px-4 py-3 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">
                    Ocupación
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.05em] text-ink">
                    91%
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-full border border-line/80 bg-surface-soft px-3 py-2 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                12 reservas hoy
                <span className="text-slate-300">•</span>
                3 anticipos recibidos
                <span className="text-slate-300">•</span>
                5 recordatorios enviados
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                <div className="surface-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">Hoy</p>
                    <p className="text-xs text-muted">Agenda en vivo</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {heroAppointments.map((appointment) => (
                      <div
                        key={appointment.hour}
                        className="rounded-[22px] border border-white bg-white p-4 shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">
                              {appointment.hour}
                            </p>
                            <p className="mt-2 font-semibold text-ink">
                              {appointment.title}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {appointment.detail}
                            </p>
                          </div>
                          <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
                            {appointment.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-panel overflow-hidden p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">Julio</p>
                      <p className="text-xs text-muted">Vista semanal de reservas</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="h-2 w-2 rounded-full bg-brand-600" />
                      confirmadas
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
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
                            "flex aspect-square items-center justify-center rounded-[18px] border text-sm font-semibold transition-colors",
                            isHighlight
                              ? "border-brand-200 bg-brand-600 text-white shadow-soft"
                              : isActive
                                ? "border-brand-100 bg-brand-50 text-brand-700"
                                : "border-transparent bg-white text-slate-500",
                          ].join(" ")}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-brand-100 bg-brand-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-700">
                          Próxima acción
                        </p>
                        <p className="mt-2 text-base font-semibold text-ink">
                          Recordatorio para sesión a las 15:00
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-700 shadow-soft">
                        Enviado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -left-3 top-[4.5rem] hidden rounded-full border border-emerald-100 bg-white/96 px-4 py-3 shadow-soft md:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
              {heroAlerts[0].label}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{heroAlerts[0].detail}</p>
          </div>

          <div className="pointer-events-none absolute -right-4 top-20 hidden rounded-full border border-sky-100 bg-white/96 px-4 py-3 shadow-soft lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600">
              {heroAlerts[1].label}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{heroAlerts[1].detail}</p>
          </div>

          <div className="pointer-events-none absolute -bottom-4 right-8 hidden rounded-full border border-brand-100 bg-white/96 px-4 py-3 shadow-soft sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
              {heroAlerts[2].label}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{heroAlerts[2].detail}</p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
