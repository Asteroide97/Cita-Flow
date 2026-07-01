import Link from "next/link";

import type { GetAvailableSlotsResult } from "@/lib/appointments/availability";
import { buildBookingAnchorHref } from "@/lib/booking/public";

type SlotsStepProps = {
  clinicSlug: string;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlotTime: string;
  availableSlotResult: GetAvailableSlotsResult | null;
  waitlistOpen: boolean;
};

function isMorningSlot(value: string) {
  const [hours] = value.split(":");

  return Number(hours) < 14;
}

function renderSlotGroup(params: {
  title: string;
  slots: NonNullable<GetAvailableSlotsResult>["slots"];
  clinicSlug: string;
  selectedServiceId: string;
  selectedDoctorId: string;
  selectedDate: string;
  selectedSlotTime: string;
}) {
  if (!params.slots.length) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          {params.title}
        </p>
        <p className="mt-2 text-sm text-muted">
          Horarios validados contra la agenda real del doctor.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {params.slots.map((slot) => {
          const isSelected = params.selectedSlotTime === slot.startTime;

          return (
            <Link
              key={slot.startTime}
              href={buildBookingAnchorHref(params.clinicSlug, "datos", {
                serviceId: params.selectedServiceId,
                doctorId: params.selectedDoctorId,
                date: params.selectedDate,
                slotTime: slot.startTime,
              })}
              scroll={false}
              className={
                isSelected
                  ? "rounded-[22px] border px-4 py-4 text-center text-sm font-semibold shadow-soft"
                  : "rounded-[22px] border border-line/80 bg-white px-4 py-4 text-center text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50"
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

export function SlotsStep({
  clinicSlug,
  selectedServiceId,
  selectedDoctorId,
  selectedDate,
  selectedSlotTime,
  availableSlotResult,
  waitlistOpen,
}: SlotsStepProps) {
  const slots = availableSlotResult?.slots ?? [];
  const morningSlots = slots.filter((slot) => isMorningSlot(slot.startTime));
  const afternoonSlots = slots.filter((slot) => !isMorningSlot(slot.startTime));

  return (
    <div className="mt-8 grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Horarios disponibles
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-ink">
          Selecciona un horario para continuar con tu cita
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          Si alguien reserva antes que tu, la disponibilidad se actualiza
          automaticamente.
        </p>
      </div>

      {!slots.length ? (
        <div className="rounded-[24px] border border-dashed border-line/90 bg-surface-soft px-5 py-6 text-sm leading-7 text-muted">
          No hay horarios disponibles para este dia.
        </div>
      ) : (
        <>
          {renderSlotGroup({
            title: "Manana",
            slots: morningSlots,
            clinicSlug,
            selectedServiceId,
            selectedDoctorId,
            selectedDate,
            selectedSlotTime,
          })}
          {renderSlotGroup({
            title: "Tarde",
            slots: afternoonSlots,
            clinicSlug,
            selectedServiceId,
            selectedDoctorId,
            selectedDate,
            selectedSlotTime,
          })}
        </>
      )}

      {!selectedSlotTime ? (
        waitlistOpen ? (
          <div className="rounded-[22px] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-800">
            Abriste la lista de espera. Esto no crea una cita.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={buildBookingAnchorHref(clinicSlug, "lista-espera", {
                serviceId: selectedServiceId,
                doctorId: selectedDoctorId,
                date: selectedDate,
                waitlist: true,
              })}
              scroll={false}
              className="inline-flex rounded-full border border-line/80 bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              Prefiero otro horario
            </Link>
            <span className="text-sm text-muted">
              Si no te funciona ninguna opcion, puedes unirte a la lista de espera.
            </span>
          </div>
        )
      ) : null}
    </div>
  );
}
