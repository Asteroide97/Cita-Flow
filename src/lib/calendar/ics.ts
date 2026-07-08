import { brand } from "@/lib/brand";

type AppointmentCalendarSelfServiceLinks = {
  confirmUrl?: string | null;
  cancelUrl?: string | null;
  rescheduleUrl?: string | null;
};

export type BuildAppointmentIcsInput = {
  appointmentId: string;
  clinicName: string;
  serviceName: string;
  doctorName: string;
  statusLabel: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  websiteUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  selfServiceLinks?: AppointmentCalendarSelfServiceLinks | null;
};

function toTimeZoneParts(date: Date, timezone?: string) {
  if (!timezone) {
    return {
      year: String(date.getUTCFullYear()),
      month: String(date.getUTCMonth() + 1).padStart(2, "0"),
      day: String(date.getUTCDate()).padStart(2, "0"),
      hour: String(date.getUTCHours()).padStart(2, "0"),
      minute: String(date.getUTCMinutes()).padStart(2, "0"),
      second: String(date.getUTCSeconds()).padStart(2, "0"),
    };
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: getValue("year"),
    month: getValue("month"),
    day: getValue("day"),
    hour: getValue("hour"),
    minute: getValue("minute"),
    second: getValue("second"),
  };
}

function foldIcsLine(line: string) {
  const maxLength = 74;

  if (line.length <= maxLength) {
    return line;
  }

  const chunks: string[] = [];

  for (let cursor = 0; cursor < line.length; cursor += maxLength) {
    chunks.push(line.slice(cursor, cursor + maxLength));
  }

  return chunks.join("\r\n ");
}

function buildIcsStatus(statusLabel: string) {
  const normalized = statusLabel.trim().toLowerCase();

  if (normalized.includes("cancel")) {
    return "CANCELLED";
  }

  if (normalized.includes("confirm") || normalized.includes("complet")) {
    return "CONFIRMED";
  }

  return "TENTATIVE";
}

function buildLocationLine(params: {
  clinicName: string;
  websiteUrl?: string | null;
  contactPhone?: string | null;
}) {
  const parts = [
    params.clinicName,
    params.websiteUrl?.trim() || null,
    params.contactPhone?.trim() || null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : null;
}

export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function formatIcsDate(date: Date, timezone?: string) {
  const parts = toTimeZoneParts(date, timezone);

  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

export function buildAppointmentIcs({
  appointmentId,
  clinicName,
  serviceName,
  doctorName,
  statusLabel,
  startAt,
  endAt,
  timezone,
  websiteUrl,
  contactEmail,
  contactPhone,
  selfServiceLinks,
}: BuildAppointmentIcsInput) {
  const summary = `Reserva en ${clinicName}`;
  const descriptionLines = [
    `Servicio: ${serviceName}`,
    `Profesional: ${doctorName}`,
    `Estado: ${statusLabel}`,
    contactEmail ? `Email: ${contactEmail}` : null,
    contactPhone ? `Teléfono: ${contactPhone}` : null,
    websiteUrl ? `Sitio web: ${websiteUrl}` : null,
    selfServiceLinks?.confirmUrl ? `Confirmar: ${selfServiceLinks.confirmUrl}` : null,
    selfServiceLinks?.cancelUrl ? `Cancelar: ${selfServiceLinks.cancelUrl}` : null,
    selfServiceLinks?.rescheduleUrl
      ? `Reagendar: ${selfServiceLinks.rescheduleUrl}`
      : null,
  ].filter(Boolean);
  const location = buildLocationLine({
    clinicName,
    websiteUrl,
    contactPhone,
  });
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `PRODID:-//${brand.legalName}//Reservas//ES`,
    `X-WR-CALNAME:${escapeIcsText(brand.name)}`,
    `X-WR-TIMEZONE:${escapeIcsText(timezone)}`,
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(`${appointmentId}@${brand.slug}.app`)}`,
    `DTSTAMP:${formatIcsDate(new Date())}Z`,
    `DTSTART;TZID=${escapeIcsText(timezone)}:${formatIcsDate(startAt, timezone)}`,
    `DTEND;TZID=${escapeIcsText(timezone)}:${formatIcsDate(endAt, timezone)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionLines.join("\n"))}`,
    `STATUS:${buildIcsStatus(statusLabel)}`,
    websiteUrl ? `URL:${escapeIcsText(websiteUrl)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    contactEmail
      ? `ORGANIZER;CN=${escapeIcsText(clinicName)}:mailto:${escapeIcsText(contactEmail)}`
      : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .map((line) => foldIcsLine(String(line)));

  return `${lines.join("\r\n")}\r\n`;
}
