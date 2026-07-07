import type { Metadata } from "next";
import Link from "next/link";

import { BookingConfirmation } from "@/components/booking/booking-confirmation";
import { BookingScrollManager } from "@/components/booking/booking-scroll-manager";
import { BookingShell } from "@/components/booking/booking-shell";
import { BookingSummary } from "@/components/booking/booking-summary";
import { DateStep } from "@/components/booking/date-step";
import { PatientDetailsStep } from "@/components/booking/patient-details-step";
import { ProfessionalSlotsStep } from "@/components/booking/professional-slots-step";
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
  BookingProfessionalAvailability,
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

function isMorningSlot(startTime: string) {
  const [hours] = startTime.split(":");

  return Number(hours) < 14;
}

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
      businessType: true,
      publicName: true,
      publicDescription: true,
      websiteUrl: true,
      contactEmail: true,
      contactPhone: true,
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
            Si llegaste aquí desde un enlace antiguo, solicita al negocio su link
            actualizado. También puedes volver a la página principal de {brand.name}.
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
        isPublic: true,
      },
      orderBy: [{ publicOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
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
        isPublic: true,
      },
      orderBy: [{ publicOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
        photoUrl: true,
      },
    }),
  ]);

  const serviceOptions = services satisfies BookingServiceOption[];
  const doctorOptions = doctors satisfies BookingDoctorOption[];

  const selectedDate = query.date?.trim() ?? "";
  const selectedDateParts = selectedDate ? parseIsoDateInput(selectedDate) : null;
  const requestedServiceId = query.serviceId?.trim() ?? "";
  const requestedDoctorId = query.doctorId?.trim() ?? "";
  const requestedSlot = query.slot?.trim() || query.slotTime?.trim() || "";

  const selectedService =
    serviceOptions.find((service) => service.id === requestedServiceId) ?? null;
  const selectedWaitlistDoctor =
    doctorOptions.find((doctor) => doctor.id === requestedDoctorId) ?? null;
  const hasInvalidServiceSelection = Boolean(requestedServiceId && !selectedService);
  const hasInvalidDoctorSelection = Boolean(
    requestedDoctorId && !selectedWaitlistDoctor,
  );

  const availableProfessionals: BookingProfessionalAvailability[] =
    selectedDateParts && selectedService
      ? (
          await Promise.all(
            doctorOptions.map(async (doctor) => {
              const availableSlotResult = await getAvailableSlots({
                clinicId: typedClinic.id,
                doctorId: doctor.id,
                serviceId: selectedService.id,
                date: buildClinicDateMarker(selectedDateParts, typedClinic.timezone),
              });

              if (!availableSlotResult.slots.length) {
                return null;
              }

              return {
                doctor,
                slots: availableSlotResult.slots,
                morningSlots: availableSlotResult.slots.filter((slot) =>
                  isMorningSlot(slot.startTime),
                ),
                afternoonSlots: availableSlotResult.slots.filter(
                  (slot) => !isMorningSlot(slot.startTime),
                ),
              } satisfies BookingProfessionalAvailability;
            }),
          )
        ).filter(
          (
            item,
          ): item is BookingProfessionalAvailability => item !== null,
        )
      : [];

  const selectedDoctorAvailability =
    availableProfessionals.find((item) => item.doctor.id === requestedDoctorId) ?? null;
  const selectedDoctor = selectedDoctorAvailability?.doctor ?? null;
  const selectedSlot =
    selectedDoctorAvailability?.slots.find(
      (slot) => slot.startTime === requestedSlot,
    ) ?? null;

  const derivedError =
    query.error?.trim() ||
    (hasInvalidServiceSelection
      ? "service-unavailable"
      : hasInvalidDoctorSelection
        ? "doctor-unavailable"
        : requestedSlot && !selectedSlot
          ? "slot-unavailable"
          : undefined);

  const confirmation =
    query.status === "booking-created"
      ? await readPublicBookingConfirmationCookie(typedClinic.slug)
      : null;
  const flash =
    confirmation && query.status === "booking-created"
      ? null
      : resolveBookingFlashMessage(query.status, derivedError);
  const waitlistFlash =
    flash && (query.status === "waitlist-created" || query.focus === "lista-espera")
      ? flash
      : null;
  const pageFlash = waitlistFlash ? null : flash;
  const brandColor = normalizeBookingBrandColor(typedClinic.brandColor);
  const minDate = getBookingTodayDateValue(typedClinic.timezone);
  const dateOptions = getBookingDateOptions(typedClinic.timezone);
  const waitlistOpen = query.waitlist === "1" && Boolean(selectedDate && selectedService);

  return (
    <BookingShell
      clinicName={typedClinic.name}
      clinicSlug={typedClinic.slug}
      clinicDescription={typedClinic.publicDescription}
      clinicWebsiteUrl={typedClinic.websiteUrl}
      clinicContactEmail={typedClinic.contactEmail}
      clinicContactPhone={typedClinic.contactPhone}
      title="Reserva tu horario"
      description={
        typedClinic.publicDescription
          ? "Elige día, servicio, profesional y horario disponible."
          : getBookingClinicDescription(typedClinic)
      }
      brandColor={brandColor}
      aside={
        confirmation ? undefined : (
          <BookingSummary
            clinic={typedClinic}
            selectedDate={selectedDate}
            selectedService={selectedService}
            selectedDoctor={selectedDoctor}
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
          <DateStep
            clinicSlug={typedClinic.slug}
            selectedDate={selectedDate}
            minDate={minDate}
            dateOptions={dateOptions}
            selectedServiceId={selectedService?.id}
          />

          {selectedDate ? (
            <ServiceStep
              clinicSlug={typedClinic.slug}
              services={serviceOptions}
              selectedDate={selectedDate}
              selectedServiceId={selectedService?.id ?? ""}
              currency={typedClinic.currency}
            />
          ) : null}

          {selectedDate && selectedService ? (
            <ProfessionalSlotsStep
              clinicSlug={typedClinic.slug}
              selectedDate={selectedDate}
              selectedService={selectedService}
              availableProfessionals={availableProfessionals}
              selectedDoctorId={selectedDoctor?.id ?? ""}
              selectedSlot={selectedSlot?.startTime ?? ""}
              waitlistOpen={waitlistOpen}
              waitlistFlash={waitlistFlash}
              minDate={minDate}
              selectedWaitlistDoctor={selectedWaitlistDoctor}
              waitlistAction={createPublicWaitlistEntryAction}
            />
          ) : null}

          {selectedDate && selectedService && selectedDoctor && selectedSlot ? (
            <PatientDetailsStep
              clinicSlug={typedClinic.slug}
              serviceId={selectedService.id}
              doctorId={selectedDoctor.id}
              date={selectedDate}
              slot={selectedSlot.startTime}
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
