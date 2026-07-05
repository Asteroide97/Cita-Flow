import type { AvailableSlot } from "@/lib/appointments/availability";

import { appointmentFieldClassName } from "./appointment-helpers";

type AvailableSlotsPickerProps = {
  slots: AvailableSlot[];
  selectedSlotTime?: string;
};

export function AvailableSlotsPicker({
  slots,
  selectedSlotTime = "",
}: AvailableSlotsPickerProps) {
  return (
    <label className="text-sm font-semibold text-ink">
      Horario disponible
      <select
        name="slotTime"
        required
        defaultValue={selectedSlotTime}
        className={appointmentFieldClassName}
      >
        <option value="">Selecciona un horario</option>
        {slots.map((slot) => (
          <option key={slot.startTime} value={slot.startTime}>
            {slot.startTime} - {slot.endTime}
          </option>
        ))}
      </select>
    </label>
  );
}
