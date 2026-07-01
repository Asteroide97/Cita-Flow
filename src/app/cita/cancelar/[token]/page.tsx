import { TokenType } from "@prisma/client";
import type { Metadata } from "next";

import { AppointmentTokenSummary } from "@/components/public-appointment/appointment-token-summary";
import { CancelAppointmentForm } from "@/components/public-appointment/cancel-appointment-form";
import { PublicAppointmentShell } from "@/components/public-appointment/public-appointment-shell";
import { TokenErrorState } from "@/components/public-appointment/token-error-state";
import { readPublicAppointmentResultCookie } from "@/lib/appointments/public-result";
import {
  canPatientCancelAppointment,
  resolvePublicAppointmentFlashMessage,
  resolveTokenErrorCopy,
} from "@/lib/appointments/public-self-service";
import { validateAppointmentToken } from "@/lib/appointments/tokens";
import { normalizeBookingBrandColor } from "@/lib/booking/public";

import { cancelAppointmentByTokenAction } from "../../actions";

type CancelAppointmentPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Cancelar reserva | CitaFlow",
  description: "Cancela tu reserva desde un enlace público seguro.",
};

export default async function CancelAppointmentPage({
  params,
  searchParams,
}: CancelAppointmentPageProps) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const successResult = await readPublicAppointmentResultCookie({
    token,
    action: "cancel",
  });

  if (successResult) {
    return (
      <PublicAppointmentShell
        clinicName={successResult.clinicName}
        clinicSlug={successResult.clinicSlug}
        brandColor={normalizeBookingBrandColor(successResult.brandColor)}
        title="Tu reserva fue cancelada"
        description={successResult.message}
      >
        <article className="surface-card p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
            Cancelacion exitosa
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
    expectedType: TokenType.CANCEL,
  });

  if (!validation.ok) {
    const copy = resolveTokenErrorCopy(validation.reason);

    return (
      <PublicAppointmentShell
        clinicName="CitaFlow"
        clinicSlug="autoservicio"
        brandColor={normalizeBookingBrandColor(null)}
        title="No pudimos abrir este enlace"
        description="Valida el enlace recibido o solicita uno nuevo al negocio."
      >
        <TokenErrorState title={copy.title} description={copy.description} />
      </PublicAppointmentShell>
    );
  }

  if (!canPatientCancelAppointment(validation.context.appointment.status)) {
    return (
      <PublicAppointmentShell
        clinicName={validation.context.appointment.clinic.name}
        clinicSlug={validation.context.appointment.clinic.slug}
        brandColor={normalizeBookingBrandColor(
          validation.context.appointment.clinic.brandColor,
        )}
        title="Esta reserva ya no puede cancelarse"
        description="El estado actual de la reserva ya no permite una cancelación pública."
      >
        <TokenErrorState
          title="La reserva ya no admite cancelación"
          description="El negocio ya la marcó como cancelada, completada o no-show."
        />
      </PublicAppointmentShell>
    );
  }

  const flash = resolvePublicAppointmentFlashMessage(query.error);

  return (
    <PublicAppointmentShell
      clinicName={validation.context.appointment.clinic.name}
      clinicSlug={validation.context.appointment.clinic.slug}
      brandColor={normalizeBookingBrandColor(
        validation.context.appointment.clinic.brandColor,
      )}
      title="Cancela tu reserva"
      description="Si ya no podrás asistir, libera el horario para que el negocio pueda reorganizar su agenda."
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

      <CancelAppointmentForm token={token} action={cancelAppointmentByTokenAction} />
    </PublicAppointmentShell>
  );
}
