import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { formatAppointmentMoney } from "@/components/appointments/appointment-helpers";
import {
  getServiceCategoryLabel,
  serviceCategoryOptions,
} from "@/data/service-categories";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  createServiceAction,
  toggleServicePublicVisibilityAction,
  toggleServiceStatusAction,
  updateServiceAction,
} from "./actions";

type ServicesPageProps = {
  searchParams: Promise<{
    edit?: string;
    status?: string;
    error?: string;
    filter?: string;
  }>;
};

type ServiceFilter = "all" | "active" | "inactive" | "public" | "hidden";

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function normalizeFilter(value?: string): ServiceFilter {
  switch (value) {
    case "active":
    case "inactive":
    case "public":
    case "hidden":
      return value;
    default:
      return "all";
  }
}

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "service-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese servicio dentro del negocio actual.",
        };
      case "service-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del servicio es obligatorio.",
        };
      case "service-category-invalid":
        return {
          tone: "error" as const,
          message: "Selecciona una categoria valida para el servicio.",
        };
      case "service-duration-min":
        return {
          tone: "error" as const,
          message: "La duracion minima es de 15 minutos.",
        };
      case "service-duration-step":
        return {
          tone: "error" as const,
          message: "La duracion debe ser multiplo de 15 minutos.",
        };
      case "service-price-invalid":
        return {
          tone: "error" as const,
          message: "El precio no puede ser negativo y debe ser un monto valido.",
        };
      case "service-deposit-required":
        return {
          tone: "error" as const,
          message: "Si el anticipo es obligatorio, el monto debe ser mayor a 0.",
        };
      case "service-deposit-invalid":
        return {
          tone: "error" as const,
          message: "El monto de anticipo no puede ser negativo.",
        };
      case "service-public-order-invalid":
        return {
          tone: "error" as const,
          message: "El orden publico debe ser un numero entero igual o mayor a 0.",
        };
      case "service-name-duplicate":
        return {
          tone: "error" as const,
          message: "Ya existe un servicio con ese nombre en este negocio.",
        };
      case "service-save":
        return {
          tone: "error" as const,
          message: "No pude guardar el servicio. Intenta de nuevo.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion solicitada.",
        };
    }
  }

  switch (status) {
    case "service-created":
      return {
        tone: "success" as const,
        message: "Servicio creado correctamente.",
      };
    case "service-updated":
      return {
        tone: "success" as const,
        message: "Servicio actualizado correctamente.",
      };
    case "service-activated":
      return {
        tone: "success" as const,
        message: "Servicio activado nuevamente.",
      };
    case "service-deactivated":
      return {
        tone: "success" as const,
        message: "Servicio desactivado sin borrar historial.",
      };
    case "service-public":
      return {
        tone: "success" as const,
        message: "Servicio visible nuevamente en el booking publico.",
      };
    case "service-hidden":
      return {
        tone: "success" as const,
        message: "Servicio ocultado del booking publico.",
      };
    default:
      return null;
  }
}

function centsToInputValue(cents: number | null) {
  if (cents === null) {
    return "";
  }

  return (cents / 100).toFixed(2);
}

function getServiceStatusBadgeClassName(isActive: boolean) {
  return isActive
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
    : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
}

function getServiceVisibilityBadgeClassName(isPublic: boolean) {
  return isPublic
    ? "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700"
    : "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const filter = normalizeFilter(query.filter);
  const services = await prisma.service.findMany({
    where: {
      clinicId: authContext.clinic.id,
    },
    orderBy: [
      { isActive: "desc" },
      { isPublic: "desc" },
      { publicOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      durationMinutes: true,
      priceCents: true,
      depositRequired: true,
      depositCents: true,
      publicOrder: true,
      isPublic: true,
      isActive: true,
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  const visibleServices = services.filter((service) => {
    switch (filter) {
      case "active":
        return service.isActive;
      case "inactive":
        return !service.isActive;
      case "public":
        return service.isPublic;
      case "hidden":
        return !service.isPublic;
      default:
        return true;
    }
  });

  const activeCount = services.filter((service) => service.isActive).length;
  const inactiveCount = services.length - activeCount;
  const publicCount = services.filter((service) => service.isPublic).length;
  const hiddenCount = services.length - publicCount;
  const editingService = query.edit
    ? services.find((service) => service.id === query.edit) ?? null
    : null;
  const flash = resolveFlashMessage(query.status, query.error);

  return (
    <PanelPage
      eyebrow="Servicios"
      title="Catalogo publico de servicios"
      description="Administra el catalogo que alimenta el booking publico del negocio. Define categoria, visibilidad, orden y reglas operativas sin tocar el historial de reservas."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.4fr)]">
        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Resumen del catalogo
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Activos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Inactivos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {inactiveCount}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Publicos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {publicCount}
                </p>
              </div>

              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Ocultos
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {hiddenCount}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-muted">
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                Solo los servicios activos y visibles aparecen en el booking publico.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                El orden publico controla como se presenta el catalogo; primero se usa
                `publicOrder` y despues el nombre.
              </div>
            </div>
          </article>

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
                  {editingService ? "Editar servicio" : "Crear servicio"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {editingService
                    ? "Actualiza categoria, visibilidad, orden publico, precio y reglas del servicio."
                    : "Carga un servicio nuevo y decide si debe publicarse inmediatamente en el booking."}
                </p>
              </div>

              {editingService ? (
                <Link
                  href={filter === "all" ? "/app/services" : `/app/services?filter=${filter}`}
                  className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
                >
                  Cancelar
                </Link>
              ) : null}
            </div>

            <form
              action={editingService ? updateServiceAction : createServiceAction}
              className="mt-6 grid gap-4"
            >
              {editingService ? (
                <input type="hidden" name="serviceId" value={editingService.id} />
              ) : null}
              <input type="hidden" name="returnFilter" value={filter} />

              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  name="name"
                  required
                  defaultValue={editingService?.name ?? ""}
                  className={formFieldClassName()}
                  placeholder="Servicio completo"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Categoria
                  <select
                    name="category"
                    defaultValue={editingService?.category ?? "general"}
                    className={formFieldClassName()}
                  >
                    {serviceCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Orden publico
                  <input
                    name="publicOrder"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={editingService?.publicOrder ?? services.length}
                    className={formFieldClassName()}
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-ink">
                Descripcion opcional
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingService?.description ?? ""}
                  className={formFieldClassName()}
                  placeholder="Explica brevemente el servicio y lo que incluye."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Duracion (minutos)
                  <input
                    name="durationMinutes"
                    type="number"
                    min="15"
                    step="15"
                    required
                    defaultValue={editingService?.durationMinutes ?? 30}
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Precio opcional
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToInputValue(editingService?.priceCents ?? null)}
                    className={formFieldClassName()}
                    placeholder="650.00"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Anticipo requerido
                  <select
                    name="depositRequired"
                    defaultValue={editingService?.depositRequired ? "true" : "false"}
                    className={formFieldClassName()}
                  >
                    <option value="false">No</option>
                    <option value="true">Si</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Monto de anticipo
                  <input
                    name="deposit"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={centsToInputValue(editingService?.depositCents ?? null)}
                    className={formFieldClassName()}
                    placeholder="200.00"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Estado
                  <select
                    name="isActive"
                    defaultValue={editingService?.isActive === false ? "false" : "true"}
                    className={formFieldClassName()}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Visibilidad publica
                  <select
                    name="isPublic"
                    defaultValue={editingService?.isPublic === false ? "false" : "true"}
                    className={formFieldClassName()}
                  >
                    <option value="true">Visible en booking</option>
                    <option value="false">Oculto del booking</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                {editingService ? "Guardar cambios" : "Crear servicio"}
              </button>
            </form>
          </article>
        </div>

        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Servicios del catalogo
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Filtra activos, inactivos, publicos u ocultos y ajusta la visibilidad
                  sin salir del listado.
                </p>
              </div>

              <form className="grid gap-3 sm:grid-cols-[220px_auto]">
                <label className="text-sm font-semibold text-ink">
                  Filtro
                  <select
                    name="filter"
                    defaultValue={filter}
                    className={formFieldClassName()}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                    <option value="public">Solo publicos</option>
                    <option value="hidden">Solo ocultos</option>
                  </select>
                </label>

                <div className="flex gap-3 self-end">
                  <button
                    type="submit"
                    className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                  >
                    Aplicar
                  </button>

                  {filter !== "all" ? (
                    <Link
                      href="/app/services"
                      className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                    >
                      Limpiar
                    </Link>
                  ) : null}
                </div>
              </form>
            </div>
          </article>

          {visibleServices.length ? (
            visibleServices.map((service) => (
              <article key={service.id} className="surface-card p-6 sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                        {service.name}
                      </p>
                      <span className={getServiceStatusBadgeClassName(service.isActive)}>
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <span className={getServiceVisibilityBadgeClassName(service.isPublic)}>
                        {service.isPublic ? "Publico" : "Oculto"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-7 text-muted">
                      {service.description ?? "Sin descripcion registrada para este servicio."}
                    </p>
                  </div>

                  <Link
                    href={
                      filter === "all"
                        ? `/app/services?edit=${service.id}`
                        : `/app/services?edit=${service.id}&filter=${filter}`
                    }
                    className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Editar
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Categoria
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {getServiceCategoryLabel(service.category)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Duracion
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {service.durationMinutes} min
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Precio
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {formatAppointmentMoney(
                        service.priceCents,
                        authContext.clinic.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Anticipo
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {service.depositRequired
                        ? formatAppointmentMoney(
                            service.depositCents,
                            authContext.clinic.currency,
                          )
                        : "No requerido"}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Orden publico
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {service.publicOrder}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={toggleServiceStatusAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input type="hidden" name="returnFilter" value={filter} />
                    <input
                      type="hidden"
                      name="nextIsActive"
                      value={service.isActive ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        service.isActive
                          ? "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                          : "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                      }
                    >
                      {service.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>

                  <form action={toggleServicePublicVisibilityAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input type="hidden" name="returnFilter" value={filter} />
                    <input
                      type="hidden"
                      name="nextIsPublic"
                      value={service.isPublic ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        service.isPublic
                          ? "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                          : "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                      }
                    >
                      {service.isPublic ? "Ocultar del booking" : "Mostrar en booking"}
                    </button>
                  </form>

                  <div className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm text-muted">
                    {service._count.appointments} reserva
                    {service._count.appointments === 1 ? "" : "s"} asociada
                    {service._count.appointments === 1 ? "" : "s"}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                No hay servicios para este filtro.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {services.length
                  ? "Ajusta el filtro o cambia la visibilidad de un servicio existente."
                  : "Crea el primer servicio para empezar a construir el catalogo publico del negocio."}
              </p>
            </article>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
