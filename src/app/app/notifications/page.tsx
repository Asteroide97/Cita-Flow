import {
  AppointmentSource,
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { listNotificationOutbox } from "@/lib/notifications/outbox";
import {
  notificationTemplateKeys,
  notificationTemplateLabels,
} from "@/lib/notifications/templates";

import {
  cancelNotificationAction,
  markNotificationFailedAction,
  markNotificationSentAction,
} from "./actions";

type NotificationsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "notification-not-found":
        return {
          tone: "error" as const,
          message: "No encontre esa notificacion dentro de la clinica actual.",
        };
      case "notification-action-invalid":
        return {
          tone: "error" as const,
          message: "La accion ya no esta permitida para el estado actual de la notificacion.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion sobre la notificacion.",
        };
    }
  }

  switch (status) {
    case "notification-sent":
      return {
        tone: "success" as const,
        message: "Notificacion marcada como enviada.",
      };
    case "notification-failed":
      return {
        tone: "success" as const,
        message: "Notificacion marcada como fallida.",
      };
    case "notification-cancelled":
      return {
        tone: "success" as const,
        message: "Notificacion pendiente cancelada correctamente.",
      };
    default:
      return null;
  }
}

function getStatusLabel(status: NotificationStatus) {
  switch (status) {
    case NotificationStatus.PENDING:
      return "Pendiente";
    case NotificationStatus.SENT:
      return "Enviada";
    case NotificationStatus.FAILED:
      return "Fallida";
    case NotificationStatus.CANCELLED:
      return "Cancelada";
  }
}

function getStatusClassName(status: NotificationStatus) {
  switch (status) {
    case NotificationStatus.PENDING:
      return "border-amber-200 bg-amber-100 text-amber-700";
    case NotificationStatus.SENT:
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case NotificationStatus.FAILED:
      return "border-rose-200 bg-rose-100 text-rose-700";
    case NotificationStatus.CANCELLED:
      return "border-slate-200 bg-slate-200 text-slate-700";
  }
}

function getChannelLabel(channel: NotificationChannel) {
  return channel === NotificationChannel.WHATSAPP ? "WhatsApp" : "Email";
}

function getChannelClassName(channel: NotificationChannel) {
  return channel === NotificationChannel.WHATSAPP
    ? "border-brand-200 bg-brand-100 text-brand-700"
    : "border-slate-200 bg-slate-100 text-slate-700";
}

function resolveTemplateLabel(templateKey: string) {
  if (
    (notificationTemplateKeys as readonly string[]).includes(templateKey)
  ) {
    return notificationTemplateLabels[templateKey as keyof typeof notificationTemplateLabels];
  }

  return templateKey;
}

function getAppointmentStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case AppointmentStatus.PENDING:
      return "Pendiente";
    case AppointmentStatus.CONFIRMED:
      return "Confirmada";
    case AppointmentStatus.CANCELLED:
      return "Cancelada";
    case AppointmentStatus.RESCHEDULED:
      return "Reagendada";
    case AppointmentStatus.COMPLETED:
      return "Completada";
    case AppointmentStatus.NO_SHOW:
      return "No show";
  }
}

function getAppointmentSourceLabel(source: AppointmentSource) {
  switch (source) {
    case AppointmentSource.ADMIN:
      return "Panel";
    case AppointmentSource.PUBLIC_BOOKING:
      return "Booking publico";
    case AppointmentSource.WHATSAPP:
      return "WhatsApp";
    case AppointmentSource.IMPORT:
      return "Importacion";
  }
}

function actionButtonClassName(tone: "sent" | "failed" | "cancel") {
  switch (tone) {
    case "sent":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100";
    case "failed":
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100";
    case "cancel":
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-200";
  }
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const notifications = await listNotificationOutbox({
    clinicId: authContext.clinic.id,
  });
  const flash = resolveFlashMessage(query.status, query.error);

  const pendingCount = notifications.filter(
    (notification) => notification.status === NotificationStatus.PENDING,
  ).length;
  const sentCount = notifications.filter(
    (notification) => notification.status === NotificationStatus.SENT,
  ).length;
  const failedCount = notifications.filter(
    (notification) => notification.status === NotificationStatus.FAILED,
  ).length;
  const cancelledCount = notifications.filter(
    (notification) => notification.status === NotificationStatus.CANCELLED,
  ).length;

  return (
    <PanelPage
      eyebrow="Notificaciones"
      title="Outbox transaccional del consultorio"
      description="Aqui se preparan los mensajes de WhatsApp y email sin enviarlos todavia. Cada registro queda aislado por clinica, con template, destinatario y contexto de cita listo para conectar proveedores reales despues."
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Pendientes
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {pendingCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Mensajes listos para salir cuando se conecte un proveedor real.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Enviadas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {sentCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Confirmadas manualmente desde este panel de desarrollo.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Fallidas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {failedCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Util para probar reintentos y manejo de errores mas adelante.
            </p>
          </article>

          <article className="surface-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Canceladas
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
              {cancelledCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              Notificaciones pendientes descartadas antes de enviarse.
            </p>
          </article>
        </div>

        <article className="surface-card p-6 sm:p-7">
          <div className="grid gap-3 text-sm text-muted">
            <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
              Por ahora esta capa solo crea registros `PENDING`; no existe envio real a
              WhatsApp ni email.
            </div>
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              Las acciones de esta pantalla son solo para desarrollo y ayudan a probar el
              flujo antes de conectar Meta Cloud API o un proveedor de correo.
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Cola de salida
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
                Cada notificacion conserva canal, template y cuerpo final renderizado con
                el contexto real de la cita.
              </p>
            </div>

            <div className="rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-muted">
              {notifications.length} registros
            </div>
          </div>

          {notifications.length ? (
            <div className="mt-6 grid gap-4">
              {notifications.map((notification) => {
                const appointmentSummary = notification.appointment
                  ? `${notification.appointment.patient.name} · ${notification.appointment.service.name} · ${formatDateTimeInTimeZone(notification.appointment.startAt, authContext.clinic.timezone)}`
                  : "Sin cita relacionada";

                return (
                  <article
                    key={notification.id}
                    className="rounded-[28px] border border-line/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getChannelClassName(notification.channel)}`}
                        >
                          {getChannelLabel(notification.channel)}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getStatusClassName(notification.status)}`}
                        >
                          {getStatusLabel(notification.status)}
                        </span>
                      </div>

                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                        Creada {formatDateTimeInTimeZone(notification.createdAt, authContext.clinic.timezone)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                      <div className="grid gap-4">
                        <div>
                          <h2 className="text-lg font-semibold tracking-[-0.03em] text-ink">
                            {resolveTemplateLabel(notification.templateKey)}
                          </h2>
                          <p className="mt-2 text-sm leading-7 text-muted">
                            Destinatario:{" "}
                            <span className="font-semibold text-ink">
                              {notification.recipient}
                            </span>
                            {notification.subject ? ` · ${notification.subject}` : ""}
                          </p>
                        </div>

                        <div className="rounded-[24px] border border-line/80 bg-surface-soft px-4 py-4 text-sm leading-7 text-muted">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            Cita relacionada
                          </p>
                          <p className="mt-2 text-sm font-medium text-ink">
                            {appointmentSummary}
                          </p>
                          <p className="mt-2 text-sm text-muted">
                            {notification.appointment
                              ? `Estado actual: ${getAppointmentStatusLabel(notification.appointment.status)} · Origen: ${getAppointmentSourceLabel(notification.appointment.source)}`
                              : "Este registro no tiene una cita asociada."}
                          </p>
                          {notification.patient ? (
                            <p className="mt-2 text-sm text-muted">
                              Paciente: {notification.patient.name} · {notification.patient.phoneE164}
                              {notification.patient.email
                                ? ` · ${notification.patient.email}`
                                : ""}
                            </p>
                          ) : null}
                        </div>

                        <div className="rounded-[24px] border border-line/80 bg-slate-950 px-4 py-4 text-sm leading-7 text-slate-100">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                            Cuerpo renderizado
                          </p>
                          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-100">
                            {notification.body}
                          </pre>
                        </div>

                        {notification.errorMessage ? (
                          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-7 text-rose-700">
                            <span className="font-semibold">Ultimo error:</span>{" "}
                            {notification.errorMessage}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-4 self-start rounded-[24px] border border-line/80 bg-white px-4 py-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                            Metadatos
                          </p>
                          <div className="mt-3 grid gap-2 text-sm text-muted">
                            <p>
                              Programada:{" "}
                              <span className="font-medium text-ink">
                                {notification.scheduledFor
                                  ? formatDateTimeInTimeZone(
                                      notification.scheduledFor,
                                      authContext.clinic.timezone,
                                    )
                                  : "Inmediata"}
                              </span>
                            </p>
                            <p>
                              Enviada:{" "}
                              <span className="font-medium text-ink">
                                {notification.sentAt
                                  ? formatDateTimeInTimeZone(
                                      notification.sentAt,
                                      authContext.clinic.timezone,
                                    )
                                  : "No"}
                              </span>
                            </p>
                            <p>
                              Fallida:{" "}
                              <span className="font-medium text-ink">
                                {notification.failedAt
                                  ? formatDateTimeInTimeZone(
                                      notification.failedAt,
                                      authContext.clinic.timezone,
                                    )
                                  : "No"}
                              </span>
                            </p>
                            <p>
                              ID: <span className="font-medium text-ink">{notification.id}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          {notification.status !== NotificationStatus.SENT &&
                          notification.status !== NotificationStatus.CANCELLED ? (
                            <form action={markNotificationSentAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <button
                                type="submit"
                                className={actionButtonClassName("sent")}
                              >
                                Marcar como enviada
                              </button>
                            </form>
                          ) : null}

                          {notification.status !== NotificationStatus.SENT &&
                          notification.status !== NotificationStatus.CANCELLED ? (
                            <form action={markNotificationFailedAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <input
                                type="hidden"
                                name="errorMessage"
                                value="Marcada manualmente como fallida desde el panel de desarrollo."
                              />
                              <button
                                type="submit"
                                className={actionButtonClassName("failed")}
                              >
                                Marcar como fallida
                              </button>
                            </form>
                          ) : null}

                          {notification.status === NotificationStatus.PENDING ? (
                            <form action={cancelNotificationAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <button
                                type="submit"
                                className={actionButtonClassName("cancel")}
                              >
                                Cancelar pendiente
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[28px] border border-dashed border-line bg-surface-soft px-6 py-10 text-center">
              <p className="text-lg font-semibold tracking-[-0.03em] text-ink">
                Aun no hay notificaciones encoladas
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Crea una cita desde el panel, booking publico, WhatsApp simulator o
                autoservicio por token para empezar a poblar este outbox.
              </p>
            </div>
          )}
        </article>
      </div>
    </PanelPage>
  );
}
