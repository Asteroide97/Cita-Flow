"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { requireAuthContext } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type DoctorsPathOptions = {
  editId?: string | null;
  status?: string;
  error?: string;
};

function buildDoctorsPath(options: DoctorsPathOptions = {}) {
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

  return `/app/doctors${query ? `?${query}` : ""}`;
}

function normalizeOptionalText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function parseBooleanValue(value: FormDataEntryValue | null) {
  return String(value ?? "") === "true";
}

function revalidateDoctorViews(doctorId?: string) {
  revalidatePath("/app/doctors");
  revalidatePath("/app/whatsapp-simulator");

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
      isActive: true,
    },
  });
}

export async function createDoctorAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const name = String(formData.get("name") ?? "").trim();
  const specialty = normalizeOptionalText(formData.get("specialty"));
  const bio = normalizeOptionalText(formData.get("bio"));
  const isActive = parseBooleanValue(formData.get("isActive"));

  if (!name) {
    redirect(buildDoctorsPath({ error: "doctor-name-required" }));
  }

  await prisma.$transaction(async (transaction) => {
    const doctor = await transaction.doctor.create({
      data: {
        clinicId: authContext.clinic.id,
        name,
        specialty,
        bio,
        isActive,
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
          isActive: doctor.isActive,
        },
      },
      transaction,
    );
  });

  revalidateDoctorViews();
  redirect(buildDoctorsPath({ status: "doctor-created" }));
}

export async function updateDoctorAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const specialty = normalizeOptionalText(formData.get("specialty"));
  const bio = normalizeOptionalText(formData.get("bio"));
  const isActive = parseBooleanValue(formData.get("isActive"));

  if (!doctorId) {
    redirect(buildDoctorsPath({ error: "doctor-not-found" }));
  }

  if (!name) {
    redirect(buildDoctorsPath({ editId: doctorId, error: "doctor-name-required" }));
  }

  const existingDoctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!existingDoctor) {
    redirect(buildDoctorsPath({ error: "doctor-not-found" }));
  }

  await prisma.$transaction(async (transaction) => {
    const updatedDoctor = await transaction.doctor.update({
      where: {
        id: existingDoctor.id,
      },
      data: {
        name,
        specialty,
        bio,
        isActive,
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
  });

  revalidateDoctorViews(doctorId);
  redirect(buildDoctorsPath({ status: "doctor-updated" }));
}

export async function toggleDoctorStatusAction(formData: FormData) {
  const authContext = await requireAuthContext();
  const doctorId = String(formData.get("doctorId") ?? "").trim();
  const nextIsActive = parseBooleanValue(formData.get("nextIsActive"));

  if (!doctorId) {
    redirect(buildDoctorsPath({ error: "doctor-not-found" }));
  }

  const doctor = await requireDoctorForClinic(doctorId, authContext.clinic.id);

  if (!doctor) {
    redirect(buildDoctorsPath({ error: "doctor-not-found" }));
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

  revalidateDoctorViews(doctorId);
  redirect(
    buildDoctorsPath({
      status: nextIsActive ? "doctor-activated" : "doctor-deactivated",
    }),
  );
}
