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
import { CalendarStatusLegend } from "@/components/calendar/calendar-status-legend";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type {
  CalendarDoctorOption,
  CalendarPageSearchParams,
} from "@/types/calendar";

import { updateAppointmentStatusAction } from "../appointments/actions";

type CalendarPageProps = {
  searchParams: Promise<CalendarPageSearchParams>;
};

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

  const doctors = await prisma.doctor.findMany({
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
  });

  const doctorOptions = doctors satisfies CalendarDoctorOption[];
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
  const baseCalendarHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
  });
  const detailRedirectPath = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    appointmentId: selectedAppointment?.id,
  });

  return (
    <PanelPage
      eyebrow="Agenda"
      title="Agenda visual"
      description="Consulta la agenda diaria o semanal del negocio actual con reservas reales, filtros por profesional y acciones operativas reutilizando las mismas reglas de estado del panel."
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="grid gap-6">
            {view === "day" ? (
              <CalendarDayView
                day={selectedDay}
                appointments={appointments}
                timezone={timezone}
                doctorId={selectedDoctorId}
                selectedAppointmentId={selectedAppointment?.id}
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

            <CalendarAppointmentDetails
              appointment={selectedAppointment}
              timezone={timezone}
              currency={currency}
              redirectPath={detailRedirectPath}
              clearSelectionHref={baseCalendarHref}
              action={updateAppointmentStatusAction}
            />
          </div>
        </div>
      </div>
    </PanelPage>
  );
}
