import { formatAppointmentPhone } from "@/components/appointments/appointment-helpers";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";

type WaitlistOfferSummaryProps = {
  clinicName: string;
  patientName: string;
  phoneE164: string;
  email: string | null;
  doctorName: string;
  doctorSpecialty: string | null;
  serviceName: string;
  offeredStartAt: Date;
  offeredEndAt: Date;
  expiresAt: Date;
  timezone: string;
  notes: string | null;
  autoAccept: boolean;
};

export function WaitlistOfferSummary({
  clinicName,
  patientName,
  phoneE164,
  email,
  doctorName,
  doctorSpecialty,
  serviceName,
  offeredStartAt,
  offeredEndAt,
  expiresAt,
  timezone,
  notes,
  autoAccept,
}: WaitlistOfferSummaryProps) {
  return (
    <article className="surface-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Oferta de lista de espera
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
            {clinicName}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {patientName} - {formatAppointmentPhone(phoneE164)}
            {email ? ` - ${email}` : ""}
          </p>
        </div>

        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          Pendiente
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Doctor
          </p>
          <p className="mt-3 text-base font-semibold text-ink">{doctorName}</p>
          <p className="mt-1 text-sm text-muted">
            {doctorSpecialty ?? "Sin especialidad"}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Servicio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">{serviceName}</p>
          <p className="mt-1 text-sm text-muted">
            Oferta liberada desde lista de espera.
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Horario ofrecido
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatDateTimeInTimeZone(offeredStartAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Hasta {formatDateTimeInTimeZone(offeredEndAt, timezone)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Vigencia
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatDateTimeInTimeZone(expiresAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {autoAccept
              ? "Tu solicitud permite asignacion automatica."
              : "Necesitas aceptar manualmente este horario."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-line/80 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Notas
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {notes ?? "Sin notas adicionales para esta solicitud."}
        </p>
      </div>
    </article>
  );
}
