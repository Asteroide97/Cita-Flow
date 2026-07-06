import {
  AppointmentStatus,
  NotificationStatus,
  WaitlistOfferStatus,
  WaitlistStatus,
} from "@prisma/client";

import {
  buildClinicDateMarker,
  buildClinicDateTime,
  formatDateInTimeZone,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { getBookingTodayDateValue } from "@/lib/booking/public";
import { prisma } from "@/lib/prisma";

const DASHBOARD_DAY_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.NO_SHOW,
] as const;

type DailyAppointmentRecord = {
  id: string;
  startAt: Date;
  status: AppointmentStatus;
  patient: {
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  };
  service: {
    name: string;
  };
};

export type DashboardTodayOperationsSummary = {
  dateValue: string;
  dateLabel: string;
  totalReservations: number;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
  completedCount: number;
  noShowCount: number;
  professionalsWithReservationsCount: number;
  remainingSlotsTodayCount: number | null;
  remainingSlotsTodayNote: string;
  nextAppointment: {
    id: string;
    timeLabel: string;
    summary: string;
  } | null;
};

export type DashboardPendingAttentionSummary = {
  pendingAppointmentsCount: number;
  activeWaitlistEntriesCount: number;
  pendingNotificationsCount: number;
  pendingWaitlistOffersCount: number;
  totalPendingCount: number;
};

export type DashboardTodayOverview = {
  today: DashboardTodayOperationsSummary;
  pending: DashboardPendingAttentionSummary;
};

function shiftDateParts(
  parts: NonNullable<ReturnType<typeof parseIsoDateInput>>,
  amount: number,
) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function formatTimeInTimeZone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function buildTodayRange(timezone: string) {
  const todayDateValue = getBookingTodayDateValue(timezone);
  const todayParts = parseIsoDateInput(todayDateValue);

  if (!todayParts) {
    throw new Error("No se pudo resolver la fecha actual del negocio.");
  }

  return {
    todayDateValue,
    todayMarker: buildClinicDateMarker(todayParts, timezone),
    dayStart: buildClinicDateTime(todayParts, "00:00", timezone),
    dayEnd: buildClinicDateTime(shiftDateParts(todayParts, 1), "00:00", timezone),
  };
}

function countAppointmentsByStatus(
  appointments: DailyAppointmentRecord[],
  status: AppointmentStatus,
) {
  return appointments.filter((appointment) => appointment.status === status).length;
}

function buildRemainingSlotsNote(params: {
  remainingSlotsTodayCount: number | null;
  shortestServiceName: string | null;
  hasActiveDoctors: boolean;
}) {
  if (params.remainingSlotsTodayCount === null) {
    if (!params.shortestServiceName) {
      return "Agrega al menos un servicio activo para calcular huecos restantes hoy.";
    }

    if (!params.hasActiveDoctors) {
      return "Agrega al menos un profesional activo para calcular huecos restantes hoy.";
    }

    return "No se pudo calcular la disponibilidad restante de hoy.";
  }

  if (params.remainingSlotsTodayCount === 0) {
    return params.shortestServiceName
      ? `No quedan huecos para hoy usando ${params.shortestServiceName}.`
      : "No quedan huecos disponibles para hoy.";
  }

  return params.shortestServiceName
    ? `Calculados con ${params.shortestServiceName}, el servicio activo mas corto.`
    : "Calculados con la disponibilidad real restante de hoy.";
}

export async function getDashboardTodayOverview(
  clinicId: string,
): Promise<DashboardTodayOverview> {
  const clinic = await prisma.clinic.findUnique({
    where: {
      id: clinicId,
    },
    select: {
      id: true,
      timezone: true,
    },
  });

  if (!clinic) {
    throw new Error("No se pudo cargar la operacion diaria del negocio.");
  }

  const { todayDateValue, todayMarker, dayStart, dayEnd } = buildTodayRange(
    clinic.timezone,
  );
  const [
    activeDoctors,
    shortestActiveService,
    todayAppointments,
    pendingAppointmentsCount,
    activeWaitlistEntriesCount,
    pendingNotificationsCount,
    pendingWaitlistOffersCount,
  ] = await prisma.$transaction([
    prisma.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.service.findFirst({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: [{ durationMinutes: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId,
        startAt: {
          gte: dayStart,
          lt: dayEnd,
        },
        status: {
          in: [...DASHBOARD_DAY_STATUSES],
        },
      },
      orderBy: [{ startAt: "asc" }],
      select: {
        id: true,
        startAt: true,
        status: true,
        patient: {
          select: {
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.waitlistEntry.count({
      where: {
        clinicId,
        status: {
          in: [WaitlistStatus.ACTIVE, WaitlistStatus.OFFERED],
        },
      },
    }),
    prisma.notificationOutbox.count({
      where: {
        clinicId,
        status: NotificationStatus.PENDING,
      },
    }),
    prisma.waitlistOffer.count({
      where: {
        clinicId,
        status: WaitlistOfferStatus.PENDING,
      },
    }),
  ]);
  const now = new Date();
  const visibleTodayAppointments = todayAppointments;
  const nextAppointmentRecord =
    visibleTodayAppointments.find(
      (appointment) =>
        appointment.startAt >= now &&
        (appointment.status === AppointmentStatus.PENDING ||
          appointment.status === AppointmentStatus.CONFIRMED),
    ) ?? null;

  let remainingSlotsTodayCount: number | null = null;

  if (activeDoctors.length && shortestActiveService) {
    const slotResults = await Promise.all(
      activeDoctors.map((doctor) =>
        getAvailableSlots(
          {
            clinicId,
            doctorId: doctor.id,
            serviceId: shortestActiveService.id,
            date: todayMarker,
          },
          true,
        ),
      ),
    );

    remainingSlotsTodayCount = slotResults.reduce((total, result) => {
      const remainingForDoctor = result.slots.filter((slot) => slot.startAt >= now).length;

      return total + remainingForDoctor;
    }, 0);
  }

  const professionalsWithReservationsCount = new Set(
    visibleTodayAppointments
      .filter((appointment) => appointment.status !== AppointmentStatus.CANCELLED)
      .map((appointment) => appointment.doctor.id),
  ).size;

  const todaySummary: DashboardTodayOperationsSummary = {
    dateValue: todayDateValue,
    dateLabel: formatDateInTimeZone(todayMarker, clinic.timezone),
    totalReservations: visibleTodayAppointments.length,
    confirmedCount: countAppointmentsByStatus(
      visibleTodayAppointments,
      AppointmentStatus.CONFIRMED,
    ),
    pendingCount: countAppointmentsByStatus(
      visibleTodayAppointments,
      AppointmentStatus.PENDING,
    ),
    cancelledCount: countAppointmentsByStatus(
      visibleTodayAppointments,
      AppointmentStatus.CANCELLED,
    ),
    completedCount: countAppointmentsByStatus(
      visibleTodayAppointments,
      AppointmentStatus.COMPLETED,
    ),
    noShowCount: countAppointmentsByStatus(
      visibleTodayAppointments,
      AppointmentStatus.NO_SHOW,
    ),
    professionalsWithReservationsCount,
    remainingSlotsTodayCount,
    remainingSlotsTodayNote: buildRemainingSlotsNote({
      remainingSlotsTodayCount,
      shortestServiceName: shortestActiveService?.name ?? null,
      hasActiveDoctors: activeDoctors.length > 0,
    }),
    nextAppointment: nextAppointmentRecord
      ? {
          id: nextAppointmentRecord.id,
          timeLabel: formatTimeInTimeZone(
            nextAppointmentRecord.startAt,
            clinic.timezone,
          ),
          summary: `${nextAppointmentRecord.patient.name} con ${nextAppointmentRecord.doctor.name} - ${nextAppointmentRecord.service.name}`,
        }
      : null,
  };

  const pendingSummary: DashboardPendingAttentionSummary = {
    pendingAppointmentsCount,
    activeWaitlistEntriesCount,
    pendingNotificationsCount,
    pendingWaitlistOffersCount,
    totalPendingCount:
      pendingAppointmentsCount +
      activeWaitlistEntriesCount +
      pendingNotificationsCount +
      pendingWaitlistOffersCount,
  };

  return {
    today: todaySummary,
    pending: pendingSummary,
  };
}
