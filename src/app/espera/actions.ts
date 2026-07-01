"use server";

import {
  AppointmentSource,
  AppointmentStatus,
  WaitlistOfferStatus,
  WaitlistStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAppointmentSafely } from "@/lib/appointments/availability";
import { createAuditLog } from "@/lib/audit";
import {
  enqueueWaitlistOfferAcceptedNotifications,
} from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";
import {
  setPublicWaitlistOfferResultCookie,
} from "@/lib/waitlist/public-result";
import { buildPublicWaitlistOfferPath } from "@/lib/waitlist/public";
import { reactivateWaitlistEntryIfNeeded } from "@/lib/waitlist/matching";
import { validateWaitlistOfferToken } from "@/lib/waitlist/tokens";

function revalidateWaitlistViews() {
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/notifications");
  revalidatePath("/app/waitlist");
}

function buildPublicWaitlistCookiePayload(params: {
  token: string;
  action: "accept" | "reject";
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
  serviceName: string;
  offeredStartAt: Date;
  offeredEndAt: Date;
  statusLabel: string;
  message: string;
}) {
  return {
    token: params.token,
    action: params.action,
    clinicName: params.clinic.name,
    clinicSlug: params.clinic.slug,
    brandColor: params.clinic.brandColor,
    patientName: params.patient.name,
    phoneE164: params.patient.phoneE164,
    email: params.patient.email,
    doctorName: params.doctor.name,
    doctorSpecialty: params.doctor.specialty,
    serviceName: params.serviceName,
    offeredStartAtIso: params.offeredStartAt.toISOString(),
    offeredEndAtIso: params.offeredEndAt.toISOString(),
    timezone: params.clinic.timezone,
    statusLabel: params.statusLabel,
    message: params.message,
  };
}

export async function acceptWaitlistOfferAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/");
  }

  const redirectPath = buildPublicWaitlistOfferPath("accept", token);
  const validation = await validateWaitlistOfferToken({ token });

  if (!validation.ok) {
    redirect(redirectPath);
  }

  const doctorId =
    validation.context.waitlistEntry.doctorId ??
    validation.context.appointment?.doctorId ??
    null;

  if (!doctorId) {
    redirect(buildPublicWaitlistOfferPath("accept", token, { error: "offer-unavailable" }));
  }

  try {
    const appointment = await prisma.$transaction(async (transaction) => {
      const createdAppointment = await createAppointmentSafely({
        clinicId: validation.context.clinicId,
        doctorId,
        serviceId: validation.context.waitlistEntry.serviceId,
        patientId: validation.context.waitlistEntry.patientId,
        startAt: validation.context.offeredStartAt,
        status: AppointmentStatus.PENDING,
        source: AppointmentSource.PUBLIC_BOOKING,
        notes: "Cita creada desde una oferta publica de lista de espera.",
        db: transaction,
      });

      await transaction.waitlistOffer.update({
        where: {
          id: validation.context.id,
        },
        data: {
          status: WaitlistOfferStatus.ACCEPTED,
          appointmentId: createdAppointment.id,
          consumedAt: new Date(),
        },
      });

      await transaction.waitlistOffer.updateMany({
        where: {
          waitlistEntryId: validation.context.waitlistEntryId,
          id: {
            not: validation.context.id,
          },
          status: WaitlistOfferStatus.PENDING,
          consumedAt: null,
        },
        data: {
          status: WaitlistOfferStatus.CANCELLED,
          consumedAt: new Date(),
        },
      });

      await transaction.waitlistEntry.update({
        where: {
          id: validation.context.waitlistEntry.id,
        },
        data: {
          status: WaitlistStatus.CONVERTED,
        },
      });

      await createAuditLog(
        {
          clinicId: validation.context.clinicId,
          action: "WAITLIST_OFFER_ACCEPTED",
          entityType: "WAITLIST_OFFER",
          entityId: validation.context.id,
          metadata: {
            waitlistEntryId: validation.context.waitlistEntry.id,
            appointmentId: createdAppointment.id,
            offeredStartAt: validation.context.offeredStartAt.toISOString(),
            offeredEndAt: validation.context.offeredEndAt.toISOString(),
          },
        },
        transaction,
      );

      await createAuditLog(
        {
          clinicId: validation.context.clinicId,
          action: "WAITLIST_CONVERTED_TO_APPOINTMENT",
          entityType: "WAITLIST_ENTRY",
          entityId: validation.context.waitlistEntry.id,
          metadata: {
            appointmentId: createdAppointment.id,
            waitlistOfferId: validation.context.id,
          },
        },
        transaction,
      );

      await enqueueWaitlistOfferAcceptedNotifications({
        clinicId: validation.context.clinicId,
        waitlistOfferId: validation.context.id,
        appointmentId: createdAppointment.id,
        db: transaction,
      });

      return createdAppointment;
    });

    await setPublicWaitlistOfferResultCookie(
      buildPublicWaitlistCookiePayload({
        token,
        action: "accept",
        clinic: validation.context.clinic,
        patient: validation.context.waitlistEntry.patient,
        doctor:
          validation.context.waitlistEntry.doctor ??
          validation.context.appointment?.doctor ?? {
            name: "Doctor asignado",
            specialty: null,
          },
        serviceName: validation.context.waitlistEntry.service.name,
        offeredStartAt: appointment.startAt,
        offeredEndAt: appointment.endAt,
        statusLabel: "Pendiente de confirmacion",
        message:
          "Tu horario fue aceptado y la cita quedo registrada. El consultorio revisara y confirmara el espacio.",
      }),
    );

    revalidateWaitlistViews();
    redirect(redirectPath);
  } catch (error) {
    console.error("No se pudo aceptar la oferta publica de lista de espera.", error);
    redirect(buildPublicWaitlistOfferPath("accept", token, { error: "slot-unavailable" }));
  }
}

export async function rejectWaitlistOfferAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect("/");
  }

  const redirectPath = buildPublicWaitlistOfferPath("reject", token);
  const validation = await validateWaitlistOfferToken({ token });

  if (!validation.ok) {
    redirect(redirectPath);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.waitlistOffer.update({
      where: {
        id: validation.context.id,
      },
      data: {
        status: WaitlistOfferStatus.DECLINED,
        consumedAt: new Date(),
      },
    });

    await reactivateWaitlistEntryIfNeeded(validation.context.waitlistEntry.id, transaction);

    await createAuditLog(
      {
        clinicId: validation.context.clinicId,
        action: "WAITLIST_OFFER_DECLINED",
        entityType: "WAITLIST_OFFER",
        entityId: validation.context.id,
        metadata: {
          waitlistEntryId: validation.context.waitlistEntry.id,
          offeredStartAt: validation.context.offeredStartAt.toISOString(),
          offeredEndAt: validation.context.offeredEndAt.toISOString(),
        },
      },
      transaction,
    );
  });

  await setPublicWaitlistOfferResultCookie(
    buildPublicWaitlistCookiePayload({
      token,
      action: "reject",
      clinic: validation.context.clinic,
      patient: validation.context.waitlistEntry.patient,
      doctor:
        validation.context.waitlistEntry.doctor ??
        validation.context.appointment?.doctor ?? {
          name: "Doctor asignado",
          specialty: null,
        },
      serviceName: validation.context.waitlistEntry.service.name,
      offeredStartAt: validation.context.offeredStartAt,
      offeredEndAt: validation.context.offeredEndAt,
      statusLabel: "Seguira activa",
      message:
        "Rechazamos este horario y mantendremos tu solicitud activa para futuras coincidencias.",
    }),
  );

  revalidateWaitlistViews();
  redirect(redirectPath);
}
