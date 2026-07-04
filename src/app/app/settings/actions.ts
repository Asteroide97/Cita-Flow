"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { businessTypeValues } from "@/data/business-types";

type SettingsPathOptions = {
  status?: string;
  error?: string;
};

function buildSettingsPath(options: SettingsPathOptions = {}) {
  const params = new URLSearchParams();

  if (options.status) {
    params.set("status", options.status);
  }

  if (options.error) {
    params.set("error", options.error);
  }

  const query = params.toString();

  return `/app/settings${query ? `?${query}` : ""}`;
}

function normalizeRequiredText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeOptionalEmail(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized ? normalized : null;
}

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isValidHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidWebsiteUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function revalidateBusinessViews(previousSlug: string, nextSlug: string) {
  revalidatePath("/app/settings");
  revalidatePath(`/booking/${previousSlug}`);

  if (nextSlug !== previousSlug) {
    revalidatePath(`/booking/${nextSlug}`);
  }
}

export async function updateBusinessSettingsAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const name = normalizeRequiredText(formData.get("name"));
  const slug = normalizeSlug(formData.get("slug"));
  const businessType = normalizeOptionalText(formData.get("businessType"));
  const timezone = normalizeRequiredText(formData.get("timezone"));
  const currency = normalizeRequiredText(formData.get("currency")).toUpperCase();
  const brandColor = normalizeOptionalText(formData.get("brandColor"));
  const publicName = normalizeOptionalText(formData.get("publicName"));
  const publicDescription = normalizeOptionalText(formData.get("publicDescription"));
  const websiteUrl = normalizeOptionalText(formData.get("websiteUrl"));
  const contactEmail = normalizeOptionalEmail(formData.get("contactEmail"));
  const contactPhone = normalizeOptionalText(formData.get("contactPhone"));

  if (!name) {
    redirect(buildSettingsPath({ error: "business-name-required" }));
  }

  if (!slug) {
    redirect(buildSettingsPath({ error: "business-slug-required" }));
  }

  if (!isValidSlug(slug)) {
    redirect(buildSettingsPath({ error: "business-slug-invalid" }));
  }

  if (businessType && !businessTypeValues.has(businessType)) {
    redirect(buildSettingsPath({ error: "business-type-invalid" }));
  }

  if (!timezone) {
    redirect(buildSettingsPath({ error: "business-timezone-required" }));
  }

  if (!currency) {
    redirect(buildSettingsPath({ error: "business-currency-required" }));
  }

  if (brandColor && !isValidHexColor(brandColor)) {
    redirect(buildSettingsPath({ error: "business-brand-color-invalid" }));
  }

  if (websiteUrl && !isValidWebsiteUrl(websiteUrl)) {
    redirect(buildSettingsPath({ error: "business-website-invalid" }));
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    redirect(buildSettingsPath({ error: "business-email-invalid" }));
  }

  const currentClinic = await prisma.clinic.findUnique({
    where: {
      id: authContext.clinic.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      timezone: true,
      currency: true,
      brandColor: true,
      publicName: true,
      publicDescription: true,
      websiteUrl: true,
      contactEmail: true,
      contactPhone: true,
    },
  });

  if (!currentClinic) {
    redirect(buildSettingsPath({ error: "business-not-found" }));
  }

  if (slug !== currentClinic.slug) {
    const duplicateClinic = await prisma.clinic.findFirst({
      where: {
        slug,
        id: {
          not: currentClinic.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateClinic) {
      redirect(buildSettingsPath({ error: "business-slug-unavailable" }));
    }
  }

  const changedFields = [
    currentClinic.name !== name ? "name" : null,
    currentClinic.slug !== slug ? "slug" : null,
    currentClinic.businessType !== businessType ? "businessType" : null,
    currentClinic.timezone !== timezone ? "timezone" : null,
    currentClinic.currency !== currency ? "currency" : null,
    currentClinic.brandColor !== brandColor ? "brandColor" : null,
    currentClinic.publicName !== publicName ? "publicName" : null,
    currentClinic.publicDescription !== publicDescription ? "publicDescription" : null,
    currentClinic.websiteUrl !== websiteUrl ? "websiteUrl" : null,
    currentClinic.contactEmail !== contactEmail ? "contactEmail" : null,
    currentClinic.contactPhone !== contactPhone ? "contactPhone" : null,
  ].filter((value): value is string => Boolean(value));

  if (!changedFields.length) {
    redirect(buildSettingsPath({ status: "business-settings-unchanged" }));
  }

  const slugChanged = currentClinic.slug !== slug;
  const brandingChanged =
    currentClinic.brandColor !== brandColor ||
    currentClinic.publicName !== publicName ||
    currentClinic.publicDescription !== publicDescription;

  await prisma.$transaction(async (transaction) => {
    await transaction.clinic.update({
      where: {
        id: currentClinic.id,
      },
      data: {
        name,
        slug,
        businessType,
        timezone,
        currency,
        brandColor,
        publicName,
        publicDescription,
        websiteUrl,
        contactEmail,
        contactPhone,
      },
    });

    await createAuditLog(
      {
        clinicId: currentClinic.id,
        userId: authContext.user.id,
        action: "BUSINESS_SETTINGS_UPDATED",
        entityType: "CLINIC",
        entityId: currentClinic.id,
        metadata: {
          changedFields,
        },
      },
      transaction,
    );

    if (slugChanged) {
      await createAuditLog(
        {
          clinicId: currentClinic.id,
          userId: authContext.user.id,
          action: "BUSINESS_SLUG_UPDATED",
          entityType: "CLINIC",
          entityId: currentClinic.id,
          metadata: {
            previousSlug: currentClinic.slug,
            nextSlug: slug,
          },
        },
        transaction,
      );
    }

    if (brandingChanged) {
      await createAuditLog(
        {
          clinicId: currentClinic.id,
          userId: authContext.user.id,
          action: "BUSINESS_BRAND_UPDATED",
          entityType: "CLINIC",
          entityId: currentClinic.id,
          metadata: {
            previousBrandColor: currentClinic.brandColor,
            nextBrandColor: brandColor,
            previousPublicName: currentClinic.publicName,
            nextPublicName: publicName,
            previousPublicDescription: currentClinic.publicDescription,
            nextPublicDescription: publicDescription,
          },
        },
        transaction,
      );
    }
  });

  revalidateBusinessViews(currentClinic.slug, slug);
  redirect(buildSettingsPath({ status: "business-settings-updated" }));
}
