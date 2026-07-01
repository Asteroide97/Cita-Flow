import { AppointmentStatus, Prisma } from "@prisma/client";

import { AppointmentCreateForm } from "@/components/appointments/appointment-create-form";
import { AppointmentFilters } from "@/components/appointments/appointment-filters";
import {
  resolveAppointmentsFlashMessage,
  appointmentStatusOptions,
  shiftAppointmentDatePartsByOneDay,
} from "@/components/appointments/appointment-helpers";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { AppointmentsOverview } from "@/components/appointments/appointments-overview";
import { PanelPage } from "@/components/app/panel-page";
import {
  buildClinicDateMarker,
  buildClinicDateTime,
  formatDateInTimeZone,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type {
  AppointmentDoctorOption,
  AppointmentFilterValues,
  AppointmentPageSearchParams,
  AppointmentPatientOption,
  AppointmentServiceOption,
  AppointmentSummary,
} from "@/types/appointments";

import {
  createAdminAppointmentAction,
  updateAppointmentStatusAction,
} from "./actions";

type AppointmentsPageProps = {
  searchParams: Promise<AppointmentPageSearchParams>;
};

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

  const doctorOptions = doctors satisfies AppointmentDoctorOption[];
  const serviceOptions = services satisfies AppointmentServiceOption[];
  const patientOptions = patients satisfies AppointmentPatientOption[];
  const activeDoctors = doctorOptions.filter((doctor) => doctor.isActive);
  const activeServices = serviceOptions.filter((service) => service.isActive);

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

  const selectedDoctor =
    doctorOptions.find((doctor) => doctor.id === selectedFormDoctorId) ?? null;
  const selectedService =
    serviceOptions.find((service) => service.id === selectedFormServiceId) ?? null;

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
    appointmentStatusOptions.includes(query.filterStatus as AppointmentStatus)
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
          shiftAppointmentDatePartsByOneDay(filterDateParts),
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

  const todayMarker = buildClinicDateMarker(
    {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    },
    authContext.clinic.timezone,
  );

  const summary: AppointmentSummary = {
    total: appointments.length,
    today: appointments.filter(
      (appointment) =>
        formatDateInTimeZone(appointment.startAt, authContext.clinic.timezone) ===
        formatDateInTimeZone(todayMarker, authContext.clinic.timezone),
    ).length,
    confirmed: appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.CONFIRMED,
    ).length,
    pending: appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.PENDING,
    ).length,
  };

  const flash = resolveAppointmentsFlashMessage(query.status, query.error);
  const filterValues: AppointmentFilterValues = {
    filterDate: query.filterDate ?? "",
    filterDoctorId: query.filterDoctorId ?? "",
    filterStatus: query.filterStatus ?? "",
    filterServiceId: query.filterServiceId ?? "",
  };

  return (
    <PanelPage
      eyebrow="Reservas"
      title="Gestión de reservas"
      description="Crea reservas manuales desde el panel, filtra la agenda del negocio actual y ejecuta acciones seguras sobre cada reserva usando la disponibilidad real del profesional."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(340px,0.96fr)_minmax(0,1.44fr)]">
        <div className="grid gap-6">
          <AppointmentsOverview summary={summary} />

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

          <AppointmentCreateForm
            activeDoctors={activeDoctors}
            activeServices={activeServices}
            patients={patientOptions}
            selectedDoctorId={selectedFormDoctorId}
            selectedServiceId={selectedFormServiceId}
            selectedFormDate={selectedFormDate}
            selectedDateParts={selectedFormDateParts}
            selectedDoctor={selectedDoctor}
            selectedService={selectedService}
            availableSlotResult={availableSlotResult}
            timezone={authContext.clinic.timezone}
            createAction={createAdminAppointmentAction}
          />
        </div>

        <div className="grid gap-6">
          <AppointmentFilters
            doctors={doctorOptions}
            services={serviceOptions}
            values={filterValues}
          />
          <AppointmentList
            appointments={appointments}
            timezone={authContext.clinic.timezone}
            currency={authContext.clinic.currency}
            statusAction={updateAppointmentStatusAction}
          />
        </div>
      </div>
    </PanelPage>
  );
}
