import { AppointmentStatus } from "@prisma/client";

import {
  buildClinicDateMarker,
  buildClinicDateTime,
  parseIsoDateInput,
  type LocalDateParts,
} from "@/lib/appointments/availability";
import type {
  CalendarAppointment,
  CalendarAppointmentLayout,
  CalendarDayDefinition,
  CalendarViewMode,
} from "@/types/calendar";

export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 20;
export const CALENDAR_HOUR_HEIGHT = 84;
export const CALENDAR_TOTAL_MINUTES =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
export const CALENDAR_TIMELINE_HEIGHT =
  ((CALENDAR_END_HOUR - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT);

function formatToParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getValue("year")),
    month: Number(getValue("month")),
    day: Number(getValue("day")),
    hour: Number(getValue("hour")),
    minute: Number(getValue("minute")),
  };
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function cleanSpanishDateLabel(value: string) {
  return capitalize(value.replace(/\./g, ""));
}

function getDayOfWeekIndex(parts: LocalDateParts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function buildCalendarDateValue(parts: LocalDateParts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getCurrentCalendarDateParts(timezone: string): LocalDateParts {
  const parts = formatToParts(new Date(), timezone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

export function resolveCalendarViewMode(value?: string): CalendarViewMode {
  return value === "week" ? "week" : "day";
}

export function resolveCalendarDateParts(
  value: string | undefined,
  timezone: string,
) {
  return parseIsoDateInput(value ?? "") ?? getCurrentCalendarDateParts(timezone);
}

export function shiftCalendarDateParts(parts: LocalDateParts, amount: number) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function getCalendarWeekStart(parts: LocalDateParts) {
  const dayIndex = getDayOfWeekIndex(parts);
  const offset = dayIndex === 0 ? -6 : 1 - dayIndex;

  return shiftCalendarDateParts(parts, offset);
}

export function buildCalendarPath({
  view,
  date,
  doctorId,
  appointmentId,
  createDoctorId,
  createServiceId,
  createDate,
  createSlotTime,
  rescheduleAppointmentId,
  rescheduleDate,
  rescheduleSlotTime,
}: {
  view: CalendarViewMode;
  date: string;
  doctorId?: string;
  appointmentId?: string;
  createDoctorId?: string;
  createServiceId?: string;
  createDate?: string;
  createSlotTime?: string;
  rescheduleAppointmentId?: string;
  rescheduleDate?: string;
  rescheduleSlotTime?: string;
}) {
  const params = new URLSearchParams();

  params.set("view", view);
  params.set("date", date);

  if (doctorId) {
    params.set("doctorId", doctorId);
  }

  if (appointmentId) {
    params.set("appointmentId", appointmentId);
  }

  if (createDoctorId) {
    params.set("createDoctorId", createDoctorId);
  }

  if (createServiceId) {
    params.set("createServiceId", createServiceId);
  }

  if (createDate) {
    params.set("createDate", createDate);
  }

  if (createSlotTime) {
    params.set("createSlotTime", createSlotTime);
  }

  if (rescheduleAppointmentId) {
    params.set("rescheduleAppointmentId", rescheduleAppointmentId);
  }

  if (rescheduleDate) {
    params.set("rescheduleDate", rescheduleDate);
  }

  if (rescheduleSlotTime) {
    params.set("rescheduleSlotTime", rescheduleSlotTime);
  }

  return `/app/calendar?${params.toString()}`;
}

export function formatCalendarDayTitle(date: Date, timezone: string) {
  return cleanSpanishDateLabel(
    new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: timezone,
    }).format(date),
  );
}

export function formatCalendarShortDate(date: Date, timezone: string) {
  return cleanSpanishDateLabel(
    new Intl.DateTimeFormat("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: timezone,
    }).format(date),
  );
}

export function formatCalendarCompactDate(date: Date, timezone: string) {
  return cleanSpanishDateLabel(
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      timeZone: timezone,
    }).format(date),
  );
}

export function formatCalendarTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

export function formatCalendarTimeRange(
  startAt: Date,
  endAt: Date,
  timezone: string,
) {
  return `${formatCalendarTime(startAt, timezone)} - ${formatCalendarTime(endAt, timezone)}`;
}

export function buildCalendarDays(
  view: CalendarViewMode,
  selectedDateParts: LocalDateParts,
  timezone: string,
): CalendarDayDefinition[] {
  const selectedDateValue = buildCalendarDateValue(selectedDateParts);
  const todayDateValue = buildCalendarDateValue(
    getCurrentCalendarDateParts(timezone),
  );
  const startParts =
    view === "week" ? getCalendarWeekStart(selectedDateParts) : selectedDateParts;
  const totalDays = view === "week" ? 7 : 1;

  return Array.from({ length: totalDays }, (_, index) => {
    const dayParts = shiftCalendarDateParts(startParts, index);
    const marker = buildClinicDateMarker(dayParts, timezone);
    const dateValue = buildCalendarDateValue(dayParts);

    return {
      key: dateValue,
      dateValue,
      marker,
      label: formatCalendarDayTitle(marker, timezone),
      shortLabel: formatCalendarShortDate(marker, timezone),
      isToday: dateValue === todayDateValue,
      isSelected: dateValue === selectedDateValue,
    };
  });
}

export function buildCalendarRangeLabel(
  view: CalendarViewMode,
  days: CalendarDayDefinition[],
  timezone: string,
) {
  if (!days.length) {
    return "";
  }

  if (view === "day") {
    return formatCalendarDayTitle(days[0].marker, timezone);
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  return `${formatCalendarCompactDate(firstDay.marker, timezone)} - ${formatCalendarCompactDate(lastDay.marker, timezone)}`;
}

export function buildCalendarRangeBounds(
  view: CalendarViewMode,
  selectedDateParts: LocalDateParts,
  timezone: string,
) {
  if (view === "week") {
    const startParts = getCalendarWeekStart(selectedDateParts);

    return {
      startAt: buildClinicDateTime(startParts, "00:00", timezone),
      endAt: buildClinicDateTime(
        shiftCalendarDateParts(startParts, 7),
        "00:00",
        timezone,
      ),
    };
  }

  return {
    startAt: buildClinicDateTime(selectedDateParts, "00:00", timezone),
    endAt: buildClinicDateTime(
      shiftCalendarDateParts(selectedDateParts, 1),
      "00:00",
      timezone,
    ),
  };
}

export function buildCalendarHourRows() {
  return Array.from(
    { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 },
    (_, index) => {
      const hour = CALENDAR_START_HOUR + index;

      return {
        key: `${hour}`,
        label: `${String(hour).padStart(2, "0")}:00`,
        top: index * CALENDAR_HOUR_HEIGHT,
      };
    },
  );
}

function getAppointmentMinutes(date: Date, timezone: string) {
  const parts = formatToParts(date, timezone);

  return parts.hour * 60 + parts.minute;
}

function normalizeTimelineBounds(startMinutes: number, endMinutes: number) {
  const visibleStart = CALENDAR_START_HOUR * 60;
  const visibleEnd = CALENDAR_END_HOUR * 60;
  const clippedStart = Math.max(startMinutes, visibleStart);
  const clippedEnd = Math.min(endMinutes, visibleEnd);

  if (clippedEnd <= clippedStart) {
    return null;
  }

  return {
    clippedStart,
    clippedEnd,
  };
}

type WorkingLayout = {
  appointment: CalendarAppointment;
  startMinutes: number;
  endMinutes: number;
  top: number;
  height: number;
  startLabel: string;
  endLabel: string;
  laneIndex: number;
};

function finalizeLayoutCluster(cluster: WorkingLayout[]) {
  const laneEnds: number[] = [];

  for (const item of cluster) {
    let laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= item.startMinutes);

    if (laneIndex === -1) {
      laneIndex = laneEnds.length;
      laneEnds.push(item.endMinutes);
    } else {
      laneEnds[laneIndex] = item.endMinutes;
    }

    item.laneIndex = laneIndex;
  }

  const laneCount = Math.max(laneEnds.length, 1);

  return cluster.map(
    (item) =>
      ({
        appointment: item.appointment,
        top: item.top,
        height: item.height,
        leftPercent: (item.laneIndex / laneCount) * 100,
        widthPercent: 100 / laneCount,
        startLabel: item.startLabel,
        endLabel: item.endLabel,
      }) satisfies CalendarAppointmentLayout,
  );
}

export function buildCalendarAppointmentLayouts(
  appointments: CalendarAppointment[],
  timezone: string,
) {
  const visibleAppointments = appointments
    .map((appointment) => {
      const startMinutes = getAppointmentMinutes(appointment.startAt, timezone);
      const endMinutes = getAppointmentMinutes(appointment.endAt, timezone);
      const bounds = normalizeTimelineBounds(startMinutes, endMinutes);

      if (!bounds) {
        return null;
      }

      const top =
        ((bounds.clippedStart - CALENDAR_START_HOUR * 60) / 60) *
        CALENDAR_HOUR_HEIGHT;
      const height = Math.max(
        ((bounds.clippedEnd - bounds.clippedStart) / 60) * CALENDAR_HOUR_HEIGHT,
        58,
      );

      return {
        appointment,
        startMinutes,
        endMinutes,
        top,
        height,
        startLabel: formatCalendarTime(appointment.startAt, timezone),
        endLabel: formatCalendarTime(appointment.endAt, timezone),
        laneIndex: 0,
      } satisfies WorkingLayout;
    })
    .filter((item): item is WorkingLayout => item !== null)
    .sort((left, right) => {
      if (left.startMinutes !== right.startMinutes) {
        return left.startMinutes - right.startMinutes;
      }

      return right.endMinutes - left.endMinutes;
    });

  const layouts: CalendarAppointmentLayout[] = [];
  let cluster: WorkingLayout[] = [];
  let clusterMaxEnd = -1;

  for (const item of visibleAppointments) {
    if (!cluster.length || item.startMinutes < clusterMaxEnd) {
      cluster.push(item);
      clusterMaxEnd = Math.max(clusterMaxEnd, item.endMinutes);
      continue;
    }

    layouts.push(...finalizeLayoutCluster(cluster));
    cluster = [item];
    clusterMaxEnd = item.endMinutes;
  }

  if (cluster.length) {
    layouts.push(...finalizeLayoutCluster(cluster));
  }

  return layouts;
}

export function groupAppointmentsByDateValue(
  appointments: CalendarAppointment[],
  timezone: string,
) {
  return appointments.reduce<Record<string, CalendarAppointment[]>>((accumulator, appointment) => {
    const parts = formatToParts(appointment.startAt, timezone);
    const key = buildCalendarDateValue({
      year: parts.year,
      month: parts.month,
      day: parts.day,
    });

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(appointment);

    return accumulator;
  }, {});
}

export function getCalendarStatusTone(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return {
        blockClassName:
          "border-emerald-200 bg-emerald-50/96 text-emerald-950 shadow-[0_18px_40px_-32px_rgba(5,150,105,0.42)]",
        badgeClassName:
          "border-emerald-200 bg-emerald-100 text-emerald-700",
        dotClassName: "bg-emerald-500",
      };
    case AppointmentStatus.PENDING:
      return {
        blockClassName:
          "border-amber-200 bg-amber-50/96 text-amber-950 shadow-[0_18px_40px_-32px_rgba(217,119,6,0.42)]",
        badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
        dotClassName: "bg-amber-500",
      };
    case AppointmentStatus.CANCELLED:
      return {
        blockClassName:
          "border-rose-200 bg-rose-50/96 text-rose-950 shadow-[0_18px_40px_-32px_rgba(225,29,72,0.34)]",
        badgeClassName: "border-rose-200 bg-rose-100 text-rose-700",
        dotClassName: "bg-rose-500",
      };
    case AppointmentStatus.COMPLETED:
      return {
        blockClassName:
          "border-brand-200 bg-brand-50/96 text-brand-950 shadow-[0_18px_40px_-32px_rgba(37,99,235,0.34)]",
        badgeClassName: "border-brand-200 bg-brand-100 text-brand-700",
        dotClassName: "bg-brand-500",
      };
    case AppointmentStatus.NO_SHOW:
      return {
        blockClassName:
          "border-slate-200 bg-slate-100/96 text-slate-900 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.24)]",
        badgeClassName: "border-slate-200 bg-slate-200 text-slate-700",
        dotClassName: "bg-slate-500",
      };
    case AppointmentStatus.RESCHEDULED:
    default:
      return {
        blockClassName:
          "border-slate-200 bg-white text-slate-900 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.2)]",
        badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
        dotClassName: "bg-slate-400",
      };
  }
}

export function getCalendarStatusLegend() {
  return [
    {
      status: AppointmentStatus.PENDING,
      label: "Pendiente",
      note: "Aún requiere confirmación o acción del negocio.",
    },
    {
      status: AppointmentStatus.CONFIRMED,
      label: "Confirmada",
      note: "Bloque activo dentro de la agenda del profesional.",
    },
    {
      status: AppointmentStatus.CANCELLED,
      label: "Cancelada",
      note: "Se conserva en historial, pero ya no bloquea horario.",
    },
    {
      status: AppointmentStatus.COMPLETED,
      label: "Completada",
      note: "Reserva atendida y cerrada operativamente.",
    },
    {
      status: AppointmentStatus.NO_SHOW,
      label: "No-show",
      note: "El cliente no asistió al horario reservado.",
    },
  ].map((item) => ({
    ...item,
    tone: getCalendarStatusTone(item.status),
  }));
}
