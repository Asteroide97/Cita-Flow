"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { serviceCategoryValues } from "@/data/service-categories";
import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type ServicesPathOptions = {
  editId?: string | null;
  filter?: string | null;
  status?: string;
  error?: string;
};

function buildServicesPath(options: ServicesPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.editId) {
    params.set("edit", options.editId);
  }

  if (options.filter && options.filter !== "all") {
    params.set("filter", options.filter);
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

function parseInteger(value: FormDataEntryValue | null) {
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

function normalizeCategory(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().toLowerCase();

  return normalized || null;
}

function normalizeServiceData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = normalizeCategory(formData.get("category"));
  const description = normalizeOptionalText(formData.get("description"));
  const durationMinutes = parseInteger(formData.get("durationMinutes"));
  const priceCents = parseCurrencyToCents(formData.get("price"));
  const depositRequired = parseBooleanValue(formData.get("depositRequired"));
  const depositCents = parseCurrencyToCents(formData.get("deposit"));
  const publicOrder = parseInteger(formData.get("publicOrder"));
  const isPublic = parseBooleanValue(formData.get("isPublic"));
  const isActive = parseBooleanValue(formData.get("isActive"));

  return {
    name,
    category,
    description,
    durationMinutes,
    priceCents,
    depositRequired,
    depositCents,
    publicOrder,
    isPublic,
    isActive,
  };
}

function revalidateServiceViews(clinicSlug: string) {
  revalidatePath("/app/services");
  revalidatePath("/app/appointments");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/waitlist");
  revalidatePath("/app/whatsapp-simulator");
  revalidatePath(`/booking/${clinicSlug}`);
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
      category: true,
      description: true,
      durationMinutes: true,
      priceCents: true,
      depositRequired: true,
      depositCents: true,
      publicOrder: true,
      isPublic: true,
      isActive: true,
    },
  });
}

function validateServicePayload({
  name,
  category,
  durationMinutes,
  priceCents,
  depositRequired,
  depositCents,
  publicOrder,
}: {
  name: string;
  category: string | null;
  durationMinutes: number | null;
  priceCents: number | null;
  depositRequired: boolean;
  depositCents: number | null;
  publicOrder: number | null;
}) {
  if (!name) {
    return "service-name-required";
  }

  if (category && !serviceCategoryValues.has(category)) {
    return "service-category-invalid";
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
    if (depositCents === null || Number.isNaN(depositCents) || depositCents <= 0) {
      return "service-deposit-required";
    }
  } else if (typeof depositCents === "number" && depositCents < 0) {
    return "service-deposit-invalid";
  }

  if (
    publicOrder === null ||
    Number.isNaN(publicOrder) ||
    publicOrder < 0
  ) {
    return "service-public-order-invalid";
  }

  return null;
}

function resolvePersistedDeposit({
  depositRequired,
  depositCents,
}: {
  depositRequired: boolean;
  depositCents: number | null;
}) {
  if (depositRequired) {
    return depositCents;
  }

  if (depositCents === null || Number.isNaN(depositCents)) {
    return null;
  }

  return depositCents;
}

export async function createServiceAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;
  const serviceData = normalizeServiceData(formData);
  const validationError = validateServicePayload(serviceData);

  if (validationError) {
    redirect(buildServicesPath({ filter, error: validationError }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const service = await transaction.service.create({
        data: {
          clinicId: authContext.clinic.id,
          name: serviceData.name,
          category: serviceData.category,
          description: serviceData.description,
          durationMinutes: serviceData.durationMinutes ?? 15,
          priceCents:
            typeof serviceData.priceCents === "number" ? serviceData.priceCents : null,
          depositRequired: serviceData.depositRequired,
          depositCents: resolvePersistedDeposit(serviceData),
          publicOrder: serviceData.publicOrder ?? 0,
          isPublic: serviceData.isPublic,
          isActive: serviceData.isActive,
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
            category: service.category,
            durationMinutes: service.durationMinutes,
            priceCents: service.priceCents,
            depositRequired: service.depositRequired,
            depositCents: service.depositCents,
            publicOrder: service.publicOrder,
            isPublic: service.isPublic,
            isActive: service.isActive,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildServicesPath({ filter, error: "service-name-duplicate" }));
    }

    console.error("No se pudo crear el servicio.", error);
    redirect(buildServicesPath({ filter, error: "service-save" }));
  }

  revalidateServiceViews(authContext.clinic.slug);
  redirect(buildServicesPath({ filter, status: "service-created" }));
}

export async function updateServiceAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!serviceId) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
  }

  const existingService = await requireServiceForClinic(serviceId, authContext.clinic.id);

  if (!existingService) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
  }

  const serviceData = normalizeServiceData(formData);
  const validationError = validateServicePayload(serviceData);

  if (validationError) {
    redirect(
      buildServicesPath({ editId: serviceId, filter, error: validationError }),
    );
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const updatedService = await transaction.service.update({
        where: {
          id: serviceId,
        },
        data: {
          name: serviceData.name,
          category: serviceData.category,
          description: serviceData.description,
          durationMinutes: serviceData.durationMinutes ?? 15,
          priceCents:
            typeof serviceData.priceCents === "number" ? serviceData.priceCents : null,
          depositRequired: serviceData.depositRequired,
          depositCents: resolvePersistedDeposit(serviceData),
          publicOrder: serviceData.publicOrder ?? 0,
          isPublic: serviceData.isPublic,
          isActive: serviceData.isActive,
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
              category: updatedService.category,
              description: updatedService.description,
              durationMinutes: updatedService.durationMinutes,
              priceCents: updatedService.priceCents,
              depositRequired: updatedService.depositRequired,
              depositCents: updatedService.depositCents,
              publicOrder: updatedService.publicOrder,
              isPublic: updatedService.isPublic,
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

      if (existingService.isPublic !== updatedService.isPublic) {
        await createAuditLog(
          {
            clinicId: authContext.clinic.id,
            userId: authContext.user.id,
            action: "SERVICE_PUBLIC_VISIBILITY_UPDATED",
            entityType: "SERVICE",
            entityId: updatedService.id,
            metadata: {
              name: updatedService.name,
              previousIsPublic: existingService.isPublic,
              nextIsPublic: updatedService.isPublic,
            },
          },
          transaction,
        );
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(
        buildServicesPath({ editId: serviceId, filter, error: "service-name-duplicate" }),
      );
    }

    console.error("No se pudo actualizar el servicio.", error);
    redirect(buildServicesPath({ editId: serviceId, filter, error: "service-save" }));
  }

  revalidateServiceViews(authContext.clinic.slug);
  redirect(buildServicesPath({ filter, status: "service-updated" }));
}

export async function toggleServiceStatusAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const nextIsActive = parseBooleanValue(formData.get("nextIsActive"));
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!serviceId) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
  }

  const service = await requireServiceForClinic(serviceId, authContext.clinic.id);

  if (!service) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
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

  revalidateServiceViews(authContext.clinic.slug);
  redirect(
    buildServicesPath({
      filter,
      status: nextIsActive ? "service-activated" : "service-deactivated",
    }),
  );
}

export async function toggleServicePublicVisibilityAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const nextIsPublic = parseBooleanValue(formData.get("nextIsPublic"));
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!serviceId) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
  }

  const service = await requireServiceForClinic(serviceId, authContext.clinic.id);

  if (!service) {
    redirect(buildServicesPath({ filter, error: "service-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.service.update({
      where: {
        id: service.id,
      },
      data: {
        isPublic: nextIsPublic,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "SERVICE_PUBLIC_VISIBILITY_UPDATED",
        entityType: "SERVICE",
        entityId: service.id,
        metadata: {
          name: service.name,
          previousIsPublic: service.isPublic,
          nextIsPublic,
        },
      },
      transaction,
    );
  });

  revalidateServiceViews(authContext.clinic.slug);
  redirect(
    buildServicesPath({
      filter,
      status: nextIsPublic ? "service-public" : "service-hidden",
    }),
  );
}
