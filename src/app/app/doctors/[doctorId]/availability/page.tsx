import Link from "next/link";
import { notFound } from "next/navigation";

import { PanelPage } from "@/components/app/panel-page";
import {
  formatDateTimeInTimeZone,
  getDoctorAvailability,
  getWeekdayLabel,
  WEEKDAY_OPTIONS,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";

import {
  createClinicBlockedTimeAction,
  createDoctorAvailabilityAction,
  createDoctorTimeOffAction,
  toggleDoctorAvailabilityAction,
} from "./actions";

type DoctorAvailabilityPageProps = {
  params: Promise<{
    doctorId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "doctor-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese doctor dentro de la clinica actual.",
        };
      case "availability-invalid":
        return {
          tone: "error" as const,
          message: "Revisa dia, hora de inicio y hora de cierre antes de guardar.",
        };
      case "availability-duplicate":
        return {
          tone: "error" as const,
          message: "Ese bloque semanal ya existe para el doctor.",
        };
      case "availability-save":
        return {
          tone: "error" as const,
          message: "No pude guardar el bloque de disponibilidad.",
        };
      case "availability-not-found":
        return {
          tone: "error" as const,
          message: "No encontre el bloque de disponibilidad que intentaste actualizar.",
        };
      case "timeoff-invalid":
        return {
          tone: "error" as const,
          message: "La ausencia necesita una fecha inicial y final validas.",
        };
      case "blocked-invalid":
        return {
          tone: "error" as const,
          message: "El bloqueo general necesita una fecha inicial y final validas.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion.",
        };
    }
  }

  switch (status) {
    case "availability-created":
      return {
        tone: "success" as const,
        message: "Bloque semanal guardado correctamente.",
      };
    case "availability-updated":
      return {
        tone: "success" as const,
        message: "Estado del bloque actualizado.",
      };
    case "timeoff-created":
      return {
        tone: "success" as const,
        message: "Ausencia del doctor registrada.",
      };
    case "blocked-created":
      return {
        tone: "success" as const,
        message: "Bloqueo general del consultorio guardado.",
      };
    default:
      return null;
  }
}

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

export default async function DoctorAvailabilityPage({
  params,
  searchParams,
}: DoctorAvailabilityPageProps) {
  const [{ doctorId }, query, authContext] = await Promise.all([
    params,
    searchParams,
    requireAuthContext(),
  ]);
  const availability = await getDoctorAvailability({
    clinicId: authContext.clinic.id,
    doctorId,
  });

  if (!availability) {
    notFound();
  }

  const flash = resolveFlashMessage(query.status, query.error);
  const weeklyGroups = WEEKDAY_OPTIONS.map((option) => ({
    ...option,
    blocks: availability.doctor.availabilityBlocks.filter(
      (block) => block.dayOfWeek === option.value,
    ),
  }));

  return (
    <PanelPage
      eyebrow="Doctores"
      title={`Disponibilidad de ${availability.doctor.name}`}
      description="Gestiona bloques semanales, ausencias del doctor y bloqueos generales del consultorio. Esta configuracion alimenta la validacion real de citas del panel y del simulador de WhatsApp."
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app/doctors"
            className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            Volver a doctores
          </Link>
          <span className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            Timezone: {availability.timezone}
          </span>
          <span className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted">
            Estado: {availability.doctor.isActive ? "Activo" : "Inactivo"}
          </span>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
          <div className="grid gap-6">
            <article className="surface-card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Disponibilidad semanal
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Cada bloque define cuando el doctor puede recibir citas nuevas.
                    Solo los bloques activos se toman en cuenta para calcular slots.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
                  <p className="font-semibold text-ink">
                    {availability.doctor.specialty ?? "Sin especialidad"}
                  </p>
                  {availability.doctor.bio ? (
                    <p className="mt-2 max-w-sm leading-6">{availability.doctor.bio}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {weeklyGroups.map((group) => (
                  <div
                    key={group.value}
                    className="rounded-[24px] border border-line/80 bg-white px-5 py-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-ink">
                          {getWeekdayLabel(group.value)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {group.blocks.length
                            ? `${group.blocks.length} bloque(s) configurados`
                            : "Sin bloques configurados"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {group.blocks.length ? (
                        group.blocks.map((block) => (
                          <div
                            key={block.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line/80 bg-surface-soft px-4 py-4"
                          >
                            <div>
                              <p className="font-semibold text-ink">
                                {block.startTime} - {block.endTime}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {block.isActive ? "Disponible para reservar" : "Bloque inactivo"}
                              </p>
                            </div>

                            <form action={toggleDoctorAvailabilityAction}>
                              <input type="hidden" name="doctorId" value={doctorId} />
                              <input type="hidden" name="availabilityId" value={block.id} />
                              <input
                                type="hidden"
                                name="nextIsActive"
                                value={block.isActive ? "false" : "true"}
                              />
                              <button
                                type="submit"
                                className={
                                  block.isActive
                                    ? "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                                    : "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                                }
                              >
                                {block.isActive ? "Desactivar" : "Activar"}
                              </button>
                            </form>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                          Todavia no hay bloques para este dia.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Ausencias del doctor
              </p>
              <div className="mt-5 grid gap-3">
                {availability.doctor.timeOffs.length ? (
                  availability.doctor.timeOffs.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-line/80 bg-white px-4 py-4"
                    >
                      <p className="font-semibold text-ink">
                        {formatDateTimeInTimeZone(item.startAt, availability.timezone)} -{" "}
                        {formatDateTimeInTimeZone(item.endAt, availability.timezone)}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {item.reason ?? "Sin motivo especificado"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                    No hay ausencias registradas para este doctor.
                  </div>
                )}
              </div>
            </article>

            <article className="surface-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Bloqueos generales del consultorio
              </p>
              <div className="mt-5 grid gap-3">
                {availability.clinicBlockedTimes.length ? (
                  availability.clinicBlockedTimes.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-line/80 bg-white px-4 py-4"
                    >
                      <p className="font-semibold text-ink">
                        {formatDateTimeInTimeZone(item.startAt, availability.timezone)} -{" "}
                        {formatDateTimeInTimeZone(item.endAt, availability.timezone)}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {item.reason ?? "Sin motivo especificado"}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                    No hay bloqueos generales activos para mostrar.
                  </div>
                )}
              </div>
            </article>
          </div>

          <div className="grid gap-6">
            <article className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Agregar bloque semanal
              </p>
              <form action={createDoctorAvailabilityAction} className="mt-5 grid gap-4">
                <input type="hidden" name="doctorId" value={doctorId} />

                <label className="text-sm font-semibold text-ink">
                  Dia de la semana
                  <select name="dayOfWeek" className={formFieldClassName()} defaultValue="MONDAY">
                    {WEEKDAY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-ink">
                    Inicio
                    <input
                      name="startTime"
                      type="time"
                      required
                      defaultValue="09:00"
                      className={formFieldClassName()}
                    />
                  </label>

                  <label className="text-sm font-semibold text-ink">
                    Fin
                    <input
                      name="endTime"
                      type="time"
                      required
                      defaultValue="14:00"
                      className={formFieldClassName()}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                >
                  Guardar bloque
                </button>
              </form>
            </article>

            <article className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Registrar ausencia del doctor
              </p>
              <form action={createDoctorTimeOffAction} className="mt-5 grid gap-4">
                <input type="hidden" name="doctorId" value={doctorId} />

                <label className="text-sm font-semibold text-ink">
                  Inicio
                  <input
                    name="startAt"
                    type="datetime-local"
                    required
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Fin
                  <input
                    name="endAt"
                    type="datetime-local"
                    required
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Motivo opcional
                  <textarea
                    name="reason"
                    rows={3}
                    className={formFieldClassName()}
                    placeholder="Congreso, vacaciones, guardia externa..."
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                >
                  Guardar ausencia
                </button>
              </form>
            </article>

            <article className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Bloqueo general del consultorio
              </p>
              <form action={createClinicBlockedTimeAction} className="mt-5 grid gap-4">
                <input type="hidden" name="doctorId" value={doctorId} />

                <label className="text-sm font-semibold text-ink">
                  Inicio
                  <input
                    name="startAt"
                    type="datetime-local"
                    required
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Fin
                  <input
                    name="endAt"
                    type="datetime-local"
                    required
                    className={formFieldClassName()}
                  />
                </label>

                <label className="text-sm font-semibold text-ink">
                  Motivo opcional
                  <textarea
                    name="reason"
                    rows={3}
                    className={formFieldClassName()}
                    placeholder="Junta, mantenimiento, cierre administrativo..."
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                >
                  Guardar bloqueo general
                </button>
              </form>
            </article>
          </div>
        </div>
      </div>
    </PanelPage>
  );
}
