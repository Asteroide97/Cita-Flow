import { OnboardingChecklist } from "@/components/app/onboarding-checklist";
import { OperationalStatus } from "@/components/app/operational-status";
import { MetricCard } from "@/components/app/metric-card";
import { PanelPage } from "@/components/app/panel-page";
import { dashboardMetrics } from "@/data/panel";
import { brand } from "@/lib/brand";
import { getOperationalStatus } from "@/lib/dashboard/operational-status";
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
      description="Este dashboard inicial ya corre sobre sesion real y deja lista la base del SaaS para conectar datos operativos por tenant sin afectar la landing publica."
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
        <div className="surface-card p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Operacion del dia
          </p>
          <div className="mt-6 grid gap-4">
            {[
              "2 reservas en estado PENDING listas para confirmar.",
              "1 profesional con agenda completa por la tarde.",
              "Recordatorios y pagos quedaran conectados en fases posteriores.",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-[24px] border border-line/80 bg-surface-soft p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-ink">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Negocio actual
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-brand-100 bg-brand-50 p-5">
              <p className="text-sm font-semibold text-brand-700">{clinic.clinicName}</p>
              <p className="mt-3 text-sm leading-7 text-ink">
                El tenant ya se resuelve desde la sesion activa del usuario y mantiene
                aislados los datos del negocio actual.
              </p>
            </div>

            <div className="rounded-[24px] border border-line/80 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Siguiente paso tecnico</p>
              <p className="mt-3 text-sm leading-7 text-muted">
                Conectar queries, CRUD y permisos por rol para que cada modulo opere
                sobre datos reales de la cuenta actual.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PanelPage>
  );
}
