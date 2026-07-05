import Link from "next/link";
import { notFound } from "next/navigation";
import { Weekday } from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import { ProfessionalAvatar } from "@/components/doctors/professional-avatar";
import {
  buildClinicDateMarker,
  formatDateTimeInTimeZone,
  getAvailableSlots,
  getDoctorAvailability,
  getWeekdayLabel,
  parseIsoDateInput,
  WEEKDAY_OPTIONS,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { getBookingDateOptions } from "@/lib/booking/public";
import { prisma } from "@/lib/prisma";

import {
  cancelDoctorTimeOffAction,
  clearDoctorAvailabilityDayAction,
  copyDoctorAvailabilityPatternAction,
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
    serviceId?: string;
  }>;
};

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "doctor-not-found":
        return {
          tone: "error" as const,
          message: "No encontre ese profesional dentro del negocio actual.",
        };
      case "availability-invalid":
        return {
          tone: "error" as const,
          message: "Revisa dia, hora de inicio y hora de cierre antes de guardar.",
        };
      case "availability-too-short":
        return {
          tone: "error" as const,
          message: "Cada bloque debe durar al menos 15 minutos.",
        };
      case "availability-duplicate":
        return {
          tone: "error" as const,
          message: "Ese bloque semanal ya existe para este profesional.",
        };
      case "availability-overlap":
        return {
          tone: "error" as const,
          message: "Ese horario se encima con otro bloque activo del mismo dia.",
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
      case "availability-copy-invalid":
        return {
          tone: "error" as const,
          message: "Revisa el dia origen y el dia destino antes de copiar el horario.",
        };
      case "availability-copy-source-empty":
        return {
          tone: "error" as const,
          message: "El dia origen no tiene bloques activos para copiar.",
        };
      case "timeoff-invalid":
        return {
          tone: "error" as const,
          message: "La ausencia necesita una fecha inicial y final validas.",
        };
      case "timeoff-not-found":
        return {
          tone: "error" as const,
          message: "No encontre la ausencia que intentaste cancelar.",
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
    case "availability-reactivated":
      return {
        tone: "success" as const,
        message: "Bloque reactivado correctamente.",
      };
    case "availability-deactivated":
      return {
        tone: "success" as const,
        message: "Bloque desactivado correctamente.",
      };
    case "availability-copied":
      return {
        tone: "success" as const,
        message: "Horario copiado correctamente.",
      };
    case "availability-cleared":
      return {
        tone: "success" as const,
        message: "La disponibilidad activa de ese dia quedo limpia.",
      };
    case "timeoff-created":
      return {
        tone: "success" as const,
        message: "Ausencia del profesional registrada.",
      };
    case "timeoff-cancelled":
      return {
        tone: "success" as const,
        message: "Ausencia cancelada correctamente.",
      };
    case "blocked-created":
      return {
        tone: "success" as const,
        message: "Bloqueo general del negocio guardado.",
      };
    default:
      return null;
  }
}

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function getBlockStatusBadgeClassName(isActive: boolean) {
  return isActive
    ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700"
    : "rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600";
}

function getWeekdayTargetOptions(sourceDay: Weekday) {
  return WEEKDAY_OPTIONS.filter((option) => option.value !== sourceDay);
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

  const services = await prisma.service.findMany({
    where: {
      clinicId: authContext.clinic.id,
      isActive: true,
    },
    orderBy: [{ isPublic: "desc" }, { publicOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      isPublic: true,
    },
  });

  const selectedPreviewService =
    services.find((service) => service.id === query.serviceId?.trim()) ?? services[0] ?? null;

  const previewDateOptions = getBookingDateOptions(availability.timezone, 7);
  const previewDays = selectedPreviewService
    ? await Promise.all(
        previewDateOptions.map(async (option) => {
          const dateParts = parseIsoDateInput(option.value);

          if (!dateParts) {
            return {
              ...option,
              slots: [],
            };
          }

          const result = await getAvailableSlots({
            clinicId: authContext.clinic.id,
            doctorId,
            serviceId: selectedPreviewService.id,
            date: buildClinicDateMarker(dateParts, availability.timezone),
          });

          return {
            ...option,
            slots: result.slots,
          };
        }),
      )
    : [];

  const previewSlots = previewDays
    .flatMap((day) =>
      day.slots.map((slot) => ({
        label: day.fullLabel,
        startAt: slot.startAt,
        endAt: slot.endAt,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    )
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())
    .slice(0, 12);
  const previewDaysWithSlots = previewDays.filter((day) => day.slots.length).length;

  const flash = resolveFlashMessage(query.status, query.error);
  const weeklyGroups = WEEKDAY_OPTIONS.map((option) => {
    const blocks = availability.doctor.availabilityBlocks
      .filter((block) => block.dayOfWeek === option.value)
      .sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        return left.startTime.localeCompare(right.startTime);
      });

    return {
      ...option,
      blocks,
      activeBlocks: blocks.filter((block) => block.isActive),
      inactiveBlocks: blocks.filter((block) => !block.isActive),
    };
  });

  return (
    <PanelPage
      eyebrow="Profesionales"
      title={`Disponibilidad de ${availability.doctor.name}`}
      description="Configura bloques semanales, ausencias y bloqueos del negocio con una vista mas clara. Esta configuracion alimenta la disponibilidad real del booking, del panel y del simulador local."
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/app/doctors"
            className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            Volver a profesionales
          </Link>
          <span className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
            Timezone: {availability.timezone}
          </span>
          <span className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted">
            Estado: {availability.doctor.isActive ? "Activo" : "Inactivo"}
          </span>
          <span className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted">
            Booking: {availability.doctor.isPublic ? "Visible" : "Oculto"}
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

        <article className="surface-card p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <ProfessionalAvatar
                name={availability.doctor.name}
                photoUrl={availability.doctor.photoUrl}
                size="lg"
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Perfil operativo
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                  {availability.doctor.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-muted">
                  {availability.doctor.specialty ?? "Sin rol o especialidad"}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                  {availability.doctor.bio ??
                    "Usa esta pantalla para dejar lista la agenda semanal, copiar patrones y revisar proximos slots reales."}
                </p>
              </div>
            </div>

            <form action={copyDoctorAvailabilityPatternAction}>
              <input type="hidden" name="doctorId" value={doctorId} />
              <input type="hidden" name="sourceDayOfWeek" value="MONDAY" />
              <input
                type="hidden"
                name="targetDays"
                value="TUESDAY,WEDNESDAY,THURSDAY,FRIDAY"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                Copiar horario de lunes a viernes
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Bloques activos
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                {
                  availability.doctor.availabilityBlocks.filter((block) => block.isActive)
                    .length
                }
              </p>
            </div>

            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Ausencias proximas
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                {availability.doctor.timeOffs.length}
              </p>
            </div>

            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Slots con servicio actual
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                {previewSlots.length}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-muted">
            El boton de arriba usa los bloques activos del lunes como plantilla y
            reemplaza la disponibilidad activa de martes a viernes. Tambien puedes
            copiar un dia individual a otro desde cada tarjeta semanal.
          </p>
        </article>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
          <div className="grid gap-6">
            <article className="surface-card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Disponibilidad semanal
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Configura horarios por dia, evita solapes y deja claro cuando un
                    dia no tiene horario activo.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
                  Se muestran bloques activos e inactivos. Puedes limpiar un dia y
                  luego reactivar un bloque puntual si lo necesitas.
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {weeklyGroups.map((group) => (
                  <div
                    key={group.value}
                    className="rounded-[24px] border border-line/80 bg-white px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-base font-semibold text-ink">
                          {getWeekdayLabel(group.value)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {group.activeBlocks.length
                            ? `${group.activeBlocks.length} bloque(s) activos`
                            : "Sin horario activo"}
                          {group.inactiveBlocks.length
                            ? ` · ${group.inactiveBlocks.length} inactivo(s)`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <form
                          action={copyDoctorAvailabilityPatternAction}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="doctorId" value={doctorId} />
                          <input
                            type="hidden"
                            name="sourceDayOfWeek"
                            value={group.value}
                          />
                          <select
                            name="targetDays"
                            defaultValue={getWeekdayTargetOptions(group.value)[0]?.value}
                            className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                          >
                            {getWeekdayTargetOptions(group.value).map((option) => (
                              <option key={option.value} value={option.value}>
                                Copiar a {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                          >
                            Copiar
                          </button>
                        </form>

                        <form action={clearDoctorAvailabilityDayAction}>
                          <input type="hidden" name="doctorId" value={doctorId} />
                          <input type="hidden" name="dayOfWeek" value={group.value} />
                          <button
                            type="submit"
                            className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                          >
                            Limpiar dia
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {group.blocks.length ? (
                        group.blocks.map((block) => (
                          <div
                            key={block.id}
                            className="flex flex-col gap-3 rounded-[20px] border border-line/80 bg-surface-soft px-4 py-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-semibold text-ink">
                                  {block.startTime} - {block.endTime}
                                </p>
                                <span className={getBlockStatusBadgeClassName(block.isActive)}>
                                  {block.isActive ? "Activo" : "Inactivo"}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-muted">
                                {block.isActive
                                  ? "Disponible para recibir reservas."
                                  : "Bloque guardado pero fuera del calculo de slots."}
                              </p>
                            </div>

                            <form action={toggleDoctorAvailabilityAction}>
                              <input type="hidden" name="doctorId" value={doctorId} />
                              <input
                                type="hidden"
                                name="availabilityId"
                                value={block.id}
                              />
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
                                {block.isActive ? "Desactivar bloque" : "Reactivar bloque"}
                              </button>
                            </form>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                          Este dia todavia no tiene bloques configurados.
                        </div>
                      )}
                    </div>

                    <form
                      action={createDoctorAvailabilityAction}
                      className="mt-5 grid gap-3 rounded-[20px] border border-dashed border-line/90 bg-surface-soft px-4 py-4"
                    >
                      <input type="hidden" name="doctorId" value={doctorId} />
                      <input type="hidden" name="dayOfWeek" value={group.value} />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">
                          Agregar bloque para {group.label.toLowerCase()}
                        </p>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                          Formato HH:mm
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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

                        <div className="self-end">
                          <button
                            type="submit"
                            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                          >
                            Agregar bloque
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            </article>

            <article className="surface-card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Ausencias del profesional
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Registra vacaciones, congresos o cualquier ausencia puntual que
                    deba bloquear los slots reales.
                  </p>
                </div>

                <form action={createDoctorTimeOffAction} className="grid w-full gap-4 lg:max-w-md">
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
                      placeholder="Congreso, vacaciones, capacitacion..."
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Guardar ausencia
                  </button>
                </form>
              </div>

              <div className="mt-6 grid gap-3">
                {availability.doctor.timeOffs.length ? (
                  availability.doctor.timeOffs.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-[22px] border border-line/80 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-ink">
                          {formatDateTimeInTimeZone(item.startAt, availability.timezone)} -{" "}
                          {formatDateTimeInTimeZone(item.endAt, availability.timezone)}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                          {item.reason ?? "Sin motivo especificado"}
                        </p>
                      </div>

                      <form action={cancelDoctorTimeOffAction}>
                        <input type="hidden" name="doctorId" value={doctorId} />
                        <input type="hidden" name="timeOffId" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700"
                        >
                          Cancelar ausencia
                        </button>
                      </form>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                    No hay ausencias registradas para este profesional.
                  </div>
                )}
              </div>
            </article>

            <article className="surface-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Bloqueos generales del negocio
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Estos bloqueos afectan la disponibilidad real de todos los
                profesionales del negocio durante ese rango.
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
            <article className="surface-card p-6 sm:p-7">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Proximos horarios disponibles
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Vista previa real de los proximos slots del profesional en los
                    siguientes 7 dias.
                  </p>
                </div>

                {services.length ? (
                  <form method="get" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <label className="text-sm font-semibold text-ink">
                      Servicio de referencia
                      <select
                        name="serviceId"
                        defaultValue={selectedPreviewService?.id}
                        className={formFieldClassName()}
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                            {service.isPublic ? "" : " (interno)"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="self-end">
                      <button
                        type="submit"
                        className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                      >
                        Ver slots
                      </button>
                    </div>
                  </form>
                ) : null}

                {selectedPreviewService ? (
                  <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                    <p className="text-sm font-semibold text-ink">
                      Servicio: {selectedPreviewService.name}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Duracion base: {selectedPreviewService.durationMinutes} min · Dias
                      con horarios esta semana: {previewDaysWithSlots}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                    Activa al menos un servicio para mostrar la vista previa de slots.
                  </div>
                )}

                {selectedPreviewService ? (
                  previewSlots.length ? (
                    <div className="grid gap-3">
                      {previewSlots.map((slot) => (
                        <div
                          key={slot.startAt.toISOString()}
                          className="rounded-[22px] border border-line/80 bg-white px-4 py-4"
                        >
                          <p className="font-semibold text-ink">
                            {formatDateTimeInTimeZone(slot.startAt, availability.timezone)}
                          </p>
                          <p className="mt-2 text-sm text-muted">
                            {slot.label} · {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-line bg-surface-soft px-4 py-4 text-sm text-muted">
                      No hay horarios disponibles esta semana para este servicio.
                    </div>
                  )
                ) : null}
              </div>
            </article>

            <article className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Bloqueo general del negocio
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
