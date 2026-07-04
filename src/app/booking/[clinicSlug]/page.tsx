import type { Metadata } from "next";
import Link from "next/link";

import { BookingConfirmation } from "@/components/booking/booking-confirmation";
import { BookingScrollManager } from "@/components/booking/booking-scroll-manager";
import { BookingShell } from "@/components/booking/booking-shell";
import { BookingSummary } from "@/components/booking/booking-summary";
import { DateStep } from "@/components/booking/date-step";
import { DoctorStep } from "@/components/booking/doctor-step";
import { PatientDetailsStep } from "@/components/booking/patient-details-step";
import { ServiceStep } from "@/components/booking/service-step";
import {
  buildClinicDateMarker,
  getAvailableSlots,
  parseIsoDateInput,
} from "@/lib/appointments/availability";
import { readPublicBookingConfirmationCookie } from "@/lib/booking/confirmation";
import {
  buildBookingPath,
  getBookingClinicDescription,
  getBookingClinicDisplayName,
  getBookingDateOptions,
  getBookingTodayDateValue,
  normalizeBookingBrandColor,
  resolveBookingFlashMessage,
} from "@/lib/booking/public";
import { brand } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import type {
  BookingClinic,
  BookingDoctorOption,
  BookingPageSearchParams,
  BookingServiceOption,
} from "@/types/booking";

import {
  createPublicBookingAction,
  createPublicWaitlistEntryAction,
} from "./actions";

type BookingPageProps = {
  params: Promise<{
    clinicSlug: string;
  }>;
  searchParams: Promise<BookingPageSearchParams>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}): Promise<Metadata> {
  const { clinicSlug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: {
      slug: clinicSlug,
    },
    select: {
      name: true,
      publicName: true,
      publicDescription: true,
      isActive: true,
    },
  });

  if (!clinic || !clinic.isActive) {
    return {
      title: `Booking no disponible | ${brand.name}`,
      description: "El enlace de reserva solicitado no está disponible.",
    };
  }

  const clinicName = getBookingClinicDisplayName(clinic);

  return {
    title: `Reservar en ${clinicName} | ${brand.name}`,
    description: clinic.publicDescription?.trim()
      ? clinic.publicDescription.trim()
      : `Reserva en ${clinicName} usando la disponibilidad real del negocio.`,
  };
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const [{ clinicSlug }, query] = await Promise.all([params, searchParams]);
  const clinic = await prisma.clinic.findUnique({
    where: {
      slug: clinicSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      currency: true,
      brandColor: true,
      publicName: true,
      publicDescription: true,
      isActive: true,
    },
  });

  if (!clinic || !clinic.isActive) {
    return (
      <BookingShell
        clinicName="Booking no disponible"
        clinicSlug={clinicSlug}
        title="Este enlace de reserva no está disponible"
        description="El negocio no existe, se encuentra inactivo o el enlace ya no está aceptando nuevas reservas."
        brandColor={normalizeBookingBrandColor(null)}
      >
        <section className="surface-card p-6 sm:p-8">
          <p className="text-sm leading-8 text-muted">
            Si llegaste aquí desde un enlace antiguo, solicita al negocio su
            link actualizado. También puedes volver a la página principal de
            {brand.name}.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Volver al inicio
            </Link>
          </div>
        </section>
      </BookingShell>
    );
  }

  const typedClinic: BookingClinic = {
    ...clinic,
    name: getBookingClinicDisplayName(clinic),
  };
  const [services, doctors] = await Promise.all([
    prisma.service.findMany({
      where: {
        clinicId: typedClinic.id,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        priceCents: true,
        depositRequired: true,
        depositCents: true,
      },
    }),
    prisma.doctor.findMany({
      where: {
        clinicId: typedClinic.id,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
      },
    }),
  ]);

  const serviceOptions = services satisfies BookingServiceOption[];
  const doctorOptions = doctors satisfies BookingDoctorOption[];
  const selectedService =
    serviceOptions.find((service) => service.id === query.serviceId?.trim()) ?? null;
  const selectedDoctor =
    doctorOptions.find((doctor) => doctor.id === query.doctorId?.trim()) ?? null;
  const selectedDate =
    selectedService && selectedDoctor ? query.date?.trim() ?? "" : "";
  const selectedDateParts = selectedDate ? parseIsoDateInput(selectedDate) : null;
  const availableSlotResult =
    selectedService && selectedDoctor && selectedDateParts
      ? await getAvailableSlots({
          clinicId: typedClinic.id,
          doctorId: selectedDoctor.id,
          serviceId: selectedService.id,
          date: buildClinicDateMarker(selectedDateParts, typedClinic.timezone),
        })
      : null;
  const selectedSlotTime =
    selectedService && selectedDoctor && selectedDateParts
      ? query.slotTime?.trim() ?? ""
      : "";
  const selectedSlot =
    availableSlotResult?.slots.find((slot) => slot.startTime === selectedSlotTime) ??
    null;
  const confirmation =
    query.status === "booking-created"
      ? await readPublicBookingConfirmationCookie(typedClinic.slug)
      : null;
  const flash =
    confirmation && query.status === "booking-created"
      ? null
      : resolveBookingFlashMessage(query.status, query.error);
  const waitlistFlash =
    flash && (query.status === "waitlist-created" || query.focus === "lista-espera")
      ? flash
      : null;
  const pageFlash = waitlistFlash ? null : flash;
  const brandColor = normalizeBookingBrandColor(typedClinic.brandColor);
  const minDate = getBookingTodayDateValue(typedClinic.timezone);
  const dateOptions = getBookingDateOptions(typedClinic.timezone);
  const waitlistOpen = query.waitlist === "1";

  return (
    <BookingShell
      clinicName={typedClinic.name}
      clinicSlug={typedClinic.slug}
      clinicDescription={typedClinic.publicDescription}
      title="Reserva tu horario"
      description={
        typedClinic.publicDescription
          ? "Elige servicio, profesional y horario disponible."
          : getBookingClinicDescription(typedClinic)
      }
      brandColor={brandColor}
      aside={
        confirmation ? undefined : (
          <BookingSummary
            clinic={typedClinic}
            selectedService={selectedService}
            selectedDoctor={selectedDoctor}
            selectedDate={selectedDate}
            selectedSlotDateTime={selectedSlot?.startAt ?? null}
          />
        )
      }
    >
      <BookingScrollManager focusTarget={query.focus ?? null} />

      {pageFlash ? (
        <div
          className={
            pageFlash.tone === "success"
              ? "rounded-[26px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
              : "rounded-[26px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
          }
        >
          {pageFlash.message}
        </div>
      ) : null}

      {confirmation ? (
        <BookingConfirmation
          confirmation={confirmation}
          resetHref={buildBookingPath(typedClinic.slug)}
        />
      ) : (
        <>
          <ServiceStep
            clinicSlug={typedClinic.slug}
            services={serviceOptions}
            selectedServiceId={selectedService?.id ?? ""}
            currency={typedClinic.currency}
          />

          {selectedService ? (
            <DoctorStep
              clinicSlug={typedClinic.slug}
              doctors={doctorOptions}
              selectedServiceId={selectedService.id}
              selectedDoctorId={selectedDoctor?.id ?? ""}
            />
          ) : null}

          {selectedService && selectedDoctor ? (
            <DateStep
              clinicSlug={typedClinic.slug}
              selectedServiceId={selectedService.id}
              selectedDoctorId={selectedDoctor.id}
              selectedDate={selectedDate}
              selectedSlotTime={selectedSlotTime}
              minDate={minDate}
              dateOptions={dateOptions}
              availableSlotResult={availableSlotResult}
              waitlistOpen={waitlistOpen}
              waitlistFlash={waitlistFlash}
              selectedService={selectedService}
              selectedDoctor={selectedDoctor}
              waitlistAction={createPublicWaitlistEntryAction}
            />
          ) : null}

          {selectedService && selectedDoctor && selectedDateParts && selectedSlot ? (
            <PatientDetailsStep
              clinicSlug={typedClinic.slug}
              serviceId={selectedService.id}
              doctorId={selectedDoctor.id}
              date={selectedDate}
              slotTime={selectedSlot.startTime}
              selectedService={selectedService}
              selectedDoctor={selectedDoctor}
              action={createPublicBookingAction}
            />
          ) : null}
        </>
      )}
    </BookingShell>
  );
}
