"use server";

import { AppointmentStatus, TokenType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildClinicDateMarker,
  getAvailableSlots,
  parseIsoDateInput,
  validateAppointmentSlot,
} from "@/lib/appointments/availability";
import { setPublicAppointmentResultCookie } from "@/lib/appointments/public-result";
import {
  buildPublicAppointmentPath,
  canPatientCancelAppointment,
  canPatientConfirmAppointment,
  canPatientRescheduleAppointment,
} from "@/lib/appointments/public-self-service";
import {
  consumeAppointmentToken,
  createAppointmentTokens,
  validateAppointmentToken,
} from "@/lib/appointments/tokens";
import { createAuditLog } from "@/lib/audit";
import { enqueueAppointmentStatusChangedNotification } from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";
import { processWaitlistForCancelledAppointment } from "@/lib/waitlist/matching";

function revalidatePublicAppointmentViews() {
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/notifications");
  revalidatePath("/app/waitlist");
  revalidatePath("/app/whatsapp-simulator");
}

function buildPublicAppointmentCookiePayload(params: {
  token: string;
  action: "confirm" | "cancel" | "reschedule";
  appointment: {
    clinic: {
      name: string;
      slug: string;
      brandColor: string | null;
      timezone: string;
    };
    patient: {
      name: string;
      phoneE164: string;
      email: string | null;
    };
    doctor: {
      name: string;
      specialty: string | null;
    };
    service: {
      name: string;
    };
    startAt: Date;
    endAt: Date;
  };
  statusLabel: string;
  message: string;
}) {
  return {
    token: params.token,
    action: params.action,
    clinicName: params.appointment.clinic.name,
    clinicSlug: params.appointment.clinic.slug,
    brandColor: params.appointment.clinic.brandColor,
    patientName: params.appointment.patient.name,
    phoneE164: params.appointment.patient.phoneE164,
    email: params.appointment.patient.email,
    doctorName: params.appointment.doctor.name,
    doctorSpecialty: params.appointment.doctor.specialty,
    serviceName: params.appointment.service.name,
    startAtIso: params.appointment.startAt.toISOString(),
    endAtIso: params.appointment.endAt.toISOString(),
    timezone: params.appointment.clinic.timezone,
    statusLabel: params.statusLabel,
    message: params.message,
  };
}

export async function confirmAppointmentByTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/");
  }

  const redirectPath = buildPublicAppointmentPath("confirm", token);
  const validation = await validateAppointmentToken({
    token,
    expectedType: TokenType.CONFIRM,
  });

  if (!validation.ok) {
    redirect(redirectPath);
  }

  if (!canPatientConfirmAppointment(validation.context.appointment.status)) {
    redirect(
      buildPublicAppointmentPath("confirm", token, {
        error: "appointment-action-invalid",
      }),
    );
  }

  const updatedAppointment = await prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.update({
      where: {
        id: validation.context.appointment.id,
      },
      data: {
        status: AppointmentStatus.CONFIRMED,
      },
      include: {
        clinic: {
          select: {
            name: true,
            slug: true,
            brandColor: true,
            timezone: true,
          },
        },
        patient: {
          select: {
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    await consumeAppointmentToken({
      tokenId: validation.context.id,
      db: transaction,
    });

    await createAuditLog(
      {
        clinicId: validation.context.clinicId,
        action: "APPOINTMENT_CONFIRMED_BY_PATIENT",
        entityType: "APPOINTMENT",
        entityId: validation.context.appointment.id,
        metadata: {
          previousStatus: validation.context.appointment.status,
          nextStatus: AppointmentStatus.CONFIRMED,
          source: validation.context.appointment.source,
          tokenType: validation.context.type,
        },
      },
      transaction,
    );

    await enqueueAppointmentStatusChangedNotification({
      clinicId: validation.context.clinicId,
      appointmentId: appointment.id,
      changeType: "CONFIRMED",
      db: transaction,
    });

    return appointment;
  });

  await setPublicAppointmentResultCookie(
    buildPublicAppointmentCookiePayload({
      token,
      action: "confirm",
      appointment: updatedAppointment,
      statusLabel: "Confirmada",
      message: "Tu cita quedo confirmada correctamente.",
    }),
  );

  revalidatePublicAppointmentViews();

  redirect(redirectPath);
}

export async function cancelAppointmentByTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/");
  }

  const redirectPath = buildPublicAppointmentPath("cancel", token);
  const validation = await validateAppointmentToken({
    token,
    expectedType: TokenType.CANCEL,
  });

  if (!validation.ok) {
    redirect(redirectPath);
  }

  if (!canPatientCancelAppointment(validation.context.appointment.status)) {
    redirect(
      buildPublicAppointmentPath("cancel", token, {
        error: "appointment-action-invalid",
      }),
    );
  }

  const updatedAppointment = await prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.update({
      where: {
        id: validation.context.appointment.id,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
      include: {
        clinic: {
          select: {
            name: true,
            slug: true,
            brandColor: true,
            timezone: true,
          },
        },
        patient: {
          select: {
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    await consumeAppointmentToken({
      tokenId: validation.context.id,
      db: transaction,
    });

    await createAuditLog(
      {
        clinicId: validation.context.clinicId,
        action: "APPOINTMENT_CANCELLED_BY_PATIENT",
        entityType: "APPOINTMENT",
        entityId: validation.context.appointment.id,
        metadata: {
          previousStatus: validation.context.appointment.status,
          nextStatus: AppointmentStatus.CANCELLED,
          source: validation.context.appointment.source,
          tokenType: validation.context.type,
        },
      },
      transaction,
    );

    await enqueueAppointmentStatusChangedNotification({
      clinicId: validation.context.clinicId,
      appointmentId: appointment.id,
      changeType: "CANCELLED",
      db: transaction,
    });

    await processWaitlistForCancelledAppointment({
      clinicId: validation.context.clinicId,
      cancelledAppointmentId: appointment.id,
      db: transaction,
    });

    return appointment;
  });

  await setPublicAppointmentResultCookie(
    buildPublicAppointmentCookiePayload({
      token,
      action: "cancel",
      appointment: updatedAppointment,
      statusLabel: "Cancelada",
      message: "Tu cita fue cancelada correctamente.",
    }),
  );

  revalidatePublicAppointmentViews();

  redirect(redirectPath);
}

export async function rescheduleAppointmentByTokenAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const selectedDate = String(formData.get("date") ?? "").trim();
  const selectedSlotTime = String(formData.get("slotTime") ?? "").trim();

  if (!token) {
    redirect("/");
  }

  const validation = await validateAppointmentToken({
    token,
    expectedType: TokenType.RESCHEDULE,
  });

  if (!validation.ok) {
    redirect(buildPublicAppointmentPath("reschedule", token));
  }

  if (!canPatientRescheduleAppointment(validation.context.appointment.status)) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        error: "appointment-action-invalid",
      }),
    );
  }

  if (!selectedDate) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        error: "date-required",
      }),
    );
  }

  if (!selectedSlotTime) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        date: selectedDate,
        error: "slot-required",
      }),
    );
  }

  const dateParts = parseIsoDateInput(selectedDate);

  if (!dateParts) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        error: "date-required",
      }),
    );
  }

  const availableSlotResult = await getAvailableSlots({
    clinicId: validation.context.clinicId,
    doctorId: validation.context.appointment.doctor.id,
    serviceId: validation.context.appointment.service.id,
    date: buildClinicDateMarker(
      dateParts,
      validation.context.appointment.clinic.timezone,
    ),
    excludeAppointmentId: validation.context.appointment.id,
  });
  const selectedSlot = availableSlotResult.slots.find(
    (slot) => slot.startTime === selectedSlotTime,
  );

  if (!selectedSlot) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        date: selectedDate,
        error: "slot-unavailable",
      }),
    );
  }

  const slotValidation = await validateAppointmentSlot({
    clinicId: validation.context.clinicId,
    doctorId: validation.context.appointment.doctor.id,
    serviceId: validation.context.appointment.service.id,
    patientId: validation.context.appointment.patient.id,
    startAt: selectedSlot.startAt,
    excludeAppointmentId: validation.context.appointment.id,
  });

  if (!slotValidation.ok) {
    redirect(
      buildPublicAppointmentPath("reschedule", token, {
        date: selectedDate,
        error: "slot-unavailable",
      }),
    );
  }

  const updatedAppointment = await prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.update({
      where: {
        id: validation.context.appointment.id,
      },
      data: {
        startAt: slotValidation.startAt,
        endAt: slotValidation.endAt,
        status: AppointmentStatus.PENDING,
      },
      include: {
        clinic: {
          select: {
            name: true,
            slug: true,
            brandColor: true,
            timezone: true,
          },
        },
        patient: {
          select: {
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    await consumeAppointmentToken({
      tokenId: validation.context.id,
      db: transaction,
    });

    const tokenBundle = await createAppointmentTokens({
      clinicId: validation.context.clinicId,
      appointmentId: appointment.id,
      appointmentStartAt: appointment.startAt,
      db: transaction,
    });

    await createAuditLog(
      {
        clinicId: validation.context.clinicId,
        action: "APPOINTMENT_RESCHEDULED_BY_PATIENT",
        entityType: "APPOINTMENT",
        entityId: validation.context.appointment.id,
        metadata: {
          previousStatus: validation.context.appointment.status,
          nextStatus: AppointmentStatus.PENDING,
          previousStartAt: validation.context.appointment.startAt.toISOString(),
          previousEndAt: validation.context.appointment.endAt.toISOString(),
          nextStartAt: appointment.startAt.toISOString(),
          nextEndAt: appointment.endAt.toISOString(),
          source: validation.context.appointment.source,
          tokenType: validation.context.type,
        },
      },
      transaction,
    );

    await enqueueAppointmentStatusChangedNotification({
      clinicId: validation.context.clinicId,
      appointmentId: appointment.id,
      changeType: "RESCHEDULED",
      selfServiceLinks: {
        confirmUrl: tokenBundle.confirm.url,
        cancelUrl: tokenBundle.cancel.url,
        rescheduleUrl: tokenBundle.reschedule.url,
      },
      db: transaction,
    });

    return appointment;
  });

  await setPublicAppointmentResultCookie(
    buildPublicAppointmentCookiePayload({
      token,
      action: "reschedule",
      appointment: updatedAppointment,
      statusLabel: "Pendiente de confirmacion",
      message:
        "Tu cita fue reagendada. El consultorio revisara y confirmara el nuevo horario.",
    }),
  );

  revalidatePublicAppointmentViews();

  redirect(buildPublicAppointmentPath("reschedule", token));
}
