import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { ProfessionalAvatar } from "@/components/doctors/professional-avatar";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  createDoctorAction,
  toggleDoctorPublicVisibilityAction,
  toggleDoctorStatusAction,
  updateDoctorAction,
} from "./actions";

type DoctorsPageProps = {
  searchParams: Promise<{
    edit?: string;
    status?: string;
    error?: string;
    filter?: string;
  }>;
};

type DoctorFilter = "all" | "active" | "inactive" | "public" | "hidden";

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function normalizeFilter(value?: string): DoctorFilter {
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
      case "doctor-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese profesional dentro del negocio actual.",
        };
      case "doctor-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del profesional es obligatorio.",
        };
      case "doctor-public-order-invalid":
        return {
          tone: "error" as const,
          message: "El orden público debe ser un número entero igual o mayor a 0.",
        };
      case "doctor-photo-url-invalid":
        return {
          tone: "error" as const,
          message: "La foto debe ser una URL valida con http o https.",
        };
      case "doctor-save":
        return {
          tone: "error" as const,
          message: "No pude guardar el profesional. Intenta de nuevo.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion solicitada.",
        };
    }
  }

  switch (status) {
    case "doctor-created":
      return {
        tone: "success" as const,
        message: "Profesional creado correctamente.",
      };
    case "doctor-updated":
      return {
        tone: "success" as const,
        message: "Profesional actualizado correctamente.",
      };
    case "doctor-activated":
      return {
        tone: "success" as const,
        message: "Profesional activado nuevamente.",
      };
    case "doctor-deactivated":
      return {
        tone: "success" as const,
        message: "Profesional desactivado sin borrar historial de reservas.",
      };
    case "doctor-public":
      return {
        tone: "success" as const,
        message: "Profesional visible nuevamente en el booking público.",
      };
    case "doctor-hidden":
      return {
        tone: "success" as const,
        message: "Profesional ocultado del booking público.",
      };
    default:
      return null;
  }
}

function getDoctorStatusBadgeClassName(isActive: boolean) {
  return isActive
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
    : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
}

function getDoctorVisibilityBadgeClassName(isPublic: boolean) {
  return isPublic
    ? "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700"
    : "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const filter = normalizeFilter(query.filter);
  const doctors = await prisma.doctor.findMany({
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
      specialty: true,
      bio: true,
      publicOrder: true,
      isPublic: true,
      photoUrl: true,
      isActive: true,
      availabilityBlocks: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
      timeOffs: {
        where: {
          endAt: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          appointments: true,
        },
      },
    },
  });

  const visibleDoctors = doctors.filter((doctor) => {
    switch (filter) {
      case "active":
        return doctor.isActive;
      case "inactive":
        return !doctor.isActive;
      case "public":
        return doctor.isPublic;
      case "hidden":
        return !doctor.isPublic;
      default:
        return true;
    }
  });

  const activeCount = doctors.filter((doctor) => doctor.isActive).length;
  const inactiveCount = doctors.length - activeCount;
  const publicCount = doctors.filter((doctor) => doctor.isPublic).length;
  const hiddenCount = doctors.length - publicCount;
  const editingDoctor = query.edit
    ? doctors.find((doctor) => doctor.id === query.edit) ?? null
    : null;
  const flash = resolveFlashMessage(query.status, query.error);

  return (
    <PanelPage
      eyebrow="Profesionales"
      title="Catálogo público de profesionales"
      description="Gestiona a las personas que atienden reservas en tu negocio. Controla visibilidad, orden público, descripción y disponibilidad sin tocar el historial operativo."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.4fr)]">
        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Resumen del equipo
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
                Solo los profesionales activos y visibles aparecen en el booking
                público.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                El orden público controla el catálogo del booking; primero se usa
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
                  {editingDoctor ? "Editar profesional" : "Crear profesional"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {editingDoctor
                    ? "Actualiza perfil público, foto, visibilidad y datos operativos sin salir del panel."
                    : "Agrega un profesional nuevo y decide si debe publicarse de inmediato en el booking."}
                </p>
              </div>

              {editingDoctor ? (
                <Link
                  href={filter === "all" ? "/app/doctors" : `/app/doctors?filter=${filter}`}
                  className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
                >
                  Cancelar
                </Link>
              ) : null}
            </div>

            <form
              action={editingDoctor ? updateDoctorAction : createDoctorAction}
              className="mt-6 grid gap-4"
            >
              {editingDoctor ? (
                <input type="hidden" name="doctorId" value={editingDoctor.id} />
              ) : null}
              <input type="hidden" name="returnFilter" value={filter} />

              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  name="name"
                  required
                  defaultValue={editingDoctor?.name ?? ""}
                  className={formFieldClassName()}
                  placeholder="Sofia Herrera"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-ink">
                  Rol o especialidad
                  <input
                    name="specialty"
                    defaultValue={editingDoctor?.specialty ?? ""}
                    className={formFieldClassName()}
                    placeholder="Estilista senior"
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Foto pública opcional
                  <input
                    name="photoUrl"
                    type="url"
                    defaultValue={editingDoctor?.photoUrl ?? ""}
                    className={formFieldClassName()}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-ink">
                Descripcion opcional
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={editingDoctor?.bio ?? ""}
                  className={formFieldClassName()}
                  placeholder="Describe enfoque, experiencia o tipo de atencion."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-sm font-semibold text-ink">
                  Orden público
                  <input
                    name="publicOrder"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={editingDoctor?.publicOrder ?? 0}
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Visibilidad
                  <select
                    name="isPublic"
                    defaultValue={editingDoctor?.isPublic === false ? "false" : "true"}
                    className={formFieldClassName()}
                  >
                    <option value="true">Visible en booking</option>
                    <option value="false">Oculto en booking</option>
                  </select>
                </label>

                <label className="text-sm font-semibold text-ink">
                  Estado
                  <select
                    name="isActive"
                    defaultValue={editingDoctor?.isActive === false ? "false" : "true"}
                    className={formFieldClassName()}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                {editingDoctor ? "Guardar cambios" : "Crear profesional"}
              </button>
            </form>
          </article>
        </div>

        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Profesionales del catalogo
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Filtra activos, inactivos, públicos u ocultos y ajusta el booking
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
                    <option value="public">Solo públicos</option>
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
                      href="/app/doctors"
                      className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                    >
                      Limpiar
                    </Link>
                  ) : null}
                </div>
              </form>
            </div>
          </article>

          {visibleDoctors.length ? (
            visibleDoctors.map((doctor) => (
              <article key={doctor.id} className="surface-card p-6 sm:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <ProfessionalAvatar
                      name={doctor.name}
                      photoUrl={doctor.photoUrl}
                      size="lg"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                          {doctor.name}
                        </p>
                        <span className={getDoctorStatusBadgeClassName(doctor.isActive)}>
                          {doctor.isActive ? "Activo" : "Inactivo"}
                        </span>
                        <span
                          className={getDoctorVisibilityBadgeClassName(doctor.isPublic)}
                        >
                        {doctor.isPublic ? "Público" : "Oculto"}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-medium text-muted">
                        {doctor.specialty ?? "Sin rol o especialidad registrada"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {doctor.bio ??
                          "Sin descripción registrada para este profesional."}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={
                      filter === "all"
                        ? `/app/doctors?edit=${doctor.id}`
                        : `/app/doctors?edit=${doctor.id}&filter=${filter}`
                    }
                    className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Editar
                  </Link>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Bloques activos
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {doctor.availabilityBlocks.length}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Ausencias futuras
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {doctor.timeOffs.length}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Orden público
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {doctor.publicOrder}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Reservas asociadas
                    </p>
                    <p className="mt-3 text-lg font-semibold text-ink">
                      {doctor._count.appointments}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/app/doctors/${doctor.id}/availability`}
                    className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                  >
                    Gestionar disponibilidad
                  </Link>

                  <form action={toggleDoctorStatusAction}>
                    <input type="hidden" name="doctorId" value={doctor.id} />
                    <input type="hidden" name="returnFilter" value={filter} />
                    <input
                      type="hidden"
                      name="nextIsActive"
                      value={doctor.isActive ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        doctor.isActive
                          ? "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                          : "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                      }
                    >
                      {doctor.isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>

                  <form action={toggleDoctorPublicVisibilityAction}>
                    <input type="hidden" name="doctorId" value={doctor.id} />
                    <input type="hidden" name="returnFilter" value={filter} />
                    <input
                      type="hidden"
                      name="nextIsPublic"
                      value={doctor.isPublic ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        doctor.isPublic
                          ? "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                          : "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                      }
                    >
                      {doctor.isPublic ? "Ocultar del booking" : "Mostrar en booking"}
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                No hay profesionales para este filtro.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {doctors.length
                  ? "Ajusta el filtro o cambia la visibilidad de un profesional existente."
                  : "Crea el primer profesional para empezar a construir el catálogo público del negocio."}
              </p>
            </article>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
