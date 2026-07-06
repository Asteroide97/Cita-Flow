import { DashboardPendingAttention } from "@/components/app/dashboard-pending-attention";
import { DashboardTodayOperations } from "@/components/app/dashboard-today-operations";
import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { OperationalStatus } from "@/components/app/operational-status";
import { MetricCard } from "@/components/app/metric-card";
import { PanelPage } from "@/components/app/panel-page";
import { brand } from "@/lib/brand";
import { getOperationalStatus } from "@/lib/dashboard/operational-status";
import { getDashboardTodayOverview } from "@/lib/dashboard/today-operations";
import { prisma } from "@/lib/prisma";
import { getCurrentClinicContext } from "@/lib/tenant";

export default async function DashboardPage() {
  const clinic = await getCurrentClinicContext();
  const [
    clinicRecord,
    activeServicesCount,
    activeDoctorsCount,
    firstActiveDoctor,
    activeAvailabilityCount,
    operationalStatus,
    todayOverview,
  ] = await Promise.all([
    prisma.clinic.findUnique({
      where: {
        id: clinic.clinicId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        currency: true,
        publicName: true,
      },
    }),
    prisma.service.count({
      where: {
        clinicId: clinic.clinicId,
        isActive: true,
      },
    }),
    prisma.doctor.count({
      where: {
        clinicId: clinic.clinicId,
        isActive: true,
      },
    }),
    prisma.doctor.findFirst({
      where: {
        clinicId: clinic.clinicId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.doctorAvailability.count({
      where: {
        clinicId: clinic.clinicId,
        isActive: true,
      },
    }),
    getOperationalStatus(clinic.clinicId),
    getDashboardTodayOverview(clinic.clinicId),
  ]);

  if (!clinicRecord) {
    throw new Error("No se pudo cargar el negocio actual para el dashboard.");
  }

  const displayName = clinicRecord.publicName?.trim() || clinicRecord.name;
  const bookingPath = `/booking/${clinicRecord.slug}`;
  const publicBookingUrl = new URL(bookingPath, brand.appUrl).toString();
  const hasBusinessIdentity = Boolean(
    displayName.trim() &&
      clinicRecord.slug.trim() &&
      clinicRecord.timezone.trim() &&
      clinicRecord.currency.trim(),
  );
  const todayCalendarHref = `/app/calendar?view=day&date=${todayOverview.today.dateValue}`;
  const pendingAppointmentsHref = "/app/appointments?filterStatus=PENDING";
  const pendingWaitlistHref = "/app/waitlist";
  const pendingNotificationsHref = "/app/notifications";
  const dashboardMetrics = [
    {
      label: "Reservas de hoy",
      value: String(todayOverview.today.totalReservations),
      note: `${todayOverview.today.confirmedCount} confirmadas - ${todayOverview.today.pendingCount} pendientes`,
      tone: "brand" as const,
    },
    {
      label: "Proxima reserva",
      value: todayOverview.today.nextAppointment?.timeLabel ?? "Sin proximas",
      note:
        todayOverview.today.nextAppointment?.summary ??
        "No hay mas reservas activas pendientes para el resto del dia.",
      tone: "emerald" as const,
    },
    {
      label: "Horarios libres hoy",
      value:
        todayOverview.today.remainingSlotsTodayCount === null
          ? "--"
          : String(todayOverview.today.remainingSlotsTodayCount),
      note: todayOverview.today.remainingSlotsTodayNote,
      tone: "amber" as const,
    },
    {
      label: "Pendientes por atender",
      value: String(todayOverview.pending.totalPendingCount),
      note: `${todayOverview.pending.pendingAppointmentsCount} reservas - ${todayOverview.pending.activeWaitlistEntriesCount} lista de espera - ${todayOverview.pending.pendingNotificationsCount} notificaciones`,
      tone: "slate" as const,
    },
  ];

  const onboardingSteps = [
    {
      id: "business-identity",
      title: "Configurar identidad del negocio",
      description:
        "Define el nombre visible, el slug publico, la zona horaria y la moneda para tu pagina de reservas.",
      helperText: hasBusinessIdentity
        ? `${displayName} · ${clinicRecord.timezone} · ${clinicRecord.currency}`
        : "Completa los datos base del negocio antes de compartir el booking.",
      isComplete: hasBusinessIdentity,
      actionHref: "/app/settings",
      actionLabel: "Ir a configuracion",
    },
    {
      id: "services",
      title: "Crear al menos un servicio activo",
      description:
        "Agrega los servicios que podra reservar tu cliente desde la pagina publica.",
      helperText:
        activeServicesCount > 0
          ? `${activeServicesCount} servicio${activeServicesCount === 1 ? "" : "s"} activo${activeServicesCount === 1 ? "" : "s"}`
          : "Todavia no hay servicios activos para ofrecer en el booking.",
      isComplete: activeServicesCount > 0,
      actionHref: "/app/services",
      actionLabel: "Crear servicio",
    },
    {
      id: "professionals",
      title: "Crear al menos un profesional activo",
      description:
        "Registra a las personas que atenderan reservas dentro del negocio.",
      helperText:
        activeDoctorsCount > 0
          ? `${activeDoctorsCount} profesional${activeDoctorsCount === 1 ? "" : "es"} activo${activeDoctorsCount === 1 ? "" : "s"}`
          : "Todavia no hay profesionales activos listos para atender reservas.",
      isComplete: activeDoctorsCount > 0,
      actionHref: "/app/doctors",
      actionLabel: "Crear profesional",
    },
    {
      id: "availability",
      title: "Configurar disponibilidad de al menos un profesional",
      description:
        "Define horarios semanales para que Agenda Viva muestre slots reales en el booking.",
      helperText:
        activeAvailabilityCount > 0
          ? `${activeAvailabilityCount} bloque${activeAvailabilityCount === 1 ? "" : "s"} activo${activeAvailabilityCount === 1 ? "" : "s"} de disponibilidad`
          : firstActiveDoctor
            ? `Configura horarios para ${firstActiveDoctor.name}.`
            : "Primero crea un profesional activo para poder asignarle disponibilidad.",
      isComplete: activeAvailabilityCount > 0,
      actionHref: firstActiveDoctor
        ? `/app/doctors/${firstActiveDoctor.id}/availability`
        : "/app/doctors",
      actionLabel: "Configurar disponibilidad",
    },
    {
      id: "booking-link",
      title: "Copiar o abrir link de booking publico",
      description:
        "Revisa la pagina publica y confirma que el flujo de reservas este listo para compartirse.",
      helperText: clinicRecord.slug.trim()
        ? publicBookingUrl
        : "Necesitas un slug publico para generar el link del booking.",
      isComplete: Boolean(clinicRecord.slug.trim()),
      actionHref: bookingPath,
      actionLabel: "Abrir booking publico",
      actionTarget: "_blank" as const,
    },
  ];

  return (
    <PanelPage
      eyebrow="Dashboard"
      title="Resumen del negocio"
      description="Revisa el estado operativo, la actividad de hoy y los pendientes principales del negocio actual sin salir del panel."
    >
      <OnboardingChecklist
        businessName={displayName}
        bookingUrl={bookingPath}
        steps={onboardingSteps}
      />

      <div className="mt-8">
        <OperationalStatus {...operationalStatus} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            note={metric.note}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <DashboardTodayOperations
          summary={todayOverview.today}
          agendaHref={todayCalendarHref}
        />

        <DashboardPendingAttention
          summary={todayOverview.pending}
          pendingAppointmentsHref={pendingAppointmentsHref}
          waitlistHref={pendingWaitlistHref}
          notificationsHref={pendingNotificationsHref}
        />
      </div>
    </PanelPage>
  );
}
