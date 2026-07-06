import { TokenType } from "@prisma/client";
import type { Metadata } from "next";

import { AppointmentTokenSummary } from "@/components/public-appointment/appointment-token-summary";
import { PublicAppointmentShell } from "@/components/public-appointment/public-appointment-shell";
import { RescheduleAppointmentForm } from "@/components/public-appointment/reschedule-appointment-form";
import { TokenErrorState } from "@/components/public-appointment/token-error-state";
import {
  buildClinicDateMarker,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { readPublicAppointmentResultCookie } from "@/lib/appointments/public-result";
import {
  buildPublicAppointmentPath,
  canPatientRescheduleAppointment,
  resolvePublicAppointmentFlashMessage,
  resolveTokenErrorCopy,
} from "@/lib/appointments/public-self-service";
import {
  formatDateValueInTimeZone,
  validateAppointmentToken,
} from "@/lib/appointments/tokens";
import {
  getBookingTodayDateValue,
  normalizeBookingBrandColor,
} from "@/lib/booking/public";
import { brand, withBrandTitle } from "@/lib/brand";

import { rescheduleAppointmentByTokenAction } from "../../actions";

type RescheduleAppointmentPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    date?: string;
    slotTime?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: withBrandTitle("Reagendar reserva"),
  description: "Reagenda tu reserva desde un enlace público seguro.",
};

export default async function RescheduleAppointmentPage({
  params,
  searchParams,
}: RescheduleAppointmentPageProps) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const successResult = await readPublicAppointmentResultCookie({
    token,
    action: "reschedule",
  });

  if (successResult) {
    return (
      <PublicAppointmentShell
        clinicName={successResult.clinicName}
        clinicSlug={successResult.clinicSlug}
        brandColor={normalizeBookingBrandColor(successResult.brandColor)}
        title="Tu reserva fue reagendada"
        description={successResult.message}
      >
        <article className="surface-card p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Reagendado correctamente
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
        </article>
      </PublicAppointmentShell>
    );
  }

  const validation = await validateAppointmentToken({
    token,
    expectedType: TokenType.RESCHEDULE,
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

  if (!canPatientRescheduleAppointment(validation.context.appointment.status)) {
    return (
      <PublicAppointmentShell
        clinicName={validation.context.appointment.clinic.name}
        clinicSlug={validation.context.appointment.clinic.slug}
        brandColor={normalizeBookingBrandColor(
          validation.context.appointment.clinic.brandColor,
        )}
        title="Esta reserva ya no puede reagendarse"
        description="El estado actual de la reserva ya no permite una reagendación pública."
      >
        <TokenErrorState
          title="La reserva ya no admite reagendación"
          description="El negocio ya la cerro, la cancelo o la marco como no-show."
        />
      </PublicAppointmentShell>
    );
  }

  const defaultDate = formatDateValueInTimeZone(
    validation.context.appointment.startAt,
    validation.context.appointment.clinic.timezone,
  );
  const selectedDate = query.date?.trim() || defaultDate;
  const selectedDateParts = parseIsoDateInput(selectedDate);
  const availableSlotResult = selectedDateParts
    ? await getAvailableSlots({
        clinicId: validation.context.clinicId,
        doctorId: validation.context.appointment.doctor.id,
        serviceId: validation.context.appointment.service.id,
        date: buildClinicDateMarker(
          selectedDateParts,
          validation.context.appointment.clinic.timezone,
        ),
        excludeAppointmentId: validation.context.appointment.id,
      })
    : null;
  const selectedSlotTime = query.slotTime?.trim() ?? "";
  const flash = resolvePublicAppointmentFlashMessage(query.error);

  return (
    <PublicAppointmentShell
      clinicName={validation.context.appointment.clinic.name}
      clinicSlug={validation.context.appointment.clinic.slug}
      brandColor={normalizeBookingBrandColor(
        validation.context.appointment.clinic.brandColor,
      )}
      title="Reagenda tu reserva"
      description="Elige una nueva fecha y revisa horarios reales del mismo profesional y servicio."
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
      />

      {flash ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {flash.message}
        </div>
      ) : null}

      <RescheduleAppointmentForm
        token={token}
        actionPath={buildPublicAppointmentPath("reschedule", token)}
        selectedDate={selectedDate}
        minDate={getBookingTodayDateValue(
          validation.context.appointment.clinic.timezone,
        )}
        selectedSlotTime={selectedSlotTime}
        availableSlotResult={availableSlotResult}
        submitAction={rescheduleAppointmentByTokenAction}
      />
    </PublicAppointmentShell>
  );
}
