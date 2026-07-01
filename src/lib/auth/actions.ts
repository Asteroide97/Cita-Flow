"use server";

import { Prisma, Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/security/password";

import type { LoginActionState, RegisterActionState } from "./form-state";
import {
  clearLoginRateLimit,
  getLoginRateLimitStatus,
  registerFailedLoginAttempt,
} from "./rate-limit";
import { buildSessionRecord, setSessionCookie } from "./session";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function getClientIp(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

function getRateLimitMessage(retryAfterSeconds: number) {
  const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return `Demasiados intentos. Intenta de nuevo en ${retryAfterMinutes} min.`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidClinicSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function isValidPhoneE164(phone: string) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const requestHeaders = await headers();
  const ipAddress = getClientIp(requestHeaders);
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fieldErrors: LoginActionState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "El email es obligatorio.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "Ingresa un email valido.";
  }

  if (!password) {
    fieldErrors.password = "La contrasena es obligatoria.";
  }

  if (fieldErrors.email || fieldErrors.password) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors,
      values: {
        email,
      },
    };
  }

  const rateLimit = getLoginRateLimitStatus(ipAddress);

  if (!rateLimit.allowed) {
    await createAuditLog({
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      metadata: {
        email,
        ipAddress,
        reason: "RATE_LIMITED",
      },
    });

    return {
      message: getRateLimitMessage(rateLimit.retryAfterSeconds),
      values: {
        email,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
      clinicMemberships: {
        where: {
          isActive: true,
          clinic: {
            isActive: true,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          clinicId: true,
        },
      },
    },
  });

  let hasValidPassword = false;

  if (user?.isActive && user.passwordHash) {
    hasValidPassword = await verifyPassword(password, user.passwordHash);
  }

  if (!user || !hasValidPassword) {
    const failedAttempt = registerFailedLoginAttempt(ipAddress);

    await createAuditLog({
      clinicId: user?.clinicMemberships[0]?.clinicId ?? null,
      userId: user?.id ?? null,
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      entityId: user?.id ?? null,
      metadata: {
        email,
        ipAddress,
        reason: "INVALID_CREDENTIALS",
      },
    });

    return {
      message: failedAttempt.allowed
        ? "Credenciales incorrectas."
        : getRateLimitMessage(failedAttempt.retryAfterSeconds),
      values: {
        email,
      },
    };
  }

  if (!user.clinicMemberships.length) {
    await createAuditLog({
      userId: user.id,
      action: "LOGIN_FAILED",
      entityType: "AUTH",
      entityId: user.id,
      metadata: {
        email,
        ipAddress,
        reason: "NO_ACTIVE_CLINIC",
      },
    });

    return {
      message: "Tu usuario no tiene una clinica activa asignada.",
      values: {
        email,
      },
    };
  }

  const sessionRecord = buildSessionRecord(user.id);
  const session = await prisma.session.create({
    data: sessionRecord.data,
  });

  await createAuditLog({
    clinicId: user.clinicMemberships[0].clinicId,
    userId: user.id,
    action: "LOGIN_SUCCESS",
    entityType: "SESSION",
    entityId: session.id,
    metadata: {
      email,
      ipAddress,
    },
  });

  clearLoginRateLimit(ipAddress);
  await setSessionCookie(sessionRecord.token, sessionRecord.data.expiresAt);

  redirect("/app/dashboard");
}

export async function registerAction(
  _previousState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const requestHeaders = await headers();
  const ipAddress = getClientIp(requestHeaders);
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const clinicSlug = normalizeSlug(String(formData.get("clinicSlug") ?? ""));
  const phoneE164 = String(formData.get("phoneE164") ?? "").trim();
  const fieldErrors: RegisterActionState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "El nombre es obligatorio.";
  }

  if (!email) {
    fieldErrors.email = "El email es obligatorio.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "Ingresa un email valido.";
  }

  if (!password) {
    fieldErrors.password = "La contrasena es obligatoria.";
  } else if (password.length < 8) {
    fieldErrors.password = "La contrasena debe tener al menos 8 caracteres.";
  }

  if (!clinicName) {
    fieldErrors.clinicName = "El nombre del negocio es obligatorio.";
  }

  if (!clinicSlug) {
    fieldErrors.clinicSlug = "El slug del negocio es obligatorio.";
  } else if (!isValidClinicSlug(clinicSlug)) {
    fieldErrors.clinicSlug =
      "Usa solo minusculas, numeros y guiones para el slug.";
  }

  if (phoneE164 && !isValidPhoneE164(phoneE164)) {
    fieldErrors.phoneE164 = "Usa formato internacional, por ejemplo +525511223344.";
  }

  if (
    fieldErrors.name ||
    fieldErrors.email ||
    fieldErrors.password ||
    fieldErrors.clinicName ||
    fieldErrors.clinicSlug ||
    fieldErrors.phoneE164
  ) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors,
      values: {
        name,
        email,
        clinicName,
        clinicSlug,
        phoneE164,
      },
    };
  }

  const [existingUser, existingClinic] = await Promise.all([
    prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    }),
    prisma.clinic.findUnique({
      where: {
        slug: clinicSlug,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (existingUser) {
    return {
      message: "Ese email ya esta registrado.",
      fieldErrors: {
        email: "Email ya registrado.",
      },
      values: {
        name,
        email,
        clinicName,
        clinicSlug,
        phoneE164,
      },
    };
  }

  if (existingClinic) {
    return {
      message: "Ese slug ya no esta disponible.",
      fieldErrors: {
        clinicSlug: "Slug no disponible.",
      },
      values: {
        name,
        email,
        clinicName,
        clinicSlug,
        phoneE164,
      },
    };
  }

  try {
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name,
          email,
          passwordHash,
          phoneE164: phoneE164 || null,
          isActive: true,
        },
      });

      const clinic = await transaction.clinic.create({
        data: {
          name: clinicName,
          slug: clinicSlug,
          timezone: "America/Mexico_City",
          currency: "MXN",
          brandColor: "#2563eb",
          isActive: true,
        },
      });

      const membership = await transaction.clinicMember.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          role: Role.OWNER,
          isActive: true,
        },
      });

      const finalSessionRecord = buildSessionRecord(user.id);
      const session = await transaction.session.create({
        data: finalSessionRecord.data,
      });

      await transaction.auditLog.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          action: "USER_REGISTERED",
          entityType: "USER",
          entityId: user.id,
          metadataJson: {
            clinicSlug,
            ipAddress,
            role: membership.role,
          },
        },
      });

      await transaction.auditLog.create({
        data: {
          clinicId: clinic.id,
          userId: user.id,
          action: "LOGIN_SUCCESS",
          entityType: "SESSION",
          entityId: session.id,
          metadataJson: {
            email,
            ipAddress,
            source: "REGISTER",
          },
        },
      });

      return {
        token: finalSessionRecord.token,
        expiresAt: finalSessionRecord.data.expiresAt,
      };
    });

    await setSessionCookie(result.token, result.expiresAt);

    redirect("/app/dashboard");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const targets = Array.isArray(error.meta?.target) ? error.meta.target : [];

      if (targets.includes("email")) {
        return {
          message: "Ese email ya esta registrado.",
          fieldErrors: {
            email: "Email ya registrado.",
          },
          values: {
            name,
            email,
            clinicName,
            clinicSlug,
            phoneE164,
          },
        };
      }

      if (targets.includes("slug")) {
        return {
          message: "Ese slug ya no esta disponible.",
          fieldErrors: {
            clinicSlug: "Slug no disponible.",
          },
          values: {
            name,
            email,
            clinicName,
            clinicSlug,
            phoneE164,
          },
        };
      }
    }

    console.error("No se pudo completar el registro inicial.", error);

    return {
      message: "No pudimos crear tu cuenta en este momento.",
      values: {
        name,
        email,
        clinicName,
        clinicSlug,
        phoneE164,
      },
    };
  }
}
