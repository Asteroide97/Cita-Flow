import { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import {
  buildClinicDateMarker,
  buildClinicDateTime,
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import {
  createAdminAppointmentAction,
  updateAppointmentStatusAction,
} from "./actions";

type AppointmentsPageProps = {
  searchParams: Promise<{
    filterDate?: string;
    filterDoctorId?: string;
    filterStatus?: string;
    filterServiceId?: string;
    formDoctorId?: string;
    formServiceId?: string;
    formDate?: string;
    status?: string;
    error?: string;
  }>;
};

const STATUS_OPTIONS = Object.values(AppointmentStatus);

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
  COMPLETED: "Completada",
  NO_SHOW: "No-show",
};

const SOURCE_LABELS: Record<AppointmentSource, string> = {
  ADMIN: "Panel",
  PUBLIC_BOOKING: "Booking publico",
  WHATSAPP: "WhatsApp",
  IMPORT: "Importacion",
};

function formFieldClassName() {
  return "mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
}

function formatMoney(cents: number | null, currency: string) {
  if (cents === null) {
    return "Sin precio";
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatPhone(phoneE164: string) {
  return phoneE164.startsWith("+52") && phoneE164.length >= 13
    ? `${phoneE164.slice(0, 3)} ${phoneE164.slice(3, 6)} ${phoneE164.slice(6, 9)} ${phoneE164.slice(9)}`
    : phoneE164;
}

function getStatusBadgeClassName(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700";
    case AppointmentStatus.PENDING:
      return "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700";
    case AppointmentStatus.CANCELLED:
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700";
    case AppointmentStatus.COMPLETED:
      return "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700";
    case AppointmentStatus.NO_SHOW:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700";
    case AppointmentStatus.RESCHEDULED:
    default:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600";
  }
}

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "doctor-required":
        return {
          tone: "error" as const,
          message: "Selecciona un doctor antes de buscar o crear la cita.",
        };
      case "service-required":
        return {
          tone: "error" as const,
          message: "Selecciona un servicio antes de continuar.",
        };
      case "date-required":
        return {
          tone: "error" as const,
          message: "Selecciona una fecha valida para cargar horarios.",
        };
      case "slot-required":
        return {
          tone: "error" as const,
          message: "Selecciona un horario disponible para crear la cita.",
        };
      case "slot-unavailable":
        return {
          tone: "error" as const,
          message: "Ese horario ya no esta disponible. Revisa las opciones actualizadas.",
        };
      case "doctor-inactive":
        return {
          tone: "error" as const,
          message: "El doctor seleccionado esta inactivo o no pertenece a esta clinica.",
        };
      case "service-inactive":
        return {
          tone: "error" as const,
          message: "El servicio seleccionado esta inactivo o no pertenece a esta clinica.",
        };
      case "patient-not-found":
        return {
          tone: "error" as const,
          message: "El paciente seleccionado no pertenece a la clinica actual.",
        };
      case "patient-name-required":
        return {
          tone: "error" as const,
          message: "Si no eliges un paciente existente, el nombre es obligatorio.",
        };
      case "patient-phone-required":
        return {
          tone: "error" as const,
          message: "Si no eliges un paciente existente, el telefono es obligatorio.",
        };
      case "patient-phone-invalid":
        return {
          tone: "error" as const,
          message: "El telefono no tiene un formato valido.",
        };
      case "patient-email-invalid":
        return {
          tone: "error" as const,
          message: "El email del paciente no es valido.",
        };
      case "appointment-not-found":
        return {
          tone: "error" as const,
          message: "No encontre esa cita dentro de la clinica actual.",
        };
      case "appointment-action-invalid":
        return {
          tone: "error" as const,
          message: "La accion solicitada no esta permitida para el estado actual de la cita.",
        };
      case "appointment-save":
        return {
          tone: "error" as const,
          message: "No pude guardar la cita. Intenta de nuevo.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion solicitada.",
        };
    }
  }

  switch (status) {
    case "appointment-created":
      return {
        tone: "success" as const,
        message: "Cita creada correctamente desde el panel.",
      };
    case "appointment-confirmed":
      return {
        tone: "success" as const,
        message: "La cita quedo confirmada nuevamente.",
      };
    case "appointment-cancelled":
      return {
        tone: "success" as const,
        message: "La cita fue cancelada sin borrar historial.",
      };
    case "appointment-completed":
      return {
        tone: "success" as const,
        message: "La cita fue marcada como completada.",
      };
    case "appointment-no-show":
      return {
        tone: "success" as const,
        message: "La cita fue marcada como no-show.",
      };
    default:
      return null;
  }
}

function shiftDatePartsByOneDay(parts: { year: number; month: number; day: number }) {
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));

  return {
    year: nextDay.getUTCFullYear(),
    month: nextDay.getUTCMonth() + 1,
    day: nextDay.getUTCDate(),
  };
}

export default async function AppointmentsPage({
  searchParams,
}: AppointmentsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);

  const [doctors, services, patients] = await Promise.all([
    prisma.doctor.findMany({
      where: {
        clinicId: authContext.clinic.id,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        specialty: true,
        isActive: true,
      },
    }),
    prisma.service.findMany({
      where: {
        clinicId: authContext.clinic.id,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        priceCents: true,
        depositRequired: true,
        depositCents: true,
        isActive: true,
      },
    }),
    prisma.patient.findMany({
      where: {
        clinicId: authContext.clinic.id,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        phoneE164: true,
        email: true,
      },
    }),
  ]);

  const activeDoctors = doctors.filter((doctor) => doctor.isActive);
  const activeServices = services.filter((service) => service.isActive);
  const selectedFormDoctorId = query.formDoctorId?.trim() ?? "";
  const selectedFormServiceId = query.formServiceId?.trim() ?? "";
  const selectedFormDate = query.formDate?.trim() ?? "";
  const selectedFormDateParts = selectedFormDate
    ? parseIsoDateInput(selectedFormDate)
    : null;

  const availableSlotResult =
    selectedFormDoctorId && selectedFormServiceId && selectedFormDateParts
      ? await getAvailableSlots({
          clinicId: authContext.clinic.id,
          doctorId: selectedFormDoctorId,
          serviceId: selectedFormServiceId,
          date: buildClinicDateMarker(
            selectedFormDateParts,
            authContext.clinic.timezone,
          ),
        })
      : null;

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedFormDoctorId) ?? null;
  const selectedService =
    services.find((service) => service.id === selectedFormServiceId) ?? null;

  const appointmentWhere: Prisma.AppointmentWhereInput = {
    clinicId: authContext.clinic.id,
  };

  if (query.filterDoctorId?.trim()) {
    appointmentWhere.doctorId = query.filterDoctorId.trim();
  }

  if (query.filterServiceId?.trim()) {
    appointmentWhere.serviceId = query.filterServiceId.trim();
  }

  if (
    query.filterStatus &&
    STATUS_OPTIONS.includes(query.filterStatus as AppointmentStatus)
  ) {
    appointmentWhere.status = query.filterStatus as AppointmentStatus;
  }

  if (query.filterDate?.trim()) {
    const filterDateParts = parseIsoDateInput(query.filterDate.trim());

    if (filterDateParts) {
      appointmentWhere.startAt = {
        gte: buildClinicDateTime(
          filterDateParts,
          "00:00",
          authContext.clinic.timezone,
        ),
        lt: buildClinicDateTime(
          shiftDatePartsByOneDay(filterDateParts),
          "00:00",
          authContext.clinic.timezone,
        ),
      };
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: appointmentWhere,
    orderBy: [{ startAt: "asc" }],
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
          depositRequired: true,
          depositCents: true,
        },
      },
    },
  });

  const flash = resolveFlashMessage(query.status, query.error);
  const todayMarker = buildClinicDateMarker(
    {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    },
    authContext.clinic.timezone,
  );
  const appointmentsToday = appointments.filter(
    (appointment) =>
      formatDateInTimeZone(appointment.startAt, authContext.clinic.timezone) ===
      formatDateInTimeZone(todayMarker, authContext.clinic.timezone),
  ).length;
  const pendingCount = appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.PENDING,
  ).length;
  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CONFIRMED,
  ).length;

  return (
    <PanelPage
      eyebrow="Citas"
      title="Gestion operativa de citas"
      description="Crea citas manuales desde el panel, filtra la agenda del clinic actual y ejecuta acciones seguras sobre cada cita usando la disponibilidad real del doctor."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.96fr)_minmax(0,1.44fr)]">
        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Resumen rapido
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Filtradas
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {appointments.length}
                </p>
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Hoy
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {appointmentsToday}
                </p>
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Confirmadas
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {confirmedCount}
                </p>
              </div>
              <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Pendientes
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
                  {pendingCount}
                </p>
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Crear cita manual
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              La cita del panel se crea como <strong>CONFIRMED</strong> con origen{" "}
              <strong>ADMIN</strong>. Solo puedes reservar horarios reales disponibles.
            </p>

            {activeDoctors.length && activeServices.length ? (
              <>
                <form action="/app/appointments" className="mt-6 grid gap-4">
                  <label className="text-sm font-semibold text-ink">
                    Doctor
                    <select
                      name="formDoctorId"
                      defaultValue={selectedFormDoctorId}
                      className={formFieldClassName()}
                    >
                      <option value="">Selecciona un doctor</option>
                      {activeDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                          {doctor.specialty ? ` - ${doctor.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-ink">
                    Servicio
                    <select
                      name="formServiceId"
                      defaultValue={selectedFormServiceId}
                      className={formFieldClassName()}
                    >
                      <option value="">Selecciona un servicio</option>
                      {activeServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.durationMinutes} min
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-ink">
                    Fecha
                    <input
                      name="formDate"
                      type="date"
                      defaultValue={selectedFormDate}
                      className={formFieldClassName()}
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Ver horarios disponibles
                  </button>
                </form>

                {selectedDoctor && selectedService && selectedFormDate ? (
                  <div className="mt-6 rounded-[24px] border border-line/80 bg-surface-soft px-4 py-4 text-sm text-muted">
                    <p className="font-semibold text-ink">
                      {selectedDoctor.name} · {selectedService.name}
                    </p>
                    <p className="mt-2">
                      Fecha seleccionada:{" "}
                      {selectedFormDateParts
                        ? formatDateInTimeZone(
                            buildClinicDateMarker(
                              selectedFormDateParts,
                              authContext.clinic.timezone,
                            ),
                            authContext.clinic.timezone,
                          )
                        : selectedFormDate}
                    </p>
                  </div>
                ) : null}

                {availableSlotResult ? (
                  availableSlotResult.slots.length ? (
                    <form action={createAdminAppointmentAction} className="mt-6 grid gap-4">
                      <input type="hidden" name="doctorId" value={selectedFormDoctorId} />
                      <input type="hidden" name="serviceId" value={selectedFormServiceId} />
                      <input type="hidden" name="date" value={selectedFormDate} />
                      <input
                        type="hidden"
                        name="returnDoctorId"
                        value={selectedFormDoctorId}
                      />
                      <input
                        type="hidden"
                        name="returnServiceId"
                        value={selectedFormServiceId}
                      />
                      <input type="hidden" name="returnDate" value={selectedFormDate} />

                      <label className="text-sm font-semibold text-ink">
                        Horario disponible
                        <select
                          name="slotTime"
                          required
                          className={formFieldClassName()}
                        >
                          <option value="">Selecciona un horario</option>
                          {availableSlotResult.slots.map((slot) => (
                            <option key={slot.startTime} value={slot.startTime}>
                              {slot.startTime} - {slot.endTime}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-ink">
                        Paciente existente opcional
                        <select name="existingPatientId" className={formFieldClassName()}>
                          <option value="">Crear o detectar paciente por telefono</option>
                          {patients.map((patient) => (
                            <option key={patient.id} value={patient.id}>
                              {patient.name} - {formatPhone(patient.phoneE164)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4 text-sm text-muted">
                        Si no eliges un paciente existente, CitaFlow intentara reutilizar uno
                        del mismo clinic si encuentra el mismo telefono.
                      </div>

                      <label className="text-sm font-semibold text-ink">
                        Nombre del paciente
                        <input
                          name="patientName"
                          className={formFieldClassName()}
                          placeholder="Ana Lopez"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold text-ink">
                          Telefono
                          <input
                            name="patientPhone"
                            className={formFieldClassName()}
                            placeholder="+525511223344"
                          />
                        </label>

                        <label className="text-sm font-semibold text-ink">
                          Email opcional
                          <input
                            name="patientEmail"
                            type="email"
                            className={formFieldClassName()}
                            placeholder="ana@example.com"
                          />
                        </label>
                      </div>

                      <label className="text-sm font-semibold text-ink">
                        Notas opcionales
                        <textarea
                          name="notes"
                          rows={3}
                          className={formFieldClassName()}
                          placeholder="Motivo de consulta, comentarios internos o contexto adicional."
                        />
                      </label>

                      <button
                        type="submit"
                        className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                      >
                        Crear cita confirmada
                      </button>
                    </form>
                  ) : (
                    <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
                      No hay horarios disponibles para esta combinacion. Prueba con otra
                      fecha, doctor o servicio.
                    </div>
                  )
                ) : null}
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-line bg-white px-4 py-4 text-sm text-muted">
                Necesitas al menos un doctor activo y un servicio activo para crear citas
                desde el panel.
              </div>
            )}
          </article>
        </div>

        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Filtros
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Refina la lista por fecha, doctor, estado o servicio dentro del tenant
                  actual.
                </p>
              </div>
            </div>

            <form action="/app/appointments" className="mt-6 grid gap-4 lg:grid-cols-4">
              <label className="text-sm font-semibold text-ink">
                Fecha
                <input
                  name="filterDate"
                  type="date"
                  defaultValue={query.filterDate ?? ""}
                  className={formFieldClassName()}
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Doctor
                <select
                  name="filterDoctorId"
                  defaultValue={query.filterDoctorId ?? ""}
                  className={formFieldClassName()}
                >
                  <option value="">Todos</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-ink">
                Estado
                <select
                  name="filterStatus"
                  defaultValue={query.filterStatus ?? ""}
                  className={formFieldClassName()}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-ink">
                Servicio
                <select
                  name="filterServiceId"
                  defaultValue={query.filterServiceId ?? ""}
                  className={formFieldClassName()}
                >
                  <option value="">Todos</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3 lg:col-span-4">
                <button
                  type="submit"
                  className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
                >
                  Aplicar filtros
                </button>
                <a
                  href="/app/appointments"
                  className="rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                >
                  Limpiar
                </a>
              </div>
            </form>
          </article>

          {appointments.length ? (
            appointments.map((appointment) => {
              const canConfirm = appointment.status === AppointmentStatus.PENDING;
              const canCancel =
                appointment.status === AppointmentStatus.PENDING ||
                appointment.status === AppointmentStatus.CONFIRMED;
              const canComplete =
                appointment.status === AppointmentStatus.PENDING ||
                appointment.status === AppointmentStatus.CONFIRMED;
              const canNoShow =
                appointment.status === AppointmentStatus.PENDING ||
                appointment.status === AppointmentStatus.CONFIRMED;

              return (
                <article key={appointment.id} className="surface-card p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold tracking-[-0.05em] text-ink">
                        {appointment.patient.name}
                      </p>
                      <p className="mt-2 text-sm text-muted">
                        {formatPhone(appointment.patient.phoneE164)}
                        {appointment.patient.email
                          ? ` · ${appointment.patient.email}`
                          : ""}
                      </p>
                    </div>

                    <span className={getStatusBadgeClassName(appointment.status)}>
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        Doctor
                      </p>
                      <p className="mt-3 text-base font-semibold text-ink">
                        {appointment.doctor.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {appointment.doctor.specialty ?? "Sin especialidad"}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        Servicio
                      </p>
                      <p className="mt-3 text-base font-semibold text-ink">
                        {appointment.service.name}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {appointment.service.durationMinutes} min ·{" "}
                        {formatMoney(
                          appointment.service.priceCents,
                          authContext.clinic.currency,
                        )}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        Fecha y hora
                      </p>
                      <p className="mt-3 text-base font-semibold text-ink">
                        {formatDateTimeInTimeZone(
                          appointment.startAt,
                          authContext.clinic.timezone,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Hasta{" "}
                        {formatDateTimeInTimeZone(
                          appointment.endAt,
                          authContext.clinic.timezone,
                        )}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                        Origen
                      </p>
                      <p className="mt-3 text-base font-semibold text-ink">
                        {SOURCE_LABELS[appointment.source]}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {appointment.notes ?? "Sin notas internas"}
                      </p>
                    </div>
                  </div>

                  {canConfirm || canCancel || canComplete || canNoShow ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {canConfirm ? (
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="intent" value="confirm" />
                          <button
                            type="submit"
                            className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
                          >
                            Confirmar
                          </button>
                        </form>
                      ) : null}

                      {canCancel ? (
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="intent" value="cancel" />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : null}

                      {canComplete ? (
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="intent" value="complete" />
                          <button
                            type="submit"
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                          >
                            Marcar completada
                          </button>
                        </form>
                      ) : null}

                      {canNoShow ? (
                        <form action={updateAppointmentStatusAction}>
                          <input type="hidden" name="appointmentId" value={appointment.id} />
                          <input type="hidden" name="intent" value="no-show" />
                          <button
                            type="submit"
                            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                          >
                            Marcar no-show
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <article className="surface-card p-7">
              <p className="text-lg font-semibold text-ink">
                No hay citas para los filtros seleccionados.
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Ajusta los filtros o crea una cita nueva desde el panel izquierdo.
              </p>
            </article>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
