import { Prisma } from "@prisma/client";

import { resolveAppointmentsFlashMessage } from "@/components/appointments/appointment-helpers";
import { PanelPage } from "@/components/app/panel-page";
import { CalendarAppointmentDetails } from "@/components/calendar/calendar-appointment-details";
import { CalendarDayView } from "@/components/calendar/calendar-day-view";
import {
  buildCalendarDateValue,
  buildCalendarDays,
  buildCalendarPath,
  buildCalendarRangeBounds,
  buildCalendarRangeLabel,
  getCurrentCalendarDateParts,
  resolveCalendarDateParts,
  resolveCalendarViewMode,
  shiftCalendarDateParts,
} from "@/components/calendar/calendar-helpers";
import { CalendarQuickCreateForm } from "@/components/calendar/calendar-quick-create-form";
import { CalendarStatusLegend } from "@/components/calendar/calendar-status-legend";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import {
  buildClinicDateMarker,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type {
  CalendarDoctorOption,
  CalendarPageSearchParams,
} from "@/types/calendar";

import {
  createAdminAppointmentAction,
  rescheduleAdminAppointmentAction,
  updateAppointmentStatusAction,
} from "../appointments/actions";

type CalendarPageProps = {
  searchParams: Promise<CalendarPageSearchParams>;
};

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

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const [authContext, query] = await Promise.all([
    requireAuthContext(),
    searchParams,
  ]);

  const timezone = authContext.clinic.timezone;
  const currency = authContext.clinic.currency;
  const view = resolveCalendarViewMode(query.view?.trim());
  const selectedDateParts = resolveCalendarDateParts(query.date?.trim(), timezone);
  const selectedDateValue = buildCalendarDateValue(selectedDateParts);
  const selectedDoctorId = query.doctorId?.trim() ?? "";
  const selectedAppointmentId = query.appointmentId?.trim() ?? "";
  const currentDoctorFilter = selectedDoctorId || undefined;

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
      orderBy: [{ isActive: "desc" }, { publicOrder: "asc" }, { name: "asc" }],
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

  const doctorOptions = doctors satisfies CalendarDoctorOption[];
  const activeDoctors = doctorOptions.filter((doctor) => doctor.isActive);
  const activeServices = services.filter((service) => service.isActive);
  const selectedDoctor =
    doctorOptions.find((doctor) => doctor.id === selectedDoctorId) ?? null;
  const days = buildCalendarDays(view, selectedDateParts, timezone);
  const rangeLabel = buildCalendarRangeLabel(view, days, timezone);
  const bounds = buildCalendarRangeBounds(view, selectedDateParts, timezone);

  const appointmentWhere: Prisma.AppointmentWhereInput = {
    clinicId: authContext.clinic.id,
    startAt: {
      lt: bounds.endAt,
    },
    endAt: {
      gt: bounds.startAt,
    },
  };

  if (currentDoctorFilter) {
    appointmentWhere.doctorId = currentDoctorFilter;
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

  const selectedAppointment =
    appointments.find((appointment) => appointment.id === selectedAppointmentId) ??
    null;
  const selectedDay = days.find((day) => day.isSelected) ?? days[0];
  const flash = resolveAppointmentsFlashMessage(query.status, query.error);
  const todayDateValue = buildCalendarDateValue(
    getCurrentCalendarDateParts(timezone),
  );
  const previousDateValue = buildCalendarDateValue(
    shiftCalendarDateParts(selectedDateParts, view === "day" ? -1 : -7),
  );
  const nextDateValue = buildCalendarDateValue(
    shiftCalendarDateParts(selectedDateParts, view === "day" ? 1 : 7),
  );

  const selectedCreateDoctorId =
    query.createDoctorId?.trim() ||
    selectedDoctorId ||
    activeDoctors[0]?.id ||
    doctorOptions[0]?.id ||
    "";
  const selectedCreateServiceId =
    query.createServiceId?.trim() || activeServices[0]?.id || services[0]?.id || "";
  const selectedCreateDate = query.createDate?.trim() || selectedDateValue;
  const selectedCreateSlotTime = query.createSlotTime?.trim() ?? "";
  const selectedCreateDateParts = selectedCreateDate
    ? parseIsoDateInput(selectedCreateDate)
    : null;
  const selectedCreateDoctor =
    doctorOptions.find((doctor) => doctor.id === selectedCreateDoctorId) ?? null;
  const selectedCreateService =
    services.find((service) => service.id === selectedCreateServiceId) ?? null;

  const quickCreateAvailableSlotResult =
    selectedCreateDoctorId && selectedCreateServiceId && selectedCreateDateParts
      ? await getAvailableSlots({
          clinicId: authContext.clinic.id,
          doctorId: selectedCreateDoctorId,
          serviceId: selectedCreateServiceId,
          date: buildClinicDateMarker(selectedCreateDateParts, timezone),
        })
      : null;

  const dayViewDoctors =
    view === "day"
      ? selectedDoctor
        ? [selectedDoctor]
        : doctorOptions.filter(
            (doctor) =>
              doctor.isActive ||
              appointments.some((appointment) => appointment.doctor.id === doctor.id),
          )
      : [];

  const availableSlotsByDoctorId =
    view === "day" && selectedCreateService
      ? Object.fromEntries(
          await Promise.all(
            dayViewDoctors.map(async (doctor) => {
              const slotResult = await getAvailableSlots({
                clinicId: authContext.clinic.id,
                doctorId: doctor.id,
                serviceId: selectedCreateService.id,
                date: buildClinicDateMarker(selectedDateParts, timezone),
              });

              const slotLinks = slotResult.slots.map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                href: `${buildCalendarPath({
                  view: "day",
                  date: selectedDateValue,
                  doctorId: currentDoctorFilter,
                  appointmentId: selectedAppointment?.id,
                  createDoctorId: doctor.id,
                  createServiceId: selectedCreateService.id,
                  createDate: selectedDateValue,
                  createSlotTime: slot.startTime,
                })}#calendar-quick-create`,
              }));

              return [doctor.id, slotLinks] as const;
            }),
          ),
        )
      : {};
  const createLinksByDoctorId =
    view === "day"
      ? Object.fromEntries(
          dayViewDoctors.map((doctor) => [
            doctor.id,
            `${buildCalendarPath({
              view: "day",
              date: selectedDateValue,
              doctorId: currentDoctorFilter,
              appointmentId: selectedAppointment?.id,
              createDoctorId: doctor.id,
              createServiceId: selectedCreateServiceId || undefined,
              createDate: selectedDateValue,
            })}#calendar-quick-create`,
          ]),
        )
      : {};

  const rescheduleOpen =
    Boolean(selectedAppointment) &&
    query.rescheduleAppointmentId?.trim() === selectedAppointment?.id;
  const rescheduleDateValue = selectedAppointment
    ? query.rescheduleDate?.trim() ||
      formatDateValueInTimeZone(selectedAppointment.startAt, timezone)
    : "";
  const rescheduleSlotTime = query.rescheduleSlotTime?.trim() ?? "";
  const rescheduleDateParts = rescheduleDateValue
    ? parseIsoDateInput(rescheduleDateValue)
    : null;
  const rescheduleAvailableSlotResult =
    rescheduleOpen && selectedAppointment && rescheduleDateParts
      ? await getAvailableSlots({
          clinicId: authContext.clinic.id,
          doctorId: selectedAppointment.doctor.id,
          serviceId: selectedAppointment.service.id,
          date: buildClinicDateMarker(rescheduleDateParts, timezone),
          excludeAppointmentId: selectedAppointment.id,
        })
      : null;

  const baseCalendarHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    createDoctorId: selectedCreateDoctorId || undefined,
    createServiceId: selectedCreateServiceId || undefined,
    createDate: selectedCreateDate || undefined,
    createSlotTime: selectedCreateSlotTime || undefined,
  });
  const detailRedirectPath = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    appointmentId: selectedAppointment?.id,
    createDoctorId: selectedCreateDoctorId || undefined,
    createServiceId: selectedCreateServiceId || undefined,
    createDate: selectedCreateDate || undefined,
    createSlotTime: selectedCreateSlotTime || undefined,
    rescheduleAppointmentId: rescheduleOpen ? selectedAppointment?.id : undefined,
    rescheduleDate: rescheduleOpen ? rescheduleDateValue : undefined,
    rescheduleSlotTime: rescheduleOpen ? rescheduleSlotTime : undefined,
  });
  const quickCreateSuccessHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    createDoctorId: selectedCreateDoctorId || undefined,
    createServiceId: selectedCreateServiceId || undefined,
    createDate: selectedCreateDate || undefined,
  });
  const rescheduleOpenHref = selectedAppointment
    ? buildCalendarPath({
        view,
        date: selectedDateValue,
        doctorId: currentDoctorFilter,
        appointmentId: selectedAppointment.id,
        createDoctorId: selectedCreateDoctorId || undefined,
        createServiceId: selectedCreateServiceId || undefined,
        createDate: selectedCreateDate || undefined,
        createSlotTime: selectedCreateSlotTime || undefined,
        rescheduleAppointmentId: selectedAppointment.id,
        rescheduleDate:
          rescheduleDateValue ||
          formatDateValueInTimeZone(selectedAppointment.startAt, timezone),
      })
    : baseCalendarHref;

  return (
    <PanelPage
      eyebrow="Agenda"
      title="Agenda visual"
      description="Consulta la agenda diaria o semanal del negocio actual, crea reservas rápidas desde huecos disponibles y ejecuta acciones operativas sin salir de la vista."
    >
      <div className="grid gap-6">
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

        <CalendarToolbar
          view={view}
          dateValue={selectedDateValue}
          doctorId={selectedDoctorId}
          doctors={doctorOptions}
          rangeLabel={rangeLabel}
          timezone={timezone}
          totalAppointments={appointments.length}
          previousHref={buildCalendarPath({
            view,
            date: previousDateValue,
            doctorId: currentDoctorFilter,
          })}
          nextHref={buildCalendarPath({
            view,
            date: nextDateValue,
            doctorId: currentDoctorFilter,
          })}
          todayHref={buildCalendarPath({
            view,
            date: todayDateValue,
            doctorId: currentDoctorFilter,
          })}
          dayHref={buildCalendarPath({
            view: "day",
            date: selectedDateValue,
            doctorId: currentDoctorFilter,
          })}
          weekHref={buildCalendarPath({
            view: "week",
            date: selectedDateValue,
            doctorId: currentDoctorFilter,
          })}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
          <div className="grid gap-6">
            {view === "day" ? (
              <CalendarDayView
                day={selectedDay}
                appointments={appointments}
                timezone={timezone}
                doctorId={selectedDoctorId}
                doctors={dayViewDoctors}
                selectedAppointmentId={selectedAppointment?.id}
                selectedServiceLabel={selectedCreateService?.name ?? null}
                createLinksByDoctorId={createLinksByDoctorId}
                availableSlotsByDoctorId={availableSlotsByDoctorId}
              />
            ) : (
              <CalendarWeekView
                days={days}
                appointments={appointments}
                timezone={timezone}
                doctorId={selectedDoctorId}
                selectedAppointmentId={selectedAppointment?.id}
              />
            )}
          </div>

          <div className="grid gap-6 self-start xl:sticky xl:top-6">
            <CalendarStatusLegend
              totalAppointments={appointments.length}
              rangeLabel={rangeLabel}
              doctorLabel={selectedDoctor?.name ?? null}
            />

            <CalendarQuickCreateForm
              activeDoctors={activeDoctors}
              activeServices={activeServices}
              patients={patients}
              selectedDoctorId={selectedCreateDoctorId}
              selectedServiceId={selectedCreateServiceId}
              selectedDate={selectedCreateDate}
              selectedSlotTime={selectedCreateSlotTime}
              selectedDateParts={selectedCreateDateParts}
              selectedDoctor={selectedCreateDoctor}
              selectedService={selectedCreateService ?? null}
              availableSlotResult={quickCreateAvailableSlotResult}
              timezone={timezone}
              view={view}
              calendarDateValue={selectedDateValue}
              filterDoctorId={selectedDoctorId}
              loadActionPath="/app/calendar"
              createAction={createAdminAppointmentAction}
              redirectPath={detailRedirectPath}
              successRedirectPath={quickCreateSuccessHref}
            />

            <CalendarAppointmentDetails
              appointment={selectedAppointment}
              timezone={timezone}
              currency={currency}
              redirectPath={detailRedirectPath}
              clearSelectionHref={baseCalendarHref}
              action={updateAppointmentStatusAction}
              rescheduleAction={rescheduleAdminAppointmentAction}
              view={view}
              calendarDateValue={selectedDateValue}
              doctorFilterId={selectedDoctorId}
              rescheduleOpen={rescheduleOpen}
              rescheduleDateValue={rescheduleDateValue}
              rescheduleSlotTime={rescheduleSlotTime}
              rescheduleAvailableSlotResult={rescheduleAvailableSlotResult}
              rescheduleOpenHref={rescheduleOpenHref}
            />
          </div>
        </div>
      </div>
    </PanelPage>
  );
}
