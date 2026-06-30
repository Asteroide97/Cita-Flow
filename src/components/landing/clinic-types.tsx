"use client";

import { useState } from "react";

import { clinicTypes } from "@/data/landing";
import { cn } from "@/lib/utils";

import { SectionHeading } from "../ui/section-heading";
import { SectionShell } from "../ui/section-shell";

export function ClinicTypes() {
  const [activeClinicId, setActiveClinicId] = useState(clinicTypes[0].id);
  const activeClinic =
    clinicTypes.find((clinic) => clinic.id === activeClinicId) ?? clinicTypes[0];

  return (
    <SectionShell>
      <SectionHeading
        eyebrow="Especialidades"
        title="¿Que tipo de consultorio tienes?"
        description="Cada flujo cambia segun tu especialidad. CitaFlow se presenta con beneficios adaptados para distintos tipos de practica medica."
      />

      <div className="mt-16">
        <div className="flex flex-wrap gap-3">
          {clinicTypes.map((clinic) => {
            const isActive = clinic.id === activeClinicId;

            return (
              <button
                key={clinic.id}
                type="button"
                onClick={() => setActiveClinicId(clinic.id)}
                className={cn(
                  "rounded-full border px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-brand-200 bg-brand-600 text-white shadow-soft"
                    : "border-line/80 bg-white/92 text-muted shadow-soft hover:border-brand-100 hover:text-ink",
                )}
              >
                {clinic.label}
              </button>
            );
          })}
        </div>

        <article className="surface-card mt-8 overflow-hidden p-7 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">
                {activeClinic.label}
              </p>
              <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink sm:text-[2.2rem]">
                {activeClinic.tagline}
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                {activeClinic.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {activeClinic.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="surface-panel flex items-start gap-3 p-4"
                  >
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    <p className="text-sm leading-6 text-ink">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)] p-5">
              <div className="rounded-[26px] border border-white/80 bg-white/96 p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-700">
                      {activeClinic.useCaseTitle}
                    </p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-ink">
                      {activeClinic.label}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                    Caso realista
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-muted">
                  {activeClinic.useCaseSummary}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {activeClinic.useCaseMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[22px] border border-line/80 bg-surface-soft px-3 py-4"
                    >
                      <p className="text-sm font-semibold text-brand-700">{metric.value}</p>
                      <p className="mt-2 text-xs leading-5 text-muted">{metric.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-line/80 bg-white p-5">
                  <p className="text-sm font-semibold text-ink">Flujo sugerido</p>
                  <div className="mt-4 space-y-3">
                    {activeClinic.useCaseSteps.map((step, index) => (
                      <div key={step} className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6 text-muted">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-brand-100 bg-brand-50 p-4">
                    <p className="text-sm font-semibold text-brand-700">Beneficio clave</p>
                    <p className="mt-3 text-sm leading-7 text-ink">
                      {activeClinic.highlight}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white p-4">
                    <p className="text-sm font-semibold text-ink">Impacto operativo</p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {activeClinic.support}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </SectionShell>
  );
}
