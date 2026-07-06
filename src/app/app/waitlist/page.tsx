import {
  WaitlistOfferStatus,
  WaitlistStatus,
} from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import { CompactStatCard } from "@/components/ui/compact-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
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
          message: "No encontre esa entrada de lista de espera dentro del negocio actual.",
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

function CompactField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
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
      title="Lista de espera"
      description="Solicitudes y ofertas para horarios liberados."
    >
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStatCard label="Activas" value={activeCount} tone="emerald" />
          <CompactStatCard label="Ofertadas" value={offeredCount} tone="amber" />
          <CompactStatCard label="Convertidas" value={convertedCount} tone="brand" />
          <CompactStatCard label="Cerradas" value={closedCount} tone="slate" />
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Entradas
              </p>
              <p className="mt-2 text-sm text-muted">
                {entries.length} solicitud{entries.length === 1 ? "" : "es"} visibles.
              </p>
            </div>
          </div>

          {entries.length ? (
            <div className="mt-6 grid gap-3">
              {entries.map((entry) => {
                const canClose =
                  entry.status === WaitlistStatus.ACTIVE ||
                  entry.status === WaitlistStatus.OFFERED;

                return (
                  <article
                    key={entry.id}
                    className="rounded-[24px] border border-line/80 bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill className={getEntryStatusClassName(entry.status)}>
                            {getEntryStatusLabel(entry.status)}
                          </StatusPill>
                          <StatusPill className="border-line/80 bg-surface-soft text-muted">
                            {entry.autoAccept ? "Auto aceptar" : "Manual"}
                          </StatusPill>
                        </div>

                        <h2 className="mt-3 text-base font-semibold tracking-[-0.03em] text-ink">
                          {entry.patient.name}
                        </h2>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                          {formatDateTimeInTimeZone(
                            entry.createdAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <CompactField label="Servicio" value={entry.service.name} />
                      <CompactField
                        label="Profesional preferido"
                        value={entry.doctor?.name ?? "Cualquier profesional"}
                      />
                      <CompactField
                        label="Fecha preferida"
                        value={
                          entry.preferredDate
                            ? formatDateInTimeZone(
                                entry.preferredDate,
                                authContext.clinic.timezone,
                              )
                            : "Sin fecha fija"
                        }
                      />
                      <CompactField
                        label="Rango preferido"
                        value={getPreferredRangeLabel(
                          entry.preferredStartTime,
                          entry.preferredEndTime,
                        )}
                      />
                    </div>

                    <CollapsibleDetails summary="Ver detalles" className="mt-4">
                      <div className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <CompactField
                            label="Cliente"
                            value={`${entry.patient.phoneE164}${entry.patient.email ? ` - ${entry.patient.email}` : ""}`}
                          />
                          <CompactField
                            label="Especialidad"
                            value={entry.doctor?.specialty ?? "Sin restriccion"}
                          />
                          <CompactField
                            label="Ofertas"
                            value={String(entry.offers.length)}
                          />
                          <CompactField
                            label="Estado"
                            value={getEntryStatusLabel(entry.status)}
                          />
                        </div>

                        <div className="rounded-[18px] border border-line/80 bg-white px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                            Notas
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {entry.notes ?? "Sin notas adicionales."}
                          </p>
                        </div>

                        <div className="grid gap-3">
                          {entry.offers.length ? (
                            entry.offers.map((offer) => (
                              <div
                                key={offer.id}
                                className="rounded-[18px] border border-line/80 bg-white px-4 py-4"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusPill className={getOfferStatusClassName(offer.status)}>
                                    {getOfferStatusLabel(offer.status)}
                                  </StatusPill>
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
                                    : "Sin reserva final asociada."}
                                </p>
                              </div>
                            ))
                          ) : (
                            <EmptyState
                              title="Sin ofertas asociadas."
                              className="border-line/80 bg-white"
                            />
                          )}
                        </div>

                        {canClose ? (
                          <div className="flex flex-wrap gap-2">
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
                          <EmptyState
                            title="Esta entrada ya no admite cambios manuales."
                            className="border-line/80 bg-white"
                          />
                        )}
                      </div>
                    </CollapsibleDetails>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Aun no hay solicitudes en lista de espera."
              description='Usa el booking publico y selecciona "Prefiero otro horario" para poblar esta bandeja.'
              className="mt-6"
            />
          )}
        </article>
      </div>
    </PanelPage>
  );
}
