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
        title="¿Qué tipo de consultorio tienes?"
        description="Cada flujo cambia según tu especialidad. CitaFlow se presenta con beneficios adaptados para distintos tipos de práctica médica."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {clinicTypes.map((clinic) => {
            const isActive = clinic.id === activeClinicId;

            return (
              <button
                key={clinic.id}
                type="button"
                onClick={() => setActiveClinicId(clinic.id)}
                className={cn(
                  "rounded-[28px] border p-5 text-left transition-all duration-200",
                  isActive
                    ? "border-brand-200 bg-white shadow-card"
                    : "border-line bg-white/70 hover:border-brand-100 hover:bg-white",
                )}
              >
                <p className="text-lg font-semibold tracking-[-0.04em] text-ink">
                  {clinic.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">{clinic.tagline}</p>
              </button>
            );
          })}
        </div>

        <article className="rounded-[34px] border border-line bg-white p-7 shadow-float sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600">
            {activeClinic.label}
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {activeClinic.tagline}
          </h3>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            {activeClinic.description}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {activeClinic.benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-[22px] border border-line bg-slate-50/80 p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  ✓
                </span>
                <p className="text-sm leading-6 text-ink">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-brand-100 bg-brand-50 p-5">
              <p className="text-sm font-semibold text-brand-700">Beneficio clave</p>
              <p className="mt-3 text-base leading-7 text-ink">{activeClinic.highlight}</p>
            </div>

            <div className="rounded-[24px] border border-line bg-white p-5">
              <p className="text-sm font-semibold text-ink">Impacto operativo</p>
              <p className="mt-3 text-base leading-7 text-muted">{activeClinic.support}</p>
            </div>
          </div>
        </article>
      </div>
    </SectionShell>
  );
}
