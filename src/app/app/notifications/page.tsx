import Link from "next/link";

import {
  AppointmentSource,
  AppointmentStatus,
  NotificationChannel,
  NotificationStatus,
} from "@prisma/client";

import { appointmentFieldClassName } from "@/components/appointments/appointment-helpers";
import { PanelPage } from "@/components/app/panel-page";
import { NotificationDrawerPortal } from "@/components/notifications/notification-drawer-portal";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDateTimeInTimeZone } from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { getMetaWhatsAppConfigStatus } from "@/lib/meta/whatsapp-client";
import { listNotificationOutbox } from "@/lib/notifications/outbox";
import { getEmailDeliveryConfigStatus } from "@/lib/notifications/send-email";
import {
  notificationTemplateKeys,
  notificationTemplateLabels,
} from "@/lib/notifications/templates";

import {
  bulkArchiveFailedNotificationsAction,
  bulkCancelPendingNotificationsAction,
  bulkMarkNotificationsSentAction,
  cancelNotificationAction,
  markAppointmentFakeAction,
  markNotificationFailedAction,
  markNotificationSentAction,
  sendEmailNotificationAction,
  sendWhatsAppNotificationAction,
} from "./actions";

type NotificationsPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
    scope?: string;
    filterStatus?: string;
    filterChannel?: string;
    filterTemplate?: string;
    q?: string;
    from?: string;
    to?: string;
    withAppointment?: string;
    onlyFailed?: string;
    limit?: string;
    page?: string;
    details?: string;
  }>;
};

type NotificationsScope = "clean" | "all";
type NotificationsLimit = 10 | 25 | 50;
type NotificationItem = Awaited<ReturnType<typeof listNotificationOutbox>>[number];

type NotificationFilterState = {
  scope: NotificationsScope;
  filterStatus: NotificationStatus | "";
  filterChannel: NotificationChannel | "";
  filterTemplate: string;
  queryText: string;
  from: string;
  to: string;
  onlyWithAppointment: boolean;
  onlyFailed: boolean;
  limit: NotificationsLimit;
  page: number;
  detailsId: string;
};

const DEFAULT_LIMIT: NotificationsLimit = 10;
const LIMIT_OPTIONS: NotificationsLimit[] = [10, 25, 50];
const CLEAN_STATUSES: NotificationStatus[] = [
  NotificationStatus.PENDING,
  NotificationStatus.FAILED,
];

function resolveFlashMessage(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "notification-not-found":
        return {
          tone: "error" as const,
          message: "No encontré esa notificación dentro del negocio actual.",
        };
      case "notification-action-invalid":
        return {
          tone: "error" as const,
          message: "La acción ya no está permitida para el estado actual.",
        };
      case "notification-whatsapp-not-configured":
        return {
          tone: "error" as const,
          message: "Configura Meta Cloud API antes de enviar WhatsApp reales.",
        };
      case "notification-email-not-configured":
        return {
          tone: "error" as const,
          message: "Email real no configurado. Define proveedor y credenciales primero.",
        };
      case "notification-bulk-empty":
        return {
          tone: "error" as const,
          message: "No hay notificaciones elegibles para esa acción masiva.",
        };
      case "appointment-fake-invalid":
        return {
          tone: "error" as const,
          message: "Esa reserva ya no puede marcarse como falsa.",
        };
      case "appointment-fake-not-found":
        return {
          tone: "error" as const,
          message: "No encontré la reserva relacionada dentro del negocio actual.",
        };
      default:
        return {
          tone: "error" as const,
          message: "No pude completar la acción sobre la bandeja.",
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
        message: "No se pudo enviar por WhatsApp. Revisa el error guardado.",
      };
    case "notification-email-sent":
      return {
        tone: "success" as const,
        message: "Email enviado correctamente desde el panel.",
      };
    case "notification-email-failed":
      return {
        tone: "error" as const,
        message: "No se pudo enviar el email. Revisa el error guardado.",
      };
    case "notification-sent":
      return {
        tone: "success" as const,
        message: "Notificación marcada como enviada.",
      };
    case "notification-failed":
      return {
        tone: "success" as const,
        message: "Notificación marcada como fallida.",
      };
    case "notification-cancelled":
      return {
        tone: "success" as const,
        message: "Notificación archivada correctamente.",
      };
    case "notifications-bulk-cancelled":
      return {
        tone: "success" as const,
        message: "Pendientes filtradas canceladas correctamente.",
      };
    case "notifications-bulk-sent":
      return {
        tone: "success" as const,
        message: "Notificaciones filtradas marcadas como enviadas.",
      };
    case "notifications-bulk-failed-archived":
      return {
        tone: "success" as const,
        message: "Notificaciones fallidas canceladas correctamente.",
      };
    case "appointment-marked-fake":
      return {
        tone: "success" as const,
        message:
          "La reserva quedó marcada como falsa y sus pendientes relacionadas fueron canceladas.",
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
      return "Booking público";
    case AppointmentSource.WHATSAPP:
      return "WhatsApp";
    case AppointmentSource.IMPORT:
      return "Importación";
  }
}

function actionButtonClassName(
  tone: "sent" | "archive" | "whatsapp" | "danger",
) {
  switch (tone) {
    case "whatsapp":
      return "rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60";
    case "sent":
      return "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60";
    case "danger":
      return "rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60";
    case "archive":
    default:
      return "rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";
  }
}

function isNotificationStatus(value: string): value is NotificationStatus {
  return Object.values(NotificationStatus).includes(value as NotificationStatus);
}

function isNotificationChannel(value: string): value is NotificationChannel {
  return Object.values(NotificationChannel).includes(value as NotificationChannel);
}

function resolveScope(value?: string): NotificationsScope {
  return value === "all" ? "all" : "clean";
}

function resolveLimit(value?: string): NotificationsLimit {
  const parsed = Number.parseInt(value ?? "", 10);

  return LIMIT_OPTIONS.includes(parsed as NotificationsLimit)
    ? (parsed as NotificationsLimit)
    : DEFAULT_LIMIT;
}

function resolvePage(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function formatDateValueInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getValue("year")}-${getValue("month")}-${getValue("day")}`;
}

function formatInboxDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: timezone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildNotificationsPath(filters: Partial<NotificationFilterState> = {}) {
  const params = new URLSearchParams();

  if (filters.scope && filters.scope !== "clean") {
    params.set("scope", filters.scope);
  }

  if (filters.filterStatus) {
    params.set("filterStatus", filters.filterStatus);
  }

  if (filters.filterChannel) {
    params.set("filterChannel", filters.filterChannel);
  }

  if (filters.filterTemplate) {
    params.set("filterTemplate", filters.filterTemplate);
  }

  if (filters.queryText) {
    params.set("q", filters.queryText);
  }

  if (filters.from) {
    params.set("from", filters.from);
  }

  if (filters.to) {
    params.set("to", filters.to);
  }

  if (filters.onlyWithAppointment) {
    params.set("withAppointment", "1");
  }

  if (filters.onlyFailed) {
    params.set("onlyFailed", "1");
  }

  if (filters.limit && filters.limit !== DEFAULT_LIMIT) {
    params.set("limit", String(filters.limit));
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.detailsId) {
    params.set("details", filters.detailsId);
  }

  const query = params.toString();

  return `/app/notifications${query ? `?${query}` : ""}`;
}

function buildSearchIndex(notification: NotificationItem) {
  return [
    notification.recipient,
    notification.templateKey,
    resolveTemplateLabel(notification.templateKey),
    notification.patient?.name ?? "",
    notification.patient?.phoneE164 ?? "",
    notification.patient?.email ?? "",
    notification.appointment?.patient.name ?? "",
    notification.appointment?.doctor.name ?? "",
    notification.appointment?.service.name ?? "",
    notification.appointment?.id ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function extractCalendarLinks(payloadJson: unknown) {
  if (!payloadJson || typeof payloadJson !== "object") {
    return {
      calendarIcsUrl: null,
      googleCalendarUrl: null,
      hasCalendarLinks: false,
    };
  }

  const rawCalendarLinks = (payloadJson as { calendarLinks?: unknown }).calendarLinks;

  if (!rawCalendarLinks || typeof rawCalendarLinks !== "object") {
    return {
      calendarIcsUrl: null,
      googleCalendarUrl: null,
      hasCalendarLinks: false,
    };
  }

  const calendarIcsUrl =
    typeof (rawCalendarLinks as { calendarIcsUrl?: unknown }).calendarIcsUrl === "string"
      ? (rawCalendarLinks as { calendarIcsUrl: string }).calendarIcsUrl
      : null;
  const googleCalendarUrl =
    typeof (rawCalendarLinks as { googleCalendarUrl?: unknown }).googleCalendarUrl === "string"
      ? (rawCalendarLinks as { googleCalendarUrl: string }).googleCalendarUrl
      : null;

  return {
    calendarIcsUrl,
    googleCalendarUrl,
    hasCalendarLinks: Boolean(calendarIcsUrl || googleCalendarUrl),
  };
}

function buildClientSummary(notification: NotificationItem) {
  const patient = notification.patient;

  if (!patient) {
    return "Sin cliente";
  }

  return `${patient.name}${patient.phoneE164 ? ` · ${patient.phoneE164}` : ""}`;
}

function buildAppointmentSummary(notification: NotificationItem, timezone: string) {
  if (!notification.appointment) {
    return "Sin reserva relacionada";
  }

  return [
    notification.appointment.service.name,
    notification.appointment.doctor.name,
    formatDateTimeInTimeZone(notification.appointment.startAt, timezone),
  ].join(" · ");
}

function buildSecondarySummary(notification: NotificationItem) {
  const parts = [
    notification.recipient,
    notification.patient?.name ?? "",
    notification.appointment?.service.name ?? "",
    notification.appointment?.doctor.name ?? "",
  ];

  return [...new Set(parts.map((part) => part.trim()).filter(Boolean))].join(" · ");
}

function InlineActionForm({
  action,
  notificationId,
  redirectPath,
  label,
  tone,
  disabled = false,
  extraFields,
}: {
  action: (formData: FormData) => Promise<void>;
  notificationId: string;
  redirectPath: string;
  label: string;
  tone: "sent" | "archive" | "whatsapp" | "danger";
  disabled?: boolean;
  extraFields?: Record<string, string>;
}) {
  return (
    <form action={action} className="w-full sm:w-auto">
      <input type="hidden" name="notificationId" value={notificationId} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      {extraFields
        ? Object.entries(extraFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <button
        type="submit"
        disabled={disabled}
        className={`${actionButtonClassName(tone)} w-full sm:w-auto`}
      >
        {label}
      </button>
    </form>
  );
}

function BulkActionMenuItem({
  action,
  notificationIds,
  redirectPath,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  notificationIds: string[];
  redirectPath: string;
  label: string;
}) {
  const count = notificationIds.length;
  const confirmMessage = `Esta acción afectará ${count} notificación${
    count === 1 ? "" : "es"
  } filtrada${count === 1 ? "" : "s"}.`;

  return (
    <form action={action}>
      <input type="hidden" name="notificationIds" value={notificationIds.join(",")} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <ConfirmSubmitButton
        confirmMessage={confirmMessage}
        type="submit"
        disabled={count === 0}
        className="flex w-full items-center justify-between rounded-2xl border border-line/80 px-3 py-3 text-left text-sm text-ink transition hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{label}</span>
        <span className="text-xs font-semibold text-muted">{count}</span>
      </ConfirmSubmitButton>
    </form>
  );
}

function BulkActionsMenu({
  redirectPath,
  pendingFilteredIds,
  actionableFilteredIds,
  failedFilteredIds,
}: {
  redirectPath: string;
  pendingFilteredIds: string[];
  actionableFilteredIds: string[];
  failedFilteredIds: string[];
}) {
  return (
    <details className="relative">
      <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700">
        Acciones
      </summary>

      <div className="absolute right-0 z-20 mt-3 w-[min(88vw,22rem)] rounded-[22px] border border-line/80 bg-white p-3 shadow-soft">
        <div className="grid gap-2">
          <BulkActionMenuItem
            action={bulkCancelPendingNotificationsAction}
            notificationIds={pendingFilteredIds}
            redirectPath={redirectPath}
            label="Cancelar pendientes filtradas"
          />
          <BulkActionMenuItem
            action={bulkMarkNotificationsSentAction}
            notificationIds={actionableFilteredIds}
            redirectPath={redirectPath}
            label="Marcar filtradas como enviadas"
          />
          <BulkActionMenuItem
            action={bulkArchiveFailedNotificationsAction}
            notificationIds={failedFilteredIds}
            redirectPath={redirectPath}
            label="Cancelar fallidas filtradas"
          />
        </div>
      </div>
    </details>
  );
}

function NotificationDetailDrawer({
  notification,
  timezone,
  redirectPath,
  closePath,
  metaConfig,
  emailConfig,
}: {
  notification: NotificationItem;
  timezone: string;
  redirectPath: string;
  closePath: string;
  metaConfig: ReturnType<typeof getMetaWhatsAppConfigStatus>;
  emailConfig: ReturnType<typeof getEmailDeliveryConfigStatus>;
}) {
  const appointment = notification.appointment;
  const calendarLinks = extractCalendarLinks(notification.payloadJson);
  const canSendWhatsApp =
    notification.channel === NotificationChannel.WHATSAPP &&
    notification.status === NotificationStatus.PENDING;
  const canSendEmail =
    notification.channel === NotificationChannel.EMAIL &&
    notification.status === NotificationStatus.PENDING;
  const canMarkSent =
    notification.status !== NotificationStatus.SENT &&
    notification.status !== NotificationStatus.CANCELLED;
  const canArchive =
    notification.status === NotificationStatus.PENDING ||
    notification.status === NotificationStatus.FAILED;
  const canMarkFake =
    appointment !== null &&
    appointment.status !== AppointmentStatus.COMPLETED &&
    appointment.status !== AppointmentStatus.NO_SHOW;

  return (
    <NotificationDrawerPortal>
      <Link
        href={closePath}
        aria-label="Cerrar detalles"
        className="fixed inset-0 z-40 bg-slate-950/35"
        style={{ position: "fixed" }}
      />

      <aside
        className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[28px] border border-line/80 bg-white p-5 shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(92vw,34rem)] sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l"
        style={{ position: "fixed" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Detalles
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-ink">
              {resolveTemplateLabel(notification.templateKey)}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {formatDateTimeInTimeZone(notification.createdAt, timezone)}
            </p>
          </div>

          <Link
            href={closePath}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/80 text-lg text-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            ×
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill className={getChannelClassName(notification.channel)}>
            {getChannelLabel(notification.channel)}
          </StatusPill>
          <StatusPill className={getStatusClassName(notification.status)}>
            {getStatusLabel(notification.status)}
          </StatusPill>
          {calendarLinks.hasCalendarLinks ? (
            <StatusPill className="border-brand-200 bg-brand-50 text-brand-700">
              Calendario
            </StatusPill>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-[22px] border border-line/80 bg-surface-soft px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Destinatario
            </p>
            <p className="mt-2 text-sm font-medium text-ink">{notification.recipient}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Cliente
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                {buildClientSummary(notification)}
              </p>
            </div>

            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Reserva
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                {buildAppointmentSummary(notification, timezone)}
              </p>
            </div>
          </div>

          {appointment ? (
            <div className="rounded-[22px] border border-line/80 bg-white px-4 py-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Estado de reserva
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink">
                    {getAppointmentStatusLabel(appointment.status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Origen
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink">
                    {getAppointmentSourceLabel(appointment.source)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {calendarLinks.hasCalendarLinks ? (
            <div className="flex flex-wrap gap-2">
              {calendarLinks.calendarIcsUrl ? (
                <a
                  href={calendarLinks.calendarIcsUrl}
                  className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition hover:border-brand-200 hover:bg-brand-50"
                >
                  Agregar a calendario
                </a>
              ) : null}
              {calendarLinks.googleCalendarUrl ? (
                <a
                  href={calendarLinks.googleCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                >
                  Google Calendar
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-[22px] border border-line/80 bg-slate-950 px-4 py-4 text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Mensaje completo
            </p>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-100">
              {notification.body}
            </pre>
          </div>

          {notification.errorMessage ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              <span className="font-semibold">Error:</span> {notification.errorMessage}
            </div>
          ) : null}

          {notification.channel === NotificationChannel.EMAIL ? (
            <p className="text-sm text-muted">
              {emailConfig.isConfigured
                ? "Email listo para prueba manual desde el panel."
                : "Email real pendiente de configuración."}
            </p>
          ) : null}

          {notification.channel === NotificationChannel.WHATSAPP && !metaConfig.isConfigured ? (
            <p className="text-sm text-muted">
              WhatsApp real pendiente de configuración.
            </p>
          ) : null}

          <div className="grid gap-2">
            {canSendWhatsApp ? (
              metaConfig.isConfigured ? (
                <InlineActionForm
                  action={sendWhatsAppNotificationAction}
                  notificationId={notification.id}
                  redirectPath={redirectPath}
                  label="Enviar WhatsApp"
                  tone="whatsapp"
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className={`${actionButtonClassName("whatsapp")} w-full`}
                >
                  Configura Meta Cloud API para enviar
                </button>
              )
            ) : null}

            {canSendEmail ? (
              emailConfig.isConfigured ? (
                <InlineActionForm
                  action={sendEmailNotificationAction}
                  notificationId={notification.id}
                  redirectPath={redirectPath}
                  label="Probar email"
                  tone="sent"
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className={`${actionButtonClassName("sent")} w-full`}
                >
                  Configura email real para enviar
                </button>
              )
            ) : null}

            {canMarkSent ? (
              <InlineActionForm
                action={markNotificationSentAction}
                notificationId={notification.id}
                redirectPath={redirectPath}
                label="Marcar como enviada"
                tone="sent"
              />
            ) : null}

            {canArchive ? (
              <InlineActionForm
                action={cancelNotificationAction}
                notificationId={notification.id}
                redirectPath={redirectPath}
                label="Cancelar notificación"
                tone="archive"
              />
            ) : null}

            {canMarkSent ? (
              <InlineActionForm
                action={markNotificationFailedAction}
                notificationId={notification.id}
                redirectPath={redirectPath}
                label="Marcar como fallida"
                tone="danger"
                extraFields={{
                  errorMessage: "Marcada manualmente como fallida desde notificaciones.",
                }}
              />
            ) : null}

            {canMarkFake && appointment ? (
              <form action={markAppointmentFakeAction}>
                <input type="hidden" name="appointmentId" value={appointment.id} />
                <input type="hidden" name="redirectPath" value={redirectPath} />
                <ConfirmSubmitButton
                  confirmMessage={
                    appointment.status === AppointmentStatus.CANCELLED
                      ? "Esto cancelará las notificaciones pendientes relacionadas."
                      : "Esto cancelará la reserva y cancelará sus notificaciones pendientes."
                  }
                  type="submit"
                  className={`${actionButtonClassName("danger")} w-full`}
                >
                  {appointment.status === AppointmentStatus.CANCELLED
                    ? "Cancelar notificaciones relacionadas"
                    : "Marcar reserva como falsa"}
                </ConfirmSubmitButton>
              </form>
            ) : null}
          </div>
        </div>
      </aside>
    </NotificationDrawerPortal>
  );
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
  const emailConfig = getEmailDeliveryConfigStatus();
  const flash = resolveFlashMessage(query.status, query.error);
  const filters: NotificationFilterState = {
    scope: resolveScope(query.scope),
    filterStatus: isNotificationStatus(query.filterStatus?.trim() ?? "")
      ? (query.filterStatus?.trim() as NotificationStatus)
      : "",
    filterChannel: isNotificationChannel(query.filterChannel?.trim() ?? "")
      ? (query.filterChannel?.trim() as NotificationChannel)
      : "",
    filterTemplate: query.filterTemplate?.trim() ?? "",
    queryText: query.q?.trim() ?? "",
    from: query.from?.trim() ?? "",
    to: query.to?.trim() ?? "",
    onlyWithAppointment: query.withAppointment === "1",
    onlyFailed: query.onlyFailed === "1",
    limit: resolveLimit(query.limit),
    page: resolvePage(query.page),
    detailsId: query.details?.trim() ?? "",
  };
  const normalizedSearch = filters.queryText.toLowerCase();

  const filteredNotifications = allNotifications.filter((notification) => {
    if (
      !filters.filterStatus &&
      filters.scope === "clean" &&
      !CLEAN_STATUSES.includes(notification.status)
    ) {
      return false;
    }

    if (filters.filterStatus && notification.status !== filters.filterStatus) {
      return false;
    }

    if (filters.onlyFailed && notification.status !== NotificationStatus.FAILED) {
      return false;
    }

    if (filters.filterChannel && notification.channel !== filters.filterChannel) {
      return false;
    }

    if (filters.filterTemplate && notification.templateKey !== filters.filterTemplate) {
      return false;
    }

    if (filters.onlyWithAppointment && !notification.appointment) {
      return false;
    }

    const createdDateValue = formatDateValueInTimeZone(
      notification.createdAt,
      authContext.clinic.timezone,
    );

    if (filters.from && createdDateValue < filters.from) {
      return false;
    }

    if (filters.to && createdDateValue > filters.to) {
      return false;
    }

    if (normalizedSearch && !buildSearchIndex(notification).includes(normalizedSearch)) {
      return false;
    }

    return true;
  });

  const totalResults = filteredNotifications.length;
  const totalPages = totalResults ? Math.ceil(totalResults / filters.limit) : 1;
  const currentPage = Math.min(filters.page, totalPages);
  const startIndex = (currentPage - 1) * filters.limit;
  const pageNotifications = filteredNotifications.slice(
    startIndex,
    startIndex + filters.limit,
  );
  const pendingCount = allNotifications.filter(
    (notification) => notification.status === NotificationStatus.PENDING,
  ).length;
  const sentCount = allNotifications.filter(
    (notification) => notification.status === NotificationStatus.SENT,
  ).length;
  const failedCount = allNotifications.filter(
    (notification) => notification.status === NotificationStatus.FAILED,
  ).length;
  const cancelledCount = allNotifications.filter(
    (notification) => notification.status === NotificationStatus.CANCELLED,
  ).length;

  const listPath = buildNotificationsPath({
    ...filters,
    page: currentPage,
    detailsId: "",
  });
  const cleanPath = buildNotificationsPath({
    ...filters,
    scope: "clean",
    page: 1,
    detailsId: "",
  });
  const historyPath = buildNotificationsPath({
    ...filters,
    scope: "all",
    page: 1,
    detailsId: "",
  });
  const previousPagePath =
    currentPage > 1
      ? buildNotificationsPath({
          ...filters,
          page: currentPage - 1,
          detailsId: "",
        })
      : null;
  const nextPagePath =
    currentPage < totalPages
      ? buildNotificationsPath({
          ...filters,
          page: currentPage + 1,
          detailsId: "",
        })
      : null;
  const advancedFiltersOpen = Boolean(
    filters.filterTemplate ||
      filters.from ||
      filters.to ||
      filters.onlyWithAppointment ||
      filters.onlyFailed,
  );
  const selectedNotification = filters.detailsId
    ? filteredNotifications.find((notification) => notification.id === filters.detailsId) ??
      null
    : null;
  const pendingFilteredIds = filteredNotifications
    .filter((notification) => notification.status === NotificationStatus.PENDING)
    .map((notification) => notification.id);
  const actionableFilteredIds = filteredNotifications
    .filter(
      (notification) =>
        notification.status === NotificationStatus.PENDING ||
        notification.status === NotificationStatus.FAILED,
    )
    .map((notification) => notification.id);
  const failedFilteredIds = filteredNotifications
    .filter((notification) => notification.status === NotificationStatus.FAILED)
    .map((notification) => notification.id);

  return (
    <PanelPage
      eyebrow="Notificaciones"
      title="Notificaciones"
      description="Mensajes preparados para email y WhatsApp."
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <StatusPill className="border-amber-200 bg-amber-100 text-amber-700">
            Pendientes {pendingCount}
          </StatusPill>
          <StatusPill className="border-emerald-200 bg-emerald-100 text-emerald-700">
            Enviadas {sentCount}
          </StatusPill>
          <StatusPill className="border-rose-200 bg-rose-100 text-rose-700">
            Fallidas {failedCount}
          </StatusPill>
          <StatusPill className="border-slate-200 bg-slate-100 text-slate-700">
            Canceladas {cancelledCount}
          </StatusPill>
          <StatusPill className="border-line/80 bg-white text-ink">
            {emailConfig.isConfigured
              ? "Email listo para prueba manual"
              : "Email real pendiente de configuración"}
          </StatusPill>
          <StatusPill className="border-line/80 bg-white text-ink">
            {metaConfig.isConfigured
              ? "WhatsApp listo para prueba manual"
              : "WhatsApp real pendiente de configuración"}
          </StatusPill>
        </div>

        {flash ? (
          <div
            className={
              flash.tone === "success"
                ? "rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
                : "rounded-[22px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
            }
          >
            {flash.message}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-line/80 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={cleanPath}
                  className={
                    filters.scope === "clean"
                      ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  }
                >
                  Bandeja limpia
                </Link>
                <Link
                  href={historyPath}
                  className={
                    filters.scope === "all"
                      ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                  }
                >
                  Todo el historial
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusPill className="border-line/80 bg-white text-ink">
                  Mostrando {pageNotifications.length} de {totalResults}
                </StatusPill>
                <BulkActionsMenu
                  redirectPath={listPath}
                  pendingFilteredIds={pendingFilteredIds}
                  actionableFilteredIds={actionableFilteredIds}
                  failedFilteredIds={failedFilteredIds}
                />
              </div>
            </div>

            <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(7rem,8rem)_auto]">
              <input type="hidden" name="scope" value={filters.scope} />

              <label className="text-sm font-semibold text-ink">
                Estado
                <select
                  name="filterStatus"
                  defaultValue={filters.filterStatus}
                  className={appointmentFieldClassName}
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
                  defaultValue={filters.filterChannel}
                  className={appointmentFieldClassName}
                >
                  <option value="">Todos</option>
                  {Object.values(NotificationChannel).map((channel) => (
                    <option key={channel} value={channel}>
                      {getChannelLabel(channel)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-ink">
                Buscar
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.queryText}
                  placeholder="Destinatario, cliente o reserva"
                  className={appointmentFieldClassName}
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Mostrar
                <select
                  name="limit"
                  defaultValue={String(filters.limit)}
                  className={appointmentFieldClassName}
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center self-end rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Aplicar
              </button>

              <details
                open={advancedFiltersOpen}
                className="lg:col-span-5 rounded-[22px] border border-line/80 bg-surface-soft/70 px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
                  Filtros avanzados
                </summary>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
                  <label className="text-sm font-semibold text-ink">
                    Template
                    <select
                      name="filterTemplate"
                      defaultValue={filters.filterTemplate}
                      className={appointmentFieldClassName}
                    >
                      <option value="">Todos</option>
                      {notificationTemplateKeys.map((templateKey) => (
                        <option key={templateKey} value={templateKey}>
                          {resolveTemplateLabel(templateKey)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-ink">
                    Desde
                    <input
                      type="date"
                      name="from"
                      defaultValue={filters.from}
                      className={appointmentFieldClassName}
                    />
                  </label>

                  <label className="text-sm font-semibold text-ink">
                    Hasta
                    <input
                      type="date"
                      name="to"
                      defaultValue={filters.to}
                      className={appointmentFieldClassName}
                    />
                  </label>

                  <div className="flex flex-col justify-center gap-3 rounded-[18px] border border-line/80 bg-white px-4 py-3 text-sm text-ink">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="withAppointment"
                        value="1"
                        defaultChecked={filters.onlyWithAppointment}
                        className="h-4 w-4 rounded border-line/80 text-brand-600 focus:ring-brand-200"
                      />
                      Solo con reserva
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="onlyFailed"
                        value="1"
                        defaultChecked={filters.onlyFailed}
                        className="h-4 w-4 rounded border-line/80 text-brand-600 focus:ring-brand-200"
                      />
                      Solo fallidas
                    </label>
                  </div>
                </div>
              </details>
            </form>
          </div>
        </section>

        {pageNotifications.length ? (
          <section className="overflow-hidden rounded-[24px] border border-line/80 bg-white shadow-soft">
            <div className="divide-y divide-line/70">
              {pageNotifications.map((notification) => {
                const appointment = notification.appointment;
                const canSendWhatsApp =
                  notification.channel === NotificationChannel.WHATSAPP &&
                  notification.status === NotificationStatus.PENDING;
                const canSendEmail =
                  notification.channel === NotificationChannel.EMAIL &&
                  notification.status === NotificationStatus.PENDING;
                const canArchive =
                  notification.status === NotificationStatus.PENDING ||
                  notification.status === NotificationStatus.FAILED;
                const detailPath = buildNotificationsPath({
                  ...filters,
                  page: currentPage,
                  detailsId: notification.id,
                });

                return (
                  <article key={notification.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill className={getChannelClassName(notification.channel)}>
                            {getChannelLabel(notification.channel)}
                          </StatusPill>
                          <StatusPill className={getStatusClassName(notification.status)}>
                            {getStatusLabel(notification.status)}
                          </StatusPill>
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                            {resolveTemplateLabel(notification.templateKey)}
                          </p>
                          <p className="text-xs font-medium text-muted">
                            {formatInboxDateTime(
                              notification.createdAt,
                              authContext.clinic.timezone,
                            )}
                          </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          <span className="min-w-0 truncate">
                            {buildSecondarySummary(notification) || "Sin detalles adicionales"}
                          </span>
                          <span className="hidden text-muted sm:inline">·</span>
                          <Link
                            href={detailPath}
                            className="font-semibold text-brand-700 transition hover:text-brand-800"
                          >
                            Ver detalles
                          </Link>
                          {appointment ? (
                            <>
                              <span className="hidden text-muted sm:inline">·</span>
                              <span className="truncate">
                                {appointment.status === AppointmentStatus.CANCELLED
                                  ? "Reserva cancelada"
                                  : appointment.service.name}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="w-full shrink-0 lg:w-auto">
                        {canSendWhatsApp ? (
                          metaConfig.isConfigured ? (
                            <InlineActionForm
                              action={sendWhatsAppNotificationAction}
                              notificationId={notification.id}
                              redirectPath={listPath}
                              label="Enviar WhatsApp"
                              tone="whatsapp"
                            />
                          ) : (
                            <button
                              type="button"
                              disabled
                              className={`${actionButtonClassName("whatsapp")} w-full sm:w-auto`}
                            >
                              Configurar Meta
                            </button>
                          )
                        ) : canSendEmail ? (
                          emailConfig.isConfigured ? (
                            <InlineActionForm
                              action={sendEmailNotificationAction}
                              notificationId={notification.id}
                              redirectPath={listPath}
                              label="Probar email"
                              tone="sent"
                            />
                          ) : (
                            <button
                              type="button"
                              disabled
                              className={`${actionButtonClassName("sent")} w-full sm:w-auto`}
                            >
                              Configurar email
                            </button>
                          )
                        ) : canArchive ? (
                          <InlineActionForm
                            action={cancelNotificationAction}
                            notificationId={notification.id}
                            redirectPath={listPath}
                            label="Cancelar"
                            tone="archive"
                          />
                        ) : (
                          <Link
                            href={detailPath}
                            className={`${actionButtonClassName("archive")} inline-flex w-full items-center justify-center sm:w-auto`}
                          >
                            Ver detalles
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <EmptyState
            title={
              filters.scope === "clean"
                ? "Bandeja limpia."
                : "Aún no hay notificaciones para este filtro."
            }
            description="Ajusta filtros o crea una reserva para poblar esta cola."
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Página {currentPage} de {totalPages}
          </p>

          <div className="flex flex-wrap gap-2">
            {previousPagePath ? (
              <Link
                href={previousPagePath}
                className="inline-flex h-11 items-center justify-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
              >
                Anterior
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-full border border-line/80 bg-surface-soft px-4 text-sm font-semibold text-muted">
                Anterior
              </span>
            )}

            {nextPagePath ? (
              <Link
                href={nextPagePath}
                className="inline-flex h-11 items-center justify-center rounded-full border border-line/80 bg-white px-4 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
              >
                Siguiente
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-full border border-line/80 bg-surface-soft px-4 text-sm font-semibold text-muted">
                Siguiente
              </span>
            )}
          </div>
        </div>
      </div>

      {selectedNotification ? (
        <NotificationDetailDrawer
          notification={selectedNotification}
          timezone={authContext.clinic.timezone}
          redirectPath={listPath}
          closePath={listPath}
          metaConfig={metaConfig}
          emailConfig={emailConfig}
        />
      ) : null}
    </PanelPage>
  );
}
