import type { AppointmentSelfServiceLinks } from "@/lib/appointments/tokens";
import { brand } from "@/lib/brand";

type PartialAppointmentSelfServiceLinks = Partial<AppointmentSelfServiceLinks>;

type AppointmentCalendarLinksInput = {
  appointmentId: string;
  clinicName: string;
  clinicPublicName?: string | null;
  serviceName: string;
  doctorName: string;
  statusLabel: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  selfServiceLinks?: PartialAppointmentSelfServiceLinks | null;
};

export type AppointmentCalendarLinks = {
  calendarIcsUrl: string | null;
  googleCalendarUrl: string | null;
};

function formatGoogleCalendarDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, brand.appUrl).toString();
}

function buildDetailsText(input: AppointmentCalendarLinksInput) {
  const lines = [
    `Servicio: ${input.serviceName}`,
    `Profesional: ${input.doctorName}`,
    `Estado: ${input.statusLabel}`,
    input.websiteUrl ? `Sitio web: ${input.websiteUrl}` : null,
    input.contactEmail ? `Email: ${input.contactEmail}` : null,
    input.contactPhone ? `Teléfono: ${input.contactPhone}` : null,
    input.selfServiceLinks?.confirmUrl
      ? `Confirmar: ${buildAbsoluteUrl(input.selfServiceLinks.confirmUrl)}`
      : null,
    input.selfServiceLinks?.cancelUrl
      ? `Cancelar: ${buildAbsoluteUrl(input.selfServiceLinks.cancelUrl)}`
      : null,
    input.selfServiceLinks?.rescheduleUrl
      ? `Reagendar: ${buildAbsoluteUrl(input.selfServiceLinks.rescheduleUrl)}`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildLocation(input: AppointmentCalendarLinksInput) {
  const parts = [
    input.clinicPublicName?.trim() || input.clinicName,
    input.websiteUrl?.trim() || null,
    input.contactPhone?.trim() || null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : null;
}

function extractCalendarAccessToken(
  links?: PartialAppointmentSelfServiceLinks | null,
) {
  const candidates = [
    links?.cancelUrl,
    links?.rescheduleUrl,
    links?.confirmUrl,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const resolvedUrl = new URL(candidate, brand.appUrl);
      const match = resolvedUrl.pathname.match(
        /\/cita\/(?:confirmar|cancelar|reagendar)\/([^/?#]+)/,
      );

      if (match?.[1]) {
        return match[1];
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function buildAppointmentCalendarLinks(
  input: AppointmentCalendarLinksInput,
): AppointmentCalendarLinks {
  const displayName = input.clinicPublicName?.trim() || input.clinicName;
  const calendarAccessToken = extractCalendarAccessToken(input.selfServiceLinks);
  const calendarIcsUrl = calendarAccessToken
    ? (() => {
        const calendarUrl = new URL(
          `/api/calendar/appointments/${input.appointmentId}/ics`,
          brand.appUrl,
        );

        calendarUrl.searchParams.set("token", calendarAccessToken);

        if (input.selfServiceLinks?.confirmUrl) {
          calendarUrl.searchParams.set(
            "confirm",
            buildAbsoluteUrl(input.selfServiceLinks.confirmUrl),
          );
        }

        if (input.selfServiceLinks?.cancelUrl) {
          calendarUrl.searchParams.set(
            "cancel",
            buildAbsoluteUrl(input.selfServiceLinks.cancelUrl),
          );
        }

        if (input.selfServiceLinks?.rescheduleUrl) {
          calendarUrl.searchParams.set(
            "reschedule",
            buildAbsoluteUrl(input.selfServiceLinks.rescheduleUrl),
          );
        }

        return calendarUrl.toString();
      })()
    : null;
  const googleCalendarUrl = new URL(
    "https://calendar.google.com/calendar/render",
  );

  googleCalendarUrl.searchParams.set("action", "TEMPLATE");
  googleCalendarUrl.searchParams.set("text", `Reserva en ${displayName}`);
  googleCalendarUrl.searchParams.set(
    "dates",
    `${formatGoogleCalendarDate(input.startAt)}/${formatGoogleCalendarDate(input.endAt)}`,
  );
  googleCalendarUrl.searchParams.set("details", buildDetailsText(input));

  const location = buildLocation(input);

  if (location) {
    googleCalendarUrl.searchParams.set("location", location);
  }

  if (input.timezone) {
    googleCalendarUrl.searchParams.set("ctz", input.timezone);
  }

  return {
    calendarIcsUrl,
    googleCalendarUrl: googleCalendarUrl.toString(),
  };
}
