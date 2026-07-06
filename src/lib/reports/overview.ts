import { AppointmentStatus } from "@prisma/client";

import {
  buildClinicDateTime,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { getBookingTodayDateValue } from "@/lib/booking/public";
import { prisma } from "@/lib/prisma";
import type {
  ReportDailyRow,
  ReportFilterValues,
  ReportRankingRow,
  ReportsOverview,
} from "@/types/reports";

const DEFAULT_REPORT_RANGE_DAYS = 30;
const MAX_RANKING_ROWS = 8;

type ReportAppointmentRecord = {
  id: string;
  startAt: Date;
  status: AppointmentStatus;
  patient: {
    id: string;
    name: string;
    createdAt: Date;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
  };
};

type RankingAccumulator = {
  id: string;
  label: string;
  secondaryLabel: string | null;
  total: number;
  lastReservationAt: Date | null;
  statusBreakdown: Partial<Record<AppointmentStatus, number>>;
  href?: string;
};

function formatToDateParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getValue("year")),
    month: Number(getValue("month")),
    day: Number(getValue("day")),
  };
}

function buildDateValue(parts: { year: number; month: number; day: number }) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftDateParts(
  parts: { year: number; month: number; day: number },
  amount: number,
) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function formatRangeDateLabel(dateValue: string, timezone: string) {
  const parts = parseIsoDateInput(dateValue);

  if (!parts) {
    return dateValue;
  }

  const displayDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
  );

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(displayDate);
}

function formatDailyLabel(dateValue: string, timezone: string) {
  const parts = parseIsoDateInput(dateValue);

  if (!parts) {
    return dateValue;
  }

  const displayDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
  );

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: timezone,
  }).format(displayDate);
}

function formatLocalDateValue(date: Date, timezone: string) {
  return buildDateValue(formatToDateParts(date, timezone));
}

function buildDefaultReportRange(timezone: string) {
  const todayValue = getBookingTodayDateValue(timezone);
  const todayParts = parseIsoDateInput(todayValue);

  if (!todayParts) {
    throw new Error("No se pudo resolver la fecha base del reporte.");
  }

  const fromParts = shiftDateParts(todayParts, -(DEFAULT_REPORT_RANGE_DAYS - 1));

  return {
    from: buildDateValue(fromParts),
    to: todayValue,
  };
}

export function resolveReportFilters(params: {
  timezone: string;
  from?: string;
  to?: string;
  doctorId?: string;
  serviceId?: string;
}): ReportFilterValues {
  const defaults = buildDefaultReportRange(params.timezone);
  const inputFrom = params.from?.trim() ?? "";
  const inputTo = params.to?.trim() ?? "";
  const fromParts = parseIsoDateInput(inputFrom);
  const toParts = parseIsoDateInput(inputTo);

  let from = fromParts ? inputFrom : defaults.from;
  let to = toParts ? inputTo : defaults.to;

  if (from > to) {
    [from, to] = [to, from];
  }

  return {
    from,
    to,
    doctorId: params.doctorId?.trim() ?? "",
    serviceId: params.serviceId?.trim() ?? "",
  };
}

function ensureDailyRow(
  accumulator: Map<string, ReportDailyRow>,
  dateValue: string,
  timezone: string,
) {
  const existing = accumulator.get(dateValue);

  if (existing) {
    return existing;
  }

  const row: ReportDailyRow = {
    dateValue,
    label: formatDailyLabel(dateValue, timezone),
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0,
  };

  accumulator.set(dateValue, row);

  return row;
}

function incrementStatusBreakdown(
  breakdown: Partial<Record<AppointmentStatus, number>>,
  status: AppointmentStatus,
) {
  breakdown[status] = (breakdown[status] ?? 0) + 1;
}

function updateRankingAccumulator(
  accumulator: Map<string, RankingAccumulator>,
  params: {
    id: string;
    label: string;
    secondaryLabel: string | null;
    status: AppointmentStatus;
    startAt: Date;
    href?: string;
  },
) {
  const current =
    accumulator.get(params.id) ??
    ({
      id: params.id,
      label: params.label,
      secondaryLabel: params.secondaryLabel,
      total: 0,
      lastReservationAt: null,
      statusBreakdown: {},
      href: params.href,
    } satisfies RankingAccumulator);

  current.total += 1;
  incrementStatusBreakdown(current.statusBreakdown, params.status);

  if (
    !current.lastReservationAt ||
    params.startAt.getTime() > current.lastReservationAt.getTime()
  ) {
    current.lastReservationAt = params.startAt;
  }

  accumulator.set(params.id, current);
}

function sortRankingRows(rows: RankingAccumulator[]) {
  return rows.sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }

    const rightTime = right.lastReservationAt?.getTime() ?? 0;
    const leftTime = left.lastReservationAt?.getTime() ?? 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return left.label.localeCompare(right.label, "es");
  });
}

function sliceRankingRows(rows: RankingAccumulator[]): ReportRankingRow[] {
  return rows.slice(0, MAX_RANKING_ROWS).map((row) => ({
    id: row.id,
    label: row.label,
    secondaryLabel: row.secondaryLabel,
    total: row.total,
    lastReservationAt: row.lastReservationAt,
    statusBreakdown: row.statusBreakdown,
    href: row.href,
  }));
}

export async function getReportsOverview(params: {
  clinicId: string;
  timezone: string;
  filters: ReportFilterValues;
}): Promise<ReportsOverview> {
  const fromParts = parseIsoDateInput(params.filters.from);
  const toParts = parseIsoDateInput(params.filters.to);

  if (!fromParts || !toParts) {
    throw new Error("No se pudo resolver el rango del reporte.");
  }

  const startAt = buildClinicDateTime(fromParts, "00:00", params.timezone);
  const endAt = buildClinicDateTime(
    shiftDateParts(toParts, 1),
    "00:00",
    params.timezone,
  );

  const appointmentWhere = {
    clinicId: params.clinicId,
    startAt: {
      gte: startAt,
      lt: endAt,
    },
    ...(params.filters.doctorId ? { doctorId: params.filters.doctorId } : {}),
    ...(params.filters.serviceId ? { serviceId: params.filters.serviceId } : {}),
  };

  const appointments = await prisma.appointment.findMany({
    where: appointmentWhere,
    orderBy: [{ startAt: "asc" }],
    select: {
      id: true,
      startAt: true,
      status: true,
      patient: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
    },
  });

  const newClientsCount =
    !params.filters.doctorId && !params.filters.serviceId
      ? await prisma.patient.count({
          where: {
            clinicId: params.clinicId,
            createdAt: {
              gte: startAt,
              lt: endAt,
            },
          },
        })
      : new Set(
          appointments
            .filter(
              (appointment) =>
                appointment.patient.createdAt >= startAt &&
                appointment.patient.createdAt < endAt,
            )
            .map((appointment) => appointment.patient.id),
        ).size;

  const typedAppointments = appointments as ReportAppointmentRecord[];
  const dailyRowsMap = new Map<string, ReportDailyRow>();
  const serviceRowsMap = new Map<string, RankingAccumulator>();
  const professionalRowsMap = new Map<string, RankingAccumulator>();
  const clientRowsMap = new Map<string, RankingAccumulator>();

  let cursor = params.filters.from;

  while (cursor <= params.filters.to) {
    ensureDailyRow(dailyRowsMap, cursor, params.timezone);

    const cursorParts = parseIsoDateInput(cursor);

    if (!cursorParts) {
      break;
    }

    cursor = buildDateValue(shiftDateParts(cursorParts, 1));
  }

  for (const appointment of typedAppointments) {
    const dayKey = formatLocalDateValue(appointment.startAt, params.timezone);
    const dayRow = ensureDailyRow(dailyRowsMap, dayKey, params.timezone);

    dayRow.total += 1;

    switch (appointment.status) {
      case AppointmentStatus.CONFIRMED:
        dayRow.confirmed += 1;
        break;
      case AppointmentStatus.PENDING:
        dayRow.pending += 1;
        break;
      case AppointmentStatus.CANCELLED:
        dayRow.cancelled += 1;
        break;
      case AppointmentStatus.COMPLETED:
        dayRow.completed += 1;
        break;
      case AppointmentStatus.NO_SHOW:
        dayRow.noShow += 1;
        break;
      default:
        break;
    }

    updateRankingAccumulator(serviceRowsMap, {
      id: appointment.service.id,
      label: appointment.service.name,
      secondaryLabel: `${appointment.service.durationMinutes} min`,
      status: appointment.status,
      startAt: appointment.startAt,
    });
    updateRankingAccumulator(professionalRowsMap, {
      id: appointment.doctor.id,
      label: appointment.doctor.name,
      secondaryLabel: appointment.doctor.specialty,
      status: appointment.status,
      startAt: appointment.startAt,
    });
    updateRankingAccumulator(clientRowsMap, {
      id: appointment.patient.id,
      label: appointment.patient.name,
      secondaryLabel: null,
      status: appointment.status,
      startAt: appointment.startAt,
      href: `/app/patients/${appointment.patient.id}`,
    });
  }

  const totalReservations = typedAppointments.length;
  const confirmedCount = typedAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CONFIRMED,
  ).length;
  const pendingCount = typedAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.PENDING,
  ).length;
  const cancelledCount = typedAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CANCELLED,
  ).length;
  const completedCount = typedAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.COMPLETED,
  ).length;
  const noShowCount = typedAppointments.filter(
    (appointment) => appointment.status === AppointmentStatus.NO_SHOW,
  ).length;

  return {
    dateRange: {
      from: params.filters.from,
      to: params.filters.to,
      fromLabel: formatRangeDateLabel(params.filters.from, params.timezone),
      toLabel: formatRangeDateLabel(params.filters.to, params.timezone),
    },
    metrics: {
      totalReservations,
      confirmedCount,
      pendingCount,
      cancelledCount,
      completedCount,
      noShowCount,
      newClientsCount,
      cancellationRate: totalReservations
        ? (cancelledCount / totalReservations) * 100
        : 0,
      noShowRate: totalReservations ? (noShowCount / totalReservations) * 100 : 0,
    },
    reservationsByDay: Array.from(dailyRowsMap.values()).sort((left, right) =>
      left.dateValue.localeCompare(right.dateValue),
    ),
    topServices: sliceRankingRows(sortRankingRows(Array.from(serviceRowsMap.values()))),
    topProfessionals: sliceRankingRows(
      sortRankingRows(Array.from(professionalRowsMap.values())),
    ),
    topClients: sliceRankingRows(sortRankingRows(Array.from(clientRowsMap.values()))),
  };
}

export function formatReportPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}
