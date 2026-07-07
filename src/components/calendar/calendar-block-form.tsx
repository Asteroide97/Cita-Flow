import { Button } from "@/components/ui/button";
import { appointmentFieldClassName } from "@/components/appointments/appointment-helpers";
import type { CalendarBlockedTime } from "@/types/calendar";

import { formatCalendarTimeRange } from "./calendar-helpers";

type CalendarBlockFormProps = {
  redirectPath: string;
  selectedDateValue: string;
  selectedStartTime: string;
  selectedEndTime: string;
  blockedTimes: CalendarBlockedTime[];
  timezone: string;
  createAction: (formData: FormData) => void | Promise<void>;
  cancelAction: (formData: FormData) => void | Promise<void>;
};

export function CalendarBlockForm({
  redirectPath,
  selectedDateValue,
  selectedStartTime,
  selectedEndTime,
  blockedTimes,
  timezone,
  createAction,
  cancelAction,
}: CalendarBlockFormProps) {
  return (
    <div className="grid gap-5">
      <form action={createAction} className="grid gap-4">
        <input type="hidden" name="redirectPath" value={redirectPath} />

        <label className="text-sm font-semibold text-ink">
          Fecha
          <input
            type="date"
            name="date"
            defaultValue={selectedDateValue}
            className={appointmentFieldClassName}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            Inicio
            <input
              type="time"
              name="startTime"
              defaultValue={selectedStartTime}
              className={appointmentFieldClassName}
            />
          </label>

          <label className="text-sm font-semibold text-ink">
            Fin
            <input
              type="time"
              name="endTime"
              defaultValue={selectedEndTime}
              className={appointmentFieldClassName}
            />
          </label>
        </div>

        <label className="text-sm font-semibold text-ink">
          Motivo opcional
          <textarea
            name="reason"
            rows={3}
            className={appointmentFieldClassName}
            placeholder="Cierre, comida, capacitación..."
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" name="blockMode" value="range">
            Bloquear horario
          </Button>
          <Button type="submit" name="blockMode" value="full-day" variant="secondary">
            Bloquear día completo
          </Button>
        </div>
      </form>

      <div className="grid gap-3">
        {blockedTimes.length ? (
          blockedTimes.map((blockedTime) => (
            <div
              key={blockedTime.id}
              className="rounded-[22px] border border-line/80 bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {formatCalendarTimeRange(blockedTime.startAt, blockedTime.endAt, timezone)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {blockedTime.reason ?? "Sin motivo"}
                  </p>
                </div>

                <form action={cancelAction}>
                  <input type="hidden" name="blockId" value={blockedTime.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <Button type="submit" variant="secondary" className="px-4 py-2 text-xs">
                    Eliminar
                  </Button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
            No hay bloqueos visibles en este rango.
          </div>
        )}
      </div>
    </div>
  );
}
