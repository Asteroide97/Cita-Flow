import { TokenType, type Prisma } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

type AppointmentTokenClient = Prisma.TransactionClient | typeof prisma;

const APPOINTMENT_TOKEN_MIN_DURATION_MS = 72 * 60 * 60 * 1000;
const APPOINTMENT_TOKEN_POST_APPOINTMENT_GRACE_MS = 12 * 60 * 60 * 1000;

const PUBLIC_APPOINTMENT_TOKEN_TYPES = [
  TokenType.CONFIRM,
  TokenType.CANCEL,
  TokenType.RESCHEDULE,
] as const;

type PublicAppointmentTokenType = (typeof PUBLIC_APPOINTMENT_TOKEN_TYPES)[number];

export type AppointmentSelfServiceLinks = {
  confirmUrl: string;
  cancelUrl: string;
  rescheduleUrl: string;
};

export type AppointmentTokenBundle = {
  confirm: {
    token: string;
    tokenId: string;
    expiresAt: Date;
    url: string;
  };
  cancel: {
    token: string;
    tokenId: string;
    expiresAt: Date;
    url: string;
  };
  reschedule: {
    token: string;
    tokenId: string;
    expiresAt: Date;
    url: string;
  };
};

export type PublicAppointmentTokenContext = Prisma.AppointmentTokenGetPayload<{
  select: {
    id: true;
    clinicId: true;
    appointmentId: true;
    type: true;
    expiresAt: true;
    consumedAt: true;
    appointment: {
      select: {
        id: true;
        clinicId: true;
        startAt: true;
        endAt: true;
        status: true;
        source: true;
        notes: true;
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
        patient: {
          select: {
            id: true;
            name: true;
            phoneE164: true;
            email: true;
          };
        };
        doctor: {
          select: {
            id: true;
            name: true;
            specialty: true;
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
      };
    };
  };
}>;

export type ValidateAppointmentTokenResult =
  | {
      ok: true;
      context: PublicAppointmentTokenContext;
    }
  | {
      ok: false;
      reason:
        | "TOKEN_NOT_FOUND"
        | "TOKEN_TYPE_MISMATCH"
        | "TOKEN_EXPIRED"
        | "TOKEN_CONSUMED"
        | "CLINIC_INACTIVE"
        | "APPOINTMENT_NOT_FOUND"
        | "APPOINTMENT_CLINIC_MISMATCH";
    };

declare global {
  var __citaflowDevAppointmentLinks:
    | Map<string, AppointmentSelfServiceLinks>
    | undefined;
}

function getDevelopmentLinksStore() {
  if (!globalThis.__citaflowDevAppointmentLinks) {
    globalThis.__citaflowDevAppointmentLinks = new Map();
  }

  return globalThis.__citaflowDevAppointmentLinks;
}

export function hashAppointmentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPublicAppointmentTokenPath(
  type: PublicAppointmentTokenType,
  token: string,
) {
  switch (type) {
    case TokenType.CONFIRM:
      return `/cita/confirmar/${token}`;
    case TokenType.CANCEL:
      return `/cita/cancelar/${token}`;
    case TokenType.RESCHEDULE:
      return `/cita/reagendar/${token}`;
  }
}

export function formatDateValueInTimeZone(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const getValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getValue("year")}-${getValue("month")}-${getValue("day")}`;
}

function buildAppointmentTokenExpiry(appointmentStartAt: Date) {
  return new Date(
    Math.max(
      Date.now() + APPOINTMENT_TOKEN_MIN_DURATION_MS,
      appointmentStartAt.getTime() + APPOINTMENT_TOKEN_POST_APPOINTMENT_GRACE_MS,
    ),
  );
}

function rememberDevelopmentAppointmentLinks(
  appointmentId: string,
  links: AppointmentSelfServiceLinks,
) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  getDevelopmentLinksStore().set(appointmentId, links);
}

export function getDevelopmentAppointmentLinks(appointmentId: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return getDevelopmentLinksStore().get(appointmentId) ?? null;
}

export async function createAppointmentTokens({
  clinicId,
  appointmentId,
  appointmentStartAt,
  db = prisma,
  invalidateExisting = true,
}: {
  clinicId: string;
  appointmentId: string;
  appointmentStartAt: Date;
  db?: AppointmentTokenClient;
  invalidateExisting?: boolean;
}): Promise<AppointmentTokenBundle> {
  if (invalidateExisting) {
    await db.appointmentToken.updateMany({
      where: {
        clinicId,
        appointmentId,
        type: {
          in: [...PUBLIC_APPOINTMENT_TOKEN_TYPES],
        },
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  const expiresAt = buildAppointmentTokenExpiry(appointmentStartAt);
  const records = await Promise.all(
    PUBLIC_APPOINTMENT_TOKEN_TYPES.map(async (type) => {
      const plainToken = randomBytes(32).toString("base64url");
      const record = await db.appointmentToken.create({
        data: {
          clinicId,
          appointmentId,
          type,
          tokenHash: hashAppointmentToken(plainToken),
          expiresAt,
        },
        select: {
          id: true,
          type: true,
          expiresAt: true,
        },
      });

      return {
        plainToken,
        record,
        url: buildPublicAppointmentTokenPath(type, plainToken),
      };
    }),
  );

  const confirmRecord = records.find((item) => item.record.type === TokenType.CONFIRM);
  const cancelRecord = records.find((item) => item.record.type === TokenType.CANCEL);
  const rescheduleRecord = records.find(
    (item) => item.record.type === TokenType.RESCHEDULE,
  );

  if (!confirmRecord || !cancelRecord || !rescheduleRecord) {
    throw new Error("No pude generar todos los tokens de autoservicio.");
  }

  const resolvedBundle: AppointmentTokenBundle = {
    confirm: {
      token: confirmRecord.plainToken,
      tokenId: confirmRecord.record.id,
      expiresAt: confirmRecord.record.expiresAt,
      url: confirmRecord.url,
    },
    cancel: {
      token: cancelRecord.plainToken,
      tokenId: cancelRecord.record.id,
      expiresAt: cancelRecord.record.expiresAt,
      url: cancelRecord.url,
    },
    reschedule: {
      token: rescheduleRecord.plainToken,
      tokenId: rescheduleRecord.record.id,
      expiresAt: rescheduleRecord.record.expiresAt,
      url: rescheduleRecord.url,
    },
  };

  rememberDevelopmentAppointmentLinks(appointmentId, {
    confirmUrl: resolvedBundle.confirm.url,
    cancelUrl: resolvedBundle.cancel.url,
    rescheduleUrl: resolvedBundle.reschedule.url,
  });

  return resolvedBundle;
}

export async function validateAppointmentToken({
  token,
  expectedType,
  db = prisma,
}: {
  token: string;
  expectedType?: PublicAppointmentTokenType;
  db?: AppointmentTokenClient;
}): Promise<ValidateAppointmentTokenResult> {
  const tokenRecord = await db.appointmentToken.findUnique({
    where: {
      tokenHash: hashAppointmentToken(token),
    },
    select: {
      id: true,
      clinicId: true,
      appointmentId: true,
      type: true,
      expiresAt: true,
      consumedAt: true,
      appointment: {
        select: {
          id: true,
          clinicId: true,
          startAt: true,
          endAt: true,
          status: true,
          source: true,
          notes: true,
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
          patient: {
            select: {
              id: true,
              name: true,
              phoneE164: true,
              email: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specialty: true,
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
        },
      },
    },
  });

  if (!tokenRecord) {
    return {
      ok: false,
      reason: "TOKEN_NOT_FOUND",
    };
  }

  if (expectedType && tokenRecord.type !== expectedType) {
    return {
      ok: false,
      reason: "TOKEN_TYPE_MISMATCH",
    };
  }

  if (tokenRecord.consumedAt) {
    return {
      ok: false,
      reason: "TOKEN_CONSUMED",
    };
  }

  if (tokenRecord.expiresAt <= new Date()) {
    return {
      ok: false,
      reason: "TOKEN_EXPIRED",
    };
  }

  if (!tokenRecord.appointment) {
    return {
      ok: false,
      reason: "APPOINTMENT_NOT_FOUND",
    };
  }

  if (tokenRecord.appointment.clinicId !== tokenRecord.clinicId) {
    return {
      ok: false,
      reason: "APPOINTMENT_CLINIC_MISMATCH",
    };
  }

  if (!tokenRecord.appointment.clinic.isActive) {
    return {
      ok: false,
      reason: "CLINIC_INACTIVE",
    };
  }

  return {
    ok: true,
    context: tokenRecord,
  };
}

export async function consumeAppointmentToken({
  tokenId,
  db = prisma,
}: {
  tokenId: string;
  db?: AppointmentTokenClient;
}) {
  const result = await db.appointmentToken.updateMany({
    where: {
      id: tokenId,
      consumedAt: null,
    },
    data: {
      consumedAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function getPublicAppointmentByToken({
  token,
  expectedType,
  db = prisma,
}: {
  token: string;
  expectedType?: PublicAppointmentTokenType;
  db?: AppointmentTokenClient;
}) {
  const validation = await validateAppointmentToken({
    token,
    expectedType,
    db,
  });

  return validation.ok ? validation.context : null;
}
