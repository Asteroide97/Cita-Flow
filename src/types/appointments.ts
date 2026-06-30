import type { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client";

import type { GetAvailableSlotsResult, LocalDateParts } from "@/lib/appointments/availability";

export type AppointmentPageSearchParams = {
  filterDate?: string;
  filterDoctorId?: string;
  filterStatus?: string;
  filterServiceId?: string;
  formDoctorId?: string;
  formServiceId?: string;
  formDate?: string;
  status?: string;
  error?: string;
};

export type AppointmentDoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  isActive: boolean;
};

export type AppointmentServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
  depositRequired: boolean;
  depositCents: number | null;
  isActive: boolean;
};

export type AppointmentPatientOption = {
  id: string;
  name: string;
  phoneE164: string;
  email: string | null;
};

export type AppointmentListItem = Prisma.AppointmentGetPayload<{
  include: {
    patient: {
      select: {
        id: true;
        name: true;
        phoneE164: true;
        email: true;
      };
    };
    doctor: {
      select: {
        id: true;
        name: true;
        specialty: true;
      };
    };
    service: {
      select: {
        id: true;
        name: true;
        durationMinutes: true;
        priceCents: true;
        depositRequired: true;
        depositCents: true;
      };
    };
  };
}>;

export type AppointmentFlashMessage = {
  tone: "success" | "error";
  message: string;
};

export type AppointmentSummary = {
  total: number;
  today: number;
  confirmed: number;
  pending: number;
};

export type AppointmentFilterValues = {
  filterDate: string;
  filterDoctorId: string;
  filterStatus: string;
  filterServiceId: string;
};

export type AppointmentCreateSelection = {
  formDoctorId: string;
  formServiceId: string;
  formDate: string;
};

export type AppointmentCreateContext = {
  selectedDoctor: AppointmentDoctorOption | null;
  selectedService: AppointmentServiceOption | null;
  selectedDateParts: LocalDateParts | null;
  availableSlotResult: GetAvailableSlotsResult | null;
};

export type AppointmentStatusLabels = Record<AppointmentStatus, string>;

export type AppointmentSourceLabels = Record<AppointmentSource, string>;
