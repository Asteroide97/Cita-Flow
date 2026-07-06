import type { Metadata } from "next";
import Link from "next/link";
import { Prisma, Role } from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import { PanelShell } from "@/components/app/panel-shell";
import {
  billingStatusOptions,
  billingStatusValues,
  getBillingStatusLabel,
} from "@/data/billing-statuses";
import {
  businessTypeOptions,
  businessTypeValues,
  getBusinessTypeLabel,
} from "@/data/business-types";
import { formatAppointmentPhone } from "@/components/appointments/appointment-helpers";
import { requireSuperAdminContext } from "@/lib/auth/superadmin";
import { brand, withBrandTitle } from "@/lib/brand";
import { prisma } from "@/lib/prisma";

import {
  markBusinessContactedAction,
  updateBusinessBillingNotesAction,
  updateBusinessBillingStatusAction,
} from "./actions";

type SuperAdminPageProps = {
  searchParams: Promise<{
    q?: string;
    billing?: string;
    type?: string;
    expand?: string;
    status?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: withBrandTitle("Superadmin"),
  description: "Vista interna para gestionar negocios y cobros manuales.",
};

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function normalizeBillingFilter(value?: string) {
  const normalized = String(value ?? "").trim().toUpperCase();

  return billingStatusValues.has(normalized) ? normalized : "all";
}

function normalizeBusinessTypeFilter(value?: string) {
  const normalized = String(value ?? "").trim();

  return businessTypeValues.has(normalized) ? normalized : "all";
}

function normalizeQuery(value?: string) {
  return String(value ?? "").trim();
}

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "clinic-not-found":
        return {
          tone: "error" as const,
          message: "No encontré ese negocio para actualizarlo.",
        };
      case "billing-status-invalid":
        return {
          tone: "error" as const,
          message: "Selecciona un estado comercial válido.",
        };
      case "follow-up-invalid":
        return {
          tone: "error" as const,
          message: "La fecha de seguimiento no tiene un formato válido.",
        };
      case "billing-status-save":
        return {
          tone: "error" as const,
          message: "No pude guardar el estado comercial. Intenta de nuevo.",
        };
      case "billing-notes-save":
        return {
          tone: "error" as const,
          message: "No pude guardar las notas comerciales. Intenta de nuevo.",
        };
      case "business-contact-save":
        return {
          tone: "error" as const,
          message: "No pude registrar el contacto comercial. Intenta de nuevo.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la acción solicitada.",
        };
    }
  }

  switch (status) {
    case "billing-status-updated":
      return {
        tone: "success" as const,
        message: "Estado comercial actualizado correctamente.",
      };
    case "billing-notes-updated":
      return {
        tone: "success" as const,
        message: "Notas comerciales guardadas correctamente.",
      };
    case "business-contacted":
      return {
        tone: "success" as const,
        message: "Contacto comercial registrado para hoy.",
      };
    default:
      return null;
  }
}

function getBillingStatusBadgeClassName(status: string) {
  switch (status) {
    case "ACTIVE":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700";
    case "PAYMENT_PENDING":
      return "rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
    case "SUSPENDED":
      return "rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    case "CANCELLED":
      return "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
    case "TRIAL":
    default:
      return "rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700";
  }
}

function getBusinessStateBadgeClassName(isActive: boolean) {
  return isActive
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
    : "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
}

function formatDateTime(value: Date | null, timezone: string, withTime = true) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: timezone,
  }).format(value);
}

function formatDateInputValue(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

function ReturnFields({
  query,
  billing,
  businessType,
  clinicId,
}: {
  query: string;
  billing: string;
  businessType: string;
  clinicId: string;
}) {
  return (
    <>
      <input type="hidden" name="returnQuery" value={query} />
      <input type="hidden" name="returnBilling" value={billing} />
      <input type="hidden" name="returnBusinessType" value={businessType} />
      <input type="hidden" name="expandClinicId" value={clinicId} />
    </>
  );
}

export default async function SuperAdminPage({ searchParams }: SuperAdminPageProps) {
  const [authContext, query] = await Promise.all([
    requireSuperAdminContext(),
    searchParams,
  ]);
  const searchQuery = normalizeQuery(query.q);
  const billingFilter = normalizeBillingFilter(query.billing);
  const businessTypeFilter = normalizeBusinessTypeFilter(query.type);
  const expandedClinicId = normalizeQuery(query.expand);
  const flash = resolveFlashMessage(query.status, query.error);

  const summaryRows = await prisma.clinic.findMany({
    select: {
      isActive: true,
      billingStatus: true,
    },
  });

  const where: Prisma.ClinicWhereInput = {};

  if (searchQuery) {
    where.OR = [
      {
        name: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        slug: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        publicName: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        members: {
          some: {
            role: Role.OWNER,
            user: {
              email: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          },
        },
      },
    ];
  }

  if (billingFilter !== "all") {
    where.billingStatus = billingFilter;
  }

  if (businessTypeFilter !== "all") {
    where.businessType = businessTypeFilter;
  }

  const clinics = await prisma.clinic.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      publicName: true,
      businessType: true,
      timezone: true,
      currency: true,
      brandColor: true,
      websiteUrl: true,
      contactEmail: true,
      contactPhone: true,
      billingStatus: true,
      billingNotes: true,
      nextFollowUpAt: true,
      lastContactedAt: true,
      isActive: true,
      createdAt: true,
      members: {
        where: {
          role: Role.OWNER,
          isActive: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
        select: {
          user: {
            select: {
              name: true,
              email: true,
              phoneE164: true,
            },
          },
        },
      },
      appointments: {
        orderBy: {
          startAt: "desc",
        },
        take: 1,
        select: {
          startAt: true,
        },
      },
      _count: {
        select: {
          appointments: true,
          patients: true,
          services: true,
          doctors: true,
        },
      },
    },
  });

  const totals = {
    clinics: summaryRows.length,
    activeBusinesses: summaryRows.filter((clinic) => clinic.isActive).length,
    trial: summaryRows.filter((clinic) => clinic.billingStatus === "TRIAL").length,
    paymentPending: summaryRows.filter(
      (clinic) => clinic.billingStatus === "PAYMENT_PENDING",
    ).length,
    suspended: summaryRows.filter((clinic) => clinic.billingStatus === "SUSPENDED").length,
  };

  return (
    <PanelShell auth={authContext}>
      <PanelPage
        eyebrow="Superadmin"
        title="Control comercial"
        description="Vista interna para revisar negocios registrados y gestionar cobros manuales sin bloquear la operación."
      >
        <div className="grid gap-6">
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

          <section className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Resumen
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Negocios
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {totals.clinics}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Activos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {totals.activeBusinesses}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  En prueba
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {totals.trial}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Pago pendiente
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {totals.paymentPending}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Suspendidos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {totals.suspended}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-card p-6 sm:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Negocios registrados
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Busca por nombre, slug o email del owner y filtra el estado
                  comercial sin afectar la operación diaria.
                </p>
              </div>

              <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_220px_auto]">
                <label className="text-sm font-semibold text-ink">
                  Buscar
                  <input
                    name="q"
                    defaultValue={searchQuery}
                    className={formFieldClassName()}
                    placeholder="Nombre, slug o email"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Estado comercial
                  <select
                    name="billing"
                    defaultValue={billingFilter}
                    className={formFieldClassName()}
                  >
                    <option value="all">Todos</option>
                    {billingStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Tipo de negocio
                  <select
                    name="type"
                    defaultValue={businessTypeFilter}
                    className={formFieldClassName()}
                  >
                    <option value="all">Todos</option>
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-3 self-end">
                  <button
                    type="submit"
                    className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                  >
                    Aplicar
                  </button>

                  {(searchQuery || billingFilter !== "all" || businessTypeFilter !== "all") ? (
                    <Link
                      href="/superadmin"
                      className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                    >
                      Limpiar
                    </Link>
                  ) : null}
                </div>
              </form>
            </div>
          </section>

          {clinics.length ? (
            clinics.map((clinic) => {
              const owner = clinic.members[0]?.user ?? null;
              const publicName = clinic.publicName ?? clinic.name;
              const bookingPath = `/booking/${clinic.slug}`;
              const bookingUrl = new URL(bookingPath, brand.appUrl).toString();
              const lastAppointment = clinic.appointments[0]?.startAt ?? null;

              return (
                <details
                  key={clinic.id}
                  open={expandedClinicId === clinic.id}
                  className="surface-card p-6 sm:p-7"
                >
                  <summary className="list-none cursor-pointer">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                            {clinic.name}
                          </p>
                          <span
                            className={getBillingStatusBadgeClassName(clinic.billingStatus)}
                          >
                            {getBillingStatusLabel(clinic.billingStatus)}
                          </span>
                          <span className={getBusinessStateBadgeClassName(clinic.isActive)}>
                            {clinic.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-muted">
                          /{clinic.slug} · {getBusinessTypeLabel(clinic.businessType)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {owner
                            ? `${owner.name} · ${owner.email}`
                            : "Sin owner activo registrado"}
                        </p>
                      </div>

                      <div className="text-sm font-semibold text-brand-700">
                        Ver detalle
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Reservas
                        </p>
                        <p className="mt-3 text-lg font-semibold text-ink">
                          {clinic._count.appointments}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Clientes
                        </p>
                        <p className="mt-3 text-lg font-semibold text-ink">
                          {clinic._count.patients}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Servicios
                        </p>
                        <p className="mt-3 text-lg font-semibold text-ink">
                          {clinic._count.services}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Profesionales
                        </p>
                        <p className="mt-3 text-lg font-semibold text-ink">
                          {clinic._count.doctors}
                        </p>
                      </div>

                      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Última reserva
                        </p>
                        <p className="mt-3 text-sm font-semibold text-ink">
                          {lastAppointment
                            ? formatDateTime(lastAppointment, clinic.timezone)
                            : "Sin reservas"}
                        </p>
                      </div>
                    </div>
                  </summary>

                  <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.92fr)]">
                    <div className="grid gap-6">
                      <article className="rounded-[24px] border border-line/80 bg-surface-soft px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Datos del negocio
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Nombre público
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {publicName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Creado
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {formatDateTime(clinic.createdAt, clinic.timezone, false)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Link público
                            </p>
                            <p className="mt-2 break-all text-sm font-semibold text-ink">
                              {bookingUrl}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                              Contacto
                            </p>
                            <div className="mt-2 grid gap-1 text-sm font-semibold text-ink">
                              <p>{clinic.contactEmail ?? "Sin email público"}</p>
                              <p>{clinic.contactPhone ?? "Sin teléfono público"}</p>
                              <p>{clinic.websiteUrl ?? "Sin sitio web"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Link
                            href={bookingPath}
                            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                          >
                            Abrir booking
                          </Link>
                        </div>
                      </article>

                      <article className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Owner principal
                        </p>

                        {owner ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                                Nombre
                              </p>
                              <p className="mt-2 text-sm font-semibold text-ink">
                                {owner.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                                Email
                              </p>
                              <p className="mt-2 break-all text-sm font-semibold text-ink">
                                {owner.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                                Teléfono
                              </p>
                              <p className="mt-2 text-sm font-semibold text-ink">
                                {owner.phoneE164
                                  ? formatAppointmentPhone(owner.phoneE164)
                                  : "Sin teléfono"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-muted">
                            Este negocio no tiene un owner activo asociado.
                          </p>
                        )}
                      </article>
                    </div>

                    <div className="grid gap-6">
                      <article className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          Estado comercial
                        </p>

                        <form
                          action={updateBusinessBillingStatusAction}
                          className="mt-4 grid gap-4"
                        >
                          <input type="hidden" name="clinicId" value={clinic.id} />
                          <ReturnFields
                            query={searchQuery}
                            billing={billingFilter}
                            businessType={businessTypeFilter}
                            clinicId={clinic.id}
                          />

                          <label className="text-sm font-semibold text-ink">
                            Estado
                            <select
                              name="billingStatus"
                              defaultValue={clinic.billingStatus}
                              className={formFieldClassName()}
                            >
                              {billingStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="text-sm font-semibold text-ink">
                            Próximo seguimiento
                            <input
                              type="date"
                              name="nextFollowUpAt"
                              defaultValue={formatDateInputValue(clinic.nextFollowUpAt)}
                              className={formFieldClassName()}
                            />
                          </label>

                          <div className="grid gap-2 text-sm text-muted">
                            <p>
                              Último contacto:{" "}
                              {formatDateTime(clinic.lastContactedAt, clinic.timezone)}
                            </p>
                            <p>
                              Próximo seguimiento actual:{" "}
                              {formatDateTime(clinic.nextFollowUpAt, clinic.timezone, false)}
                            </p>
                          </div>

                          <button
                            type="submit"
                            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                          >
                            Guardar estado
                          </button>
                        </form>
                      </article>

                      <article className="rounded-[24px] border border-line/80 bg-white px-5 py-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            Seguimiento
                          </p>

                          <form action={markBusinessContactedAction}>
                            <input type="hidden" name="clinicId" value={clinic.id} />
                            <ReturnFields
                              query={searchQuery}
                              billing={billingFilter}
                              businessType={businessTypeFilter}
                              clinicId={clinic.id}
                            />
                            <button
                              type="submit"
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                            >
                              Marcar contactado hoy
                            </button>
                          </form>
                        </div>

                        <form
                          action={updateBusinessBillingNotesAction}
                          className="mt-4 grid gap-4"
                        >
                          <input type="hidden" name="clinicId" value={clinic.id} />
                          <ReturnFields
                            query={searchQuery}
                            billing={billingFilter}
                            businessType={businessTypeFilter}
                            clinicId={clinic.id}
                          />

                          <label className="text-sm font-semibold text-ink">
                            Notas internas
                            <textarea
                              name="billingNotes"
                              rows={5}
                              defaultValue={clinic.billingNotes ?? ""}
                              className={formFieldClassName()}
                              placeholder="Seguimiento comercial, acuerdos y próximos pasos."
                            />
                          </label>

                          <button
                            type="submit"
                            className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                          >
                            Guardar nota
                          </button>
                        </form>
                      </article>
                    </div>
                  </div>
                </details>
              );
            })
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                No hay negocios para este filtro.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Ajusta la búsqueda o limpia los filtros para volver a ver el listado
                completo.
              </p>
            </article>
          )}
        </div>
      </PanelPage>
    </PanelShell>
  );
}
