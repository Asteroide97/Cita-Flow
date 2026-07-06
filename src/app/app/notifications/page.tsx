import Link from "next/link";

import {
  AppointmentSource,
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import { CollapsibleDetails } from "@/components/ui/collapsible-details";
import { CompactStatCard } from "@/components/ui/compact-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { getMetaWhatsAppConfigStatus } from "@/lib/meta/whatsapp-client";
import { listNotificationOutbox } from "@/lib/notifications/outbox";
import {
  notificationTemplateKeys,
  notificationTemplateLabels,
} from "@/lib/notifications/templates";

import {
  cancelNotificationAction,
  markNotificationFailedAction,
  markNotificationSentAction,
  sendWhatsAppNotificationAction,
} from "./actions";

type NotificationsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    filterStatus?: string;
    filterChannel?: string;
  }>;
};

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "notification-not-found":
        return {
          tone: "error" as const,
          message: "No encontre esa notificacion dentro del negocio actual.",
        };
      case "notification-action-invalid":
        return {
          tone: "error" as const,
          message: "La accion ya no esta permitida para el estado actual de la notificacion.",
        };
      case "notification-whatsapp-not-configured":
        return {
          tone: "error" as const,
          message: "Configura Meta Cloud API antes de intentar enviar notificaciones reales por WhatsApp.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la accion sobre la notificacion.",
        };
    }
  }

  switch (status) {
    case "notification-whatsapp-sent":
      return {
        tone: "success" as const,
        message: "WhatsApp enviado correctamente por Meta Cloud API.",
      };
    case "notification-whatsapp-failed":
      return {
        tone: "error" as const,
        message: "No se pudo enviar por WhatsApp. Revisa el error guardado en la notificacion.",
      };
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
  if ((notificationTemplateKeys as readonly string[]).includes(templateKey)) {
    return notificationTemplateLabels[
      templateKey as keyof typeof notificationTemplateLabels
    ];
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

function actionButtonClassName(tone: "sent" | "failed" | "cancel" | "whatsapp") {
  switch (tone) {
    case "whatsapp":
      return "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60";
    case "sent":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100";
    case "failed":
      return "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100";
    case "cancel":
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-200";
  }
}

function isNotificationStatus(value: string): value is NotificationStatus {
  return Object.values(NotificationStatus).includes(value as NotificationStatus);
}

function isNotificationChannel(value: string): value is NotificationChannel {
  return Object.values(NotificationChannel).includes(value as NotificationChannel);
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const allNotifications = await listNotificationOutbox({
    clinicId: authContext.clinic.id,
  });
  const metaConfig = getMetaWhatsAppConfigStatus();
  const flash = resolveFlashMessage(query.status, query.error);
  const filterStatus = isNotificationStatus(query.filterStatus?.trim() ?? "")
    ? (query.filterStatus?.trim() as NotificationStatus)
    : "";
  const filterChannel = isNotificationChannel(query.filterChannel?.trim() ?? "")
    ? (query.filterChannel?.trim() as NotificationChannel)
    : "";
  const notifications = allNotifications.filter((notification) => {
    if (filterStatus && notification.status !== filterStatus) {
      return false;
    }

    if (filterChannel && notification.channel !== filterChannel) {
      return false;
    }

    return true;
  });

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
      title="Notificaciones"
      description="Mensajes preparados para WhatsApp y email."
    >
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStatCard label="Pendientes" value={pendingCount} tone="amber" />
          <CompactStatCard label="Enviadas" value={sentCount} tone="emerald" />
          <CompactStatCard label="Fallidas" value={failedCount} tone="slate" />
          <CompactStatCard label="Canceladas" value={cancelledCount} tone="slate" />
        </div>

        <article className="rounded-[22px] border border-line/80 bg-white px-4 py-3 text-sm text-muted">
          {metaConfig.isConfigured
            ? "Meta Cloud API esta lista, pero el envio automatico sigue en pausa."
            : "WhatsApp real esta pendiente de configuracion. La cola sigue en modo manual."}
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Cola
              </p>
              <p className="mt-2 text-sm text-muted">
                {notifications.length} mensaje{notifications.length === 1 ? "" : "s"} visibles.
              </p>
            </div>

            <form className="grid gap-3 sm:grid-cols-[180px_180px_auto_auto]">
              <label className="text-sm font-semibold text-ink">
                Estado
                <select
                  name="filterStatus"
                  defaultValue={filterStatus}
                  className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Todos</option>
                  {Object.values(NotificationStatus).map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-ink">
                Canal
                <select
                  name="filterChannel"
                  defaultValue={filterChannel}
                  className="mt-2 w-full rounded-2xl border border-line/80 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Todos</option>
                  {Object.values(NotificationChannel).map((channel) => (
                    <option key={channel} value={channel}>
                      {getChannelLabel(channel)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                Filtrar
              </button>

              <Link
                href="/app/notifications"
                className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
              >
                Limpiar
              </Link>
            </form>
          </div>

          {notifications.length ? (
            <div className="mt-6 grid gap-3">
              {notifications.map((notification) => {
                const canSendWhatsApp =
                  notification.channel === NotificationChannel.WHATSAPP &&
                  notification.status === NotificationStatus.PENDING;
                const canTransition =
                  notification.status !== NotificationStatus.SENT &&
                  notification.status !== NotificationStatus.CANCELLED;
                const appointmentSummary = notification.appointment
                  ? `${formatDateTimeInTimeZone(notification.appointment.startAt, authContext.clinic.timezone)} - ${notification.appointment.patient.name}`
                  : "Sin reserva relacionada";

                return (
                  <article
                    key={notification.id}
                    className="rounded-[24px] border border-line/80 bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill className={getChannelClassName(notification.channel)}>
                            {getChannelLabel(notification.channel)}
                          </StatusPill>
                          <StatusPill className={getStatusClassName(notification.status)}>
                            {getStatusLabel(notification.status)}
                          </StatusPill>
                        </div>

                        <h2 className="mt-3 text-base font-semibold tracking-[-0.03em] text-ink">
                          {resolveTemplateLabel(notification.templateKey)}
                        </h2>
                        <p className="mt-1 text-sm text-muted">{notification.recipient}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">
                          {formatDateTimeInTimeZone(
                            notification.createdAt,
                            authContext.clinic.timezone,
                          )}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 xl:items-end">
                        {canSendWhatsApp ? (
                          metaConfig.isConfigured ? (
                            <form action={sendWhatsAppNotificationAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <button
                                type="submit"
                                className={actionButtonClassName("whatsapp")}
                              >
                                Enviar WhatsApp
                              </button>
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled
                                className={actionButtonClassName("whatsapp")}
                              >
                                Enviar WhatsApp
                              </button>
                              <p className="text-xs text-muted">
                                Configura Meta Cloud API para enviar.
                              </p>
                            </>
                          )
                        ) : canTransition ? (
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
                      </div>
                    </div>

                    <CollapsibleDetails summary="Ver detalles" className="mt-4">
                      <div className="grid gap-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              Reserva
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {appointmentSummary}
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              Estado reserva
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {notification.appointment
                                ? getAppointmentStatusLabel(notification.appointment.status)
                                : "Sin reserva"}
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              Origen
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {notification.appointment
                                ? getAppointmentSourceLabel(notification.appointment.source)
                                : "Sin origen"}
                            </p>
                          </div>

                          <div className="rounded-[18px] border border-line/80 bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              Cliente
                            </p>
                            <p className="mt-2 text-sm font-semibold text-ink">
                              {notification.patient
                                ? `${notification.patient.name} - ${notification.patient.phoneE164}`
                                : "Sin cliente relacionado"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-line/80 bg-slate-950 px-4 py-4 text-slate-100">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                            Mensaje completo
                          </p>
                          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-100">
                            {notification.body}
                          </pre>
                        </div>

                        {notification.errorMessage ? (
                          <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <span className="font-semibold">Error:</span>{" "}
                            {notification.errorMessage}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {canSendWhatsApp ? (
                            metaConfig.isConfigured ? (
                              <form action={sendWhatsAppNotificationAction}>
                                <input
                                  type="hidden"
                                  name="notificationId"
                                  value={notification.id}
                                />
                                <button
                                  type="submit"
                                  className={actionButtonClassName("whatsapp")}
                                >
                                  Enviar WhatsApp
                                </button>
                              </form>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className={actionButtonClassName("whatsapp")}
                              >
                                Enviar WhatsApp
                              </button>
                            )
                          ) : null}

                          {canTransition ? (
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

                          {canTransition ? (
                            <form action={markNotificationFailedAction}>
                              <input
                                type="hidden"
                                name="notificationId"
                                value={notification.id}
                              />
                              <input
                                type="hidden"
                                name="errorMessage"
                                value="Marcada manualmente como fallida desde el panel."
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
                    </CollapsibleDetails>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Aun no hay notificaciones."
              description="Crea una reserva o usa el booking para poblar esta cola."
              className="mt-6"
            />
          )}
        </article>
      </div>
    </PanelPage>
  );
}
