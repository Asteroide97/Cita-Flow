import Link from "next/link";

import { cn } from "@/lib/utils";

export type OnboardingChecklistStep = {
  id: string;
  title: string;
  description: string;
  helperText: string;
  isComplete: boolean;
  actionHref: string;
  actionLabel: string;
  actionTarget?: "_self" | "_blank";
};

type OnboardingChecklistProps = {
  businessName: string;
  bookingUrl: string;
  steps: OnboardingChecklistStep[];
};

function StepStatusBadge({ isComplete }: { isComplete: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        isComplete
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {isComplete ? "Listo" : "Pendiente"}
    </span>
  );
}

function ChecklistStep({
  index,
  step,
}: {
  index: number;
  step: OnboardingChecklistStep;
}) {
  return (
    <article
      className={cn(
        "rounded-[26px] border p-5 sm:p-6",
        step.isComplete
          ? "border-emerald-100 bg-emerald-50/60"
          : "border-line/80 bg-white",
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold",
              step.isComplete ? "bg-emerald-100 text-emerald-700" : "bg-brand-50 text-brand-700",
            )}
          >
            {step.isComplete ? "OK" : index + 1}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                {step.title}
              </h3>
              <StepStatusBadge isComplete={step.isComplete} />
            </div>

            <p className="mt-2.5 text-sm leading-6 text-ink">{step.description}</p>
            <p className="mt-1.5 text-sm leading-6 text-muted">{step.helperText}</p>
          </div>
        </div>

        <Link
          href={step.actionHref}
          target={step.actionTarget}
          rel={step.actionTarget === "_blank" ? "noreferrer" : undefined}
          className="inline-flex w-full shrink-0 justify-center rounded-full border border-line/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700 sm:w-auto"
        >
          {step.actionLabel}
        </Link>
      </div>
    </article>
  );
}

function ChecklistSteps({ steps }: { steps: OnboardingChecklistStep[] }) {
  return (
    <div className="mt-6 grid gap-4">
      {steps.map((step, index) => (
        <ChecklistStep key={step.id} index={index} step={step} />
      ))}
    </div>
  );
}

export function OnboardingChecklist({
  businessName,
  bookingUrl,
  steps,
}: OnboardingChecklistProps) {
  const completedCount = steps.filter((step) => step.isComplete).length;
  const allComplete = completedCount === steps.length;

  if (allComplete) {
    return (
      <details className="surface-card overflow-hidden [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none flex-col gap-4 px-6 py-6 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Checklist inicial
              </p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-ink sm:text-3xl">
                Tu negocio ya puede recibir reservas.
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
                {businessName} ya tiene lo mínimo listo para compartir su booking.
              </p>
            </div>

            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {completedCount}/{steps.length} listos
            </div>
          </div>
        </summary>

        <div className="border-t border-line/70 px-6 pb-6 pt-6 sm:px-7">
          <div className="flex flex-col gap-4 rounded-[26px] border border-brand-100 bg-brand-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold text-brand-700">
                Tu página pública ya está lista para compartirse.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ábrela o revisa el checklist cuando quieras.
              </p>
            </div>

            <Link
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full shrink-0 justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 sm:w-auto"
            >
              Abrir booking público
            </Link>
          </div>

          <ChecklistSteps steps={steps} />
        </div>
      </details>
    );
  }

  return (
    <section className="surface-card p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Checklist inicial
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-ink sm:text-3xl">
            Deja lista tu página de reservas
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base">
            Completa lo esencial para empezar a recibir reservas.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          {completedCount}/{steps.length} listos
        </div>
      </div>

      <ChecklistSteps steps={steps} />
    </section>
  );
}
