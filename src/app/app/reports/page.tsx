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

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-line/80 bg-white/92 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

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
    },
    {
      label: "Ver reservas",
      href: "/app/appointments",
    },
    {
      label: "Ver clientes",
      href: "/app/patients",
    },
  ];

  const metrics = [
    {
      label: "Total de reservas",
      value: String(report.metrics.totalReservations),
      note: "Rango filtrado",
      tone: "brand" as const,
    },
    {
      label: "Confirmadas",
      value: String(report.metrics.confirmedCount),
      note: "Estado confirmado",
      tone: "emerald" as const,
    },
    {
      label: "Pendientes",
      value: String(report.metrics.pendingCount),
      note: "Por confirmar",
      tone: "amber" as const,
    },
    {
      label: "Canceladas",
      value: String(report.metrics.cancelledCount),
      note: "Estado cancelado",
      tone: "slate" as const,
    },
    {
      label: "Completadas",
      value: String(report.metrics.completedCount),
      note: "Atendidas",
      tone: "brand" as const,
    },
    {
      label: "No-show",
      value: String(report.metrics.noShowCount),
      note: "No asistieron",
      tone: "amber" as const,
    },
    {
      label: "Clientes nuevos",
      value: String(report.metrics.newClientsCount),
      note: "Creados en el rango",
      tone: "emerald" as const,
    },
    {
      label: "Tasa de cancelacion",
      value: formatReportPercentage(report.metrics.cancellationRate),
      note: "Sobre total",
      tone: "slate" as const,
    },
    {
      label: "Tasa de no-show",
      value: formatReportPercentage(report.metrics.noShowRate),
      note: "Sobre total",
      tone: "amber" as const,
    },
  ];

  return (
    <PanelPage
      eyebrow="Reportes"
      title="Desempeno del negocio"
      description="Resumen de reservas, clientes y servicios."
    >
      <div className="grid gap-6">
        <ReportFilters
          doctors={doctorOptions}
          services={serviceOptions}
          values={filters}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
            <article className="surface-card p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Resumen
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-ink">
                {report.dateRange.fromLabel} - {report.dateRange.toLabel}
              </h2>
              <div className="mt-5 grid gap-3">
                <SummaryField
                  label="Profesional"
                  value={
                    selectedDoctor
                      ? `${selectedDoctor.name}${selectedDoctor.specialty ? ` - ${selectedDoctor.specialty}` : ""}`
                      : "Todos"
                  }
                />
                <SummaryField
                  label="Servicio"
                  value={selectedService ? selectedService.name : "Todos"}
                />
                <SummaryField label="Negocio" value={authContext.clinic.name} />
              </div>
            </article>

            <article className="surface-card p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                Acciones
              </p>
              <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex w-full rounded-full border border-line/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 sm:w-auto"
                  >
                    {item.label}
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
