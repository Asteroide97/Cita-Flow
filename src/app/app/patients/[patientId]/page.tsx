import Link from "next/link";
import { notFound } from "next/navigation";

import { PanelPage } from "@/components/app/panel-page";
import {
  appointmentSourceLabels,
  appointmentStatusLabels,
  formatAppointmentPhone,
  getAppointmentStatusBadgeClassName,
} from "@/components/appointments/appointment-helpers";
import {
  formatDateInTimeZone,
  formatDateTimeInTimeZone,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

import { updatePatientAction } from "../actions";
import {
  getNotificationChannelLabel,
  getNotificationStatusClassName,
  getNotificationStatusLabel,
  getPatientGeneralStatusClassName,
  getPatientGeneralStatusLabel,
  getWaitlistStatusClassName,
  getWaitlistStatusLabel,
  isPatientUpcomingAppointment,
  patientFieldClassName,
  resolvePatientFlashMessage,
} from "../helpers";

type PatientDetailPageProps = {
  params: Promise<{
    patientId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function PatientDetailPage({
  params,
  searchParams,
}: PatientDetailPageProps) {
  const [{ patientId }, query, authContext] = await Promise.all([
    params,
    searchParams,
    requireAuthContext(),
  ]);
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      appointments: {
        orderBy: {
          startAt: "desc",
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          source: true,
          notes: true,
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
            },
          },
        },
      },
      waitlistEntries: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          status: true,
          preferredDate: true,
          preferredStartTime: true,
          preferredEndTime: true,
          notes: true,
          autoAccept: true,
          createdAt: true,
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
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              status: true,
              offeredStartAt: true,
              expiresAt: true,
            },
          },
        },
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          channel: true,
          recipient: true,
          templateKey: true,
          status: true,
          createdAt: true,
          scheduledFor: true,
          sentAt: true,
          failedAt: true,
          errorMessage: true,
          appointment: {
            select: {
              id: true,
              startAt: true,
              status: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          appointments: true,
          waitlistEntries: true,
          notifications: true,
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const now = new Date();
  const upcomingAppointments = patient.appointments
    .filter((appointment) => isPatientUpcomingAppointment(appointment, now))
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
  const appointmentHistory = patient.appointments.filter(
    (appointment) => !isPatientUpcomingAppointment(appointment, now),
  );
  const lastAppointment =
    patient.appointments.find((appointment) => appointment.startAt < now) ?? null;
  const nextAppointment = upcomingAppointments[0] ?? null;
  const hasUpcomingReservation = Boolean(nextAppointment);
  const flash = resolvePatientFlashMessage(query.status, query.error);

  return (
    <PanelPage
      eyebrow="Clientes"
      title={patient.name}
      description="Revisa reservas, lista de espera, notificaciones y actualiza los datos del cliente sin salir del panel."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/app/patients"
          className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
        >
          Volver a clientes
        </Link>
        <span
          className={getPatientGeneralStatusClassName(hasUpcomingReservation)}
        >
          {getPatientGeneralStatusLabel(hasUpcomingReservation)}
        </span>
      </div>

      {flash ? (
        <div
          className={
            flash.tone === "success"
              ? "mt-6 rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
              : "mt-6 rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
          }
        >
          {flash.message}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <div className="grid gap-6">
          <article className="surface-card p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Ficha del cliente
                </p>
                <div className="mt-4 grid gap-3 text-sm text-muted">
                  <p>{formatAppointmentPhone(patient.phoneE164)}</p>
                  <p>{patient.email ?? "Sin email registrado"}</p>
                  <p>
                    Cliente desde{" "}
                    {formatDateInTimeZone(
                      patient.createdAt,
                      authContext.clinic.timezone,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:text-right">
                <p className="text-sm font-semibold text-ink">
                  {patient._count.appointments} reserva
                  {patient._count.appointments === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-muted">
                  {patient._count.waitlistEntries} entrada
                  {patient._count.waitlistEntries === 1 ? "" : "s"} en lista de espera
                </p>
                <p className="text-sm text-muted">
                  {patient._count.notifications} notificacion
                  {patient._count.notifications === 1 ? "" : "es"} registradas
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Proxima reserva
                </p>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {nextAppointment
                    ? formatDateTimeInTimeZone(
                        nextAppointment.startAt,
                        authContext.clinic.timezone,
                      )
                    : "Sin reservas proximas"}
                </p>
              </div>

              <div className="rounded-[24px] border border-line/80 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Ultima reserva
                </p>
                <p className="mt-3 text-sm font-semibold text-ink">
                  {lastAppointment
                    ? formatDateTimeInTimeZone(
                        lastAppointment.startAt,
                        authContext.clinic.timezone,
                      )
                    : "Sin historial todavia"}
                </p>
              </div>

              <div className="rounded-[24px] border border-line/80 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Notas
                </p>
                <p className="mt-3 text-sm leading-7 text-ink">
                  {patient.notes ?? "Sin notas registradas para este cliente."}
                </p>
              </div>
            </div>
          </article>

          <article className="surface-card p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Reservas proximas
                </p>
                <p className="mt-2 text-sm leading-7 text-muted">
                  Horarios pendientes o confirmados para este cliente.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {upcomingAppointments.length ? (
                upcomingAppointments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-[24px] border border-line/80 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-semibold text-ink">
                            {appointment.service.name}
                          </p>
                          <span
                            className={getAppointmentStatusBadgeClassName(
                              appointment.status,
                            )}
                          >
                            {appointmentStatusLabels[appointment.status]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted">
                          {formatDateTimeInTimeZone(
                            appointment.startAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {appointment.doctor.name}
                          {appointment.doctor.specialty
                            ? ` · ${appointment.doctor.specialty}`
                            : ""}
                        </p>
                      </div>

                      <div className="text-sm text-muted">
                        {appointmentSourceLabels[appointment.source]}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5 text-sm text-muted">
                  Este cliente no tiene reservas proximas por ahora.
                </div>
              )}
            </div>
          </article>

          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Historial de reservas
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Incluye reservas pasadas y estados cerrados para seguimiento del negocio.
            </p>

            <div className="mt-6 grid gap-4">
              {appointmentHistory.length ? (
                appointmentHistory.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-[24px] border border-line/80 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-semibold text-ink">
                            {appointment.service.name}
                          </p>
                          <span
                            className={getAppointmentStatusBadgeClassName(
                              appointment.status,
                            )}
                          >
                            {appointmentStatusLabels[appointment.status]}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-muted">
                          {formatDateTimeInTimeZone(
                            appointment.startAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {appointment.doctor.name}
                          {appointment.doctor.specialty
                            ? ` · ${appointment.doctor.specialty}`
                            : ""}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          {appointment.notes ?? "Sin notas para esta reserva."}
                        </p>
                      </div>

                      <div className="text-sm text-muted">
                        {appointmentSourceLabels[appointment.source]}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5 text-sm text-muted">
                  Este cliente todavia no tiene historial de reservas cerrado.
                </div>
              )}
            </div>
          </article>
        </div>

        <div className="grid gap-6 self-start">
          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Editar cliente
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Actualiza nombre, telefono, email y notas sin afectar el historial.
            </p>

            <form action={updatePatientAction} className="mt-6 grid gap-4">
              <input type="hidden" name="patientId" value={patient.id} />
              <input
                type="hidden"
                name="returnPath"
                value={`/app/patients/${patient.id}`}
              />

              <label className="text-sm font-semibold text-ink">
                Nombre
                <input
                  name="name"
                  required
                  defaultValue={patient.name}
                  className={patientFieldClassName}
                  placeholder="Nombre del cliente"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Telefono
                <input
                  name="phoneE164"
                  required
                  defaultValue={patient.phoneE164}
                  className={patientFieldClassName}
                  placeholder="+52 5512345678"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Email
                <input
                  type="email"
                  name="email"
                  defaultValue={patient.email ?? ""}
                  className={patientFieldClassName}
                  placeholder="cliente@negocio.com"
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Notas
                <textarea
                  name="notes"
                  rows={4}
                  defaultValue={patient.notes ?? ""}
                  className={patientFieldClassName}
                  placeholder="Notas internas sobre este cliente"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                Guardar cambios
              </button>
            </form>
          </article>

          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Lista de espera asociada
            </p>

            <div className="mt-6 grid gap-4">
              {patient.waitlistEntries.length ? (
                patient.waitlistEntries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[24px] border border-line/80 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-ink">
                        {entry.service.name}
                      </p>
                      <span className={getWaitlistStatusClassName(entry.status)}>
                        {getWaitlistStatusLabel(entry.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted">
                      <p>
                        {entry.doctor
                          ? `${entry.doctor.name}${entry.doctor.specialty ? ` · ${entry.doctor.specialty}` : ""}`
                          : "Cualquier profesional"}
                      </p>
                      <p>
                        {entry.preferredDate
                          ? formatDateInTimeZone(
                              entry.preferredDate,
                              authContext.clinic.timezone,
                            )
                          : "Sin fecha preferida"}
                      </p>
                      <p>
                        {entry.preferredStartTime && entry.preferredEndTime
                          ? `${entry.preferredStartTime} - ${entry.preferredEndTime}`
                          : "Cualquier horario"}
                      </p>
                      <p>{entry.notes ?? "Sin notas para esta solicitud."}</p>
                      {entry.offers[0] ? (
                        <p>
                          Ultima oferta: {entry.offers[0].status.toLowerCase()} ·{" "}
                          {formatDateTimeInTimeZone(
                            entry.offers[0].offeredStartAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5 text-sm text-muted">
                  Este cliente no tiene solicitudes activas de lista de espera.
                </div>
              )}
            </div>
          </article>

          <article className="surface-card p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Notificaciones asociadas
            </p>

            <div className="mt-6 grid gap-4">
              {patient.notifications.length ? (
                patient.notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className="rounded-[24px] border border-line/80 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-semibold text-ink">
                        {getNotificationChannelLabel(notification.channel)}
                      </p>
                      <span
                        className={getNotificationStatusClassName(notification.status)}
                      >
                        {getNotificationStatusLabel(notification.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-muted">
                      <p>{notification.templateKey}</p>
                      <p>{notification.recipient}</p>
                      <p>
                        Creada el{" "}
                        {formatDateTimeInTimeZone(
                          notification.createdAt,
                          authContext.clinic.timezone,
                        )}
                      </p>
                      {notification.scheduledFor ? (
                        <p>
                          Programada para{" "}
                          {formatDateTimeInTimeZone(
                            notification.scheduledFor,
                            authContext.clinic.timezone,
                          )}
                        </p>
                      ) : null}
                      {notification.appointment ? (
                        <p>
                          Reserva relacionada: {notification.appointment.service.name} ·{" "}
                          {formatDateTimeInTimeZone(
                            notification.appointment.startAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                      ) : null}
                      {notification.errorMessage ? (
                        <p className="text-rose-700">{notification.errorMessage}</p>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5 text-sm text-muted">
                  Este cliente todavia no tiene notificaciones registradas.
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </PanelPage>
  );
}
