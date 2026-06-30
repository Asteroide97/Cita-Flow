"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type ServicesPathOptions = {
  editId?: string | null;
  status?: string;
  error?: string;
};

function buildServicesPath(options: ServicesPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.editId) {
    params.set("edit", options.editId);
  }

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `/app/services${query ? `?${query}` : ""}`;
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function parsePositiveInteger(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function parseCurrencyToCents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return Math.round(parsed * 100);
}

function parseBooleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function revalidateServiceViews() {
  revalidatePath("/app/services");
  revalidatePath("/app/whatsapp-simulator");
}

async function requireServiceForClinic(serviceId: string, clinicId: string) {
  return prisma.service.findFirst({
    where: {
      id: serviceId,
      clinicId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      durationMinutes: true,
      priceCents: true,
      depositRequired: true,
      depositCents: true,
      isActive: true,
    },
  });
}

function validateServicePayload({
  name,
  durationMinutes,
  priceCents,
  depositRequired,
  depositCents,
}: {
  name: string;
  durationMinutes: number | null;
  priceCents: number | null;
  depositRequired: boolean;
  depositCents: number | null;
}) {
  if (!name) {
    return "service-name-required";
  }

  if (!durationMinutes || durationMinutes < 15) {
    return "service-duration-min";
  }

  if (durationMinutes % 15 !== 0) {
    return "service-duration-step";
  }

  if (Number.isNaN(priceCents) || (typeof priceCents === "number" && priceCents < 0)) {
    return "service-price-invalid";
  }

  if (depositRequired) {
    if (
      depositCents === null ||
      Number.isNaN(depositCents) ||
      depositCents <= 0
    ) {
      return "service-deposit-required";
    }
  } else if (typeof depositCents === "number" && depositCents < 0) {
    return "service-deposit-invalid";
  }

  return null;
}

export async function createServiceAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const name = String(formData.get("name") ?? "").trim();
  const description = normalizeOptionalText(formData.get("description"));
  const durationMinutes = parsePositiveInteger(formData.get("durationMinutes"));
  const priceCents = parseCurrencyToCents(formData.get("price"));
  const depositRequired = parseBooleanValue(formData.get("depositRequired"));
  const depositCents = parseCurrencyToCents(formData.get("deposit"));
  const isActive = parseBooleanValue(formData.get("isActive"));
  const validationError = validateServicePayload({
    name,
    durationMinutes,
    priceCents,
    depositRequired,
    depositCents,
  });

  if (validationError) {
    redirect(buildServicesPath({ error: validationError }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const service = await transaction.service.create({
        data: {
          clinicId: authContext.clinic.id,
          name,
          description,
          durationMinutes: durationMinutes ?? 15,
          priceCents: typeof priceCents === "number" ? priceCents : null,
          depositRequired,
          depositCents: depositRequired ? depositCents : null,
          isActive,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "SERVICE_CREATED",
          entityType: "SERVICE",
          entityId: service.id,
          metadata: {
            name: service.name,
            durationMinutes: service.durationMinutes,
            priceCents: service.priceCents,
            depositRequired: service.depositRequired,
            depositCents: service.depositCents,
            isActive: service.isActive,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildServicesPath({ error: "service-name-duplicate" }));
    }

    console.error("No se pudo crear el servicio.", error);
    redirect(buildServicesPath({ error: "service-save" }));
  }

  revalidateServiceViews();
  redirect(buildServicesPath({ status: "service-created" }));
}

export async function updateServiceAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = normalizeOptionalText(formData.get("description"));
  const durationMinutes = parsePositiveInteger(formData.get("durationMinutes"));
  const priceCents = parseCurrencyToCents(formData.get("price"));
  const depositRequired = parseBooleanValue(formData.get("depositRequired"));
  const depositCents = parseCurrencyToCents(formData.get("deposit"));
  const isActive = parseBooleanValue(formData.get("isActive"));

  if (!serviceId) {
    redirect(buildServicesPath({ error: "service-not-found" }));
  }

  const existingService = await requireServiceForClinic(serviceId, authContext.clinic.id);

  if (!existingService) {
    redirect(buildServicesPath({ error: "service-not-found" }));
  }

  const validationError = validateServicePayload({
    name,
    durationMinutes,
    priceCents,
    depositRequired,
    depositCents,
  });

  if (validationError) {
    redirect(buildServicesPath({ editId: serviceId, error: validationError }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const updatedService = await transaction.service.update({
        where: {
          id: serviceId,
        },
        data: {
          name,
          description,
          durationMinutes: durationMinutes ?? 15,
          priceCents: typeof priceCents === "number" ? priceCents : null,
          depositRequired,
          depositCents: depositRequired ? depositCents : null,
          isActive,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "SERVICE_UPDATED",
          entityType: "SERVICE",
          entityId: updatedService.id,
          metadata: {
            previous: existingService,
            current: {
              name: updatedService.name,
              description: updatedService.description,
              durationMinutes: updatedService.durationMinutes,
              priceCents: updatedService.priceCents,
              depositRequired: updatedService.depositRequired,
              depositCents: updatedService.depositCents,
              isActive: updatedService.isActive,
            },
          },
        },
        transaction,
      );

      if (existingService.isActive !== updatedService.isActive) {
        await createAuditLog(
          {
            clinicId: authContext.clinic.id,
            userId: authContext.user.id,
            action: updatedService.isActive
              ? "SERVICE_ACTIVATED"
              : "SERVICE_DEACTIVATED",
            entityType: "SERVICE",
            entityId: updatedService.id,
            metadata: {
              name: updatedService.name,
            },
          },
          transaction,
        );
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildServicesPath({ editId: serviceId, error: "service-name-duplicate" }));
    }

    console.error("No se pudo actualizar el servicio.", error);
    redirect(buildServicesPath({ editId: serviceId, error: "service-save" }));
  }

  revalidateServiceViews();
  redirect(buildServicesPath({ status: "service-updated" }));
}

export async function toggleServiceStatusAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const nextIsActive = parseBooleanValue(formData.get("nextIsActive"));

  if (!serviceId) {
    redirect(buildServicesPath({ error: "service-not-found" }));
  }

  const service = await requireServiceForClinic(serviceId, authContext.clinic.id);

  if (!service) {
    redirect(buildServicesPath({ error: "service-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.service.update({
      where: {
        id: service.id,
      },
      data: {
        isActive: nextIsActive,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: nextIsActive ? "SERVICE_ACTIVATED" : "SERVICE_DEACTIVATED",
        entityType: "SERVICE",
        entityId: service.id,
        metadata: {
          name: service.name,
        },
      },
      transaction,
    );
  });

  revalidateServiceViews();
  redirect(
    buildServicesPath({
      status: nextIsActive ? "service-activated" : "service-deactivated",
    }),
  );
}
