"use server";

import { WaitlistOfferStatus, WaitlistStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { expireWaitlistOfferById } from "@/lib/waitlist/matching";

function buildWaitlistPath(params: {
  status?: string;
  error?: string;
} = {}) {
  const query = new URLSearchParams();

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();

  return `/app/waitlist${serialized ? `?${serialized}` : ""}`;
}

function revalidateWaitlistViews() {
  revalidatePath("/app/notifications");
  revalidatePath("/app/waitlist");
}

export async function cancelWaitlistEntryAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const waitlistEntryId = String(formData.get("waitlistEntryId") ?? "").trim();

  if (!waitlistEntryId) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-not-found" }));
  }

  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      id: waitlistEntryId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!entry) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-not-found" }));
  }

  if (
    entry.status !== WaitlistStatus.ACTIVE &&
    entry.status !== WaitlistStatus.OFFERED
  ) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-action-invalid" }));
  }

  await prisma.$transaction(async (transaction) => {
    const pendingOffers = await transaction.waitlistOffer.findMany({
      where: {
        clinicId: authContext.clinic.id,
        waitlistEntryId: entry.id,
        status: WaitlistOfferStatus.PENDING,
        consumedAt: null,
      },
      select: {
        id: true,
      },
    });

    await transaction.waitlistEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: WaitlistStatus.CANCELLED,
      },
    });

    await transaction.waitlistOffer.updateMany({
      where: {
        id: {
          in: pendingOffers.map((offer) => offer.id),
        },
      },
      data: {
        status: WaitlistOfferStatus.CANCELLED,
        consumedAt: new Date(),
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "WAITLIST_ENTRY_CANCELLED",
        entityType: "WAITLIST_ENTRY",
        entityId: entry.id,
        metadata: {
          previousStatus: entry.status,
          cancelledOffers: pendingOffers.length,
        },
      },
      transaction,
    );
  });

  revalidateWaitlistViews();
  redirect(buildWaitlistPath({ status: "waitlist-entry-cancelled" }));
}

export async function expireWaitlistEntryAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const waitlistEntryId = String(formData.get("waitlistEntryId") ?? "").trim();

  if (!waitlistEntryId) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-not-found" }));
  }

  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      id: waitlistEntryId,
      clinicId: authContext.clinic.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!entry) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-not-found" }));
  }

  if (
    entry.status !== WaitlistStatus.ACTIVE &&
    entry.status !== WaitlistStatus.OFFERED
  ) {
    redirect(buildWaitlistPath({ error: "waitlist-entry-action-invalid" }));
  }

  await prisma.$transaction(async (transaction) => {
    const pendingOffers = await transaction.waitlistOffer.findMany({
      where: {
        clinicId: authContext.clinic.id,
        waitlistEntryId: entry.id,
        status: WaitlistOfferStatus.PENDING,
        consumedAt: null,
      },
      select: {
        id: true,
      },
    });

    for (const offer of pendingOffers) {
      await expireWaitlistOfferById({
        clinicId: authContext.clinic.id,
        waitlistOfferId: offer.id,
        actorUserId: authContext.user.id,
        db: transaction,
      });
    }

    await transaction.waitlistEntry.update({
      where: {
        id: entry.id,
      },
      data: {
        status: WaitlistStatus.EXPIRED,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "WAITLIST_ENTRY_EXPIRED",
        entityType: "WAITLIST_ENTRY",
        entityId: entry.id,
        metadata: {
          previousStatus: entry.status,
          expiredOffers: pendingOffers.length,
        },
      },
      transaction,
    );
  });

  revalidateWaitlistViews();
  redirect(buildWaitlistPath({ status: "waitlist-entry-expired" }));
}
