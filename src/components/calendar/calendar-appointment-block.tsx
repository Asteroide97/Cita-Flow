import Link from "next/link";

import { appointmentStatusLabels } from "@/components/appointments/appointment-helpers";
import { cn } from "@/lib/utils";
import type {
  CalendarAppointment,
  CalendarAppointmentLayout,
} from "@/types/calendar";

import {
  formatCalendarTimeRange,
  getCalendarStatusTone,
} from "./calendar-helpers";

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
  const title = `${timeLabel} - ${appointment.patient.name} - ${appointment.service.name}`;

  if (variant === "list") {
    return (
      <Link
        href={href}
        title={title}
        className={cn(
          "block rounded-[24px] border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5",
          tone.blockClassName,
          isSelected ? "ring-2 ring-brand-300 ring-offset-2 ring-offset-white" : "",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em]">
              {timeLabel}
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">
              {appointment.patient.name}
            </p>
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

        <p className="mt-3 text-xs uppercase tracking-[0.18em] opacity-70">
          Ver detalle y acciones
        </p>
      </Link>
    );
  }

  if (!layout) {
    return null;
  }

  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "absolute z-10 overflow-hidden rounded-[22px] border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5",
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
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">
          {layout.startLabel} - {layout.endLabel}
        </p>
        <span
          className={cn(
            "hidden rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] md:inline-flex",
            tone.badgeClassName,
          )}
        >
          {statusLabel}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-semibold tracking-[-0.02em]">
        {appointment.patient.name}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-75">
        {statusLabel}
      </p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] opacity-65">
        Ver detalle
      </p>
    </Link>
  );
}
