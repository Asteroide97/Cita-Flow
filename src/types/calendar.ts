import type { AppointmentDoctorOption, AppointmentListItem } from "@/types/appointments";

export type CalendarViewMode = "day" | "week";

export type CalendarPageSearchParams = {
  view?: string;
  date?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: string;
  error?: string;
};

export type CalendarDoctorOption = AppointmentDoctorOption;

export type CalendarAppointment = AppointmentListItem;

export type CalendarDayDefinition = {
  key: string;
  dateValue: string;
  marker: Date;
  label: string;
  shortLabel: string;
  isToday: boolean;
  isSelected: boolean;
};

export type CalendarAppointmentLayout = {
  appointment: CalendarAppointment;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  startLabel: string;
  endLabel: string;
};
