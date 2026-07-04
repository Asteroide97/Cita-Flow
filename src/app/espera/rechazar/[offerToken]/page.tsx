import type { Metadata } from "next";

import { PublicAppointmentShell } from "@/components/public-appointment/public-appointment-shell";
import { RejectWaitlistOfferForm } from "@/components/public-appointment/reject-waitlist-offer-form";
import { TokenErrorState } from "@/components/public-appointment/token-error-state";
import { WaitlistOfferSummary } from "@/components/public-appointment/waitlist-offer-summary";
import { normalizeBookingBrandColor } from "@/lib/booking/public";
import { brand, withBrandTitle } from "@/lib/brand";
import { resolveWaitlistTokenErrorCopy } from "@/lib/waitlist/public";
import { readPublicWaitlistOfferResultCookie } from "@/lib/waitlist/public-result";
import { validateWaitlistOfferToken } from "@/lib/waitlist/tokens";

import { rejectWaitlistOfferAction } from "../../actions";

type RejectWaitlistOfferPageProps = {
  params: Promise<{
    offerToken: string;
  }>;
};

export const metadata: Metadata = {
  title: withBrandTitle("Rechazar oferta"),
  description: "Rechaza un horario liberado desde la lista de espera publica.",
};

export default async function RejectWaitlistOfferPage({
  params,
}: RejectWaitlistOfferPageProps) {
  const { offerToken } = await params;
  const successResult = await readPublicWaitlistOfferResultCookie({
    token: offerToken,
    action: "reject",
  });

  if (successResult) {
    return (
      <PublicAppointmentShell
        clinicName={successResult.clinicName}
        clinicSlug={successResult.clinicSlug}
        brandColor={normalizeBookingBrandColor(successResult.brandColor)}
        title="Oferta rechazada"
        description={successResult.message}
      >
        <article className="surface-card p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            Oferta rechazada
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

  const validation = await validateWaitlistOfferToken({
    token: offerToken,
  });

  if (!validation.ok) {
    const copy = resolveWaitlistTokenErrorCopy(validation.reason);

    return (
      <PublicAppointmentShell
        clinicName={brand.name}
        clinicSlug="lista-espera"
        brandColor={normalizeBookingBrandColor(null)}
        title="No pudimos abrir esta oferta"
        description="Valida el enlace recibido o solicita una nueva oferta al negocio."
      >
        <TokenErrorState title={copy.title} description={copy.description} />
      </PublicAppointmentShell>
    );
  }

  const doctor =
    validation.context.waitlistEntry.doctor ?? validation.context.appointment?.doctor;

  if (!doctor) {
    return (
      <PublicAppointmentShell
        clinicName={validation.context.clinic.name}
        clinicSlug={validation.context.clinic.slug}
        brandColor={normalizeBookingBrandColor(validation.context.clinic.brandColor)}
        title="Esta oferta ya no esta disponible"
        description="El horario ya no tiene un doctor valido asociado."
      >
        <TokenErrorState
          title="Oferta no disponible"
          description="Solicita una nueva confirmacion al negocio para continuar."
        />
      </PublicAppointmentShell>
    );
  }

  return (
    <PublicAppointmentShell
      clinicName={validation.context.clinic.name}
      clinicSlug={validation.context.clinic.slug}
      brandColor={normalizeBookingBrandColor(validation.context.clinic.brandColor)}
      title="Rechaza este horario liberado"
      description="Si este espacio no te funciona, mantendremos tu solicitud activa para futuras coincidencias."
    >
      <WaitlistOfferSummary
        clinicName={validation.context.clinic.name}
        patientName={validation.context.waitlistEntry.patient.name}
        phoneE164={validation.context.waitlistEntry.patient.phoneE164}
        email={validation.context.waitlistEntry.patient.email}
        doctorName={doctor.name}
        doctorSpecialty={doctor.specialty}
        serviceName={validation.context.waitlistEntry.service.name}
        offeredStartAt={validation.context.offeredStartAt}
        offeredEndAt={validation.context.offeredEndAt}
        expiresAt={validation.context.expiresAt}
        timezone={validation.context.clinic.timezone}
        notes={validation.context.waitlistEntry.notes}
        autoAccept={validation.context.waitlistEntry.autoAccept}
      />

      <RejectWaitlistOfferForm
        token={offerToken}
        action={rejectWaitlistOfferAction}
      />
    </PublicAppointmentShell>
  );
}
