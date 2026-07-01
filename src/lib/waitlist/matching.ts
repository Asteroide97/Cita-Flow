import {
  AppointmentSource,
  AppointmentStatus,
  WaitlistOfferStatus,
  WaitlistStatus,
  type Prisma,
} from "@prisma/client";

import { createAppointmentSafely } from "@/lib/appointments/availability";
import { formatDateValueInTimeZone } from "@/lib/appointments/tokens";
import { createAuditLog } from "@/lib/audit";
import {
  enqueueWaitlistAutoAssignedNotifications,
  enqueueWaitlistOfferExpiredNotifications,
  enqueueWaitlistSlotOfferedNotifications,
} from "@/lib/notifications/outbox";
import { prisma } from "@/lib/prisma";

import { createWaitlistOfferToken } from "./tokens";

type WaitlistClient = Prisma.TransactionClient | typeof prisma;

function timeRangeMatches(params: {
  preferredStartTime: string | null;
  preferredEndTime: string | null;
  slotStartTime: string;
  slotEndTime: string;
}) {
  if (params.preferredStartTime && params.slotStartTime < params.preferredStartTime) {
    return false;
  }

  if (params.preferredEndTime && params.slotEndTime > params.preferredEndTime) {
    return false;
  }

  return true;
}

function getTimeLabel(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

function waitlistEntryMatchesFreedSlot(
  entry: {
    doctorId: string | null;
    preferredDate: Date | null;
    preferredStartTime: string | null;
    preferredEndTime: string | null;
  },
  slot: {
    doctorId: string;
    startAt: Date;
    endAt: Date;
  },
  timezone: string,
) {
  if (entry.doctorId && entry.doctorId !== slot.doctorId) {
    return false;
  }

  if (entry.preferredDate) {
    const preferredDateValue = formatDateValueInTimeZone(entry.preferredDate, timezone);
    const slotDateValue = formatDateValueInTimeZone(slot.startAt, timezone);

    if (preferredDateValue !== slotDateValue) {
      return false;
    }
  }

  return timeRangeMatches({
    preferredStartTime: entry.preferredStartTime,
    preferredEndTime: entry.preferredEndTime,
    slotStartTime: getTimeLabel(slot.startAt, timezone),
    slotEndTime: getTimeLabel(slot.endAt, timezone),
  });
}

function getWaitlistPriority(doctorId: string | null, freedDoctorId: string) {
  if (doctorId === freedDoctorId) {
    return 0;
  }

  if (doctorId === null) {
    return 1;
  }

  return Number.POSITIVE_INFINITY;
}

export async function reactivateWaitlistEntryIfNeeded(
  waitlistEntryId: string,
  db: WaitlistClient,
) {
  const pendingOffersCount = await db.waitlistOffer.count({
    where: {
      waitlistEntryId,
      status: WaitlistOfferStatus.PENDING,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (pendingOffersCount > 0) {
    return;
  }

  await db.waitlistEntry.updateMany({
    where: {
      id: waitlistEntryId,
      status: WaitlistStatus.OFFERED,
    },
    data: {
      status: WaitlistStatus.ACTIVE,
    },
  });
}

export async function expireWaitlistOfferById({
  clinicId,
  waitlistOfferId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  waitlistOfferId: string;
  actorUserId?: string | null;
  db?: WaitlistClient;
}) {
  const offer = await db.waitlistOffer.findFirst({
    where: {
      id: waitlistOfferId,
      clinicId,
    },
    select: {
      id: true,
      waitlistEntryId: true,
      status: true,
      consumedAt: true,
    },
  });

  if (!offer || offer.status !== WaitlistOfferStatus.PENDING || offer.consumedAt) {
    return false;
  }

  await db.waitlistOffer.update({
    where: {
      id: offer.id,
    },
    data: {
      status: WaitlistOfferStatus.EXPIRED,
      consumedAt: new Date(),
    },
  });

  await reactivateWaitlistEntryIfNeeded(offer.waitlistEntryId, db);

  await enqueueWaitlistOfferExpiredNotifications({
    clinicId,
    waitlistOfferId: offer.id,
    actorUserId,
    db,
  });

  return true;
}

export async function expirePendingWaitlistOffers({
  clinicId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  actorUserId?: string | null;
  db?: WaitlistClient;
}) {
  const offers = await db.waitlistOffer.findMany({
    where: {
      clinicId,
      status: WaitlistOfferStatus.PENDING,
      consumedAt: null,
      expiresAt: {
        lte: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  for (const offer of offers) {
    await expireWaitlistOfferById({
      clinicId,
      waitlistOfferId: offer.id,
      actorUserId,
      db,
    });
  }

  return offers.length;
}

export async function processWaitlistForCancelledAppointment({
  clinicId,
  cancelledAppointmentId,
  actorUserId = null,
  db = prisma,
}: {
  clinicId: string;
  cancelledAppointmentId: string;
  actorUserId?: string | null;
  db?: WaitlistClient;
}) {
  await expirePendingWaitlistOffers({
    clinicId,
    actorUserId,
    db,
  });

  const cancelledAppointment = await db.appointment.findFirst({
    where: {
      id: cancelledAppointmentId,
      clinicId,
      status: AppointmentStatus.CANCELLED,
    },
    select: {
      id: true,
      clinicId: true,
      doctorId: true,
      serviceId: true,
      startAt: true,
      endAt: true,
      clinic: {
        select: {
          timezone: true,
        },
      },
    },
  });

  if (!cancelledAppointment) {
    return {
      matched: false,
      reason: "CANCELLED_APPOINTMENT_NOT_FOUND",
    } as const;
  }

  const entries = await db.waitlistEntry.findMany({
    where: {
      clinicId,
      serviceId: cancelledAppointment.serviceId,
      status: WaitlistStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialty: true,
        },
      },
    },
  });

  const eligibleEntries = entries
    .filter((entry) =>
      waitlistEntryMatchesFreedSlot(
        entry,
        {
          doctorId: cancelledAppointment.doctorId,
          startAt: cancelledAppointment.startAt,
          endAt: cancelledAppointment.endAt,
        },
        cancelledAppointment.clinic.timezone,
      ),
    )
    .map((entry) => ({
      entry,
      priority: getWaitlistPriority(entry.doctorId, cancelledAppointment.doctorId),
    }))
    .filter((item) => Number.isFinite(item.priority))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.entry.createdAt.getTime() - right.entry.createdAt.getTime();
    });

  for (const candidate of eligibleEntries) {
    await createAuditLog(
      {
        clinicId,
        userId: actorUserId,
        action: "WAITLIST_SLOT_MATCHED",
        entityType: "WAITLIST_ENTRY",
        entityId: candidate.entry.id,
        metadata: {
          cancelledAppointmentId: cancelledAppointment.id,
          serviceId: cancelledAppointment.serviceId,
          doctorId: cancelledAppointment.doctorId,
          offeredStartAt: cancelledAppointment.startAt.toISOString(),
          offeredEndAt: cancelledAppointment.endAt.toISOString(),
          autoAccept: candidate.entry.autoAccept,
          priority: candidate.priority,
        },
      },
      db,
    );

    if (candidate.entry.autoAccept) {
      try {
        const appointment = await createAppointmentSafely({
          clinicId,
          doctorId: cancelledAppointment.doctorId,
          serviceId: cancelledAppointment.serviceId,
          patientId: candidate.entry.patientId,
          startAt: cancelledAppointment.startAt,
          status: AppointmentStatus.PENDING,
          source: AppointmentSource.PUBLIC_BOOKING,
          notes: "Asignada automaticamente desde lista de espera.",
          actorUserId,
          db,
        });

        await db.waitlistEntry.update({
          where: {
            id: candidate.entry.id,
          },
          data: {
            status: WaitlistStatus.CONVERTED,
          },
        });

        await createAuditLog(
          {
            clinicId,
            userId: actorUserId,
            action: "WAITLIST_AUTO_ASSIGNED",
            entityType: "WAITLIST_ENTRY",
            entityId: candidate.entry.id,
            metadata: {
              appointmentId: appointment.id,
              offeredStartAt: cancelledAppointment.startAt.toISOString(),
              offeredEndAt: cancelledAppointment.endAt.toISOString(),
            },
          },
          db,
        );

        await createAuditLog(
          {
            clinicId,
            userId: actorUserId,
            action: "WAITLIST_CONVERTED_TO_APPOINTMENT",
            entityType: "WAITLIST_ENTRY",
            entityId: candidate.entry.id,
            metadata: {
              appointmentId: appointment.id,
            },
          },
          db,
        );

        await enqueueWaitlistAutoAssignedNotifications({
          clinicId,
          waitlistEntryId: candidate.entry.id,
          appointmentId: appointment.id,
          actorUserId,
          db,
        });

        return {
          matched: true,
          mode: "auto-assigned",
          waitlistEntryId: candidate.entry.id,
          appointmentId: appointment.id,
        } as const;
      } catch (error) {
        await createAuditLog(
          {
            clinicId,
            userId: actorUserId,
            action: "WAITLIST_AUTO_ASSIGN_FAILED",
            entityType: "WAITLIST_ENTRY",
            entityId: candidate.entry.id,
            metadata: {
              cancelledAppointmentId: cancelledAppointment.id,
              errorMessage:
                error instanceof Error
                  ? error.message
                  : "WAITLIST_AUTO_ASSIGN_FAILED",
            },
          },
          db,
        );

        continue;
      }
    }

    const offerBundle = await createWaitlistOfferToken({
      clinicId,
      waitlistEntryId: candidate.entry.id,
      offeredStartAt: cancelledAppointment.startAt,
      offeredEndAt: cancelledAppointment.endAt,
      sourceAppointmentId: cancelledAppointment.id,
      db,
    });

    await db.waitlistEntry.update({
      where: {
        id: candidate.entry.id,
      },
      data: {
        status: WaitlistStatus.OFFERED,
      },
    });

    await createAuditLog(
      {
        clinicId,
        userId: actorUserId,
        action: "WAITLIST_OFFER_CREATED",
        entityType: "WAITLIST_OFFER",
        entityId: offerBundle.offerId,
        metadata: {
          waitlistEntryId: candidate.entry.id,
          cancelledAppointmentId: cancelledAppointment.id,
          offeredStartAt: cancelledAppointment.startAt.toISOString(),
          offeredEndAt: cancelledAppointment.endAt.toISOString(),
          expiresAt: offerBundle.expiresAt.toISOString(),
        },
      },
      db,
    );

    await enqueueWaitlistSlotOfferedNotifications({
      clinicId,
      waitlistOfferId: offerBundle.offerId,
      acceptUrl: offerBundle.acceptUrl,
      rejectUrl: offerBundle.rejectUrl,
      actorUserId,
      db,
    });

    return {
      matched: true,
      mode: "offer-created",
      waitlistEntryId: candidate.entry.id,
      waitlistOfferId: offerBundle.offerId,
    } as const;
  }

  return {
    matched: false,
    reason: "NO_WAITLIST_MATCH",
  } as const;
}
