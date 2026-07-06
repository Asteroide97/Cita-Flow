import {
  buildClinicDateMarker,
  formatDateTimeInTimeZone,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { getBookingDateOptions } from "@/lib/booking/public";
import { prisma } from "@/lib/prisma";

export type OperationalStatusLevel =
  | "READY"
  | "ATTENTION"
  | "NO_AVAILABILITY";

export type OperationalStatusCheck = {
  id: string;
  label: string;
  isComplete: boolean;
  note?: string;
};

export type OperationalStatusResult = {
  level: OperationalStatusLevel;
  label: string;
  headline: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  actionTarget?: "_self" | "_blank";
  checks: OperationalStatusCheck[];
};

export async function getOperationalStatus(clinicId: string): Promise<OperationalStatusResult> {
  const [clinic, services, doctors, activeAvailabilityCount] = await prisma.$transaction([
    prisma.clinic.findUnique({
      where: {
        id: clinicId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        timezone: true,
        currency: true,
      },
    }),
    prisma.service.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: [{ durationMinutes: "asc" }, { createdAt: "asc" }],
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
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.doctorAvailability.count({
      where: {
        clinicId,
        isActive: true,
      },
    }),
  ]);

  if (!clinic) {
    throw new Error("No se pudo calcular el estado operativo del negocio.");
  }

  const publicPageActive = clinic.isActive && Boolean(clinic.slug.trim());
  const hasActiveServices = services.length > 0;
  const hasActiveProfessionals = doctors.length > 0;
  const hasAvailabilityConfigured = activeAvailabilityCount > 0;

  let firstAvailableSlotLabel: string | null = null;

  if (
    publicPageActive &&
    hasActiveServices &&
    hasActiveProfessionals &&
    hasAvailabilityConfigured
  ) {
    const shortestService = services[0];
    const dateOptions = getBookingDateOptions(clinic.timezone, 7);

    for (const dateOption of dateOptions) {
      const dateParts = parseIsoDateInput(dateOption.value);

      if (!dateParts) {
        continue;
      }

      const dateMarker = buildClinicDateMarker(dateParts, clinic.timezone);
      let earliestSlotForDay: {
        startAt: Date;
        doctorName: string;
      } | null = null;

      for (const doctor of doctors) {
        const slotResult = await getAvailableSlots(
          {
            clinicId,
            doctorId: doctor.id,
            serviceId: shortestService.id,
            date: dateMarker,
          },
          true,
        );
        const firstSlot = slotResult.slots[0];

        if (!firstSlot) {
          continue;
        }

        if (
          !earliestSlotForDay ||
          firstSlot.startAt.getTime() < earliestSlotForDay.startAt.getTime()
        ) {
          earliestSlotForDay = {
            startAt: firstSlot.startAt,
            doctorName: doctor.name,
          };
        }
      }

      if (earliestSlotForDay) {
        firstAvailableSlotLabel = `Primer horario disponible: ${formatDateTimeInTimeZone(
          earliestSlotForDay.startAt,
          clinic.timezone,
        )} con ${earliestSlotForDay.doctorName}.`;
        break;
      }
    }
  }

  const hasAvailableSlotsThisWeek = Boolean(firstAvailableSlotLabel);
  const bookingPath = `/booking/${clinic.slug}`;
  const availabilityPath = doctors[0]
    ? `/app/doctors/${doctors[0].id}/availability`
    : "/app/doctors";

  const checks: OperationalStatusCheck[] = [
    {
      id: "public-page",
      label: "Página pública activa",
      isComplete: publicPageActive,
      note: publicPageActive ? `/${clinic.slug}` : "Activa el negocio o define un slug público.",
    },
    {
      id: "services",
      label: "Servicios activos",
      isComplete: hasActiveServices,
      note: hasActiveServices
        ? `${services.length} servicio${services.length === 1 ? "" : "s"} activo${services.length === 1 ? "" : "s"}`
        : "Todavía no hay servicios activos.",
    },
    {
      id: "professionals",
      label: "Profesionales activos",
      isComplete: hasActiveProfessionals,
      note: hasActiveProfessionals
        ? `${doctors.length} profesional${doctors.length === 1 ? "" : "es"} activo${doctors.length === 1 ? "" : "s"}`
        : "Todavía no hay profesionales activos.",
    },
    {
      id: "availability",
      label: "Disponibilidad configurada",
      isComplete: hasAvailabilityConfigured,
      note: hasAvailabilityConfigured
        ? `${activeAvailabilityCount} bloque${activeAvailabilityCount === 1 ? "" : "s"} activo${activeAvailabilityCount === 1 ? "" : "s"}`
        : "Configura al menos un bloque de disponibilidad.",
    },
    {
      id: "slots",
      label: "Horarios disponibles esta semana",
      isComplete: hasAvailableSlotsThisWeek,
      note: hasAvailableSlotsThisWeek
        ? firstAvailableSlotLabel ?? undefined
        : "No hay horarios disponibles esta semana.",
    },
  ];

  if (
    publicPageActive &&
    hasActiveServices &&
    hasActiveProfessionals &&
    hasAvailabilityConfigured &&
    hasAvailableSlotsThisWeek
  ) {
    return {
      level: "READY",
      label: "Listo para recibir reservas",
      headline: "Tu agenda puede recibir reservas.",
      description:
        firstAvailableSlotLabel ??
        "La página pública ya tiene servicios, profesionales y horarios disponibles.",
      actionHref: bookingPath,
      actionLabel: "Abrir página pública",
      actionTarget: "_blank",
      checks,
    };
  }

  if (
    publicPageActive &&
    hasActiveServices &&
    hasActiveProfessionals &&
    hasAvailabilityConfigured &&
    !hasAvailableSlotsThisWeek
  ) {
    return {
      level: "NO_AVAILABILITY",
      label: "Sin disponibilidad",
      headline: "No hay horarios disponibles esta semana.",
      description:
        "Revisa los bloques de disponibilidad, ausencias o bloqueos para volver a abrir espacios.",
      actionHref: availabilityPath,
      actionLabel: "Ir a disponibilidad",
      checks,
    };
  }

  if (!publicPageActive) {
    return {
      level: "ATTENTION",
      label: "Requiere atencion",
      headline: "La página pública aún no está lista.",
      description:
        "Activa el negocio y revisa el slug público para habilitar el enlace de reservas.",
      actionHref: "/app/settings",
      actionLabel: "Ir a configuracion",
      checks,
    };
  }

  if (!hasActiveServices) {
    return {
      level: "ATTENTION",
      label: "Requiere atencion",
      headline: "Faltan servicios activos para publicar.",
      description:
        "Agrega al menos un servicio activo para que tus clientes puedan reservar.",
      actionHref: "/app/services",
      actionLabel: "Crear servicio",
      checks,
    };
  }

  if (!hasActiveProfessionals) {
    return {
      level: "ATTENTION",
      label: "Requiere atencion",
      headline: "Faltan profesionales activos para atender reservas.",
      description:
        "Crea al menos un profesional activo antes de compartir la página pública.",
      actionHref: "/app/doctors",
      actionLabel: "Crear profesional",
      checks,
    };
  }

  return {
    level: "ATTENTION",
    label: "Requiere atencion",
    headline: "La disponibilidad aun no esta lista.",
    description:
      "Configura horarios activos para que Agenda Viva pueda mostrar slots reales esta semana.",
    actionHref: availabilityPath,
    actionLabel: "Ir a disponibilidad",
    checks,
  };
}
