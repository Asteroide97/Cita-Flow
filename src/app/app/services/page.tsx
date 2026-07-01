import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  createServiceAction,
  toggleServiceStatusAction,
  updateServiceAction,
} from "./actions";

type ServicesPageProps = {
  searchParams: Promise<{
    edit?: string;
    status?: string;
    error?: string;
  }>;
};

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "service-not-found":
        return {
          tone: "error" as const,
          message: "No encontré ese servicio dentro del negocio actual.",
        };
      case "service-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del servicio es obligatorio.",
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
    default:
      return null;
  }
}

function formatMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "No configurado";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function centsToInputValue(cents: number | null) {
  if (cents === null) {
    return "";
  }

  return (cents / 100).toFixed(2);
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const services = await prisma.service.findMany({
    where: {
      clinicId: authContext.clinic.id,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      priceCents: true,
      depositRequired: true,
      depositCents: true,
      isActive: true,
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  const activeCount = services.filter((service) => service.isActive).length;
  const inactiveCount = services.length - activeCount;
  const editingService = query.edit
    ? services.find((service) => service.id === query.edit) ?? null
    : null;
  const flash = resolveFlashMessage(query.status, query.error);

  return (
    <PanelPage
      eyebrow="Servicios"
      title="Catálogo operativo de servicios"
      description="Administra los servicios que el negocio puede vender y reservar. Todo queda aislado por tenant y alimenta el panel, la disponibilidad y el simulador local de WhatsApp."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
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
            </div>

            <div className="mt-5 grid gap-3 text-sm text-muted">
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                La duracion minima es de 15 minutos y siempre debe ser multiplo de 15.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                Los servicios no se eliminan físicamente si ya tienen reservas; solo se
                activan o desactivan.
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
                    ? "Actualiza nombre, duración, precio, anticipo y estado del servicio."
                    : "Carga un servicio nuevo para que el negocio pueda ofrecerlo en panel y canales futuros."}
                </p>
              </div>

              {editingService ? (
                <Link
                  href="/app/services"
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

              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  name="name"
                  required
                  defaultValue={editingService?.name ?? ""}
                  className={formFieldClassName()}
                  placeholder="Primera consulta"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Descripcion opcional
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingService?.description ?? ""}
                  className={formFieldClassName()}
                  placeholder="Explica brevemente el servicio y su alcance."
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
                  Monto de anticipo opcional
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
          {services.length ? (
            services.map((service) => (
              <article key={service.id} className="surface-card p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                      {service.name}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {service.description ?? "Sin descripcion registrada"}
                    </p>
                  </div>

                  <span
                    className={
                      service.isActive
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                        : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                    }
                  >
                    {service.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
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
                      {formatMoney(service.priceCents, authContext.clinic.currency)}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Anticipo
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {service.depositRequired
                        ? formatMoney(service.depositCents, authContext.clinic.currency)
                        : "No requerido"}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Reservas asociadas
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {service._count.appointments}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/app/services?edit=${service.id}`}
                    className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Editar
                  </Link>

                  <form action={toggleServiceStatusAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
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
                </div>
              </article>
            ))
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                Todavía no hay servicios cargados para este negocio.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Crea el primer servicio desde el formulario para habilitar reservas y
                flujos operativos.
              </p>
            </article>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
