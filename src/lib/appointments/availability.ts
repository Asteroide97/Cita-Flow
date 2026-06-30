import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
  Weekday,
} from "@prisma/client";

import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  createAppointmentTokens,
  type AppointmentSelfServiceLinks,
} from "@/lib/appointments/tokens";

type AvailabilityClient = Prisma.TransactionClient | typeof prisma;

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
] as const;

const DEFAULT_SLOT_INTERVAL_MINUTES = 30;
const MINUTES_PER_DAY = 24 * 60;

const WEEKDAY_LABELS: Record<Weekday, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miercoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sabado",
  SUNDAY: "Domingo",
};

const JS_DAY_TO_WEEKDAY: Record<number, Weekday> = {
  0: Weekday.SUNDAY,
  1: Weekday.MONDAY,
  2: Weekday.TUESDAY,
  3: Weekday.WEDNESDAY,
  4: Weekday.THURSDAY,
  5: Weekday.FRIDAY,
  6: Weekday.SATURDAY,
};

export const WEEKDAY_OPTIONS = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
].map((value) => ({
  value,
  label: WEEKDAY_LABELS[value],
}));

export type LocalDateParts = {
  year: number;
  month: number;
  day: number;
};

export type AvailableSlot = {
  startAt: Date;
  endAt: Date;
  startTime: string;
  endTime: string;
};

export type GetAvailableSlotsResult = {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  timezone: string;
  date: Date;
  slots: AvailableSlot[];
};

export type AppointmentSlotValidationResult =
  | {
      ok: true;
      reason: null;
      message: string;
      timezone: string;
      startAt: Date;
      endAt: Date;
      serviceDurationMinutes: number;
      availableSlots: AvailableSlot[];
    }
  | {
      ok: false;
      reason:
        | "CLINIC_NOT_FOUND"
        | "DOCTOR_NOT_FOUND"
        | "DOCTOR_INACTIVE"
        | "SERVICE_NOT_FOUND"
        | "SERVICE_INACTIVE"
        | "PATIENT_NOT_FOUND"
        | "OUTSIDE_AVAILABILITY"
        | "DOCTOR_TIME_OFF"
        | "CLINIC_BLOCKED_TIME"
        | "APPOINTMENT_CONFLICT";
      message: string;
      timezone: string;
      startAt: Date;
      endAt: Date | null;
      serviceDurationMinutes: number | null;
      availableSlots: AvailableSlot[];
    };

export type CreateAppointmentSafelyInput = {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  patientId: string;
  startAt: Date;
  status?: AppointmentStatus;
  source?: AppointmentSource;
  notes?: string | null;
  actorUserId?: string | null;
  db?: AvailabilityClient;
};

export type CreateAppointmentSafelyResult = {
  id: string;
  clinicId: string;
  doctorId: string;
  serviceId: string;
  patientId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  selfServiceLinks: AppointmentSelfServiceLinks | null;
};

type CandidateContext = {
  timezone: string;
  localDateParts: LocalDateParts;
  availabilityBlocks: Array<{
    id: string;
    dayOfWeek: Weekday;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  timeOffs: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
  }>;
  clinicBlockedTimes: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    reason: string | null;
  }>;
  activeAppointments: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
  }>;
};

type SlotCheckResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "OUTSIDE_AVAILABILITY"
        | "DOCTOR_TIME_OFF"
        | "CLINIC_BLOCKED_TIME"
        | "APPOINTMENT_CONFLICT";
      message: string;
    };

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
  const getValue = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getValue("year")),
    month: Number(getValue("month")),
    day: Number(getValue("day")),
    hour: Number(getValue("hour")),
    minute: Number(getValue("minute")),
  };
}

function getLocalDateParts(date: Date, timezone: string): LocalDateParts {
  const parts = formatToParts(date, timezone);

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
  };
}

function buildDateKey(parts: LocalDateParts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function shiftLocalDate(parts: LocalDateParts, amount: number) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function getWeekdayForLocalDate(parts: LocalDateParts) {
  const dayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();

  return JS_DAY_TO_WEEKDAY[dayIndex];
}

function parseTimeToMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const totalMinutes = ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function buildUtcDateForClinicTime(
  parts: LocalDateParts,
  time: string,
  timezone: string,
) {
  const minutes = parseTimeToMinutes(time);

  if (minutes === null) {
    throw new Error(`Hora invalida: ${time}`);
  }

  let guess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0,
    ),
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoned = formatToParts(guess, timezone);
    const desiredAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      Math.floor(minutes / 60),
      minutes % 60,
      0,
      0,
    );
    const actualAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      0,
      0,
    );
    const diff = desiredAsUtc - actualAsUtc;

    if (diff === 0) {
      return guess;
    }

    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

function buildCandidateEnd(startAt: Date, durationMinutes: number) {
  return new Date(startAt.getTime() + durationMinutes * 60 * 1000);
}

function isCandidateInActiveAvailability(
  context: CandidateContext,
  startTime: string,
  endTime: string,
) {
  const slotStartMinutes = parseTimeToMinutes(startTime);
  const slotEndMinutes = parseTimeToMinutes(endTime);

  if (slotStartMinutes === null || slotEndMinutes === null) {
    return false;
  }

  return context.availabilityBlocks.some((block) => {
    if (!block.isActive || block.dayOfWeek !== getWeekdayForLocalDate(context.localDateParts)) {
      return false;
    }

    const blockStart = parseTimeToMinutes(block.startTime);
    const blockEnd = parseTimeToMinutes(block.endTime);

    if (blockStart === null || blockEnd === null) {
      return false;
    }

    return slotStartMinutes >= blockStart && slotEndMinutes <= blockEnd;
  });
}

function checkCandidateAgainstContext(
  context: CandidateContext,
  startAt: Date,
  endAt: Date,
): SlotCheckResult {
  const startParts = formatToParts(startAt, context.timezone);
  const endParts = formatToParts(endAt, context.timezone);
  const startTime = `${String(startParts.hour).padStart(2, "0")}:${String(startParts.minute).padStart(2, "0")}`;
  const endTime = `${String(endParts.hour).padStart(2, "0")}:${String(endParts.minute).padStart(2, "0")}`;
  const startDateKey = buildDateKey({
    year: startParts.year,
    month: startParts.month,
    day: startParts.day,
  });
  const endDateKey = buildDateKey({
    year: endParts.year,
    month: endParts.month,
    day: endParts.day,
  });

  if (startDateKey !== endDateKey) {
    return {
      ok: false,
      reason: "OUTSIDE_AVAILABILITY",
      message: "La cita propuesta se sale del mismo dia operativo del doctor.",
    };
  }

  if (!isCandidateInActiveAvailability(context, startTime, endTime)) {
    return {
      ok: false,
      reason: "OUTSIDE_AVAILABILITY",
      message: "Ese horario queda fuera de la disponibilidad activa del doctor.",
    };
  }

  const doctorTimeOff = context.timeOffs.find((item) =>
    rangesOverlap(startAt, endAt, item.startAt, item.endAt),
  );

  if (doctorTimeOff) {
    return {
      ok: false,
      reason: "DOCTOR_TIME_OFF",
      message: "Ese horario cae dentro de una ausencia o bloqueo del doctor.",
    };
  }

  const clinicBlockedTime = context.clinicBlockedTimes.find((item) =>
    rangesOverlap(startAt, endAt, item.startAt, item.endAt),
  );

  if (clinicBlockedTime) {
    return {
      ok: false,
      reason: "CLINIC_BLOCKED_TIME",
      message: "Ese horario esta bloqueado a nivel consultorio.",
    };
  }

  const conflictingAppointment = context.activeAppointments.find((item) =>
    rangesOverlap(startAt, endAt, item.startAt, item.endAt),
  );

  if (conflictingAppointment) {
    return {
      ok: false,
      reason: "APPOINTMENT_CONFLICT",
      message: "Ya existe otra cita activa ocupando ese horario.",
    };
  }

  return { ok: true };
}

function buildSlotFromMinutes(
  localDateParts: LocalDateParts,
  startMinutes: number,
  durationMinutes: number,
  timezone: string,
): AvailableSlot {
  const startTime = minutesToTime(startMinutes);
  const startAt = buildUtcDateForClinicTime(localDateParts, startTime, timezone);
  const endAt = buildCandidateEnd(startAt, durationMinutes);
  const endParts = formatToParts(endAt, timezone);
  const endTime = `${String(endParts.hour).padStart(2, "0")}:${String(endParts.minute).padStart(2, "0")}`;

  return {
    startAt,
    endAt,
    startTime,
    endTime,
  };
}

async function loadAvailabilityContext(
  clinicId: string,
  doctorId: string,
  serviceId: string,
  date: Date,
  db: AvailabilityClient,
  excludeAppointmentId?: string,
) {
  const [clinic, doctor, service] = await Promise.all([
    db.clinic.findUnique({
      where: {
        id: clinicId,
      },
      select: {
        id: true,
        timezone: true,
      },
    }),
    db.doctor.findFirst({
      where: {
        id: doctorId,
        clinicId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),
    db.service.findFirst({
      where: {
        id: serviceId,
        clinicId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        durationMinutes: true,
      },
    }),
  ]);

  if (!clinic || !doctor || !service) {
    return {
      clinic,
      doctor,
      service,
      context: null,
    };
  }

  const localDateParts = getLocalDateParts(date, clinic.timezone);
  const dayStart = buildUtcDateForClinicTime(localDateParts, "00:00", clinic.timezone);
  const nextDayStart = buildUtcDateForClinicTime(
    shiftLocalDate(localDateParts, 1),
    "00:00",
    clinic.timezone,
  );
  const weekday = getWeekdayForLocalDate(localDateParts);

  const [availabilityBlocks, timeOffs, clinicBlockedTimes, activeAppointments] =
    await Promise.all([
      db.doctorAvailability.findMany({
        where: {
          clinicId,
          doctorId,
          dayOfWeek: weekday,
        },
        orderBy: [{ startTime: "asc" }, { endTime: "asc" }],
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
        },
      }),
      db.doctorTimeOff.findMany({
        where: {
          clinicId,
          doctorId,
          startAt: {
            lt: nextDayStart,
          },
          endAt: {
            gt: dayStart,
          },
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          reason: true,
        },
      }),
      db.clinicBlockedTime.findMany({
        where: {
          clinicId,
          startAt: {
            lt: nextDayStart,
          },
          endAt: {
            gt: dayStart,
          },
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          reason: true,
        },
      }),
      db.appointment.findMany({
        where: {
          clinicId,
          doctorId,
          status: {
            in: [...ACTIVE_APPOINTMENT_STATUSES],
          },
          startAt: {
            lt: nextDayStart,
          },
          endAt: {
            gt: dayStart,
          },
          ...(excludeAppointmentId
            ? {
                id: {
                  not: excludeAppointmentId,
                },
              }
            : {}),
        },
        orderBy: {
          startAt: "asc",
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
        },
      }),
    ]);

  return {
    clinic,
    doctor,
    service,
    context: {
      timezone: clinic.timezone,
      localDateParts,
      availabilityBlocks,
      timeOffs,
      clinicBlockedTimes,
      activeAppointments,
    } satisfies CandidateContext,
  };
}

async function validateAppointmentSlotInternal({
  clinicId,
  doctorId,
  serviceId,
  patientId,
  startAt,
  db,
  actorUserId,
  excludeAppointmentId,
  skipAudit,
}: {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  patientId?: string | null;
  startAt: Date;
  db: AvailabilityClient;
  actorUserId?: string | null;
  excludeAppointmentId?: string;
  skipAudit?: boolean;
}): Promise<AppointmentSlotValidationResult> {
  const loaded = await loadAvailabilityContext(
    clinicId,
    doctorId,
    serviceId,
    startAt,
    db,
    excludeAppointmentId,
  );

  const timezone = loaded.clinic?.timezone ?? "America/Mexico_City";

  if (!loaded.clinic) {
    return {
      ok: false,
      reason: "CLINIC_NOT_FOUND",
      message: "No se encontro la clinica activa para validar el horario.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: null,
      availableSlots: [],
    };
  }

  if (!loaded.doctor) {
    return {
      ok: false,
      reason: "DOCTOR_NOT_FOUND",
      message: "No se encontro el doctor dentro de esta clinica.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: null,
      availableSlots: [],
    };
  }

  if (!loaded.doctor.isActive) {
    return {
      ok: false,
      reason: "DOCTOR_INACTIVE",
      message: "El doctor esta inactivo y no puede recibir citas.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: null,
      availableSlots: [],
    };
  }

  if (!loaded.service) {
    return {
      ok: false,
      reason: "SERVICE_NOT_FOUND",
      message: "No se encontro el servicio dentro de esta clinica.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: null,
      availableSlots: [],
    };
  }

  if (!loaded.service.isActive) {
    return {
      ok: false,
      reason: "SERVICE_INACTIVE",
      message: "El servicio esta inactivo y no se puede agendar.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: null,
      availableSlots: [],
    };
  }

  if (patientId) {
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return {
        ok: false,
        reason: "PATIENT_NOT_FOUND",
        message: "El paciente no pertenece a esta clinica.",
        timezone,
        startAt,
        endAt: null,
        serviceDurationMinutes: loaded.service.durationMinutes,
        availableSlots: [],
      };
    }
  }

  if (!loaded.context) {
    return {
      ok: false,
      reason: "OUTSIDE_AVAILABILITY",
      message: "No se pudo resolver la disponibilidad del doctor.",
      timezone,
      startAt,
      endAt: null,
      serviceDurationMinutes: loaded.service.durationMinutes,
      availableSlots: [],
    };
  }

  const endAt = buildCandidateEnd(startAt, loaded.service.durationMinutes);
  const slotCheck = checkCandidateAgainstContext(loaded.context, startAt, endAt);

  if (slotCheck.ok) {
    const result: AppointmentSlotValidationResult = {
      ok: true,
      reason: null,
      message: "El horario esta disponible para crear la cita.",
      timezone,
      startAt,
      endAt,
      serviceDurationMinutes: loaded.service.durationMinutes,
      availableSlots: [],
    };

    if (!skipAudit) {
      await createAuditLog(
        {
          clinicId,
          userId: actorUserId ?? null,
          action: "APPOINTMENT_SLOT_VALIDATED",
          entityType: "APPOINTMENT_SLOT",
          metadata: {
            doctorId,
            serviceId,
            patientId: patientId ?? null,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            result: "AVAILABLE",
          },
        },
        db,
      );
    }

    return result;
  }

  const alternatives = await getAvailableSlots(
    {
      clinicId,
      doctorId,
      serviceId,
      date: startAt,
      db,
    },
    true,
  );

  const result: AppointmentSlotValidationResult = {
    ok: false,
    reason: slotCheck.reason,
    message: slotCheck.message,
    timezone,
    startAt,
    endAt,
    serviceDurationMinutes: loaded.service.durationMinutes,
    availableSlots: alternatives.slots,
  };

  if (!skipAudit) {
    await createAuditLog(
      {
        clinicId,
        userId: actorUserId ?? null,
        action: "APPOINTMENT_SLOT_VALIDATED",
        entityType: "APPOINTMENT_SLOT",
        metadata: {
          doctorId,
          serviceId,
          patientId: patientId ?? null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          result: slotCheck.reason,
          alternativeSlots: alternatives.slots.map((slot) => slot.startTime),
        },
      },
      db,
    );
  }

  return result;
}

export function getWeekdayLabel(dayOfWeek: Weekday) {
  return WEEKDAY_LABELS[dayOfWeek];
}

export function buildClinicDateMarker(parts: LocalDateParts, timezone: string) {
  return buildUtcDateForClinicTime(parts, "12:00", timezone);
}

export function buildClinicDateTime(
  parts: LocalDateParts,
  time: string,
  timezone: string,
) {
  return buildUtcDateForClinicTime(parts, time, timezone);
}

export function parseIsoDateInput(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  } satisfies LocalDateParts;
}

export function parseDateTimeLocalInput(value: string, timezone: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  return buildUtcDateForClinicTime(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    },
    `${match[4]}:${match[5]}`,
    timezone,
  );
}

export function formatDateInTimeZone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatDateTimeInTimeZone(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export async function getDoctorAvailability({
  clinicId,
  doctorId,
  db = prisma,
}: {
  clinicId: string;
  doctorId: string;
  db?: AvailabilityClient;
}) {
  const doctor = await db.doctor.findFirst({
    where: {
      id: doctorId,
      clinicId,
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
      isActive: true,
      clinic: {
        select: {
          id: true,
          name: true,
          timezone: true,
        },
      },
      availabilityBlocks: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { endTime: "asc" }],
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      timeOffs: {
        where: {
          endAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          startAt: "asc",
        },
        take: 12,
        select: {
          id: true,
          startAt: true,
          endAt: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });

  if (!doctor) {
    return null;
  }

  const clinicBlockedTimes = await db.clinicBlockedTime.findMany({
    where: {
      clinicId,
      endAt: {
        gte: new Date(),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    take: 12,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      reason: true,
      createdAt: true,
    },
  });

  return {
    doctor,
    timezone: doctor.clinic.timezone,
    clinicBlockedTimes,
  };
}

export async function getAvailableSlots(
  {
    clinicId,
    doctorId,
    serviceId,
    date,
    excludeAppointmentId,
    db = prisma,
  }: {
    clinicId: string;
    doctorId: string;
    serviceId: string;
    date: Date;
    excludeAppointmentId?: string;
    db?: AvailabilityClient;
  },
  skipValidationAudit = false,
): Promise<GetAvailableSlotsResult> {
  const loaded = await loadAvailabilityContext(
    clinicId,
    doctorId,
    serviceId,
    date,
    db,
    excludeAppointmentId,
  );
  const timezone = loaded.clinic?.timezone ?? "America/Mexico_City";

  if (
    !loaded.clinic ||
    !loaded.doctor ||
    !loaded.service ||
    !loaded.doctor.isActive ||
    !loaded.service.isActive ||
    !loaded.context
  ) {
    return {
      clinicId,
      doctorId,
      serviceId,
      timezone,
      date,
      slots: [],
    };
  }

  const candidateSlots: AvailableSlot[] = [];
  const seenSlots = new Set<string>();

  for (const block of loaded.context.availabilityBlocks) {
    if (!block.isActive) {
      continue;
    }

    const blockStart = parseTimeToMinutes(block.startTime);
    const blockEnd = parseTimeToMinutes(block.endTime);

    if (blockStart === null || blockEnd === null || blockEnd <= blockStart) {
      continue;
    }

    for (
      let slotStart = blockStart;
      slotStart + loaded.service.durationMinutes <= blockEnd;
      slotStart += DEFAULT_SLOT_INTERVAL_MINUTES
    ) {
      const slot = buildSlotFromMinutes(
        loaded.context.localDateParts,
        slotStart,
        loaded.service.durationMinutes,
        timezone,
      );

      if (seenSlots.has(slot.startTime)) {
        continue;
      }

      const slotCheck = checkCandidateAgainstContext(
        loaded.context,
        slot.startAt,
        slot.endAt,
      );

      if (slotCheck.ok) {
        seenSlots.add(slot.startTime);
        candidateSlots.push(slot);
      }
    }
  }

  if (!skipValidationAudit && candidateSlots.length) {
    candidateSlots.sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
  }

  return {
    clinicId,
    doctorId,
    serviceId,
    timezone,
    date: buildClinicDateMarker(loaded.context.localDateParts, timezone),
    slots: candidateSlots.sort((left, right) => left.startAt.getTime() - right.startAt.getTime()),
  };
}

export async function validateAppointmentSlot({
  clinicId,
  doctorId,
  serviceId,
  patientId,
  startAt,
  actorUserId,
  excludeAppointmentId,
  db = prisma,
}: {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  patientId?: string | null;
  startAt: Date;
  actorUserId?: string | null;
  excludeAppointmentId?: string;
  db?: AvailabilityClient;
}) {
  return validateAppointmentSlotInternal({
    clinicId,
    doctorId,
    serviceId,
    patientId,
    startAt,
    actorUserId,
    excludeAppointmentId,
    db,
  });
}

export async function createAppointmentSafely({
  clinicId,
  doctorId,
  serviceId,
  patientId,
  startAt,
  status = AppointmentStatus.PENDING,
  source = AppointmentSource.ADMIN,
  notes = null,
  actorUserId,
  db = prisma,
}: CreateAppointmentSafelyInput): Promise<CreateAppointmentSafelyResult> {
  const validation = await validateAppointmentSlotInternal({
    clinicId,
    doctorId,
    serviceId,
    patientId,
    startAt,
    actorUserId,
    db,
  });

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const appointment = await db.appointment.create({
    data: {
      clinicId,
      doctorId,
      serviceId,
      patientId,
      startAt,
      endAt: validation.endAt,
      status,
      source,
      notes,
    },
    select: {
      id: true,
      clinicId: true,
      doctorId: true,
      serviceId: true,
      patientId: true,
      startAt: true,
      endAt: true,
      status: true,
      source: true,
      notes: true,
    },
  });

  await createAuditLog(
    {
      clinicId,
      userId: actorUserId ?? null,
      action: "APPOINTMENT_CREATED",
      entityType: "APPOINTMENT",
      entityId: appointment.id,
      metadata: {
        doctorId,
        serviceId,
        patientId,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        status: appointment.status,
        source: appointment.source,
      },
    },
    db,
  );

  let selfServiceLinks: AppointmentSelfServiceLinks | null = null;

  if (
    source === AppointmentSource.ADMIN ||
    source === AppointmentSource.PUBLIC_BOOKING ||
    source === AppointmentSource.WHATSAPP
  ) {
    const tokenBundle = await createAppointmentTokens({
      clinicId,
      appointmentId: appointment.id,
      appointmentStartAt: appointment.startAt,
      db,
    });

    selfServiceLinks = {
      confirmUrl: tokenBundle.confirm.url,
      cancelUrl: tokenBundle.cancel.url,
      rescheduleUrl: tokenBundle.reschedule.url,
    };
  }

  return {
    ...appointment,
    selfServiceLinks,
  };
}
