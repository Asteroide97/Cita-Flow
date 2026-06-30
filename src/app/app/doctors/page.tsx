import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  createDoctorAction,
  toggleDoctorStatusAction,
  updateDoctorAction,
} from "./actions";

type DoctorsPageProps = {
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
      case "doctor-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese doctor dentro de la clinica actual.",
        };
      case "doctor-name-required":
        return {
          tone: "error" as const,
          message: "El nombre del doctor es obligatorio.",
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
        message: "Doctor creado correctamente.",
      };
    case "doctor-updated":
      return {
        tone: "success" as const,
        message: "Doctor actualizado correctamente.",
      };
    case "doctor-activated":
      return {
        tone: "success" as const,
        message: "Doctor activado nuevamente.",
      };
    case "doctor-deactivated":
      return {
        tone: "success" as const,
        message: "Doctor desactivado sin borrar historial de citas.",
      };
    default:
      return null;
  }
}

export default async function DoctorsPage({ searchParams }: DoctorsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const doctors = await prisma.doctor.findMany({
    where: {
      clinicId: authContext.clinic.id,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
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

  const activeCount = doctors.filter((doctor) => doctor.isActive).length;
  const inactiveCount = doctors.length - activeCount;
  const editingDoctor = query.edit
    ? doctors.find((doctor) => doctor.id === query.edit) ?? null
    : null;
  const flash = resolveFlashMessage(query.status, query.error);

  return (
    <PanelPage
      eyebrow="Doctores"
      title="Equipo medico y disponibilidad"
      description="Administra el equipo medico del consultorio desde el tenant actual. Desde aqui puedes crear, editar, activar, desactivar y entrar a la disponibilidad real de cada doctor."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.35fr)]">
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
            </div>

            <div className="mt-5 grid gap-3 text-sm text-muted">
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                Los doctores con citas no se eliminan fisicamente. Si hace falta retirarlos,
                se desactivan.
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                La disponibilidad operativa se sigue gestionando por doctor desde su ficha.
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
                  {editingDoctor ? "Editar doctor" : "Crear doctor"}
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {editingDoctor
                    ? "Actualiza nombre, especialidad, bio y estado sin salir del panel."
                    : "Agrega un nuevo doctor para empezar a manejar agenda y disponibilidad real."}
                </p>
              </div>

              {editingDoctor ? (
                <Link
                  href="/app/doctors"
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

              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  name="name"
                  required
                  defaultValue={editingDoctor?.name ?? ""}
                  className={formFieldClassName()}
                  placeholder="Dra. Sofia Herrera"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Especialidad opcional
                <input
                  name="specialty"
                  defaultValue={editingDoctor?.specialty ?? ""}
                  className={formFieldClassName()}
                  placeholder="Medicina general"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Bio opcional
                <textarea
                  name="bio"
                  rows={4}
                  defaultValue={editingDoctor?.bio ?? ""}
                  className={formFieldClassName()}
                  placeholder="Describe enfoque, experiencia o tipo de consulta."
                />
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

              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                {editingDoctor ? "Guardar cambios" : "Crear doctor"}
              </button>
            </form>
          </article>
        </div>

        <div className="grid gap-6">
          {doctors.length ? (
            doctors.map((doctor) => (
              <article key={doctor.id} className="surface-card p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                      {doctor.name}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {doctor.specialty ?? "Sin especialidad registrada"}
                    </p>
                  </div>

                  <span
                    className={
                      doctor.isActive
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"
                        : "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                    }
                  >
                    {doctor.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {doctor.bio ? (
                  <p className="mt-4 text-sm leading-7 text-muted">{doctor.bio}</p>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-muted">
                    Sin bio registrada para este doctor.
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Bloques activos
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                      {doctor.availabilityBlocks.length}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Ausencias futuras
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                      {doctor.timeOffs.length}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Citas asociadas
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                      {doctor._count.appointments}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/app/doctors?edit=${doctor.id}`}
                    className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Editar
                  </Link>

                  <Link
                    href={`/app/doctors/${doctor.id}/availability`}
                    className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                  >
                    Gestionar disponibilidad
                  </Link>

                  <form action={toggleDoctorStatusAction}>
                    <input type="hidden" name="doctorId" value={doctor.id} />
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
                </div>
              </article>
            ))
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                Todavia no hay doctores cargados para esta clinica.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Crea el primer doctor desde el formulario para empezar a operar agenda y
                disponibilidad.
              </p>
            </article>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
