import Link from "next/link";

import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import { brand } from "@/lib/brand";
import type { BookingConfirmationData } from "@/types/booking";

type BookingConfirmationProps = {
  confirmation: BookingConfirmationData;
  resetHref: string;
};

export function BookingConfirmation({
  confirmation,
  resetHref,
}: BookingConfirmationProps) {
  return (
    <section className="surface-card min-w-0 p-6 sm:p-8">
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
        Solicitud registrada
      </span>

      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.06em] text-ink sm:text-4xl">
        Tu reserva quedó pendiente de confirmación
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
        El negocio recibió tu solicitud y confirmará el horario contigo. Aquí
        tienes el resumen de la reserva.
      </p>

      <div className="mt-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-[24px] border border-line/80 bg-surface-soft px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Negocio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {confirmation.clinicName}
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Estado
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {confirmation.statusLabel}
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Servicio
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {confirmation.serviceName}
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Profesional
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {confirmation.doctorName}
          </p>
        </div>

        <div className="rounded-[24px] border border-line/80 bg-white px-5 py-5 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Fecha y hora
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            {formatDateTimeInTimeZone(
              new Date(confirmation.startAtIso),
              confirmation.timezone,
            )}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={resetHref}
          className="inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--booking-brand)" }}
        >
          Reservar otra vez
        </Link>
        <Link
          href="/"
          className="inline-flex rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
        >
          Volver a {brand.name}
        </Link>
      </div>
    </section>
  );
}
