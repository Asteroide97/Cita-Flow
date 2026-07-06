"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { billingStatusValues } from "@/data/billing-statuses";
import { createAuditLog } from "@/lib/audit";
import { requireSuperAdminContext } from "@/lib/auth/superadmin";
import { prisma } from "@/lib/prisma";

type SuperAdminPathOptions = {
  query?: string | null;
  billing?: string | null;
  businessType?: string | null;
  expandId?: string | null;
  status?: string;
  error?: string;
};

function buildSuperAdminPath(options: SuperAdminPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.query) {
    params.set("q", options.query);
  }

  if (options.billing && options.billing !== "all") {
    params.set("billing", options.billing);
  }

  if (options.businessType && options.businessType !== "all") {
    params.set("type", options.businessType);
  }

  if (options.expandId) {
    params.set("expand", options.expandId);
  }

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `/superadmin${query ? `?${query}` : ""}`;
}

function getReturnContext(formData: FormData) {
  return {
    query: String(formData.get("returnQuery") ?? "").trim() || null,
    billing: String(formData.get("returnBilling") ?? "").trim() || null,
    businessType: String(formData.get("returnBusinessType") ?? "").trim() || null,
    expandId: String(formData.get("expandClinicId") ?? "").trim() || null,
  };
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function parseFollowUpDate(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return {
      value: null as Date | null,
      invalid: false,
    };
  }

  const parsed = new Date(`${normalized}T12:00:00.000Z`);

  if (Number.isNaN(parsed.valueOf())) {
    return {
      value: null as Date | null,
      invalid: true,
    };
  }

  return {
    value: parsed,
    invalid: false,
  };
}

async function requireClinic(clinicId: string) {
  return prisma.clinic.findUnique({
    where: {
      id: clinicId,
    },
    select: {
      id: true,
      billingStatus: true,
      billingNotes: true,
      nextFollowUpAt: true,
      lastContactedAt: true,
    },
  });
}

export async function updateBusinessBillingStatusAction(formData: FormData) {
  const authContext = await requireSuperAdminContext();
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const billingStatus = String(formData.get("billingStatus") ?? "")
    .trim()
    .toUpperCase();
  const returnContext = getReturnContext(formData);
  const nextFollowUpAt = parseFollowUpDate(formData.get("nextFollowUpAt"));

  if (!clinicId) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  if (!billingStatusValues.has(billingStatus)) {
    redirect(
      buildSuperAdminPath({
        ...returnContext,
        expandId: clinicId,
        error: "billing-status-invalid",
      }),
    );
  }

  if (nextFollowUpAt.invalid) {
    redirect(
      buildSuperAdminPath({
        ...returnContext,
        expandId: clinicId,
        error: "follow-up-invalid",
      }),
    );
  }

  const clinic = await requireClinic(clinicId);

  if (!clinic) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.clinic.update({
        where: {
          id: clinic.id,
        },
        data: {
          billingStatus,
          nextFollowUpAt: nextFollowUpAt.value,
        },
      });

      await createAuditLog(
        {
          clinicId: clinic.id,
          userId: authContext.user.id,
          action: "SUPERADMIN_BILLING_STATUS_UPDATED",
          entityType: "CLINIC",
          entityId: clinic.id,
          metadata: {
            previousBillingStatus: clinic.billingStatus,
            nextBillingStatus: billingStatus,
            previousNextFollowUpAt: clinic.nextFollowUpAt?.toISOString() ?? null,
            nextFollowUpAt: nextFollowUpAt.value?.toISOString() ?? null,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    console.error("No se pudo actualizar el estado comercial.", error);
    redirect(
      buildSuperAdminPath({
        ...returnContext,
        expandId: clinicId,
        error: "billing-status-save",
      }),
    );
  }

  revalidatePath("/superadmin");
  redirect(
    buildSuperAdminPath({
      ...returnContext,
      expandId: clinicId,
      status: "billing-status-updated",
    }),
  );
}

export async function updateBusinessBillingNotesAction(formData: FormData) {
  const authContext = await requireSuperAdminContext();
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const billingNotes = normalizeOptionalText(formData.get("billingNotes"));
  const returnContext = getReturnContext(formData);

  if (!clinicId) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  const clinic = await requireClinic(clinicId);

  if (!clinic) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.clinic.update({
        where: {
          id: clinic.id,
        },
        data: {
          billingNotes,
        },
      });

      await createAuditLog(
        {
          clinicId: clinic.id,
          userId: authContext.user.id,
          action: "SUPERADMIN_BILLING_NOTES_UPDATED",
          entityType: "CLINIC",
          entityId: clinic.id,
          metadata: {
            previousBillingNotes: clinic.billingNotes,
            nextBillingNotes: billingNotes,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    console.error("No se pudieron guardar las notas comerciales.", error);
    redirect(
      buildSuperAdminPath({
        ...returnContext,
        expandId: clinicId,
        error: "billing-notes-save",
      }),
    );
  }

  revalidatePath("/superadmin");
  redirect(
    buildSuperAdminPath({
      ...returnContext,
      expandId: clinicId,
      status: "billing-notes-updated",
    }),
  );
}

export async function markBusinessContactedAction(formData: FormData) {
  const authContext = await requireSuperAdminContext();
  const clinicId = String(formData.get("clinicId") ?? "").trim();
  const returnContext = getReturnContext(formData);

  if (!clinicId) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  const clinic = await requireClinic(clinicId);

  if (!clinic) {
    redirect(buildSuperAdminPath({ ...returnContext, error: "clinic-not-found" }));
  }

  const contactedAt = new Date();

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.clinic.update({
        where: {
          id: clinic.id,
        },
        data: {
          lastContactedAt: contactedAt,
        },
      });

      await createAuditLog(
        {
          clinicId: clinic.id,
          userId: authContext.user.id,
          action: "SUPERADMIN_CLIENT_CONTACTED",
          entityType: "CLINIC",
          entityId: clinic.id,
          metadata: {
            previousLastContactedAt: clinic.lastContactedAt?.toISOString() ?? null,
            lastContactedAt: contactedAt.toISOString(),
          },
        },
        transaction,
      );
    });
  } catch (error) {
    console.error("No se pudo registrar el contacto comercial.", error);
    redirect(
      buildSuperAdminPath({
        ...returnContext,
        expandId: clinicId,
        error: "business-contact-save",
      }),
    );
  }

  revalidatePath("/superadmin");
  redirect(
    buildSuperAdminPath({
      ...returnContext,
      expandId: clinicId,
      status: "business-contacted",
    }),
  );
}
