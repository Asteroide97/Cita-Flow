import Link from "next/link";

import { PanelPage } from "@/components/app/panel-page";
import { ReportDailyTable } from "@/components/reports/report-daily-table";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportMetricCard } from "@/components/reports/report-metric-card";
import { ReportRankingTable } from "@/components/reports/report-ranking-table";
import { requireAuthContext } from "@/lib/auth/session";
import {
  formatReportPercentage,
  getReportsOverview,
  resolveReportFilters,
} from "@/lib/reports/overview";
import { prisma } from "@/lib/prisma";
import type {
  ReportDoctorOption,
  ReportServiceOption,
  ReportsPageSearchParams,
} from "@/types/reports";

type ReportsPageProps = {
  searchParams: Promise<ReportsPageSearchParams>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);

  const [doctors, services] = await Promise.all([
    prisma.doctor.findMany({
      where: {
        clinicId: authContext.clinic.id,
      },
      orderBy: [{ isActive: "desc" }, { publicOrder: "asc" }, { name: "asc" }],
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
      orderBy: [{ isActive: "desc" }, { publicOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        isActive: true,
      },
    }),
  ]);

  const doctorOptions = doctors satisfies ReportDoctorOption[];
  const serviceOptions = services satisfies ReportServiceOption[];
  const rawFilters = resolveReportFilters({
    timezone: authContext.clinic.timezone,
    from: query.from,
    to: query.to,
    doctorId: query.doctorId,
    serviceId: query.serviceId,
  });
  const selectedDoctor =
    doctorOptions.find((doctor) => doctor.id === rawFilters.doctorId) ?? null;
  const selectedService =
    serviceOptions.find((service) => service.id === rawFilters.serviceId) ?? null;
  const filters = {
    ...rawFilters,
    doctorId: selectedDoctor?.id ?? "",
    serviceId: selectedService?.id ?? "",
  };
  const report = await getReportsOverview({
    clinicId: authContext.clinic.id,
    timezone: authContext.clinic.timezone,
    filters,
  });

  const quickLinks = [
    {
      label: "Ver agenda",
      href: `/app/calendar?view=day&date=${report.dateRange.to}`,
      note: "Abrir la agenda operativa del negocio.",
    },
    {
      label: "Ver reservas",
      href: "/app/appointments",
      note: "Revisar y accionar sobre reservas reales.",
    },
    {
      label: "Ver clientes",
      href: "/app/patients",
      note: "Entrar a la base de clientes del negocio.",
    },
  ];

  const metrics = [
    {
      label: "Total de reservas",
      value: String(report.metrics.totalReservations),
      note: "Reservas encontradas dentro del rango filtrado.",
      tone: "brand" as const,
    },
    {
      label: "Confirmadas",
      value: String(report.metrics.confirmedCount),
      note: "Reservas confirmadas para el rango actual.",
      tone: "emerald" as const,
    },
    {
      label: "Pendientes",
      value: String(report.metrics.pendingCount),
      note: "Reservas que aun requieren confirmacion.",
      tone: "amber" as const,
    },
    {
      label: "Canceladas",
      value: String(report.metrics.cancelledCount),
      note: "Reservas canceladas dentro del periodo.",
      tone: "slate" as const,
    },
    {
      label: "Completadas",
      value: String(report.metrics.completedCount),
      note: "Reservas atendidas y cerradas.",
      tone: "brand" as const,
    },
    {
      label: "No-show",
      value: String(report.metrics.noShowCount),
      note: "Clientes que no asistieron al horario reservado.",
      tone: "amber" as const,
    },
    {
      label: "Clientes nuevos",
      value: String(report.metrics.newClientsCount),
      note: "Clientes creados durante el rango seleccionado.",
      tone: "emerald" as const,
    },
    {
      label: "Tasa de cancelacion",
      value: formatReportPercentage(report.metrics.cancellationRate),
      note: "Canceladas sobre el total de reservas del reporte.",
      tone: "slate" as const,
    },
    {
      label: "Tasa de no-show",
      value: formatReportPercentage(report.metrics.noShowRate),
      note: "No-show sobre el total de reservas del reporte.",
      tone: "amber" as const,
    },
  ];

  return (
    <PanelPage
      eyebrow="Reportes"
      title="Desempeno del negocio"
      description="Consulta el comportamiento de reservas, clientes, servicios y profesionales con filtros simples y sin depender de herramientas externas."
    >
      <div className="grid gap-6">
        <ReportFilters
          doctors={doctorOptions}
          services={serviceOptions}
          values={filters}
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <ReportMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              note={metric.note}
              tone={metric.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <ReportDailyTable rows={report.reservationsByDay} />

          <section className="grid gap-6 self-start xl:sticky xl:top-6">
            <article className="surface-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Resumen aplicado
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
                {report.dateRange.fromLabel} - {report.dateRange.toLabel}
              </h2>
              <div className="mt-6 grid gap-4">
                <div className="rounded-[24px] border border-line/80 bg-white/92 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Profesional
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {selectedDoctor
                      ? `${selectedDoctor.name}${selectedDoctor.specialty ? ` - ${selectedDoctor.specialty}` : ""}`
                      : "Todos los profesionales"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-line/80 bg-white/92 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Servicio
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {selectedService ? selectedService.name : "Todos los servicios"}
                  </p>
                </div>
                <div className="rounded-[24px] border border-line/80 bg-white/92 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Negocio actual
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {authContext.clinic.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Todos los datos del reporte se limitan al tenant actual y respetan
                    la zona horaria del negocio.
                  </p>
                </div>
              </div>
            </article>

            <article className="surface-card p-6 sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Acciones rapidas
              </p>
              <div className="mt-6 grid gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-[24px] border border-line/80 bg-white/92 px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                  </Link>
                ))}
              </div>
            </article>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <ReportRankingTable
            eyebrow="Servicios"
            title="Servicios mas reservados"
            emptyMessage="No hay reservas para servicios dentro de este rango."
            rows={report.topServices}
            timezone={authContext.clinic.timezone}
          />
          <ReportRankingTable
            eyebrow="Profesionales"
            title="Profesionales con mas reservas"
            emptyMessage="No hay reservas asignadas a profesionales en este rango."
            rows={report.topProfessionals}
            timezone={authContext.clinic.timezone}
          />
        </div>

        <ReportRankingTable
          eyebrow="Clientes"
          title="Clientes con mas reservas"
          emptyMessage="No hay clientes con reservas dentro de este rango."
          rows={report.topClients}
          timezone={authContext.clinic.timezone}
        />
      </div>
    </PanelPage>
  );
}
