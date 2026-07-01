import {
  WaitlistOfferStatus,
  WaitlistStatus,
} from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import {
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { expirePendingWaitlistOffers } from "@/lib/waitlist/matching";

import {
  cancelWaitlistEntryAction,
  expireWaitlistEntryAction,
} from "./actions";

type WaitlistPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "waitlist-entry-not-found":
        return {
          tone: "error" as const,
          message: "No encontre esa entrada de lista de espera dentro de la clinica actual.",
        };
      case "waitlist-entry-action-invalid":
        return {
          tone: "error" as const,
          message: "La accion ya no esta permitida para el estado actual de esa entrada.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion sobre la lista de espera.",
        };
    }
  }

  switch (status) {
    case "waitlist-entry-cancelled":
      return {
        tone: "success" as const,
        message: "Entrada cancelada correctamente.",
      };
    case "waitlist-entry-expired":
      return {
        tone: "success" as const,
        message: "Entrada marcada como expirada.",
      };
    default:
      return null;
  }
}

function getEntryStatusLabel(status: WaitlistStatus) {
  switch (status) {
    case WaitlistStatus.ACTIVE:
      return "Activa";
    case WaitlistStatus.OFFERED:
      return "Ofertada";
    case WaitlistStatus.CONVERTED:
      return "Convertida";
    case WaitlistStatus.CANCELLED:
      return "Cancelada";
    case WaitlistStatus.EXPIRED:
      return "Expirada";
  }
}

function getEntryStatusClassName(status: WaitlistStatus) {
  switch (status) {
    case WaitlistStatus.ACTIVE:
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case WaitlistStatus.OFFERED:
      return "border-amber-200 bg-amber-100 text-amber-700";
    case WaitlistStatus.CONVERTED:
      return "border-brand-200 bg-brand-100 text-brand-700";
    case WaitlistStatus.CANCELLED:
      return "border-rose-200 bg-rose-100 text-rose-700";
    case WaitlistStatus.EXPIRED:
      return "border-slate-200 bg-slate-200 text-slate-700";
  }
}

function getOfferStatusLabel(status: WaitlistOfferStatus) {
  switch (status) {
    case WaitlistOfferStatus.PENDING:
      return "Pendiente";
    case WaitlistOfferStatus.ACCEPTED:
      return "Aceptada";
    case WaitlistOfferStatus.DECLINED:
      return "Rechazada";
    case WaitlistOfferStatus.EXPIRED:
      return "Expirada";
    case WaitlistOfferStatus.CANCELLED:
      return "Cancelada";
  }
}

function getOfferStatusClassName(status: WaitlistOfferStatus) {
  switch (status) {
    case WaitlistOfferStatus.PENDING:
      return "border-amber-200 bg-amber-100 text-amber-700";
    case WaitlistOfferStatus.ACCEPTED:
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case WaitlistOfferStatus.DECLINED:
      return "border-rose-200 bg-rose-100 text-rose-700";
    case WaitlistOfferStatus.EXPIRED:
      return "border-slate-200 bg-slate-200 text-slate-700";
    case WaitlistOfferStatus.CANCELLED:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPreferredRangeLabel(
  preferredStartTime: string | null,
  preferredEndTime: string | null,
) {
  if (!preferredStartTime && !preferredEndTime) {
    return "Cualquier horario";
  }

  if (preferredStartTime === "08:00" && preferredEndTime === "13:59") {
    return "Manana";
  }

  if (preferredStartTime === "14:00" && preferredEndTime === "20:00") {
    return "Tarde";
  }

  return `${preferredStartTime ?? "00:00"} - ${preferredEndTime ?? "23:59"}`;
}

export default async function WaitlistPage({
  searchParams,
}: WaitlistPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);

  await expirePendingWaitlistOffers({
    clinicId: authContext.clinic.id,
    actorUserId: authContext.user.id,
  });

  const entries = await prisma.waitlistEntry.findMany({
    where: {
      clinicId: authContext.clinic.id,
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
      offers: {
        orderBy: [{ createdAt: "desc" }],
        include: {
          appointment: {
            select: {
              id: true,
              startAt: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const flash = resolveFlashMessage(query.status, query.error);
  const activeCount = entries.filter((entry) => entry.status === WaitlistStatus.ACTIVE).length;
  const offeredCount = entries.filter((entry) => entry.status === WaitlistStatus.OFFERED).length;
  const convertedCount = entries.filter((entry) => entry.status === WaitlistStatus.CONVERTED).length;
  const closedCount = entries.filter(
    (entry) =>
      entry.status === WaitlistStatus.CANCELLED ||
      entry.status === WaitlistStatus.EXPIRED,
  ).length;

  return (
    <PanelPage
      eyebrow="Lista de espera"
      title="Solicitudes y ofertas de horarios liberados"
      description="Aquí puedes revisar clientes en espera, ofertas pendientes y conversiones a reservas reales cuando alguien libera un espacio."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Activas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {activeCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Entradas esperando una coincidencia compatible.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Ofertadas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {offeredCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Clientes con un horario liberado pendiente de respuesta.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Convertidas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {convertedCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Entradas que ya terminaron en una reserva creada.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Cerradas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {closedCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Canceladas o vencidas por el negocio.
            </p>
          </article>
        </div>

        {flash ? (
          <div
            className={
              flash.tone === "success"
                ? "rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
                : "rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
            }
          >
            {flash.message}
          </div>
        ) : null}

        <article className="surface-card p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Entradas del negocio actual
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                Cada entrada guarda la preferencia de servicio, profesional, fecha y
                rango horario. Las ofertas asociadas quedan visibles para depurar
                el motor antes de conectar WhatsApp real.
              </p>
            </div>

            <div className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted">
              {entries.length} entradas
            </div>
          </div>

          {entries.length ? (
            <div className="mt-6 grid gap-4">
              {entries.map((entry) => {
                const canClose =
                  entry.status === WaitlistStatus.ACTIVE ||
                  entry.status === WaitlistStatus.OFFERED;

                return (
                  <article
                    key={entry.id}
                    className="rounded-[28px] border border-line/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getEntryStatusClassName(entry.status)}`}
                        >
                          {getEntryStatusLabel(entry.status)}
                        </span>
                        <span className="inline-flex rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {entry.autoAccept ? "Auto aceptar" : "Confirmacion manual"}
                        </span>
                      </div>

                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                        Creada {formatDateTimeInTimeZone(entry.createdAt, authContext.clinic.timezone)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                      <div className="grid gap-4">
                        <div>
                          <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                            {entry.patient.name}
                          </h2>
                          <p className="mt-2 text-sm leading-7 text-muted">
                            {entry.patient.phoneE164}
                            {entry.patient.email ? ` - ${entry.patient.email}` : ""}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                              Servicio
                            </p>
                            <p className="mt-3 text-base font-semibold text-ink">
                              {entry.service.name}
                            </p>
                          </div>

                          <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                              Profesional preferido
                            </p>
                            <p className="mt-3 text-base font-semibold text-ink">
                              {entry.doctor?.name ?? "Cualquier profesional"}
                            </p>
                            <p className="mt-1 text-sm text-muted">
                              {entry.doctor?.specialty ?? "Sin restricción"}
                            </p>
                          </div>

                          <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                              Fecha preferida
                            </p>
                            <p className="mt-3 text-base font-semibold text-ink">
                              {entry.preferredDate
                                ? formatDateInTimeZone(
                                    entry.preferredDate,
                                    authContext.clinic.timezone,
                                  )
                                : "Sin fecha fija"}
                            </p>
                          </div>

                          <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                              Rango preferido
                            </p>
                            <p className="mt-3 text-base font-semibold text-ink">
                              {getPreferredRangeLabel(
                                entry.preferredStartTime,
                                entry.preferredEndTime,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm leading-7 text-muted">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            Notas
                          </p>
                          <p className="mt-3">
                            {entry.notes ?? "Sin notas adicionales para esta solicitud."}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 self-start rounded-[24px] border border-line/80 bg-white px-4 py-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            Acciones
                          </p>
                          <p className="mt-3 text-sm leading-7 text-muted">
                            Cancela o expira manualmente la entrada mientras el motor
                            sigue madurando.
                          </p>
                        </div>

                        {canClose ? (
                          <div className="grid gap-2">
                            <form action={cancelWaitlistEntryAction}>
                              <input
                                type="hidden"
                                name="waitlistEntryId"
                                value={entry.id}
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                              >
                                Cancelar entrada
                              </button>
                            </form>

                            <form action={expireWaitlistEntryAction}>
                              <input
                                type="hidden"
                                name="waitlistEntryId"
                                value={entry.id}
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-200"
                              >
                                Marcar expirada
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
                            Esta entrada ya no admite cambios manuales.
                          </div>
                        )}

                        <details className="rounded-[20px] border border-line/80 bg-surface-soft px-4 py-4">
                          <summary className="cursor-pointer text-sm font-semibold text-ink">
                            Ver ofertas ({entry.offers.length})
                          </summary>
                          <div className="mt-4 grid gap-3">
                            {entry.offers.length ? (
                              entry.offers.map((offer) => (
                                <div
                                  key={offer.id}
                                  className="rounded-[18px] border border-line/80 bg-white px-4 py-4"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getOfferStatusClassName(offer.status)}`}
                                    >
                                      {getOfferStatusLabel(offer.status)}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-ink">
                                    {formatDateTimeInTimeZone(
                                      offer.offeredStartAt,
                                      authContext.clinic.timezone,
                                    )}
                                  </p>
                                  <p className="mt-1 text-sm text-muted">
                                    Vence{" "}
                                    {formatDateTimeInTimeZone(
                                      offer.expiresAt,
                                      authContext.clinic.timezone,
                                    )}
                                  </p>
                                  <p className="mt-2 text-sm text-muted">
                                    {offer.appointment
                                      ? `Reserva asociada: ${offer.appointment.id} - ${offer.appointment.status}`
                                      : "Sin reserva final asociada todavía."}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm leading-7 text-muted">
                                Esta entrada aun no tiene ofertas asociadas.
                              </p>
                            )}
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-dashed border-line bg-surface-soft px-6 py-10 text-center">
              <p className="text-lg font-semibold tracking-[-0.03em] text-ink">
                Aun no hay solicitudes en lista de espera
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Usa el booking público y selecciona &quot;Prefiero otro horario&quot;
                para empezar a poblar esta bandeja.
              </p>
            </div>
          )}
        </article>
      </div>
    </PanelPage>
  );
}
