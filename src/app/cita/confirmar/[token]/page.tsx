import { TokenType } from "@prisma/client";
import type { Metadata } from "next";

import { AppointmentTokenSummary } from "@/components/public-appointment/appointment-token-summary";
import { ConfirmAppointmentForm } from "@/components/public-appointment/confirm-appointment-form";
import { PublicAppointmentShell } from "@/components/public-appointment/public-appointment-shell";
import { TokenErrorState } from "@/components/public-appointment/token-error-state";
import { CalendarLinkActions } from "@/components/ui/calendar-link-actions";
import { readPublicAppointmentResultCookie } from "@/lib/appointments/public-result";
import {
  canPatientConfirmAppointment,
  resolvePublicAppointmentFlashMessage,
  resolveTokenErrorCopy,
} from "@/lib/appointments/public-self-service";
import { validateAppointmentToken } from "@/lib/appointments/tokens";
import { normalizeBookingBrandColor } from "@/lib/booking/public";
import { brand, withBrandTitle } from "@/lib/brand";
import { buildAppointmentCalendarLinks } from "@/lib/notifications/email-calendar-links";

import { confirmAppointmentByTokenAction } from "../../actions";

type ConfirmAppointmentPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: withBrandTitle("Confirmar reserva"),
  description: "Confirma tu reserva desde un enlace público seguro.",
};

export default async function ConfirmAppointmentPage({
  params,
  searchParams,
}: ConfirmAppointmentPageProps) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const successResult = await readPublicAppointmentResultCookie({
    token,
    action: "confirm",
  });

  if (successResult) {
    return (
      <PublicAppointmentShell
        clinicName={successResult.clinicName}
        clinicSlug={successResult.clinicSlug}
        brandColor={normalizeBookingBrandColor(successResult.brandColor)}
        title="Tu reserva ya quedo confirmada"
        description={successResult.message}
      >
        <article className="surface-card p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Confirmacion exitosa
          </span>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-line/80 bg-surface-soft px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Cliente
              </p>
              <p className="mt-3 text-base font-semibold text-ink">
                {successResult.patientName}
              </p>
            </div>
            <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Estado
              </p>
              <p className="mt-3 text-base font-semibold text-ink">
                {successResult.statusLabel}
              </p>
            </div>
            <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Servicio
              </p>
              <p className="mt-3 text-base font-semibold text-ink">
                {successResult.serviceName}
              </p>
            </div>
            <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Profesional
              </p>
              <p className="mt-3 text-base font-semibold text-ink">
                {successResult.doctorName}
              </p>
            </div>
          </div>

          <CalendarLinkActions
            calendarIcsUrl={successResult.calendarIcsUrl}
            googleCalendarUrl={successResult.googleCalendarUrl}
            className="mt-6 flex flex-wrap gap-3"
          />
        </article>
      </PublicAppointmentShell>
    );
  }

  const validation = await validateAppointmentToken({
    token,
    expectedType: TokenType.CONFIRM,
  });

  if (!validation.ok) {
    const copy = resolveTokenErrorCopy(validation.reason);

    return (
      <PublicAppointmentShell
        clinicName={brand.name}
        clinicSlug="autoservicio"
        brandColor={normalizeBookingBrandColor(null)}
        title="No pudimos abrir este enlace"
        description="Valida el enlace recibido o solicita uno nuevo al negocio."
      >
        <TokenErrorState title={copy.title} description={copy.description} />
      </PublicAppointmentShell>
    );
  }

  if (!canPatientConfirmAppointment(validation.context.appointment.status)) {
    return (
      <PublicAppointmentShell
        clinicName={validation.context.appointment.clinic.name}
        clinicSlug={validation.context.appointment.clinic.slug}
        brandColor={normalizeBookingBrandColor(
          validation.context.appointment.clinic.brandColor,
        )}
        title="Esta reserva ya no puede confirmarse"
        description="El estado actual de la reserva ya no permite una confirmación pública."
      >
        <TokenErrorState
          title="La reserva ya no admite confirmación"
          description="El horario fue cancelado, completado o marcado como no-show por el negocio."
        />
      </PublicAppointmentShell>
    );
  }

  const flash = resolvePublicAppointmentFlashMessage(query.error);
  const calendarLinks = buildAppointmentCalendarLinks({
    appointmentId: validation.context.appointment.id,
    clinicName: validation.context.appointment.clinic.name,
    clinicPublicName: validation.context.appointment.clinic.publicName,
    serviceName: validation.context.appointment.service.name,
    doctorName: validation.context.appointment.doctor.name,
    statusLabel: "Pendiente de confirmación",
    startAt: validation.context.appointment.startAt,
    endAt: validation.context.appointment.endAt,
    timezone: validation.context.appointment.clinic.timezone,
    contactEmail: validation.context.appointment.clinic.contactEmail,
    contactPhone: validation.context.appointment.clinic.contactPhone,
    websiteUrl: validation.context.appointment.clinic.websiteUrl,
    selfServiceLinks: {
      confirmUrl: `/cita/confirmar/${token}`,
    },
  });

  return (
    <PublicAppointmentShell
      clinicName={validation.context.appointment.clinic.name}
      clinicSlug={validation.context.appointment.clinic.slug}
      brandColor={normalizeBookingBrandColor(
        validation.context.appointment.clinic.brandColor,
      )}
      title="Confirma tu reserva"
      description="Revisa el resumen y confirma tu asistencia en un solo paso."
    >
      <AppointmentTokenSummary
        clinicName={validation.context.appointment.clinic.name}
        patientName={validation.context.appointment.patient.name}
        phoneE164={validation.context.appointment.patient.phoneE164}
        email={validation.context.appointment.patient.email}
        doctorName={validation.context.appointment.doctor.name}
        doctorSpecialty={validation.context.appointment.doctor.specialty}
        serviceName={validation.context.appointment.service.name}
        priceCents={validation.context.appointment.service.priceCents}
        durationMinutes={validation.context.appointment.service.durationMinutes}
        startAt={validation.context.appointment.startAt}
        endAt={validation.context.appointment.endAt}
        timezone={validation.context.appointment.clinic.timezone}
        status={validation.context.appointment.status}
        source={validation.context.appointment.source}
        notes={validation.context.appointment.notes}
        currency={validation.context.appointment.clinic.currency}
        calendarIcsUrl={calendarLinks.calendarIcsUrl}
        googleCalendarUrl={calendarLinks.googleCalendarUrl}
      />

      {flash ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {flash.message}
        </div>
      ) : null}

      <ConfirmAppointmentForm
        token={token}
        action={confirmAppointmentByTokenAction}
      />
    </PublicAppointmentShell>
  );
}
