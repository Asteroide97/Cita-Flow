import Link from "next/link";

import { appointmentStatusLabels } from "@/components/appointments/appointment-helpers";
import { cn } from "@/lib/utils";
import type {
  CalendarAppointment,
  CalendarAppointmentLayout,
} from "@/types/calendar";

import { formatCalendarTimeRange, getCalendarStatusTone } from "./calendar-helpers";

type CalendarAppointmentBlockProps = {
  appointment: CalendarAppointment;
  timezone: string;
  href: string;
  isSelected: boolean;
  variant: "day" | "week" | "list";
  layout?: CalendarAppointmentLayout;
};

export function CalendarAppointmentBlock({
  appointment,
  timezone,
  href,
  isSelected,
  variant,
  layout,
}: CalendarAppointmentBlockProps) {
  const tone = getCalendarStatusTone(appointment.status);
  const statusLabel = appointmentStatusLabels[appointment.status];
  const timeLabel = formatCalendarTimeRange(
    appointment.startAt,
    appointment.endAt,
    timezone,
  );

  if (variant === "list") {
    return (
      <Link
        href={href}
        className={cn(
          "block rounded-[22px] border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5",
          tone.blockClassName,
          isSelected ? "ring-2 ring-brand-300 ring-offset-2 ring-offset-white" : "",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              {timeLabel}
            </p>
            <p className="mt-2 text-base font-semibold tracking-[-0.02em]">
              {appointment.patient.name}
            </p>
            <p className="mt-1 text-sm opacity-80">{appointment.doctor.name}</p>
          </div>

          <span
            className={cn(
              "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
              tone.badgeClassName,
            )}
          >
            {statusLabel}
          </span>
        </div>
      </Link>
    );
  }

  if (!layout) {
    return null;
  }

  return (
    <Link
      href={href}
      className={cn(
        "absolute z-20 overflow-hidden rounded-[18px] border px-2.5 py-2 transition-all duration-200 hover:-translate-y-0.5",
        tone.blockClassName,
        isSelected ? "ring-2 ring-brand-300 ring-offset-2 ring-offset-white" : "",
        appointment.status === "CANCELLED" ? "opacity-80" : "",
      )}
      style={{
        top: `${layout.top}px`,
        height: `${layout.height}px`,
        left: `calc(${layout.leftPercent}% + 4px)`,
        width: `calc(${layout.widthPercent}% - 8px)`,
      }}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">
        {layout.startLabel}
      </p>
      <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">
        {appointment.patient.name}
      </p>
      <p className="mt-1 truncate text-[10px] uppercase tracking-[0.16em] opacity-75">
        {statusLabel}
      </p>
    </Link>
  );
}
