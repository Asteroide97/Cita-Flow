"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type DoctorsPathOptions = {
  editId?: string | null;
  filter?: string | null;
  status?: string;
  error?: string;
};

function buildDoctorsPath(options: DoctorsPathOptions = {}) {
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

  return `/app/doctors${query ? `?${query}` : ""}`;
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function parseBooleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
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

function isValidPhotoUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeDoctorData(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const specialty = normalizeOptionalText(formData.get("specialty"));
  const bio = normalizeOptionalText(formData.get("bio"));
  const photoUrl = normalizeOptionalText(formData.get("photoUrl"));
  const publicOrder = parseInteger(formData.get("publicOrder"));
  const isPublic = parseBooleanValue(formData.get("isPublic"));
  const isActive = parseBooleanValue(formData.get("isActive"));

  return {
    name,
    specialty,
    bio,
    photoUrl,
    publicOrder,
    isPublic,
    isActive,
  };
}

function validateDoctorPayload({
  name,
  publicOrder,
  photoUrl,
}: {
  name: string;
  publicOrder: number | null;
  photoUrl: string | null;
}) {
  if (!name) {
    return "doctor-name-required";
  }

  if (publicOrder === null || Number.isNaN(publicOrder) || publicOrder < 0) {
    return "doctor-public-order-invalid";
  }

  if (photoUrl && !isValidPhotoUrl(photoUrl)) {
    return "doctor-photo-url-invalid";
  }

  return null;
}

function revalidateDoctorViews(clinicSlug: string, doctorId?: string) {
  revalidatePath("/app/doctors");
  revalidatePath("/app/appointments");
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/whatsapp-simulator");
  revalidatePath(`/booking/${clinicSlug}`);

  if (doctorId) {
    revalidatePath(`/app/doctors/${doctorId}/availability`);
  }
}

async function requireDoctorForClinic(doctorId: string, clinicId: string) {
  return prisma.doctor.findFirst({
    where: {
      id: doctorId,
      clinicId,
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
      publicOrder: true,
      isPublic: true,
      photoUrl: true,
      isActive: true,
    },
  });
}

export async function createDoctorAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;
  const doctorData = normalizeDoctorData(formData);
  const validationError = validateDoctorPayload(doctorData);

  if (validationError) {
    redirect(buildDoctorsPath({ filter, error: validationError }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const doctor = await transaction.doctor.create({
        data: {
          clinicId: authContext.clinic.id,
          name: doctorData.name,
          specialty: doctorData.specialty,
          bio: doctorData.bio,
          publicOrder: doctorData.publicOrder ?? 0,
          isPublic: doctorData.isPublic,
          photoUrl: doctorData.photoUrl,
          isActive: doctorData.isActive,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "DOCTOR_CREATED",
          entityType: "DOCTOR",
          entityId: doctor.id,
          metadata: {
            name: doctor.name,
            specialty: doctor.specialty,
            bio: doctor.bio,
            publicOrder: doctor.publicOrder,
            isPublic: doctor.isPublic,
            photoUrl: doctor.photoUrl,
            isActive: doctor.isActive,
          },
        },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(buildDoctorsPath({ filter, error: "doctor-save" }));
    }

    console.error("No se pudo crear el profesional.", error);
    redirect(buildDoctorsPath({ filter, error: "doctor-save" }));
  }

  revalidateDoctorViews(authContext.clinic.slug);
  redirect(buildDoctorsPath({ filter, status: "doctor-created" }));
}

export async function updateDoctorAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!doctorId) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  const existingDoctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!existingDoctor) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  const doctorData = normalizeDoctorData(formData);
  const validationError = validateDoctorPayload(doctorData);

  if (validationError) {
    redirect(buildDoctorsPath({ editId: doctorId, filter, error: validationError }));
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const updatedDoctor = await transaction.doctor.update({
        where: {
          id: existingDoctor.id,
        },
        data: {
          name: doctorData.name,
          specialty: doctorData.specialty,
          bio: doctorData.bio,
          publicOrder: doctorData.publicOrder ?? 0,
          isPublic: doctorData.isPublic,
          photoUrl: doctorData.photoUrl,
          isActive: doctorData.isActive,
        },
      });

      await createAuditLog(
        {
          clinicId: authContext.clinic.id,
          userId: authContext.user.id,
          action: "DOCTOR_UPDATED",
          entityType: "DOCTOR",
          entityId: updatedDoctor.id,
          metadata: {
            previous: existingDoctor,
            current: {
              name: updatedDoctor.name,
              specialty: updatedDoctor.specialty,
              bio: updatedDoctor.bio,
              publicOrder: updatedDoctor.publicOrder,
              isPublic: updatedDoctor.isPublic,
              photoUrl: updatedDoctor.photoUrl,
              isActive: updatedDoctor.isActive,
            },
          },
        },
        transaction,
      );

      if (existingDoctor.isActive !== updatedDoctor.isActive) {
        await createAuditLog(
          {
            clinicId: authContext.clinic.id,
            userId: authContext.user.id,
            action: updatedDoctor.isActive
              ? "DOCTOR_ACTIVATED"
              : "DOCTOR_DEACTIVATED",
            entityType: "DOCTOR",
            entityId: updatedDoctor.id,
            metadata: {
              name: updatedDoctor.name,
            },
          },
          transaction,
        );
      }

      if (existingDoctor.isPublic !== updatedDoctor.isPublic) {
        await createAuditLog(
          {
            clinicId: authContext.clinic.id,
            userId: authContext.user.id,
            action: "DOCTOR_PUBLIC_VISIBILITY_UPDATED",
            entityType: "DOCTOR",
            entityId: updatedDoctor.id,
            metadata: {
              name: updatedDoctor.name,
              previousIsPublic: existingDoctor.isPublic,
              nextIsPublic: updatedDoctor.isPublic,
            },
          },
          transaction,
        );
      }
    });
  } catch (error) {
    console.error("No se pudo actualizar el profesional.", error);
    redirect(buildDoctorsPath({ editId: doctorId, filter, error: "doctor-save" }));
  }

  revalidateDoctorViews(authContext.clinic.slug, doctorId);
  redirect(buildDoctorsPath({ filter, status: "doctor-updated" }));
}

export async function toggleDoctorStatusAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const nextIsActive = parseBooleanValue(formData.get("nextIsActive"));
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!doctorId) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.doctor.update({
      where: {
        id: doctor.id,
      },
      data: {
        isActive: nextIsActive,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: nextIsActive ? "DOCTOR_ACTIVATED" : "DOCTOR_DEACTIVATED",
        entityType: "DOCTOR",
        entityId: doctor.id,
        metadata: {
          name: doctor.name,
        },
      },
      transaction,
    );
  });

  revalidateDoctorViews(authContext.clinic.slug, doctorId);
  redirect(
    buildDoctorsPath({
      filter,
      status: nextIsActive ? "doctor-activated" : "doctor-deactivated",
    }),
  );
}

export async function toggleDoctorPublicVisibilityAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const nextIsPublic = parseBooleanValue(formData.get("nextIsPublic"));
  const filter = String(formData.get("returnFilter") ?? "").trim() || null;

  if (!doctorId) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildDoctorsPath({ filter, error: "doctor-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.doctor.update({
      where: {
        id: doctor.id,
      },
      data: {
        isPublic: nextIsPublic,
      },
    });

    await createAuditLog(
      {
        clinicId: authContext.clinic.id,
        userId: authContext.user.id,
        action: "DOCTOR_PUBLIC_VISIBILITY_UPDATED",
        entityType: "DOCTOR",
        entityId: doctor.id,
        metadata: {
          name: doctor.name,
          previousIsPublic: doctor.isPublic,
          nextIsPublic,
        },
      },
      transaction,
    );
  });

  revalidateDoctorViews(authContext.clinic.slug, doctorId);
  redirect(
    buildDoctorsPath({
      filter,
      status: nextIsPublic ? "doctor-public" : "doctor-hidden",
    }),
  );
}
