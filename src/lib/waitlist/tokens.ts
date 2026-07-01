import {
  WaitlistOfferStatus,
  WaitlistStatus,
  type Prisma,
} from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

type WaitlistTokenClient = Prisma.TransactionClient | typeof prisma;

const WAITLIST_OFFER_DURATION_MS = 15 * 60 * 1000;

export type WaitlistOfferLinks = {
  acceptUrl: string;
  rejectUrl: string;
};

export type WaitlistOfferTokenBundle = WaitlistOfferLinks & {
  offerId: string;
  token: string;
  expiresAt: Date;
};

export type WaitlistOfferTokenContext = Prisma.WaitlistOfferGetPayload<{
  select: {
    id: true;
    clinicId: true;
    waitlistEntryId: true;
    appointmentId: true;
    offeredStartAt: true;
    offeredEndAt: true;
    status: true;
    expiresAt: true;
    consumedAt: true;
    clinic: {
      select: {
        id: true;
        name: true;
        slug: true;
        timezone: true;
        currency: true;
        brandColor: true;
        isActive: true;
      };
    };
    waitlistEntry: {
      select: {
        id: true;
        clinicId: true;
        patientId: true;
        serviceId: true;
        doctorId: true;
        preferredDate: true;
        preferredStartTime: true;
        preferredEndTime: true;
        notes: true;
        autoAccept: true;
        status: true;
        createdAt: true;
        patient: {
          select: {
            id: true;
            name: true;
            phoneE164: true;
            email: true;
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
        doctor: {
          select: {
            id: true;
            name: true;
            specialty: true;
          };
        };
      };
    };
    appointment: {
      select: {
        id: true;
        clinicId: true;
        doctorId: true;
        serviceId: true;
        patientId: true;
        startAt: true;
        endAt: true;
        source: true;
        status: true;
        doctor: {
          select: {
            id: true;
            name: true;
            specialty: true;
          };
        };
      };
    };
  };
}>;

export type ValidateWaitlistOfferTokenResult =
  | {
      ok: true;
      context: WaitlistOfferTokenContext;
    }
  | {
      ok: false;
      reason:
        | "TOKEN_NOT_FOUND"
        | "TOKEN_EXPIRED"
        | "TOKEN_CONSUMED"
        | "OFFER_NOT_PENDING"
        | "CLINIC_INACTIVE"
        | "WAITLIST_ENTRY_NOT_FOUND"
        | "WAITLIST_ENTRY_NOT_ACTIVE";
    };

export function hashWaitlistOfferToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildWaitlistOfferPath(
  action: "accept" | "reject",
  token: string,
) {
  return action === "accept"
    ? `/espera/aceptar/${token}`
    : `/espera/rechazar/${token}`;
}

export async function createWaitlistOfferToken({
  clinicId,
  waitlistEntryId,
  offeredStartAt,
  offeredEndAt,
  sourceAppointmentId = null,
  expiresAt = new Date(Date.now() + WAITLIST_OFFER_DURATION_MS),
  db = prisma,
}: {
  clinicId: string;
  waitlistEntryId: string;
  offeredStartAt: Date;
  offeredEndAt: Date;
  sourceAppointmentId?: string | null;
  expiresAt?: Date;
  db?: WaitlistTokenClient;
}): Promise<WaitlistOfferTokenBundle> {
  const token = randomBytes(32).toString("base64url");
  const offer = await db.waitlistOffer.create({
    data: {
      clinicId,
      waitlistEntryId,
      appointmentId: sourceAppointmentId,
      offeredStartAt,
      offeredEndAt,
      status: WaitlistOfferStatus.PENDING,
      expiresAt,
      tokenHash: hashWaitlistOfferToken(token),
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  return {
    offerId: offer.id,
    token,
    expiresAt: offer.expiresAt,
    acceptUrl: buildWaitlistOfferPath("accept", token),
    rejectUrl: buildWaitlistOfferPath("reject", token),
  };
}

export async function validateWaitlistOfferToken({
  token,
  db = prisma,
}: {
  token: string;
  db?: WaitlistTokenClient;
}): Promise<ValidateWaitlistOfferTokenResult> {
  const offer = await db.waitlistOffer.findUnique({
    where: {
      tokenHash: hashWaitlistOfferToken(token),
    },
    select: {
      id: true,
      clinicId: true,
      waitlistEntryId: true,
      appointmentId: true,
      offeredStartAt: true,
      offeredEndAt: true,
      status: true,
      expiresAt: true,
      consumedAt: true,
      clinic: {
        select: {
          id: true,
          name: true,
          slug: true,
          timezone: true,
          currency: true,
          brandColor: true,
          isActive: true,
        },
      },
      waitlistEntry: {
        select: {
          id: true,
          clinicId: true,
          patientId: true,
          serviceId: true,
          doctorId: true,
          preferredDate: true,
          preferredStartTime: true,
          preferredEndTime: true,
          notes: true,
          autoAccept: true,
          status: true,
          createdAt: true,
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
              durationMinutes: true,
              priceCents: true,
              depositRequired: true,
              depositCents: true,
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
      },
      appointment: {
        select: {
          id: true,
          clinicId: true,
          doctorId: true,
          serviceId: true,
          patientId: true,
          startAt: true,
          endAt: true,
          source: true,
          status: true,
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
            },
          },
        },
      },
    },
  });

  if (!offer) {
    return {
      ok: false,
      reason: "TOKEN_NOT_FOUND",
    };
  }

  if (offer.consumedAt) {
    return {
      ok: false,
      reason: "TOKEN_CONSUMED",
    };
  }

  if (offer.expiresAt <= new Date()) {
    return {
      ok: false,
      reason: "TOKEN_EXPIRED",
    };
  }

  if (offer.status !== WaitlistOfferStatus.PENDING) {
    return {
      ok: false,
      reason: "OFFER_NOT_PENDING",
    };
  }

  if (!offer.clinic.isActive) {
    return {
      ok: false,
      reason: "CLINIC_INACTIVE",
    };
  }

  if (!offer.waitlistEntry) {
    return {
      ok: false,
      reason: "WAITLIST_ENTRY_NOT_FOUND",
    };
  }

  if (
    offer.waitlistEntry.status !== WaitlistStatus.ACTIVE &&
    offer.waitlistEntry.status !== WaitlistStatus.OFFERED
  ) {
    return {
      ok: false,
      reason: "WAITLIST_ENTRY_NOT_ACTIVE",
    };
  }

  return {
    ok: true,
    context: offer,
  };
}

export async function consumeWaitlistOfferToken({
  offerId,
  db = prisma,
}: {
  offerId: string;
  db?: WaitlistTokenClient;
}) {
  const result = await db.waitlistOffer.updateMany({
    where: {
      id: offerId,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return result.count > 0;
}
