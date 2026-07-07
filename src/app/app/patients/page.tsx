import Link from "next/link";
import { AppointmentStatus } from "@prisma/client";

import { PanelPage } from "@/components/app/panel-page";
import {
  formatDateTimeInTimeZone,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatAppointmentPhone } from "@/components/appointments/appointment-helpers";

import {
  getPatientGeneralStatusClassName,
  getPatientGeneralStatusLabel,
  isPatientUpcomingAppointment,
  patientFieldClassName,
} from "./helpers";

type PatientsPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
};

type PatientFilter = "all" | "with-upcoming" | "without-upcoming";

function normalizeFilter(value?: string): PatientFilter {
  switch (value) {
    case "with-upcoming":
    case "without-upcoming":
      return value;
    default:
      return "all";
  }
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);
  const searchValue = String(query.q ?? "").trim();
  const filter = normalizeFilter(query.filter);
  const now = new Date();
  const patients = await prisma.patient.findMany({
    where: {
      clinicId: authContext.clinic.id,
      ...(searchValue
        ? {
            OR: [
              {
                name: {
                  contains: searchValue,
                  mode: "insensitive",
                },
              },
              {
                phoneE164: {
                  contains: searchValue,
                },
              },
              {
                email: {
                  contains: searchValue,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      phoneE164: true,
      email: true,
      appointments: {
        orderBy: {
          startAt: "desc",
        },
        select: {
          id: true,
          startAt: true,
          status: true,
        },
      },
    },
  });

  const patientSummaries = patients
    .map((patient) => {
      const nextAppointment =
        [...patient.appointments]
          .filter((appointment) => isPatientUpcomingAppointment(appointment, now))
          .sort((left, right) => left.startAt.getTime() - right.startAt.getTime())[0] ??
        null;
      const lastAppointment =
        patient.appointments.find((appointment) => appointment.startAt < now) ?? null;
      const hasUpcomingReservation = Boolean(nextAppointment);

      return {
        ...patient,
        reservationCount: patient.appointments.length,
        nextAppointment,
        lastAppointment,
        hasUpcomingReservation,
      };
    })
    .filter((patient) => {
      if (filter === "with-upcoming") {
        return patient.hasUpcomingReservation;
      }

      if (filter === "without-upcoming") {
        return !patient.hasUpcomingReservation;
      }

      return true;
    })
    .sort((left, right) => {
      if (left.nextAppointment && right.nextAppointment) {
        return left.nextAppointment.startAt.getTime() - right.nextAppointment.startAt.getTime();
      }

      if (left.nextAppointment) {
        return -1;
      }

      if (right.nextAppointment) {
        return 1;
      }

      return left.name.localeCompare(right.name, "es-MX");
    });

  const totalPatients = patients.length;
  const upcomingPatientsCount = patients.filter((patient) =>
    patient.appointments.some((appointment) =>
      isPatientUpcomingAppointment(appointment, now),
    ),
  ).length;
  const inactivePatientsCount = totalPatients - upcomingPatientsCount;

  return (
    <PanelPage
      eyebrow="Clientes"
      title="Clientes"
      description="Lista real de clientes y su actividad."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Clientes totales
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {totalPatients}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Registrados por reservas, lista de espera o panel.
          </p>
        </article>

        <article className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Con reservas proximas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {upcomingPatientsCount}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Clientes con al menos una reserva pendiente o confirmada.
          </p>
        </article>

        <article className="surface-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
            Sin reservas proximas
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-ink">
            {inactivePatientsCount}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Clientes que hoy no tienen horarios futuros activos.
          </p>
        </article>
      </div>

      <section className="mt-8 surface-card p-6 sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              Filtros
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              Busca por nombre, telefono o email y filtra segun actividad proxima.
            </p>
          </div>

          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="text-sm font-semibold text-ink">
              Buscar cliente
              <input
                type="search"
                name="q"
                defaultValue={searchValue}
                className={patientFieldClassName}
                placeholder="Nombre, telefono o email"
              />
            </label>

            <label className="text-sm font-semibold text-ink">
              Estado
              <select
                name="filter"
                defaultValue={filter}
                className={patientFieldClassName}
              >
                <option value="all">Todos</option>
                <option value="with-upcoming">Con reservas proximas</option>
                <option value="without-upcoming">Sin reservas proximas</option>
              </select>
            </label>

            <div className="flex flex-col gap-3 self-end sm:flex-row">
              <button
                type="submit"
                className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                Filtrar
              </button>

              {(searchValue || filter !== "all") ? (
                <Link
                  href="/app/patients"
                  className="inline-flex w-full items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700"
                >
                  Limpiar
                </Link>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <section className="mt-8 grid gap-4">
        {patientSummaries.length ? (
          patientSummaries.map((patient) => (
            <article key={patient.id} className="surface-card p-6 sm:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold tracking-[-0.04em] text-ink sm:text-2xl">
                      {patient.name}
                    </h2>
                    <span
                      className={getPatientGeneralStatusClassName(
                        patient.hasUpcomingReservation,
                      )}
                    >
                      {getPatientGeneralStatusLabel(patient.hasUpcomingReservation)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 xl:grid-cols-3">
                    <p>{formatAppointmentPhone(patient.phoneE164)}</p>
                    <p>{patient.email ?? "Sin email registrado"}</p>
                    <p>
                      {patient.reservationCount} reserva
                      {patient.reservationCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/app/patients/${patient.id}`}
                  className="inline-flex w-full items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:text-brand-700 sm:w-auto"
                >
                  Ver detalle
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-line/80 bg-surface-soft p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Ultima reserva
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    {patient.lastAppointment
                      ? formatDateTimeInTimeZone(
                          patient.lastAppointment.startAt,
                          authContext.clinic.timezone,
                        )
                      : "Sin historial todavia"}
                  </p>
                </div>

                <div className="rounded-[24px] border border-line/80 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Proxima reserva
                  </p>
                  <p className="mt-3 text-sm font-semibold text-ink">
                    {patient.nextAppointment
                      ? formatDateTimeInTimeZone(
                          patient.nextAppointment.startAt,
                          authContext.clinic.timezone,
                        )
                      : "Sin reservas proximas"}
                  </p>
                  {patient.nextAppointment ? (
                    <p className="mt-2 text-xs text-muted">
                      Estado:{" "}
                      {patient.nextAppointment.status === AppointmentStatus.PENDING
                        ? "Pendiente"
                        : "Confirmada"}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <article className="surface-card p-7 text-sm text-muted">
            {searchValue || filter !== "all"
              ? "No encontramos clientes que coincidan con esos filtros."
              : "Todavia no hay clientes registrados en este negocio."}
          </article>
        )}
      </section>
    </PanelPage>
  );
}
