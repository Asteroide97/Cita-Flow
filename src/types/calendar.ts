import type { AppointmentDoctorOption, AppointmentListItem } from "@/types/appointments";

export type CalendarViewMode = "day" | "week" | "month";
export type CalendarPanelMode = "appointment" | "create" | "block";

export type CalendarPageSearchParams = {
  view?: string;
  date?: string;
  doctorId?: string;
  panel?: string;
  appointmentId?: string;
  createDoctorId?: string;
  createServiceId?: string;
  createDate?: string;
  createSlotTime?: string;
  blockDate?: string;
  blockStartTime?: string;
  blockEndTime?: string;
  rescheduleAppointmentId?: string;
  rescheduleDate?: string;
  rescheduleSlotTime?: string;
  status?: string;
  error?: string;
};

export type CalendarDoctorOption = AppointmentDoctorOption;

export type CalendarAppointment = AppointmentListItem;

export type CalendarBlockedTime = {
  id: string;
  startAt: Date;
  endAt: Date;
  reason: string | null;
};

export type CalendarDayDefinition = {
  key: string;
  dateValue: string;
  marker: Date;
  label: string;
  shortLabel: string;
  isToday: boolean;
  isSelected: boolean;
};

export type CalendarMonthCell = {
  key: string;
  dateValue: string;
  marker: Date;
  dayLabel: string;
  shortWeekdayLabel: string;
  isCurrentMonth: boolean;
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

export type CalendarBlockedLayout = {
  blockedTime: CalendarBlockedTime;
  top: number;
  height: number;
  startLabel: string;
  endLabel: string;
};

export type CalendarAvailableSlotLayout = {
  startAt: Date;
  endAt: Date;
  startLabel: string;
  endLabel: string;
  top: number;
};
