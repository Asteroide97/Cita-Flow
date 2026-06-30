import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "citaflow_session";
const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

const roleLabels: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  DOCTOR: "Doctor",
};

export type AuthContext = {
  session: {
    id: string;
    expiresAt: Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phoneE164: string | null;
  };
  clinic: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    currency: string;
    brandColor: string | null;
  };
  membership: {
    id: string;
    role: Role;
  };
};

type AuthResult =
  | {
      status: "authenticated";
      context: AuthContext;
    }
  | {
      status: "missing" | "expired" | "revoked" | "inactive" | "no-clinic";
    };

type SessionCookie = {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  expires: Date;
};

export function getRoleLabel(role: Role) {
  return roleLabels[role];
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildSessionRecord(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  return {
    token,
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  };
}

export function getSessionCookie(token: string, expiresAt: Date): SessionCookie {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function getExpiredSessionCookie(): SessionCookie {
  return getSessionCookie("", new Date(0));
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(getSessionCookie(token, expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(getExpiredSessionCookie());
}

export async function revokeSessionById(sessionId: string) {
  await prisma.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getCurrentAuthResult(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return { status: "missing" };
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(sessionToken),
    },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneE164: true,
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
              id: true,
              role: true,
              clinic: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  timezone: true,
                  currency: true,
                  brandColor: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return { status: "missing" };
  }

  if (session.revokedAt) {
    return { status: "revoked" };
  }

  if (session.expiresAt <= new Date()) {
    await revokeSessionById(session.id);

    return { status: "expired" };
  }

  if (!session.user.isActive) {
    return { status: "inactive" };
  }

  const membership = session.user.clinicMemberships[0];

  if (!membership) {
    return { status: "no-clinic" };
  }

  return {
    status: "authenticated",
    context: {
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phoneE164: session.user.phoneE164,
      },
      clinic: {
        id: membership.clinic.id,
        name: membership.clinic.name,
        slug: membership.clinic.slug,
        timezone: membership.clinic.timezone,
        currency: membership.clinic.currency,
        brandColor: membership.clinic.brandColor,
      },
      membership: {
        id: membership.id,
        role: membership.role,
      },
    },
  };
}

export async function getCurrentAuthContext() {
  const authResult = await getCurrentAuthResult();

  return authResult.status === "authenticated" ? authResult.context : null;
}

export async function requireAuthContext() {
  const authResult = await getCurrentAuthResult();

  if (authResult.status === "authenticated") {
    return authResult.context;
  }

  if (authResult.status === "expired") {
    redirect("/login?reason=session-expired");
  }

  redirect("/login");
}
