import {
  formatDateInTimeZone,
  type GetAvailableSlotsResult,
} from "@/lib/appointments/availability";

type RescheduleAppointmentFormProps = {
  token: string;
  actionPath: string;
  selectedDate: string;
  minDate: string;
  selectedSlotTime: string;
  availableSlotResult: GetAvailableSlotsResult | null;
  submitAction: (formData: FormData) => void | Promise<void>;
};

export function RescheduleAppointmentForm({
  token,
  actionPath,
  selectedDate,
  minDate,
  selectedSlotTime,
  availableSlotResult,
  submitAction,
}: RescheduleAppointmentFormProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Reagendar reserva
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige una nueva fecha y horario
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Mostramos la disponibilidad real del mismo profesional y servicio. El
        horario se vuelve a validar justo antes de guardar el cambio.
      </p>

      <form action={actionPath} method="get" className="mt-6">
        <label className="text-sm font-medium text-ink">
          Nueva fecha
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            min={minDate}
            className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <button
          type="submit"
          className="mt-4 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--public-appointment-brand)" }}
        >
          Ver horarios disponibles
        </button>
      </form>

      {selectedDate ? (
        <div className="mt-6 rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha seleccionada
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {availableSlotResult
              ? formatDateInTimeZone(availableSlotResult.date, availableSlotResult.timezone)
              : selectedDate}
          </p>
        </div>
      ) : null}

      {availableSlotResult ? (
        availableSlotResult.slots.length ? (
          <form action={submitAction} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="date" value={selectedDate} />

            <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableSlotResult.slots.map((slot) => (
                <label
                  key={slot.startTime}
                  className={
                    selectedSlotTime === slot.startTime
                      ? "cursor-pointer rounded-[22px] border border-brand-300 bg-brand-50 px-4 py-4 text-sm font-semibold text-brand-700 shadow-soft"
                      : "cursor-pointer rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
                  }
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="slotTime"
                      value={slot.startTime}
                      defaultChecked={selectedSlotTime === slot.startTime}
                      className="h-4 w-4 border-line text-brand-600"
                    />
                    <span>{slot.startTime}</span>
                  </div>
                </label>
              ))}
            </fieldset>

            <button
              type="submit"
              className="mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--public-appointment-brand)" }}
            >
              Guardar nuevo horario
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[22px] border border-dashed border-line/90 bg-white px-4 py-5 text-sm leading-7 text-muted">
            No hay horarios disponibles para esa fecha. Prueba con otro día.
          </div>
        )
      ) : null}
    </article>
  );
}
