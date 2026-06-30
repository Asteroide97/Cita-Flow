import { AppointmentStatus } from "@prisma/client";

import { getAppointmentActionAvailability } from "./appointment-helpers";

type AppointmentActionsProps = {
  appointmentId: string;
  status: AppointmentStatus;
  action: (formData: FormData) => void | Promise<void>;
};

export function AppointmentActions({
  appointmentId,
  status,
  action,
}: AppointmentActionsProps) {
  const { canConfirm, canCancel, canComplete, canNoShow } =
    getAppointmentActionAvailability(status);

  if (!canConfirm && !canCancel && !canComplete && !canNoShow) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {canConfirm ? (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="intent" value="confirm" />
          <button
            type="submit"
            className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
          >
            Confirmar
          </button>
        </form>
      ) : null}

      {canCancel ? (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="intent" value="cancel" />
          <button
            type="submit"
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
          >
            Cancelar
          </button>
        </form>
      ) : null}

      {canComplete ? (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="intent" value="complete" />
          <button
            type="submit"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
          >
            Marcar completada
          </button>
        </form>
      ) : null}

      {canNoShow ? (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="intent" value="no-show" />
          <button
            type="submit"
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Marcar no-show
          </button>
        </form>
      ) : null}
    </div>
  );
}
