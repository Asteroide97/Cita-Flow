import type { Prisma } from "@prisma/client";

import type {
  AvailableSlot,
  GetAvailableSlotsResult,
} from "@/lib/appointments/availability";

export type BookingPageSearchParams = {
  serviceId?: string;
  doctorId?: string;
  date?: string;
  slot?: string;
  slotTime?: string;
  status?: string;
  error?: string;
  focus?: BookingStepAnchor;
  waitlist?: string;
};

export type BookingStepAnchor =
  | "fecha"
  | "servicio"
  | "doctor"
  | "fecha-hora"
  | "datos"
  | "lista-espera";

export type BookingDateOption = {
  value: string;
  dayLabel: string;
  monthLabel: string;
  weekdayLabel: string;
  fullLabel: string;
  isToday: boolean;
};

export type BookingPreferredRange = "MORNING" | "AFTERNOON" | "ANY";

export type BookingClinic = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  brandColor: string | null;
  businessType: string | null;
  publicName: string | null;
  publicDescription: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export type BookingServiceOption = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number;
  priceCents: number | null;
  depositRequired: boolean;
  depositCents: number | null;
};

export type BookingDoctorOption = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photoUrl: string | null;
};

export type BookingProfessionalAvailability = {
  doctor: BookingDoctorOption;
  slots: AvailableSlot[];
  morningSlots: AvailableSlot[];
  afternoonSlots: AvailableSlot[];
};

export type BookingFlashMessage = {
  tone: "success" | "error";
  message: string;
};

export type BookingConfirmationData = {
  clinicSlug: string;
  clinicName: string;
  serviceName: string;
  doctorName: string;
  startAtIso: string;
  timezone: string;
  statusLabel: string;
};

export type BookingAppointmentSummary = Prisma.AppointmentGetPayload<{
  include: {
    patient: {
      select: {
        name: true;
        phoneE164: true;
        email: true;
      };
    };
    doctor: {
      select: {
        name: true;
        specialty: true;
      };
    };
    service: {
      select: {
        name: true;
        durationMinutes: true;
        priceCents: true;
        depositRequired: true;
        depositCents: true;
      };
    };
  };
}>;

export type BookingStepState = {
  selectedService: BookingServiceOption | null;
  selectedDoctor: BookingDoctorOption | null;
  selectedDate: string;
  selectedSlotTime: string;
  availableSlotResult: GetAvailableSlotsResult | null;
};
