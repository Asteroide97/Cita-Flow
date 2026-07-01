import { WhatsAppConversationStatus } from "@prisma/client";

type BookingDraftCardProps = {
  conversationStatus: WhatsAppConversationStatus;
  latestIntent: string;
  latestCommandAt: Date | null;
  draft:
    | {
        id: string;
        status: string;
        patientName: string | null;
        phoneE164: string;
        preferredDate: Date | null;
        preferredTime: string | null;
        service: {
          name: string;
          durationMinutes: number;
        } | null;
        doctor: {
          name: string;
          specialty: string | null;
        } | null;
        appointment: {
          id: string;
          status: string;
          startAt: Date;
        } | null;
      }
    | null;
};

function formatTimestamp(date: Date | null) {
  if (!date) {
    return "Sin actividad";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BookingDraftCard({
  conversationStatus,
  latestIntent,
  latestCommandAt,
  draft,
}: BookingDraftCardProps) {
  return (
    <div className="grid gap-5">
      <article className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Intencion detectada
        </p>
        <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-ink">
          {latestIntent}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1.5 text-muted">
            Conversacion: {conversationStatus}
          </span>
          <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1.5 text-muted">
            Ultimo evento: {formatTimestamp(latestCommandAt)}
          </span>
        </div>
      </article>

      <article className="surface-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Booking draft
        </p>

        {draft ? (
          <div className="mt-5 grid gap-3 text-sm">
            <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
              <p className="font-semibold text-ink">Estado</p>
              <p className="mt-2 text-muted">{draft.status}</p>
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="font-semibold text-ink">Servicio</p>
              <p className="mt-2 text-muted">
                {draft.service
                  ? `${draft.service.name} · ${draft.service.durationMinutes} min`
                  : "Pendiente"}
              </p>
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="font-semibold text-ink">Profesional</p>
              <p className="mt-2 text-muted">
                {draft.doctor
                  ? draft.doctor.specialty
                    ? `${draft.doctor.name} · ${draft.doctor.specialty}`
                    : draft.doctor.name
                  : "Pendiente"}
              </p>
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="font-semibold text-ink">Horario</p>
              <p className="mt-2 text-muted">
                {draft.preferredDate && draft.preferredTime
                  ? `${new Intl.DateTimeFormat("es-MX", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    }).format(draft.preferredDate)} · ${draft.preferredTime}`
                  : "Pendiente"}
              </p>
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="font-semibold text-ink">Cliente</p>
              <p className="mt-2 text-muted">{draft.patientName ?? draft.phoneE164}</p>
            </div>

            {draft.appointment ? (
              <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-4">
                <p className="font-semibold text-emerald-800">Appointment creada</p>
                <p className="mt-2 text-emerald-700">
                  {draft.appointment.id} · {draft.appointment.status}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-muted">
            Todavia no hay un draft activo para este numero.
          </p>
        )}
      </article>
    </div>
  );
}
