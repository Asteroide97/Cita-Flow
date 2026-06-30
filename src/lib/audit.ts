import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
  clinicId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog({
  clinicId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: CreateAuditLogInput) {
  try {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      clinicId: clinicId ?? null,
      userId: userId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
    };

    if (typeof metadata !== "undefined") {
      data.metadataJson = metadata;
    }

    await prisma.auditLog.create({ data });
  } catch (error) {
    console.error("No se pudo registrar el audit log.", error);
  }
}
