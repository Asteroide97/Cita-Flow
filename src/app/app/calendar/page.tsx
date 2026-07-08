import Link from "next/link";
import { AppointmentStatus, Prisma } from "@prisma/client";

import { resolveAppointmentsFlashMessage } from "@/components/appointments/appointment-helpers";
import { PanelPage } from "@/components/app/panel-page";
import { CalendarAppointmentDetails } from "@/components/calendar/calendar-appointment-details";
import { CalendarBlockForm } from "@/components/calendar/calendar-block-form";
import { CalendarDayView } from "@/components/calendar/calendar-day-view";
import {
  buildCalendarDateValue,
  buildCalendarDays,
  buildCalendarMonthGrid,
  buildCalendarPath,
  buildCalendarRangeBounds,
  buildCalendarRangeLabel,
  getCurrentCalendarDateParts,
  resolveCalendarDateParts,
  resolveCalendarViewMode,
  shiftCalendarViewDateParts,
} from "@/components/calendar/calendar-helpers";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarQuickCreateForm } from "@/components/calendar/calendar-quick-create-form";
import { CalendarSidePanel } from "@/components/calendar/calendar-side-panel";
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
  CalendarPanelMode,
} from "@/types/calendar";

import {
  cancelCalendarBusinessBlockAction,
  createCalendarBusinessBlockAction,
} from "./actions";
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

function resolveCalendarPageFlash(status?: string, error?: string) {
  if (error) {
    switch (error) {
      case "business-block-invalid":
        return {
          tone: "error" as const,
          message: "Revisa la fecha y el rango del bloqueo antes de guardarlo.",
        };
      case "business-block-too-short":
        return {
          tone: "error" as const,
          message: "El bloqueo debe durar al menos 15 minutos.",
        };
      case "business-block-not-found":
        return {
          tone: "error" as const,
          message: "No encontré ese bloqueo dentro del negocio actual.",
        };
      default:
        return resolveAppointmentsFlashMessage(status, error);
    }
  }

  switch (status) {
    case "business-block-created":
      return {
        tone: "success" as const,
        message: "Horario bloqueado correctamente para todo el negocio.",
      };
    case "business-block-cancelled":
      return {
        tone: "success" as const,
        message: "Bloqueo cancelado correctamente.",
      };
    default:
      return resolveAppointmentsFlashMessage(status, error);
  }
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
  const panelQuery = query.panel?.trim() ?? "";

  const [doctors, services, patients] = await Promise.all([
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
  const selectedDay = buildCalendarDays("day", selectedDateParts, timezone)[0];
  const monthWeeks =
    view === "month" ? buildCalendarMonthGrid(selectedDateParts, timezone) : [];
  const rangeLabel = buildCalendarRangeLabel(
    view,
    days,
    timezone,
    selectedDateParts,
  );
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

  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
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
    }),
    prisma.clinicBlockedTime.findMany({
      where: {
        clinicId: authContext.clinic.id,
        startAt: {
          lt: bounds.endAt,
        },
        endAt: {
          gt: bounds.startAt,
        },
      },
      orderBy: [{ startAt: "asc" }],
      select: {
        id: true,
        startAt: true,
        endAt: true,
        reason: true,
      },
    }),
  ]);

  const selectedAppointment =
    appointments.find((appointment) => appointment.id === selectedAppointmentId) ??
    null;
  const resolvedPanel: CalendarPanelMode | null = selectedAppointment
    ? "appointment"
    : panelQuery === "create" || panelQuery === "block"
      ? panelQuery
      : null;

  const flash = resolveCalendarPageFlash(query.status, query.error);
  const todayDateValue = buildCalendarDateValue(
    getCurrentCalendarDateParts(timezone),
  );
  const previousDateValue = buildCalendarDateValue(
    shiftCalendarViewDateParts(selectedDateParts, view, -1),
  );
  const nextDateValue = buildCalendarDateValue(
    shiftCalendarViewDateParts(selectedDateParts, view, 1),
  );

  const rawCreateDoctorId = query.createDoctorId?.trim() ?? "";
  const rawCreateServiceId = query.createServiceId?.trim() ?? "";
  const rawCreateDate = query.createDate?.trim() ?? "";
  const rawCreateSlotTime = query.createSlotTime?.trim() ?? "";
  const selectedCreateDoctorId =
    activeDoctors.find((doctor) => doctor.id === rawCreateDoctorId)?.id ||
    (selectedDoctor?.isActive ? selectedDoctor.id : "") ||
    activeDoctors[0]?.id ||
    "";
  const selectedCreateServiceId =
    activeServices.find((service) => service.id === rawCreateServiceId)?.id || "";
  const selectedCreateDate = rawCreateDate || selectedDateValue;
  const selectedCreateSlotTime = rawCreateSlotTime;
  const selectedCreateDateParts = selectedCreateDate
    ? parseIsoDateInput(selectedCreateDate)
    : null;
  const selectedCreateDoctor =
    activeDoctors.find((doctor) => doctor.id === selectedCreateDoctorId) ?? null;
  const selectedCreateService =
    activeServices.find((service) => service.id === selectedCreateServiceId) ?? null;
  const shouldPersistCreateContext =
    resolvedPanel === "create" ||
    Boolean(rawCreateDoctorId || rawCreateServiceId || rawCreateSlotTime);

  const rawBlockDate = query.blockDate?.trim() ?? "";
  const rawBlockStartTime = query.blockStartTime?.trim() ?? "";
  const rawBlockEndTime = query.blockEndTime?.trim() ?? "";
  const selectedBlockDate = rawBlockDate || selectedDateValue;
  const selectedBlockStartTime = rawBlockStartTime || "09:00";
  const selectedBlockEndTime = rawBlockEndTime || "10:00";
  const shouldPersistBlockContext =
    resolvedPanel === "block" ||
    Boolean(rawBlockDate || rawBlockStartTime || rawBlockEndTime);

  const baseCalendarHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
    createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
    createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
    blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
    blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
    blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
  });

  const createPanelHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    panel: "create",
    createDoctorId: selectedCreateDoctorId || undefined,
    createServiceId: selectedCreateServiceId || undefined,
    createDate: selectedCreateDate || undefined,
    createSlotTime: selectedCreateSlotTime || undefined,
    blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
    blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
    blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
  });

  const blockPanelHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    panel: "block",
    createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
    createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
    createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
    blockDate: selectedBlockDate,
    blockStartTime: selectedBlockStartTime,
    blockEndTime: selectedBlockEndTime,
  });

  const appointmentHrefsById = Object.fromEntries(
    appointments.map((appointment) => [
      appointment.id,
      buildCalendarPath({
        view,
        date: selectedDateValue,
        doctorId: currentDoctorFilter,
        panel: "appointment",
        appointmentId: appointment.id,
        createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
        createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
        createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
        createSlotTime: shouldPersistCreateContext ? selectedCreateSlotTime : undefined,
        blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
        blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
        blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
      }),
    ]),
  );

  const dayHrefByDateValue = Object.fromEntries(
    (view === "month" ? monthWeeks.flat() : days).map((day) => [
      day.dateValue,
      buildCalendarPath({
        view: "day",
        date: day.dateValue,
        doctorId: currentDoctorFilter,
        panel: resolvedPanel === "create" ? "create" : resolvedPanel === "block" ? "block" : undefined,
        createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
        createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
        createDate: shouldPersistCreateContext ? day.dateValue : undefined,
        createSlotTime: shouldPersistCreateContext ? selectedCreateSlotTime : undefined,
        blockDate: resolvedPanel === "block" ? day.dateValue : undefined,
        blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
        blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
      }),
    ]),
  );

  const quickCreateAvailableSlotResult =
    selectedCreateDoctor && selectedCreateService && selectedCreateDateParts
      ? await getAvailableSlots({
          clinicId: authContext.clinic.id,
          doctorId: selectedCreateDoctor.id,
          serviceId: selectedCreateService.id,
          date: buildClinicDateMarker(selectedCreateDateParts, timezone),
        })
      : null;

  const dayViewDoctors =
    selectedDoctor
      ? [selectedDoctor]
      : doctorOptions.filter(
          (doctor) =>
            doctor.isActive ||
            appointments.some((appointment) => appointment.doctor.id === doctor.id),
        );

  const availableSlotsByDoctorId =
    view === "day" && selectedCreateService
      ? Object.fromEntries(
          await Promise.all(
            dayViewDoctors.map(async (doctor) => {
              if (!doctor.isActive) {
                return [doctor.id, []] as const;
              }

              const slotResult = await getAvailableSlots({
                clinicId: authContext.clinic.id,
                doctorId: doctor.id,
                serviceId: selectedCreateService.id,
                date: buildClinicDateMarker(selectedDateParts, timezone),
              });

              const slotLinks = slotResult.slots.map((slot) => ({
                ...slot,
                href: buildCalendarPath({
                  view: "day",
                  date: selectedDateValue,
                  doctorId: currentDoctorFilter,
                  panel: "create",
                  createDoctorId: doctor.id,
                  createServiceId: selectedCreateService.id,
                  createDate: selectedDateValue,
                  createSlotTime: slot.startTime,
                  blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
                  blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
                  blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
                }),
              }));

              return [doctor.id, slotLinks] as const;
            }),
          ),
        )
      : {};

  const createLinksByDoctorId = Object.fromEntries(
    dayViewDoctors.map((doctor) => [
      doctor.id,
      buildCalendarPath({
        view: "day",
        date: selectedDateValue,
        doctorId: currentDoctorFilter,
        panel: "create",
        createDoctorId: doctor.isActive ? doctor.id : selectedCreateDoctorId || undefined,
        createServiceId: selectedCreateServiceId || undefined,
        createDate: selectedDateValue,
        blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
        blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
        blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
      }),
    ]),
  );

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

  const detailRedirectPath = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    panel: "appointment",
    appointmentId: selectedAppointment?.id,
    createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
    createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
    createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
    createSlotTime: shouldPersistCreateContext ? selectedCreateSlotTime : undefined,
    blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
    blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
    blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
    rescheduleAppointmentId: rescheduleOpen ? selectedAppointment?.id : undefined,
    rescheduleDate: rescheduleOpen ? rescheduleDateValue : undefined,
    rescheduleSlotTime: rescheduleOpen ? rescheduleSlotTime : undefined,
  });

  const createPanelRedirectPath = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    panel: "create",
    createDoctorId: selectedCreateDoctorId || undefined,
    createServiceId: selectedCreateServiceId || undefined,
    createDate: selectedCreateDate || undefined,
    createSlotTime: selectedCreateSlotTime || undefined,
    blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
    blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
    blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
  });

  const createSuccessHref = buildCalendarPath({
    view,
    date: selectedDateValue,
    doctorId: currentDoctorFilter,
    panel: "appointment",
    createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
    createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
    createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
    blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
    blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
    blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
  });

  const rescheduleOpenHref = selectedAppointment
    ? buildCalendarPath({
        view,
        date: selectedDateValue,
        doctorId: currentDoctorFilter,
        panel: "appointment",
        appointmentId: selectedAppointment.id,
        createDoctorId: shouldPersistCreateContext ? selectedCreateDoctorId : undefined,
        createServiceId: shouldPersistCreateContext ? selectedCreateServiceId : undefined,
        createDate: shouldPersistCreateContext ? selectedCreateDate : undefined,
        createSlotTime: shouldPersistCreateContext ? selectedCreateSlotTime : undefined,
        blockDate: shouldPersistBlockContext ? selectedBlockDate : undefined,
        blockStartTime: shouldPersistBlockContext ? selectedBlockStartTime : undefined,
        blockEndTime: shouldPersistBlockContext ? selectedBlockEndTime : undefined,
        rescheduleAppointmentId: selectedAppointment.id,
        rescheduleDate:
          rescheduleDateValue ||
          formatDateValueInTimeZone(selectedAppointment.startAt, timezone),
      })
    : baseCalendarHref;

  const monthSummariesByDate =
    view === "month"
      ? Object.fromEntries(
          monthWeeks.flat().map((day) => {
            const dayAppointments = appointments.filter(
              (appointment) =>
                formatDateValueInTimeZone(appointment.startAt, timezone) === day.dateValue,
            );
            const dayBlockedCount = blockedTimes.filter((blockedTime) => {
              const startDate = formatDateValueInTimeZone(blockedTime.startAt, timezone);
              const endDate = formatDateValueInTimeZone(blockedTime.endAt, timezone);

              return day.dateValue >= startDate && day.dateValue <= endDate;
            }).length;

            return [
              day.dateValue,
              {
                totalAppointments: dayAppointments.length,
                pendingCount: dayAppointments.filter(
                  (appointment) => appointment.status === AppointmentStatus.PENDING,
                ).length,
                confirmedCount: dayAppointments.filter(
                  (appointment) => appointment.status === AppointmentStatus.CONFIRMED,
                ).length,
                blockedCount: dayBlockedCount,
              },
            ] as const;
          }),
        )
      : {};

  return (
    <PanelPage
      eyebrow="Agenda"
      title="Agenda"
      description="Vista operativa del día, la semana o el mes."
    >
      <div className="grid gap-3">
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

        <CalendarToolbar
          view={view}
          dateValue={selectedDateValue}
          doctorId={selectedDoctorId}
          doctors={doctorOptions}
          rangeLabel={rangeLabel}
          totalAppointments={appointments.length}
          totalBlockedTimes={blockedTimes.length}
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
          monthHref={buildCalendarPath({
            view: "month",
            date: selectedDateValue,
            doctorId: currentDoctorFilter,
          })}
          createPanelHref={createPanelHref}
          blockPanelHref={blockPanelHref}
        />

        <CalendarStatusLegend
          totalAppointments={appointments.length}
          totalBlockedTimes={blockedTimes.length}
          doctorLabel={selectedDoctor?.name ?? null}
          selectedServiceLabel={selectedCreateService?.name ?? null}
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {view === "day" ? (
              <CalendarDayView
                day={selectedDay}
                appointments={appointments}
                blockedTimes={blockedTimes}
                timezone={timezone}
                doctors={dayViewDoctors}
                selectedAppointmentId={selectedAppointment?.id}
                selectedServiceLabel={selectedCreateService?.name ?? null}
                createLinksByDoctorId={createLinksByDoctorId}
                appointmentHrefsById={appointmentHrefsById}
                availableSlotsByDoctorId={availableSlotsByDoctorId}
              />
            ) : view === "week" ? (
              <CalendarWeekView
                days={days}
                appointments={appointments}
                blockedTimes={blockedTimes}
                timezone={timezone}
                selectedAppointmentId={selectedAppointment?.id}
                appointmentHrefsById={appointmentHrefsById}
                dayHrefByDateValue={dayHrefByDateValue}
              />
            ) : (
              <CalendarMonthView
                weeks={monthWeeks}
                summariesByDate={monthSummariesByDate}
                dayHrefByDateValue={dayHrefByDateValue}
              />
            )}
          </div>

          {resolvedPanel === "appointment" ? (
            <CalendarSidePanel
              eyebrow="Reserva"
              title="Detalle"
              description="Consulta y actualiza la reserva."
              closeHref={baseCalendarHref}
            >
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
                embedded
              />
            </CalendarSidePanel>
          ) : resolvedPanel === "create" ? (
            <CalendarSidePanel
              eyebrow="Reserva"
              title="Crear reserva"
              description="Servicio, horario y cliente."
              closeHref={baseCalendarHref}
            >
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
                selectedService={selectedCreateService}
                availableSlotResult={quickCreateAvailableSlotResult}
                timezone={timezone}
                view={view}
                calendarDateValue={selectedDateValue}
                filterDoctorId={selectedDoctorId}
                loadActionPath="/app/calendar"
                createAction={createAdminAppointmentAction}
                redirectPath={createPanelRedirectPath}
                successRedirectPath={createSuccessHref}
                embedded
              />
            </CalendarSidePanel>
          ) : resolvedPanel === "block" ? (
            <CalendarSidePanel
              eyebrow="Bloqueo"
              title="Bloquear horario"
              description="Oculta este rango para todo el negocio."
              closeHref={baseCalendarHref}
            >
              <CalendarBlockForm
                redirectPath={blockPanelHref}
                selectedDateValue={selectedBlockDate}
                selectedStartTime={selectedBlockStartTime}
                selectedEndTime={selectedBlockEndTime}
                blockedTimes={blockedTimes}
                timezone={timezone}
                createAction={createCalendarBusinessBlockAction}
                cancelAction={cancelCalendarBusinessBlockAction}
              />
            </CalendarSidePanel>
          ) : (
            <CalendarSidePanel
              eyebrow="Panel"
              title="Acciones rápidas"
              description="Crea una reserva o bloquea un horario."
            >
              <div className="grid gap-3">
                <Link
                  href={createPanelHref}
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Crear reserva
                </Link>
                <Link
                  href={blockPanelHref}
                  className="inline-flex items-center justify-center rounded-full border border-line/80 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-brand-50"
                >
                  Bloquear horario
                </Link>
              </div>
            </CalendarSidePanel>
          )}
        </div>
      </div>
    </PanelPage>
  );
}
