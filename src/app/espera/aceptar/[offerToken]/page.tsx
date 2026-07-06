import type { Metadata } from "next";

import { AcceptWaitlistOfferForm } from "@/components/public-appointment/accept-waitlist-offer-form";
import { PublicAppointmentShell } from "@/components/public-appointment/public-appointment-shell";
import { TokenErrorState } from "@/components/public-appointment/token-error-state";
import { WaitlistOfferSummary } from "@/components/public-appointment/waitlist-offer-summary";
import { normalizeBookingBrandColor } from "@/lib/booking/public";
import { brand, withBrandTitle } from "@/lib/brand";
import {
  resolveWaitlistOfferFlashMessage,
  resolveWaitlistTokenErrorCopy,
} from "@/lib/waitlist/public";
import { readPublicWaitlistOfferResultCookie } from "@/lib/waitlist/public-result";
import { validateWaitlistOfferToken } from "@/lib/waitlist/tokens";

import { acceptWaitlistOfferAction } from "../../actions";

type AcceptWaitlistOfferPageProps = {
  params: Promise<{
    offerToken: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: withBrandTitle("Aceptar oferta"),
  description: "Acepta un horario liberado desde la lista de espera pública.",
};

export default async function AcceptWaitlistOfferPage({
  params,
  searchParams,
}: AcceptWaitlistOfferPageProps) {
  const [{ offerToken }, query] = await Promise.all([params, searchParams]);
  const successResult = await readPublicWaitlistOfferResultCookie({
    token: offerToken,
    action: "accept",
  });

  if (successResult) {
    return (
      <PublicAppointmentShell
        clinicName={successResult.clinicName}
        clinicSlug={successResult.clinicSlug}
        brandColor={normalizeBookingBrandColor(successResult.brandColor)}
        title="Tu horario fue tomado"
        description={successResult.message}
      >
        <article className="surface-card p-6 sm:p-8">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            Oferta aceptada
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

  const flash = resolveWaitlistOfferFlashMessage(query.error);

  return (
    <PublicAppointmentShell
      clinicName={validation.context.clinic.name}
      clinicSlug={validation.context.clinic.slug}
      brandColor={normalizeBookingBrandColor(validation.context.clinic.brandColor)}
      title="Acepta este horario liberado"
      description="Si el espacio sigue libre, registraremos tu reserva sin que tengas que iniciar sesión."
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

      {flash ? (
        <div className="rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {flash.message}
        </div>
      ) : null}

      <AcceptWaitlistOfferForm
        token={offerToken}
        action={acceptWaitlistOfferAction}
      />
    </PublicAppointmentShell>
  );
}
