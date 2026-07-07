import Link from "next/link";

import { ProfessionalAvatar } from "@/components/doctors/professional-avatar";
import { buildBookingAnchorHref } from "@/lib/booking/public";
import type {
  BookingDoctorOption,
  BookingFlashMessage,
  BookingProfessionalAvailability,
  BookingServiceOption,
} from "@/types/booking";

import { WaitlistRequestForm } from "./waitlist-request-form";

type ProfessionalSlotsStepProps = {
  clinicSlug: string;
  selectedDate: string;
  selectedService: BookingServiceOption;
  availableProfessionals: BookingProfessionalAvailability[];
  selectedDoctorId: string;
  selectedSlot: string;
  waitlistOpen: boolean;
  waitlistFlash: BookingFlashMessage | null;
  minDate: string;
  selectedWaitlistDoctor: BookingDoctorOption | null;
  waitlistAction: (formData: FormData) => void | Promise<void>;
};

function renderSlotGroup(params: {
  title: string;
  slots: BookingProfessionalAvailability["slots"];
  clinicSlug: string;
  selectedDate: string;
  selectedServiceId: string;
  doctorId: string;
  selectedDoctorId: string;
  selectedSlot: string;
}) {
  if (!params.slots.length) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        {params.title}
      </p>
      <div className="flex flex-wrap gap-2">
        {params.slots.map((slot) => {
          const isSelected =
            params.selectedDoctorId === params.doctorId &&
            params.selectedSlot === slot.startTime;

          return (
            <Link
              key={`${params.doctorId}-${slot.startTime}`}
              href={buildBookingAnchorHref(params.clinicSlug, "datos", {
                date: params.selectedDate,
                serviceId: params.selectedServiceId,
                doctorId: params.doctorId,
                slot: slot.startTime,
              })}
              scroll={false}
              className={
                isSelected
                  ? "rounded-full border px-4 py-2 text-sm font-semibold shadow-soft"
                  : "rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
              }
              style={
                isSelected
                  ? {
                      borderColor: "var(--booking-brand)",
                      backgroundColor:
                        "color-mix(in srgb, var(--booking-brand) 10%, white)",
                      color: "var(--booking-brand)",
                    }
                  : undefined
              }
            >
              {slot.startTime}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ProfessionalSlotsStep({
  clinicSlug,
  selectedDate,
  selectedService,
  availableProfessionals,
  selectedDoctorId,
  selectedSlot,
  waitlistOpen,
  waitlistFlash,
  minDate,
  selectedWaitlistDoctor,
  waitlistAction,
}: ProfessionalSlotsStepProps) {
  const hasAvailability = availableProfessionals.length > 0;
  const shouldShowWaitlistForm = waitlistOpen && !selectedSlot;

  return (
    <section
      id="fecha-hora"
      className="surface-card min-w-0 scroll-mt-6 p-6 sm:p-7"
      tabIndex={-1}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
        Paso 3
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-ink">
        Elige profesional y horario
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Selecciona un horario para continuar con tu reserva.
      </p>

      {hasAvailability ? (
        <div className="mt-6 grid gap-4">
          {availableProfessionals.map((item) => {
            const isSelected = selectedDoctorId === item.doctor.id;

            return (
              <article
                key={item.doctor.id}
                className={
                  isSelected
                    ? "rounded-[26px] border p-5 shadow-soft"
                    : "rounded-[26px] border border-line/80 bg-white p-5"
                }
                style={
                  isSelected
                    ? {
                        borderColor: "var(--booking-brand)",
                        backgroundColor:
                          "color-mix(in srgb, var(--booking-brand) 5%, white)",
                      }
                    : undefined
                }
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <ProfessionalAvatar
                      name={item.doctor.name}
                      photoUrl={item.doctor.photoUrl}
                      size="md"
                      className="rounded-[20px]"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold text-ink">{item.doctor.name}</p>
                        <span className="rounded-full border border-line/80 bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                          {item.doctor.specialty ?? "Atención"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        {item.doctor.bio ?? "Disponible para reservas en línea."}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={buildBookingAnchorHref(clinicSlug, "lista-espera", {
                      date: selectedDate,
                      serviceId: selectedService.id,
                      doctorId: item.doctor.id,
                      waitlist: true,
                    })}
                    scroll={false}
                    className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    Otro horario con este profesional
                  </Link>
                </div>

                <div className="mt-5 grid gap-4">
                  {renderSlotGroup({
                    title: "Mañana",
                    slots: item.morningSlots,
                    clinicSlug,
                    selectedDate,
                    selectedServiceId: selectedService.id,
                    doctorId: item.doctor.id,
                    selectedDoctorId,
                    selectedSlot,
                  })}
                  {renderSlotGroup({
                    title: "Tarde",
                    slots: item.afternoonSlots,
                    clinicSlug,
                    selectedDate,
                    selectedServiceId: selectedService.id,
                    doctorId: item.doctor.id,
                    selectedDoctorId,
                    selectedSlot,
                  })}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          No encontramos horarios disponibles para este servicio en el día
          seleccionado.
        </div>
      )}

      {!selectedSlot ? (
        waitlistOpen ? (
          <div className="mt-6 rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-800">
            Abriste la lista de espera. Esto no crea una reserva.
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={buildBookingAnchorHref(clinicSlug, "lista-espera", {
                date: selectedDate,
                serviceId: selectedService.id,
                waitlist: true,
              })}
              scroll={false}
              className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              Prefiero otro horario
            </Link>
            <span className="text-sm text-muted">
              Si no te funciona lo que ves hoy, puedes unirte a la lista de espera.
            </span>
          </div>
        )
      ) : null}

      {waitlistFlash ? (
        <div
          className={
            waitlistFlash.tone === "success"
              ? "mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
              : "mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700"
          }
        >
          {waitlistFlash.message}
        </div>
      ) : null}

      {shouldShowWaitlistForm ? (
        <div className="mt-6">
          <WaitlistRequestForm
            clinicSlug={clinicSlug}
            serviceId={selectedService.id}
            doctorId={selectedWaitlistDoctor?.id ?? null}
            selectedDate={selectedDate}
            minDate={minDate}
            selectedService={selectedService}
            selectedDoctor={selectedWaitlistDoctor}
            action={waitlistAction}
          />
        </div>
      ) : null}
    </section>
  );
}
