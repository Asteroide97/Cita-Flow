"use client";

import { useActionState } from "react";

import type { AppointmentSelfServiceLinksState } from "@/types/appointments";

import { generateAppointmentSelfServiceLinksAction } from "@/app/app/appointments/actions";

const initialState: AppointmentSelfServiceLinksState = {
  error: null,
  links: null,
};

type AppointmentSelfServiceLinksProps = {
  appointmentId: string;
  initialLinks: AppointmentSelfServiceLinksState["links"];
};

function renderLink(label: string, href: string) {
  return (
    <a
      key={label}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-100"
    >
      {label}
    </a>
  );
}

export function AppointmentSelfServiceLinks({
  appointmentId,
  initialLinks,
}: AppointmentSelfServiceLinksProps) {
  const [state, formAction, isPending] = useActionState(
    generateAppointmentSelfServiceLinksAction,
    {
      ...initialState,
      links: initialLinks,
    },
  );

  const links = state.links;

  return (
    <div className="mt-6 rounded-[24px] border border-dashed border-brand-200/70 bg-brand-50/50 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Autoservicio publico
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            En desarrollo puedes abrir enlaces reales para confirmar, cancelar o
            reagendar esta cita sin iniciar sesion.
          </p>
        </div>

        <form action={formAction}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-60"
          >
            {links ? "Regenerar enlaces" : isPending ? "Generando..." : "Generar enlaces"}
          </button>
        </form>
      </div>

      {state.error ? (
        <p className="mt-4 text-sm font-medium text-rose-700">{state.error}</p>
      ) : null}

      {links ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {renderLink("Confirmar", links.confirmUrl)}
          {renderLink("Cancelar", links.cancelUrl)}
          {renderLink("Reagendar", links.rescheduleUrl)}
        </div>
      ) : null}
    </div>
  );
}
