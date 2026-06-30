import {
  AppointmentSource,
  AppointmentStatus,
  Prisma,
  WhatsAppBookingDraftStatus,
  WhatsAppConversationStatus,
  WhatsAppIntent,
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
  WhatsAppMessageType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type WhatsAppSimulatorSender = "patient" | "clinic";

type ProcessWhatsAppSimulatorMessageInput = {
  clinicId: string;
  userId?: string | null;
  senderRole: WhatsAppSimulatorSender;
  phoneE164: string;
  message: string;
};

type EngineResult = {
  reply: string;
  parsedIntent: WhatsAppIntent | null;
  success: boolean;
  conversationStatus: WhatsAppConversationStatus;
  draftStatus: WhatsAppBookingDraftStatus | null;
  payload?: Prisma.InputJsonValue;
  patientId?: string | null;
  errorMessage?: string | null;
};

const ACTIVE_DRAFT_STATUSES = [
  WhatsAppBookingDraftStatus.COLLECTING_SERVICE,
  WhatsAppBookingDraftStatus.COLLECTING_DOCTOR,
  WhatsAppBookingDraftStatus.COLLECTING_TIME,
  WhatsAppBookingDraftStatus.COLLECTING_PATIENT,
  WhatsAppBookingDraftStatus.READY_TO_CONFIRM,
];

const DEFAULT_WHATSAPP_APPOINTMENT_STATUS = AppointmentStatus.PENDING;

const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildListPrompt(title: string, items: string[]) {
  return `${title}\n${items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
}

function buildWhatsAppTimeSlots(seed: string) {
  const slotGroups = [
    ["09:00", "10:30", "12:00"],
    ["11:00", "13:30", "16:00"],
    ["08:30", "12:30", "17:30"],
    ["09:30", "14:00", "18:00"],
  ];
  const slotIndex =
    seed.split("").reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0) %
    slotGroups.length;

  return slotGroups[slotIndex];
}

function formatDate(date: Date, timezone = "America/Mexico_City") {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(date);
}

function formatDateTime(date: Date, timezone = "America/Mexico_City") {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

function normalizeWhatsAppNumberForDisplay(phoneE164: string) {
  return phoneE164.startsWith("+52") && phoneE164.length >= 13
    ? `${phoneE164.slice(0, 3)} ${phoneE164.slice(3, 6)} ${phoneE164.slice(6, 9)} ${phoneE164.slice(9)}`
    : phoneE164;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);

  return nextDate;
}

function parsePreferredDate(rawValue: string) {
  const normalized = normalizeText(rawValue);
  const today = startOfDay(new Date());

  if (normalized === "hoy") {
    return today;
  }

  if (normalized === "manana") {
    return addDays(today, 1);
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const latinMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);

  if (latinMatch) {
    const [, day, month, year] = latinMatch;
    const parsedYear = year ? Number(year) : today.getFullYear();

    return new Date(parsedYear, Number(month) - 1, Number(day));
  }

  const weekday = Object.entries(WEEKDAY_INDEX).find(([label]) => normalized === label)?.[1];

  if (typeof weekday === "number") {
    const currentDay = today.getDay();
    const diff = (weekday - currentDay + 7) % 7;

    return addDays(today, diff === 0 ? 7 : diff);
  }

  return null;
}

function parseTimeSelection(rawValue: string, availableSlots: string[]) {
  const normalized = normalizeText(rawValue);
  const numericOption = Number.parseInt(normalized, 10);

  if (!Number.isNaN(numericOption) && numericOption >= 1 && numericOption <= availableSlots.length) {
    return availableSlots[numericOption - 1];
  }

  return availableSlots.find((slot) => normalizeText(slot) === normalized) ?? null;
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}

function findOptionByLabel<T extends { id: string; name: string }>(message: string, options: T[]) {
  const normalized = normalizeText(message);
  const index = Number.parseInt(normalized, 10);

  if (!Number.isNaN(index) && index >= 1 && index <= options.length) {
    return options[index - 1] ?? null;
  }

  return (
    options.find((option) => normalizeText(option.name).includes(normalized)) ??
    options.find((option) => normalized.includes(normalizeText(option.name))) ??
    null
  );
}

function detectPatientIntent(message: string) {
  const normalized = normalizeText(message);

  if (
    normalized.includes("humano") ||
    normalized.includes("persona") ||
    normalized.includes("asesor") ||
    normalized.includes("recepcion")
  ) {
    return WhatsAppIntent.HABLAR_CON_PERSONA;
  }

  if (normalized.includes("reagendar") || normalized.includes("cambiar cita")) {
    return WhatsAppIntent.REAGENDAR_CITA;
  }

  if (normalized.includes("cancelar")) {
    return WhatsAppIntent.CANCELAR_CITA;
  }

  if (normalized.includes("confirmar")) {
    return WhatsAppIntent.CONFIRMAR_CITA;
  }

  if (normalized.includes("ver cita") || normalized.includes("mi cita") || normalized.includes("proxima cita")) {
    return WhatsAppIntent.VER_CITA;
  }

  if (
    normalized.includes("agendar") ||
    normalized.includes("reservar") ||
    normalized.includes("quiero una cita") ||
    normalized.includes("quiero cita")
  ) {
    return WhatsAppIntent.AGENDAR_CITA;
  }

  return null;
}

function detectClinicIntent(message: string) {
  const normalized = normalizeText(message);

  if (normalized.includes("agenda hoy")) {
    return WhatsAppIntent.VER_AGENDA_HOY;
  }

  if (normalized.includes("agenda manana")) {
    return WhatsAppIntent.VER_AGENDA_MANANA;
  }

  if (normalized.includes("crear cita")) {
    return WhatsAppIntent.CREAR_CITA;
  }

  if (normalized.includes("cancelar cita")) {
    return WhatsAppIntent.CANCELAR_CITA;
  }

  if (normalized.includes("bloquear horario")) {
    return WhatsAppIntent.BLOQUEAR_HORARIO;
  }

  if (normalized.includes("resumen dia")) {
    return WhatsAppIntent.RESUMEN_DIA;
  }

  return null;
}

export function normalizeWhatsAppPhone(rawValue: string) {
  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  const digits = trimmedValue.replace(/[^\d+]/g, "");

  if (/^\+[1-9]\d{7,14}$/.test(digits)) {
    return digits;
  }

  const numericDigits = trimmedValue.replace(/\D/g, "");

  if (numericDigits.length === 10) {
    return `+52${numericDigits}`;
  }

  if (numericDigits.length >= 11 && numericDigits.length <= 15) {
    return `+${numericDigits}`;
  }

  return null;
}

async function getAgendaSummary(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  date: Date,
  timezone: string,
) {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const appointments = await transaction.appointment.findMany({
    where: {
      clinicId,
      startAt: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    orderBy: {
      startAt: "asc",
    },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      patient: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!appointments.length) {
    return `No hay citas registradas para ${formatDate(dayStart, timezone)}.`;
  }

  const lines = appointments.slice(0, 5).map((appointment) => {
    return `• ${formatDateTime(appointment.startAt, timezone)} · ${appointment.patient.name} · ${appointment.service.name} con ${appointment.doctor.name} (${appointment.status})`;
  });

  return `Agenda para ${formatDate(dayStart, timezone)}:\n${lines.join("\n")}`;
}

async function getDailyResume(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  date: Date,
  timezone: string,
) {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const appointments = await transaction.appointment.findMany({
    where: {
      clinicId,
      startAt: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    select: {
      status: true,
    },
  });

  const summary = {
    total: appointments.length,
    confirmed: appointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED).length,
    pending: appointments.filter((appointment) => appointment.status === AppointmentStatus.PENDING).length,
    cancelled: appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELLED).length,
  };

  return `Resumen del dia ${formatDate(dayStart, timezone)}:\n• Total: ${summary.total}\n• Confirmadas: ${summary.confirmed}\n• Pendientes: ${summary.pending}\n• Canceladas: ${summary.cancelled}`;
}

async function handleClinicMessage(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  parsedIntent: WhatsAppIntent | null,
  timezone: string,
): Promise<EngineResult> {
  const today = startOfDay(new Date());

  switch (parsedIntent) {
    case WhatsAppIntent.VER_AGENDA_HOY:
      return {
        reply: await getAgendaSummary(transaction, clinicId, today, timezone),
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    case WhatsAppIntent.VER_AGENDA_MANANA:
      return {
        reply: await getAgendaSummary(transaction, clinicId, addDays(today, 1), timezone),
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    case WhatsAppIntent.RESUMEN_DIA:
      return {
        reply: await getDailyResume(transaction, clinicId, today, timezone),
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    case WhatsAppIntent.CREAR_CITA:
      return {
        reply:
          "Comando reconocido. En la siguiente fase podras crear citas operativas desde el lado del consultorio. Por ahora usa el flujo del paciente en este simulador.",
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    case WhatsAppIntent.CANCELAR_CITA:
      return {
        reply:
          "Comando reconocido. La cancelacion operativa por WhatsApp interno quedo pendiente para una siguiente fase del motor.",
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    case WhatsAppIntent.BLOQUEAR_HORARIO:
      return {
        reply:
          "Comando reconocido. El bloqueo de horarios se conectara despues contra la agenda real del clinic.",
        parsedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    default:
      return {
        reply:
          "No identifique el comando del consultorio. Prueba con: agenda hoy, agenda manana o resumen dia.",
        parsedIntent: null,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
        errorMessage: "INTENT_NOT_SUPPORTED",
      };
  }
}

async function startPatientBookingDraft(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  conversationId: string,
  phoneE164: string,
) {
  const services = await transaction.service.findMany({
    where: {
      clinicId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
    },
  });

  const draft = await transaction.whatsAppBookingDraft.create({
    data: {
      clinicId,
      conversationId,
      phoneE164,
      status: WhatsAppBookingDraftStatus.COLLECTING_SERVICE,
    },
  });

  return {
    draft,
    reply: `${buildListPrompt(
      "Claro. Te ayudo a agendar tu cita. Primero elige un servicio:",
      services.map((service) => `${service.name} · ${service.durationMinutes} min`),
    )}\nEscribe el numero o el nombre del servicio.`,
  };
}

async function handlePatientAppointmentLookup(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  phoneE164: string,
  intent: WhatsAppIntent,
  timezone: string,
): Promise<EngineResult> {
  const patient = await transaction.patient.findUnique({
    where: {
      clinicId_phoneE164: {
        clinicId,
        phoneE164,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!patient) {
    return {
      reply:
        "Todavia no encuentro citas asociadas a este numero. Si quieres, escribe 'quiero agendar una cita' y empezamos.",
      parsedIntent: intent,
      success: false,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: null,
      errorMessage: "PATIENT_NOT_FOUND",
    };
  }

  const appointment = await transaction.appointment.findFirst({
    where: {
      clinicId,
      patientId: patient.id,
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED],
      },
      startAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!appointment) {
    return {
      reply:
        "No encontre una cita activa para este numero. Si quieres agendar una nueva, escribe 'quiero agendar una cita'.",
      parsedIntent: intent,
      success: false,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: null,
      errorMessage: "APPOINTMENT_NOT_FOUND",
    };
  }

  if (intent === WhatsAppIntent.VER_CITA) {
    return {
      reply: `Tu proxima cita es ${formatDateTime(appointment.startAt, timezone)} con ${appointment.doctor.name} para ${appointment.service.name}. Estado actual: ${appointment.status}.`,
      parsedIntent: intent,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: null,
      patientId: patient.id,
    };
  }

  if (intent === WhatsAppIntent.CONFIRMAR_CITA) {
    const confirmedAppointment =
      appointment.status === AppointmentStatus.CONFIRMED
        ? appointment
        : await transaction.appointment.update({
            where: {
              id: appointment.id,
            },
            data: {
              status: AppointmentStatus.CONFIRMED,
            },
            include: {
              doctor: {
                select: {
                  name: true,
                },
              },
              service: {
                select: {
                  name: true,
                },
              },
            },
          });

    return {
      reply: `Listo. Tu cita quedo confirmada para ${formatDateTime(confirmedAppointment.startAt, timezone)} con ${confirmedAppointment.doctor.name}.`,
      parsedIntent: intent,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: null,
      patientId: patient.id,
    };
  }

  const cancelledAppointment = await transaction.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status: AppointmentStatus.CANCELLED,
    },
    include: {
      doctor: {
        select: {
          name: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    reply: `Tu cita de ${formatDateTime(cancelledAppointment.startAt, timezone)} para ${cancelledAppointment.service.name} fue cancelada. Si deseas una nueva, escribe 'quiero agendar una cita'.`,
    parsedIntent: intent,
    success: true,
    conversationStatus: WhatsAppConversationStatus.ACTIVE,
    draftStatus: null,
    patientId: patient.id,
  };
}

async function continuePatientBookingDraft(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  draft: {
    id: string;
    phoneE164: string;
    patientName: string | null;
    serviceId: string | null;
    doctorId: string | null;
    preferredDate: Date | null;
    preferredTime: string | null;
    status: WhatsAppBookingDraftStatus;
  },
  message: string,
  timezone: string,
): Promise<EngineResult> {
  if (draft.status === WhatsAppBookingDraftStatus.COLLECTING_SERVICE) {
    const services = await transaction.service.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    const selectedService = findOptionByLabel(message, services);

    if (!selectedService) {
      return {
        reply: `${buildListPrompt(
          "No pude identificar el servicio. Elige una de estas opciones:",
          services.map((service) => service.name),
        )}\nEscribe el numero o el nombre del servicio.`,
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draft.status,
        errorMessage: "SERVICE_NOT_FOUND",
      };
    }

    const doctors = await transaction.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        specialty: true,
      },
    });

    await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        serviceId: selectedService.id,
        status: WhatsAppBookingDraftStatus.COLLECTING_DOCTOR,
      },
    });

    return {
      reply: `${buildListPrompt(
        `Perfecto. Para ${selectedService.name}, elige un doctor:`,
        doctors.map((doctor) =>
          doctor.specialty ? `${doctor.name} · ${doctor.specialty}` : doctor.name,
        ),
      )}\nEscribe el numero o el nombre del doctor.`,
      parsedIntent: WhatsAppIntent.AGENDAR_CITA,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.COLLECTING_DOCTOR,
    };
  }

  if (draft.status === WhatsAppBookingDraftStatus.COLLECTING_DOCTOR) {
    const doctors = await transaction.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    const selectedDoctor = findOptionByLabel(message, doctors);

    if (!selectedDoctor) {
      return {
        reply: `${buildListPrompt(
          "No pude identificar el doctor. Elige una de estas opciones:",
          doctors.map((doctor) => doctor.name),
        )}\nEscribe el numero o el nombre del doctor.`,
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draft.status,
        errorMessage: "DOCTOR_NOT_FOUND",
      };
    }

    await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        doctorId: selectedDoctor.id,
        preferredDate: null,
        preferredTime: null,
        status: WhatsAppBookingDraftStatus.COLLECTING_TIME,
      },
    });

    return {
      reply:
        "Perfecto. Ahora dime que dia prefieres. Puedes escribir hoy, manana, viernes o una fecha como 2026-07-18.",
      parsedIntent: WhatsAppIntent.AGENDAR_CITA,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.COLLECTING_TIME,
    };
  }

  if (draft.status === WhatsAppBookingDraftStatus.COLLECTING_TIME && !draft.preferredDate) {
    const preferredDate = parsePreferredDate(message);

    if (!preferredDate) {
      return {
        reply:
          "No pude interpretar el dia. Escribe hoy, manana, un dia de la semana o una fecha como 2026-07-18.",
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draft.status,
        errorMessage: "DATE_NOT_FOUND",
      };
    }

    const slotSeed = `${draft.doctorId ?? "doctor"}-${preferredDate.toISOString()}`;
    const availableSlots = buildWhatsAppTimeSlots(slotSeed);

    await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        preferredDate,
        status: WhatsAppBookingDraftStatus.COLLECTING_TIME,
      },
    });

    return {
      reply: `${buildListPrompt(
        `Estos son los horarios mock disponibles para ${formatDate(preferredDate, timezone)}:`,
        availableSlots,
      )}\nEscribe el numero o la hora exacta.`,
      parsedIntent: WhatsAppIntent.AGENDAR_CITA,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.COLLECTING_TIME,
      payload: {
        availableSlots,
      },
    };
  }

  if (draft.status === WhatsAppBookingDraftStatus.COLLECTING_TIME && draft.preferredDate && !draft.preferredTime) {
    const slotSeed = `${draft.doctorId ?? "doctor"}-${draft.preferredDate.toISOString()}`;
    const availableSlots = buildWhatsAppTimeSlots(slotSeed);
    const selectedTime = parseTimeSelection(message, availableSlots);

    if (!selectedTime) {
      return {
        reply: `${buildListPrompt(
          "No pude identificar el horario. Elige una de estas opciones:",
          availableSlots,
        )}\nEscribe el numero o la hora exacta.`,
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draft.status,
        errorMessage: "TIME_NOT_FOUND",
      };
    }

    await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        preferredTime: selectedTime,
        status: WhatsAppBookingDraftStatus.COLLECTING_PATIENT,
      },
    });

    return {
      reply: "Listo. Ahora comparteme el nombre del paciente para terminar la cita.",
      parsedIntent: WhatsAppIntent.AGENDAR_CITA,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.COLLECTING_PATIENT,
    };
  }

  if (draft.status === WhatsAppBookingDraftStatus.COLLECTING_PATIENT) {
    const patientName = message.trim();

    if (patientName.length < 3) {
      return {
        reply: "Necesito un nombre valido para completar la cita. Escribe el nombre y apellido del paciente.",
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draft.status,
        errorMessage: "PATIENT_NAME_INVALID",
      };
    }

    const resolvedDraft = await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        patientName,
        status: WhatsAppBookingDraftStatus.READY_TO_CONFIRM,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (
      !resolvedDraft.service ||
      !resolvedDraft.doctor ||
      !resolvedDraft.preferredDate ||
      !resolvedDraft.preferredTime
    ) {
      return {
        reply: "El borrador no quedo completo. Reinicia con 'quiero agendar una cita'.",
        parsedIntent: WhatsAppIntent.AGENDAR_CITA,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: resolvedDraft.status,
        errorMessage: "DRAFT_INCOMPLETE",
      };
    }

    const patient = await transaction.patient.upsert({
      where: {
        clinicId_phoneE164: {
          clinicId,
          phoneE164: draft.phoneE164,
        },
      },
      update: {
        name: patientName,
      },
      create: {
        clinicId,
        name: patientName,
        phoneE164: draft.phoneE164,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const appointmentStart = combineDateAndTime(
      resolvedDraft.preferredDate,
      resolvedDraft.preferredTime,
    );
    const appointmentEnd = new Date(
      appointmentStart.getTime() + resolvedDraft.service.durationMinutes * 60 * 1000,
    );

    const appointment = await transaction.appointment.create({
      data: {
        clinicId,
        doctorId: resolvedDraft.doctor.id,
        serviceId: resolvedDraft.service.id,
        patientId: patient.id,
        startAt: appointmentStart,
        endAt: appointmentEnd,
        status: DEFAULT_WHATSAPP_APPOINTMENT_STATUS,
        source: AppointmentSource.WHATSAPP,
        notes: "Creada desde el simulador local de WhatsApp.",
      },
      include: {
        doctor: {
          select: {
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    await transaction.whatsAppBookingDraft.update({
      where: {
        id: draft.id,
      },
      data: {
        appointmentId: appointment.id,
        status: WhatsAppBookingDraftStatus.CONFIRMED,
      },
    });

    return {
      reply: `Tu cita quedo registrada para ${formatDateTime(appointment.startAt, timezone)} con ${appointment.doctor.name} para ${appointment.service.name}. Estado inicial: ${appointment.status}. Te escribiremos si hace falta algun ajuste.`,
      parsedIntent: WhatsAppIntent.AGENDAR_CITA,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.CONFIRMED,
      patientId: patient.id,
      payload: {
        appointmentId: appointment.id,
        appointmentStatus: appointment.status,
      },
    };
  }

  return {
    reply: "El flujo quedo en un estado no soportado. Reinicia con 'quiero agendar una cita'.",
    parsedIntent: WhatsAppIntent.AGENDAR_CITA,
    success: false,
    conversationStatus: WhatsAppConversationStatus.ACTIVE,
    draftStatus: draft.status,
    errorMessage: "DRAFT_STATE_NOT_SUPPORTED",
  };
}

async function handlePatientMessage(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  conversationId: string,
  phoneE164: string,
  message: string,
  timezone: string,
) {
  const activeDraft = await transaction.whatsAppBookingDraft.findFirst({
    where: {
      clinicId,
      conversationId,
      status: {
        in: ACTIVE_DRAFT_STATUSES,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      phoneE164: true,
      patientName: true,
      serviceId: true,
      doctorId: true,
      preferredDate: true,
      preferredTime: true,
      status: true,
    },
  });

  const detectedIntent = detectPatientIntent(message);

  if (detectedIntent === WhatsAppIntent.HABLAR_CON_PERSONA) {
    if (activeDraft) {
      await transaction.whatsAppBookingDraft.update({
        where: {
          id: activeDraft.id,
        },
        data: {
          status: WhatsAppBookingDraftStatus.CANCELLED,
        },
      });
    }

    return {
      reply:
        "Listo. Marque esta conversacion para seguimiento humano. En una integracion real aqui pasariamos el caso a recepcion o soporte.",
      parsedIntent: detectedIntent,
      success: true,
      conversationStatus: WhatsAppConversationStatus.NEEDS_HUMAN,
      draftStatus: activeDraft ? WhatsAppBookingDraftStatus.CANCELLED : null,
    } satisfies EngineResult;
  }

  if (detectedIntent === WhatsAppIntent.CANCELAR_CITA && activeDraft) {
    await transaction.whatsAppBookingDraft.update({
      where: {
        id: activeDraft.id,
      },
      data: {
        status: WhatsAppBookingDraftStatus.CANCELLED,
      },
    });

    return {
      reply: "Cancele el borrador actual. Si quieres iniciar de nuevo, escribe 'quiero agendar una cita'.",
      parsedIntent: detectedIntent,
      success: true,
      conversationStatus: WhatsAppConversationStatus.ACTIVE,
      draftStatus: WhatsAppBookingDraftStatus.CANCELLED,
    } satisfies EngineResult;
  }

  if (activeDraft) {
    return continuePatientBookingDraft(
      transaction,
      clinicId,
      activeDraft,
      message,
      timezone,
    );
  }

  switch (detectedIntent) {
    case WhatsAppIntent.AGENDAR_CITA: {
      const draftStart = await startPatientBookingDraft(
        transaction,
        clinicId,
        conversationId,
        phoneE164,
      );

      return {
        reply: draftStart.reply,
        parsedIntent: detectedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: draftStart.draft.status,
      } satisfies EngineResult;
    }
    case WhatsAppIntent.VER_CITA:
    case WhatsAppIntent.CONFIRMAR_CITA:
    case WhatsAppIntent.CANCELAR_CITA:
      return handlePatientAppointmentLookup(
        transaction,
        clinicId,
        phoneE164,
        detectedIntent,
        timezone,
      );
    case WhatsAppIntent.REAGENDAR_CITA:
      return {
        reply:
          "La reagendacion automatica quedo preparada como siguiente fase. Por ahora puedo ayudarte a iniciar una nueva reserva con 'quiero agendar una cita'.",
        parsedIntent: detectedIntent,
        success: true,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
      };
    default:
      return {
        reply:
          "Puedo ayudarte a agendar, confirmar, cancelar o consultar una cita. Escribe por ejemplo: 'quiero agendar una cita'.",
        parsedIntent: null,
        success: false,
        conversationStatus: WhatsAppConversationStatus.ACTIVE,
        draftStatus: null,
        errorMessage: "INTENT_NOT_SUPPORTED",
      };
  }
}

export async function processWhatsAppSimulatorMessage({
  clinicId,
  userId,
  senderRole,
  phoneE164,
  message,
}: ProcessWhatsAppSimulatorMessageInput) {
  const sanitizedMessage = message.trim();

  return prisma.$transaction(async (transaction) => {
    const clinic = await transaction.clinic.findUnique({
      where: {
        id: clinicId,
      },
      select: {
        timezone: true,
      },
    });

    if (!clinic) {
      throw new Error("Clinic no encontrado para el simulador.");
    }

    const linkedPatient =
      senderRole === "patient"
        ? await transaction.patient.findUnique({
            where: {
              clinicId_phoneE164: {
                clinicId,
                phoneE164,
              },
            },
            select: {
              id: true,
            },
          })
        : null;

    const conversation = await transaction.whatsAppConversation.upsert({
      where: {
        clinicId_phoneE164: {
          clinicId,
          phoneE164,
        },
      },
      update: {
        lastMessageAt: new Date(),
        ...(linkedPatient ? { patientId: linkedPatient.id } : {}),
      },
      create: {
        clinicId,
        patientId: linkedPatient?.id,
        phoneE164,
        status: WhatsAppConversationStatus.ACTIVE,
        lastMessageAt: new Date(),
      },
      select: {
        id: true,
        patientId: true,
      },
    });

    await transaction.whatsAppMessage.create({
      data: {
        clinicId,
        conversationId: conversation.id,
        direction: WhatsAppMessageDirection.INBOUND,
        messageType: WhatsAppMessageType.TEXT,
        body: sanitizedMessage,
        payloadJson: {
          senderRole,
          displayPhone: normalizeWhatsAppNumberForDisplay(phoneE164),
        },
        status: WhatsAppMessageStatus.RECEIVED,
      },
    });

    const result =
      senderRole === "patient"
        ? await handlePatientMessage(
            transaction,
            clinicId,
            conversation.id,
            phoneE164,
            sanitizedMessage,
            clinic.timezone,
          )
        : await handleClinicMessage(
            transaction,
            clinicId,
            detectClinicIntent(sanitizedMessage),
            clinic.timezone,
          );

    await transaction.whatsAppMessage.create({
      data: {
        clinicId,
        conversationId: conversation.id,
        direction: WhatsAppMessageDirection.OUTBOUND,
        messageType: WhatsAppMessageType.TEXT,
        body: result.reply,
        payloadJson: result.payload,
        status: WhatsAppMessageStatus.SENT,
      },
    });

    await transaction.whatsAppConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        patientId: result.patientId ?? conversation.patientId,
        status: result.conversationStatus,
        currentIntent: result.parsedIntent,
        lastMessageAt: new Date(),
      },
    });

    await transaction.whatsAppCommandLog.create({
      data: {
        clinicId,
        userId: userId ?? null,
        conversationId: conversation.id,
        command: sanitizedMessage,
        parsedIntent: result.parsedIntent,
        success: result.success,
        errorMessage: result.errorMessage ?? null,
        metadataJson: {
          senderRole,
          phoneE164,
          draftStatus: result.draftStatus,
        },
      },
    });

    return {
      conversationId: conversation.id,
      intent: result.parsedIntent,
      draftStatus: result.draftStatus,
    };
  });
}

export async function getWhatsAppSimulatorSnapshot(clinicId: string, phoneE164: string) {
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: {
      clinicId_phoneE164: {
        clinicId,
        phoneE164,
      },
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      bookingDrafts: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        include: {
          service: {
            select: {
              name: true,
              durationMinutes: true,
            },
          },
          doctor: {
            select: {
              name: true,
              specialty: true,
            },
          },
          appointment: {
            select: {
              id: true,
              status: true,
              startAt: true,
              endAt: true,
            },
          },
        },
      },
      commandLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return conversation;
}

export async function getWhatsAppSimulatorCatalog(clinicId: string) {
  const [services, doctors] = await Promise.all([
    prisma.service.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
      },
    }),
    prisma.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
        specialty: true,
      },
    }),
  ]);

  return {
    services,
    doctors,
  };
}
